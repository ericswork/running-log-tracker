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

const sampleRuns: Run[] = [
  { id: 'r1', distanceKm: 5, durationSec: 1800, date: '2026-06-03T07:30:00.000Z', type: 'Easy', notes: null, createdAt: '2026-06-03T08:00:00.000Z' },
  { id: 'r2', distanceKm: 8, durationSec: 2400, date: '2026-06-02T07:30:00.000Z', type: 'Tempo', notes: null, createdAt: '2026-06-02T08:00:00.000Z' },
  { id: 'r3', distanceKm: 3, durationSec: 1200, date: '2026-06-01T07:30:00.000Z', type: 'Recovery', notes: null, createdAt: '2026-06-01T08:00:00.000Z' },
]

// The params passed to the most recent fetchRuns call.
function lastFetchArgs() {
  const calls = (api.fetchRuns as Mock).mock.calls
  return calls[calls.length - 1]?.[0]
}

beforeEach(() => {
  vi.clearAllMocks()
  // 45 total across 3 pages of 20; the page rows themselves stay fixed (we assert
  // params + the page indicator, which derive from state/total).
  ;(api.fetchRuns as Mock).mockResolvedValue({ runs: sampleRuns, total: 45, limit: 20, offset: 0 })
})

describe('RunList pagination', () => {
  it('shows the page indicator and pages forward/back via offset', async () => {
    renderWithClient(<RunList />)
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument()
    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(20))

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument()
    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(0))
  })

  it('requests the default sort and resets to the first page when the sort changes', async () => {
    renderWithClient(<RunList />)
    await screen.findByText('Page 1 of 3')
    expect(lastFetchArgs()).toMatchObject({ sort: 'date', order: 'desc', limit: 20, offset: 0 })

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Page 2 of 3')

    // Sorting by a column refetches sorted and returns to the first page.
    fireEvent.click(screen.getByRole('button', { name: /distance/i }))
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument()
    await waitFor(() => {
      const args = lastFetchArgs()
      expect(args?.sort).toBe('distanceKm')
      expect(args?.order).toBe('asc')
      expect(args?.offset).toBe(0)
    })
  })

  it('makes a single offset-0 request when a filter changes on a later page', async () => {
    renderWithClient(<RunList />)
    await screen.findByText('Page 1 of 3')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Page 2 of 3')
    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(20))

    const before = (api.fetchRuns as Mock).mock.calls.length
    // Deselect a run-type chip → filter changes while on page 2.
    fireEvent.click(screen.getByRole('button', { name: 'Tempo' }))

    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(0))
    // Exactly one new request, and it never refetched the new filter at offset 20.
    const newCalls = (api.fetchRuns as Mock).mock.calls.slice(before)
    expect(newCalls).toHaveLength(1)
    expect(newCalls[0][0].offset).toBe(0)
  })

  it('hides the pager and shows the empty state when there are no runs', async () => {
    ;(api.fetchRuns as Mock).mockResolvedValue({ runs: [], total: 0, limit: 20, offset: 0 })
    renderWithClient(<RunList />)
    expect(await screen.findByText('No runs yet.')).toBeInTheDocument()
    expect(screen.queryByText(/Page \d+ of/)).not.toBeInTheDocument()
  })

  it('hides the pager when everything fits on one page', async () => {
    ;(api.fetchRuns as Mock).mockResolvedValue({ runs: sampleRuns, total: 3, limit: 20, offset: 0 })
    renderWithClient(<RunList />)
    await screen.findAllByRole('button', { name: /edit/i }) // rows rendered
    expect(screen.queryByText(/Page \d+ of/)).not.toBeInTheDocument()
  })
})
