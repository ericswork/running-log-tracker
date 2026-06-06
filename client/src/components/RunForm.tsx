import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRun, importGpx, RUN_TYPES, type RunType } from '../api/runs'

const pad = (n: number) => String(n).padStart(2, '0')

export function RunForm() {
  const queryClient = useQueryClient()

  const [distanceKm, setDistanceKm] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState<RunType>('Easy')
  const [notes, setNotes] = useState('')

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
    mutationFn: createRun,
    onSuccess: () => {
      // Refetch the list so the new run shows up without a page reload.
      queryClient.invalidateQueries({ queryKey: ['runs'] })
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
      <label>
        Import from GPX
        <input type="file" accept=".gpx" onChange={handleGpxChange} disabled={importing} />
      </label>
      {importing && <p>Parsing GPX…</p>}
      {importError && (
        <p style={{ color: 'crimson' }}>Could not import GPX: {importError}</p>
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

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Add run'}
      </button>

      {mutation.isError && (
        <p style={{ color: 'crimson' }}>Could not save: {(mutation.error as Error).message}</p>
      )}
    </form>
  )
}
