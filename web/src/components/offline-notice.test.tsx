import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { OfflineNotice } from '@/components/offline-notice'

function renderNotice() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OfflineNotice />
    </QueryClientProvider>,
  )
}

describe('OfflineNotice', () => {
  afterEach(() => onlineManager.setOnline(true))

  it('shows nothing while the server can be reached', () => {
    renderNotice()

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('says homedash is read-only while offline, and hides once back', () => {
    renderNotice()

    act(() => onlineManager.setOnline(false))
    expect(screen.getByRole('status')).toHaveTextContent('Offline: read-only')

    act(() => onlineManager.setOnline(true))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
