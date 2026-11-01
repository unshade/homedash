# 11. Load configuration from prefixed environment variables

Date: 2026-11-01

## Status

Accepted

## Context

homedash runs mostly in containers, where environment variables are the standard way to configure a program. Settings should be grouped by topic and have defaults that work for local development.

## Decision

- **Loading:** `internal/config` loads everything with [caarlos0/env](https://github.com/caarlos0/env), using its generic `env.ParseAsWithOptions[Config]`. `config.Load()` returns a `Config`.
- **Prefixes:** every variable starts with `HOMEDASH_`. Each topic is a struct with its own `envPrefix` (`Server` → `SERVER_`, `DB` → `DB_`), which gives names like `HOMEDASH_DB_HOST`.
- **Defaults:** set with `envDefault` tags. They match the dev database in `.dev/compose.yaml`.
- **Commands:** they read the config. There are no command-line flags that duplicate a variable.

## Consequences

- Each setting is set in exactly one way, and all settings are listed in one struct.
- A new topic is a new struct with its own `envPrefix` in `Config`.
- The dev defaults (e.g. the `homedash` password) are not safe for production. We may later make secrets required.
