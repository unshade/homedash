// Package field holds custom request field types shared by every API version.
package field

import (
	"bytes"
	"encoding/json"
	"reflect"

	"github.com/danielgtaylor/huma/v2"
)

// OmittableNullable is a field which can be omitted from the input,
// set to `null`, or set to a value. Each state is tracked and can
// be checked for in handling code.
//
// Its OpenAPI schema is the one of T: add `nullable:"true"` on the struct
// field when `null` is a meaningful value, otherwise Huma rejects it.
//
// See https://huma.rocks/features/schema-customization/.
type OmittableNullable[T any] struct {
	Sent  bool
	Null  bool
	Value T
}

// UnmarshalJSON unmarshals this value from JSON input.
func (o *OmittableNullable[T]) UnmarshalJSON(b []byte) error {
	if len(b) > 0 {
		o.Sent = true
		if bytes.Equal(b, []byte("null")) {
			o.Null = true
			return nil
		}
		return json.Unmarshal(b, &o.Value)
	}
	return nil
}

// Schema returns a schema representing this value on the wire.
// It returns the schema of the contained type.
func (o OmittableNullable[T]) Schema(r huma.Registry) *huma.Schema {
	return r.Schema(reflect.TypeOf(o.Value), true, "")
}

// Ptr returns a pointer to the value when one was sent, and nil when the field
// was omitted or null.
func (o OmittableNullable[T]) Ptr() *T {
	if !o.Sent || o.Null {
		return nil
	}
	return &o.Value
}
