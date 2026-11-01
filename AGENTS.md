# AGENTS.md

Instructions for anyone working on homedash, human or AI agent. They are the author's rules, not suggestions. The reasons behind them are in the ADRs in [`docs/decisions/`](docs/decisions/INDEX.md).

## Project

homedash is a self-hostable dashboard for everything at home: groceries, purchases with their warranties, todos, car management. It is source-available under PolyForm Noncommercial ([ADR 2](docs/decisions/0002-license-under-polyform-noncommercial.md)): free for noncommercial use, only the author may sell it, and redistributions must keep the `Required Notice` crediting the author.

## Keeping these docs up to date

- When the author gives a new rule, tip or architecture choice, add it to this file in the same change.
- Write an ADR only for structural decisions: anything that affects structure, interfaces or quality attributes, or is costly to reverse. Style rules belong here, not in an ADR.
- ADRs go in `docs/decisions/`, use the Nygard template, and are named `NNNN-present-tense-verb-phrase.md` with the next number (e.g. `0014-choose-migration-tool.md`). Add each new ADR to [`docs/decisions/INDEX.md`](docs/decisions/INDEX.md).
- Don't rewrite an accepted ADR. Write a new one and mark the old one `Superseded by NNNN`.

## Stack

| Part | Choice |
| --- | --- |
| Backend | Go + [Huma v2](https://huma.rocks/) on the standard library `http.ServeMux` (`humago` adapter) |
| CLI | [Cobra](https://cobra.dev/), in the layout `cobra-cli` expects |
| Database | PostgreSQL through [GORM's generics API](https://gorm.io/docs/the_generics_way.html) |
| Config | [caarlos0/env](https://github.com/caarlos0/env), generic API |
| Tests | `testing` + [testify](https://github.com/stretchr/testify) + [gomock](https://github.com/uber-go/mock) + [testcontainers](https://golang.testcontainers.org/) |
| Tasks | [Task](https://taskfile.dev/) (`Taskfile.yml`). Do not add a Makefile. |
| Frontend | Next.js (React, App Router, TypeScript, Tailwind) in `web/`. Read `web/AGENTS.md` first. |

## Layout

```
main.go                     entry point, calls cmd.Execute()
cmd/                        Cobra commands (package cmd), one file per command
internal/config/            configuration (env vars)
internal/<feature>/         domain: entity, errors, Repository interface, Service (e.g. internal/todo)
internal/<feature>/mock/    generated gomock mocks (do not edit)
internal/database/          GORM implementations of the repositories, Open, Migrate
internal/api/               router, OpenAPI, attaches each version
internal/api/field/         request field types shared by every API version
internal/api/v1/            v1 handlers, served under /api/v1
tools/                      separate Go module that pins the dev tools
.dev/                       development-only files (compose.yaml for PostgreSQL)
docs/decisions/             ADRs + INDEX.md
web/                        Next.js frontend
```

## Commands

Every Go development tool is pinned in `tools/go.mod` and run through `go tool`, so the only requirements are Go, Node.js and Docker.

```sh
alias task='go tool -modfile=tools/go.mod task'   # optional

task                       # list tasks
task db:up                 # start the dev PostgreSQL (.dev/compose.yaml); db:down, db:reset
task serve                 # build + run the API on :8080 (/docs, /openapi.json)
task test                  # unit tests
task test:integration      # unit + integration tests (needs Docker)
task generate              # go generate (mocks)
task cobra:add -- <name>   # new CLI command (`-- <name> -p <parent>Cmd` for a subcommand)
task web:dev               # Next.js dev server, /api/* forwarded to :8080
```

## Rules

### Tooling

- Run Go tools through `go tool -modfile=tools/go.mod <tool>`; never ask people to `go install` them. Add one with `cd tools && go get -tool <module>/cmd/<tool>@<version>`.
- New project commands go in `Taskfile.yml`.
- Builds run with `CGO_ENABLED=0` (set in the Taskfile). Don't add dependencies that need cgo.
- `//go:generate` lines use `$GOFILE` instead of hard-coding the file name, e.g. `//go:generate go tool -modfile=../../tools/go.mod mockgen -source=$GOFILE -destination=mock/<file>.go -package=mock`.
- Go commands target `. ./cmd/... ./internal/...`, not `./...`: an npm package installs a Go package inside `web/node_modules`.
- Files that only matter for development (compose files and the like) go in `.dev/`, so self-hosters don't mistake them for deployment files.

### CLI

- Create commands with `task cobra:add -- <name>`, then fill them in. Each command lives in `cmd/<name>.go` and registers itself on its parent in `init()`.
- Commands read settings from `config.Load()`. Don't add flags that duplicate a config variable.

### API

- Routes go in the package of their version, `internal/api/vN`, registered from `Register` in `vN.go` and served under `/api/vN`. Inside the package, paths are relative (`/todos`). A breaking change means a new version package.
- Use Huma operations with an `OperationID`, `Summary` and `Tags`. Validate with struct tags (`minLength`, `maxLength`, ...).
- Handlers call the feature's `Service` and translate domain errors: `ErrNotFound` → 404, `ErrInvalid` → 422, anything else → 500.
- **PATCH bodies use `field.OmittableNullable[T]`** for every field, to tell omitted, `null` and a value apart:
  - Fields that can be cleared get `nullable:"true"`, and `null` clears them.
  - Huma does not reject `null` for these custom types. The input struct implements `Resolve(huma.Context) []error` and returns a `huma.ErrorDetail` for each field that can't be cleared but was sent as `null`.
  - The domain update parameters say explicitly when a nullable field changes (e.g. `SetDueAt bool` + `DueAt *time.Time`).

### Persistence

- All database code sits behind **repository interfaces** declared in the domain package (`internal/<feature>/repository.go`), each with a gomock `//go:generate` line.
- Implementations live in `internal/database` and use **only GORM's generics API** (`gorm.G[T](db)...`). Each one checks it implements its interface with `var _ todo.Repository = (*TodoRepository)(nil)`.
- The structs GORM maps to tables are private to `internal/database` (`todoRow`) and converted to and from domain types. Domain packages never import GORM.
- Repositories return the domain's `ErrNotFound` for missing rows. Updates list their columns with `Select(...)`, or GORM skips zero values such as `false` or `""`.
- New tables must be added to `database.Migrate` (GORM's AutoMigrate for now).

### Configuration

- Everything goes in `internal/config`. `config.Load()` uses `env.ParseAsWithOptions[Config]` with the global `HOMEDASH_` prefix.
- Each topic is its own struct with an `envPrefix` (`Server` → `HOMEDASH_SERVER_*`, `DB` → `HOMEDASH_DB_*`). Defaults go in `envDefault` and match `.dev/compose.yaml`.
- Document every new variable in the README's configuration table.

### Testing

| Level | Needs | How |
| --- | --- | --- |
| Unit | nothing but Go | mocks for dependencies; plain `go test` / `task test` |
| Integration | several real components (testcontainers PostgreSQL) | files `*_integration_test.go` starting with `//go:build integration`; `task test:integration` |
| End-to-end | later | — |

- Use only the standard `testing` package plus testify. Assert with `require` when the test can't continue after a failure, `assert` otherwise.
- Name each test `Test<FuncName>`, or `Test<Type>_<Method>` for methods (`TestService_Create`, `TestTodoRepository_Update`).
- Every case goes in its own `t.Run("<sentence describing the behavior>", ...)`, **even when there is only one case**.
- Unit tests mock repositories with the generated gomock mocks. Never use a real database in a unit test.
- Each repository implementation gets integration tests against a real PostgreSQL (`postgres:18-alpine`). The package shares one container started in `TestMain`, and each test empties its tables first (`resetTables`).
- Every new feature comes with unit tests (service + handlers) and integration tests (repository).

## Adding a feature (todo is the example)

1. `internal/<feature>/`: the entity, `ErrNotFound`/`ErrInvalid`, the `Repository` interface with `//go:generate`, and the `Service` holding the business rules, plus `service_test.go`.
2. `task generate` to create the mock.
3. `internal/database/<feature>_repository.go`: a private row struct and the GORM generics implementation. Add the struct to `Migrate`. Write `<feature>_repository_integration_test.go`.
4. `internal/api/v1/<feature>.go`: Huma operations calling the service, with `OmittableNullable` for PATCH. Add it to `Register` and `Dependencies`. Write `<feature>_test.go` with `humatest` and the mock.
5. Wire the repository and service in `cmd/serve.go`.
6. Run `task test` and `task test:integration`, and write an ADR if a structural decision was made.

## Known gotchas

- On macOS, an outdated Command Line Tools install can't link anything that uses cgo. That's one reason `CGO_ENABLED=0` is set.
- Dates returned by PostgreSQL come back in the server's local timezone, not normalized to UTC yet.
