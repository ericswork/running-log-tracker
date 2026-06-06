import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRuns, deleteRun, type Run } from '../api/runs'
import { RunForm } from './RunForm'
import { RunsTable } from '@/features/runs/RunsTable'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

export function RunList() {
  const queryClient = useQueryClient()

  // The API returns runs newest-first; the table re-sorts from there.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
  })

  // Only one run is edited (Dialog) or pending deletion (AlertDialog) at a time.
  const [editingRun, setEditingRun] = useState<Run | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Run | null>(null)

  const deleteMutation = useMutation({
    // Wrap so deleteRun only ever receives the id — React Query v5 passes a
    // context object as a second arg to a bare mutationFn.
    mutationFn: (id: string) => deleteRun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] })
    },
  })

  function confirmDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id)
    setPendingDelete(null)
  }

  if (isLoading) return <p className="text-muted-foreground">Loading runs…</p>
  if (isError)
    return <p className="text-destructive">Failed to load runs: {(error as Error).message}</p>

  const runs: Run[] = data ?? []
  if (runs.length === 0) return <p className="text-muted-foreground">No runs yet. Add one above.</p>

  return (
    <>
      <RunsTable runs={runs} onEdit={setEditingRun} onDelete={setPendingDelete} />

      {/* Edit: the run-entry form, prefilled, inside a dialog. */}
      <Dialog
        open={editingRun !== null}
        onOpenChange={(open) => {
          if (!open) setEditingRun(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit run</DialogTitle>
            <DialogDescription>Update the details of this run.</DialogDescription>
          </DialogHeader>
          {editingRun && (
            <RunForm
              key={editingRun.id}
              initialRun={editingRun}
              onDone={() => setEditingRun(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete: explicit confirmation; declining makes no API call. */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this run?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the {pendingDelete?.type} run. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
