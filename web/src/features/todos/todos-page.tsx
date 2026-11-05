import { useSuspenseQuery } from '@tanstack/react-query'
import { type ErrorComponentProps, useRouter } from '@tanstack/react-router'
import { ViewTransition, useDeferredValue, useState } from 'react'

import type { Todo } from '@/api/client'
import { errorMessage } from '@/api/errors'
import { GlassPanel } from '@/components/glass-panel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { todosQuery } from './queries'
import {
  type DueGroupKey,
  type Summary,
  type WeekProgress,
  groupOpenTodos,
  summarize,
  weekProgress,
} from './schedule'
import { CreateTodoDialog } from './todo-dialogs'
import { TodoItem } from './todo-item'
import { useToday } from './use-today'

/** Done todos shown before "Show all". */
const doneShown = 5

function TitleRow({ summary, week }: { summary?: Summary; week?: WeekProgress }) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Todos</h1>
          {summary ? <Finding summary={summary} /> : <Skeleton className="mt-1.5 h-4 w-48" />}
        </div>
        <CreateTodoDialog />
      </div>
      {week && week.total > 0 ? <WeekBar week={week} /> : null}
    </div>
  )
}

/** How much of this week's todos is done. It eases to the new value when one is checked. */
function WeekBar({ week }: { week: WeekProgress }) {
  const { done, total } = week
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">This week</span>
      {/* The native element for assistive tech; the bar beside it is what eyes see. */}
      <progress className="sr-only" aria-label="Todos due this week that are done" value={done} max={total} />
      <div aria-hidden="true" className="h-2 w-32 overflow-hidden rounded-full bg-muted sm:w-56">
        <div
          className="bg-brand glow h-full origin-left rounded-full transition-transform duration-250 ease-(--ease-out) motion-reduce:transition-none"
          style={{ transform: `scaleX(${done / total})` }}
        />
      </div>
      <span className="text-muted-foreground tabular-nums">
        <span className="font-medium text-foreground">{done}</span> of {total} done
      </span>
    </div>
  )
}

/** Each due group gets a soft band: rose for overdue, the orb wash for today. */
const bandStyles: Record<DueGroupKey, string> = {
  overdue: 'bg-negative/6 text-negative',
  today: 'bg-brand-soft text-data',
  soon: 'bg-muted text-muted-foreground',
  later: 'bg-muted text-muted-foreground',
  none: 'bg-muted text-muted-foreground',
}

/**
 * A todo that glides to its new place (another group, or Done) when it changes,
 * and fades in when added. See the view-transition styles in index.css.
 */
function MovingTodo({ todo, now }: { todo: Todo; now: Date }) {
  return (
    <ViewTransition
      name={`todo-${todo.id}`}
      share="todo-move"
      update="todo-move"
      enter="todo-enter"
      exit="todo-exit"
      default="none"
    >
      <TodoItem todo={todo} now={now} />
    </ViewTransition>
  )
}

/** The line under the title: the fact that most needs attention first. */
function Finding({ summary }: { summary: Summary }) {
  const { open, overdue, today } = summary
  if (open === 0) {
    return <p className="mt-1 text-sm text-muted-foreground">Nothing left to do.</p>
  }
  return (
    <p className="mt-1 text-sm text-muted-foreground tabular-nums">
      {overdue > 0 ? <span className="font-medium text-negative">{overdue} overdue</span> : null}
      {overdue > 0 ? ' · ' : null}
      {today > 0 ? `${today} due today · ` : null}
      {open} open
    </p>
  )
}

/** A panel of todos: glass, with its count as a chip. */
function Panel({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <GlassPanel
      title={title}
      action={
        count === undefined ? null : (
          <span className="chip rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums">
            {count}
          </span>
        )
      }
      className="overflow-hidden"
    >
      <div className="border-t border-rule">{children}</div>
    </GlassPanel>
  )
}

function DoneList({ todos, now }: { todos: Todo[]; now: Date }) {
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? todos : todos.slice(0, doneShown)
  return (
    <>
      <ul className="divide-y divide-rule">
        {shown.map((todo) => (
          <MovingTodo key={todo.id} todo={todo} now={now} />
        ))}
      </ul>
      {todos.length > doneShown ? (
        <div className="border-t border-rule px-4 py-2">
          <Button variant="link" size="sm" className="px-0 text-foreground" onClick={() => setShowAll((all) => !all)}>
            {showAll ? 'Show fewer' : `Show all ${todos.length} done`}
          </Button>
        </div>
      ) : null}
    </>
  )
}

export function TodosPage() {
  const { data } = useSuspenseQuery(todosQuery)
  // A deferred update runs as a transition, which lets <ViewTransition> animate
  // todos moving between groups when the list is refetched.
  const todos = useDeferredValue(data)
  // One "now" for the whole list, so every row agrees on what today is.
  const now = useToday()
  const summary = summarize(todos, now)
  const week = weekProgress(todos, now)
  const groups = groupOpenTodos(todos, now)
  const done = todos.filter((t) => t.done).toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="mx-auto max-w-3xl">
      <TitleRow summary={summary} week={week} />
      <div className="space-y-4">
        <Panel title="To do" count={summary.open}>
          {groups.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              {todos.length === 0
                ? 'Nothing here yet. Add the first thing to do at home with New todo.'
                : 'Everything is done.'}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.key}>
                <div
                  className={cn(
                    'flex items-center justify-between px-5 py-1.5 text-xs font-medium',
                    bandStyles[group.key],
                  )}
                >
                  <h3>{group.label}</h3>
                  <span className="tabular-nums">{group.todos.length}</span>
                </div>
                <ul className="divide-y divide-rule">
                  {group.todos.map((todo) => (
                    <MovingTodo key={todo.id} todo={todo} now={now} />
                  ))}
                </ul>
              </div>
            ))
          )}
        </Panel>
        {done.length > 0 ? (
          <Panel title="Done" count={done.length}>
            <DoneList todos={done} now={now} />
          </Panel>
        ) : null}
      </div>
    </div>
  )
}

/** The final layout with grey bars in place of the values, so nothing shifts when data lands. */
export function TodosPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading todos" className="mx-auto max-w-3xl">
      <TitleRow />
      <Panel title="To do">
        <ul>
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-4 rounded-[4px]" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

/** The error stays inside the block that failed, with a way to try again. */
export function TodosPageError({ error }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <div className="mx-auto max-w-3xl">
      <TitleRow />
      <Panel title="To do">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4">
          <p className="text-sm">
            <span className="text-negative">Couldn’t load the todos.</span>{' '}
            <span className="text-muted-foreground">{errorMessage(error)}</span>
          </p>
          <Button variant="outline" size="sm" onClick={() => void router.invalidate()}>
            Try again
          </Button>
        </div>
      </Panel>
    </div>
  )
}
