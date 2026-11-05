import { useQueryClient } from '@tanstack/react-query'

import { $api } from '@/api/client'

/** The todo list query, shared by the route loader and the page. */
export const todosQuery = $api.queryOptions('get', '/api/v1/todos')

// Each mutation refetches the list before it counts as done, so the UI never
// shows stale data after a change. Errors are reported by the query client.

function useRefetchTodos() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: todosQuery.queryKey })
}

export function useCreateTodo() {
  const refetch = useRefetchTodos()
  return $api.useMutation('post', '/api/v1/todos', { onSuccess: refetch })
}

export function useUpdateTodo() {
  const refetch = useRefetchTodos()
  return $api.useMutation('patch', '/api/v1/todos/{id}', { onSuccess: refetch })
}

export function useDeleteTodo() {
  const refetch = useRefetchTodos()
  return $api.useMutation('delete', '/api/v1/todos/{id}', { onSuccess: refetch })
}
