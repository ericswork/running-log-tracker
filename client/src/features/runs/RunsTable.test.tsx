import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
function distanceColumn(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1) // skip the header row
    .map((row) => within(row).getAllByRole('cell')[1].textContent)
}

describe('RunsTable sorting', () => {
  it('defaults to newest-first by date', () => {
    render(<RunsTable runs={runs} onEdit={vi.fn()} onDelete={vi.fn()} />)
    // Newest date first: 06-03 (10km), 06-02 (7km), 06-01 (3km)
    expect(distanceColumn()).toEqual(['10', '7', '3'])
  })

  it('reorders rows when sorting by the Distance column', () => {
    render(<RunsTable runs={runs} onEdit={vi.fn()} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /distance/i }))
    // Ascending by distance
    expect(distanceColumn()).toEqual(['3', '7', '10'])

    fireEvent.click(screen.getByRole('button', { name: /distance/i }))
    // Descending by distance
    expect(distanceColumn()).toEqual(['10', '7', '3'])
  })
})
