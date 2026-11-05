import { useSuspenseQuery } from '@tanstack/react-query'
import { type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCheckIcon,
  CircleAlertIcon,
  ListTodoIcon,
  type LucideIcon,
} from 'lucide-react'
import { useId } from 'react'

import type { Todo } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { GlassPanel } from '@/components/glass-panel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { todosQuery } from '@/features/todos/queries'
import {
  type WeekDay,
  type WeekProgress,
  dueGroup,
  dueLabel,
  summarize,
  upNext,
  weekDays,
  weekProgress,
} from '@/features/todos/schedule'
import { useToday } from '@/features/todos/use-today'
import { locale } from '@/lib/locale'
import { cn } from '@/lib/utils'

const longDate = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' })
const longWeekday = new Intl.DateTimeFormat(locale, { weekday: 'long' })

/** "Good morning" before noon, "Good afternoon" until 18:00, then "Good evening". */
function greeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function TitleRow({ now }: { now: Date }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{greeting(now)}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{longDate.format(now)}</p>
    </div>
  )
}

/** Each stat tile's artwork (index.css) and the colour of its icon. */
const tones = {
  negative: { art: 'art-peach', icon: 'text-negative' },
  brand: { art: 'art-coral', icon: 'text-data' },
  neutral: { art: 'art-mint', icon: 'text-foreground' },
  positive: { art: 'art-lavender', icon: 'text-positive' },
} as const

/**
 * A number worth seeing at a glance, on soft artwork framed in glass, like the
 * picture cards of the references.
 */
function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  index,
}: {
  label: string
  value: number
  icon: LucideIcon
  tone: keyof typeof tones
  index: number
}) {
  return (
    <div className="glass rise-in rounded-3xl p-1.5" style={{ '--i': index } as React.CSSProperties}>
      <div className={cn('relative flex h-28 flex-col justify-end overflow-hidden rounded-[1.1rem] p-3.5', tones[tone].art)}>
        <span className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-white/85 shadow-sm">
          <Icon aria-hidden="true" className={cn('size-4', tones[tone].icon)} />
        </span>
        {/* The label comes first for screen readers ("Overdue 1"); the number is drawn above it. */}
        <p className="order-2 text-sm font-medium text-foreground/80">{label}</p>
        <p className="order-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  )
}

/** Todos due each day this week: a bar per day, its done part in the brand gradient. */
function WeekChart({ days }: { days: WeekDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.due))
  const total = days.reduce((sum, d) => sum + d.due, 0)

  return (
    <GlassPanel
      title="This week"
      className="rise-in lg:col-span-2"
      style={{ '--i': 4 } as React.CSSProperties}
      action={
        <div aria-hidden="true" className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="bg-brand size-2 rounded-full" />
            Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-lavender" />
            To do
          </span>
        </div>
      }
    >
      {/* What screen readers get: the same numbers as a table. The wrapper hides it:
          browsers ignore the clipping of sr-only on a <table>, so its caption would show. */}
      <div className="sr-only">
        <table>
          <caption>Todos due each day this week</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Due</th>
              <th scope="col">Done</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.label}>
                <th scope="row">{longWeekday.format(day.date)}</th>
                <td>{day.due}</td>
                <td>{day.done}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div aria-hidden="true" className="px-5 pb-5">
        {total === 0 ? (
          <p className="pb-2 text-sm text-muted-foreground">Nothing is due this week.</p>
        ) : null}
        <div className="grid h-48 grid-cols-7 items-end gap-2">
          {days.map((day, i) => (
            <div key={day.label} className="flex h-full flex-col items-center justify-end gap-2">
              <span className={cn('text-xs tabular-nums', day.today ? 'font-semibold text-data' : 'text-muted-foreground')}>
                {day.due > 0 ? day.due : ''}
              </span>
              <div className="relative flex w-2.5 flex-1 items-end justify-center sm:w-3">
                {/* The track, then the bar: its height is the todos due that day. */}
                <div className="absolute inset-0 rounded-full bg-muted" />
                <div
                  className={cn(
                    'grow-up relative flex w-full flex-col-reverse overflow-hidden rounded-full',
                    day.today ? 'glow' : null,
                  )}
                  style={{ height: `${day.due === 0 ? 4 : (day.due / max) * 100}%`, '--i': i } as React.CSSProperties}
                >
                  <div className="bg-brand w-full" style={{ height: day.due === 0 ? 0 : `${(day.done / day.due) * 100}%` }} />
                  <div className={cn('w-full flex-1', day.due === 0 ? 'bg-muted' : 'bg-lavender')} />
                </div>
              </div>
              <span
                className={cn(
                  'flex flex-col items-center gap-1 text-xs',
                  day.today ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {day.label}
                <span className={cn('size-1 rounded-full', day.today ? 'bg-brand glow' : 'bg-transparent')} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  )
}

/** How much of this week's todos is done, as a ring in the orb gradient. */
function WeekRing({ week }: { week: WeekProgress }) {
  const gradient = useId()
  const percent = week.total === 0 ? 0 : Math.round((week.done / week.total) * 100)

  return (
    <GlassPanel title="Done this week" className="rise-in" style={{ '--i': 5 } as React.CSSProperties}>
      <div className="flex flex-col items-center px-5 pb-6">
        <div className="relative size-44">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90 drop-shadow-[0_4px_10px_var(--glow)]" aria-hidden="true">
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--brand-from)" />
                <stop offset="0.55" stopColor="var(--brand-via)" />
                <stop offset="1" stopColor="var(--brand-to)" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(43 39 48 / 0.06)" strokeWidth="10" />
            {week.done > 0 ? (
              <circle
                className="ring-fill"
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={`url(#${gradient})`}
                strokeWidth="10"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100"
                style={{ strokeDashoffset: 100 - percent }}
              />
            ) : null}
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              {week.total === 0 ? '—' : `${percent}%`}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground tabular-nums">
          {week.total === 0 ? (
            'Nothing is due this week.'
          ) : (
            <>
              <span className="font-medium text-foreground">{week.done}</span> of {week.total} done
            </>
          )}
        </p>
      </div>
    </GlassPanel>
  )
}

function DuePill({ todo, now }: { todo: Todo; now: Date }) {
  if (!todo.dueAt) return <span className="text-xs text-muted-foreground">No date</span>
  const group = dueGroup(todo, now)
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ring-1',
        group === 'overdue' ? 'bg-negative/10 text-negative ring-negative/15' : null,
        group === 'today' ? 'bg-primary/12 text-data ring-primary/20' : null,
        group !== 'overdue' && group !== 'today' ? 'chip ring-0' : null,
      )}
    >
      {dueLabel(todo.dueAt, now)}
    </span>
  )
}

function AllTodosLink() {
  return (
    <Link to="/todos" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      All todos
      <ArrowRightIcon aria-hidden="true" className="size-4" />
    </Link>
  )
}

function UpNext({ todos, now }: { todos: Todo[]; now: Date }) {
  return (
    <GlassPanel title="Up next" action={<AllTodosLink />} className="rise-in lg:col-span-2" style={{ '--i': 6 } as React.CSSProperties}>
      {todos.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">Nothing left to do.</p>
      ) : (
        <ul className="divide-y divide-rule border-t border-rule">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 px-5 py-3">
              <span
                aria-hidden="true"
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  dueGroup(todo, now) === 'overdue' ? 'bg-negative' : 'bg-brand',
                )}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{todo.title}</span>
              <DuePill todo={todo} now={now} />
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  )
}

function RecentlyDone({ todos }: { todos: Todo[] }) {
  return (
    <GlassPanel title="Recently done" className="rise-in" style={{ '--i': 7 } as React.CSSProperties}>
      {todos.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">Nothing done yet.</p>
      ) : (
        <ul className="divide-y divide-rule border-t border-rule">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 px-5 py-3">
              <CheckCheckIcon aria-hidden="true" className="size-4 shrink-0 text-positive" />
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{todo.title}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  )
}

/** The overview of the home: what needs attention, and how the week is going. */
export function HomePage() {
  const { data: todos } = useSuspenseQuery(todosQuery)
  const now = useToday()
  const summary = summarize(todos, now)
  const week = weekProgress(todos, now)
  const recentlyDone = todos
    .filter((t) => t.done)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  return (
    <>
      <TitleRow now={now} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Overdue" value={summary.overdue} icon={CircleAlertIcon} tone="negative" index={0} />
        <StatTile label="Due today" value={summary.today} icon={CalendarClockIcon} tone="brand" index={1} />
        <StatTile label="Open" value={summary.open} icon={ListTodoIcon} tone="neutral" index={2} />
        <StatTile label="Done this week" value={week.done} icon={CheckCheckIcon} tone="positive" index={3} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <WeekChart days={weekDays(todos, now)} />
        <WeekRing week={week} />
        <UpNext todos={upNext(todos, 5)} now={now} />
        <RecentlyDone todos={recentlyDone} />
      </div>
    </>
  )
}

/** The final layout with still bars in place of the numbers. */
export function HomePageSkeleton() {
  const now = useToday()
  return (
    <div aria-busy="true" aria-label="Loading the overview">
      <TitleRow now={now} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-3xl p-1.5">
            <Skeleton className="h-28 rounded-[1.1rem]" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass h-64 rounded-3xl lg:col-span-2" />
        <div className="glass h-64 rounded-3xl" />
      </div>
    </div>
  )
}

/** The error stays inside the page, with a way to try again. */
export function HomePageError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const now = useToday()
  return (
    <>
      <TitleRow now={now} />
      <GlassPanel title="Overview">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-5">
          <p className="text-sm">
            <span className="text-negative">Couldn’t load the overview.</span>{' '}
            <span className="text-muted-foreground">{errorMessage(error)}</span>
          </p>
          <Button variant="outline" size="sm" onClick={() => void router.invalidate()}>
            Try again
          </Button>
        </div>
      </GlassPanel>
    </>
  )
}
