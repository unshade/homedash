/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // Must come before react(): generates src/routeTree.gen.ts and code-splits each route.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // In development, the Go API runs separately (task serve).
    proxy: { '/api': process.env.HOMEDASH_API_URL ?? 'http://localhost:8080' },
  },
  build: {
    // Embedded into the Go binary by internal/webui (see ADR 15).
    outDir: '../internal/webui/dist',
    // The Taskfile empties it while keeping .gitkeep, so the Go package always compiles.
    emptyOutDir: false,
    sourcemap: false,
    // React, the router, TanStack Query, Radix and zod come to ~650 kB (~200 kB
    // gzipped, which is how internal/webui serves it). Warn only above that.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
