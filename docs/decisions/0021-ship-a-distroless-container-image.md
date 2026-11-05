# 21. Ship a distroless container image

Date: 2026-11-05

## Status

Accepted

## Context

Self-hosters run services as containers. The author wants a Docker image built in two stages or more, with a production image that is distroless, runs as a non-root user and contains nothing but the binary.

homedash is a single static Go binary with the frontend embedded (ADR 13, ADR 15), so the runtime needs no libraries, shell or package manager. Home servers are often ARM (Raspberry Pi) as well as x86.

## Decision

- `Dockerfile` with three stages:
  1. `web`: Node (`node:24-trixie-slim`) runs `npm ci` and builds the frontend into `internal/webui/dist`.
  2. `build`: Go (`golang:1.27.3-trixie`) compiles a static binary (`CGO_ENABLED=0`, `-trimpath`, stripped, version set through `-ldflags`) with the frontend embedded.
  3. runtime: `gcr.io/distroless/static-debian13:nonroot`, with only `/homedash` copied in. It runs as `nonroot` (UID 65532), listens on `:8080` (`HOMEDASH_SERVER_ADDR`) and starts `homedash serve`.
- The build stages run on the builder's platform and cross-compile (`$BUILDPLATFORM`, `GOOS`/`GOARCH`), so the `linux/amd64` and `linux/arm64` images build without emulation.
- Base images are pinned by digest. `.dockerignore` admits only the sources the build needs.
- CI builds the image on every pull request (`task docker:build`). After a release (ADR 20), it pushes `ghcr.io/unshade/homedash` tagged `X.Y.Z`, `X.Y` and `latest` (`task docker:push`).
- The license terms and Required Notice travel as OCI labels (`org.opencontainers.image.licenses`, `description`), since the image holds no other file.

## Consequences

- The image is about 19 MB; it has no shell, so `docker exec ... sh` is impossible. Debug with the logs, or with `docker run --entrypoint /homedash <image> version`.
- distroless `static` still carries its base files: CA certificates, time zones and the `nonroot` user. That is the minimum a Go server needs (TLS to an external database, time zones).
- Pinned digests don't update themselves: bump them (and the Go and Node versions) together with `go.mod`'s toolchain and `web/.nvmrc`.
- There is no `HEALTHCHECK`: distroless has no curl, and Compose or Kubernetes can probe `GET /api/v1/health` themselves.
- The package on ghcr.io is private after its first push until it is made public in the package settings.
