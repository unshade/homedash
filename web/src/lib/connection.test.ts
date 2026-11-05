import { onlineManager } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { trackedFetch } from '@/lib/connection'
import { server } from '@/test/server'

const get = (path: string) => trackedFetch(new Request(new URL(path, 'http://localhost')))

describe('trackedFetch', () => {
  afterEach(async () => {
    // Leave the server reachable for the next test.
    server.use(http.get('*/api/v1/todos', () => HttpResponse.json([])))
    await get('/api/v1/todos')
    vi.useRealTimers()
  })

  it('goes offline when the server does not answer, and back once a check reaches it', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    server.use(http.get('*/api/v1/todos', () => HttpResponse.error()))

    await expect(get('/api/v1/todos')).rejects.toThrow(TypeError)
    expect(onlineManager.isOnline()).toBe(false)

    server.use(http.get('*/api/v1/health', () => HttpResponse.json({ status: 'ok' })))
    await vi.advanceTimersByTimeAsync(10_000)
    await vi.waitFor(() => expect(onlineManager.isOnline()).toBe(true))
  })

  it('goes offline when a proxy says homedash is down', async () => {
    server.use(http.get('*/api/v1/todos', () => new HttpResponse(null, { status: 502 })))

    await get('/api/v1/todos')

    expect(onlineManager.isOnline()).toBe(false)
  })

  it('stays online on API errors, which are answers from the server', async () => {
    server.use(http.get('*/api/v1/todos', () => new HttpResponse(null, { status: 500 })))

    await get('/api/v1/todos')

    expect(onlineManager.isOnline()).toBe(true)
  })
})
