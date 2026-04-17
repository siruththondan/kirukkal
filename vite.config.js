import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change 'tamil-scribble' to your GitHub repo name
export default defineConfig({
  plugins: [react()],
  base: '/kirukkal/',
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['peerjs'],
  },
})
