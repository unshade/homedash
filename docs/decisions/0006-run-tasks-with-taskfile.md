# 6. Run project tasks with Taskfile

Date: 2026-11-01

## Status

Accepted

## Context

Developers need one entry point for building, testing, code generation, the dev database and the frontend. Make relies on platform-specific shell behavior and must be installed separately.

## Decision

Project tasks are defined in a root `Taskfile.yml` and run with [Task](https://taskfile.dev/). There is no Makefile. Task itself is pinned and run through `go tool` (see [ADR 7](0007-pin-go-dev-tools-in-tools-module.md)):

```sh
go tool -modfile=tools/go.mod task <name>
```

## Consequences

- Task runs the same way on Linux, macOS and Windows and needs nothing beyond Go.
- Typing the full command is long. Developers can alias it (`alias task='go tool -modfile=tools/go.mod task'`).
