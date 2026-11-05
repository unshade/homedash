import { setupServer } from 'msw/node'

/** Fake API for tests. Each test declares the requests it expects with server.use(...). */
export const server = setupServer()
