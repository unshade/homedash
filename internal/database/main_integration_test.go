//go:build integration

package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"testing"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"gorm.io/gorm"
)

// testDB is a migrated database shared by every integration test of the package.
var testDB *gorm.DB

func TestMain(m *testing.M) {
	os.Exit(run(m))
}

func run(m *testing.M) int {
	ctx := context.Background()

	container, err := postgres.Run(ctx, "postgres:18-alpine",
		postgres.WithDatabase("homedash"),
		postgres.WithUsername("homedash"),
		postgres.WithPassword("homedash"),
		postgres.BasicWaitStrategies(),
	)
	defer func() {
		if err := testcontainers.TerminateContainer(container); err != nil {
			log.Printf("terminate postgres container: %v", err)
		}
	}()
	if err != nil {
		log.Printf("start postgres container: %v", err)
		return 1
	}

	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		log.Printf("postgres connection string: %v", err)
		return 1
	}
	if testDB, err = Open(dsn); err != nil {
		log.Print(err)
		return 1
	}
	if err := Migrate(ctx, testDB); err != nil {
		log.Print(err)
		return 1
	}

	return m.Run()
}

// resetTables empties the given tables before a test.
func resetTables(t *testing.T, tables ...string) {
	t.Helper()
	for _, table := range tables {
		if err := testDB.Exec(fmt.Sprintf("TRUNCATE TABLE %s RESTART IDENTITY CASCADE", table)).Error; err != nil {
			t.Fatalf("truncate %s: %v", table, err)
		}
	}
}
