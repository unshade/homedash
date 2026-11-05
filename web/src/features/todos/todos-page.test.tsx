import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import type { Todo } from '@/api/client'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

import { TodosPage } from './todos-page'

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

/** A fake API over an in-memory list, recording the request bodies it receives. */
function fakeApi(initial: Todo[]) {
  let todos = [...initial]
  let nextId = Math.max(0, ...todos.map((t) => t.id)) + 1
  const bodies: Record<string, unknown>[] = []

  server.use(
    http.get('/api/v1/todos', () => HttpResponse.json(todos)),
    http.post('/api/v1/todos', async ({ request }) => {
      const body = (await request.json()) as Partial<Todo>
      bodies.push(body)
      const created = todo({ ...body, id: nextId++ })
      todos.push(created)
      return HttpResponse.json(created, { status: 201 })
    }),
    http.patch('/api/v1/todos/:id', async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push(body)
      todos = todos.map((t) => {
        if (t.id !== Number(params.id)) return t
        const updated = { ...t, ...body, updatedAt: new Date().toISOString() } as Todo
        if (body.dueAt === null) delete updated.dueAt
        return updated
      })
      return HttpResponse.json(todos.find((t) => t.id === Number(params.id)))
    }),
    http.delete('/api/v1/todos/:id', ({ params }) => {
      todos = todos.filter((t) => t.id !== Number(params.id))
      return new HttpResponse(null, { status: 204 })
    }),
  )

  return { bodies, all: () => todos }
}

describe('TodosPage', () => {
  beforeEach(() => {
    fakeApi([])
  })

  it('shows open and done todos in separate sections', async () => {
    fakeApi([todo({ id: 1, title: 'Buy milk' }), todo({ id: 2, title: 'Wash the car', done: true })])

    renderWithProviders(<TodosPage />)

    const open = await screen.findByRole('region', { name: 'To do' })
    const done = screen.getByRole('region', { name: 'Done' })
    expect(within(open).getByRole('checkbox', { name: 'Buy milk' })).not.toBeChecked()
    expect(within(done).getByRole('checkbox', { name: 'Wash the car' })).toBeChecked()
    expect(screen.getByText('1 open')).toBeInTheDocument()
  })

  it('groups open todos by when they are due and leads with what is overdue', async () => {
    const day = (offset: number) => {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset).toISOString()
    }
    fakeApi([
      todo({ id: 1, title: 'Renew the car insurance', dueAt: day(-2) }),
      todo({ id: 2, title: 'Buy milk', dueAt: day(0) }),
      todo({ id: 3, title: 'Fix the shelf' }),
    ])

    renderWithProviders(<TodosPage />)

    const groups = await screen.findAllByRole('heading', { level: 3 })
    expect(groups.map((g) => g.textContent)).toEqual(['Overdue', 'Today', 'No due date'])
    expect(screen.getByText('1 overdue')).toBeInTheDocument()
    expect(screen.getByText(/1 due today · 3 open/)).toBeInTheDocument()
  })

  it('shows how much of this week is done', async () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    fakeApi([
      todo({ id: 1, title: 'Buy milk', dueAt: today, done: true }),
      todo({ id: 2, title: 'Take the bins out', dueAt: today }),
      todo({ id: 3, title: 'Fix the shelf' }),
    ])

    renderWithProviders(<TodosPage />)

    const progress = await screen.findByRole('progressbar', { name: 'Todos due this week that are done' })
    expect(progress).toHaveAttribute('value', '1')
    expect(progress).toHaveAttribute('max', '2')
  })

  it('keeps the list frame with one sentence when there are no todos', async () => {
    renderWithProviders(<TodosPage />)

    const open = await screen.findByRole('region', { name: 'To do' })
    expect(within(open).getByText(/Nothing here yet/)).toBeInTheDocument()
    expect(screen.getByText('Nothing left to do.')).toBeInTheDocument()
  })

  it('shows only the five latest done todos until asked for all', async () => {
    fakeApi(
      Array.from({ length: 7 }, (_, i) =>
        todo({ id: i + 1, title: `Chore ${i + 1}`, done: true, updatedAt: `2026-11-0${i + 1}T10:00:00Z` }),
      ),
    )
    const { user } = renderWithProviders(<TodosPage />)

    const done = await screen.findByRole('region', { name: 'Done' })
    expect(within(done).getAllByRole('checkbox')).toHaveLength(5)
    expect(within(done).getByRole('checkbox', { name: 'Chore 7' })).toBeInTheDocument()

    await user.click(within(done).getByRole('button', { name: 'Show all 7 done' }))

    expect(within(done).getAllByRole('checkbox')).toHaveLength(7)
  })

  it('creates a todo with a trimmed title', async () => {
    const api = fakeApi([])
    const { user } = renderWithProviders(<TodosPage />)

    await user.click((await screen.findAllByRole('button', { name: 'New todo' }))[0]!)
    const dialog = await screen.findByRole('dialog', { name: 'New todo' })
    await user.type(within(dialog).getByLabelText('Title'), '  Buy bread  ')
    await user.click(within(dialog).getByRole('button', { name: 'Add todo' }))

    expect(await screen.findByRole('checkbox', { name: 'Buy bread' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.bodies).toEqual([{ title: 'Buy bread', description: '' }])
  })

  it('validates the title before sending anything', async () => {
    const api = fakeApi([])
    const { user } = renderWithProviders(<TodosPage />)

    await user.click((await screen.findAllByRole('button', { name: 'New todo' }))[0]!)
    const dialog = await screen.findByRole('dialog', { name: 'New todo' })
    await user.type(within(dialog).getByLabelText('Title'), '   ')
    await user.click(within(dialog).getByRole('button', { name: 'Add todo' }))

    expect(await within(dialog).findByText('Title is required.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
    expect(api.bodies).toEqual([])
  })

  it('shows the API validation errors on the matching fields', async () => {
    server.use(
      http.post('/api/v1/todos', () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Unprocessable Entity',
            status: 422,
            detail: 'validation failed',
            errors: [{ location: 'body.title', message: 'title is already taken' }],
          },
          { status: 422 },
        ),
      ),
    )
    const { user } = renderWithProviders(<TodosPage />)

    await user.click((await screen.findAllByRole('button', { name: 'New todo' }))[0]!)
    const dialog = await screen.findByRole('dialog', { name: 'New todo' })
    await user.type(within(dialog).getByLabelText('Title'), 'Buy milk')
    await user.click(within(dialog).getByRole('button', { name: 'Add todo' }))

    expect(await within(dialog).findByText('title is already taken')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'New todo' })).toBeInTheDocument()
  })

  it('marks a todo as done', async () => {
    const api = fakeApi([todo({ id: 1, title: 'Buy milk' })])
    const { user } = renderWithProviders(<TodosPage />)

    await user.click(await screen.findByRole('checkbox', { name: 'Buy milk' }))

    await waitFor(() => expect(screen.getByRole('region', { name: 'Done' })).toBeInTheDocument())
    expect(api.bodies).toEqual([{ done: true }])
  })

  it('removes the due date when it is cleared while editing', async () => {
    const api = fakeApi([todo({ id: 1, title: 'Buy milk', dueAt: new Date(2030, 0, 15).toISOString() })])
    const { user } = renderWithProviders(<TodosPage />)

    await user.click(await screen.findByRole('button', { name: 'Actions for “Buy milk”' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit todo' })
    await user.clear(within(dialog).getByLabelText('Due date'))
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(api.bodies).toHaveLength(1))
    expect(api.bodies[0]).toEqual({ title: 'Buy milk', description: '', dueAt: null })
    await waitFor(() => expect(api.all()[0]?.dueAt).toBeUndefined())
  })

  it('leaves the due date out of the update when it did not change', async () => {
    const api = fakeApi([todo({ id: 1, title: 'Buy milk', dueAt: new Date(2030, 0, 15).toISOString() })])
    const { user } = renderWithProviders(<TodosPage />)

    await user.click(await screen.findByRole('button', { name: 'Actions for “Buy milk”' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit todo' })
    await user.type(within(dialog).getByLabelText('Title'), ' now')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(api.bodies).toHaveLength(1))
    expect(api.bodies[0]).toEqual({ title: 'Buy milk now', description: '' })
  })

  it('deletes a todo after confirmation', async () => {
    fakeApi([todo({ id: 1, title: 'Buy milk' })])
    const { user } = renderWithProviders(<TodosPage />)

    await user.click(await screen.findByRole('button', { name: 'Actions for “Buy milk”' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this todo?' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText(/Nothing here yet/)).toBeInTheDocument()
  })

  it('reports a failed change', async () => {
    fakeApi([todo({ id: 1, title: 'Buy milk' })])
    server.use(
      http.patch('/api/v1/todos/:id', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Internal Server Error', status: 500, detail: 'internal error' },
          { status: 500 },
        ),
      ),
    )
    const { user } = renderWithProviders(<TodosPage />)

    await user.click(await screen.findByRole('checkbox', { name: 'Buy milk' }))

    expect(await screen.findByText('internal error')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).not.toBeChecked()
  })
})
