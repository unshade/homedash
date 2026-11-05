import type { QueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { AppSidebar, OpenMenuButton } from '@/components/app-sidebar'
import { Backdrop } from '@/components/backdrop'
import { Logo } from '@/components/logo'
import { OfflineNotice } from '@/components/offline-notice'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UpdatePrompt } from '@/components/update-prompt'

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
        <Backdrop />
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          {/* Phones only: the sidebar becomes a drawer opened from here. */}
          <header className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b bg-background/60 px-1 backdrop-blur-xl md:hidden">
            <OpenMenuButton />
            <Link to="/" className="flex items-center gap-2 px-2 text-sm font-semibold">
              <Logo className="size-5" />
              homedash
            </Link>
          </header>
          <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <OfflineNotice />
            <Outlet />
          </main>
        </SidebarInset>
        <Toaster />
        <UpdatePrompt />
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
