import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Use 0.0.0.0 for Docker, 127.0.0.1 for local development
    host: process.env.DOCKER_ENV ? '0.0.0.0' : '127.0.0.1',
    port: 5173,
    watch: {
      usePolling: !!process.env.DOCKER_ENV, // Enable polling only for Docker
    },
    hmr: {
      port: 5173,
    },
  },
})
