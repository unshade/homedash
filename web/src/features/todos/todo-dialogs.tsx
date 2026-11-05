import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Todo } from '@/api/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { useOnline } from '@/hooks/use-online'

import { toApiDate, toInputDate } from './due-date'
import { useCreateTodo, useDeleteTodo, useUpdateTodo } from './queries'
import { TodoForm } from './todo-form'
import { emptyTodoForm, type TodoFormValues } from './todo-form-schema'

type ControlledDialogProps = {
  todo: Todo
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SubmitButton({ form, pending, children }: { form: string; pending: boolean; children: string }) {
  return (
    <Button type="submit" form={form} disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {children}
    </Button>
  )
}

export function CreateTodoDialog() {
  const [open, setOpen] = useState(false)
  const create = useCreateTodo()
  // Offline, homedash is read-only.
  const online = useOnline()

  const save = (values: TodoFormValues) =>
    create.mutateAsync(
      {
        body: {
          title: values.title,
          description: values.description,
          dueAt: toApiDate(values.dueDate),
        },
      },
      {
        onSuccess: () => {
          setOpen(false)
          toast.success('Todo added.')
        },
      },
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!online}>
          <PlusIcon data-icon="inline-start" />
          New todo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New todo</DialogTitle>
          <DialogDescription>Something to do at home.</DialogDescription>
        </DialogHeader>
        <TodoForm id="create-todo" defaultValues={emptyTodoForm} onSubmit={save} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <SubmitButton form="create-todo" pending={create.isPending}>
            Add todo
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EditTodoDialog({ todo, open, onOpenChange }: ControlledDialogProps) {
  const update = useUpdateTodo()

  const save = (values: TodoFormValues) => {
    const dueAt = toApiDate(values.dueDate) ?? null
    return update.mutateAsync(
      {
        params: { path: { id: todo.id } },
        body: {
          title: values.title,
          description: values.description,
          // null removes the due date; leaving it out keeps it unchanged.
          ...(dueAt !== (todo.dueAt ?? null) ? { dueAt } : {}),
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          toast.success('Todo updated.')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit todo</DialogTitle>
          <DialogDescription>Clear the due date to remove it.</DialogDescription>
        </DialogHeader>
        <TodoForm
          id={`edit-todo-${todo.id}`}
          defaultValues={{
            title: todo.title,
            description: todo.description,
            dueDate: toInputDate(todo.dueAt),
          }}
          onSubmit={save}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <SubmitButton form={`edit-todo-${todo.id}`} pending={update.isPending}>
            Save
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteTodoDialog({ todo, open, onOpenChange }: ControlledDialogProps) {
  const remove = useDeleteTodo()

  const confirm = (event: React.MouseEvent) => {
    // Keep the dialog open until the deletion succeeds.
    event.preventDefault()
    remove.mutate(
      { params: { path: { id: todo.id } } },
      {
        onSuccess: () => {
          onOpenChange(false)
          toast.success('Todo deleted.')
        },
      },
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this todo?</AlertDialogTitle>
          <AlertDialogDescription>
            “{todo.title}” will be deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm} disabled={remove.isPending}>
            {remove.isPending ? <Spinner data-icon="inline-start" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
