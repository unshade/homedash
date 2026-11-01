package field

import (
	"encoding/json"
	"testing"

	"github.com/danielgtaylor/huma/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type body struct {
	Name OmittableNullable[string] `json:"name,omitempty"`
}

func TestOmittableNullable_UnmarshalJSON(t *testing.T) {
	tests := []struct {
		name string
		json string
		want OmittableNullable[string]
	}{
		{name: "an omitted field is not sent", json: `{}`, want: OmittableNullable[string]{}},
		{name: "a null field is sent and null", json: `{"name":null}`, want: OmittableNullable[string]{Sent: true, Null: true}},
		{name: "a value is sent with its value", json: `{"name":"milk"}`, want: OmittableNullable[string]{Sent: true, Value: "milk"}},
		{name: "an empty value is sent and not null", json: `{"name":""}`, want: OmittableNullable[string]{Sent: true}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var b body

			require.NoError(t, json.Unmarshal([]byte(tt.json), &b))

			assert.Equal(t, tt.want, b.Name)
		})
	}

	t.Run("fails when the value has the wrong type", func(t *testing.T) {
		var b body

		assert.Error(t, json.Unmarshal([]byte(`{"name":42}`), &b))
	})
}

func TestOmittableNullable_Ptr(t *testing.T) {
	t.Run("returns nil when the field was omitted", func(t *testing.T) {
		assert.Nil(t, OmittableNullable[string]{}.Ptr())
	})

	t.Run("returns nil when the field was null", func(t *testing.T) {
		assert.Nil(t, OmittableNullable[string]{Sent: true, Null: true}.Ptr())
	})

	t.Run("returns a pointer to the sent value", func(t *testing.T) {
		got := OmittableNullable[string]{Sent: true, Value: "milk"}.Ptr()

		require.NotNil(t, got)
		assert.Equal(t, "milk", *got)
	})
}

func TestOmittableNullable_Schema(t *testing.T) {
	t.Run("uses the schema of the wrapped type", func(t *testing.T) {
		r := huma.NewMapRegistry("#/components/schemas/", huma.DefaultSchemaNamer)

		s := OmittableNullable[string]{}.Schema(r)

		assert.Equal(t, huma.TypeString, s.Type)
	})
}
