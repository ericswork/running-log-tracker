## 1. Backend — filterable list endpoint

- [x] 1.1 Add `listRunsQuerySchema` to `server/src/runs/schemas.ts`: `from`/`to` (`YYYY-MM-DD`, real calendar dates), `minDistanceKm`/`maxDistanceKm` (`z.coerce.number().nonnegative()`), `type` (Zod `preprocess` → `string[]`, split on commas, each in `RUN_TYPES`); object-level refines for `from <= to` and `minDistanceKm <= maxDistanceKm`
- [x] 1.2 Update `listRuns` in `server/src/runs/controller.ts`: validate `req.query` via `parseBody`, build a Prisma `where` (date `gte ${from}T00:00:00.000Z` / `lte ${to}T23:59:59.999Z`, distance `gte`/`lte`, `type: { in }`), keep `orderBy: { date: "desc" }` and the `Run[]` response
- [x] 1.3 Add Supertest tests (`server/tests/runs.filter.api.test.ts`): whole-day date-range inclusivity (incl. a `23:59:59` boundary), distance band, multi-type via CSV and repeated params, combined-AND, no-params (unchanged), empty-result, and 400s for malformed date, non-numeric distance, unknown type, and inverted `from`/`to` + `min`/`max`
- [x] 1.4 Run `npm --prefix server test` — all backend tests pass

## 2. Frontend — data layer & Log filter bar

- [x] 2.1 In `client/src/api/runs.ts`: add a `RunFilters` type and make `fetchRuns(filters?)` append a query string (`from`/`to`/`minDistanceKm`/`maxDistanceKm`/`type`)
- [x] 2.2 Build a shared `DateRangeControl` in `client/src/components/` — two native `<input type="date">` (emit `YYYY-MM-DD`) + a clear affordance
- [x] 2.3 Build the run-type multi-select as toggle chips over `RUN_TYPES` (default all-on) with explicit "Select all" + "Clear"/"None"; and the distance min/max number inputs (`step="any"`). Map selection to the API: all → omit `type`; subset → `type` in those; none → empty (client-guarded, no query)
- [x] 2.4 Assemble a filter bar above the table in `RunList` (stacked on mobile): holds `RunFilters` state, renders the controls + "Clear filters" (resets chips to all-on) + an active-filter / result-count indicator, and folds filters into the `['runs', filters]` query key
- [x] 2.5 Show a "No runs match your filters" empty state when filters are active and the result is empty — including when zero run-type chips are selected (distinct from the no-runs-at-all state)

## 3. Frontend — Dashboard date range

- [x] 3.1 Add the shared `DateRangeControl` to `features/dashboard/Dashboard.tsx`: hold an independent `{from?, to?}`, pass it to `useSummary`/`useWeekly`/`usePaceTrend`/`useTypeBreakdown`, and reset to all-time on clear

## 4. Frontend — tests & verification

- [ ] 4.1 RTL: setting Log filters calls `fetchRuns` with the expected params / drives the `['runs', filters]` key (mock `api/runs`)
- [ ] 4.2 RTL: "Clear filters" resets to all runs (chips back to all-on); deselecting all run-type chips shows the "No runs match your filters" empty state; "Select all" re-includes every type
- [ ] 4.3 RTL: selecting a Dashboard date range threads `from`/`to` into the stats hooks' query keys/params (mock `api/stats`)
- [ ] 4.4 Run `npm --prefix client test`; manually verify the filter bar + Dashboard range in `npm run dev` (responsive collapse, native date inputs)

## 5. Wrap-up

- [ ] 5.1 Update `CLAUDE.md` (API filter params on `GET /api/runs`, `run-search` capability, shared `DateRangeControl`, status/continuity + totals)
- [ ] 5.2 Confirm change ready for `/opsx:archive` (tag target `v0.4.0`)
