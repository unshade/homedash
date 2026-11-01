package database

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/unshade/homedash/internal/todo"
)

var _ todo.Repository = (*TodoRepository)(nil)

// todoRow is the database representation of a todo.Todo.
type todoRow struct {
	ID          uint   `gorm:"primaryKey"`
	Title       string `gorm:"size:200;not null"`
	Description string `gorm:"not null;default:''"`
	Done        bool   `gorm:"not null;default:false"`
	DueAt       *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (todoRow) TableName() string { return "todos" }

func newTodoRow(t todo.Todo) todoRow {
	return todoRow(t)
}

func (r todoRow) toDomain() todo.Todo {
	return todo.Todo(r)
}

// TodoRepository stores todos in PostgreSQL.
type TodoRepository struct {
	db *gorm.DB
}

// NewTodoRepository returns a TodoRepository using db.
func NewTodoRepository(db *gorm.DB) *TodoRepository {
	return &TodoRepository{db: db}
}

func (r *TodoRepository) Create(ctx context.Context, t *todo.Todo) error {
	row := newTodoRow(*t)
	if err := gorm.G[todoRow](r.db).Create(ctx, &row); err != nil {
		return err
	}
	*t = row.toDomain()
	return nil
}

func (r *TodoRepository) Get(ctx context.Context, id uint) (todo.Todo, error) {
	row, err := gorm.G[todoRow](r.db).Where("id = ?", id).First(ctx)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return todo.Todo{}, todo.ErrNotFound
	}
	if err != nil {
		return todo.Todo{}, err
	}
	return row.toDomain(), nil
}

func (r *TodoRepository) List(ctx context.Context) ([]todo.Todo, error) {
	rows, err := gorm.G[todoRow](r.db).Order("id").Find(ctx)
	if err != nil {
		return nil, err
	}
	todos := make([]todo.Todo, len(rows))
	for i, row := range rows {
		todos[i] = row.toDomain()
	}
	return todos, nil
}

func (r *TodoRepository) Update(ctx context.Context, t *todo.Todo) error {
	// Select the columns explicitly so zero values (e.g. Done=false) are written too.
	n, err := gorm.G[todoRow](r.db).
		Where("id = ?", t.ID).
		Select("title", "description", "done", "due_at", "updated_at").
		Updates(ctx, newTodoRow(*t))
	if err != nil {
		return err
	}
	if n == 0 {
		return todo.ErrNotFound
	}

	updated, err := r.Get(ctx, t.ID)
	if err != nil {
		return err
	}
	*t = updated
	return nil
}

func (r *TodoRepository) Delete(ctx context.Context, id uint) error {
	n, err := gorm.G[todoRow](r.db).Where("id = ?", id).Delete(ctx)
	if err != nil {
		return err
	}
	if n == 0 {
		return todo.ErrNotFound
	}
	return nil
}
