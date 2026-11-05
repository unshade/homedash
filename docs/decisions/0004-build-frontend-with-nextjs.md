# 4. Build the frontend with Next.js

Date: 2026-11-01

## Status

Superseded by [ADR 15](0015-serve-a-vite-spa-from-the-go-binary.md)

## Context

homedash needs a web interface. The author wants React, which has the largest set of libraries and is well understood by AI coding agents.

## Decision

The frontend is a Next.js (App Router, TypeScript, Tailwind CSS) application in `web/`. In development, the Next.js server forwards `/api/*` to the Go API (`HOMEDASH_API_URL`, default `http://localhost:8080`).

## Consequences

- Development needs Node.js in addition to Go.
- It is still undecided how the frontend is deployed: bundled into the Go binary as static files (`output: 'export'`, which rules out server-side Next.js features) or run as a separate Node server. That decision needs its own ADR.
- The installed Next.js version has breaking changes from older versions. See `web/AGENTS.md` before working on it.
