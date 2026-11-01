# 14. Run CI on GitHub Actions through tasks

Date: 2026-11-01

## Status

Accepted

## Context

homedash is hosted on GitHub and needs continuous integration. What runs in CI should be exactly what developers can run locally. Unit tests and integration tests have different needs (integration tests need Docker, see [ADR 10](0010-split-tests-into-unit-integration-and-e2e.md)), but we want a single coverage figure for the whole codebase, shown on GitHub.

## Decision

CI is one GitHub Actions workflow, `.github/workflows/ci.yml`. **Every step runs a task** (`go tool -modfile=tools/go.mod task <name>`), so there is no build logic in the YAML. It has four jobs:

1. **Pre-checks**: `task vet`, `task build`, `task lint` ([golangci-lint](https://golangci-lint.run/) v2, configured in `.golangci.yml`) and `task vuln` ([govulncheck](https://go.dev/doc/security/vuln/)). govulncheck fails the build when our code calls a vulnerable function.
2. **Unit tests**: `task test`.
3. **Integration tests**: `task test:integration` on `ubuntu-latest`, the only GitHub runner with a Docker daemon, which testcontainers needs. The test images are pulled before the tests.
4. **Coverage**: runs once jobs 2 and 3 have passed.
   - Both test tasks write Go's binary coverage format (`-cover -coverpkg=./cmd/...,./internal/...` with `-test.gocoverdir`) into `.coverage/unit` and `.coverage/integration`, uploaded as artifacts.
   - `task coverage` merges them with the built-in `go tool covdata merge` into one profile (`.coverage/coverage.out`), then converts it to Cobertura (`.coverage/coverage.xml`) with [gocover-cobertura](https://github.com/boumenot/gocover-cobertura), leaving out generated mocks.
   - The Cobertura report is summarized on the job page and posted as a sticky comment on pull requests.

The Go version comes from the `toolchain` line in `go.mod`, which is kept on the latest patch release.

## Consequences

- Anyone can reproduce a CI failure locally with the same task.
- Coverage counts every package exercised by any test (`-coverpkg`), so code covered only by integration tests still counts.
- The jobs run in parallel. Coverage needs both test jobs, so a failing test also means no coverage report.
- Coverage comments are not posted on pull requests from forks, because GitHub doesn't give their workflows permission to write comments.
- All Go tools share one module, so a tool whose dependencies conflict with the others can't be added (actionlint couldn't be, because golangci-lint needs a newer YAML library). Such a tool would need its own module under `tools/`.
