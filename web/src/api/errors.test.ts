import { describe, expect, it } from 'vitest'

import { errorMessage, fieldErrors, isApiError } from './errors'

const validationError = {
  type: 'about:blank',
  title: 'Unprocessable Entity',
  status: 422,
  detail: 'validation failed',
  errors: [
    { location: 'body.title', message: 'expected length >= 1' },
    { location: 'body.done', message: 'must not be null' },
  ],
}

describe('isApiError', () => {
  it('recognizes an API problem', () => {
    expect(isApiError(validationError)).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isApiError(new Error('boom'))).toBe(false)
    expect(isApiError(null)).toBe(false)
    expect(isApiError({ status: '422' })).toBe(false)
  })
})

describe('errorMessage', () => {
  it('lists the validation messages of an API problem', () => {
    expect(errorMessage(validationError)).toBe(
      'validation failed: expected length >= 1, must not be null',
    )
  })

  it('uses the title when there is no detail', () => {
    expect(errorMessage({ type: 'about:blank', status: 404, title: 'Not Found' })).toBe('Not Found')
  })

  it('explains network failures', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toMatch(/cannot reach the server/i)
  })

  it('falls back to a generic message', () => {
    expect(errorMessage('weird')).toMatch(/something went wrong/i)
  })
})

describe('fieldErrors', () => {
  it('maps body locations to field names', () => {
    expect(fieldErrors(validationError)).toEqual({
      title: 'expected length >= 1',
      done: 'must not be null',
    })
  })

  it('ignores errors that are not about the body', () => {
    expect(
      fieldErrors({ type: 'x', status: 422, errors: [{ location: 'path.id', message: 'bad' }] }),
    ).toEqual({})
  })

  it('returns nothing for other errors', () => {
    expect(fieldErrors(new Error('boom'))).toEqual({})
  })
})
