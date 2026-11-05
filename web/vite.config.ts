/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // Must come before react(): generates src/routeTree.gen.ts and code-splits each route.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    // Installable app (ADR 18): web app manifest, icons and a service worker
    // that caches the app itself, never the API. Off in `task dev`.
    VitePWA({
      registerType: 'prompt',
      // Registered from src/components/update-prompt.tsx, not an inline script (CSP).
      injectRegister: false,
      // Icons from pwa-assets.config.ts. Their <link> tags are written in index.html,
      // which keeps its per-theme theme-color and the favicon that follows dark mode.
      pwaAssets: {
        config: true,
        overrideManifestIcons: true,
        includeHtmlHeadLinks: false,
        injectThemeColor: false,
      },
      manifest: {
        id: '/',
        name: 'homedash',
        short_name: 'homedash',
        description: 'Everything at home: todos, groceries, purchases and the car.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f4f3f1',
        theme_color: '#f4f3f1',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Pages of the app open offline from the cache; the API and its docs
        // always go to the server.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/docs/, /^\/openapi/, /^\/schemas/],
        cleanupOutdatedCaches: true,
      },
    }),
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
