import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import type { Todo } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useOnline } from '@/hooks/use-online'
import { cn } from '@/lib/utils'

import { useUpdateTodo } from './queries'
import { dueGroup, dueLabel } from './schedule'
import { DeleteTodoDialog, EditTodoDialog } from './todo-dialogs'

function DueDate({ todo, done, now }: { todo: Todo; done: boolean; now: Date }) {
  if (!todo.dueAt) return null
  const group = done ? null : dueGroup(todo, now)
  return (
    <time
      dateTime={todo.dueAt}
      className={cn(
        'shrink-0 pt-px text-sm whitespace-nowrap tabular-nums text-muted-foreground',
        // Red only on the overdue fact; the data hue on what is due today.
        group === 'overdue' ? 'text-negative' : null,
        group === 'today' ? 'font-medium text-data' : null,
      )}
    >
      {dueLabel(todo.dueAt, now)}
    </time>
  )
}

export function TodoItem({ todo, now }: { todo: Todo; now: Date }) {
  const update = useUpdateTodo()
  // Offline, homedash is read-only.
  const online = useOnline()
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null)

  // Show the new state right away while the change is being saved.
  const pendingDone = update.isPending ? update.variables.body?.done : undefined
  const done = pendingDone ?? todo.done
  const checkboxId = `todo-${todo.id}`

  const closeDialog = (open: boolean) => {
    if (!open) setDialog(null)
  }

  return (
    <li className="flex items-start gap-3 py-3 pr-2 pl-4">
      <Checkbox
        id={checkboxId}
        className="mt-0.5"
        checked={done}
        disabled={update.isPending || !online}
        onCheckedChange={(checked) =>
          update.mutate({ params: { path: { id: todo.id } }, body: { done: checked === true } })
        }
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={checkboxId}
          className={cn('block text-sm font-medium break-words', done ? 'text-muted-foreground line-through' : null)}
        >
          {todo.title}
        </label>
        {todo.description ? (
          <p className="mt-0.5 text-sm whitespace-pre-wrap break-words text-muted-foreground">{todo.description}</p>
        ) : null}
      </div>
      <DueDate todo={todo} done={done} now={now} />
      {/* modal={false}: the menu opens dialogs, which manage focus themselves. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="-my-1 text-muted-foreground max-sm:-my-2.5 max-sm:size-11" aria-label={`Actions for “${todo.title}”`}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!online} onSelect={() => setDialog('edit')}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={!online} onSelect={() => setDialog('delete')}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditTodoDialog todo={todo} open={dialog === 'edit'} onOpenChange={closeDialog} />
      <DeleteTodoDialog todo={todo} open={dialog === 'delete'} onOpenChange={closeDialog} />
    </li>
  )
}
