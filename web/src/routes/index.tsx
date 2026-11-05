import { createFileRoute, redirect } from '@tanstack/react-router'

// Todos is the only feature for now, so the home page opens it.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/todos' })
  },
})
