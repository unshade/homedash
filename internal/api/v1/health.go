package v1

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
)

type HealthOutput struct {
	Body struct {
		Status  string `json:"status" example:"ok" doc:"Service status"`
		Version string `json:"version" example:"1.0.0" doc:"Running homedash version"`
	}
}

func registerHealth(api huma.API, version string) {
	huma.Register(api, huma.Operation{
		OperationID: "get-health",
		Method:      http.MethodGet,
		Path:        "/health",
		Summary:     "Health check",
		Tags:        []string{"system"},
	}, func(ctx context.Context, _ *struct{}) (*HealthOutput, error) {
		out := &HealthOutput{}
		out.Body.Status = "ok"
		out.Body.Version = version
		return out, nil
	})
}
