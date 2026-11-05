package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	v1 "github.com/unshade/homedash/internal/api/v1"
)

func TestRegister(t *testing.T) {
	t.Run("serves the v1 routes under /api/v1", func(t *testing.T) {
		mux := http.NewServeMux()
		Register(mux, v1.Dependencies{Version: "test"})
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/health", nil))

		assert.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
	})
}

func TestOpenAPI(t *testing.T) {
	t.Run("describes the v1 routes and the given version", func(t *testing.T) {
		doc := OpenAPI("1.2.3")

		require.NotNil(t, doc.Info)
		assert.Equal(t, "1.2.3", doc.Info.Version)
		assert.Contains(t, doc.Paths, "/api/v1/todos")
		assert.Contains(t, doc.Paths, "/api/v1/todos/{id}")
	})
}
