## Context

Phase 3A/3A.1 shipped the UI foundation (shadcn/ui + Tailwind v4, sortable runs table, theming, responsive shell, Vitest+RTL harness). Runs are stored with canonical units — `distanceKm` (float), `durationSec` (int), `date` (DateTime, time-of-day preserved). There is no analytics surface yet. This change adds read-only aggregation endpoints under `/api/stats` and a Recharts dashboard, derived entirely from existing runs (no schema/persistence changes). This is the first backend work since Phase 1, so it must re-establish the existing layering (routes → controller → Prisma), `parseBody`/Zod validation, and the isolated-`test.db` test setup.

Single-user scale means bucketing in JS over all the user's runs is acceptable — no SQL-level aggregation needed.

## Goals / Non-Goals

**Goals:**
- Read-only `/api/stats/*` endpoints returning canonical units only (no pace, no formatting server-side).
- Correct time-based bucketing in the user's timezone (IANA name or UTC offset), falling back to UTC.
- A tabbed dashboard (Recharts) that consumes the endpoints, with summary cards and a graceful empty state.
- Tests in the same change covering bucketing, timezone (incl. near-midnight cross-day), empty data, and 400 validation.

**Non-Goals:**
- Search/filtering of `/api/runs` (Phase 4), editing from the dashboard, CSV/export, new entities, auth.
- Server-side pace or display formatting (client-only).
- SQL/Prisma aggregation or schema changes.

## Decisions

### D1 — Separate endpoints under `/api/stats`, shared query schema
Four read-only routes rather than one combined payload, matching the locked decision and keeping each aggregation independently testable and cacheable by React Query:
- `GET /api/stats/summary` → `{ totalRuns, totalDistanceKm, totalDurationSec }`
- `GET /api/stats/weekly` → `{ weeks: [{ weekStart, distanceKm, runCount }] }`
- `GET /api/stats/pace` → `{ periods: [{ weekStart, distanceKm, durationSec }] }`
- `GET /api/stats/by-type` → `{ types: [{ type, count, distanceKm }] }`

All four share one Zod query schema (`from?`, `to?`, `timezone?`). Layering: `stats/router.ts` → `stats/controller.ts` → Prisma read (`findMany`) → pure bucketing functions in `stats/buckets.ts`. The pure functions take `(runs, { timezone })` and are unit-tested without HTTP. *Alternative considered:* a single `GET /api/stats` returning everything — rejected as less granular for caching and testing, and it contradicts the locked decision.

### D2 — Timezone resolution: IANA via `Intl`, fixed `±HH:MM` offsets handled manually
`timezone` accepts either an IANA name (e.g. `America/New_York`) validated by attempting `new Intl.DateTimeFormat('en-US', { timeZone })` in a try/catch, or a fixed UTC offset string `±HH:MM` / `±HHMM` / `Z`. For IANA names we derive a run's local calendar date with `Intl.DateTimeFormat(..., { timeZone, year/month/day })`. For fixed offsets (which `Intl` won't accept as a `timeZone`) we shift the timestamp by the offset and read the UTC calendar date. Absent/empty → UTC. Invalid → 400. *Alternative considered:* pulling in `date-fns-tz`/`luxon` — rejected to avoid a new server dep when `Intl` + a tiny offset shim suffices at this scale.

### D3 — Week definition: Monday-start, keyed by local `weekStart` date, zero-filled
Weeks bucket Monday→Sunday (ISO-8601, natural for training weeks). The bucket key is the `YYYY-MM-DD` of that week's Monday **in the resolved timezone**, returned as `weekStart`. Buckets are returned chronologically ascending for direct charting. The server **zero-fills** every week between the first and last week of the series so the axis is continuous: a week with no runs is emitted with `distanceKm: 0`, `runCount: 0`. The series span is the explicit `from`/`to` range when both are given, otherwise the first→last week that actually contains runs. *Alternative considered:* Sunday-start (US calendar) — settled as Monday (Q1).

### D4 — Pace trend bucketed weekly, same buckets as mileage, zero-filled
Pace trend reuses the weekly bucketing (same zero-filled week series) and returns `distanceKm` + `durationSec` per week (`weekStart`); the client computes avg pace = `durationSec / distanceKm`. Keeps one bucketing path and aligns the pace line chart's x-axis with the mileage bars. Zero-filled weeks have `distanceKm: 0` / `durationSec: 0`, so pace is undefined there — the client renders a **gap (null point)** in the line, not a zero-pace value. *Alternative considered:* monthly or per-run periods — settled as weekly (Q2).

### D4a — "Hide empty weeks" is a client-side toggle, not a server param
The server always returns the full zero-filled week series; the dashboard provides a checkbox (default **off** = show all weeks) that filters out `runCount === 0` weeks client-side before charting. No extra query param or refetch — instant toggle over already-fetched data, and the server contract stays single-shaped. *Alternative considered:* a `fill=true|false` server param — rejected as it would force a refetch and duplicate the empty/non-empty logic across tiers.

### D5 — Date-range filter `from`/`to` as local calendar dates, inclusive
`from`/`to` are optional `YYYY-MM-DD` strings interpreted as day boundaries in the resolved timezone; a run is included when its local calendar date is within `[from, to]` inclusive. Either bound may be omitted. *Alternative considered:* full ISO datetimes — rejected as overkill for a date-driven dashboard; date-only keeps the contract simple and matches how runs are charted by day/week.

### D6 — Run-type breakdown returns only types that have runs
`by-type` returns one entry per `RUN_TYPES` value **that appears** in the filtered set (not zero-filled across all six), ordered by the canonical `RUN_TYPES` order, so the pie/donut shows only meaningful slices. The client maps types to colors.

### D7 — App shell tabs without a router
A shadcn `Tabs` (`Log` | `Dashboard`, default `Log`) lives in the shell. The Log tab renders the **existing** form+table content unchanged (moved verbatim under the tab); the Dashboard tab renders `features/dashboard/`. No URL/router — tab state is local React state, consistent with the no-router decision. The responsive grid currently in `App.tsx` stays under the Log tab.

### D8 — Frontend data layer + charts
`api/stats.ts` exposes four fetchers (relative `/api` paths) that attach the browser timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`. React Query hooks (`useSummary`, `useWeekly`, `usePaceTrend`, `useTypeBreakdown`) under `features/dashboard/`. Recharts charts wrap in `ResponsiveContainer` and each renders a "No runs yet" empty state when its data is empty. Pace/duration/distance formatting lives in client helpers (e.g. `formatPace`, `formatDuration`), unit-tested directly.

### D9 — Testing
Backend: Supertest against `app`, plus direct unit tests of `buckets.ts`. Cases: multi-week bucketing correctness, timezone bucketing including a run timestamped near midnight UTC that falls on different local days under two timezones (cross-day), empty-data (empty arrays / zeroed summary), and 400s for invalid `timezone`, malformed `from`/`to`, and `from > to`. Frontend: unit-test the data-shaping/formatting helpers; render the dashboard with mocked `api/stats` returning fixture data and assert summary cards + chart containers appear; assert the empty state with no runs. Recharts SVG/layout internals are not meaningfully assertable in jsdom — verified manually (noted in tasks).

## Risks / Trade-offs

- **Timezone correctness is the main hazard** → centralize all tz logic in `buckets.ts`, cover with the cross-day near-midnight test; never bucket off the raw stored UTC date.
- **Fixed-offset (`±HH:MM`) support adds a second code path** → keep it to a small offset-shim; if review prefers, we can drop raw-offset support and accept IANA-only (still satisfies the browser, which always sends an IANA name).
- **Zero-filled empty weeks could mislead the pace chart** (a zero-distance week has no defined pace) → client renders empty weeks as a null/gap point in the pace line, never as zero pace; the "hide empty weeks" toggle removes them entirely.
- **Recharts bundle size** added to the client → acceptable for a personal project; tree-shaken via named imports.
- **Re-establishing backend test isolation after a long gap** → mirror the existing `vitest.globalSetup`/`vitest.setup` `test.db` pattern exactly; no new harness.

## Open Questions (sub-decisions to confirm at spec review)

These have recommended defaults baked into the spec/design; confirm or override before apply:

- **Q1 (D3) Week start** — recommend **Monday** (ISO, training-week convention). Alternative: Sunday.
- **Q2 (D4) Pace-trend period** — recommend **weekly** (reuse mileage buckets). Alternative: monthly.
- **Q3 Zero-filling empty weeks** — **RESOLVED:** server zero-fills every week between the first and last bucket in the series (continuous axis), and the dashboard adds a "hide empty weeks" checkbox (default off) that filters them client-side. See D3 / D4 / D4a.
- **Q4 (D2) Offset support** — recommend **IANA names + fixed `±HH:MM` offsets**. Alternative: IANA-only (simpler, still works for browsers).
