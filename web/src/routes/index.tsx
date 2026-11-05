import { createFileRoute } from '@tanstack/react-router'

import { HomePage, HomePageError, HomePageSkeleton } from '@/features/home/home-page'
import { todosQuery } from '@/features/todos/queries'

// The overview: built from every feature's data (todos for now).
export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(todosQuery),
  component: HomePage,
  pendingComponent: HomePageSkeleton,
  errorComponent: HomePageError,
})
