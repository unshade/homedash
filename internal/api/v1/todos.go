package v1

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/unshade/homedash/internal/api/field"
	"github.com/unshade/homedash/internal/todo"
)

type Todo struct {
	ID          uint       `json:"id" doc:"Todo identifier"`
	Title       string     `json:"title" example:"Buy milk"`
	Description string     `json:"description"`
	Done        bool       `json:"done"`
	DueAt       *time.Time `json:"dueAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

func newTodo(t todo.Todo) Todo {
	return Todo(t)
}

type TodoOutput struct {
	Body Todo
}

type ListTodosOutput struct {
	Body []Todo
}

type TodoIDInput struct {
	ID uint `path:"id" doc:"Todo identifier"`
}

type CreateTodoInput struct {
	Body struct {
		Title       string     `json:"title" minLength:"1" maxLength:"200" example:"Buy milk"`
		Description string     `json:"description,omitempty"`
		DueAt       *time.Time `json:"dueAt,omitempty"`
	}
}

type UpdateTodoInput struct {
	ID   uint `path:"id" doc:"Todo identifier"`
	Body struct {
		Title       field.OmittableNullable[string]    `json:"title,omitempty" minLength:"1" maxLength:"200"`
		Description field.OmittableNullable[string]    `json:"description,omitempty"`
		Done        field.OmittableNullable[bool]      `json:"done,omitempty"`
		DueAt       field.OmittableNullable[time.Time] `json:"dueAt,omitempty" nullable:"true" doc:"Set to null to remove the due date"`
	}
}

// Resolve rejects null on fields that cannot be cleared. Huma lets null through
// for custom field types, so the schema alone does not enforce it.
func (in *UpdateTodoInput) Resolve(huma.Context) []error {
	var errs []error
	for name, null := range map[string]bool{
		"title":       in.Body.Title.Null,
		"description": in.Body.Description.Null,
		"done":        in.Body.Done.Null,
	} {
		if null {
			errs = append(errs, &huma.ErrorDetail{Location: "body." + name, Message: "must not be null", Value: nil})
		}
	}
	return errs
}

func registerTodos(api huma.API, todos *todo.Service) {
	tags := []string{"todos"}

	huma.Register(api, huma.Operation{
		OperationID: "list-todos",
		Method:      http.MethodGet,
		Path:        "/todos",
		Summary:     "List todos",
		Tags:        tags,
	}, func(ctx context.Context, _ *struct{}) (*ListTodosOutput, error) {
		list, err := todos.List(ctx)
		if err != nil {
			return nil, todoError(err)
		}
		out := &ListTodosOutput{Body: make([]Todo, len(list))}
		for i, t := range list {
			out.Body[i] = newTodo(t)
		}
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-todo",
		Method:        http.MethodPost,
		Path:          "/todos",
		Summary:       "Create a todo",
		Tags:          tags,
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, in *CreateTodoInput) (*TodoOutput, error) {
		t, err := todos.Create(ctx, todo.CreateParams{
			Title:       in.Body.Title,
			Description: in.Body.Description,
			DueAt:       in.Body.DueAt,
		})
		if err != nil {
			return nil, todoError(err)
		}
		return &TodoOutput{Body: newTodo(t)}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-todo",
		Method:      http.MethodGet,
		Path:        "/todos/{id}",
		Summary:     "Get a todo",
		Tags:        tags,
	}, func(ctx context.Context, in *TodoIDInput) (*TodoOutput, error) {
		t, err := todos.Get(ctx, in.ID)
		if err != nil {
			return nil, todoError(err)
		}
		return &TodoOutput{Body: newTodo(t)}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-todo",
		Method:      http.MethodPatch,
		Path:        "/todos/{id}",
		Summary:     "Update a todo",
		Description: "Only the fields present in the body are changed. `dueAt` can be set to null to remove it.",
		Tags:        tags,
	}, func(ctx context.Context, in *UpdateTodoInput) (*TodoOutput, error) {
		t, err := todos.Update(ctx, in.ID, todo.UpdateParams{
			Title:       in.Body.Title.Ptr(),
			Description: in.Body.Description.Ptr(),
			Done:        in.Body.Done.Ptr(),
			SetDueAt:    in.Body.DueAt.Sent,
			DueAt:       in.Body.DueAt.Ptr(),
		})
		if err != nil {
			return nil, todoError(err)
		}
		return &TodoOutput{Body: newTodo(t)}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "delete-todo",
		Method:        http.MethodDelete,
		Path:          "/todos/{id}",
		Summary:       "Delete a todo",
		Tags:          tags,
		DefaultStatus: http.StatusNoContent,
	}, func(ctx context.Context, in *TodoIDInput) (*struct{}, error) {
		if err := todos.Delete(ctx, in.ID); err != nil {
			return nil, todoError(err)
		}
		return nil, nil
	})
}

// todoError maps domain errors to HTTP errors.
func todoError(err error) error {
	switch {
	case errors.Is(err, todo.ErrNotFound):
		return huma.Error404NotFound(err.Error())
	case errors.Is(err, todo.ErrInvalid):
		return huma.Error422UnprocessableEntity(err.Error())
	default:
		return huma.Error500InternalServerError("internal error", err)
	}
}
