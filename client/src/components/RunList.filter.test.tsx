import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
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
  notes: null,
  createdAt: '2026-06-01T07:30:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(api.fetchRuns as Mock).mockResolvedValue({ runs: [sampleRun], total: 1, limit: 20, offset: 0 })
})

// The filter params passed to the most recent fetchRuns call.
function lastFetchArgs() {
  const calls = (api.fetchRuns as Mock).mock.calls
  return calls[calls.length - 1]?.[0]
}

describe('RunList filtering', () => {
  it('sends only the selected subset of run types when a chip is deselected', async () => {
    renderWithClient(<RunList />)
    await screen.findByRole('button', { name: /edit/i }) // table loaded

    fireEvent.click(screen.getByRole('button', { name: 'Easy' })) // turn Easy off

    await waitFor(() =>
      expect(lastFetchArgs()?.type).toEqual([
        'Recovery',
        'Tempo',
        'Interval',
        'Long Run',
        'Race',
      ]),
    )
  })

  it('sends a parsed distance bound', async () => {
    renderWithClient(<RunList />)
    await screen.findByRole('button', { name: /edit/i })

    fireEvent.change(screen.getByLabelText('Minimum distance (km)'), {
      target: { value: '5' },
    })

    await waitFor(() => expect(lastFetchArgs()?.minDistanceKm).toBe(5))
  })

  it('Clear filters resets to the default (all types, no bounds)', async () => {
    renderWithClient(<RunList />)
    await screen.findByRole('button', { name: /edit/i })

    fireEvent.click(screen.getByRole('button', { name: 'Tempo' })) // narrow first
    await waitFor(() => expect(lastFetchArgs()?.type).toBeDefined())

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(lastFetchArgs()?.type).toBeUndefined())
  })

  it('deselecting all types shows the no-match state without querying, and Select all restores', async () => {
    renderWithClient(<RunList />)
    await screen.findByRole('button', { name: /edit/i })
    const callsBefore = (api.fetchRuns as Mock).mock.calls.length

    fireEvent.click(screen.getByRole('button', { name: 'Clear' })) // chip "Clear" → none
    expect(
      await screen.findByText('No runs match your filters.'),
    ).toBeInTheDocument()
    // No request is made for an empty type selection.
    expect((api.fetchRuns as Mock).mock.calls.length).toBe(callsBefore)

    fireEvent.click(screen.getByRole('button', { name: 'Select all' }))
    await waitFor(() => expect(lastFetchArgs()?.type).toBeUndefined())
    await screen.findByRole('button', { name: /edit/i }) // table back
  })
})
