package todo

import (
	"context"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"
)

// Service implements the todo use cases on top of a Repository.
type Service struct {
	repo Repository
}

// NewService returns a Service storing todos in repo.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// CreateParams are the fields accepted when creating a todo.
type CreateParams struct {
	Title       string
	Description string
	DueAt       *time.Time
}

// UpdateParams are the fields that can be changed on a todo. Nil fields are left untouched.
type UpdateParams struct {
	Title       *string
	Description *string
	Done        *bool
	// SetDueAt replaces the due date with DueAt, which may be nil to clear it.
	SetDueAt bool
	DueAt    *time.Time
}

// Create validates and stores a new todo.
func (s *Service) Create(ctx context.Context, p CreateParams) (Todo, error) {
	t := Todo{
		Title:       strings.TrimSpace(p.Title),
		Description: p.Description,
		DueAt:       p.DueAt,
	}
	if err := validate(t); err != nil {
		return Todo{}, err
	}
	if err := s.repo.Create(ctx, &t); err != nil {
		return Todo{}, err
	}
	return t, nil
}

// Get returns the todo with the given id.
func (s *Service) Get(ctx context.Context, id uint) (Todo, error) {
	return s.repo.Get(ctx, id)
}

// List returns every todo.
func (s *Service) List(ctx context.Context) ([]Todo, error) {
	return s.repo.List(ctx)
}

// Update applies p to the todo with the given id.
func (s *Service) Update(ctx context.Context, id uint, p UpdateParams) (Todo, error) {
	t, err := s.repo.Get(ctx, id)
	if err != nil {
		return Todo{}, err
	}

	if p.Title != nil {
		t.Title = strings.TrimSpace(*p.Title)
	}
	if p.Description != nil {
		t.Description = *p.Description
	}
	if p.Done != nil {
		t.Done = *p.Done
	}
	if p.SetDueAt {
		t.DueAt = p.DueAt
	}

	if err := validate(t); err != nil {
		return Todo{}, err
	}
	if err := s.repo.Update(ctx, &t); err != nil {
		return Todo{}, err
	}
	return t, nil
}

// Delete removes the todo with the given id.
func (s *Service) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func validate(t Todo) error {
	if t.Title == "" {
		return fmt.Errorf("%w: title is required", ErrInvalid)
	}
	if utf8.RuneCountInString(t.Title) > MaxTitleLength {
		return fmt.Errorf("%w: title must be at most %d characters", ErrInvalid, MaxTitleLength)
	}
	return nil
}
