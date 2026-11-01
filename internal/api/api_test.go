package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	v1 "github.com/unshade/homedash/internal/api/v1"
)

func TestNewHandler(t *testing.T) {
	t.Run("serves the v1 routes under /api/v1", func(t *testing.T) {
		rec := httptest.NewRecorder()

		NewHandler(v1.Dependencies{Version: "test"}).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/health", nil))

		assert.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
	})
}
