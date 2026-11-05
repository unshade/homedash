import { describe, expect, it } from 'vitest'

import { toApiDate, toInputDate } from './due-date'

describe('toApiDate', () => {
  it('converts a day to the start of that day in local time', () => {
    const iso = toApiDate('2026-12-24')

    expect(iso).toBe(new Date(2026, 11, 24).toISOString())
  })

  it('returns undefined for an empty or malformed value', () => {
    expect(toApiDate('')).toBeUndefined()
    expect(toApiDate('24/12/2026')).toBeUndefined()
  })
})

describe('toInputDate', () => {
  it('converts an API date back to the same day', () => {
    expect(toInputDate(new Date(2026, 11, 24).toISOString())).toBe('2026-12-24')
  })

  it('returns an empty value when there is no date', () => {
    expect(toInputDate(undefined)).toBe('')
    expect(toInputDate('not a date')).toBe('')
  })
})
