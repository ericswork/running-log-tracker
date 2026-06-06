import { describe, it, expect } from 'vitest'
import { parseBody } from './validation'
import { createRunSchema } from '../runs/schemas'

const valid = {
  distanceKm: 5,
  durationSec: 1500,
  date: '2026-06-06T07:30:00.000Z',
}

describe('parseBody', () => {
  it('returns typed data on success', () => {
    const result = parseBody(createRunSchema, valid)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.type).toBe('Easy') // default applied
      expect(result.data.distanceKm).toBe(5)
      expect(result.data.date).toBeInstanceOf(Date)
    }
  })

  it('returns a structured 400 body on failure', () => {
    const result = parseBody(createRunSchema, { distanceKm: -1 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(400)
      expect(result.body.error).toBe('ValidationError')
      expect(Array.isArray(result.body.details)).toBe(true)
      expect(result.body.details.length).toBeGreaterThan(0)
      expect(result.body.details[0]).toHaveProperty('path')
      expect(result.body.details[0]).toHaveProperty('message')
    }
  })
})
