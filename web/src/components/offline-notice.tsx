import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { WifiOffIcon } from 'lucide-react'
import { useCallback, useSyncExternalStore } from 'react'

import { useOnline } from '@/hooks/use-online'
import { locale } from '@/lib/locale'

const savedAtFormat = new Intl.DateTimeFormat(locale, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/** When the data on screen was fetched: the oldest among the queries in use. */
function oldestShownData(queryClient: QueryClient): number | undefined {
  let oldest: number | undefined
  for (const query of queryClient.getQueryCache().getAll()) {
    const { dataUpdatedAt } = query.state
    if (query.getObserversCount() > 0 && dataUpdatedAt > 0) {
      oldest = oldest === undefined ? dataUpdatedAt : Math.min(oldest, dataUpdatedAt)
    }
  }
  return oldest
}

/**
 * When the server can't be reached, says that homedash is read-only and how
 * old the data on screen is.
 */
export function OfflineNotice() {
  const online = useOnline()
  const queryClient = useQueryClient()

  const subscribe = useCallback(
    (onChange: () => void) => queryClient.getQueryCache().subscribe(onChange),
    [queryClient],
  )
  const savedAt = useSyncExternalStore(subscribe, () => oldestShownData(queryClient))

  // The <output> (a live region) is always present, so screen readers announce
  // the message when it appears.
  return (
    <output className="block">
      {online ? null : (
        <span className="glass mb-6 flex items-start gap-3 rounded-3xl px-5 py-3.5 text-sm">
          <WifiOffIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>
            <span className="block font-medium">Offline: read-only</span>
            <span className="block text-muted-foreground">
              {savedAt === undefined
                ? 'homedash can’t reach its server, and this page was never saved on this device.'
                : `homedash can’t reach its server. You’re seeing the copy saved on this device on ${savedAtFormat.format(savedAt)}.`}{' '}
              Changes are possible again once the connection is back.
            </span>
          </span>
        </span>
      )}
    </output>
  )
}
