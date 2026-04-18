import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ─────────────────────────────────────────────────────────────
//  Vite config
//  base path logic:
//    - GitHub Codespace / local dev  → '/'  (no subfolder)
//    - GitHub Pages production       → '/YOUR-REPO-NAME/'
//
//  To set your repo name, set the env var VITE_BASE_PATH
//  OR just hardcode it below.
// ─────────────────────────────────────────────────────────────

const isCodespace = process.env.CODESPACE_NAME != null;
const basePath    = process.env.VITE_BASE_PATH ?? (isCodespace ? '/' : '/tamil-scribble/');

export default defineConfig({
  plugins: [react()],
  base: basePath,
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['peerjs'],
  },
  server: {
    // In Codespace, allow connections from the forwarded URL
    allowedHosts: 'all',
    cors: true,
  },
})
