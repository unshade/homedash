/**
 * The calm ground behind every page (ADR 22): still washes of peach and
 * lavender light that the frosted glass panels blur. Styles are in index.css.
 */
export function Backdrop() {
  return <div aria-hidden="true" className="backdrop-wash pointer-events-none fixed inset-0 -z-10" />
}
