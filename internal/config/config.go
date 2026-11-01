// Package config loads the homedash configuration from environment variables.
//
// Every variable is prefixed with HOMEDASH_, then with the prefix of its group,
// e.g. HOMEDASH_DB_HOST or HOMEDASH_SERVER_ADDR.
package config

import (
	"fmt"
	"net"
	"net/url"
	"strconv"

	"github.com/caarlos0/env/v11"
)

// Prefix is prepended to every environment variable.
const Prefix = "HOMEDASH_"

// Config is the whole homedash configuration.
type Config struct {
	Server Server `envPrefix:"SERVER_"`
	DB     DB     `envPrefix:"DB_"`
}

// Server configures the HTTP server.
type Server struct {
	Addr string `env:"ADDR" envDefault:"localhost:8080"`
}

// DB configures the PostgreSQL connection. Defaults match .dev/compose.yaml.
type DB struct {
	Host     string `env:"HOST" envDefault:"localhost"`
	Port     int    `env:"PORT" envDefault:"5432"`
	User     string `env:"USER" envDefault:"homedash"`
	Password string `env:"PASSWORD" envDefault:"homedash"`
	Name     string `env:"NAME" envDefault:"homedash"`
	SSLMode  string `env:"SSLMODE" envDefault:"disable"`
}

// DSN returns the PostgreSQL connection URL.
func (db DB) DSN() string {
	u := url.URL{
		Scheme:   "postgres",
		User:     url.UserPassword(db.User, db.Password),
		Host:     net.JoinHostPort(db.Host, strconv.Itoa(db.Port)),
		Path:     db.Name,
		RawQuery: url.Values{"sslmode": {db.SSLMode}}.Encode(),
	}
	return u.String()
}

// Load reads the configuration from the environment, applying defaults for unset variables.
func Load() (Config, error) {
	cfg, err := env.ParseAsWithOptions[Config](env.Options{Prefix: Prefix})
	if err != nil {
		return Config{}, fmt.Errorf("load config: %w", err)
	}
	return cfg, nil
}
