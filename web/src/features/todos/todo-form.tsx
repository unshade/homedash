import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { fieldErrors } from '@/api/errors'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  type TodoFormInput,
  type TodoFormValues,
  todoFormSchema,
} from './todo-form-schema'

/** API body fields mapped to the form fields that edit them. */
const apiFields: Record<string, keyof TodoFormInput> = {
  title: 'title',
  description: 'description',
  dueAt: 'dueDate',
}

type TodoFormProps = {
  /** Lets a submit button outside the form (e.g. in a dialog footer) submit it with `form={id}`. */
  id: string
  defaultValues: TodoFormInput
  /** Saves the values; a rejected API validation error is shown on the matching fields. */
  onSubmit: (values: TodoFormValues) => Promise<unknown>
}

export function TodoForm({ id, defaultValues, onSubmit }: TodoFormProps) {
  const form = useForm<TodoFormInput, unknown, TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues,
  })

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      for (const [apiField, message] of Object.entries(fieldErrors(error))) {
        const field = apiFields[apiField]
        if (field) form.setError(field, { message })
      }
    }
  })

  return (
    <form id={id} onSubmit={submit} noValidate>
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-title`}>Title</FieldLabel>
              <Input
                {...field}
                id={`${id}-title`}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
                maxLength={200}
                placeholder="Buy milk"
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-description`}>Description</FieldLabel>
              <Textarea
                {...field}
                id={`${id}-description`}
                aria-invalid={fieldState.invalid}
                rows={3}
                placeholder="Optional details"
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="dueDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-due-date`}>Due date</FieldLabel>
              <Input
                {...field}
                id={`${id}-due-date`}
                type="date"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  )
}
