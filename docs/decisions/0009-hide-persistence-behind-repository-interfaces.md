# 9. Hide persistence behind repository interfaces

Date: 2026-11-01

## Status

Accepted

## Context

Business rules (validation, partial updates) should be testable without a database and should not depend on GORM. HTTP handlers should not contain SQL either.

## Decision

Each feature is split into three layers:

1. **Domain** (`internal/<feature>`, e.g. `internal/todo`): the entity, its errors (`ErrNotFound`, `ErrInvalid`), a `Repository` interface, and a `Service` holding the business rules. It does not import GORM.
2. **Persistence** (`internal/database`): the GORM implementations of each `Repository` (e.g. `TodoRepository`), with `var _ todo.Repository = (*TodoRepository)(nil)` to check at compile time that they implement it. Implementations translate missing rows into the domain's `ErrNotFound`.
3. **HTTP** (`internal/api/vN`): handlers that call the `Service` and translate domain errors into HTTP errors (`ErrNotFound` → 404, `ErrInvalid` → 422, anything else → 500).

Each `Repository` interface has a gomock mock, generated next to it with `//go:generate go tool -modfile=../../tools/go.mod mockgen -source=$GOFILE -destination=mock/<file>.go -package=mock`.

## Consequences

- Services and handlers are unit-tested with mocks, with no database needed.
- Each repository is tested once against a real database (see [ADR 10](0010-split-tests-into-unit-integration-and-e2e.md)).
- Each new feature needs an interface, an implementation, a mock and the conversions between layers. That's more code, but every feature follows the same pattern.
