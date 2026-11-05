import { useEffect, useState } from 'react'

/**
 * The current moment, captured once and refreshed just after midnight, so a
 * page left open overnight moves "Today" to the right day.
 */
export function useToday(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timer = setTimeout(() => setNow(new Date()), tomorrow.getTime() - Date.now() + 1000)
    return () => clearTimeout(timer)
  }, [now])

  return now
}
