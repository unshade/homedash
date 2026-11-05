import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode, Suspense } from 'react'
import { toast } from 'sonner'

import { errorMessage } from '@/api/errors'
import { Toaster } from '@/components/ui/sonner'

/** Renders ui with a fresh query client (no retries) and the toaster, like the app. */
export function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    mutationCache: new MutationCache({ onError: (error) => toast.error(errorMessage(error)) }),
  })
  return {
    user: userEvent.setup(),
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<p>Loading…</p>}>{ui}</Suspense>
        <Toaster />
      </QueryClientProvider>,
    ),
  }
}
