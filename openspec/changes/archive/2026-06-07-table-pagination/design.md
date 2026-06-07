## Context

`GET /api/runs` currently returns every matching run as a bare `Run[]`; the frontend (`RunsTable`, TanStack Table) sorts client-side and `RunList` keys the React Query cache on the active filters (`['runs', apiFilters]`). Filtering already happens server-side (a Prisma `where`) from the `search-filtering` change. This change pushes **pagination and sorting** server-side too, so the three compose into one `WHERE … ORDER BY … LIMIT … OFFSET` query, and adds **indexes** on the columns those clauses touch. It's the first schema migration since the initial model. The dashboard's `/api/stats` endpoints are independent and unaffected.

## Goals / Non-Goals

**Goals:**
- Server-side pagination (`limit`/`offset`) and sorting (`sort`/`order`) on `GET /api/runs`, composing with the existing filters.
- A paginated response envelope with a filtered `total` for the page indicator.
- DB indexes backing the sort/filter columns, via a migration.
- Pagination UI (Prev/Next + page indicator) and server-driven table sorting.

**Non-Goals:**
- Cursor/keyset pagination, infinite scroll, page-size selector, numbered pages, URL persistence, multi-column sort, or changes to any other endpoint.

## Decisions

### D1 — Offset/limit pagination; response envelope `{ runs, total, limit, offset }`
`listRuns` returns `{ runs, total, limit, offset }` where `runs` is the page (`skip`/`take`), `total` is `prisma.run.count` over the **same** `where`, and `limit`/`offset` echo the window. The client derives `pageCount = ceil(total/limit)` and `currentPage = offset/limit + 1`. *Alternative considered:* cursor/keyset — more scalable for huge/streaming sets and stable under inserts, but heavier and unnecessary at this scale; explicitly out of scope. *Alternative considered:* `page`/`pageSize` params — `limit`/`offset` is a closer match to Prisma `skip`/`take` and avoids off-by-one translation.

### D2 — Sorting moves fully server-side via `sort`/`order`
`sort ∈ {date, distanceKm, durationSec, type}` (the existing sortable columns) and `order ∈ {asc, desc}`, default `date desc` (preserves current newest-first). The controller maps them to Prisma `orderBy: { [sort]: order }`. A secondary `id` tie-break is added (`orderBy: [{ [sort]: order }, { id: 'desc' }]`) so paging is **stable** when many rows share a sort value (e.g. same `type`). The table uses TanStack `manualSorting` and reports sort state up; no client-side comparator remains. *Rationale:* once only one page is in the browser, client sort would only reorder the visible page — wrong. Sorting must run where the full set lives.

### D3 — Reset to first page on filter or sort change
Any change to the filters or the sort sets `offset` back to 0, so the user never lands on an out-of-range page (e.g. page 3 of a now-1-page result). Implemented in `RunList` by resetting page state whenever filters/sort change.

### D4 — React Query key carries filters + sort + page
The query key becomes `['runs', apiFilters, sort, offset]` so each distinct view is cached independently and revisiting a prior page/sort is instant. Mutations still invalidate the `['runs']` prefix, refreshing every variant. *Note:* this means a sort/page change triggers a refetch (the accepted cost of server-side sorting); cached combos return immediately.

### D5 — Indexes on the sort/filter columns, via a migration
Add `@@index([date])`, `@@index([distanceKm])`, `@@index([durationSec])`, `@@index([type])` to the `Run` model. `date`/`distanceKm`/`type` back both the `ORDER BY` and the filter `WHERE`; `durationSec` is sort-only. Single-column indexes (not composite) — the query sorts by one column at a time and filters are independent ranges/`in`, so per-column indexes are the right granularity and keep write cost trivial at this scale. Ship via `prisma migrate dev`; `vitest.globalSetup`'s `prisma db push` applies them to `test.db` automatically. *Alternative considered:* index only `date` now — rejected since all four are first-class sort targets and the cost is negligible.

### D6 — Validation extends the existing list query schema
`limit` (coerced int, ≥1, ≤100, default 20), `offset` (coerced int, ≥0, default 0), `sort` (enum, default `date`), `order` (enum, default `desc`) are added to `listRunsQuerySchema`, validated via the same `parseBody` path; invalid → `400` with the structured `ValidationError` body. The `≤100` cap bounds a single page.

## Risks / Trade-offs

- **Breaking response shape** (`Run[]` → envelope) → update the fetcher, `RunList`, and every existing `GET /api/runs` test in the same change; grep for `fetchRuns` consumers (only `RunList`).
- **Server-side sort regresses instant client sort at small scale** (a refetch per sort toggle) → accepted for scalability; React Query caching makes repeat views instant, and indexes keep the query fast.
- **Unstable paging on tied sort values** → mitigated by the `id` tie-break in `orderBy` (D2).
- **First migration in a while** → follow the documented `prisma migrate dev` flow; verify `test.db` (via db push) and `dev.db` both gain the indexes and the suite stays green.
- **Offset drift under concurrent inserts** (a row added while paging shifts offsets) → not a concern at single-user scale; noted for the eventual cursor migration if ever needed.

## Open Questions (sub-decisions, defaults chosen)

- **Param style** — default **`limit`/`offset`** (D1). Alt: `page`/`pageSize`.
- **Page size** — default **20**, cap **100** (D6).
- **Index breadth** — default **all four sortable columns** (D5). Alt: `date` only now.
- **Controls** — default **Prev/Next + "Page X of Y"** (no page-size selector / numbered pages — out of scope).
