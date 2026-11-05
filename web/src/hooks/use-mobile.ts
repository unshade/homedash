import { useSyncExternalStore } from 'react'

const MOBILE_BREAKPOINT = 768
const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const isPhoneWidth = () => window.matchMedia(query).matches

/** Whether the window is phone-sized (narrower than 768px), kept up to date as it resizes. */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, isPhoneWidth)
}
