import type { Todo } from '@/api/client'
import { locale } from '@/lib/locale'

// Open todos are grouped by when they are due, in the household's own words,
// so the list answers "what needs doing next?" before anything else.

export type DueGroupKey = 'overdue' | 'today' | 'soon' | 'later' | 'none'

export type DueGroup = {
  key: DueGroupKey
  label: string
  todos: Todo[]
}

const groupLabels: Record<DueGroupKey, string> = {
  overdue: 'Overdue',
  today: 'Today',
  soon: 'Next 7 days',
  later: 'Later',
  none: 'No due date',
}

const groupOrder: DueGroupKey[] = ['overdue', 'today', 'soon', 'later', 'none']

const dayMs = 24 * 60 * 60 * 1000

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Whole days from today to the due day: -1 yesterday, 0 today, 1 tomorrow. */
export function daysUntil(iso: string, now: Date): number {
  return Math.round((startOfDay(new Date(iso)) - startOfDay(now)) / dayMs)
}

export function dueGroup(todo: Todo, now: Date): DueGroupKey {
  if (!todo.dueAt) return 'none'
  const days = daysUntil(todo.dueAt, now)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 7) return 'soon'
  return 'later'
}

/** The open todos in their due groups, soonest first; empty groups are left out. */
export function groupOpenTodos(todos: Todo[], now: Date): DueGroup[] {
  const groups = new Map<DueGroupKey, Todo[]>()
  for (const todo of todos) {
    if (todo.done) continue
    const key = dueGroup(todo, now)
    groups.set(key, [...(groups.get(key) ?? []), todo])
  }
  return groupOrder.flatMap((key) => {
    const members = groups.get(key)
    return members ? [{ key, label: groupLabels[key], todos: members.toSorted(bySoonest) }] : []
  })
}

function bySoonest(a: Todo, b: Todo): number {
  if (a.dueAt && b.dueAt && a.dueAt !== b.dueAt) return a.dueAt < b.dueAt ? -1 : 1
  return a.id - b.id
}

const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
const dayMonthYear = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })

/** "Today", "Tomorrow", "Yesterday", a weekday within the week, otherwise the date. */
export function dueLabel(iso: string, now: Date): string {
  const days = daysUntil(iso, now)
  const date = new Date(iso)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 1 && days < 7) return weekday.format(date)
  return date.getFullYear() === now.getFullYear() ? dayMonth.format(date) : dayMonthYear.format(date)
}

export type Summary = {
  open: number
  overdue: number
  today: number
}

export function summarize(todos: Todo[], now: Date): Summary {
  let open = 0
  let overdue = 0
  let today = 0
  for (const todo of todos) {
    if (todo.done) continue
    open++
    const group = dueGroup(todo, now)
    if (group === 'overdue') overdue++
    if (group === 'today') today++
  }
  return { open, overdue, today }
}

export type WeekProgress = {
  /** Todos due this week (Monday to Sunday), done or not. */
  total: number
  done: number
}

/** How many of the todos due this week (Monday to Sunday) are done. */
export function weekProgress(todos: Todo[], now: Date): WeekProgress {
  const daysSinceMonday = (now.getDay() + 6) % 7
  let total = 0
  let done = 0
  for (const todo of todos) {
    if (!todo.dueAt) continue
    const days = daysUntil(todo.dueAt, now)
    if (days < -daysSinceMonday || days > 6 - daysSinceMonday) continue
    total++
    if (todo.done) done++
  }
  return { total, done }
}

export type WeekDay = {
  /** Midnight of the day. */
  date: Date
  /** "Mon", "Tue"… in the app's locale. */
  label: string
  /** Todos due that day, done or not, and how many of them are done. */
  due: number
  done: number
  today: boolean
}

/** This week (Monday to Sunday) day by day: how many todos are due each day, and how many are done. */
export function weekDays(todos: Todo[], now: Date): WeekDay[] {
  const daysSinceMonday = (now.getDay() + 6) % 7
  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday + i)
    return { date, label: weekday.format(date), due: 0, done: 0, today: i === daysSinceMonday }
  })
  for (const todo of todos) {
    if (!todo.dueAt) continue
    const day = days[daysUntil(todo.dueAt, now) + daysSinceMonday]
    if (!day) continue
    day.due++
    if (todo.done) day.done++
  }
  return days
}

/** The next open todos to deal with: overdue and dated first, soonest first, then undated ones. */
export function upNext(todos: Todo[], limit: number): Todo[] {
  return todos
    .filter((todo) => !todo.done)
    .toSorted((a, b) => {
      if (Boolean(a.dueAt) !== Boolean(b.dueAt)) return a.dueAt ? -1 : 1
      return bySoonest(a, b)
    })
    .slice(0, limit)
}
