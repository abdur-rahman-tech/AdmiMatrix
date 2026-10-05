const GROQ_MODELS = new Set([
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b'
]);
const MAX_BODY_BYTES = 1024 * 1024;
const TEST_MESSAGE = 'Say "Groq online" in 2 words.';

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
    error.status = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw error;
  }

  return response.json();
}

export function createAiProxyMiddleware() {
  return async (req, res, next) => {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;

    if (req.method === 'GET' && pathname === '/api/ai/config') {
      if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Cross-origin requests are not allowed.' });
      return sendJson(res, 200, { groqConfigured: Boolean(process.env.GROQ_API_KEY?.trim()) });
    }

    if (req.method !== 'POST' || pathname !== '/api/ai/groq') return next();
    if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Cross-origin requests are not allowed.' });

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      return sendJson(res, 503, {
        code: 'MISSING_GROQ_KEY',
        error: 'GROQ_API_KEY is not configured on the server. Add it to .env and restart the server.'
      });
    }

    try {
      const body = await readJsonBody(req);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return sendJson(res, 400, { error: 'Request body must be a JSON object.' });
      }
      if (!GROQ_MODELS.has(body.model)) {
        return sendJson(res, 400, { error: 'Choose one of the supported Groq models.' });
      }

      const startedAt = Date.now();
      if (body.action === 'test') {
        const result = await callGroq(apiKey, {
          model: body.model,
          messages: [{ role: 'user', content: TEST_MESSAGE }],
          max_tokens: 10,
          temperature: 0.1
        });
        const reply = result?.choices?.[0]?.message?.content?.trim() || 'Groq online';
        const latencyMs = Date.now() - startedAt;
        return sendJson(res, 200, {
          success: true,
          model: body.model,
          message: `Connected to Groq (${body.model}): "${reply}" (${latencyMs}ms)`,
          latencyMs
        });
      }

      const payload = body.payload;
      if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
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

      const result = await callGroq(apiKey, { ...payload, model: body.model });
      return sendJson(res, 200, result);
    } catch (error) {
      console.error('Groq proxy request failed:', error.message);
      return sendJson(res, error.status || 502, { error: error.message || 'Groq proxy request failed.' });
    }
  };
}
