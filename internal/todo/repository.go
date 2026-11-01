package todo

import "context"

//go:generate go tool -modfile=../../tools/go.mod mockgen -source=$GOFILE -destination=mock/repository.go -package=mock

// Repository persists todos. Implementations must return ErrNotFound for missing todos.
type Repository interface {
	Create(ctx context.Context, t *Todo) error
	Get(ctx context.Context, id uint) (Todo, error)
	List(ctx context.Context) ([]Todo, error)
	Update(ctx context.Context, t *Todo) error
	Delete(ctx context.Context, id uint) error
}
