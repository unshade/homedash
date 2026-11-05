package server

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	v1 "github.com/unshade/homedash/internal/api/v1"
)

var frontend = http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
	_, _ = w.Write([]byte("frontend"))
})

func TestNew(t *testing.T) {
	handler := New(v1.Dependencies{Version: "test"}, frontend)

	serve := func(method, target string) *httptest.ResponseRecorder {
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, httptest.NewRequest(method, target, nil))
		return rec
	}

	t.Run("routes /api to the API", func(t *testing.T) {
		rec := serve(http.MethodGet, "/api/v1/health")

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), `"status":"ok"`)
	})

	t.Run("serves the OpenAPI document", func(t *testing.T) {
		rec := serve(http.MethodGet, "/openapi.json")

		assert.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("routes every other path to the frontend", func(t *testing.T) {
		for _, target := range []string{"/", "/todos", "/assets/app.js"} {
			rec := serve(http.MethodGet, target)

			assert.Equal(t, "frontend", rec.Body.String(), target)
		}
	})

	t.Run("sets the security headers on every response", func(t *testing.T) {
		for _, target := range []string{"/api/v1/health", "/"} {
			rec := serve(http.MethodGet, target)

			assert.Equal(t, "nosniff", rec.Header().Get("X-Content-Type-Options"), target)
			assert.Equal(t, "DENY", rec.Header().Get("X-Frame-Options"), target)
			assert.Equal(t, "no-referrer", rec.Header().Get("Referrer-Policy"), target)
		}
	})
}
