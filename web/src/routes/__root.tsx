import type { QueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'

export type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-b">
        <div className="mx-auto flex h-12 max-w-3xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <Logo className="size-5 text-primary" />
            homedash
          </Link>
          <nav aria-label="Main" className="flex gap-1 text-sm">
            <Link
              to="/todos"
              className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
              activeProps={{ className: 'bg-secondary text-foreground', 'aria-current': 'page' }}
            >
              Todos
            </Link>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <Toaster />
    </>
  )
}

function NotFound() {
  return (
    <div className="space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">This page does not exist.</p>
      <Button asChild variant="outline">
        <Link to="/">Back home</Link>
      </Button>
    </div>
  )
}
