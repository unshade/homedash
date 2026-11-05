import { createFileRoute } from '@tanstack/react-router'

import { todosQuery } from '@/features/todos/queries'
import { TodosPage, TodosPageError, TodosPageSkeleton } from '@/features/todos/todos-page'

export const Route = createFileRoute('/todos')({
  // Starts loading the todos as soon as navigation starts (or on link hover).
  loader: ({ context }) => context.queryClient.ensureQueryData(todosQuery),
  component: TodosPage,
  pendingComponent: TodosPageSkeleton,
  errorComponent: TodosPageError,
})
