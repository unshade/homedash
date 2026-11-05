import { MutationCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { errorMessage, isApiError } from '@/api/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry network and server errors, never client errors (4xx): they would fail again.
      retry: (failureCount, error) =>
        failureCount < 2 && !(isApiError(error) && (error.status ?? 500) < 500),
    },
    mutations: {
      retry: false,
    },
  },
  // Every failed change is reported, so no error is silently lost.
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(errorMessage(error))
    },
  }),
})
