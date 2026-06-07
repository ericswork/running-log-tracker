import { describe, it, expect, beforeEach } from 'vitest'
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

// Spread across days, distances, and types; B and C sit on day boundaries to
// exercise whole-day inclusivity, D is just past a to=2026-06-07 boundary.
const RUNS: SeedRun[] = [
  { distanceKm: 5, durationSec: 1500, date: '2026-06-01T08:00:00.000Z', type: 'Easy' },
  { distanceKm: 8, durationSec: 2400, date: '2026-06-03T23:59:59.000Z', type: 'Tempo' },
  { distanceKm: 12, durationSec: 4000, date: '2026-06-07T23:59:59.000Z', type: 'Long Run' },
  { distanceKm: 3, durationSec: 900, date: '2026-06-08T00:00:00.000Z', type: 'Recovery' },
]

const distances = (body: { runs: { distanceKm: number }[] }) =>
  body.runs.map((r) => r.distanceKm)

beforeEach(async () => {
  await seed(RUNS)
})

describe('GET /api/runs filtering', () => {
  it('returns all runs newest-first with no filter params (unchanged)', async () => {
    const res = await request(app).get('/api/runs')
    expect(res.status).toBe(200)
    // newest → oldest: 06-08, 06-07, 06-03, 06-01
    expect(distances(res.body)).toEqual([3, 12, 8, 5])
  })

  it('filters by a whole-day date range inclusively (excludes the next day)', async () => {
    const res = await request(app)
      .get('/api/runs')
      .query({ from: '2026-06-01', to: '2026-06-07' })
    expect(res.status).toBe(200)
    // includes the 23:59:59 run on the 7th, excludes 06-08 00:00:00
    expect(distances(res.body)).toEqual([12, 8, 5])
  })

  it('filters by distance band inclusively', async () => {
    const res = await request(app)
      .get('/api/runs')
      .query({ minDistanceKm: 5, maxDistanceKm: 10 })
    expect(distances(res.body)).toEqual([8, 5])
  })

  it('filters by multiple types via comma-separated value', async () => {
    const res = await request(app).get('/api/runs').query({ type: 'Easy,Tempo' })
    expect(distances(res.body)).toEqual([8, 5])
  })

  it('filters by multiple types via repeated params', async () => {
    const res = await request(app)
      .get('/api/runs')
      .query({ type: ['Easy', 'Long Run'] })
    expect(distances(res.body)).toEqual([12, 5])
  })

  it('combines filters with AND', async () => {
    const res = await request(app)
      .get('/api/runs')
      .query({ from: '2026-06-01', to: '2026-06-07', type: 'Tempo' })
    expect(distances(res.body)).toEqual([8])
  })

  it('returns an empty page when nothing matches', async () => {
    const res = await request(app).get('/api/runs').query({ minDistanceKm: 100 })
    expect(res.status).toBe(200)
    expect(res.body.runs).toEqual([])
    expect(res.body.total).toBe(0)
  })
})

describe('GET /api/runs filter validation', () => {
  it('rejects a malformed date with 400', async () => {
    const res = await request(app).get('/api/runs').query({ from: '06/01/2026' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('ValidationError')
  })

  it('rejects a non-numeric distance with 400', async () => {
    const res = await request(app)
      .get('/api/runs')
      .query({ minDistanceKm: 'abc' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('ValidationError')
  })

  it('rejects an unknown run type with 400', async () => {
    const res = await request(app).get('/api/runs').query({ type: 'Sprint' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('ValidationError')
  })

  it('rejects an inverted date range with 400', async () => {
    const res = await request(app)
      .get('/api/runs')
      .query({ from: '2026-06-07', to: '2026-06-01' })
    expect(res.status).toBe(400)
    expect(res.body.details[0].message).toMatch(/from must not be after to/)
  })

  it('rejects an inverted distance range with 400', async () => {
    const res = await request(app)
      .get('/api/runs')
      .query({ minDistanceKm: 10, maxDistanceKm: 5 })
    expect(res.status).toBe(400)
    expect(res.body.details[0].message).toMatch(/minDistanceKm must not exceed/)
  })
})
