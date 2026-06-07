import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

const SAMPLE = 'tests/fixtures/sample.gpx'
const NO_TIME = 'tests/fixtures/no-time.gpx'
const IMPORT = '/api/runs/import'

describe('POST /api/runs/import', () => {
  it('parses a valid GPX and returns the extracted fields', async () => {
    const res = await request(app).post(IMPORT).attach('file', SAMPLE)
    expect(res.status).toBe(200)
    expect(res.body.distanceKm).toBeCloseTo(0.2, 2)
    expect(res.body.durationSec).toBe(120)
    expect(res.body.date).toBe('2026-06-06T07:00:00.000Z')
  })

  it('returns distance only when the GPX has no timestamps', async () => {
    const res = await request(app).post(IMPORT).attach('file', NO_TIME)
    expect(res.status).toBe(200)
    expect(res.body.distanceKm).toBeGreaterThan(0)
    expect(res.body.durationSec).toBeUndefined()
    expect(res.body.date).toBeUndefined()
  })

  it('does not persist a run', async () => {
    await request(app).post(IMPORT).attach('file', SAMPLE)
    const list = await request(app).get('/api/runs')
    expect(list.body.runs).toEqual([])
    expect(list.body.total).toBe(0)
  })

  it('returns 400 when no file is provided', async () => {
    const res = await request(app).post(IMPORT)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('ValidationError')
  })

  it('returns 400 for a non-.gpx file', async () => {
    const res = await request(app)
      .post(IMPORT)
      .attach('file', Buffer.from('not gpx'), 'notes.txt')
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed GPX', async () => {
    const res = await request(app)
      .post(IMPORT)
      .attach('file', Buffer.from('garbage<<<'), 'bad.gpx')
    expect(res.status).toBe(400)
  })

  it('returns 400 for a GPX with no track points', async () => {
    const empty =
      '<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg></trkseg></trk></gpx>'
    const res = await request(app)
      .post(IMPORT)
      .attach('file', Buffer.from(empty), 'empty.gpx')
    expect(res.status).toBe(400)
  })

  it('returns 400 for a file over the size limit', async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 'a') // 6 MB > 5 MB cap
    const res = await request(app).post(IMPORT).attach('file', big, 'big.gpx')
    expect(res.status).toBe(400)
  })
})
