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
| Checks | `go vet`, [golangci-lint](https://golangci-lint.run/) v2 (`.golangci.yml`), [govulncheck](https://go.dev/doc/security/vuln/) |
| CI | GitHub Actions (`.github/workflows/ci.yml`), every step is a task |
| Frontend | React SPA in `web/`: Vite, TypeScript 5.9, TanStack Router + Query, react-hook-form + zod, Tailwind v4. Built into the Go binary (ADR 15) |
| UI | [shadcn/ui](https://ui.shadcn.com/) (Radix, preset Nova), stone ground + white panels + one brand green (ADR 16, 17). No glass/Glassy UI |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox): manifest, generated icons, a service worker caching the app but never the API (ADR 18); server data saved in IndexedDB for a read-only offline mode (ADR 19) |
| Frontend tests | Vitest + Testing Library + MSW; lint with oxlint |
| Releases | [semantic-release](https://semantic-release.gitbook.io/) from Conventional Commits on main: version tag, `CHANGELOG.md`, GitHub release; [commitlint](https://commitlint.js.org/) on pull requests (ADR 20) |
| Container | Multi-stage `Dockerfile` → distroless, non-root image with only the binary, `ghcr.io/unshade/homedash` for amd64 + arm64 (ADR 21) |
| Dev reload | [air](https://github.com/air-verse/air) for Go (`.dev/air.toml`), Vite for the frontend |

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
internal/server/            the whole HTTP handler: API + frontend + security headers
internal/webui/             serves the embedded frontend (dist/ is the build output, gitignored)
tools/                      separate Go module that pins the dev tools
tools/release/              release tooling (semantic-release, commitlint) pinned in its own package-lock.json
Dockerfile, .dockerignore   the container image (ADR 21)
CHANGELOG.md                written by semantic-release on each release; never edit it by hand
.github/workflows/ci.yml    CI: pre-checks, unit, integration, merged coverage
.golangci.yml               golangci-lint configuration
.dev/                       development-only files (compose.yaml for PostgreSQL, air.toml)
docs/decisions/             ADRs + INDEX.md
web/                        React frontend (Vite)
  src/routes/               one file per page (TanStack Router, file-based; routeTree.gen.ts is generated)
  src/features/<feature>/   the feature's queries, components, form schema and logic, with their tests
  src/components/ui/        shadcn/ui components (ours to edit)
  src/components/app-sidebar.tsx  the app selector: one entry per feature in `apps`
  src/hooks/                shared React hooks (e.g. useIsMobile, useOnline)
  public/app-icon.svg       source of the installed app's icons (pwa-assets.config.ts generates them at build)
  src/api/                  typed API client; schema.gen.ts is generated by `task web:api`
  src/test/                 test setup, fake API (MSW), render helper
.taste-skill/direction.json the UI style dealt by the taste-skill (ADR 16)
```

## Commands

Every Go development tool is pinned in `tools/go.mod` and run through `go tool`, so the only requirements are Go, Node.js and Docker.

```sh
alias task='go tool -modfile=tools/go.mod task'   # optional

task                       # list tasks
task dev                   # develop: database + Go server with live reload (air) + Vite on http://localhost:5173
task db:up                 # start the dev PostgreSQL (.dev/compose.yaml); db:down, db:reset
task build                 # frontend + Go binary with the frontend embedded -> bin/homedash
task serve                 # build + run it on :8080 (app at /, API docs at /docs)
task check                 # pre-checks: Go vet/lint/vuln, frontend lint/types/audit/API types, build
task lint:fix              # golangci-lint with automatic fixes (gofmt, goimports, ...)
task test                  # unit tests -> .coverage/unit
task test:integration      # integration tests only (needs Docker) -> .coverage/integration
task coverage              # merge both into .coverage/coverage.out + coverage.xml (Cobertura)
task generate              # go generate (mocks)
task cobra:add -- <name>   # new CLI command (`-- <name> -p <parent>Cmd` for a subcommand)
task web:api               # regenerate the frontend API types after changing the Go API
task web:test              # frontend tests (Vitest); also web:lint, web:typecheck, web:audit
task docker:build          # container image for this machine -> homedash:dev
task commitlint            # check commit messages since origin/main (FROM=<ref> to change)
task release:dry-run       # on an up-to-date main: the next version and its notes, without releasing
```

## Rules

### Tooling

- Run Go tools through `go tool -modfile=tools/go.mod <tool>`; never ask people to `go install` them. Add one with `cd tools && go get -tool <module>/cmd/<tool>@<version>`.
- New project commands go in `Taskfile.yml`.
- Builds run with `CGO_ENABLED=0` (set in the Taskfile). Don't add dependencies that need cgo.
- `//go:generate` lines use `$GOFILE` instead of hard-coding the file name, e.g. `//go:generate go tool -modfile=../../tools/go.mod mockgen -source=$GOFILE -destination=mock/<file>.go -package=mock`.
- Go commands target `. ./cmd/... ./internal/...` (the `PKGS` variable in the Taskfile), not `./...`: an npm package installs a Go package inside `web/node_modules`.
- Keep the `toolchain` line of `go.mod` and `tools/go.mod` on the latest Go patch release (`go mod edit -toolchain=goX.Y.Z`). govulncheck fails when the standard library we call has a known vulnerability, and the usual fix is a newer patch release.
- `task check` must pass before pushing: `go vet`, golangci-lint, govulncheck and the build. Fix lint findings, don't disable them. Run `task lint:fix` for formatting and imports (our own packages are grouped last, after the `github.com/unshade/homedash` prefix).
- Files that only matter for development (compose files, the air config and the like) go in `.dev/`, so self-hosters don't mistake them for deployment files.
- Develop with `task dev`: air restarts the Go server on every Go change, and Vite reloads the frontend.

### Commits and releases

- **Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)**: `type: subject`, one line, lowercase imperative subject, no final period (`feat: add openapi command`). Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`. A scope is optional (`feat(todos): ...`).
- The author's rules for commits: **no description (body)** and **no `Co-Authored-By` line**, whatever tool writes the commit. One commit per concern; work for several concerns is split into several commits, each one building and passing its tests.
- Commits go to a branch and reach main through a pull request (merge commit), never pushed to main directly.
- Releases are automatic (ADR 20): `feat` releases a minor version, `fix` and `perf` a patch; other types release nothing. While homedash is 0.x, a breaking change (`feat!:`) bumps the minor version too. semantic-release writes `CHANGELOG.md`, tags `vX.Y.Z` and creates the GitHub release; CI then publishes the image. Never tag or edit the changelog by hand.

### Container image

- The `Dockerfile` has build stages (Node for the frontend, Go for the binary) and a runtime stage `gcr.io/distroless/static-debian13:nonroot` that holds **only the binary**. Don't add a shell, tools or other files to it, and keep `USER nonroot`.
- Build stages use `--platform=$BUILDPLATFORM` and cross-compile with `GOOS`/`GOARCH`: never run emulated steps.
- Base images are pinned by tag and digest. Update them with the Go toolchain (`go.mod`) and Node (`web/.nvmrc`): `docker buildx imagetools inspect <image:tag>` gives the digest.
- `.dockerignore` is an allowlist: a new top-level source folder needed by the build must be added to it.
- Configuration comes from `HOMEDASH_*` environment variables only; the image sets `HOMEDASH_SERVER_ADDR=:8080`.

### CI

- CI runs on GitHub Actions (`.github/workflows/ci.yml`). **Every step calls a task.** Don't put build or test logic in the workflow YAML; add a task and call it.
- Jobs: commit messages (pull requests only, `commitlint`), pre-checks (`vet`, `build` with the frontend embedded, `lint`, `vuln`), frontend (`web:lint`, `web:typecheck`, `web:api:check`, `web:test`, `web:audit`), Go unit tests, integration tests, container image (`docker:build`), then coverage once both Go test jobs pass. On main, once every check passed: `release` (semantic-release), then `publish` (`docker:push`, amd64 + arm64 to ghcr.io) when a version was released. Node's version comes from `web/.nvmrc`.
- Runs on main are never cancelled by a newer push (they may be releasing); pull request runs are.
- Unit and integration tests run as separate steps, each writing Go binary coverage (`-test.gocoverdir`). `task coverage` merges them with `go tool covdata` into **a single** `coverage.out`, then converts it to Cobertura for GitHub (job summary + pull request comment).
- Integration tests need Docker: run them on `ubuntu-latest` (macOS and Windows runners have no Docker). Add every image the tests use to the job's "Pull test images" step.
- Upload hidden folders such as `.coverage/` with `include-hidden-files: true`, or `actions/upload-artifact` skips them.

### Frontend

- **Architecture:** the frontend is a static SPA embedded in the Go binary and served on the same origin as the API (ADR 15). There is no Node.js in production and no CORS.
- **API types:** never write API types or `fetch` calls by hand. After any Go API change, run `task web:api` and commit `web/src/api/schema.gen.ts`; CI fails when it is stale. Call the API through `$api` (`openapi-react-query`) or `fetchClient`.
- **Features:**
  - Each feature lives in `src/features/<feature>/`: `queries.ts` with its query options and mutation hooks, components, the form schema and pure logic, with their tests.
  - Routes in `src/routes/` stay thin: they prefetch the data in `loader` (`queryClient.ensureQueryData`) and pick the page, pending and error components.
- **Server data:**
  - Server data lives in TanStack Query only, never copied into component state.
  - Mutations refetch the affected queries before they settle.
  - Failed mutations are reported by the global `MutationCache` toast.
  - Queries don't retry 4xx errors.
- **Forms:**
  - react-hook-form + zod, with the same rules as the API, so users get instant feedback.
  - API validation errors (`body.<field>`) are mapped onto the matching fields.
  - A PATCH sends only the changed fields, `null` to clear a nullable one.
- **React:** React 19 (no `forwardRef`), no components defined inside components, ternaries rather than `&&` in JSX, direct imports (no barrel files), nothing impure during render (use a hook such as `useToday`).
- **Security:**
  - No inline scripts, no `dangerouslySetInnerHTML`, no third-party scripts or CDNs: the CSP blocks them. Fonts and assets are bundled (`@fontsource`).
  - Dark mode follows the system theme through a CSS media query, because a theme script would be inline.
- **Dependencies:**
  - Install with `npm ci` (`task web:install`), so exactly the lockfile is used.
  - Install scripts are denied by default (npm 11): review each one with `npm install-scripts ls`, and approve or deny it in `package.json` `allowScripts`.
  - Build-only packages go in `devDependencies`. `task web:audit` must pass on runtime dependencies.
- **Installable app (PWA, ADR 18):**
  - The manifest and Workbox settings are in `vite.config.ts` (`VitePWA`); icons come from `public/app-icon.svg` through `pwa-assets.config.ts`. Their `<link>` tags and the per-theme `theme-color` are written by hand in `index.html` (the plugin's injection is off: it would add a single theme colour).
  - The service worker caches the app only. Never add API routes to its cache: data must always come from the server. Anything served by Go outside the app (`/api`, `/docs`, `/openapi*`, `/schemas`) goes in `navigateFallbackDenylist`.
  - Updates wait for the user (`registerType: 'prompt'`, the toast in `update-prompt.tsx`); don't switch to auto-reload.
  - Installing needs HTTPS or `localhost`. Test it with `task serve`, not `task dev` (no service worker in development).
- **Offline, read-only (ADR 19):**
  - Server data is saved on the device by TanStack Query's persister (`src/lib/persist.ts`, IndexedDB). New queries are saved automatically; don't build a second cache (no Workbox API caching, no copies in localStorage).
  - "Online" means the server answers, not `navigator.onLine`: `src/lib/connection.ts` tracks it through the API client and drives TanStack Query's `onlineManager`. Read it with `useOnline()`.
  - **Every control that changes data is disabled when `useOnline()` is false** (buttons, checkboxes, menu items). `OfflineNotice` explains why and shows when the data was saved.
  - Mutations fail at once offline (`networkMode: 'always'`) and are never saved or queued. Don't add offline writes without a new ADR.
  - The saved copy is thrown away when `schema.gen.ts` changes (the persister's `buster`). Never save secrets in queries; when authentication arrives, signing out must clear the copy.
- **Phones:** taps have no grey flash and no double-tap delay, and long-pressing a control doesn't select its label (`index.css`). Inputs stay at 16px on phones, or iOS zooms into them. Never disable zooming.
- **Language:** the interface is English. Format dates with the `locale` constant (`src/lib/locale.ts`, en-GB), never the browser's locale.
- **Accessibility:**
  - Every control has a visible label or an `aria-label`, dialogs have a title, and icons are `aria-hidden`.
  - Touch targets are at least 44px on phones.
  - shadcn/Radix components handle focus and keyboard; keep using them instead of hand-made widgets.
- **Tests:**
  - Vitest + Testing Library + MSW. Tests query by role and label as a user would, and talk to a fake API declared with `server.use(...)`. A request without a handler fails the test.
  - Name them `describe('<Component or function>')` with one `it('<behavior as a sentence>')` per case.
  - Pure logic (dates, grouping) has its own unit tests.

### UI design

These rules come from the taste-skill's app-screen rules (ADR 16), with a brand colour and motion added (ADR 17). Load the `design-taste-frontend` skill before designing or restyling a screen, and the `animate` skill before adding motion.

- **Colour:** the author wants the UI lively but not loud ("not too much").
  - One brand colour, a garden green (`primary`), on the single primary action per screen, checks, focus, the logo, "today" (`text-data`) and progress. Secondary actions are outline or ghost.
  - Red (`text-negative`) only on the overdue/failing fact, one red mark per object.
  - Soft 8% tints of these two (`bg-primary/8`, `bg-negative/8`) for group bands; muted grey for the rest.
  - No other hues, no gradients, glows, glass or backdrop blur (no Glassy UI), and no shadows on things at rest (menus and dialogs may have one).
  - Keep 4.5:1 contrast for text, in light and dark.
  - Theme tokens live in `web/src/index.css`: change a token, never hard-code a colour.
- **Motion** (ADR 17):
  - Only with a named purpose: feedback (the check tick), spatial consistency (a todo gliding to its new group via React `<ViewTransition>`), or arrival (enter/exit).
  - Transform and opacity only, 150-250ms, the `--ease-out` / `--ease-in-out` tokens.
  - Every animation has a `prefers-reduced-motion` variant (fade, no movement).
  - Nothing animates on keyboard shortcuts, page load or hover-heavy surfaces, and there are no looping or pulsing animations.
- **Navigation:** the apps (todos, groceries, ...) are listed in a sidebar, like Home Assistant (shadcn `Sidebar`, `collapsible="icon"`).
  - On a computer it collapses to a rail of icons with a tooltip each; the choice is kept in `localStorage` (`homedash.sidebar`), never a cookie. It has no keyboard shortcut: Cmd/Ctrl+B belongs to the browser.
  - On a phone (under 768px) it is a drawer opened by the menu button of a 56px top bar; picking an app closes it.
  - The current app is marked with `aria-current="page"`, the grey active background and a green icon. Only list apps that exist.
  - Collapsing is instant: the sidebar's width transitions were removed because they animate layout. The phone drawer slides with transform and fades when reduced motion is on.
- **Surfaces:** a white panel (`rounded-lg border bg-card`) on the stone ground; rows divided by `divide-rule`; no zebra stripes or header bands; no icon tiles or icons in tinted squares; no pill badges above headings; no emoji.
- **Type:**
  - Geist only, at 12/14/16/24px. Titles are nouns at 24px/600.
  - Labels are sentence case, never tracked uppercase. Numbers use `tabular-nums`.
- **Layout:**
  - Each screen has one `h1`, a "finding" line under it that states the fact needing attention first, and its main action in the title row. A short progress strip (like "This week") may follow when it answers the screen's question.
  - Each block is a section with a heading.
  - Use the product's own words ("Overdue", "Next 7 days"), not template nouns ("Items", "Records").
- **States:**
  - An empty block keeps its frame and gives one sentence.
  - Loading shows the final layout with still grey bars (no pulse or shimmer).
  - Errors stay inside the block that failed and offer a retry.
  - Real zeros are printed; missing values are a grey dash.
- **Checks:** before finishing a UI change, run `node ~/.claude/skills/design-taste-frontend/scripts/lint.mjs --app <web sources>` and `inspect.mjs --app` on the production build (`task build && task serve`), then look at the 1440/768/390 screenshots.

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
| Integration | several real components (testcontainers PostgreSQL) | files `*_integration_test.go` starting with `//go:build integration`; `task test:integration` runs only the packages that have such files |
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
6. `task web:api` to regenerate the frontend API types.
7. `web/src/features/<feature>/`: queries, components, form schema, with tests against the fake API; a route in `web/src/routes/`; an entry (path, label, lucide icon) in `apps` in `web/src/components/app-sidebar.tsx`. Follow the UI design rules.
8. Run `task check`, `task test`, `task test:integration` and `task web:test`, and write an ADR if a structural decision was made.

## Known gotchas

- TypeScript is pinned to 5.9: `openapi-typescript` uses the TypeScript compiler as a library and doesn't support TypeScript 7 yet.
- Huma marks Go slices as nullable by default; `internal/api` turns that off (`huma.DefaultArrayNullable = false`), so handlers must never return a nil list as `null`. Return an empty slice.
- MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame`. `openapi-fetch` keeps the `fetch` it saw at creation, so `fetchClient` looks it up on each call; otherwise MSW can't intercept requests in tests.
- Radix components need `ResizeObserver`, pointer-capture and `matchMedia` stubs under jsdom (`web/src/test/setup.ts`).
- `npx shadcn add` asks to overwrite components we already edited (button, skeleton, dialog, ...): answer no (`yes n | npx shadcn add <name>`), then review what it added. Our edits to shadcn files: no backdrop blur on overlays, no pulsing skeleton, `transition-colors` instead of `transition-all`, and in the sidebar `data-active` is only rendered when true (Tailwind's `data-active:` matches `data-active="false"` too).
- `cn` in the frontend dependencies is shadcn's own class-merging package (same npm publisher as `shadcn`), not a typo.

- All Go tools share `tools/go.mod`, so their dependencies must be compatible. actionlint can't be added there, because golangci-lint requires a YAML library version that breaks it. To check a workflow, build actionlint in a temporary folder instead.

- On macOS, an outdated Command Line Tools install can't link anything that uses cgo. That's one reason `CGO_ENABLED=0` is set.
- `@tanstack/react-query`, `@tanstack/query-persist-client-core` and `@tanstack/query-async-storage-persister` must stay on the same version, or two copies of the query core are bundled and persistence silently breaks. Upgrade them together.
- To test offline in a browser, use `task serve`, open the page once, then DevTools → Network → Offline, or stop the server (the app notices within 10 seconds when it comes back).
- `conventional-changelog-conventionalcommits` (the changelog preset in `tools/release`) must stay on a major version that works with the `conventional-changelog-writer` used by `@semantic-release/release-notes-generator` (writer 8 → preset 9). A newer preset fails the release at "generateNotes" with `Missing helper`. commitlint installs its own copy, so its version doesn't matter.
- Test release changes with `task release:dry-run` on an up-to-date main: it uses `tools/release/dry-run.config.mjs`, which keeps each plugin's options. Passing `--plugins` to semantic-release drops them (the preset included) and hides errors like the one above.
- After a change to the frontend, a browser that has opened `task serve` keeps the old version until you click Reload in the update toast (or close every tab of it). Hard-refreshing doesn't always help; in DevTools, Application → Service workers → Update.
- Dates returned by PostgreSQL come back in the server's local timezone, not normalized to UTC yet.
