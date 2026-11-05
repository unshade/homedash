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

	v1 "github.com/unshade/homedash/internal/api/v1"
	"github.com/unshade/homedash/internal/config"
	"github.com/unshade/homedash/internal/database"
	"github.com/unshade/homedash/internal/server"
	"github.com/unshade/homedash/internal/todo"
	"github.com/unshade/homedash/internal/webui"
)

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the homedash server (API and web interface)",
	Long:  "Start the homedash server: the HTTP API and the embedded web interface. It is configured through HOMEDASH_* environment variables (see internal/config).",
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
		defer func() {
			if err := sqlDB.Close(); err != nil {
				slog.Error("close database", "err", err)
			}
		}()

		if err := database.Migrate(ctx, db); err != nil {
			return err
		}

		srv := &http.Server{
			Addr: cfg.Server.Addr,
			Handler: server.New(v1.Dependencies{
				Version: Version,
				Todos:   todo.NewService(database.NewTodoRepository(db)),
			}, webui.Handler()),
			ReadHeaderTimeout: 10 * time.Second,
			ReadTimeout:       30 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       2 * time.Minute,
		}

		errCh := make(chan error, 1)
		go func() {
			slog.Info("homedash listening", "url", "http://"+cfg.Server.Addr, "docs", "http://"+cfg.Server.Addr+"/docs")
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
