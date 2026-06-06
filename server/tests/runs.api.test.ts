import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

const validRun = {
  distanceKm: 5,
  durationSec: 1500,
  date: '2026-06-06T07:30:00.000Z',
  type: 'Tempo',
}

describe('POST /api/runs (create)', () => {
  it('creates a run and returns 201 with the created record', async () => {
    const res = await request(app).post('/api/runs').send(validRun)
    expect(res.status).toBe(201)
    expect(res.body.id).toBeTruthy()
    expect(res.body.distanceKm).toBe(5)
    expect(res.body.type).toBe('Tempo')
  })

  it('defaults run type to Easy when omitted', async () => {
    const { type, ...noType } = validRun
    const res = await request(app).post('/api/runs').send(noType)
    expect(res.status).toBe(201)
    expect(res.body.type).toBe('Easy')
  })

  it('preserves the start time of day (not normalized to midnight)', async () => {
    const res = await request(app).post('/api/runs').send(validRun)
    expect(res.body.date).toBe('2026-06-06T07:30:00.000Z')
  })
})

describe('GET /api/runs (list)', () => {
  it('returns an empty array when there are no runs', async () => {
    const res = await request(app).get('/api/runs')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns runs newest-first', async () => {
    await request(app).post('/api/runs').send({ ...validRun, date: '2026-05-30T06:00:00.000Z' })
    await request(app).post('/api/runs').send({ ...validRun, date: '2026-06-06T06:00:00.000Z' })
    await request(app).post('/api/runs').send({ ...validRun, date: '2026-06-01T06:00:00.000Z' })
    const res = await request(app).get('/api/runs')
    expect(res.status).toBe(200)
    const dates = res.body.map((r: { date: string }) => r.date.slice(0, 10))
    expect(dates).toEqual(['2026-06-06', '2026-06-01', '2026-05-30'])
  })
})

describe('GET /api/runs/:id', () => {
  it('returns the run when found', async () => {
    const created = await request(app).post('/api/runs').send(validRun)
    const res = await request(app).get(`/api/runs/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(created.body.id)
  })

  it('returns 404 when not found', async () => {
    const res = await request(app).get('/api/runs/does-not-exist')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/runs/:id (update)', () => {
  it('applies a partial update and returns 200', async () => {
    const created = await request(app).post('/api/runs').send(validRun)
    const res = await request(app)
      .patch(`/api/runs/${created.body.id}`)
      .send({ notes: 'felt great' })
    expect(res.status).toBe(200)
    expect(res.body.notes).toBe('felt great')
    expect(res.body.distanceKm).toBe(5) // unchanged
  })

  it('returns 404 when the run does not exist', async () => {
    const res = await request(app).patch('/api/runs/nope').send({ notes: 'x' })
    expect(res.status).toBe(404)
  })

  it('returns 400 on an invalid value', async () => {
    const created = await request(app).post('/api/runs').send(validRun)
    const res = await request(app)
      .patch(`/api/runs/${created.body.id}`)
      .send({ distanceKm: -3 })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/runs/:id', () => {
  it('deletes an existing run and returns 204', async () => {
    const created = await request(app).post('/api/runs').send(validRun)
    const res = await request(app).delete(`/api/runs/${created.body.id}`)
    expect(res.status).toBe(204)
    const after = await request(app).get(`/api/runs/${created.body.id}`)
    expect(after.status).toBe(404)
  })

  it('returns 404 when the run does not exist', async () => {
    const res = await request(app).delete('/api/runs/nope')
    expect(res.status).toBe(404)
  })
})

describe('validation (400, not persisted)', () => {
  it('rejects an invalid run type', async () => {
    const res = await request(app).post('/api/runs').send({ ...validRun, type: 'Sprint' })
    expect(res.status).toBe(400)
  })

  it('rejects a missing required field', async () => {
    const { durationSec, ...missing } = validRun
    const res = await request(app).post('/api/runs').send(missing)
    expect(res.status).toBe(400)
  })

  it('rejects non-positive distance and duration', async () => {
    const r1 = await request(app).post('/api/runs').send({ ...validRun, distanceKm: 0 })
    const r2 = await request(app).post('/api/runs').send({ ...validRun, durationSec: -10 })
    expect(r1.status).toBe(400)
    expect(r2.status).toBe(400)
  })

  it('does not persist rejected runs', async () => {
    await request(app).post('/api/runs').send({ ...validRun, type: 'Sprint' })
    const res = await request(app).get('/api/runs')
    expect(res.body).toEqual([])
  })
})
