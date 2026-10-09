import { createHmac, timingSafeEqual } from 'node:crypto';

const GEMINI_MODEL_ID = 'gemini-2.5-flash';
const MAX_BODY_BYTES = 1024 * 1024;
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
const adminLoginAttempts = new Map();

function getAdminConfiguration() {
  return {
    email: (process.env.ADMIN_EMAIL || 'abdurrahman17180@gmail.com').trim().toLowerCase(),
    pin: (process.env.ADMIN_PIN || '').trim(),
    sessionSecret: (process.env.ADMIN_SESSION_SECRET || '').trim()
  };
}

function signAdminSession(email, secret) {
  const payload = Buffer.from(JSON.stringify({
    email,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000
  })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function getAdminSession(req) {
  const { email, sessionSecret } = getAdminConfiguration();
  if (!sessionSecret) return null;

  const token = String(req.headers.cookie || '')
    .split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith('admimatrix_admin='))
    ?.slice('admimatrix_admin='.length);
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = createHmac('sha256', sessionSecret).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.email === email && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
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

function isSupportedMessageContent(content) {
  if (typeof content === 'string') return content.length <= 100_000;
  if (!Array.isArray(content) || content.length > 5) return false;

  return content.every(part => {
    if (!part || typeof part !== 'object') return false;
    if (part.type === 'text') {
      return typeof part.text === 'string' && part.text.length <= 100_000;
    }
    if (part.type === 'image_url') {
      const url = part.image_url?.url;
      return typeof url === 'string' &&
        url.length <= MAX_BODY_BYTES &&
        /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(url);
    }
    return false;
  });
}

async function callGemini(apiKey, payload) {
  const contents = [];
  let systemInstruction;

  for (const message of payload.messages) {
    if (message.role === 'system') {
      systemInstruction = { parts: [{ text: message.content }] };
      continue;
    }

    const parts = typeof message.content === 'string'
      ? [{ text: message.content }]
      : message.content.map(part => {
          if (part.type === 'text') return { text: part.text };
          const [, mimeType, data] = part.image_url.url.match(
            /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/
          );
          return { inlineData: { mimeType, data } };
        });

    contents.push({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts
    });
  }

  const generationConfig = {
    temperature: payload.temperature ?? 0.1,
    maxOutputTokens: payload.max_tokens ?? 4096,
    ...(payload.response_format ? { responseMimeType: 'application/json' } : {})
  };
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        ...(systemInstruction ? { systemInstruction } : {}),
        contents,
        generationConfig
      }),
      signal: AbortSignal.timeout(60_000)
    }
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error?.message || `Gemini returned HTTP ${response.status}.`);
    error.status = response.status >= 400 && response.status < 500 ? response.status : 502;
    throw error;
  }

  const text = result.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim();
  if (!text) {
    const error = new Error('Gemini returned an empty completion response.');
    error.status = 502;
    throw error;
  }

  return { choices: [{ message: { content: text } }] };
}

function buildAdminUser(email) {
  return {
    id: 'configured-admin',
    email,
    name: process.env.ADMIN_NAME || 'Administrator',
    role: 'OWNER',
    pin: '',
    isOwner: true,
    isApproved: true,
    createdAt: new Date(0).toISOString()
  };
}

export function createAiProxyMiddleware() {
  return async (req, res, next) => {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;

    if (pathname.startsWith('/api/admin/')) {
      if (req.method === 'POST' && pathname === '/api/admin/login') {
        if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Cross-origin requests are not allowed.' });
        try {
          const { email, pin, sessionSecret } = getAdminConfiguration();
          if (pin.length < 12 || sessionSecret.length < 32) {
            return sendJson(res, 503, {
              error: 'Admin sign-in requires an ADMIN_PIN of at least 12 characters and an ADMIN_SESSION_SECRET of at least 32 characters.'
            });
          }
          const attemptKey = req.socket.remoteAddress || 'unknown';
          const now = Date.now();
          const attempts = adminLoginAttempts.get(attemptKey);
          if (attempts && now - attempts.startedAt < ADMIN_LOGIN_WINDOW_MS &&
              attempts.count >= ADMIN_LOGIN_MAX_ATTEMPTS) {
            return sendJson(res, 429, { error: 'Too many sign-in attempts. Try again in 15 minutes.' });
          }
          if (!attempts || now - attempts.startedAt >= ADMIN_LOGIN_WINDOW_MS) {
            adminLoginAttempts.set(attemptKey, { startedAt: now, count: 0 });
          }

          const body = await readJsonBody(req);
          const providedEmail = String(body.email || '').trim().toLowerCase();
          const providedPin = String(body.pin || '').trim();
          const expectedPin = Buffer.from(pin);
          const actualPin = Buffer.from(providedPin);
          const pinMatches = actualPin.length === expectedPin.length &&
            timingSafeEqual(actualPin, expectedPin);
          if (providedEmail !== email || !pinMatches) {
            adminLoginAttempts.get(attemptKey).count += 1;
            return sendJson(res, 401, { error: 'Invalid administrator email or PIN.' });
          }

          adminLoginAttempts.delete(attemptKey);
          const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
          res.setHeader(
            'Set-Cookie',
            `admimatrix_admin=${signAdminSession(email, sessionSecret)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`
          );
          return sendJson(res, 200, { user: buildAdminUser(email) });
        } catch (error) {
          return sendJson(res, error.status || 400, { error: error.message || 'Admin sign-in failed.' });
        }
      }

      if (req.method === 'GET' && pathname === '/api/admin/session') {
        const session = getAdminSession(req);
        return sendJson(res, 200, {
          user: session ? buildAdminUser(getAdminConfiguration().email) : null
        });
      }

      if (req.method === 'POST' && pathname === '/api/admin/logout') {
        if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Cross-origin requests are not allowed.' });
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        res.setHeader('Set-Cookie', `admimatrix_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`);
        return sendJson(res, 200, { success: true });
      }

      return sendJson(res, 404, { error: 'Admin API endpoint not found.' });
    }

    if (!pathname.startsWith('/api/ai/')) return next();

    if (req.method === 'GET' && pathname === '/api/ai/config') {
      return sendJson(res, 200, {
        geminiConfigured: Boolean((process.env.GEMINI_API_KEY || '').trim()),
        defaultModel: GEMINI_MODEL_ID,
        supportedModels: [GEMINI_MODEL_ID]
      });
    }

    if (req.method !== 'POST' || pathname !== '/api/ai/gemini') {
      return sendJson(res, 404, { error: 'AI API endpoint not found.' });
    }
    if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Cross-origin requests are not allowed.' });

    try {
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();
      if (!apiKey) {
        return sendJson(res, 503, {
          code: 'MISSING_GEMINI_KEY',
          error: 'GEMINI_API_KEY is not configured. Add it to the server environment or GitHub Actions secret.'
        });
      }

      const body = await readJsonBody(req);
      if (!body || typeof body !== 'object' || Array.isArray(body) ||
          !Array.isArray(body.messages) || body.messages.length === 0 ||
          body.messages.length > 20) {
        return sendJson(res, 400, { error: 'A valid Gemini messages payload is required.' });
      }
      if (body.model && body.model !== GEMINI_MODEL_ID) {
        return sendJson(res, 400, { error: `Unsupported Gemini model: ${body.model}` });
      }
      if (body.messages.some(message =>
        !message || !['system', 'user', 'assistant'].includes(message.role) ||
        !isSupportedMessageContent(message.content)
      )) {
        return sendJson(res, 400, { error: 'Messages must contain a supported role and text or image content.' });
      }

      return sendJson(res, 200, await callGemini(apiKey, body));
    } catch (error) {
      console.error('Gemini proxy request failed:', error.message);
      return sendJson(res, error.status || 502, { error: error.message || 'Gemini proxy request failed.' });
    }
  };
}
