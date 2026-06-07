import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRuns, deleteRun, type Run } from '../api/runs'
import { RunsTable } from '@/features/runs/RunsTable'
import { RunFilterBar } from '@/features/runs/RunFilterBar'
import {
  defaultFilterState,
  isFilterActive,
  noTypesSelected,
  toApiFilters,
  type FilterState,
} from '@/features/runs/filters'
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

  // Log filter state; the run-type chips default to all selected.
  const [filters, setFilters] = useState<FilterState>(defaultFilterState)
  const apiFilters = toApiFilters(filters)
  // No run types selected → empty by definition; skip the request entirely.
  const emptyTypeSelection = noTypesSelected(filters)

  // The API returns runs newest-first (already filtered); the table re-sorts.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['runs', apiFilters],
    queryFn: () => fetchRuns(apiFilters),
    enabled: !emptyTypeSelection,
  })

  // Only one run is edited (Dialog) or pending deletion (AlertDialog) at a time.
  const [editingRun, setEditingRun] = useState<Run | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Run | null>(null)

  const deleteMutation = useMutation({
    // Wrap so deleteRun only ever receives the id — React Query v5 passes a
    // context object as a second arg to a bare mutationFn.
    mutationFn: (id: string) => deleteRun(id),
    onSuccess: () => {
      // Prefix match invalidates every filtered ['runs', …] variant.
      queryClient.invalidateQueries({ queryKey: ['runs'] })
    },
  })

  function confirmDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id)
    setPendingDelete(null)
  }

  const runs: Run[] = emptyTypeSelection ? [] : (data ?? [])
  const filtered = isFilterActive(filters)
  const resultCount = emptyTypeSelection ? 0 : data?.length

  // Body below the always-visible filter bar.
  let body
  if (!emptyTypeSelection && isLoading) {
    body = <p className="text-muted-foreground">Loading runs…</p>
  } else if (!emptyTypeSelection && isError) {
    body = (
      <p className="text-destructive">
        Failed to load runs: {(error as Error).message}
      </p>
    )
  } else if (runs.length === 0) {
    body = (
      <p className="text-muted-foreground">
        {filtered ? 'No runs match your filters.' : 'No runs yet.'}
      </p>
    )
  } else {
    body = (
      <RunsTable runs={runs} onEdit={setEditingRun} onDelete={setPendingDelete} />
    )
  }

  return (
    <>
      <RunFilterBar value={filters} onChange={setFilters} resultCount={resultCount} />

      {body}

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
