## Context

The run list (`client/src/components/RunList.tsx`) is server-paginated since `table-pagination` (v0.6.0): `RunList` owns `offset` and `sorting`, keys the React Query cache on `['runs', apiFilters, sort, order, offset]`, and renders an inline previous/next pager plus a "Page X of Y" readout. `PAGE_SIZE` is a module constant (currently 20). The server already accepts arbitrary `limit`/`offset` (1–100 cap) and returns `{ runs, total, limit, offset }`, so everything here is client-side.

Two pain points: previous/next-only navigation makes distant pages slow to reach, and deleting the last run on the last page leaves the view stranded on an empty page (the query refetches at the same now-out-of-range `offset`).

## Goals / Non-Goals

**Goals:**
- Fixed page size of 10.
- A richer pager: a three-section bar with the "Page X of Y" readout, ellipsis-windowed numbered page buttons (the always-shown first/last buttons doubling as jump-to-first/last), and kept previous/next.
- Clamp the offset back to the last non-empty page when the current page empties after a delete.
- Keep the change frontend-only, isolate the pager into a testable component + a pure page-range helper, and preserve the existing single-fetch behavior (no double-fetch regressions).

**Non-Goals:**
- No page-size selector — page size is fixed at 10.
- No backend, API, schema, or query-param changes.
- No change to server-side sorting, the filter bar, or the reset-to-first-page-on-filter/sort behavior.

## Decisions

### 1. Page size fixed at 10
Change the `PAGE_SIZE` constant from 20 to 10. It already threads through the query `limit`, `pageCount`, `currentPage`, and the bounds — no other wiring needed. No selector, so it stays a constant rather than state.

### 2. Extract the pager into `features/runs/Pager.tsx`
Today the pager is inline JSX in `RunList`. Numbered buttons + windowing add enough markup to warrant its own component. `Pager` is **presentational**: it receives `currentPage`, `pageCount`, and an `onPageChange(page)` callback, and renders a single three-section bar:

```
Page 1 of 13          [1][2][3][4][…][13]          [Previous][Next]
```

- **Left:** the "Page X of Y" readout.
- **Center:** the windowed numbered buttons (via `pageRange`), with the ellipsis as a non-interactive marker.
- **Right:** Previous / Next (disabled at the respective bounds).

A `justify-between` flex row places the three sections left / center / right. There are **no dedicated jump-to-first/last buttons** — because the window always includes the first and last page, the `[1]` and `[N]` numbered buttons already serve as jump-to-first / jump-to-last. `RunList` keeps owning `offset` (the source of truth) and converts `page → offset` (`offset = (page - 1) * PAGE_SIZE`) in the `onPageChange` handler, mirroring how it already derives `currentPage`/`pageCount`. This keeps offset arithmetic in one place and makes the visual control unit-testable in isolation.

_Alternative considered:_ keep it inline. Rejected — the windowing logic and the larger control would bloat `RunList` and be harder to test directly.

_Alternative considered:_ separate jump-to-first/last controls in addition to the numbered buttons. Rejected as redundant — `[1]` and `[N]` are always rendered and do the same thing.

### 3. Ellipsis windowing via a pure helper `pageRange(currentPage, pageCount)`
A framework-free function returns the sequence of page tokens to render — page numbers interleaved with `'ellipsis'` markers, e.g. `[1, 2, 3, 4, 5, 'ellipsis', 13]`. It always includes the first and last page, a window of neighbors around the current page, and collapses gaps to a single ellipsis. Co-locate it (e.g. `features/runs/pageRange.ts`) with its own unit tests, the same pattern as `filters.ts`. Keeping it pure means the windowing edge cases (near the start, near the end, few pages, single page) are tested without rendering.

- **Window size:** show the first page, the last page, and the current page ±1 (so up to `1 … (c-1) c (c+1) … N`). This yields the `1 2 3 4 5 … 13` shape when near the start. To avoid a lone ellipsis hiding exactly one page (e.g. `1 … 3 …`), when a gap spans only one page render that page number instead of an ellipsis.
- The current page renders as a marked, non-interactive button (visually active, not clickable); other numbers are clickable.

### 4. Clamp the offset on delete in the mutation `onSuccess`, not a `useEffect`
When a delete succeeds we know the pre-delete `total` and the current `offset`, so we can compute the corrected offset directly instead of waiting for the empty page to come back. In `deleteMutation.onSuccess`, after invalidating `['runs']`, compute `newTotal = total - 1`, `maxOffset = Math.max(0, (Math.ceil(newTotal / PAGE_SIZE) - 1) * PAGE_SIZE)`, and if `offset > maxOffset` call `setOffset(maxOffset)`. Because the offset is part of the query key, adjusting it in the same success handler as the invalidation means the refetch lands on the correct page in a **single** fetch.

_Alternative considered:_ a `useEffect` watching `offset >= total && total > 0` to clamp. Rejected — it fetches the empty page first and then refetches after clamping (a double-fetch), the exact failure mode `table-pagination` already hit with effect-based offset resets.

## Risks / Trade-offs

- **Many pages crowd the control** → the ellipsis window caps the visible buttons regardless of `pageCount`, so the control width stays bounded.
- **Off-by-one in page↔offset conversion** → keep the single conversion (`offset = (page-1)*PAGE_SIZE`) in `RunList` and reuse the existing `currentPage`/`pageCount` derivations; cover boundaries (first/last page, single page) in tests.
- **Clamp using stale `total`** → the pre-delete `total` is correct at success time and only ever decreases by one per delete, so `newTotal = total - 1` is exact; the general `maxOffset` clamp also handles the case where the offset is already past the end.
- **Page size 10 reshapes existing tests** → tests that assume 20-per-page totals/labels must be updated in this change.
