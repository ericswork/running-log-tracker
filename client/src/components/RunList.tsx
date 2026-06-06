import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRuns, deleteRun, type Run } from '../api/runs'
import { RunForm } from './RunForm'

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function RunList() {
  const queryClient = useQueryClient()

  // The API already returns runs newest-first; we render them in order.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
  })

  // Which run (if any) is currently in edit mode. Only one at a time.
  const [editingId, setEditingId] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteRun,
    onSuccess: () => {
      // Refetch the list so the removed run disappears without a page reload.
      queryClient.invalidateQueries({ queryKey: ['runs'] })
    },
  })

  function handleDelete(run: Run) {
    // Confirmation guards against accidental deletion; declining makes no API call.
    if (!window.confirm(`Delete this ${run.type} run from ${formatDateTime(run.date)}?`)) {
      return
    }
    deleteMutation.mutate(run.id)
  }

  if (isLoading) return <p>Loading runs…</p>
  if (isError) return <p style={{ color: 'crimson' }}>Failed to load runs: {(error as Error).message}</p>

  const runs: Run[] = data ?? []
  if (runs.length === 0) return <p>No runs yet. Add one above.</p>

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
      {runs.map((run) => (
        <li key={run.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: '0.75rem' }}>
          {editingId === run.id ? (
            // Keyed by run id so the form re-prefills correctly per run. onDone
            // (save or cancel) closes the form back to the read-only row.
            <RunForm key={run.id} initialRun={run} onDone={() => setEditingId(null)} />
          ) : (
            <>
              <strong>{run.type}</strong> — {run.distanceKm} km in {formatDuration(run.durationSec)}
              <br />
              <small>{formatDateTime(run.date)}</small>
              {run.notes && <p style={{ margin: '0.5rem 0 0' }}>{run.notes}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditingId(run.id)}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(run)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
