# homedash

A self-hostable dashboard for everything at home.

## Stack

- **Backend**: Go + [Huma](https://huma.rocks/) (OpenAPI 3.1 generated from code)
- **CLI**: [Cobra](https://cobra.dev/)
- **Frontend**: Next.js (React) in [`web/`](web)

## Development

Requirements: Go and Node.js. All other dev tools (e.g. [Task](https://taskfile.dev/), [cobra-cli](https://github.com/spf13/cobra-cli)) are pinned in [`tools/go.mod`](tools/go.mod) and run through `go tool`, so nothing else has to be installed.

```sh
alias task='go tool -modfile=tools/go.mod task'   # optional convenience

task            # list tasks
task serve      # API on http://localhost:8080 (docs at /docs, spec at /openapi.json)
task web:dev    # frontend on http://localhost:3000, /api/* proxied to the Go API
task test
task cobra:add -- <name>   # scaffold a CLI command in cmd/ (add `-p <parent>Cmd` for subcommands)
```

API routes live in versioned packages: `internal/api/v1` is served under `/api/v1`.

To add a Go dev tool: `cd tools && go get -tool <module>/cmd/<tool>@<version>`.

## License

homedash is **source-available** under the [PolyForm Noncommercial License 1.0.0](LICENSE).

- ✅ Free to use, self-host, modify and share for personal and noncommercial use.
- ✅ Forks and redistributions must keep the license and the `Required Notice` crediting the author.
- ❌ Commercial use (e.g. selling it or running it as a paid hosted service) is not permitted without a separate license from the author.

For commercial licensing, contact Noé Steiner.
