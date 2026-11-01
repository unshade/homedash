package cmd

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/spf13/cobra"

	"github.com/unshade/homedash/internal/api"
	v1 "github.com/unshade/homedash/internal/api/v1"
	"github.com/unshade/homedash/internal/config"
	"github.com/unshade/homedash/internal/database"
	"github.com/unshade/homedash/internal/todo"
)

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the homedash HTTP API",
	Long:  "Start the homedash HTTP API. It is configured through HOMEDASH_* environment variables (see internal/config).",
	RunE: func(cmd *cobra.Command, _ []string) error {
		ctx, stop := signal.NotifyContext(cmd.Context(), syscall.SIGINT, syscall.SIGTERM)
		defer stop()

		cfg, err := config.Load()
		if err != nil {
			return err
		}

		db, err := database.Open(cfg.DB.DSN())
		if err != nil {
			return err
		}
		sqlDB, err := db.DB()
		if err != nil {
			return err
		}
		defer sqlDB.Close()

		if err := database.Migrate(ctx, db); err != nil {
			return err
		}

		srv := &http.Server{
			Addr: cfg.Server.Addr,
			Handler: api.NewHandler(v1.Dependencies{
				Version: Version,
				Todos:   todo.NewService(database.NewTodoRepository(db)),
			}),
			ReadHeaderTimeout: 10 * time.Second,
		}

		errCh := make(chan error, 1)
		go func() {
			slog.Info("homedash listening", "addr", cfg.Server.Addr, "docs", "http://"+cfg.Server.Addr+"/docs")
			errCh <- srv.ListenAndServe()
		}()

		select {
		case err := <-errCh:
			if !errors.Is(err, http.ErrServerClosed) {
				return err
			}
			return nil
		case <-ctx.Done():
			slog.Info("shutting down")
			shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			return srv.Shutdown(shutdownCtx)
		}
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)
}
