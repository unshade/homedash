/** The homedash mark: a house whose door is a check mark, drawn for the product. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3.5 10.2 12 3.5l8.5 6.7V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"
        fill="currentColor"
      />
      <path
        d="m8.5 14.5 2.5 2.5 4.5-5"
        stroke="var(--primary-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
