import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRuns, deleteRun, type Run } from '../api/runs'
import { RunForm } from './RunForm'
import { RunsTable } from '@/features/runs/RunsTable'

export function RunList() {
  const queryClient = useQueryClient()

  // The API returns runs newest-first; the table re-sorts from there.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
  })

  // The run currently being edited, if any. Only one at a time.
  const [editingRun, setEditingRun] = useState<Run | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] })
    },
  })

  function handleDelete(run: Run) {
    // Interim confirmation; Group 5 replaces this with a styled AlertDialog.
    if (!window.confirm(`Delete this ${run.type} run?`)) return
    deleteMutation.mutate(run.id)
  }

  if (isLoading) return <p className="text-muted-foreground">Loading runs…</p>
  if (isError)
    return <p className="text-destructive">Failed to load runs: {(error as Error).message}</p>

  const runs: Run[] = data ?? []
  if (runs.length === 0) return <p className="text-muted-foreground">No runs yet. Add one above.</p>

  return (
    <div className="grid gap-4">
      {/* Interim: editing renders the form above the table. Group 5 moves this
          into a shadcn Dialog. */}
      {editingRun && (
        <div className="rounded-md border p-4">
          <RunForm initialRun={editingRun} onDone={() => setEditingRun(null)} />
        </div>
      )}
      <RunsTable runs={runs} onEdit={setEditingRun} onDelete={handleDelete} />
    </div>
  )
}
