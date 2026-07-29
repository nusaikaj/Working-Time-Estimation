import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Lets the frontend call relative '/api/...' paths in dev without CORS
      // juggling; production uses VITE_API_BASE_URL instead (see services/apiClient.js).
      '/api': {
        target: process.env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
      // Uploaded profile photos — same backend, same-origin from the browser's
      // point of view so <img src="/uploads/..."> just works in dev too.
      '/uploads': {
        target: process.env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
