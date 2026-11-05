import type { QueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { AppSidebar, OpenMenuButton } from '@/components/app-sidebar'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <AppSidebar />
        <SidebarInset>
          {/* Phones only: the sidebar becomes a drawer opened from here. */}
          <header className="flex h-14 items-center gap-1 border-b px-1 md:hidden">
            <OpenMenuButton />
            <Link to="/" className="flex items-center gap-2 px-2 text-sm font-semibold">
              <Logo className="size-5 text-primary" />
              homedash
            </Link>
          </header>
          <main id="main" className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
            <Outlet />
          </main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </TooltipProvider>
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
