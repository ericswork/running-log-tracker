## Why

The run list pager only offers previous/next, so reaching a distant page (e.g. page 12 of 13) means many clicks, and the page size of 20 is larger than the table comfortably shows. There is also no recovery when the page you're on empties after deleting its last run.

## What Changes

- Reduce the run list page size from 20 to a **fixed 10 runs per page** (no page-size selector).
- Replace the bare previous/next pager with a three-section bar: the **"Page X of Y" readout** (left), **numbered page buttons** (center), and the kept **Previous/Next** controls (right).
- For large page counts, render the numbered buttons as a **windowed range with an ellipsis** (e.g. `1 2 3 4 … 13`), always including the first and last page so those buttons double as **jump-to-first / jump-to-last**; the current page is visually marked and not re-clickable.
- **Clamp the offset** when the current page empties after a delete (offset ≥ total once the list refetches) so the view falls back to the last non-empty page instead of an empty table.
- Keep the existing "Page X of Y" readout, server-side sorting, and filter bar unchanged.

This is **frontend-only** — `GET /api/runs` already accepts arbitrary `limit`/`offset` and returns `{ runs, total, limit, offset }`, so no backend or API changes.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `run-management`: the **Run list view** requirement's pagination controls change from previous/next-only to a three-section bar (readout + ellipsis-windowed numbered pages + previous/next), the page size becomes a fixed 10, and the view clamps to the last non-empty page when the current page empties after a delete.

## Impact

- **Frontend only.** `client/src/components/RunList.tsx` (owns `offset`/`sorting` and the query key; default `limit`) and `client/src/features/runs/` (the pager component + a pure page-range/windowing helper).
- New/extended frontend tests (Vitest + RTL) for the numbered pager, ellipsis windowing, and clamp-on-delete.
- No backend, API, schema, or migration changes; no new dependencies.
