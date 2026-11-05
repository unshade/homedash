import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange)
const isOnline = () => onlineManager.isOnline()

/**
 * Whether homedash can reach its server (see src/lib/connection.ts). While it
 * can't, the app is read-only.
 */
export function useOnline() {
  return useSyncExternalStore(subscribe, isOnline)
}
