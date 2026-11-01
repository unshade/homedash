// Package todo holds the todo domain: the entity, its business rules and the storage contract.
package todo

import (
	"errors"
	"time"
)

// MaxTitleLength is the maximum number of characters in a todo title.
const MaxTitleLength = 200

var (
	// ErrNotFound is returned when a todo does not exist.
	ErrNotFound = errors.New("todo not found")
	// ErrInvalid is returned (wrapped) when a todo breaks a business rule.
	ErrInvalid = errors.New("invalid todo")
)

// Todo is a single task to do at home.
type Todo struct {
	ID          uint
	Title       string
	Description string
	Done        bool
	DueAt       *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
