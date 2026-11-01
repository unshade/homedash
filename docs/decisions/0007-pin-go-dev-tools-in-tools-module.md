# 7. Pin Go development tools in a tools module

Date: 2026-11-01

## Status

Accepted

## Context

The project uses Go development tools (Task, cobra-cli, mockgen). Installing them globally with `go install` leads to different versions on different machines. Adding them to the app's `go.mod` would mix their dependencies into the application's.

## Decision

Every Go development tool is declared with a `tool` line in a separate module, `tools/go.mod` (`github.com/unshade/homedash/tools`). Tools are added with:

```sh
cd tools && go get -tool <module>/cmd/<tool>@<version>
```

and run with `go tool -modfile=tools/go.mod <tool>` (or `go tool <tool>` from inside `tools/`). `//go:generate` lines call them the same way.

## Consequences

- Tool versions are versioned in the repository, and everyone runs the same ones without installing anything.
- The application's `go.mod` contains only what the application needs.
- Every command needs the `-modfile=tools/go.mod` flag.
