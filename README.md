# homedash

A self-hostable dashboard for everything at home.

## Stack

- **Backend**: Go + [Huma](https://huma.rocks/) (OpenAPI 3.1 generated from code)
- **CLI**: [Cobra](https://cobra.dev/)
- **Frontend**: Next.js (React) in [`web/`](web)

## Development

Requirements: Go, Node.js and Docker. All other dev tools (e.g. [Task](https://taskfile.dev/), [cobra-cli](https://github.com/spf13/cobra-cli)) are pinned in [`tools/go.mod`](tools/go.mod) and run through `go tool`, so nothing else has to be installed.

```sh
alias task='go tool -modfile=tools/go.mod task'   # optional convenience

task            # list tasks
task db:up      # start the dev PostgreSQL (.dev/compose.yaml)
task serve      # API on http://localhost:8080 (docs at /docs, spec at /openapi.json)
task web:dev    # frontend on http://localhost:3000, /api/* proxied to the Go API
task test                  # unit tests
task test:integration      # unit + integration tests (testcontainers, needs Docker)
task generate              # regenerate gomock mocks
task cobra:add -- <name>   # scaffold a CLI command in cmd/ (add `-p <parent>Cmd` for subcommands)
```

### Configuration

homedash is configured with environment variables, loaded by [`internal/config`](internal/config/config.go). Each one starts with `HOMEDASH_` followed by its group prefix. The defaults work with the dev database in `.dev/compose.yaml`.

| Variable | Default |
| --- | --- |
| `HOMEDASH_SERVER_ADDR` | `localhost:8080` |
| `HOMEDASH_DB_HOST` | `localhost` |
| `HOMEDASH_DB_PORT` | `5432` |
| `HOMEDASH_DB_USER` | `homedash` |
| `HOMEDASH_DB_PASSWORD` | `homedash` |
| `HOMEDASH_DB_NAME` | `homedash` |
| `HOMEDASH_DB_SSLMODE` | `disable` |

## Contributing

Conventions, architecture and rules are in [`AGENTS.md`](AGENTS.md). The reasons behind them are recorded as ADRs in [`docs/decisions/`](docs/decisions/INDEX.md).

## License

homedash is **source-available** under the [PolyForm Noncommercial License 1.0.0](LICENSE).

- ✅ Free to use, self-host, modify and share for personal and noncommercial use.
- ✅ Forks and redistributions must keep the license and the `Required Notice` crediting the author.
- ❌ Commercial use (e.g. selling it or running it as a paid hosted service) is not permitted without a separate license from the author.

For commercial licensing, contact Noé Steiner.
