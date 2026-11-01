//go:build integration

package database

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/unshade/homedash/internal/todo"
)

func newTestTodoRepository(t *testing.T) *TodoRepository {
	t.Helper()
	resetTables(t, "todos")
	return NewTodoRepository(testDB)
}

func TestTodoRepository_Create(t *testing.T) {
	ctx := context.Background()

	t.Run("persists the todo and fills its id and timestamps", func(t *testing.T) {
		repo := newTestTodoRepository(t)
		due := time.Date(2026, 12, 24, 18, 0, 0, 0, time.UTC)
		td := todo.Todo{Title: "Buy milk", Description: "2 liters", DueAt: &due}

		require.NoError(t, repo.Create(ctx, &td))

		assert.NotZero(t, td.ID)
		assert.False(t, td.CreatedAt.IsZero())
		assert.False(t, td.UpdatedAt.IsZero())

		stored, err := repo.Get(ctx, td.ID)
		require.NoError(t, err)
		assert.Equal(t, "Buy milk", stored.Title)
		assert.Equal(t, "2 liters", stored.Description)
		require.NotNil(t, stored.DueAt)
		assert.True(t, due.Equal(*stored.DueAt))
	})
}

func TestTodoRepository_Get(t *testing.T) {
	ctx := context.Background()

	t.Run("returns ErrNotFound for a missing todo", func(t *testing.T) {
		repo := newTestTodoRepository(t)

		_, err := repo.Get(ctx, 42)

		assert.ErrorIs(t, err, todo.ErrNotFound)
	})
}

func TestTodoRepository_List(t *testing.T) {
	ctx := context.Background()

	t.Run("returns an empty list when there are no todos", func(t *testing.T) {
		repo := newTestTodoRepository(t)

		got, err := repo.List(ctx)

		require.NoError(t, err)
		assert.Empty(t, got)
	})

	t.Run("returns every todo ordered by id", func(t *testing.T) {
		repo := newTestTodoRepository(t)
		require.NoError(t, repo.Create(ctx, &todo.Todo{Title: "Buy milk"}))
		require.NoError(t, repo.Create(ctx, &todo.Todo{Title: "Wash the car"}))

		got, err := repo.List(ctx)

		require.NoError(t, err)
		require.Len(t, got, 2)
		assert.Equal(t, "Buy milk", got[0].Title)
		assert.Equal(t, "Wash the car", got[1].Title)
	})
}

func TestTodoRepository_Update(t *testing.T) {
	ctx := context.Background()

	t.Run("writes every field, including zero values", func(t *testing.T) {
		repo := newTestTodoRepository(t)
		td := todo.Todo{Title: "Buy milk", Description: "2 liters", Done: true}
		require.NoError(t, repo.Create(ctx, &td))

		td.Title = "Buy oat milk"
		td.Description = ""
		td.Done = false
		require.NoError(t, repo.Update(ctx, &td))

		stored, err := repo.Get(ctx, td.ID)
		require.NoError(t, err)
		assert.Equal(t, "Buy oat milk", stored.Title)
		assert.Empty(t, stored.Description)
		assert.False(t, stored.Done)
		assert.False(t, stored.UpdatedAt.Before(stored.CreatedAt))
	})

	t.Run("clears the due date when it is nil", func(t *testing.T) {
		repo := newTestTodoRepository(t)
		due := time.Date(2026, 12, 24, 18, 0, 0, 0, time.UTC)
		td := todo.Todo{Title: "Buy milk", DueAt: &due}
		require.NoError(t, repo.Create(ctx, &td))

		td.DueAt = nil
		require.NoError(t, repo.Update(ctx, &td))

		stored, err := repo.Get(ctx, td.ID)
		require.NoError(t, err)
		assert.Nil(t, stored.DueAt)
	})

	t.Run("returns ErrNotFound for a missing todo", func(t *testing.T) {
		repo := newTestTodoRepository(t)

		err := repo.Update(ctx, &todo.Todo{ID: 42, Title: "Ghost"})

		assert.ErrorIs(t, err, todo.ErrNotFound)
	})
}

func TestTodoRepository_Delete(t *testing.T) {
	ctx := context.Background()

	t.Run("removes the todo", func(t *testing.T) {
		repo := newTestTodoRepository(t)
		td := todo.Todo{Title: "Buy milk"}
		require.NoError(t, repo.Create(ctx, &td))

		require.NoError(t, repo.Delete(ctx, td.ID))

		_, err := repo.Get(ctx, td.ID)
		assert.ErrorIs(t, err, todo.ErrNotFound)
	})

	t.Run("returns ErrNotFound for a missing todo", func(t *testing.T) {
		repo := newTestTodoRepository(t)

		assert.ErrorIs(t, repo.Delete(ctx, 42), todo.ErrNotFound)
	})
}
