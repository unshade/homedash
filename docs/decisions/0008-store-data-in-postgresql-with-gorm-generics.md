# 8. Store data in PostgreSQL with GORM's generics API

Date: 2026-11-01

## Status

Accepted

## Context

homedash stores data that is related and needs to stay consistent: groceries, purchases with warranties, todos, cars. We want a reliable SQL database and a data access layer with little boilerplate that catches type errors at compile time.

## Decision

- **Database:** PostgreSQL, through GORM with the `gorm.io/driver/postgres` driver (pgx).
- **Data access:** use GORM's [generics API](https://gorm.io/docs/the_generics_way.html) (`gorm.G[T](db)...`) everywhere. Do not use the older untyped API.
- **Tables:** the structs GORM maps to tables are private to `internal/database` (e.g. `todoRow`) and converted to and from domain types.
- **Schema:** for now, tables are created or updated with GORM's AutoMigrate when the server starts.
- **Dev database:** runs from `.dev/compose.yaml` (`task db:up`), which is for development only.

## Consequences

- Self-hosters need to run PostgreSQL. This is heavier than SQLite but more robust.
- The generics API leaves out ambiguous calls such as `Save` and `FirstOrCreate`. Updates must list their columns with `Select(...)`, or GORM silently skips zero values (e.g. `done = false`).
- AutoMigrate can't rename or drop columns safely. Before real users have data, it should be replaced by versioned migrations (e.g. goose or Atlas) in a new ADR.
