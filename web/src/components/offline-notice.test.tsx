import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OfflineNotice } from '@/components/offline-notice'

function goOffline(offline: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(!offline)
  act(() => {
    window.dispatchEvent(new Event(offline ? 'offline' : 'online'))
  })
}

describe('OfflineNotice', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows nothing while online', () => {
    render(<OfflineNotice />)

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('tells the user when the connection is lost, and hides once it is back', () => {
    render(<OfflineNotice />)

    goOffline(true)
    expect(screen.getByRole('status')).toHaveTextContent('You are offline.')

    goOffline(false)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
