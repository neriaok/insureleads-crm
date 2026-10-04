import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // In development the API runs separately; proxying keeps cookies same-origin.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
