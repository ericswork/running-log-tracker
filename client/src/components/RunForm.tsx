import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createRun,
  updateRun,
  importGpx,
  RUN_TYPES,
  type Run,
  type RunType,
} from '../api/runs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const [durationError, setDurationError] = useState<string | null>(null)
  const gpxInputRef = useRef<HTMLInputElement>(null)

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
      // Close the overlay when the create form lives in one. The desktop inline
      // form passes no onDone, so this is a no-op there (it just resets).
      onDone?.()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const durationSec =
      (Number(hours) || 0) * 3600 +
      (Number(minutes) || 0) * 60 +
      (Number(seconds) || 0)

    // Duration spans three inputs, so the browser's `required` can't enforce it.
    // Guard here so a zero/empty duration never reaches the API (which 400s).
    if (durationSec <= 0) {
      setDurationError('Enter a duration greater than zero.')
      return
    }
    setDurationError(null)

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
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* GPX import is a create-only affordance; hidden when editing a run. */}
      {!isEditing && (
        <div className="grid gap-2">
          <Label>Import from GPX</Label>
          {/* Hidden native input; the Button below is the visible trigger. */}
          <input
            ref={gpxInputRef}
            type="file"
            accept=".gpx"
            className="hidden"
            onChange={handleGpxChange}
            disabled={importing}
          />
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => gpxInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Parsing GPX…' : 'Choose GPX file…'}
          </Button>
          {importError && (
            <p className="text-sm text-destructive">Could not import GPX: {importError}</p>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="distanceKm">Distance (km)</Label>
        <Input
          id="distanceKm"
          type="number"
          step="any"
          min="0.01"
          required
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label>Duration</Label>
        <div className="flex items-center gap-2">
          <Input
            aria-label="hours"
            type="number"
            min="0"
            placeholder="h"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <Input
            aria-label="minutes"
            type="number"
            min="0"
            max="59"
            placeholder="m"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <Input
            aria-label="seconds"
            type="number"
            min="0"
            max="59"
            placeholder="s"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
          />
        </div>
        {durationError && <p className="text-sm text-destructive">{durationError}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="time">Start time</Label>
        <Input
          id="time"
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as RunType)}>
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RUN_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Add run'}
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onDone?.()}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive">Could not save: {(mutation.error as Error).message}</p>
      )}
    </form>
  )
}
