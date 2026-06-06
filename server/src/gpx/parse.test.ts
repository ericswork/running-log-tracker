import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseGpx, GpxParseError } from './parse'

const sample = readFileSync('tests/fixtures/sample.gpx', 'utf8')
const noTime = readFileSync('tests/fixtures/no-time.gpx', 'utf8')

const emptyGpx =
  '<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg></trkseg></trk></gpx>'

const singleTimeGpx = `<?xml version="1.0"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>
  <trkpt lat="37.0000" lon="-122.0000"><time>2026-06-06T07:00:00.000Z</time></trkpt>
  <trkpt lat="37.0010" lon="-122.0000"></trkpt>
</trkseg></trk></gpx>`

describe('parseGpx', () => {
  it('extracts distance, duration, and start date from a timestamped track', () => {
    const result = parseGpx(sample)
    expect(result.distanceKm).toBeCloseTo(0.2, 2)
    expect(result.durationSec).toBe(120)
    expect(result.date).toBe('2026-06-06T07:00:00.000Z')
  })

  it('returns distance only when track points have no timestamps', () => {
    const result = parseGpx(noTime)
    expect(result.distanceKm).toBeGreaterThan(0)
    expect(result.durationSec).toBeUndefined()
    expect(result.date).toBeUndefined()
  })

  it('returns date but omits duration when only one timestamp is present', () => {
    const result = parseGpx(singleTimeGpx)
    expect(result.date).toBe('2026-06-06T07:00:00.000Z')
    expect(result.durationSec).toBeUndefined()
  })

  it('throws GpxParseError when there are no track points', () => {
    expect(() => parseGpx(emptyGpx)).toThrow(GpxParseError)
  })

  it('throws GpxParseError for malformed input', () => {
    expect(() => parseGpx('not gpx at all')).toThrow(GpxParseError)
  })
})
