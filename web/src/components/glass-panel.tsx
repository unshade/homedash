import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * A glass panel with a heading: the building block of every screen (ADR 22).
 * `action` sits at the right of the heading (a count, a link).
 */
export function GlassPanel({
  title,
  action,
  className,
  children,
  style,
}: {
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
  style?: React.CSSProperties
}) {
  const id = `panel-${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`
  return (
    <section aria-labelledby={id} className={cn('glass rounded-3xl', className)} style={style}>
      <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
        <h2 id={id} className="text-base font-semibold tracking-tight">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
