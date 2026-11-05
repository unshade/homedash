import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

/** Renders the sidebar in a small router whose current page is /todos (jsdom is computer-sized). */
async function renderSidebar() {
  const rootRoute = createRootRoute({
    component: () => (
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </TooltipProvider>
    ),
  })
  const pages = ['/', '/todos'].map((path) =>
    createRoute({ getParentRoute: () => rootRoute, path, component: () => null }),
  )
  const router = createRouter({
    routeTree: rootRoute.addChildren(pages),
    history: createMemoryHistory({ initialEntries: ['/todos'] }),
  })
  render(<RouterProvider router={router} />)
  await screen.findByRole('navigation', { name: 'Main' })
  return userEvent.setup()
}

/** The desktop sidebar's state, read from the attribute its styles use. */
function sidebarState() {
  return document.querySelector('[data-slot="sidebar"]')?.getAttribute('data-state')
}

describe('AppSidebar', () => {
  beforeEach(() => localStorage.clear())

  it('marks the current app as the current page', async () => {
    await renderSidebar()

    expect(screen.getByRole('link', { name: 'Todos' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'homedash' })).not.toHaveAttribute('aria-current')
  })

  it('collapses to icons and remembers it', async () => {
    const user = await renderSidebar()
    expect(sidebarState()).toBe('expanded')

    await user.click(screen.getByRole('button', { name: 'Collapse' }))

    expect(sidebarState()).toBe('collapsed')
    expect(screen.getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-expanded', 'false')
    expect(localStorage.getItem('homedash.sidebar')).toBe('collapsed')
  })

  it('starts collapsed when it was collapsed last time', async () => {
    localStorage.setItem('homedash.sidebar', 'collapsed')

    await renderSidebar()

    expect(sidebarState()).toBe('collapsed')
    // Collapsed, each app is still reachable by its name.
    expect(screen.getByRole('link', { name: 'Todos' })).toBeInTheDocument()
  })
})
