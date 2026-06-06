// Pure, framework-free aggregation over runs for the /api/stats endpoints.
// Everything here works in canonical units (distanceKm, durationSec) and never
// formats or computes pace — the client does that. Time-based buckets are
// computed in a caller-supplied timezone so runs near midnight land on the
// correct LOCAL day/week; absent a timezone we fall back to UTC.

import { RUN_TYPES } from "../runs/constants";

// Minimal shape these functions need from a run. `date` may be a Date or an ISO
// string (Prisma hands back Date; tests pass either).
export interface StatRun {
  distanceKm: number;
  durationSec: number;
  date: Date | string;
  type: string;
}

export interface StatsOptions {
  // IANA name (e.g. "America/New_York") or a fixed UTC offset ("+02:00",
  // "-0500", "+05", "Z"). Absent/empty → UTC.
  timezone?: string;
  // Inclusive date-range bounds as local calendar dates (YYYY-MM-DD).
  from?: string;
  to?: string;
}

export class InvalidTimeZoneError extends Error {
  constructor(public readonly timezone: string) {
    super(`Invalid timezone: ${timezone}`);
    this.name = "InvalidTimeZoneError";
  }
}

const pad = (n: number): string => String(n).padStart(2, "0");

// Parse a fixed UTC offset into minutes, or null if `tz` is not an offset form.
// Accepts Z/UTC, ±HH, ±HHMM, ±HH:MM.
function parseUtcOffset(tz: string): number | null {
  if (tz === "Z" || tz === "UTC") return 0;
  const m = /^([+-])(\d{2})(?::?(\d{2}))?$/.exec(tz);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const hours = Number(m[2]);
  const mins = m[3] ? Number(m[3]) : 0;
  if (hours > 14 || mins > 59) return null;
  return sign * (hours * 60 + mins);
}

function isValidIana(tz: string): boolean {
  try {
    // Throws RangeError for an unknown timezone.
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// True for an IANA name OR a fixed UTC offset. Used by the Zod query schema.
export function isValidTimeZone(tz: string): boolean {
  return parseUtcOffset(tz) !== null || isValidIana(tz);
}

// Build a function mapping a Date to its local calendar date "YYYY-MM-DD" in the
// resolved timezone. Throws InvalidTimeZoneError for an unrecognized name.
export function localDateFormatter(timezone?: string): (date: Date) => string {
  if (!timezone) return utcDate;

  const offset = parseUtcOffset(timezone);
  if (offset !== null) {
    return (date) => utcDate(new Date(date.getTime() + offset * 60_000));
  }

  if (!isValidIana(timezone)) throw new InvalidTimeZoneError(timezone);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return (date) => {
    const parts = fmt.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)!.value;
    return `${get("year")}-${get("month")}-${get("day")}`;
  };
}

function utcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

// Monday-start (ISO-8601) week containing the given local date, returned as the
// "YYYY-MM-DD" of that Monday. Pure calendar math on the local date — no tz.
export function weekStartOf(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const fromMonday = (dt.getUTCDay() + 6) % 7; // 0=Sun..6=Sat → days since Monday
  dt.setUTCDate(dt.getUTCDate() - fromMonday);
  return utcDate(dt);
}

// Every Monday "YYYY-MM-DD" from start..end inclusive (both already week-starts).
function enumerateWeeks(start: string, end: string): string[] {
  const [y, m, d] = start.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const [ey, em, ed] = end.split("-").map(Number);
  const endMs = Date.UTC(ey, em - 1, ed);
  const weeks: string[] = [];
  while (dt.getTime() <= endMs) {
    weeks.push(utcDate(dt));
    dt.setUTCDate(dt.getUTCDate() + 7);
  }
  return weeks;
}

interface EnrichedRun {
  run: StatRun;
  ymd: string; // local calendar date
}

// Resolve the timezone, tag each run with its local date, and apply the
// inclusive from/to date-range filter (string compare is valid for ISO dates).
function prepare(runs: StatRun[], options: StatsOptions): EnrichedRun[] {
  const toLocalDate = localDateFormatter(options.timezone);
  const { from, to } = options;
  return runs
    .map((run) => ({ run, ymd: toLocalDate(new Date(run.date)) }))
    .filter(({ ymd }) => (!from || ymd >= from) && (!to || ymd <= to));
}

// Contiguous week-start span to chart over: the from/to range when both are
// given, otherwise the first..last week that actually contain runs.
function weekSpan(
  presentWeeks: string[],
  options: StatsOptions,
): string[] {
  if (options.from && options.to) {
    return enumerateWeeks(weekStartOf(options.from), weekStartOf(options.to));
  }
  if (presentWeeks.length === 0) return [];
  const sorted = [...presentWeeks].sort();
  return enumerateWeeks(sorted[0], sorted[sorted.length - 1]);
}

export interface Summary {
  totalRuns: number;
  totalDistanceKm: number;
  totalDurationSec: number;
}

export function summarize(runs: StatRun[], options: StatsOptions = {}): Summary {
  const enriched = prepare(runs, options);
  let totalDistanceKm = 0;
  let totalDurationSec = 0;
  for (const { run } of enriched) {
    totalDistanceKm += run.distanceKm;
    totalDurationSec += run.durationSec;
  }
  return { totalRuns: enriched.length, totalDistanceKm, totalDurationSec };
}

export interface WeeklyMileage {
  weekStart: string;
  distanceKm: number;
  runCount: number;
}

// Per Monday-start week: total distance + run count, zero-filled across the span
// so the bar chart has a continuous axis. Empty input with no range → [].
export function weeklyMileage(
  runs: StatRun[],
  options: StatsOptions = {},
): WeeklyMileage[] {
  const enriched = prepare(runs, options);
  const map = new Map<string, { distanceKm: number; runCount: number }>();
  for (const { run, ymd } of enriched) {
    const ws = weekStartOf(ymd);
    const cur = map.get(ws) ?? { distanceKm: 0, runCount: 0 };
    cur.distanceKm += run.distanceKm;
    cur.runCount += 1;
    map.set(ws, cur);
  }
  return weekSpan([...map.keys()], options).map((weekStart) => ({
    weekStart,
    distanceKm: map.get(weekStart)?.distanceKm ?? 0,
    runCount: map.get(weekStart)?.runCount ?? 0,
  }));
}

export interface PacePeriod {
  weekStart: string;
  distanceKm: number;
  durationSec: number;
}

// Per Monday-start week: total distance + duration (client derives pace),
// zero-filled across the span. Zero weeks carry 0/0 → client renders a gap.
export function paceTrend(
  runs: StatRun[],
  options: StatsOptions = {},
): PacePeriod[] {
  const enriched = prepare(runs, options);
  const map = new Map<string, { distanceKm: number; durationSec: number }>();
  for (const { run, ymd } of enriched) {
    const ws = weekStartOf(ymd);
    const cur = map.get(ws) ?? { distanceKm: 0, durationSec: 0 };
    cur.distanceKm += run.distanceKm;
    cur.durationSec += run.durationSec;
    map.set(ws, cur);
  }
  return weekSpan([...map.keys()], options).map((weekStart) => ({
    weekStart,
    distanceKm: map.get(weekStart)?.distanceKm ?? 0,
    durationSec: map.get(weekStart)?.durationSec ?? 0,
  }));
}

export interface TypeBreakdown {
  type: string;
  count: number;
  distanceKm: number;
}

// Per run type, ordered by the canonical RUN_TYPES order; types with no runs are
// omitted so the pie chart shows only meaningful slices.
export function typeBreakdown(
  runs: StatRun[],
  options: StatsOptions = {},
): TypeBreakdown[] {
  const enriched = prepare(runs, options);
  const map = new Map<string, { count: number; distanceKm: number }>();
  for (const { run } of enriched) {
    const cur = map.get(run.type) ?? { count: 0, distanceKm: 0 };
    cur.count += 1;
    cur.distanceKm += run.distanceKm;
    map.set(run.type, cur);
  }
  return RUN_TYPES.filter((type) => map.has(type)).map((type) => ({
    type,
    count: map.get(type)!.count,
    distanceKm: map.get(type)!.distanceKm,
  }));
}
