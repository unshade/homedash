// Package v1 holds the v1 routes of the homedash API, mounted under /api/v1.
package v1

import (
	"github.com/danielgtaylor/huma/v2"

	"github.com/unshade/homedash/internal/todo"
)

// Dependencies are the services the v1 routes rely on.
type Dependencies struct {
	Version string
	Todos   *todo.Service
}

// Register adds every v1 operation to api. Paths are relative to the version prefix.
func Register(api huma.API, deps Dependencies) {
	registerHealth(api, deps.Version)
	registerTodos(api, deps.Todos)
}
