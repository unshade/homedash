# 15. Serve a Vite single-page app from the Go binary

Date: 2026-11-01

## Status

Accepted. Supersedes [ADR 4](0004-build-frontend-with-nextjs.md).

## Context

[ADR 4](0004-build-frontend-with-nextjs.md) chose Next.js but left open how the frontend ships. homedash is self-hosted by people who are not necessarily technical, so running it should mean running one program. The frontend should also be as secure as we can reasonably make it.

The options were:

- **A Next.js server next to the Go API:** two processes to deploy, patch and secure, Node.js in production, and two origins to configure.
- **Next.js exported as static files** (`output: 'export'`): one binary, but Next.js writes inline scripts into every page. A strict Content-Security-Policy would then need per-file script hashes computed by the server, and server-side Next.js features are lost anyway.
- **A React app built with Vite:** it compiles to plain static files with no inline scripts.

## Decision

- **Build:** the frontend in `web/` is a React single-page app built with Vite and TypeScript.
- **Libraries:**
  - [TanStack Router](https://tanstack.com/router) for file-based routes in `src/routes/`, code-split per route;
  - [TanStack Query](https://tanstack.com/query) for server data;
  - react-hook-form + zod for forms;
  - the UI kit from [ADR 16](0016-build-the-ui-with-shadcn-and-a-ledger-style.md).
- **API client:** typed and generated from the Go OpenAPI document. `homedash openapi` prints the document, `openapi-typescript` turns it into `web/src/api/schema.gen.ts`, and `openapi-fetch` / `openapi-react-query` use it. The generated file is committed, and CI fails when it is out of date (`task web:api:check`).
- **Serving:**
  - `vite build` writes into `internal/webui/dist`, which is embedded in the binary with `go:embed`.
  - `internal/webui` serves it: existing files as they are, `index.html` for every other path (client-side routes), a 404 for unknown `/api` paths and missing files.
  - Hashed assets are cached for a year and everything else revalidates (`no-cache`). Text files are gzipped once and kept in memory.
  - `internal/server` mounts the API (`/api`, `/docs`, `/openapi.json`) and the frontend (`/`) on one mux.
- **Security:**
  - The frontend is served with a strict Content-Security-Policy: `script-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, no inline scripts. Inline styles are allowed because UI libraries set them at runtime.
  - Every response gets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` and `Permissions-Policy`.
  - Frontend and API share one origin, so there is no CORS configuration.
- **Dark mode:** follows the system theme with a CSS media query, because switching themes with a script would need an inline script.
- **Development:** `task dev` runs Vite on `:5173`, forwarding `/api` to the Go server, which air restarts on every Go change.

## Consequences

- Self-hosters run one static binary. The frontend can't drift from the API it was built with.
- Go code compiles without a frontend build: `internal/webui/dist/.gitkeep` is committed, and the server explains how to build the frontend when it is missing. `task build` always builds the frontend first.
- There is no server-side rendering. homedash is a private tool, not a public site, so search engines and first-paint speed for strangers don't matter.
- Building needs Node.js as well as Go, locally and in CI.
- Any future inline script, inline event handler or third-party script will be blocked by the CSP. That is the point; a real need for one requires a new ADR.
