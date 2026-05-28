import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/admin': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        headers: {
          'x-admin-key': 'bbcd5e9811ea5cd6fffe05883795b7263a73081dd95b2e92',
        },
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  }
})
