import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { OnChangeFn, SortingState } from '@tanstack/react-table'
import {
  fetchRuns,
  deleteRun,
  type Run,
  type RunListParams,
  type RunSortField,
  type SortOrder,
} from '../api/runs'
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
import { Button } from '@/components/ui/button'
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

const PAGE_SIZE = 20

export function RunList() {
  const queryClient = useQueryClient()

  // Log filter state; the run-type chips default to all selected.
  const [filters, setFilters] = useState<FilterState>(defaultFilterState)
  const apiFilters = toApiFilters(filters)
  // No run types selected → empty by definition; skip the request entirely.
  const emptyTypeSelection = noTypesSelected(filters)

  // Server-side sort (default newest-first) and the current page offset.
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [offset, setOffset] = useState(0)
  const sort = (sorting[0]?.id ?? 'date') as RunSortField
  const order: SortOrder = sorting[0]?.desc ? 'desc' : 'asc'

  // Changing the filters or the sort returns to the first page. Resetting the
  // offset in the same handler keeps it atomic with the change (React batches the
  // two updates into one render), so the list refetches once — not twice (a stale
  // offset followed by a reset).
  function handleFiltersChange(next: FilterState) {
    setFilters(next)
    setOffset(0)
  }
  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting(updater)
    setOffset(0)
  }

  const params: RunListParams = {
    ...apiFilters,
    limit: PAGE_SIZE,
    offset,
    sort,
    order,
  }

  // A page of filtered, server-sorted runs plus the full filtered total.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['runs', apiFilters, sort, order, offset],
    queryFn: () => fetchRuns(params),
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

  const runs: Run[] = emptyTypeSelection ? [] : (data?.runs ?? [])
  const total = emptyTypeSelection ? 0 : (data?.total ?? 0)
  const filtered = isFilterActive(filters)

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total

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
      <RunsTable
        runs={runs}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        onEdit={setEditingRun}
        onDelete={setPendingDelete}
      />
    )
  }

  return (
    <>
      <RunFilterBar
        value={filters}
        onChange={handleFiltersChange}
        resultCount={emptyTypeSelection ? 0 : data?.total}
      />

      {body}

      {/* Pagination: only meaningful when the filtered set spans multiple pages. */}
      {!emptyTypeSelection && !isLoading && !isError && total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
