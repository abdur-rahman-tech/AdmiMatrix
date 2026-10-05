import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { createAiProxyMiddleware } from './server/aiProxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'adimatrix-ai-proxy',
        configureServer(server) {
          server.middlewares.use(createAiProxyMiddleware());
        },
        configurePreviewServer(server) {
          server.middlewares.use(createAiProxyMiddleware());
        }
      }
    ],
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
