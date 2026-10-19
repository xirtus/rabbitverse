import { defineConfig } from 'vite';
export default defineConfig({
  server: { port: 5210, host: true, strictPort: false },
  preview: { port: 5210 },
});
