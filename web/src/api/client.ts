import createFetchClient from 'openapi-fetch'
import createQueryClient from 'openapi-react-query'

import { trackedFetch } from '@/lib/connection'

import type { components, paths } from './schema.gen'

export type Todo = components['schemas']['Todo']
export type ApiError = components['schemas']['ErrorModel']

/**
 * Typed client for the Go API. Types come from schema.gen.ts, generated from
 * the API's OpenAPI document with `task web:api`: never edit them by hand.
 *
 * The frontend is served by the Go server itself, so requests are same-origin.
 */
export const fetchClient = createFetchClient<paths>({
  baseUrl: globalThis.location?.origin ?? '',
  // trackedFetch looks fetch up on every call (not once at import), so tools
  // that wrap it, like the fake API in tests, see every request. It also notices
  // when the server can't be reached (src/lib/connection.ts).
  fetch: trackedFetch,
})

/** TanStack Query hooks bound to the typed client (e.g. `$api.useQuery('get', '/api/v1/todos')`). */
export const $api = createQueryClient(fetchClient)
