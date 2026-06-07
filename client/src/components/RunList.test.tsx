import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithClient } from '../test/renderWithClient'
import { RunList } from './RunList'
import * as api from '../api/runs'
import type { Run } from '../api/runs'

vi.mock('../api/runs', async (importActual) => {
  const actual = await importActual<typeof import('../api/runs')>()
  return {
    ...actual,
    fetchRuns: vi.fn(),
    deleteRun: vi.fn(),
    updateRun: vi.fn(),
    createRun: vi.fn(),
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
  ;(api.fetchRuns as Mock).mockResolvedValue({ runs: [sampleRun], total: 1, limit: 20, offset: 0 })
})

describe('RunList edit flow', () => {
  it('opens a dialog prefilled with the run and saves an update', async () => {
    renderWithClient(<RunList />)
    // Wait for the table row's edit control (the filter bar also renders an
    // "Easy" chip immediately, so sync on a table-only control instead).
    const editButton = await screen.findByRole('button', { name: /edit/i })

    fireEvent.click(editButton)

    const distance = await screen.findByLabelText('Distance (km)')
    expect(distance).toHaveValue(5) // prefilled

    fireEvent.change(distance, { target: { value: '6' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(api.updateRun).toHaveBeenCalledWith('r1', expect.objectContaining({ distanceKm: 6 })),
    )
  })
})

describe('RunList delete flow', () => {
  it('deletes the run after confirming in the alert dialog', async () => {
    renderWithClient(<RunList />)
    const deleteButton = await screen.findByRole('button', { name: /delete/i })

    fireEvent.click(deleteButton)

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(api.deleteRun).toHaveBeenCalledWith('r1'))
  })

  it('does not delete when the confirmation is declined', async () => {
    renderWithClient(<RunList />)
    const deleteButton = await screen.findByRole('button', { name: /delete/i })

    fireEvent.click(deleteButton)

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(api.deleteRun).not.toHaveBeenCalled()
  })
})
