import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import { createAiProxyMiddleware } from './server/aiProxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const aiProxyPlugin: Plugin = {
  name: 'admimatrix-ai-proxy',
  configureServer(server) {
    server.middlewares.use(createAiProxyMiddleware());
  },
  configurePreviewServer(server) {
    server.middlewares.use(createAiProxyMiddleware());
  }
};

export default defineConfig(() => {
  return {
    plugins: [aiProxyPlugin, react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
