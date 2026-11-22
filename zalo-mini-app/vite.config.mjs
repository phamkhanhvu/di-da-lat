import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import zaloMiniApp from 'zmp-vite-plugin';

export default defineConfig({
  base: './',
  server: { fs: { allow: [fileURLToPath(new URL('../', import.meta.url))] } },
  plugins: [zaloMiniApp(), react()],
  build: { assetsInlineLimit: 0 }
});
