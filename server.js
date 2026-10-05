import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAiProxyMiddleware } from './server/aiProxy.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const rootDir = path.dirname(fileURLToPath(import.meta.url));

app.use(createAiProxyMiddleware());
app.use(express.static(path.join(rootDir, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(rootDir, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`AdmiMatrix server listening on port ${port}`);
});
