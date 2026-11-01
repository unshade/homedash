// Package database holds the GORM (PostgreSQL) implementations of the domain repositories.
package database

import (
	"context"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Open connects to the PostgreSQL database at dsn.
func Open(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{TranslateError: true})
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}
	return db, nil
}

// Migrate creates or updates the tables for every model.
func Migrate(ctx context.Context, db *gorm.DB) error {
	if err := db.WithContext(ctx).AutoMigrate(&todoRow{}); err != nil {
		return fmt.Errorf("migrate database: %w", err)
	}
	return nil
}
