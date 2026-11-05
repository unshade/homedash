// Package webui serves the frontend (web/), built into dist/ by `task web:build`
// and embedded in the binary.
package webui

import (
	"bytes"
	"compress/gzip"
	"embed"
	"errors"
	"io/fs"
	"net/http"
	"path"
	"strings"
	"sync"
	"time"
)

//go:embed all:dist
var dist embed.FS

// contentSecurityPolicy only allows resources from our own origin. Styles may be
// inline because UI libraries set them at runtime; scripts may not.
const contentSecurityPolicy = "default-src 'self'; " +
	"script-src 'self'; " +
	"style-src 'self' 'unsafe-inline'; " +
	"img-src 'self' data:; " +
	"font-src 'self' data:; " +
	"connect-src 'self'; " +
	// The service worker and web app manifest that make the app installable.
	"worker-src 'self'; " +
	"manifest-src 'self'; " +
	"object-src 'none'; " +
	"base-uri 'self'; " +
	"form-action 'self'; " +
	"frame-ancestors 'none'"

// Handler serves the embedded frontend.
func Handler() http.Handler {
	sub, err := fs.Sub(dist, "dist")
	if err != nil {
		panic(err) // dist is embedded at compile time, so this cannot fail.
	}
	return NewHandler(sub)
}

// NewHandler serves the single-page app in fsys: existing files as they are,
// and index.html for any other path so client-side routes work on reload.
func NewHandler(fsys fs.FS) http.Handler {
	return &handler{fsys: fsys}
}

type handler struct {
	fsys fs.FS
	// gzipped caches the compressed content of text files by name: embedded
	// files never change, so each one is compressed at most once.
	gzipped sync.Map
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Security-Policy", contentSecurityPolicy)

	name := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
	if name == "" {
		name = "index.html"
	}

	// Unknown API paths must not get the app's HTML.
	if name == "api" || strings.HasPrefix(name, "api/") {
		http.NotFound(w, r)
		return
	}

	content, err := fs.ReadFile(h.fsys, name)
	switch {
	case err == nil:
		if strings.HasPrefix(name, "assets/") {
			// Vite puts a content hash in every asset name, so they never change.
			// Everything else, the service worker (sw.js) above all, must be
			// revalidated, or browsers would keep running an old version.
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			w.Header().Set("Cache-Control", "no-cache")
		}
		h.serve(w, r, name, content)
	case name != "index.html" && path.Ext(name) != "":
		// A missing file, not a page of the app.
		http.NotFound(w, r)
	default:
		h.serveIndex(w, r)
	}
}

func (h *handler) serveIndex(w http.ResponseWriter, r *http.Request) {
	content, err := fs.ReadFile(h.fsys, "index.html")
	if errors.Is(err, fs.ErrNotExist) {
		http.Error(w, "The frontend is not built: run `task web:build`, or `task dev` for development.", http.StatusServiceUnavailable)
		return
	}
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Cache-Control", "no-cache")
	h.serve(w, r, "index.html", content)
}

// minGzipSize is the size under which compressing is not worth it.
const minGzipSize = 1024

// compressible lists the extensions of text files worth compressing. Fonts and
// images are already compressed.
var compressible = map[string]bool{
	".html": true, ".js": true, ".css": true, ".svg": true, ".json": true, ".txt": true, ".webmanifest": true,
}

// contentTypes covers the extensions Go's mime package doesn't know.
var contentTypes = map[string]string{
	".webmanifest": "application/manifest+json",
}

// serve writes content with the Content-Type of name, gzipped when the file is
// compressible and the client accepts it. Embedded files have no modification
// time, so no Last-Modified header is sent.
func (h *handler) serve(w http.ResponseWriter, r *http.Request, name string, content []byte) {
	if contentType, ok := contentTypes[path.Ext(name)]; ok {
		w.Header().Set("Content-Type", contentType)
	}
	if compressible[path.Ext(name)] && len(content) >= minGzipSize {
		w.Header().Add("Vary", "Accept-Encoding")
		if acceptsGzip(r) {
			if gz, err := h.gzip(name, content); err == nil {
				w.Header().Set("Content-Encoding", "gzip")
				content = gz
			}
		}
	}
	http.ServeContent(w, r, name, time.Time{}, bytes.NewReader(content))
}

func (h *handler) gzip(name string, content []byte) ([]byte, error) {
	if cached, ok := h.gzipped.Load(name); ok {
		return cached.([]byte), nil
	}
	var buf bytes.Buffer
	zw, err := gzip.NewWriterLevel(&buf, gzip.BestCompression)
	if err != nil {
		return nil, err
	}
	if _, err := zw.Write(content); err != nil {
		return nil, err
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	h.gzipped.Store(name, buf.Bytes())
	return buf.Bytes(), nil
}

// acceptsGzip reports whether the Accept-Encoding header of r allows gzip.
func acceptsGzip(r *http.Request) bool {
	for _, header := range r.Header.Values("Accept-Encoding") {
		for _, part := range strings.Split(header, ",") {
			coding, params, _ := strings.Cut(strings.TrimSpace(part), ";")
			if strings.EqualFold(strings.TrimSpace(coding), "gzip") {
				return strings.ReplaceAll(params, " ", "") != "q=0"
			}
		}
	}
	return false
}
