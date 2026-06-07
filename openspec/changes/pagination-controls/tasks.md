## 1. Page-range helper (pure)

- [x] 1.1 Add `features/runs/pageRange.ts` exporting `pageRange(currentPage, pageCount)` that returns an ordered list of page-number tokens and `'ellipsis'` markers, always including the first and last page and a window of the current page ±1, collapsing multi-page gaps to a single ellipsis and rendering a lone hidden page as its number (no single-page ellipsis)
- [x] 1.2 Add `features/runs/pageRange.test.ts` covering: few pages (no ellipsis), near the start (`1 2 3 4 5 … 13`), near the end, middle (ellipsis on both sides), single page, and the no-single-page-ellipsis edge case

## 2. Pager component

- [x] 2.1 Add presentational `features/runs/Pager.tsx` taking `currentPage`, `pageCount`, and `onPageChange(page)`; render a `justify-between` three-section bar — left "Page X of Y" readout, center windowed numbered buttons (via `pageRange`) with the ellipsis as a non-interactive marker, right Previous/Next — using shadcn `Button`s
- [x] 2.2 Disable Previous on the first page and Next on the last page; render the current page button as marked and non-interactive; rely on the always-shown first/last numbered buttons for jump-to-first/last (no dedicated controls)
- [x] 2.3 Add `features/runs/Pager.test.tsx` (Vitest + RTL): renders the readout + expected buttons for a multi-page count, calls `onPageChange` with the right page for a numbered (incl. first/last) and prev/next click, disables Previous/Next at the bounds, and shows the ellipsis for large counts

## 3. RunList wiring

- [ ] 3.1 Change `PAGE_SIZE` from 20 to 10 in `client/src/components/RunList.tsx`
- [ ] 3.2 Replace the inline previous/next pager JSX (including its "Page X of Y" readout, now owned by `Pager`) with `<Pager currentPage={currentPage} pageCount={pageCount} onPageChange={…} />`, converting page → offset as `(page - 1) * PAGE_SIZE` in the handler; keep the `total > PAGE_SIZE` visibility guard
- [ ] 3.3 In `deleteMutation.onSuccess`, after invalidating `['runs']`, clamp the offset to the new last page: `maxOffset = Math.max(0, (Math.ceil((total - 1) / PAGE_SIZE) - 1) * PAGE_SIZE)`, and `setOffset(maxOffset)` when `offset > maxOffset` (single refetch, no `useEffect`)

## 4. Tests & verification

- [ ] 4.1 Update existing `RunList`/`RunsTable` tests that assume a page size of 20 (totals, page counts, labels) to the new size of 10
- [ ] 4.2 Add a `RunList` test for clamp-on-delete: deleting the only run on the last page (not the first page) moves the view to the previous page
- [ ] 4.3 Run `npm --prefix client test` (all frontend tests green) and `tsc --noEmit -p tsconfig.app.json` (no type errors)
- [ ] 4.4 Manually verify in the running app: page size 10, numbered/first/last/prev/next navigation, ellipsis windowing on a large set, and clamp-on-delete (Recharts/responsive caveats aside)
