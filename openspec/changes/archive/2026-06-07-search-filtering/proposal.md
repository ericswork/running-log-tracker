## Why

The run history is growing but can only be browsed in full — there's no way to narrow it to a date range, a distance band, or specific run types, and the Dashboard always charts all-time. Adding server-side filtering to `GET /api/runs` plus a filter UI (and a Dashboard date-range picker over the analytics already built in Phase 3B) lets the user actually find and focus on the runs that matter. Targets release v0.4.0.

## What Changes

- **`GET /api/runs` gains optional, Zod-validated filter query params**, combined with AND, all optional (omitting all = current behavior: all runs, newest first):
  - `from`/`to` (`YYYY-MM-DD`) — inclusive **whole-day** range against the raw stored timestamp (no timezone param; timestamps are assumed to share one zone),
  - `minDistanceKm`/`maxDistanceKm` (numbers),
  - `type` (repeatable or comma-separated; each must be in `RUN_TYPES`; multi-select).
  - Invalid params and inverted ranges (`from > to`, `min > max`) → `400` with the existing structured `ValidationError` body.
- **Response shape and ordering unchanged** — still a `Run[]` newest-first.
- **Log tab filter UI** — a filter bar above the runs table (date range, distance min/max, multi-select run type), a "Clear filters" action, an active-filter / result-count indicator, and a "No runs match your filters" empty state. Filters fold into the `['runs', filters]` React Query key so changing one refetches.
- **Dashboard date-range picker** — drives the **existing** `/api/stats` `from`/`to` params so all cards and charts scope to the selected window; independent of the Log filters; reuses one shared date-range control component.
- **Tests in the same change** (test-as-you-go): backend Supertest for each filter, combined AND, multi-type, whole-day boundary inclusivity, empty-result, no-params, and the validation 400s; frontend RTL for filter→query-key wiring, the empty state, clear-filters reset, and the Dashboard date-range threading into the stats query keys.

## Capabilities

### New Capabilities
- `run-search`: the filter query params on `GET /api/runs`, the Log filter UI, and the shared date-range control reused on the Dashboard.

### Modified Capabilities
- `run-management`: the run-list endpoint and run-list view gain optional filtering while keeping their default (all runs, newest-first) behavior.
- `run-analytics`: the dashboard-view requirement gains a date-range control that scopes the charts/summary via the existing `from`/`to` params.

## Impact

- **No new dependencies.** No DB/schema changes — filtering is a Prisma `where` clause over existing runs.
- **Server**: `server/src/runs/schemas.ts` gains a `listRunsQuerySchema`; `controller.ts` `listRuns` validates `req.query` (via `parseBody`) and builds the `where`; new `server/tests/runs.filter.api.test.ts` (or extends `runs.api.test.ts`).
- **Client**: `api/runs.ts` `fetchRuns` accepts filter params and appends a query string; new `features/runs/` filter-bar components + a shared `DateRangeControl`; `RunList`/`App` hold Log filter state; `features/dashboard/Dashboard` gains the date-range picker wired to the stats hooks.
- **Out of scope**: pagination/infinite scroll (deferred to a separate `table-pagination` change), full-text/notes search, saved/named filters, URL persistence of filter state, sorting changes (table already sorts client-side), timezone-aware date filtering, distance/run-type filtering of the Dashboard charts, new `/api/stats` endpoints/params, editing from the filter UI, auth.
