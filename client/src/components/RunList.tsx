import { useQuery } from '@tanstack/react-query'
import { fetchRuns, type Run } from '../api/runs'

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
  // The API already returns runs newest-first; we render them in order.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
  })

  if (isLoading) return <p>Loading runs…</p>
  if (isError) return <p style={{ color: 'crimson' }}>Failed to load runs: {(error as Error).message}</p>

  const runs: Run[] = data ?? []
  if (runs.length === 0) return <p>No runs yet. Add one above.</p>

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
      {runs.map((run) => (
        <li key={run.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: '0.75rem' }}>
          <strong>{run.type}</strong> — {run.distanceKm} km in {formatDuration(run.durationSec)}
          <br />
          <small>{formatDateTime(run.date)}</small>
          {run.notes && <p style={{ margin: '0.5rem 0 0' }}>{run.notes}</p>}
        </li>
      ))}
    </ul>
  )
}
