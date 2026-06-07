## Context

The run log loads the full history into one React Query cache entry (`['runs']`) and renders it in a client-sorted TanStack table; the Dashboard (Phase 3B) charts all runs via `/api/stats`, whose endpoints already accept an optional `from`/`to` range (plus `timezone`). There is no way to narrow either view. This change adds **server-side** filtering to `GET /api/runs` and a filter UI on the Log tab, plus a Dashboard date-range picker that reuses the stats endpoints' existing `from`/`to`. No schema/persistence changes — filtering is a Prisma `where` clause over existing rows, mirroring the `parseBody`/Zod query-validation pattern established by `/api/stats`.

## Goals / Non-Goals

**Goals:**
- Optional, AND-combined, Zod-validated filter params on `GET /api/runs` (date range, distance band, multi run-type), with the response staying a newest-first `Run[]`.
- A Log filter bar (clear + active/result indicator + empty state) whose state drives the query key.
- A Dashboard date-range picker over the existing stats `from`/`to`, independent of the Log filters, via one shared date-range control.
- Tests in the same change for both tiers.

**Non-Goals:**
- Pagination/infinite scroll (separate `table-pagination` change), full-text/notes search, saved filters, URL persistence, sorting changes, timezone-aware date filtering, distance/type filtering of the charts, new `/api/stats` params, auth.

## Decisions

### D1 — `listRunsQuerySchema` in `runs/schemas.ts`, parsed via `parseBody(req.query)`
A new schema validates `from`/`to` (`YYYY-MM-DD`, real calendar dates), `minDistanceKm`/`maxDistanceKm` (`z.coerce.number().nonnegative()`), and `type`. Object-level refines reject `from > to` and `minDistanceKm > maxDistanceKm`. `listRuns` validates `req.query` with the existing `parseBody` helper (same as the stats controller) → `400` with the structured `ValidationError` body on failure. *Alternative considered:* hand-rolled parsing — rejected; Zod + `parseBody` is the established pattern.

### D2 — `type` accepts repeatable or comma-separated, normalized to `string[]`
`?type=Easy&type=Tempo` (express/qs → array) and `?type=Easy,Tempo` (single string) both work, via a Zod `preprocess` that coerces to an array and splits on commas; each element must be in `RUN_TYPES`. Empty/absent → no type filter. *Alternative considered:* array-only — rejected as brittle to hand-typed URLs.

### D3 — Whole-day date range against the raw stored timestamp (UTC day boundaries)
`from`/`to` are calendar dates with **no timezone param**; the `where` uses `date: { gte: ${from}T00:00:00.000Z, lte: ${to}T23:59:59.999Z }` so both bounds are inclusive of the entire day. Either bound may be omitted. This matches the locked decision (timestamps assumed to share one zone) and keeps the run-list filter independent of the stats endpoints' timezone bucketing. *Alternative considered:* reuse the Phase 3B timezone helper — explicitly out of scope here.

### D4 — Filtering is a single Prisma `where` built from validated params
`listRuns` builds `where` incrementally (date range, distance range, `type: { in: [...] }`), keeps `orderBy: { date: "desc" }`, and returns the `Run[]` unchanged. Empty match → `[]`. No controller-shape change beyond reading the query. *Alternative considered:* in-memory filtering after `findMany` — rejected; push it to the DB even though scale is small, to stay honest about "server-side".

### D5 — Frontend filter state + query key; mutations still invalidate by prefix
A `RunFilters` object (`{from?, to?, minDistanceKm?, maxDistanceKm?, type?: string[]}`) lives as Log-tab React state. `fetchRuns(filters)` appends a query string; the query key becomes `['runs', filters]`. Existing create/update/delete mutations invalidate `['runs']`, which React Query treats as a **prefix** match — so all filtered variants refresh without changes to the mutation code. *Risk handled below.*

### D6 — One shared `DateRangeControl`, reused on Log and Dashboard
A small component wrapping two native `<input type="date">` fields (which emit `YYYY-MM-DD` directly — no date-picker dependency) plus a clear affordance. Used in the Log filter bar and as the Dashboard's range picker. Lives in `components/` since it is shared by two features. The Log and Dashboard each own independent range state. *Alternative considered:* a calendar popover — heavier; native date inputs are sufficient and accessible.

### D7 — Run-type multi-select as explicit toggle chips (default all-on)
Six fixed `RUN_TYPES` render as toggleable chips, **defaulting to all selected** so the default view is all runs and *why* is visible. A **"Select all"** control lights every chip and a **"Clear"** (or "None") deselects them — selection is WYSIWYG, no implicit "empty means everything" rule. The chip set sends to the API as: **all selected → omit `type`** (≡ all types); **1–5 selected → `type` in those**; **none selected → the Log view shows the "No runs match your filters" empty state without querying** (client guard), so the backend contract stays "absent `type` = all, non-empty list = those types" and never needs a degenerate "match none" param. The global "Clear filters" resets chips back to all-on (= all runs). *Alternative considered:* a dropdown of checkbox items — same multi-select, collapsed into a menu; chips chosen for tap-friendliness and always-visible state.

### D8 — Dashboard date range threads into existing stats hooks
The Dashboard holds its own `{from?, to?}` and passes it to `useSummary/useWeekly/usePaceTrend/useTypeBreakdown` (which already accept `StatsParams`), so the stats query keys change and refetch. A reset returns to all-time. No `/api/stats` changes.

### D9 — Distinguish "no matches" from "no runs"
The Log table shows **"No runs match your filters"** when filters are active and the result is empty, versus the existing empty-state when no filters are active and there are simply no runs.

## Risks / Trade-offs

- **Query-key prefix invalidation must actually refresh filtered lists** → confirmed React Query matches `['runs']` as a prefix of `['runs', filters]`; covered by keeping mutation invalidation untouched and a manual check.
- **`type` query-param shape (array vs CSV) is a common foot-gun** → centralize coercion in one Zod `preprocess`; test both forms.
- **Whole-day boundary off-by-one** → test a run at `…T23:59:59` on the `to` day is included and one at `00:00:00` next day is excluded.
- **Native date input rendering varies by browser** → acceptable for a personal app; the value format is stable (`YYYY-MM-DD`).
- **Filter + client-side sort interaction** → fine: filtering returns the full filtered set (no pagination), so the table still sorts the whole result client-side as today.

## Open Questions (resolved at spec review)

- **Q1 (D7) Run-type control** — **RESOLVED:** explicit toggle chips with **Select all + Clear, default all-on**; none selected → empty (client-guarded). See D7.
- **Q2 (D6) DateRangeControl location** — **RESOLVED:** `components/` (shared).
- **Q3 Distance inputs** — **RESOLVED:** two `step="any"` km number inputs (min/max).
- **Q4 Filter-bar layout on mobile** — **RESOLVED:** the bar stacks above the table (always shown, not behind a toggle).
