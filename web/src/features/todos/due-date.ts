// Due dates are picked as calendar days (<input type="date">, "YYYY-MM-DD") and
// sent to the API as the start of that day in the user's time zone.

/** Converts a "YYYY-MM-DD" input value to an ISO date-time, or undefined when empty. */
export function toApiDate(day: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return undefined
  const [, year, month, date] = match.map(Number) as [number, number, number, number]
  return new Date(year, month - 1, date).toISOString()
}

/** Converts an ISO date-time from the API to a "YYYY-MM-DD" input value ("" when missing). */
export function toInputDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
