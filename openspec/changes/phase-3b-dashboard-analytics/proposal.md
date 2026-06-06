## Why

The run log captures every run but offers no way to see trends — weekly volume, pace progression, or how the training mix breaks down by run type. Phase 3A/3A.1 shipped the UI foundation (app shell, sortable table, theming, responsive layout); this change adds the data half: read-only aggregation endpoints and a charts dashboard so the user can actually understand their training at a glance. Targets release v0.3.1.

## What Changes

- **New read-only analytics endpoints under `/api/stats`** (separate from `/api/runs`), derived from existing runs — no persistence or schema changes:
  - weekly mileage (total `distanceKm` + run count per week),
  - pace trend (total `distanceKm` + total `durationSec` per period; client derives avg pace),
  - run-type breakdown (count + total `distanceKm` per run type),
  - summary totals (total runs, total `distanceKm`, total `durationSec`).
- **Zod-validated query params**: optional date range (`from`/`to`) and a `timezone` (IANA name or UTC offset) used for time-based bucketing; bucketing falls back to UTC when `timezone` is absent.
- **Time-based buckets computed in the user's timezone** — runs near midnight land in the correct local day/week.
- **Tabbed navigation in the app shell** — a shadcn Tabs control switching between **Log** (existing run form + table, unchanged) and **Dashboard** (new). Default tab = Log. No router.
- **New dashboard view** (`features/dashboard/`) built with **Recharts**: weekly-mileage bar chart, pace-trend line chart, run-type breakdown pie/donut, and a row of summary cards (total runs, distance, time, avg pace). Charts size to their container and show a graceful empty state ("No runs yet").
- **Tests in the same change** (test-as-you-go): backend Supertest+Vitest for bucketing correctness, timezone bucketing (incl. a near-midnight cross-day case), empty-data, and param-validation 400s; frontend Vitest+RTL for data-shaping/formatting and that the dashboard renders given mocked endpoint data.

## Capabilities

### New Capabilities
- `run-analytics`: read-only aggregation endpoints (`/api/stats/*`) that bucket existing runs by week/period/run-type in the user's timezone, plus the Recharts dashboard view (charts + summary cards) that consumes them.

### Modified Capabilities
- `app-shell`: gains a tabbed switch between the run log and the dashboard within the existing shell; the Log tab preserves the current run form + table behavior unchanged.

## Impact

- **New deps**: `recharts` (client). No new server deps — bucketing is plain JS over `Date`/`Intl`.
- **Server**: new `server/src/stats/` (router, controller, schemas, bucketing) mounted at `/api/stats`; wired into `app.ts`. No Prisma schema/migration changes.
- **Client**: new `features/dashboard/` (hooks + chart components + summary cards), new `api/stats.ts`; `App.tsx`/app shell gains the Tabs and renders the existing Log content under one tab and the dashboard under the other.
- **Out of scope**: search/filtering on `/api/runs` (Phase 4), editing runs from the dashboard, CSV/export, new persisted entities, auth.
