import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createRun,
  updateRun,
  importGpx,
  RUN_TYPES,
  type Run,
  type RunType,
} from '../api/runs'

const pad = (n: number) => String(n).padStart(2, '0')

interface RunFormProps {
  // When provided, the form edits this run (PATCH) instead of creating one.
  initialRun?: Run
  // Called after a successful edit save, or when the user cancels editing.
  onDone?: () => void
}

export function RunForm({ initialRun, onDone }: RunFormProps = {}) {
  const queryClient = useQueryClient()
  const isEditing = initialRun !== undefined

  const [distanceKm, setDistanceKm] = useState(
    initialRun ? String(initialRun.distanceKm) : '',
  )
  const [hours, setHours] = useState(
    initialRun ? String(Math.floor(initialRun.durationSec / 3600)) : '',
  )
  const [minutes, setMinutes] = useState(
    initialRun ? String(Math.floor((initialRun.durationSec % 3600) / 60)) : '',
  )
  const [seconds, setSeconds] = useState(
    initialRun ? String(initialRun.durationSec % 60) : '',
  )
  // Split the stored ISO date-time back into separate date + time-of-day inputs
  // (the inverse of the `new Date(`${date}T${time}`)` combine done on submit).
  const [date, setDate] = useState(() => {
    if (!initialRun) return ''
    const d = new Date(initialRun.date)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })
  const [time, setTime] = useState(() => {
    if (!initialRun) return ''
    const d = new Date(initialRun.date)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [type, setType] = useState<RunType>(initialRun?.type ?? 'Easy')
  const [notes, setNotes] = useState(initialRun?.notes ?? '')

  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  async function handleGpxChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError(null)
    try {
      const parsed = await importGpx(file)
      setDistanceKm(String(parsed.distanceKm))
      if (parsed.durationSec !== undefined) {
        setHours(String(Math.floor(parsed.durationSec / 3600)))
        setMinutes(String(Math.floor((parsed.durationSec % 3600) / 60)))
        setSeconds(String(parsed.durationSec % 60))
      }
      if (parsed.date) {
        const d = new Date(parsed.date)
        setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
        setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`)
      }
    } catch (err) {
      setImportError((err as Error).message)
    } finally {
      setImporting(false)
      e.target.value = '' // allow re-uploading the same file
    }
  }

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof createRun>[0]) =>
      initialRun ? updateRun(initialRun.id, payload) : createRun(payload),
    onSuccess: () => {
      // Refetch the list so the change shows up without a page reload.
      queryClient.invalidateQueries({ queryKey: ['runs'] })
      if (initialRun) {
        // Editing: close the form back to the read-only row.
        onDone?.()
        return
      }
      // Creating: clear the form for the next entry.
      setDistanceKm('')
      setHours('')
      setMinutes('')
      setSeconds('')
      setDate('')
      setTime('')
      setType('Easy')
      setNotes('')
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const durationSec =
      (Number(hours) || 0) * 3600 +
      (Number(minutes) || 0) * 60 +
      (Number(seconds) || 0)

    // Combine the separate date + time inputs into a single ISO 8601 date-time.
    const iso = new Date(`${date}T${time}`).toISOString()

    mutation.mutate({
      distanceKm: Number(distanceKm),
      durationSec,
      date: iso,
      type,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
      {/* GPX import is a create-only affordance; hidden when editing a run. */}
      {!isEditing && (
        <>
          <label>
            Import from GPX
            <input type="file" accept=".gpx" onChange={handleGpxChange} disabled={importing} />
          </label>
          {importing && <p>Parsing GPX…</p>}
          {importError && (
            <p style={{ color: 'crimson' }}>Could not import GPX: {importError}</p>
          )}
        </>
      )}

      <label>
        Distance (km)
        <input
          type="number"
          step="any"
          min="0.01"
          required
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
        />
      </label>

      <fieldset style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
        <legend>Duration</legend>
        <label>
          h
          <input type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} />
        </label>
        <label>
          m
          <input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </label>
        <label>
          s
          <input type="number" min="0" max="59" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
        </label>
      </fieldset>

      <label>
        Date
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <label>
        Start time
        <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
      </label>

      <label>
        Type
        <select value={type} onChange={(e) => setType(e.target.value as RunType)}>
          {RUN_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label>
        Notes (optional)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? 'Saving…'
            : isEditing
              ? 'Save changes'
              : 'Add run'}
        </button>
        {isEditing && (
          <button type="button" onClick={() => onDone?.()} disabled={mutation.isPending}>
            Cancel
          </button>
        )}
      </div>

      {mutation.isError && (
        <p style={{ color: 'crimson' }}>Could not save: {(mutation.error as Error).message}</p>
      )}
    </form>
  )
}
