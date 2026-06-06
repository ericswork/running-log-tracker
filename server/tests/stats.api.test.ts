import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { prisma } from '../src/prisma'

type SeedRun = {
  distanceKm: number
  durationSec: number
  date: string
  type: string
}

async function seed(runs: SeedRun[]): Promise<void> {
  await prisma.run.createMany({
    data: runs.map((r) => ({ ...r, date: new Date(r.date) })),
  })
}

// Two runs in the week of Mon 2026-06-01, a gap week, one in the week of
// Mon 2026-06-15. Timestamps mid-day UTC so default (UTC) buckets are stable.
const SPREAD: SeedRun[] = [
  { distanceKm: 5, durationSec: 1500, date: '2026-06-01T08:00:00Z', type: 'Easy' },
  { distanceKm: 3, durationSec: 900, date: '2026-06-03T08:00:00Z', type: 'Tempo' },
  { distanceKm: 10, durationSec: 3000, date: '2026-06-15T08:00:00Z', type: 'Long Run' },
]

describe('GET /api/stats/summary', () => {
  it('returns canonical-unit totals', async () => {
    await seed(SPREAD)
    const res = await request(app).get('/api/stats/summary')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      totalRuns: 3,
      totalDistanceKm: 18,
      totalDurationSec: 5400,
    })
  })

  it('returns zeros when there are no runs', async () => {
    const res = await request(app).get('/api/stats/summary')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      totalRuns: 0,
      totalDistanceKm: 0,
      totalDurationSec: 0,
    })
  })
})

describe('GET /api/stats/weekly', () => {
  it('buckets by week and zero-fills the gap week', async () => {
    await seed(SPREAD)
    const res = await request(app).get('/api/stats/weekly')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      weeks: [
        { weekStart: '2026-06-01', distanceKm: 8, runCount: 2 },
        { weekStart: '2026-06-08', distanceKm: 0, runCount: 0 },
        { weekStart: '2026-06-15', distanceKm: 10, runCount: 1 },
      ],
    })
  })

  it('returns an empty array when there are no runs', async () => {
    const res = await request(app).get('/api/stats/weekly')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ weeks: [] })
  })
})

describe('GET /api/stats/pace', () => {
  it('returns distance + duration per week (no pace computed), zero-filled', async () => {
    await seed(SPREAD)
    const res = await request(app).get('/api/stats/pace')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      periods: [
        { weekStart: '2026-06-01', distanceKm: 8, durationSec: 2400 },
        { weekStart: '2026-06-08', distanceKm: 0, durationSec: 0 },
        { weekStart: '2026-06-15', distanceKm: 10, durationSec: 3000 },
      ],
    })
  })

  it('returns an empty array when there are no runs', async () => {
    const res = await request(app).get('/api/stats/pace')
    expect(res.body).toEqual({ periods: [] })
  })
})

describe('GET /api/stats/by-type', () => {
  it('groups by type in canonical order, omitting absent types', async () => {
    await seed(SPREAD)
    const res = await request(app).get('/api/stats/by-type')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      types: [
        { type: 'Easy', count: 1, distanceKm: 5 },
        { type: 'Tempo', count: 1, distanceKm: 3 },
        { type: 'Long Run', count: 1, distanceKm: 10 },
      ],
    })
  })

  it('returns an empty array when there are no runs', async () => {
    const res = await request(app).get('/api/stats/by-type')
    expect(res.body).toEqual({ types: [] })
  })
})

describe('timezone bucketing', () => {
  // 02:30 UTC Mon 2026-06-08 is still Sun 2026-06-07 in New York (UTC-4 in June).
  const nearMidnight: SeedRun[] = [
    { distanceKm: 5, durationSec: 1500, date: '2026-06-08T02:30:00Z', type: 'Easy' },
  ]

  it('defaults to UTC bucketing', async () => {
    await seed(nearMidnight)
    const res = await request(app).get('/api/stats/weekly')
    expect(res.body.weeks).toEqual([
      { weekStart: '2026-06-08', distanceKm: 5, runCount: 1 },
    ])
  })

  it('buckets into the local week for the supplied timezone (cross-day)', async () => {
    await seed(nearMidnight)
    const res = await request(app)
      .get('/api/stats/weekly')
      .query({ timezone: 'America/New_York' })
    expect(res.body.weeks).toEqual([
      { weekStart: '2026-06-01', distanceKm: 5, runCount: 1 },
    ])
  })
})

describe('date-range filtering', () => {
  it('includes only runs within [from, to] and spans the range', async () => {
    await seed(SPREAD)
    const res = await request(app)
      .get('/api/stats/weekly')
      .query({ from: '2026-06-10', to: '2026-06-20' })
    expect(res.body.weeks).toEqual([
      { weekStart: '2026-06-08', distanceKm: 0, runCount: 0 },
      { weekStart: '2026-06-15', distanceKm: 10, runCount: 1 },
    ])
  })
})

describe('query-param validation', () => {
  it('rejects an invalid timezone with 400', async () => {
    const res = await request(app)
      .get('/api/stats/summary')
      .query({ timezone: 'Not/AZone' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('ValidationError')
    expect(res.body.details[0].path).toBe('timezone')
  })

  it('rejects a malformed from date with 400', async () => {
    const res = await request(app)
      .get('/api/stats/weekly')
      .query({ from: '06/01/2026' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('ValidationError')
  })

  it('rejects an inverted from/to range with 400', async () => {
    const res = await request(app)
      .get('/api/stats/weekly')
      .query({ from: '2026-06-20', to: '2026-06-01' })
    expect(res.status).toBe(400)
    expect(res.body.details[0].message).toMatch(/from must not be after to/)
  })
})
