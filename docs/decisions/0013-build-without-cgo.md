# 13. Build without cgo

Date: 2026-11-01

## Status

Accepted

## Context

homedash's dependencies are pure Go (pgx, Huma, Cobra). Allowing Go to compile C code (cgo) makes builds depend on the machine's C toolchain. In practice, an outdated macOS command-line tools install broke the build of the testcontainers integration tests.

## Decision

`Taskfile.yml` sets `CGO_ENABLED=0` for every task. homedash must build and test without cgo.

## Consequences

- Binaries are statically linked and run in minimal containers (`scratch`, distroless).
- Libraries that require cgo (e.g. `mattn/go-sqlite3`) can't be used without a new ADR.
