// Client-side fetchers for the read-only analytics endpoints. Response types
// mirror the server (canonical units only — the client derives pace and formats
// for display). Like api/runs.ts these use relative /api paths via the Vite
// proxy and accept minor type duplication rather than a shared package.

export interface Summary {
  totalRuns: number;
  totalDistanceKm: number;
  totalDurationSec: number;
}

export interface WeeklyMileage {
  weekStart: string; // YYYY-MM-DD of the week's Monday (resolved timezone)
  distanceKm: number;
  runCount: number;
}

export interface PacePeriod {
  weekStart: string;
  distanceKm: number;
  durationSec: number;
}

export interface TypeBreakdown {
  type: string;
  count: number;
  distanceKm: number;
}

// Optional date-range; timezone defaults to the browser's IANA zone when unset.
export interface StatsParams {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  timezone?: string;
}

const BASE = "/api/stats";

function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Build the query string, defaulting timezone to the browser zone so server-side
// week/day buckets match what the user sees locally.
function buildQuery(params?: StatsParams): string {
  const qs = new URLSearchParams();
  const timezone = params?.timezone ?? browserTimeZone();
  if (timezone) qs.set("timezone", timezone);
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      detail = ` — ${JSON.stringify(await res.json())}`;
    } catch {
      // response had no JSON body
    }
    throw new Error(`Request failed (${res.status})${detail}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchSummary(params?: StatsParams): Promise<Summary> {
  return handle<Summary>(await fetch(`${BASE}/summary${buildQuery(params)}`));
}

export async function fetchWeekly(
  params?: StatsParams,
): Promise<WeeklyMileage[]> {
  const data = await handle<{ weeks: WeeklyMileage[] }>(
    await fetch(`${BASE}/weekly${buildQuery(params)}`),
  );
  return data.weeks;
}

export async function fetchPaceTrend(
  params?: StatsParams,
): Promise<PacePeriod[]> {
  const data = await handle<{ periods: PacePeriod[] }>(
    await fetch(`${BASE}/pace${buildQuery(params)}`),
  );
  return data.periods;
}

export async function fetchTypeBreakdown(
  params?: StatsParams,
): Promise<TypeBreakdown[]> {
  const data = await handle<{ types: TypeBreakdown[] }>(
    await fetch(`${BASE}/by-type${buildQuery(params)}`),
  );
  return data.types;
}
