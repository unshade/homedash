// Package v1 holds the v1 routes of the homedash API, mounted under /api/v1.
package v1

import "github.com/danielgtaylor/huma/v2"

// Register adds every v1 operation to api. Paths are relative to the version prefix.
func Register(api huma.API, version string) {
	registerHealth(api, version)
}
