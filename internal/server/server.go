// Package server assembles the HTTP handler of homedash.
package server

import (
	"net/http"

	"github.com/unshade/homedash/internal/api"
	v1 "github.com/unshade/homedash/internal/api/v1"
)

// New returns the handler serving the API (/api/..., /docs, /openapi.json) and,
// for every other path, frontend.
func New(deps v1.Dependencies, frontend http.Handler) http.Handler {
	mux := http.NewServeMux()
	api.Register(mux, deps)
	mux.Handle("/", frontend)
	return securityHeaders(mux)
}

// securityHeaders sets the headers every response gets, API included.
// The frontend adds its own Content-Security-Policy (see internal/webui).
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "no-referrer")
		h.Set("Cross-Origin-Opener-Policy", "same-origin")
		h.Set("Cross-Origin-Resource-Policy", "same-origin")
		h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()")
		next.ServeHTTP(w, r)
	})
}
