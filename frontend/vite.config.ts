import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    port: 5173,
    https: true, // enables HTTPS so mobile browsers allow camera access
    proxy: {
      '/ws': {
        target: 'ws://localhost:8000', // backend is plain WS; Vite upgrades to WSS for the client
        ws: true,
        rewrite: (path) => path,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
