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
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts')) return 'vendor-charts'
          if (id.includes('@react-google-maps') || id.includes('leaflet') || id.includes('maplibre-gl')) return 'vendor-maps'
          if (id.includes('mqtt')) return 'vendor-mqtt'
          if (id.includes('xlsx')) return 'vendor-xlsx'
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react'
          return 'vendor'
        }
      }
    }
  },
  server: {
    host: true,
    allowedHosts: ['fms.devraffi.my.id'],
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
