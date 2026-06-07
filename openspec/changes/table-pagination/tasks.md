## 1. Database indexes (migration)

- [x] 1.1 Add `@@index([date])`, `@@index([distanceKm])`, `@@index([durationSec])`, `@@index([type])` to the `Run` model in `server/prisma/schema.prisma`
- [x] 1.2 Create the migration with `npm --prefix server exec prisma migrate dev` (name it e.g. `add_run_indexes`); confirm `dev.db` is intact and the new `prisma/migrations/` entry is created
- [x] 1.3 Confirm the isolated `test.db` picks up the indexes via `prisma db push` in `vitest.globalSetup` (the suite still runs cleanly)

## 2. Backend — pagination + server sorting

- [ ] 2.1 Extend `listRunsQuerySchema` in `server/src/runs/schemas.ts`: `limit` (`z.coerce.number().int()`, ≥1, ≤100, default 20), `offset` (`z.coerce.number().int()`, ≥0, default 0), `sort` (enum `date|distanceKm|durationSec|type`, default `date`), `order` (enum `asc|desc`, default `desc`)
- [ ] 2.2 Update `listRuns` in `server/src/runs/controller.ts`: keep the filter `where`, add `orderBy: [{ [sort]: order }, { id: 'desc' }]` (stable tie-break), `skip: offset`, `take: limit`; compute `total` via `prisma.run.count({ where })`; return `{ runs, total, limit, offset }`
- [ ] 2.3 Update the existing `GET /api/runs` tests (`runs.api.test.ts`, `runs.filter.api.test.ts`) for the envelope shape (read `.runs`/`.total`)
- [ ] 2.4 Add Supertest cases: default page + envelope, a non-first page (`offset`), `limit` bound (cap), each `sort` column asc/desc, sort+filter+paginate combined, `total` reflects filters, and 400s for invalid `limit`/`offset`/`sort`/`order`
- [ ] 2.5 Run `npm --prefix server test` — all backend tests pass

## 3. Frontend — data layer

- [ ] 3.1 In `client/src/api/runs.ts`: add `RunsPage` (`{ runs: Run[]; total: number; limit: number; offset: number }`) and pagination/sort params (`limit`/`offset`/`sort`/`order`) to `fetchRuns`; return the envelope; extend the query builder
- [ ] 3.2 Update any direct `fetchRuns` consumers/types for the new return shape

## 4. Frontend — table pagination + server sorting

- [ ] 4.1 Switch `features/runs/RunsTable` to TanStack `manualPagination` + `manualSorting`: accept the page rows + total/pageCount + controlled sorting/pagination state, and report sort/page changes up (no in-memory comparator)
- [ ] 4.2 In `RunList`: hold `offset` + `sort`/`order` state, fold them into the `['runs', filters, sort, offset]` query key, pass to `fetchRuns`, and render the page rows
- [ ] 4.3 Add Prev/Next controls (disabled at bounds) + a "Page X of Y" indicator derived from `total`/`limit`; reset `offset` to 0 whenever the filters or the sort change
- [ ] 4.4 Keep the "No runs match your filters" / "No runs yet" empty states (now keyed off `total === 0`) and show a loading state while a page is fetching

## 5. Frontend — tests & verification

- [ ] 5.1 RTL/unit: Next/Prev change `offset` and drive `fetchRuns` params; a sort header click sets `sort`/`order` and resets to the first page; the page indicator derives from `total`; empty state on `total === 0` (mock `api/runs` returning the envelope)
- [ ] 5.2 Run `npm --prefix client test`; manually verify paging, server sorting, and reset-on-filter/sort in `npm run dev`

## 6. Wrap-up

- [ ] 6.1 Update `CLAUDE.md` (API: `GET /api/runs` pagination/sort params + envelope; schema indexes + first migration; run-list view paging) and status/continuity + totals
- [ ] 6.2 Confirm change ready for `/opsx:archive` (tag target `v0.6.0`)
