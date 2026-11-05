import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

const isOnline = () => navigator.onLine

/** Whether the browser has a network connection, kept up to date. */
export function useOnline() {
  return useSyncExternalStore(subscribe, isOnline)
}
