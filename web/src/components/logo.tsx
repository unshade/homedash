import { useId } from 'react'

/**
 * The homedash mark: a house whose door is a check mark, lit like the coral
 * orb of the references (a soft highlight at the top left).
 */
export function Logo({ className }: { className?: string }) {
  // Each logo needs its own gradient id: ids must be unique in the page.
  const orb = useId()
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id={orb} cx="0.3" cy="0.25" r="0.85">
          <stop offset="0" stopColor="#ffd2bd" />
          <stop offset="0.45" stopColor="var(--brand-from)" />
          <stop offset="1" stopColor="var(--brand-via)" />
        </radialGradient>
      </defs>
      <path d="M3.5 10.2 12 3.5l8.5 6.7V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" fill={`url(#${orb})`} />
      <path
        d="m8.5 14.5 2.5 2.5 4.5-5"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
