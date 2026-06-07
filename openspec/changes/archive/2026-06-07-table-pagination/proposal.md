## Why

The run list loads the entire history into the browser and sorts/filters it client-side. That's fine at today's scale but doesn't scale — every run ships to the client on every load. This change makes the list **server-paginated and server-sorted** (composing with the filters shipped in `search-filtering`) and adds **database indexes** on the sorted/filtered columns, so the list stays fast as the dataset grows. Targets release v0.6.0.

## What Changes

- **`GET /api/runs` becomes paginated** — accepts `limit` (default 20, ≤100), `offset` (default 0), `sort` (`date|distanceKm|durationSec|type`, default `date`), and `order` (`asc|desc`, default `desc`), all Zod-validated; invalid values → `400`.
- **Response shape changes (BREAKING)** — from a bare `Run[]` to an envelope `{ runs, total, limit, offset }`, where `total` is the count of the **filtered** set (drives "Page X of Y"). Run objects are unchanged.
- **Sorting moves server-side** — the table's sortable columns (date, distance, duration, type) drive `sort`/`order`; the client no longer sorts in memory. Default stays newest-first. A sort change refetches and resets to the first page.
- **Pagination + sorting compose with the existing filters** — `total`/pages reflect the active filters.
- **Pagination UI** — fixed page size (20), Prev/Next controls (disabled at bounds), and a "Page X of Y" indicator. Any filter or sort change resets to page 1.
- **Database indexes (first schema migration since the initial model)** — add `@@index` on `date`, `distanceKm`, `durationSec`, and `type` to back the sort/filter queries; shipped via `prisma migrate dev`. No new columns or tables.
- **Tests in the same change** — backend Supertest for the envelope, paging bounds, each sort column asc/desc, sort+filter+paginate, total-reflects-filters, and validation 400s; frontend RTL for page/sort → params wiring, reset-to-first-page, the page indicator, and the empty state.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `run-management`: the list endpoint gains pagination + server-side sorting and returns a paginated envelope; the run-list view gains pagination controls and drives sorting through the server (its default newest-first behavior preserved). The supporting database indexes are a non-functional/performance detail (recorded in design + tasks, not a spec requirement).
- `run-search`: the filterable-list requirement's response-shape wording is updated from a bare `Run[]` to the paginated envelope (the filtering semantics — which runs match — are unchanged).

## Impact

- **No new dependencies.** **Schema change**: `@@index` entries in `server/prisma/schema.prisma` + a new `prisma/migrations/` entry (`prisma migrate dev`); the isolated test DB picks them up via `prisma db push` in `vitest.globalSetup`; `dev.db` stays intact.
- **Server**: `runs/schemas.ts` (pagination/sort params on the list query schema), `runs/controller.ts` `listRuns` (orderBy + skip/take + `count` + envelope). Existing `GET /api/runs` tests adapt to the envelope.
- **Client**: `api/runs.ts` (`fetchRuns` returns the envelope; new pagination/sort params + types), `features/runs/RunsTable` (TanStack `manualPagination` + `manualSorting`), `RunList` (holds page + sort state, folds them into the `['runs', filters, sort, page]` query key, renders pagination controls). The dashboard (`/api/stats`) is unaffected.
- **Out of scope**: cursor/keyset pagination, infinite scroll, a page-size selector or numbered page links, URL persistence of page/sort, multi-column sort, changes to other endpoints, new entities/columns, auth.
