import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GROQ_MODEL_ID = 'qwen/qwen3.8-27b';
const GROQ_MODELS = new Set([GROQ_MODEL_ID]);
const MAX_BODY_BYTES = 1024 * 1024;
const TEST_MESSAGE = 'Say "Groq online" in 2 words.';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, '..', '.env');

function getConfiguredGroqApiKey() {
  return (process.env.GROQ_API_KEY || process.env['GROQ-API-KEY'] || '').trim();
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function isSameOrigin(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host.toLowerCase() === String(req.headers.host || '').toLowerCase();
  } catch {
    return false;
  }
}

async function readJsonBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        const error = new Error('Request body must be valid JSON.');
        error.status = 400;
        throw error;
      }
    }
    return req.body;
  }

  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) {
      const error = new Error('Request body exceeds the 1 MB limit.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.status = 400;
    throw error;
  }
}

async function callGroq(apiKey, payload) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error?.message || `Groq returned HTTP ${response.status}.`;
    const error = new Error(message);
    error.status = response.status >= 400 && response.status < 500 ? response.status : 502;
    throw error;
  }

  return response.json();
}

function persistKeyToEnv(apiKey) {
  try {
    let content = '';
    if (fs.existsSync(ENV_PATH)) {
      content = fs.readFileSync(ENV_PATH, 'utf8');
    }
    // Remove any existing GEMINI_API_KEY
    content = content.replace(/^GEMINI_API_KEY=.*$/gm, '');
    if (/^GROQ_API_KEY=/m.test(content)) {
      content = content.replace(/^GROQ_API_KEY=.*$/m, `GROQ_API_KEY=${apiKey}`);
    } else {
      content = `${content.trim()}\nGROQ_API_KEY=${apiKey}\n`;
    }
    content = content.replace(/\n{3,}/g, '\n\n').trim() + '\n';
    fs.writeFileSync(ENV_PATH, content, 'utf8');
  } catch (err) {
    console.warn('Could not persist GROQ_API_KEY to .env:', err.message);
  }
}

export function createAiProxyMiddleware() {
  return async (req, res, next) => {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;

    if (req.method === 'GET' && pathname === '/api/ai/config') {
      if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Cross-origin requests are not allowed.' });
      return sendJson(res, 200, {
        groqConfigured: Boolean(getConfiguredGroqApiKey()),
        defaultModel: GROQ_MODEL_ID,
        supportedModels: Array.from(GROQ_MODELS)
      });
    }

    if (req.method === 'POST' && pathname === '/api/ai/save-key') {
      if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Cross-origin requests are not allowed.' });
      try {
        const body = await readJsonBody(req);
        const apiKey = String(body.apiKey || '').trim();
        if (!apiKey) {
          return sendJson(res, 400, { error: 'Groq API Key is required.' });
        }
        if (!apiKey.startsWith('gsk_')) {
          return sendJson(res, 400, { error: 'Invalid Groq API key format. It should start with "gsk_".' });
        }

        // Verify with live Groq ping
        const startedAt = Date.now();
        await callGroq(apiKey, {
          model: GROQ_MODEL_ID,
          messages: [{ role: 'user', content: 'Say online' }],
          max_tokens: 50
        });
        const latencyMs = Date.now() - startedAt;

        // Persist
        process.env.GROQ_API_KEY = apiKey;
        persistKeyToEnv(apiKey);

        return sendJson(res, 200, {
          success: true,
          message: `Groq API Key verified and saved successfully (${latencyMs}ms).`,
          latencyMs
        });
      } catch (err) {
        return sendJson(res, 400, { error: `Verification failed: ${err.message}` });
      }
    }

    if (req.method === 'POST' && pathname === '/api/ai/groq') {
      if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Cross-origin requests are not allowed.' });
    } else if (pathname.startsWith('/api/ai/')) {
      return sendJson(res, 404, { error: 'AI API endpoint not found.' });
    } else {
      return next();
    }

    try {
      const body = await readJsonBody(req);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return sendJson(res, 400, { error: 'Request body must be a JSON object.' });
      }

      // Check key from body, headers, or environment
      const clientHeaderKey = typeof req.headers['x-groq-api-key'] === 'string' ? req.headers['x-groq-api-key'].trim() : '';
      const clientBodyKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
      const apiKey = clientBodyKey || clientHeaderKey || getConfiguredGroqApiKey();

      if (!apiKey) {
        return sendJson(res, 503, {
          code: 'MISSING_GROQ_KEY',
          error: 'GROQ_API_KEY is not configured. Please enter your Groq API key in the AI Settings or configure it in .env.'
        });
      }

      const model = body.model || GROQ_MODEL_ID;
      if (!GROQ_MODELS.has(model)) {
        return sendJson(res, 400, { error: `Model "${model}" is not in supported Groq models: ${Array.from(GROQ_MODELS).join(', ')}` });
      }

      const startedAt = Date.now();
      if (body.action === 'test') {
        const result = await callGroq(apiKey, {
          model,
          messages: [{ role: 'user', content: TEST_MESSAGE }],
          max_tokens: 150,
          temperature: 0.1
        });
        const reply = result?.choices?.[0]?.message?.content?.trim() || 'Groq online';
        const latencyMs = Date.now() - startedAt;
        return sendJson(res, 200, {
          success: true,
          model,
          message: `Connected to Groq (${model}): "${reply}" (${latencyMs}ms)`,
          latencyMs
        });
      }

      const payload = body.payload || body;
      if (!payload || typeof payload !== 'object' ||
          !Array.isArray(payload.messages) || payload.messages.length === 0 ||
          payload.messages.length > 20) {
        return sendJson(res, 400, { error: 'A valid Groq messages payload is required.' });
      }

      if (payload.messages.some(message =>
        !message || !['system', 'user', 'assistant'].includes(message.role) ||
        typeof message.content !== 'string' || message.content.length > 100_000
      )) {
        return sendJson(res, 400, { error: 'Messages must contain a supported role and text content.' });
      }

      const groqPayload = {
        model,
        messages: payload.messages,
        temperature: payload.temperature ?? 0.1,
        ...(payload.response_format ? { response_format: payload.response_format } : {}),
        ...(payload.max_tokens ? { max_tokens: payload.max_tokens } : { max_tokens: 4096 })
      };

      const result = await callGroq(apiKey, groqPayload);
      return sendJson(res, 200, result);
    } catch (error) {
      console.error('Groq proxy request failed:', error.message);
      return sendJson(res, error.status || 502, { error: error.message || 'Groq proxy request failed.' });
    }
  };
}
