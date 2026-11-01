# 10. Split tests into unit, integration and end-to-end

Date: 2026-11-01

## Status

Accepted

## Context

Most tests should run fast with nothing but Go installed. Code that talks to a real database still has to be tested against the real thing, and those tests need Docker and are slower.

## Decision

There are three levels:

- **Unit tests** run with no external dependencies. Dependencies are replaced by gomock mocks. Plain `go test` (`task test`) runs only these.
- **Integration tests** use several real components, such as PostgreSQL started with [testcontainers](https://golang.testcontainers.org/) (`postgres:18-alpine`). The files are named `*_integration_test.go` and start with `//go:build integration`. Run them with `task test:integration`.
- **End-to-end tests** will be added later.

Rules for every test:

- Use the standard `testing` package.
- Name each test `Test<Func>`, or `Test<Type>_<Method>` for methods.
- Put every case in its own `t.Run("<sentence describing the behavior>", ...)`, even if there is only one.
- Assert with testify: `require` when the test can't continue after a failure, `assert` otherwise.

## Consequences

- `go test ./...` stays fast and works without Docker.
- Integration tests in a package share one container, started in `TestMain`, and each test empties its tables first.
- Because of the build tag, integration tests are compiled only when asked for. CI must run `task test:integration` so they don't break unnoticed.
