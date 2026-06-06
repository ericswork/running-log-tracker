import { describe, it, expect } from 'vitest'
import { createRunSchema, updateRunSchema } from './schemas'

const base = {
  distanceKm: 5,
  durationSec: 1500,
  date: '2026-06-06T07:30:00.000Z',
}

describe('createRunSchema', () => {
  it('accepts valid input', () => {
    expect(createRunSchema.safeParse({ ...base, type: 'Tempo' }).success).toBe(true)
  })

  it('defaults type to Easy when omitted', () => {
    expect(createRunSchema.parse(base).type).toBe('Easy')
  })

  it('coerces date to a Date, preserving the time of day', () => {
    const parsed = createRunSchema.parse(base)
    expect(parsed.date).toBeInstanceOf(Date)
    expect(parsed.date.toISOString()).toBe('2026-06-06T07:30:00.000Z')
  })

  it('rejects an invalid run type', () => {
    expect(createRunSchema.safeParse({ ...base, type: 'Sprint' }).success).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(createRunSchema.safeParse({ distanceKm: 5 }).success).toBe(false)
  })

  it('rejects non-positive distance and duration', () => {
    expect(createRunSchema.safeParse({ ...base, distanceKm: 0 }).success).toBe(false)
    expect(createRunSchema.safeParse({ ...base, durationSec: -1 }).success).toBe(false)
  })

  it('rejects a non-integer duration', () => {
    expect(createRunSchema.safeParse({ ...base, durationSec: 10.5 }).success).toBe(false)
  })
})

describe('updateRunSchema', () => {
  it('accepts a partial subset (including empty)', () => {
    expect(updateRunSchema.safeParse({ notes: 'felt great' }).success).toBe(true)
    expect(updateRunSchema.safeParse({}).success).toBe(true)
  })

  it('does not inject a default type on partial update', () => {
    expect(updateRunSchema.parse({ notes: 'x' }).type).toBeUndefined()
  })

  it('rejects an invalid value in the subset', () => {
    expect(updateRunSchema.safeParse({ distanceKm: -1 }).success).toBe(false)
    expect(updateRunSchema.safeParse({ type: 'Sprint' }).success).toBe(false)
  })
})
