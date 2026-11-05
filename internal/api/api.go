// Package api exposes the homedash HTTP API, built with Huma.
package api

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"

	v1 "github.com/unshade/homedash/internal/api/v1"
)

func init() {
	// Our handlers never return a null list, so lists are not nullable in the
	// OpenAPI document, and generated clients don't have to check for null.
	huma.DefaultArrayNullable = false
}

// Register adds the API, its OpenAPI spec (/openapi.json) and docs (/docs) to mux.
// Each API version is mounted under its own /api/vN prefix.
func Register(mux *http.ServeMux, deps v1.Dependencies) huma.API {
	api := humago.New(mux, huma.DefaultConfig("homedash API", deps.Version))

	v1.Register(huma.NewGroup(api, "/api/v1"), deps)

	return api
}

// OpenAPI returns the OpenAPI 3.1 document of the API, without serving it.
func OpenAPI(version string) *huma.OpenAPI {
	return Register(http.NewServeMux(), v1.Dependencies{Version: version}).OpenAPI()
}
