import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const target = process.env.API_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': target,
      '/uploads': target,
      '/socket.io': { target, ws: true },
    },
  },
  build: { chunkSizeWarningLimit: 900 },
})
