package v1

import (
	"net/http"
	"testing"
	"time"

	"github.com/danielgtaylor/huma/v2/humatest"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	"github.com/unshade/homedash/internal/todo"
	"github.com/unshade/homedash/internal/todo/mock"
)

func newTodosAPI(t *testing.T) (humatest.TestAPI, *mock.MockRepository) {
	t.Helper()
	repo := mock.NewMockRepository(gomock.NewController(t))
	_, api := humatest.New(t)
	registerTodos(api, todo.NewService(repo))
	return api, repo
}

func TestRegisterTodos(t *testing.T) {
	t.Run("GET /todos returns every todo", func(t *testing.T) {
		api, repo := newTodosAPI(t)
		repo.EXPECT().List(gomock.Any()).Return([]todo.Todo{{ID: 1, Title: "Buy milk"}}, nil)

		resp := api.Get("/todos")

		require.Equal(t, http.StatusOK, resp.Code, resp.Body.String())
		assert.Contains(t, resp.Body.String(), `"title":"Buy milk"`)
	})

	t.Run("POST /todos creates a todo and returns 201", func(t *testing.T) {
		api, repo := newTodosAPI(t)
		repo.EXPECT().Create(gomock.Any(), gomock.Any()).
			DoAndReturn(func(_ any, td *todo.Todo) error {
				td.ID = 7
				return nil
			})

		resp := api.Post("/todos", map[string]any{"title": "Buy milk"})

		require.Equal(t, http.StatusCreated, resp.Code, resp.Body.String())
		assert.Contains(t, resp.Body.String(), `"id":7`)
	})

	t.Run("POST /todos rejects an empty title with 422", func(t *testing.T) {
		api, _ := newTodosAPI(t)

		resp := api.Post("/todos", map[string]any{"title": ""})

		assert.Equal(t, http.StatusUnprocessableEntity, resp.Code, resp.Body.String())
	})

	t.Run("POST /todos rejects a blank title with 422", func(t *testing.T) {
		api, _ := newTodosAPI(t)

		resp := api.Post("/todos", map[string]any{"title": "   "})

		assert.Equal(t, http.StatusUnprocessableEntity, resp.Code, resp.Body.String())
	})

	t.Run("GET /todos/{id} returns 404 for a missing todo", func(t *testing.T) {
		api, repo := newTodosAPI(t)
		repo.EXPECT().Get(gomock.Any(), uint(42)).Return(todo.Todo{}, todo.ErrNotFound)

		resp := api.Get("/todos/42")

		assert.Equal(t, http.StatusNotFound, resp.Code, resp.Body.String())
	})

	t.Run("PATCH /todos/{id} marks a todo as done", func(t *testing.T) {
		api, repo := newTodosAPI(t)
		repo.EXPECT().Get(gomock.Any(), uint(1)).Return(todo.Todo{ID: 1, Title: "Buy milk"}, nil)
		repo.EXPECT().Update(gomock.Any(), &todo.Todo{ID: 1, Title: "Buy milk", Done: true}).Return(nil)

		resp := api.Patch("/todos/1", map[string]any{"done": true})

		require.Equal(t, http.StatusOK, resp.Code, resp.Body.String())
		assert.Contains(t, resp.Body.String(), `"done":true`)
	})

	t.Run("PATCH /todos/{id} removes the due date when dueAt is null", func(t *testing.T) {
		api, repo := newTodosAPI(t)
		due := time.Date(2026, 12, 24, 18, 0, 0, 0, time.UTC)
		repo.EXPECT().Get(gomock.Any(), uint(1)).Return(todo.Todo{ID: 1, Title: "Buy milk", DueAt: &due}, nil)
		repo.EXPECT().Update(gomock.Any(), &todo.Todo{ID: 1, Title: "Buy milk"}).Return(nil)

		resp := api.Patch("/todos/1", map[string]any{"dueAt": nil})

		require.Equal(t, http.StatusOK, resp.Code, resp.Body.String())
		assert.NotContains(t, resp.Body.String(), "dueAt")
	})

	t.Run("PATCH /todos/{id} keeps the due date when dueAt is omitted", func(t *testing.T) {
		api, repo := newTodosAPI(t)
		due := time.Date(2026, 12, 24, 18, 0, 0, 0, time.UTC)
		repo.EXPECT().Get(gomock.Any(), uint(1)).Return(todo.Todo{ID: 1, Title: "Buy milk", DueAt: &due}, nil)
		repo.EXPECT().Update(gomock.Any(), &todo.Todo{ID: 1, Title: "Buy milk", DueAt: &due, Done: true}).Return(nil)

		resp := api.Patch("/todos/1", map[string]any{"done": true})

		require.Equal(t, http.StatusOK, resp.Code, resp.Body.String())
		assert.Contains(t, resp.Body.String(), `"dueAt":"2026-12-24T18:00:00Z"`)
	})

	t.Run("PATCH /todos/{id} rejects null on fields that cannot be cleared with 422", func(t *testing.T) {
		api, _ := newTodosAPI(t)

		resp := api.Patch("/todos/1", map[string]any{"title": nil, "done": nil})

		require.Equal(t, http.StatusUnprocessableEntity, resp.Code, resp.Body.String())
		assert.Contains(t, resp.Body.String(), `"location":"body.title"`)
		assert.Contains(t, resp.Body.String(), `"location":"body.done"`)
	})

	t.Run("DELETE /todos/{id} returns 204", func(t *testing.T) {
		api, repo := newTodosAPI(t)
		repo.EXPECT().Delete(gomock.Any(), uint(1)).Return(nil)

		resp := api.Delete("/todos/1")

		assert.Equal(t, http.StatusNoContent, resp.Code, resp.Body.String())
	})

	t.Run("unexpected repository errors return 500", func(t *testing.T) {
		api, repo := newTodosAPI(t)
		repo.EXPECT().List(gomock.Any()).Return(nil, assert.AnError)

		resp := api.Get("/todos")

		assert.Equal(t, http.StatusInternalServerError, resp.Code, resp.Body.String())
	})
}
