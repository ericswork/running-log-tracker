import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the Express server during dev, so the client can use
    // relative /api paths and avoid CORS.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
