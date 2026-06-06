## 1. Backend — bucketing core (pure functions)

- [x] 1.1 Create `server/src/stats/buckets.ts` with timezone resolution (IANA via `Intl` try/catch; fixed `±HH:MM`/`±HHMM`/`Z` offset shim; absent → UTC) and a helper returning a run's local `YYYY-MM-DD` and Monday `weekStart` in the resolved timezone
- [x] 1.2 Implement pure aggregators in `buckets.ts`: `summarize(runs)`, `weeklyMileage(runs, tz)`, `paceTrend(runs, tz)`, `typeBreakdown(runs)` — canonical units only, weeks ascending, by-type ordered by `RUN_TYPES`, empty input → empty/zeroed output
- [x] 1.3 Zero-fill the weekly series in `weeklyMileage`/`paceTrend`: emit every week between the first and last of the span (`from`/`to` range when both given, else first→last week with runs) with zero totals for empty weeks
- [x] 1.4 Implement inclusive date-range filtering by local calendar date in the resolved timezone
- [x] 1.5 Unit-test `buckets.ts` (Vitest): multi-week bucketing, zero-fill of intervening empty weeks, near-midnight cross-day timezone case (one timestamp → different weeks under two timezones), by-type ordering, empty-data, and date-range filtering

## 2. Backend — stats endpoints

- [x] 2.1 Create `server/src/stats/schemas.ts`: shared Zod query schema (`from?`/`to?` as `YYYY-MM-DD`, `timezone?` IANA-or-offset with a custom refine; `from <= to` refine)
- [x] 2.2 Create `server/src/stats/controller.ts`: parse query via `parseBody` pattern, `findMany` runs, call the matching aggregator, return canonical-unit JSON
- [x] 2.3 Create `server/src/stats/router.ts` with `GET /summary`, `/weekly`, `/pace`, `/by-type`; mount at `/api/stats` in `server/src/app.ts`
- [x] 2.4 Add Supertest tests (`server/tests/stats.api.test.ts`): each endpoint's shape, timezone bucketing (incl. near-midnight cross-day), zero-filled intervening weeks, empty-data responses, and 400s for invalid `timezone`, malformed `from`/`to`, and inverted range
- [x] 2.5 Run `npm --prefix server test` — all backend tests pass

## 3. Frontend — data layer

- [x] 3.1 Add `recharts` to `client` dependencies
- [x] 3.2 Create `client/src/api/stats.ts`: four fetchers on relative `/api/stats/*` paths, attaching the browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and optional `from`/`to`
- [x] 3.3 Create React Query hooks under `features/dashboard/` (`useSummary`, `useWeekly`, `usePaceTrend`, `useTypeBreakdown`)
- [x] 3.4 Create client formatting helpers (`formatPace`, `formatDuration`, `formatDistance`, avg-pace derivation) and unit-test them

## 4. Frontend — dashboard view

- [x] 4.1 Build summary cards (total runs, distance, time, avg pace) using shadcn Card primitives
- [x] 4.2 Build the weekly-mileage bar chart, pace-trend line chart, and run-type pie/donut with Recharts wrapped in `ResponsiveContainer`; render zero-run weeks as a null/gap point in the pace line (not zero pace)
- [x] 4.3 Add a "hide empty weeks" toggle (default off) that filters `runCount === 0` weeks out of the weekly time-series charts client-side (no refetch)
- [x] 4.4 Add a graceful "No runs yet" empty state per chart and for the summary area
- [x] 4.5 Compose `features/dashboard/Dashboard.tsx` laying the cards + charts within the existing responsive shell (single column on mobile)

## 5. App shell — tabs

- [x] 5.1 Add the shadcn `Tabs` primitive (`npx shadcn@latest add tabs`)
- [x] 5.2 Add `Log` | `Dashboard` tabs in the shell (default `Log`); move the existing form+table grid verbatim under the Log tab and render `Dashboard` under the Dashboard tab — no router

## 6. Frontend tests & verification

- [x] 6.1 Add RTL test: dashboard renders summary cards + chart containers given mocked `api/stats` fixture data
- [x] 6.2 Add RTL test: dashboard empty state with no runs; "hide empty weeks" toggle filters zero-run weeks from the shaped chart data; Log/Dashboard tab switch renders the right content
- [x] 6.3 Run `npm --prefix client test` — all frontend tests pass
- [x] 6.4 Manual verification: run `npm run dev`, confirm charts size/responsiveness, timezone bucketing, and empty state visually (jsdom can't assert Recharts SVG)

## 7. Wrap-up

- [ ] 7.1 Update `CLAUDE.md` (status/continuity, layout, API, key decisions) for the new `/api/stats` surface and `features/dashboard/`
- [ ] 7.2 Confirm change ready for `/opsx:archive` (tag target `v0.3.1`)
