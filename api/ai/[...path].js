import { createAiProxyMiddleware } from '../../server/aiProxy.js';

const aiProxyMiddleware = createAiProxyMiddleware();

export default function handler(req, res) {
  return aiProxyMiddleware(req, res, () => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'AI API endpoint not found.' }));
  });
}
