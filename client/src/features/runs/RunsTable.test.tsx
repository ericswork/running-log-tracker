import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { SortingState } from '@tanstack/react-table'
import { RunsTable } from './RunsTable'
import type { Run } from '@/api/runs'

const runs: Run[] = [
  {
    id: 'a',
    distanceKm: 10,
    durationSec: 3600,
    date: '2026-06-03T08:00:00.000Z',
    type: 'Easy',
    notes: null,
    createdAt: '2026-06-03T08:00:00.000Z',
  },
  {
    id: 'b',
    distanceKm: 3,
    durationSec: 1200,
    date: '2026-06-01T08:00:00.000Z',
    type: 'Tempo',
    notes: null,
    createdAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'c',
    distanceKm: 7,
    durationSec: 2400,
    date: '2026-06-02T08:00:00.000Z',
    type: 'Long Run',
    notes: null,
    createdAt: '2026-06-02T08:00:00.000Z',
  },
]

// Read the Distance column (2nd cell) of each body row, in display order.
function distanceColumn(): (string | null)[] {
  return screen
    .getAllByRole('row')
    .slice(1) // skip the header row
    .map((row) => within(row).getAllByRole('cell')[1].textContent)
}

const dateDesc: SortingState = [{ id: 'date', desc: true }]

describe('RunsTable', () => {
  it('renders rows in the order provided (the server already sorted them)', () => {
    render(
      <RunsTable
        runs={runs}
        sorting={dateDesc}
        onSortingChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    // Rendered as-given (no client-side reordering): 10, 3, 7
    expect(distanceColumn()).toEqual(['10', '3', '7'])
  })

  it('reports a sort change to the parent instead of reordering locally', () => {
    const onSortingChange = vi.fn()
    render(
      <RunsTable
        runs={runs}
        sorting={dateDesc}
        onSortingChange={onSortingChange}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /distance/i }))

    expect(onSortingChange).toHaveBeenCalledTimes(1)
    // Resolve the functional updater against the current sort → distance ascending.
    const updater = onSortingChange.mock.calls[0][0]
    const next = typeof updater === 'function' ? updater(dateDesc) : updater
    expect(next).toEqual([{ id: 'distanceKm', desc: false }])
    // The rows themselves did not reorder (still server order).
    expect(distanceColumn()).toEqual(['10', '3', '7'])
  })
})
