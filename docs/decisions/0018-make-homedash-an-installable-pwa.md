# 18. Make homedash an installable PWA

Date: 2026-11-05

## Status

Accepted, amended by [ADR 19](0019-keep-a-read-only-copy-of-the-data-offline.md) (data is now kept on the device for a read-only offline mode)

## Context

The author wants homedash to be installable as an app (a Progressive Web App), on phones especially, where it should open from the home screen like any other app.

A browser offers to install a site when it has a web app manifest with icons, and runs a service worker on a secure origin. The service worker also decides what keeps working offline. homedash's data lives in PostgreSQL behind the Go API, and nothing in it is useful when stale (a todo marked done on another phone, a warranty date), while the frontend is a static bundle (ADR 15).

## Decision

- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox, `generateSW`) builds the manifest and service worker into the frontend bundle, so they are embedded in the Go binary like the rest. It is a build-only dependency. The app's icons are generated at build time from `web/public/app-icon.svg` by `@vite-pwa/assets-generator` (`web/pwa-assets.config.ts`).
- The service worker **precaches the app itself** (HTML, scripts, styles, fonts, icons), so the installed app opens instantly and offline. It **never caches the API**: `/api`, `/docs`, `/openapi*` and `/schemas` always go to the server. Offline, the app says so and TanStack Query sends paused requests when the connection is back.
- Updates use the **prompt** strategy: a new version is downloaded in the background and a toast offers to reload, so a form being filled in is never reloaded away.
- The service worker is registered from the bundle (`src/components/update-prompt.tsx`), not by an injected inline script, to keep the CSP (`script-src 'self'`, plus `worker-src 'self'` and `manifest-src 'self'`).
- Go serves `sw.js` and the manifest with `Cache-Control: no-cache`, and the manifest as `application/manifest+json`.

## Consequences

- The app installs from Chrome, Edge and Android ("Install app"), and from Safari ("Add to Home Screen").
- Browsers only run service workers on HTTPS or `localhost`. A self-hosted homedash reached as `http://<LAN IP>:8080` works in the browser but cannot be installed: it has to be served over HTTPS (a reverse proxy such as Caddy, or Tailscale).
- After upgrading the server, open apps keep running the cached version until the user accepts the reload. An API change that breaks the old frontend would show errors until then, which is one more reason for versioned API packages (`/api/vN`).
- No data is kept on the device, so offline the app opens but shows no todos. Keeping data offline would need its own decision (sync, conflicts).
- `task dev` (Vite) has no service worker, so development is not affected by the cache.
