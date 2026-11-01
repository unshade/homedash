// Package api exposes the homedash HTTP API, built with Huma.
package api

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"

	v1 "github.com/unshade/homedash/internal/api/v1"
)

// NewHandler builds the HTTP handler serving the API, its OpenAPI spec (/openapi.json) and docs (/docs).
// Each API version is mounted under its own /api/vN prefix.
func NewHandler(deps v1.Dependencies) http.Handler {
	mux := http.NewServeMux()
	api := humago.New(mux, huma.DefaultConfig("homedash API", deps.Version))

	v1.Register(huma.NewGroup(api, "/api/v1"), deps)

	return mux
}
