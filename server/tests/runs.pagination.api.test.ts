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

// Distinct distance per run so it doubles as an identity in assertions.
const SET: SeedRun[] = [
  { distanceKm: 5, durationSec: 1800, date: '2026-06-01T06:00:00.000Z', type: 'Easy' },
  { distanceKm: 10, durationSec: 3000, date: '2026-06-02T06:00:00.000Z', type: 'Tempo' },
  { distanceKm: 3, durationSec: 1200, date: '2026-06-03T06:00:00.000Z', type: 'Recovery' },
  { distanceKm: 8, durationSec: 2400, date: '2026-06-04T06:00:00.000Z', type: 'Long Run' },
  { distanceKm: 6, durationSec: 2000, date: '2026-06-05T06:00:00.000Z', type: 'Interval' },
]

const distances = (body: { runs: { distanceKm: number }[] }) =>
  body.runs.map((r) => r.distanceKm)

beforeEach(async () => {
  await seed(SET)
})

describe('GET /api/runs pagination', () => {
  it('returns the default page envelope (newest first, limit 20, offset 0)', async () => {
    const res = await request(app).get('/api/runs')
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(5)
    expect(res.body.limit).toBe(20)
    expect(res.body.offset).toBe(0)
    // date desc: 06-05, 06-04, 06-03, 06-02, 06-01
    expect(distances(res.body)).toEqual([6, 8, 3, 10, 5])
  })

  it('returns the requested page window with the full total', async () => {
    const p1 = await request(app).get('/api/runs').query({ limit: 2, offset: 0 })
    expect(p1.body.total).toBe(5)
    expect(distances(p1.body)).toEqual([6, 8])

    const p2 = await request(app).get('/api/runs').query({ limit: 2, offset: 2 })
    expect(distances(p2.body)).toEqual([3, 10])

    const p3 = await request(app).get('/api/runs').query({ limit: 2, offset: 4 })
    expect(distances(p3.body)).toEqual([5])
    expect(p3.body.total).toBe(5)
  })
})

describe('GET /api/runs sorting', () => {
  it('sorts by distance ascending and descending', async () => {
    const asc = await request(app).get('/api/runs').query({ sort: 'distanceKm', order: 'asc' })
    expect(distances(asc.body)).toEqual([3, 5, 6, 8, 10])

    const desc = await request(app).get('/api/runs').query({ sort: 'distanceKm', order: 'desc' })
    expect(distances(desc.body)).toEqual([10, 8, 6, 5, 3])
  })

  it('sorts by duration ascending', async () => {
    const res = await request(app).get('/api/runs').query({ sort: 'durationSec', order: 'asc' })
    expect(res.body.runs.map((r: { durationSec: number }) => r.durationSec)).toEqual([
      1200, 1800, 2000, 2400, 3000,
    ])
  })

  it('sorts by run type ascending', async () => {
    const res = await request(app).get('/api/runs').query({ sort: 'type', order: 'asc' })
    // Easy, Interval, Long Run, Recovery, Tempo
    expect(distances(res.body)).toEqual([5, 6, 8, 3, 10])
  })
})

describe('GET /api/runs sort + filter + paginate', () => {
  it('combines all three with total reflecting the filtered set', async () => {
    const res = await request(app)
      .get('/api/runs')
      .query({ type: 'Easy,Tempo,Recovery', sort: 'distanceKm', order: 'asc', limit: 2, offset: 0 })
    // matched Recovery(3), Easy(5), Tempo(10) → page of 2, total 3
    expect(res.body.total).toBe(3)
    expect(distances(res.body)).toEqual([3, 5])
  })

  it('total counts only the filtered runs', async () => {
    const res = await request(app).get('/api/runs').query({ minDistanceKm: 6 })
    expect(res.body.total).toBe(3)
    // date desc among 6/8/10: 06-05(6), 06-04(8), 06-02(10)
    expect(distances(res.body)).toEqual([6, 8, 10])
  })
})

describe('GET /api/runs pagination/sort validation', () => {
  it('rejects limit above the cap', async () => {
    const res = await request(app).get('/api/runs').query({ limit: 101 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('ValidationError')
  })

  it('rejects a non-positive limit', async () => {
    const res = await request(app).get('/api/runs').query({ limit: 0 })
    expect(res.status).toBe(400)
  })

  it('rejects a negative offset', async () => {
    const res = await request(app).get('/api/runs').query({ offset: -1 })
    expect(res.status).toBe(400)
  })

  it('rejects an unknown sort column', async () => {
    const res = await request(app).get('/api/runs').query({ sort: 'noteworthy' })
    expect(res.status).toBe(400)
  })

  it('rejects an invalid order', async () => {
    const res = await request(app).get('/api/runs').query({ order: 'sideways' })
    expect(res.status).toBe(400)
  })
})
