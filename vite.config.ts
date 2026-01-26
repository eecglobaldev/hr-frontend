import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001, // Changed from 5173 (Vite default) to 3000
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // ⚠️ Backend needs to run on 3001 to avoid port conflict
        changeOrigin: true,
      },
    },
  },
});

