import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRuns, deleteRun, type Run } from '../api/runs'
import { RunsTable } from '@/features/runs/RunsTable'
import { RunFormDialog } from '@/features/runs/RunFormDialog'
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
  if (runs.length === 0) return <p className="text-muted-foreground">No runs yet.</p>

  return (
    <>
      <RunsTable runs={runs} onEdit={setEditingRun} onDelete={setPendingDelete} />

      {/* Edit: the run-entry form, prefilled, inside the shared dialog. */}
      <RunFormDialog
        open={editingRun !== null}
        onOpenChange={(open) => {
          if (!open) setEditingRun(null)
        }}
        initialRun={editingRun ?? undefined}
        title="Edit run"
        description="Update the details of this run."
      />

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
