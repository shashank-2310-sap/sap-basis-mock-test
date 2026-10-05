import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'

// Pure client-side SPA; no backend. All persistence is browser IndexedDB.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the bundle so no single chunk is huge and caching is granular:
        // each question bank is its own chunk (editing one bank never busts the
        // other or the shared vendor code), and all third-party libs live in one
        // vendor chunk separate from app code (a question edit never re-downloads
        // React/Radix). A single vendor chunk avoids cross-vendor circular chunks.
        manualChunks(id) {
          if (id.includes('/src/data/questions-unit-end.json')) return 'bank-unit-end'
          if (id.includes('/src/data/questions.json')) return 'bank-basis-imp'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
