import { parseGPXWithCustomParser } from '@we-gold/gpxjs'
import { DOMParser } from 'xmldom-qsa'

// Minimal structural view of the parsed library output — only the fields we
// read. Avoids depending on the package's type-export surface.
interface GpxPoint {
  time: Date | null
}
interface GpxTrack {
  points?: GpxPoint[]
  distance?: { total?: number }
}

// Thrown for any GPX that can't be parsed or has no usable track points.
// The controller maps this to HTTP 400.
export class GpxParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GpxParseError'
  }
}

export interface ParsedRun {
  distanceKm: number
  durationSec?: number
  date?: string // ISO 8601, first track-point timestamp
}

function round(value: number, dp: number): number {
  const factor = 10 ** dp
  return Math.round(value * factor) / factor
}

/**
 * Parse a GPX document (in memory) into the fields needed to pre-fill a run.
 * Distance comes from the library's per-track total; duration and start date
 * come from the track-point timestamps. If timestamps are absent, only
 * distanceKm is returned.
 */
export function parseGpx(gpxSource: string): ParsedRun {
  let result: ReturnType<typeof parseGPXWithCustomParser>
  try {
    result = parseGPXWithCustomParser(
      gpxSource,
      (src: string) =>
        new DOMParser().parseFromString(src, 'text/xml') as unknown as Document,
    )
  } catch (e) {
    throw new GpxParseError(`Could not parse GPX: ${(e as Error).message}`)
  }

  const [parsed, error] = result
  if (error || !parsed) {
    throw new GpxParseError(`Could not parse GPX: ${error?.message ?? 'invalid GPX'}`)
  }

  const tracks = (parsed.tracks ?? []) as GpxTrack[]
  const points: GpxPoint[] = tracks.flatMap((t) => t.points ?? [])
  if (points.length === 0) {
    throw new GpxParseError('GPX contains no track points')
  }

  // Distance: sum the library's per-track total (meters) → kilometers.
  const totalMeters = tracks.reduce((sum, t) => sum + (t.distance?.total ?? 0), 0)
  const parsedRun: ParsedRun = { distanceKm: round(totalMeters / 1000, 3) }

  // Duration + start: derive from track-point timestamps (in document order).
  const times = points
    .map((p) => p.time)
    .filter((t): t is Date => t instanceof Date && !Number.isNaN(t.getTime()))

  if (times.length >= 1) {
    parsedRun.date = times[0].toISOString()
    if (times.length >= 2) {
      const ms = times[times.length - 1].getTime() - times[0].getTime()
      parsedRun.durationSec = Math.round(ms / 1000)
    }
  }

  return parsedRun
}
