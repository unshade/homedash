import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { Todo } from '@/api/client'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

import { HomePage } from './home-page'

function todo(overrides: Partial<Todo>): Todo {
  return {
    id: 1,
    title: 'Buy milk',
    description: '',
    done: false,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
    ...overrides,
  }
}

/** A due date `offset` days from today, at noon. */
function inDays(offset: number): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12).toISOString()
}

/** Renders the home page at "/" in a small router, so its links work. */
function renderHome() {
  const rootRoute = createRootRoute()
  const pages = [
    createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage }),
    createRoute({ getParentRoute: () => rootRoute, path: '/todos', component: () => null }),
  ]
  const router = createRouter({
    routeTree: rootRoute.addChildren(pages),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return renderWithProviders(<RouterProvider router={router} />)
}

function stat(label: string) {
  return screen.getByText(label).nextElementSibling?.textContent
}

describe('HomePage', () => {
  it('shows the counts that need attention and the todos up next', async () => {
    server.use(
      http.get('/api/v1/todos', () =>
        HttpResponse.json([
          todo({ id: 1, title: 'Renew the car insurance', dueAt: inDays(-2) }),
          todo({ id: 2, title: 'Buy milk', dueAt: inDays(0) }),
          todo({ id: 3, title: 'Fix the bookshelf' }),
          todo({ id: 4, title: 'Water the plants', done: true, updatedAt: '2026-11-03T10:00:00Z' }),
        ]),
      ),
    )

    renderHome()

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/^Good (morning|afternoon|evening)$/)
    expect(stat('Overdue')).toBe('1')
    expect(stat('Due today')).toBe('1')
    expect(stat('Open')).toBe('3')

    const upNext = within(screen.getByRole('region', { name: 'Up next' }))
    expect(upNext.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('Renew the car insurance'),
      expect.stringContaining('Buy milk'),
      expect.stringContaining('Fix the bookshelf'),
    ])
    expect(upNext.getByRole('link', { name: 'All todos' })).toHaveAttribute('href', '/todos')

    const done = within(screen.getByRole('region', { name: 'Recently done' }))
    expect(done.getByText('Water the plants')).toBeInTheDocument()
  })

  it('gives the week chart to screen readers as a table', async () => {
    server.use(http.get('/api/v1/todos', () => HttpResponse.json([todo({ dueAt: inDays(0), done: true })])))

    renderHome()

    const table = await screen.findByRole('table', { name: 'Todos due each day this week' })
    expect(within(table).getAllByRole('row')).toHaveLength(8) // header + 7 days
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('says so when there is nothing to show yet', async () => {
    server.use(http.get('/api/v1/todos', () => HttpResponse.json([])))

    renderHome()

    expect(await screen.findByText('Nothing left to do.')).toBeInTheDocument()
    expect(screen.getByText('Nothing done yet.')).toBeInTheDocument()
    expect(screen.getAllByText('Nothing is due this week.')).toHaveLength(2)
  })
})
