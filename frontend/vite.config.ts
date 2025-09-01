import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // String shorthand: http://localhost:5173/api -> http://localhost:3001/api
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    }
  }
})