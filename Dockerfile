# syntax=docker/dockerfile:1

# homedash container image (ADR 21). Build with `task docker:build`; CI
# publishes it with `task docker:push`.
#
# Two build stages and one runtime stage. The build stages run on the
# builder's own platform and cross-compile, so building the arm64 image on an
# amd64 machine (or the reverse) needs no emulation. The runtime image is
# distroless, runs as a non-root user and holds only the static binary.

# --- 1. Frontend: build the React app into internal/webui/dist ---------------
FROM --platform=$BUILDPLATFORM node:24-trixie-slim@sha256:0820eaa85e07d0490446dd01d14707e17e6108a36988cf374899cd057eb3812d AS web
WORKDIR /src/web
# Dependencies first, so this layer is reused until the lockfile changes.
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# --- 2. Backend: compile one static binary with the frontend embedded ---------
FROM --platform=$BUILDPLATFORM golang:1.27.3-trixie@sha256:2336eda24930976591abea806d9b7d99eeae38238f19755c5deec02facdc1594 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
COPY cmd/ cmd/
COPY internal/ internal/
COPY --from=web /src/internal/webui/dist/ internal/webui/dist/
ARG TARGETOS TARGETARCH
ARG VERSION=dev
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -ldflags "-s -w -X github.com/unshade/homedash/cmd.Version=${VERSION}" -o /out/homedash .

# --- 3. Runtime: distroless, non-root, the binary only ------------------------
FROM gcr.io/distroless/static-debian13:nonroot@sha256:25ac8f0c3b2334a9eb05452266bd4697864a8c8ef0ef71e5e6480d7f92868329
ARG VERSION=dev
ARG REVISION=unknown
# The license travels with the image as metadata (PolyForm Noncommercial asks
# that every copy carries its terms and the Required Notice).
LABEL org.opencontainers.image.title="homedash" \
      org.opencontainers.image.description="A self-hostable dashboard for everything at home. Required Notice: Copyright (c) 2026 Noé Steiner (https://github.com/unshade/homedash)" \
      org.opencontainers.image.source="https://github.com/unshade/homedash" \
      org.opencontainers.image.licenses="PolyForm-Noncommercial-1.0.0" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}"
COPY --from=build /out/homedash /homedash
# Listen on every interface inside the container (the binary's default is localhost).
ENV HOMEDASH_SERVER_ADDR=:8080
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/homedash"]
CMD ["serve"]
