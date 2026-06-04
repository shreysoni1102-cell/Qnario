import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // listen on 0.0.0.0 so LAN / mobile can reach it
    port: 5173,
    allowedHosts: true,   // allow ngrok and external tunnels
    proxy: {
      // Forward all /api requests to the Node backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      // Forward Socket.io WebSocket connections
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  }
})

