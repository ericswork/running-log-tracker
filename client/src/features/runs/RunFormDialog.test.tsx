import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithClient } from '../../test/renderWithClient'
import { RunFormDialog } from './RunFormDialog'
import * as api from '@/api/runs'
import type { Run } from '@/api/runs'

vi.mock('@/api/runs', async (importActual) => {
  const actual = await importActual<typeof import('@/api/runs')>()
  return {
    ...actual,
    createRun: vi.fn(),
    updateRun: vi.fn(),
    importGpx: vi.fn(),
  }
})

const sampleRun: Run = {
  id: 'r1',
  distanceKm: 5,
  durationSec: 1800,
  date: '2026-06-01T07:30:00.000Z',
  type: 'Easy',
  notes: 'original',
  createdAt: '2026-06-01T07:30:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RunFormDialog create overlay', () => {
  it('submits a new run and closes the overlay on success', async () => {
    const onOpenChange = vi.fn()
    renderWithClient(<RunFormDialog open onOpenChange={onOpenChange} title="Add a run" />)

    fireEvent.change(screen.getByLabelText('Distance (km)'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('minutes'), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-06-01' } })
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '07:30' } })

    fireEvent.click(screen.getByRole('button', { name: /add run/i }))

    await waitFor(() =>
      expect(api.createRun).toHaveBeenCalledWith(
        expect.objectContaining({ distanceKm: 5, durationSec: 1800 }),
      ),
    )
    // onDone fires after a successful create → overlay closes.
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})

describe('RunFormDialog edit overlay', () => {
  it('renders the form prefilled with the run being edited', () => {
    renderWithClient(
      <RunFormDialog open onOpenChange={vi.fn()} initialRun={sampleRun} title="Edit run" />,
    )

    expect(screen.getByLabelText('Distance (km)')).toHaveValue(5)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})
