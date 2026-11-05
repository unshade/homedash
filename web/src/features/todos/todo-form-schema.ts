import { z } from 'zod'

/** Same rules as the API (internal/todo), checked before sending for instant feedback. */
export const todoFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(200, 'Title must be at most 200 characters.'),
  description: z.string(),
  /** "YYYY-MM-DD", or "" for no due date. */
  dueDate: z.string(),
})

export type TodoFormInput = z.input<typeof todoFormSchema>
export type TodoFormValues = z.output<typeof todoFormSchema>

export const emptyTodoForm: TodoFormInput = { title: '', description: '', dueDate: '' }
