import { onlineManager } from '@tanstack/react-query'

/**
 * Whether homedash can reach its server. That is what "online" means here:
 * a phone can have internet and still not reach a homedash at home.
 *
 * TanStack Query's onlineManager holds the answer, so while offline queries
 * keep their saved data and wait, then refetch once the server is back.
 * Offline means read-only (ADR 19).
 */

/** Seconds between two checks of the server while it can't be reached. */
const probeEvery = 10_000
/** Statuses a reverse proxy answers with when homedash itself is down. */
const proxyDown = new Set([502, 503, 504])

let serverReachable = true
let probe: ReturnType<typeof setInterval> | undefined
let notify: (() => void) | undefined

onlineManager.setEventListener((setOnline) => {
  notify = () => setOnline(navigator.onLine && serverReachable)
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
  notify()
  return () => {
    window.removeEventListener('online', notify!)
    window.removeEventListener('offline', notify!)
  }
})

function setReachable(reachable: boolean) {
  if (reachable === serverReachable) return
  serverReachable = reachable
  if (reachable) {
    clearInterval(probe)
    probe = undefined
  } else {
    probe ??= setInterval(() => void checkServer(), probeEvery)
  }
  notify?.()
}

/**
 * Asks the server whether it is there. Called at startup, because data saved
 * on the device may be fresh enough that no request would be made, and then
 * every probeEvery while the server can't be reached.
 */
export async function checkServer() {
  if (!navigator.onLine) return
  try {
    const response = await globalThis.fetch('/api/v1/health', { cache: 'no-store' })
    setReachable(!proxyDown.has(response.status))
  } catch {
    setReachable(false)
  }
}

/**
 * Wraps fetch for the API client: a request that gets no answer (or a proxy's
 * "bad gateway") marks the server unreachable, any other answer marks it back.
 */
export async function trackedFetch(request: Request): Promise<Response> {
  try {
    const response = await globalThis.fetch(request)
    setReachable(!proxyDown.has(response.status))
    return response
  } catch (error) {
    if (!request.signal.aborted) setReachable(false)
    throw error
  }
}
