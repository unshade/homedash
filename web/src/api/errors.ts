import type { ApiError } from './client'

/** Reports whether error is an RFC 9457 problem returned by the API. */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  )
}

/** A message that can be shown to the user for any error. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) {
    const details = error.errors?.map((e) => e.message).filter(Boolean) ?? []
    const summary = error.detail ?? error.title ?? 'The request failed.'
    return details.length > 0 ? `${summary}: ${details.join(', ')}` : summary
  }
  if (error instanceof TypeError) {
    return 'Cannot reach the server. Check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}

/**
 * Validation messages by request body field, from the `body.<field>` locations
 * of an API error (e.g. `{ title: 'expected length >= 1' }`).
 */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error)) return {}
  const result: Record<string, string> = {}
  for (const detail of error.errors ?? []) {
    const field = detail.location?.match(/^body\.(\w+)$/)?.[1]
    if (field && detail.message && !(field in result)) {
      result[field] = detail.message
    }
  }
  return result
}
