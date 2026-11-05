import { WifiOffIcon } from 'lucide-react'

import { useOnline } from '@/hooks/use-online'

/**
 * Says so when the connection is lost. The installed app still opens offline,
 * but its data comes from the server: TanStack Query pauses requests and
 * sends them when the connection is back.
 */
export function OfflineNotice() {
  const online = useOnline()

  // The <output> (a live region) is always present, so screen readers announce
  // the message when it appears.
  return (
    <output className="block">
      {online ? null : (
        <span className="mb-6 flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
          <WifiOffIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          You are offline. homedash will load and save again when the connection is back.
        </span>
      )}
    </output>
  )
}
