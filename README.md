# homedash

A self-hostable dashboard for everything at home.

## Stack

- **Backend**: Go + [Huma](https://huma.rocks/) (OpenAPI 3.1 generated from code)
- **CLI**: [Cobra](https://cobra.dev/)
- **Frontend**: React + Vite + [shadcn/ui](https://ui.shadcn.com/) in [`web/`](web), embedded in the Go binary

## Install it as an app

homedash is a Progressive Web App: open it in a browser and choose **Install app** (Chrome, Edge, Android) or **Share → Add to Home Screen** (Safari on iPhone and iPad). It then opens in its own window. When it can't reach your server (no connection, away from home, server down), it shows the last data it saw on that device, read-only, and says when that data was saved.

Browsers only install apps served over **HTTPS** (or from `localhost`). To install homedash on your phone, put it behind a reverse proxy with a certificate, such as [Caddy](https://caddyserver.com/), or reach it through [Tailscale](https://tailscale.com/kb/1312/serve) (`tailscale serve`).

## Development

Requirements: Go, Node.js and Docker. All other dev tools (e.g. [Task](https://taskfile.dev/), [cobra-cli](https://github.com/spf13/cobra-cli)) are pinned in [`tools/go.mod`](tools/go.mod) and run through `go tool`, so nothing else has to be installed.

```sh
alias task='go tool -modfile=tools/go.mod task'   # optional convenience

task            # list tasks
task dev        # database + live-reloading Go server + frontend on http://localhost:5173
task build      # single binary with the frontend embedded -> bin/homedash
task serve      # run it: app on http://localhost:8080, API docs at /docs
task check                 # vet, lint, vuln, build
task test                  # unit tests
task test:integration      # integration tests (testcontainers, needs Docker)
task coverage              # merged coverage (.coverage/coverage.out, Cobertura .coverage/coverage.xml)
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
