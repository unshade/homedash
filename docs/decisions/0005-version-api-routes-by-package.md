# 5. Version API routes by package

Date: 2026-11-01

## Status

Accepted

## Context

The API will have outside clients (our frontend, scripts, home automation). Breaking changes may eventually be needed, so the old behavior must stay available while clients migrate.

## Decision

- Each API version is its own Go package, `internal/api/vN`, served under `/api/vN`.
- A version exposes `Register(api huma.API, deps Dependencies)`. Inside the package, routes use paths relative to the version prefix (e.g. `/todos`).
- `internal/api` creates the router and attaches each version with `huma.NewGroup(api, "/api/vN")`.
- Types shared across versions, such as `field.OmittableNullable`, live in packages under `internal/api/` outside any version.
- The first version is `v1`.

## Consequences

- A `v2` can be added next to `v1` without touching it. Both appear in the same OpenAPI document.
- Breaking changes are made in a new version package. Changes that don't break clients can go into the current one.
- Code shared between versions must stay outside the `vN` packages, so one version never imports another.
