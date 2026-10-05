const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview'
];
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768'
];

const MAX_BODY_BYTES = 12 * 1024 * 1024;

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  let bytes = 0;

  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) {
      const error = new Error('Request body exceeds the 12 MB limit.');
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

async function callGemini(apiKey, model, payload) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Gemini returned HTTP ${response.status}.`);
  }

  return response.json();
}

async function callGroq(apiKey, payload) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Groq returned HTTP ${response.status}.`);
  }

  return response.json();
}

export function createAiProxyMiddleware() {
  return async (req, res, next) => {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;

    if (req.method === 'GET' && pathname === '/api/ai/config') {
      return sendJson(res, 200, {
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
        groqConfigured: Boolean(process.env.GROQ_API_KEY?.trim())
      });
    }

    if (req.method !== 'POST' || !['/api/ai/gemini', '/api/ai/groq'].includes(pathname)) {
      return next();
    }

    if (pathname === '/api/ai/groq') {
      const apiKey = process.env.GROQ_API_KEY?.trim();
      if (!apiKey) {
        return sendJson(res, 503, {
          code: 'MISSING_GROQ_KEY',
          error: 'MISSING_GROQ_KEY: GROQ_API_KEY is not configured on the server. Add it to .env and restart the server.'
        });
      }

      try {
        const body = await readJsonBody(req);
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return sendJson(res, 400, { error: 'Request body must be a JSON object.' });
        }
        const requestedModel = GROQ_MODELS.includes(body.model) ? body.model : 'openai/gpt-oss-120b';
        const startTime = Date.now();

        if (body.action === 'test') {
          const result = await callGroq(apiKey, {
            model: requestedModel,
            messages: [{ role: 'user', content: 'Say "Groq online" in 2 words.' }],
            max_tokens: 10,
            temperature: 0.1
          });
          const reply = result?.choices?.[0]?.message?.content?.trim() || 'Groq online';
          return sendJson(res, 200, {
            success: true,
            model: requestedModel,
            message: `Connected to Groq LPU (${requestedModel}): "${reply}" (${Date.now() - startTime}ms)`,
            latencyMs: Date.now() - startTime
          });
        }

        const payload = body.payload && typeof body.payload === 'object'
          ? body.payload
          : body.messages && typeof body.messages === 'object'
            ? body
            : null;
        if (!payload) {
          return sendJson(res, 400, { error: 'A Groq request payload is required.' });
        }

        return sendJson(res, 200, await callGroq(apiKey, {
          ...payload,
          model: requestedModel
        }));
      } catch (error) {
        return sendJson(res, error.status || 502, { error: error.message || 'Groq proxy request failed.' });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return sendJson(res, 503, {
        code: 'MISSING_API_KEY',
        error: 'MISSING_API_KEY: GEMINI_API_KEY is not configured on the server. Add it to .env and restart the server.'
      });
    }

    try {
      const body = await readJsonBody(req);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return sendJson(res, 400, { error: 'Request body must be a JSON object.' });
      }
      const startTime = Date.now();
      const requestedModel = GEMINI_MODELS.includes(body.model) ? body.model : 'gemini-3.8-flash';

      if (body.action === 'test') {
        const testPayload = {
          contents: [{ role: 'user', parts: [{ text: 'Respond with the single word: READY' }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0.1 }
        };
        let lastError;

        for (const model of [...new Set([requestedModel, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'])]) {
          try {
            await callGemini(apiKey, model, testPayload);
            return sendJson(res, 200, {
              success: true,
              model,
              message: `Live API connection verified successfully with ${model}!`,
              latencyMs: Date.now() - startTime
            });
          } catch (error) {
            lastError = error;
          }
        }

        return sendJson(res, 502, {
          success: false,
          model: requestedModel,
          message: lastError?.message || 'Could not connect to Gemini API.',
          latencyMs: Date.now() - startTime
        });
      }

      if (!body.payload || typeof body.payload !== 'object') {
        return sendJson(res, 400, { error: 'A Gemini request payload is required.' });
      }

      const models = [...new Set([
        requestedModel,
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite'
      ])];
      let lastError;

      for (let index = 0; index < models.length; index += 1) {
        try {
          const data = await callGemini(apiKey, models[index], body.payload);
          return sendJson(res, 200, {
            data,
            modelUsed: models[index],
            didFallback: index > 0
          });
        } catch (error) {
          lastError = error;
        }
      }

      return sendJson(res, 502, {
        error: `All Gemini models in the fallback chain failed. ${lastError?.message || ''}`.trim()
      });
    } catch (error) {
      return sendJson(res, error.status || 500, { error: error.message || 'Gemini proxy request failed.' });
    }
  };
}
