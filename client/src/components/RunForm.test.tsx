import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithClient } from '../test/renderWithClient'
import { RunForm } from './RunForm'
import * as api from '../api/runs'

// Mock the API module but keep RUN_TYPES (used by the Type select) real.
vi.mock('../api/runs', async (importActual) => {
  const actual = await importActual<typeof import('../api/runs')>()
  return {
    ...actual,
    createRun: vi.fn(),
    updateRun: vi.fn(),
    importGpx: vi.fn(),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

// Fill the non-duration required fields, leaving duration up to each test.
function fillRequiredExceptDuration() {
  fireEvent.change(screen.getByLabelText('Distance (km)'), { target: { value: '5' } })
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-06-01' } })
  fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '07:30' } })
}

describe('RunForm duration validation', () => {
  it('blocks submit and shows an error when duration is empty', () => {
    renderWithClient(<RunForm />)
    fillRequiredExceptDuration()

    fireEvent.click(screen.getByRole('button', { name: /add run/i }))

    expect(api.createRun).not.toHaveBeenCalled()
    expect(screen.getByText(/greater than zero/i)).toBeInTheDocument()
  })

  it('submits the expected payload when a valid duration is entered', async () => {
    renderWithClient(<RunForm />)
    fillRequiredExceptDuration()
    fireEvent.change(screen.getByLabelText('minutes'), { target: { value: '30' } })

    fireEvent.click(screen.getByRole('button', { name: /add run/i }))

    await waitFor(() => expect(api.createRun).toHaveBeenCalledTimes(1))
    expect(api.createRun).toHaveBeenCalledWith(
      expect.objectContaining({ distanceKm: 5, durationSec: 1800, type: 'Easy' }),
    )
  })
})
