# 19. Keep a read-only copy of the data for offline use

Date: 2026-11-05

## Status

Accepted. Amends [ADR 18](0018-make-homedash-an-installable-pwa.md)

## Context

ADR 18 made homedash installable, but kept no data on the device: offline, the app opened and showed nothing. The author wants a cache, with a read-only mode when there is no connection.

For a self-hosted app, "offline" is mostly not a phone without internet but a phone that can't reach the server at home (away from the home network, the server or its proxy down). The browser's `navigator.onLine` says nothing about that.

Letting people make changes offline would need a queue of changes, replays, and conflict handling when two devices changed the same thing. A read-only mode avoids all of it.

## Decision

- **The cache is TanStack Query's own**, saved to IndexedDB with `@tanstack/query-persist-client-core`, `@tanstack/query-async-storage-persister` and `idb-keyval` (`web/src/lib/persist.ts`). Every successful query is saved, without per-feature code. The service worker still never caches the API (ADR 18): there is one cache, the one the app already reads from.
- Saved data is kept 7 days (`maxAge`, and the same `gcTime` in memory). It is thrown away when the API schema changes: the `buster` is a hash of `schema.gen.ts`, computed at build time.
- On startup the app waits for the saved copy (at most one second) before rendering, so pages show it at once.
- **"Online" means "the server answers"** (`web/src/lib/connection.ts`). The API client marks the server unreachable when a request gets no answer or a proxy's 502/503/504, and a check of `/api/v1/health` (at startup, then every 10 seconds while unreachable) marks it back. The result drives TanStack Query's `onlineManager`, so offline queries keep their data and pause, then refetch once the server is back.
- **Offline is read-only.** A notice says so and when the data on screen was saved; every control that changes data is disabled. Mutations use `networkMode: 'always'`, so a change attempted while the connection drops fails at once with a message instead of being queued, and mutations are never saved.

## Consequences

- The installed app opens with the last data it saw, with or without a connection.
- The data is stored unencrypted in the browser's IndexedDB on each device that opened homedash. That is acceptable for a home dashboard on the family's own devices. When authentication comes, signing out must clear it.
- Each feature must disable its write controls with `useOnline()`. Forgetting it is not dangerous (the change fails with a message), but it is confusing.
- A copy up to 7 days old can be shown; the notice gives its date, so nobody mistakes it for live data.
- Offline changes, if ever wanted, need a new decision (queue, replay, conflicts).
