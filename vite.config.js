import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:6969',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:6969',
        changeOrigin: true,
      },
      '/google-tiles': {
        target: 'https://maps.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google-tiles/, ''),
        secure: true,
      }
    }
  }
})
