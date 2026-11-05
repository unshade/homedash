import { describe, expect, it } from 'vitest'

import type { Todo } from '@/api/client'

import { dueLabel, groupOpenTodos, summarize, upNext, weekDays, weekProgress } from './schedule'

const now = new Date(2026, 10, 4, 15, 30) // Wednesday 4 November 2026, 15:30

function day(offset: number): string {
  return new Date(2026, 10, 4 + offset).toISOString()
}

function todo(id: number, dueAt?: string, done = false): Todo {
  return {
    id,
    title: `Todo ${id}`,
    description: '',
    done,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
    ...(dueAt ? { dueAt } : {}),
  }
}

describe('groupOpenTodos', () => {
  it('groups open todos by when they are due, in order', () => {
    const groups = groupOpenTodos(
      [todo(1), todo(2, day(10)), todo(3, day(2)), todo(4, day(0)), todo(5, day(-3)), todo(6, day(7))],
      now,
    )

    expect(groups.map((g) => [g.label, g.todos.map((t) => t.id)])).toEqual([
      ['Overdue', [5]],
      ['Today', [4]],
      ['Next 7 days', [3, 6]],
      ['Later', [2]],
      ['No due date', [1]],
    ])
  })

  it('leaves out done todos and empty groups', () => {
    const groups = groupOpenTodos([todo(1, day(-1), true), todo(2, day(1))], now)

    expect(groups.map((g) => g.label)).toEqual(['Next 7 days'])
  })

  it('returns no groups when nothing is open', () => {
    expect(groupOpenTodos([todo(1, undefined, true)], now)).toEqual([])
  })
})

describe('dueLabel', () => {
  it('names the nearby days', () => {
    expect(dueLabel(day(0), now)).toBe('Today')
    expect(dueLabel(day(1), now)).toBe('Tomorrow')
    expect(dueLabel(day(-1), now)).toBe('Yesterday')
  })

  it('uses the weekday within the week', () => {
    expect(dueLabel(day(3), now)).toBe('Sat')
  })

  it('uses the date further away, with the year only when it differs', () => {
    expect(dueLabel(day(20), now)).toBe('24 Nov')
    expect(dueLabel(new Date(2027, 0, 15).toISOString(), now)).toBe('15 Jan 2027')
  })

  it('formats in the interface language whatever the browser language is', () => {
    expect(dueLabel(day(-6), now)).toBe('29 Oct')
  })
})

describe('summarize', () => {
  it('counts what is open, overdue and due today', () => {
    const summary = summarize(
      [todo(1, day(-2)), todo(2, day(-1)), todo(3, day(0)), todo(4), todo(5, day(-5), true)],
      now,
    )

    expect(summary).toEqual({ open: 4, overdue: 2, today: 1 })
  })
})

describe('weekProgress', () => {
  it('counts the todos due from Monday to Sunday and how many are done', () => {
    // now is a Wednesday: the week runs from day(-2) to day(4).
    const progress = weekProgress(
      [
        todo(1, day(-2), true), // Monday, done
        todo(2, day(-1)), // Tuesday, overdue
        todo(3, day(0), true), // today, done
        todo(4, day(4)), // Sunday
        todo(5, day(-3), true), // last Sunday: not this week
        todo(6, day(5)), // next Monday: not this week
        todo(7), // no due date
      ],
      now,
    )

    expect(progress).toEqual({ total: 4, done: 2 })
  })

  it('is empty when nothing is due this week', () => {
    expect(weekProgress([todo(1), todo(2, day(20))], now)).toEqual({ total: 0, done: 0 })
  })
})

describe('weekDays', () => {
  it('counts the todos due and done on each day from Monday to Sunday', () => {
    // Monday is day(-2), Sunday day(4).
    const days = weekDays([todo(1, day(-2)), todo(2, day(0), true), todo(3, day(0)), todo(4, day(4))], now)

    expect(days.map((d) => d.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(days.map((d) => d.due)).toEqual([1, 0, 2, 0, 0, 0, 1])
    expect(days.map((d) => d.done)).toEqual([0, 0, 1, 0, 0, 0, 0])
    expect(days.map((d) => d.today)).toEqual([false, false, true, false, false, false, false])
  })

  it('leaves out todos due outside this week or with no due date', () => {
    const days = weekDays([todo(1, day(-3)), todo(2, day(5)), todo(3)], now)

    expect(days.every((d) => d.due === 0)).toBe(true)
  })
})

describe('upNext', () => {
  it('lists open todos soonest first, undated ones last, up to the limit', () => {
    const todos = [todo(1), todo(2, day(3)), todo(3, day(-1)), todo(4, day(0), true), todo(5, day(1))]

    expect(upNext(todos, 3).map((t) => t.id)).toEqual([3, 5, 2])
    expect(upNext(todos, 10).map((t) => t.id)).toEqual([3, 5, 2, 1])
  })
})
