import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

const toastId = 'app-update'

/**
 * Registers the service worker that makes homedash installable and usable
 * offline (ADR 18). When a new version has been downloaded, asks before
 * switching to it, so nothing typed in an open form is lost.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!needRefresh) return
    toast('A new version of homedash is ready.', {
      id: toastId,
      duration: Infinity,
      action: { label: 'Reload', onClick: () => void updateServiceWorker(true) },
    })
  }, [needRefresh, updateServiceWorker])

  return null
}
