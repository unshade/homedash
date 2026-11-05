import { MutationCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { errorMessage, isApiError } from '@/api/errors'
import { cacheMaxAge } from '@/lib/persist'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Kept in memory as long as the saved copy on the device (src/lib/persist.ts),
      // or pages not opened for a while would be missing offline.
      gcTime: cacheMaxAge,
      // Retry network and server errors, never client errors (4xx): they would fail again.
      retry: (failureCount, error) =>
        failureCount < 2 && !(isApiError(error) && (error.status ?? 500) < 500),
    },
    mutations: {
      retry: false,
      // Offline, a change fails at once instead of waiting to be sent later:
      // the app is read-only until the server is back.
      networkMode: 'always',
    },
  },
  // Every failed change is reported, so no error is silently lost.
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(errorMessage(error))
    },
  }),
})
