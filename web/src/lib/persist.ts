import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import type { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createStore, del, get, set } from 'idb-keyval'

/**
 * Keeps a copy of the server data on this device, in IndexedDB, so homedash
 * opens with the last data it saw and stays readable offline (ADR 19).
 */

/** How long a saved copy may be shown. Older copies are thrown away. */
export const cacheMaxAge = 7 * 24 * 60 * 60 * 1000

const store = createStore('homedash', 'query-cache')

// IndexedDB can be missing or blocked (some private windows): the app then
// works as before, it just doesn't keep a copy.
const storage = {
  getItem: async (key: string) => {
    try {
      return (await get<string>(key, store)) ?? null
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await set(key, value, store)
    } catch {
      // Not saved this time.
    }
  },
  removeItem: async (key: string) => {
    try {
      await del(key, store)
    } catch {
      // Nothing to remove.
    }
  },
}

/**
 * Restores the saved copy into queryClient, then saves every change to it.
 * Resolves once restored (or when there is nothing to restore), so the first
 * render already has the data.
 */
export function persistQueries(queryClient: QueryClient): Promise<void> {
  const [, restored] = persistQueryClient({
    queryClient,
    persister: createAsyncStoragePersister({ storage, key: 'queries' }),
    maxAge: cacheMaxAge,
    // A copy saved by a build with another API schema is thrown away, so the
    // app never reads data in a shape it doesn't expect.
    buster: import.meta.env.API_SCHEMA_HASH,
    dehydrateOptions: {
      // Only data is kept. Changes are never queued for later: offline is read-only.
      shouldDehydrateMutation: () => false,
    },
  })
  // Never keep the app from starting: give up on the copy after a second.
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1000))
  return Promise.race([restored.catch(() => undefined), timeout])
}
