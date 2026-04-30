import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
        }
      }
    }
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://backendfms.devraffi.my.id',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://backendfms.devraffi.my.id',
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