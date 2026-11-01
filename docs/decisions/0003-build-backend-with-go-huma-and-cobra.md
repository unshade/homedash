# 3. Build the backend with Go, Huma and Cobra

Date: 2026-11-01

## Status

Accepted

## Context

homedash is self-hosted, so it should be one small program with few dependencies that is easy to run. Its HTTP API serves our own frontend and should also be documented for scripts and other people's integrations. Admin tasks (serving, and later migrations or imports) need a command-line interface.

## Decision

- **Language:** Go. The module is `github.com/unshade/homedash`.
- **HTTP API:** [Huma v2](https://huma.rocks/) on the standard library router (`http.ServeMux`, through the `humago` adapter). Huma generates the OpenAPI 3.1 spec (`/openapi.json`) and docs (`/docs`) from typed Go handlers and validates requests from struct tags.
- **CLI:** [Cobra](https://cobra.dev/), laid out the way `cobra-cli` expects: a root `main.go`, plus `cmd/` (package `cmd`) where each command registers itself on `rootCmd` in `init()`. New commands are created with `task cobra:add -- <name>`.

## Consequences

- The API documentation can't drift from the code, and a typed frontend client can be generated from the spec.
- There is no third-party router. If we need middleware, it has to work with `net/http` or Huma.
- The `cmd/` layout and its global `rootCmd` come from `cobra-cli`. We accept them so the code generator keeps working.
