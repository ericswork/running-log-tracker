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

// Mobile renders a second pager above the table; jsdom ignores the responsive
// classes so both are present. Scope queries to the canonical bottom pager
// (the top one is labelled "Run pages (top)").
const pager = () => within(screen.getByRole('navigation', { name: 'Run pages' }))

beforeEach(() => {
  vi.clearAllMocks()
  // 45 total across 5 pages of 10; the page rows themselves stay fixed (we assert
  // params + the page indicator, which derive from state/total).
  ;(api.fetchRuns as Mock).mockResolvedValue({ runs: sampleRuns, total: 45, limit: 10, offset: 0 })
})

describe('RunList pagination', () => {
  it('shows the page indicator and pages forward/back via offset', async () => {
    renderWithClient(<RunList />)
    await screen.findByRole('navigation', { name: 'Run pages' })
    expect(pager().getByText('Page 1 of 5')).toBeInTheDocument()
    expect(pager().getByRole('button', { name: 'Previous' })).toBeDisabled()

    fireEvent.click(pager().getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(pager().getByText('Page 2 of 5')).toBeInTheDocument())
    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(10))

    fireEvent.click(pager().getByRole('button', { name: 'Previous' }))
    await waitFor(() => expect(pager().getByText('Page 1 of 5')).toBeInTheDocument())
    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(0))
  })

  it('jumps to a specific page via its numbered button', async () => {
    renderWithClient(<RunList />)
    await screen.findByRole('navigation', { name: 'Run pages' })

    // pageRange(1, 5) is [1, 2, …, 5]; the last-page button jumps straight there.
    fireEvent.click(pager().getByRole('button', { name: 'Go to page 5' }))
    await waitFor(() => expect(pager().getByText('Page 5 of 5')).toBeInTheDocument())
    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(40))
  })

  it('requests the default sort and resets to the first page when the sort changes', async () => {
    renderWithClient(<RunList />)
    await screen.findByRole('navigation', { name: 'Run pages' })
    expect(lastFetchArgs()).toMatchObject({ sort: 'date', order: 'desc', limit: 10, offset: 0 })

    fireEvent.click(pager().getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(pager().getByText('Page 2 of 5')).toBeInTheDocument())

    // Sorting by a column refetches sorted and returns to the first page.
    fireEvent.click(screen.getByRole('button', { name: /distance/i }))
    await waitFor(() => expect(pager().getByText('Page 1 of 5')).toBeInTheDocument())
    await waitFor(() => {
      const args = lastFetchArgs()
      expect(args?.sort).toBe('distanceKm')
      expect(args?.order).toBe('asc')
      expect(args?.offset).toBe(0)
    })
  })

  it('makes a single offset-0 request when a filter changes on a later page', async () => {
    renderWithClient(<RunList />)
    await screen.findByRole('navigation', { name: 'Run pages' })

    fireEvent.click(pager().getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(10))

    const before = (api.fetchRuns as Mock).mock.calls.length
    // Deselect a run-type chip → filter changes while on page 2.
    fireEvent.click(screen.getByRole('button', { name: 'Tempo' }))

    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(0))
    // Exactly one new request, and it never refetched the new filter at offset 10.
    const newCalls = (api.fetchRuns as Mock).mock.calls.slice(before)
    expect(newCalls).toHaveLength(1)
    expect(newCalls[0][0].offset).toBe(0)
  })

  it('clamps to the previous page when the last run on the last page is deleted', async () => {
    // 11 runs → 2 pages of 10; the last page holds a single run.
    ;(api.fetchRuns as Mock).mockResolvedValue({ runs: sampleRuns, total: 11, limit: 10, offset: 0 })
    ;(api.deleteRun as Mock).mockResolvedValue(undefined)
    renderWithClient(<RunList />)
    await screen.findByRole('navigation', { name: 'Run pages' })

    // Go to the last page (offset 10).
    fireEvent.click(pager().getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(pager().getByText('Page 2 of 2')).toBeInTheDocument())
    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(10))

    // Delete a run and confirm; deleting the last page's run clamps the offset.
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(api.deleteRun).toHaveBeenCalled())
    await waitFor(() => expect(pager().getByText('Page 1 of 2')).toBeInTheDocument())
    await waitFor(() => expect(lastFetchArgs()?.offset).toBe(0))
  })

  it('hides the pager and shows the empty state when there are no runs', async () => {
    ;(api.fetchRuns as Mock).mockResolvedValue({ runs: [], total: 0, limit: 10, offset: 0 })
    renderWithClient(<RunList />)
    expect(await screen.findByText('No runs yet.')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /Run pages/ })).not.toBeInTheDocument()
  })

  it('hides the pager when everything fits on one page', async () => {
    ;(api.fetchRuns as Mock).mockResolvedValue({ runs: sampleRuns, total: 3, limit: 10, offset: 0 })
    renderWithClient(<RunList />)
    await screen.findAllByRole('button', { name: /edit/i }) // rows rendered
    expect(screen.queryByRole('navigation', { name: /Run pages/ })).not.toBeInTheDocument()
  })
})
