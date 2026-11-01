package todo_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	"github.com/unshade/homedash/internal/todo"
	"github.com/unshade/homedash/internal/todo/mock"
)

var errStorage = errors.New("storage down")

func newService(t *testing.T) (*todo.Service, *mock.MockRepository) {
	t.Helper()
	repo := mock.NewMockRepository(gomock.NewController(t))
	return todo.NewService(repo), repo
}

func ptr[T any](v T) *T { return &v }

func TestService_Create(t *testing.T) {
	ctx := context.Background()

	t.Run("stores the todo with a trimmed title and returns it with its id", func(t *testing.T) {
		svc, repo := newService(t)
		due := time.Date(2026, 12, 24, 18, 0, 0, 0, time.UTC)

		repo.EXPECT().
			Create(ctx, &todo.Todo{Title: "Buy milk", Description: "2 liters", DueAt: &due}).
			DoAndReturn(func(_ context.Context, td *todo.Todo) error {
				td.ID = 1
				return nil
			})

		got, err := svc.Create(ctx, todo.CreateParams{Title: "  Buy milk  ", Description: "2 liters", DueAt: &due})

		require.NoError(t, err)
		assert.Equal(t, todo.Todo{ID: 1, Title: "Buy milk", Description: "2 liters", DueAt: &due}, got)
	})

	t.Run("rejects a blank title without touching the repository", func(t *testing.T) {
		svc, _ := newService(t)

		_, err := svc.Create(ctx, todo.CreateParams{Title: "   "})

		assert.ErrorIs(t, err, todo.ErrInvalid)
	})

	t.Run("rejects a title longer than the maximum length", func(t *testing.T) {
		svc, _ := newService(t)

		_, err := svc.Create(ctx, todo.CreateParams{Title: strings.Repeat("a", todo.MaxTitleLength+1)})

		assert.ErrorIs(t, err, todo.ErrInvalid)
	})

	t.Run("returns repository errors", func(t *testing.T) {
		svc, repo := newService(t)
		repo.EXPECT().Create(ctx, gomock.Any()).Return(errStorage)

		_, err := svc.Create(ctx, todo.CreateParams{Title: "Buy milk"})

		assert.ErrorIs(t, err, errStorage)
	})
}

func TestService_Get(t *testing.T) {
	ctx := context.Background()

	t.Run("returns the todo from the repository", func(t *testing.T) {
		svc, repo := newService(t)
		want := todo.Todo{ID: 1, Title: "Buy milk"}
		repo.EXPECT().Get(ctx, uint(1)).Return(want, nil)

		got, err := svc.Get(ctx, 1)

		require.NoError(t, err)
		assert.Equal(t, want, got)
	})

	t.Run("returns ErrNotFound when the todo does not exist", func(t *testing.T) {
		svc, repo := newService(t)
		repo.EXPECT().Get(ctx, uint(42)).Return(todo.Todo{}, todo.ErrNotFound)

		_, err := svc.Get(ctx, 42)

		assert.ErrorIs(t, err, todo.ErrNotFound)
	})
}

func TestService_List(t *testing.T) {
	ctx := context.Background()

	t.Run("returns every todo from the repository", func(t *testing.T) {
		svc, repo := newService(t)
		want := []todo.Todo{{ID: 1, Title: "Buy milk"}, {ID: 2, Title: "Wash the car"}}
		repo.EXPECT().List(ctx).Return(want, nil)

		got, err := svc.List(ctx)

		require.NoError(t, err)
		assert.Equal(t, want, got)
	})
}

func TestService_Update(t *testing.T) {
	ctx := context.Background()
	existing := todo.Todo{ID: 1, Title: "Buy milk", Description: "2 liters"}

	t.Run("changes only the given fields", func(t *testing.T) {
		svc, repo := newService(t)
		want := todo.Todo{ID: 1, Title: "Buy milk", Description: "2 liters", Done: true}
		repo.EXPECT().Get(ctx, uint(1)).Return(existing, nil)
		repo.EXPECT().Update(ctx, &want).Return(nil)

		got, err := svc.Update(ctx, 1, todo.UpdateParams{Done: ptr(true)})

		require.NoError(t, err)
		assert.Equal(t, want, got)
	})

	t.Run("sets the due date", func(t *testing.T) {
		svc, repo := newService(t)
		due := time.Date(2026, 12, 24, 18, 0, 0, 0, time.UTC)
		repo.EXPECT().Get(ctx, uint(1)).Return(existing, nil)
		repo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		got, err := svc.Update(ctx, 1, todo.UpdateParams{SetDueAt: true, DueAt: &due})

		require.NoError(t, err)
		assert.Equal(t, &due, got.DueAt)
	})

	t.Run("clears the due date when it is set to nil", func(t *testing.T) {
		svc, repo := newService(t)
		due := time.Date(2026, 12, 24, 18, 0, 0, 0, time.UTC)
		withDue := existing
		withDue.DueAt = &due
		repo.EXPECT().Get(ctx, uint(1)).Return(withDue, nil)
		repo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		got, err := svc.Update(ctx, 1, todo.UpdateParams{SetDueAt: true, DueAt: nil})

		require.NoError(t, err)
		assert.Nil(t, got.DueAt)
	})

	t.Run("keeps the due date when it is not set", func(t *testing.T) {
		svc, repo := newService(t)
		due := time.Date(2026, 12, 24, 18, 0, 0, 0, time.UTC)
		withDue := existing
		withDue.DueAt = &due
		repo.EXPECT().Get(ctx, uint(1)).Return(withDue, nil)
		repo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		got, err := svc.Update(ctx, 1, todo.UpdateParams{Done: ptr(true)})

		require.NoError(t, err)
		assert.Equal(t, &due, got.DueAt)
	})

	t.Run("trims the new title", func(t *testing.T) {
		svc, repo := newService(t)
		repo.EXPECT().Get(ctx, uint(1)).Return(existing, nil)
		repo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		got, err := svc.Update(ctx, 1, todo.UpdateParams{Title: ptr("  Buy oat milk ")})

		require.NoError(t, err)
		assert.Equal(t, "Buy oat milk", got.Title)
	})

	t.Run("rejects a blank title without saving", func(t *testing.T) {
		svc, repo := newService(t)
		repo.EXPECT().Get(ctx, uint(1)).Return(existing, nil)

		_, err := svc.Update(ctx, 1, todo.UpdateParams{Title: ptr(" ")})

		assert.ErrorIs(t, err, todo.ErrInvalid)
	})

	t.Run("returns ErrNotFound when the todo does not exist", func(t *testing.T) {
		svc, repo := newService(t)
		repo.EXPECT().Get(ctx, uint(42)).Return(todo.Todo{}, todo.ErrNotFound)

		_, err := svc.Update(ctx, 42, todo.UpdateParams{Done: ptr(true)})

		assert.ErrorIs(t, err, todo.ErrNotFound)
	})
}

func TestService_Delete(t *testing.T) {
	ctx := context.Background()

	t.Run("deletes the todo in the repository", func(t *testing.T) {
		svc, repo := newService(t)
		repo.EXPECT().Delete(ctx, uint(1)).Return(nil)

		assert.NoError(t, svc.Delete(ctx, 1))
	})

	t.Run("returns ErrNotFound when the todo does not exist", func(t *testing.T) {
		svc, repo := newService(t)
		repo.EXPECT().Delete(ctx, uint(42)).Return(todo.ErrNotFound)

		assert.ErrorIs(t, svc.Delete(ctx, 42), todo.ErrNotFound)
	})
}
