package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoad(t *testing.T) {
	t.Run("uses the defaults when no variable is set", func(t *testing.T) {
		cfg, err := Load()

		require.NoError(t, err)
		assert.Equal(t, Config{
			Server: Server{Addr: "localhost:8080"},
			DB: DB{
				Host:     "localhost",
				Port:     5432,
				User:     "homedash",
				Password: "homedash",
				Name:     "homedash",
				SSLMode:  "disable",
			},
		}, cfg)
	})

	t.Run("reads prefixed variables for each group", func(t *testing.T) {
		t.Setenv("HOMEDASH_SERVER_ADDR", ":9000")
		t.Setenv("HOMEDASH_DB_HOST", "db.lan")
		t.Setenv("HOMEDASH_DB_PORT", "6543")
		t.Setenv("HOMEDASH_DB_USER", "alice")
		t.Setenv("HOMEDASH_DB_PASSWORD", "s3cret")
		t.Setenv("HOMEDASH_DB_NAME", "home")
		t.Setenv("HOMEDASH_DB_SSLMODE", "require")

		cfg, err := Load()

		require.NoError(t, err)
		assert.Equal(t, ":9000", cfg.Server.Addr)
		assert.Equal(t, DB{Host: "db.lan", Port: 6543, User: "alice", Password: "s3cret", Name: "home", SSLMode: "require"}, cfg.DB)
	})

	t.Run("ignores variables without the HOMEDASH_ prefix", func(t *testing.T) {
		t.Setenv("DB_HOST", "elsewhere")

		cfg, err := Load()

		require.NoError(t, err)
		assert.Equal(t, "localhost", cfg.DB.Host)
	})

	t.Run("fails on a malformed value", func(t *testing.T) {
		t.Setenv("HOMEDASH_DB_PORT", "not-a-port")

		_, err := Load()

		assert.Error(t, err)
	})
}

func TestDB_DSN(t *testing.T) {
	t.Run("builds a postgres URL from the fields", func(t *testing.T) {
		db := DB{Host: "localhost", Port: 5432, User: "homedash", Password: "homedash", Name: "homedash", SSLMode: "disable"}

		assert.Equal(t, "postgres://homedash:homedash@localhost:5432/homedash?sslmode=disable", db.DSN())
	})

	t.Run("escapes special characters in the credentials", func(t *testing.T) {
		db := DB{Host: "localhost", Port: 5432, User: "home", Password: "p@ss/w:rd", Name: "homedash", SSLMode: "disable"}

		assert.Equal(t, "postgres://home:p%40ss%2Fw%3Ard@localhost:5432/homedash?sslmode=disable", db.DSN())
	})

	t.Run("brackets IPv6 hosts", func(t *testing.T) {
		db := DB{Host: "::1", Port: 5432, User: "homedash", Password: "homedash", Name: "homedash", SSLMode: "disable"}

		assert.Equal(t, "postgres://homedash:homedash@[::1]:5432/homedash?sslmode=disable", db.DSN())
	})
}
