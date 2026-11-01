package v1

import (
	"net/http"
	"testing"

	"github.com/danielgtaylor/huma/v2/humatest"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRegisterHealth(t *testing.T) {
	t.Run("GET /health reports ok and the running version", func(t *testing.T) {
		_, api := humatest.New(t)
		registerHealth(api, "1.2.3")

		resp := api.Get("/health")

		require.Equal(t, http.StatusOK, resp.Code, resp.Body.String())
		assert.Contains(t, resp.Body.String(), `"status":"ok"`)
		assert.Contains(t, resp.Body.String(), `"version":"1.2.3"`)
	})
}
