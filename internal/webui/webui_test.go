package webui

import (
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var bigScript = strings.Repeat("console.log('homedash');\n", 200)

var app = fstest.MapFS{
	"index.html":           {Data: []byte("<!doctype html><title>homedash</title>")},
	"assets/big-3c4d.js":   {Data: []byte(bigScript)},
	"favicon.svg":          {Data: []byte("<svg></svg>")},
	"assets/app-1a2b.js":   {Data: []byte("console.log(1)")},
	"sw.js":                {Data: []byte("self.skipWaiting()")},
	"manifest.webmanifest": {Data: []byte(`{"name":"homedash"}`)},
}

func request(h http.Handler, method, target string, headers ...string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(method, target, nil)
	for i := 0; i+1 < len(headers); i += 2 {
		req.Header.Set(headers[i], headers[i+1])
	}
	h.ServeHTTP(rec, req)
	return rec
}

func TestNewHandler(t *testing.T) {
	h := NewHandler(app)

	t.Run("serves index.html at the root", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/")

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), "<title>homedash</title>")
		assert.Contains(t, rec.Header().Get("Content-Type"), "text/html")
		assert.Equal(t, "no-cache", rec.Header().Get("Cache-Control"))
	})

	t.Run("serves index.html for client-side routes", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/todos/42")

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), "<title>homedash</title>")
	})

	t.Run("serves hashed assets with a long cache lifetime", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/assets/app-1a2b.js")

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "console.log(1)", rec.Body.String())
		assert.Equal(t, "public, max-age=31536000, immutable", rec.Header().Get("Cache-Control"))
	})

	t.Run("serves other files without caching them", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/favicon.svg")

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "no-cache", rec.Header().Get("Cache-Control"))
	})

	t.Run("serves the service worker without caching it", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/sw.js")

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "no-cache", rec.Header().Get("Cache-Control"))
		assert.Contains(t, rec.Header().Get("Content-Type"), "javascript")
	})

	t.Run("serves the web app manifest with its media type", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/manifest.webmanifest")

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "application/manifest+json", rec.Header().Get("Content-Type"))
	})

	t.Run("returns 404 for a missing file", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/assets/missing.js")

		assert.Equal(t, http.StatusNotFound, rec.Code)
	})

	t.Run("returns 404 for unknown API paths instead of the app", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/api/v9/nothing")

		assert.Equal(t, http.StatusNotFound, rec.Code)
		assert.NotContains(t, rec.Body.String(), "<title>homedash</title>")
	})

	t.Run("never serves files outside the app", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/../../etc/passwd")

		// The path is cleaned to /etc/passwd, a client-side route of the app.
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), "<title>homedash</title>")
		assert.NotContains(t, rec.Body.String(), "root:")
	})

	t.Run("rejects methods other than GET and HEAD", func(t *testing.T) {
		rec := request(h, http.MethodPost, "/")

		assert.Equal(t, http.StatusMethodNotAllowed, rec.Code)
		assert.Equal(t, "GET, HEAD", rec.Header().Get("Allow"))
	})

	t.Run("sets a strict Content-Security-Policy", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/")

		csp := rec.Header().Get("Content-Security-Policy")
		assert.Contains(t, csp, "script-src 'self';")
		assert.Contains(t, csp, "frame-ancestors 'none'")
	})

	t.Run("explains how to build the frontend when it is missing", func(t *testing.T) {
		rec := request(NewHandler(fstest.MapFS{}), http.MethodGet, "/")

		assert.Equal(t, http.StatusServiceUnavailable, rec.Code)
		assert.Contains(t, rec.Body.String(), "task web:build")
	})
}

func TestNewHandler_gzip(t *testing.T) {
	h := NewHandler(app)

	t.Run("gzips large text files when the client accepts it", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/assets/big-3c4d.js", "Accept-Encoding", "br, gzip")

		require.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "gzip", rec.Header().Get("Content-Encoding"))
		assert.Equal(t, "Accept-Encoding", rec.Header().Get("Vary"))
		assert.Contains(t, rec.Header().Get("Content-Type"), "javascript")
		zr, err := gzip.NewReader(rec.Body)
		require.NoError(t, err)
		body, err := io.ReadAll(zr)
		require.NoError(t, err)
		assert.Equal(t, bigScript, string(body))
	})

	t.Run("sends large text files uncompressed to clients without gzip", func(t *testing.T) {
		for _, accept := range []string{"", "br", "gzip;q=0"} {
			rec := request(h, http.MethodGet, "/assets/big-3c4d.js", "Accept-Encoding", accept)

			assert.Empty(t, rec.Header().Get("Content-Encoding"), accept)
			assert.Equal(t, bigScript, rec.Body.String(), accept)
		}
	})

	t.Run("does not compress small files", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/assets/app-1a2b.js", "Accept-Encoding", "gzip")

		assert.Empty(t, rec.Header().Get("Content-Encoding"))
		assert.Equal(t, "console.log(1)", rec.Body.String())
	})
}

func TestHandler(t *testing.T) {
	t.Run("serves the embedded frontend", func(t *testing.T) {
		rec := request(Handler(), http.MethodGet, "/")

		// 200 once `task web:build` ran, 503 with only the placeholder.
		assert.Contains(t, []int{http.StatusOK, http.StatusServiceUnavailable}, rec.Code)
	})
}
