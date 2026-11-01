# 12. Model partial updates with OmittableNullable

Date: 2026-11-01

## Status

Accepted

## Context

PATCH requests must tell apart three cases for each field: omitted (leave it unchanged), `null` (clear it) and a value (set it). Pointer fields can't tell omitted from `null`.

## Decision

- **Field type:** request fields of PATCH endpoints use `field.OmittableNullable[T]` from `internal/api/field`. It is implemented as described in [Huma's schema customization docs](https://huma.rocks/features/schema-customization/): it records `Sent`, `Null` and `Value`, and its OpenAPI schema is the one of `T`.
- **Fields that can be cleared:** these carry the `nullable:"true"` tag.
- **Fields that can't be cleared:** Huma lets `null` through for custom types even when the schema forbids it. Each input struct therefore implements `huma.Resolver` and returns a 422 error naming each such field set to `null`.
- **Domain:** update parameters say explicitly when a nullable field changes (e.g. `SetDueAt bool` plus `DueAt *time.Time`).

## Consequences

- Clients can clear optional values, and the OpenAPI spec shows which fields accept `null`.
- Every PATCH input needs a `Resolve` method for its fields that can't be cleared.
