import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRun, RUN_TYPES, type RunType } from '../api/runs'

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
        Distance (km)
        <input
          type="number"
          step="0.01"
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
