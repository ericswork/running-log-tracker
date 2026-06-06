## 1. Shared RunFormDialog + RunForm tweak

- [x] 1.1 Add `RunForm` create-success `onDone` call (after resetting fields) so an overlay closes on create; desktop inline form passes no `onDone` and is unaffected
- [x] 1.2 Create `features/runs/RunFormDialog.tsx` — wraps `RunForm` in a shadcn `Dialog` with props `{ open, onOpenChange, initialRun?, title }`; renders `RunForm` only while open (remounts fresh, keyed by `initialRun?.id ?? 'new'`) and wires `onDone` to close
- [x] 1.3 Refactor `RunList` edit to use `RunFormDialog` (replace its inline Dialog markup); keep edit behavior identical (delete AlertDialog unchanged) — existing edit/delete tests still pass

## 2. Responsive two-column layout

- [ ] 2.1 Widen the app shell max-width so two columns fit (e.g. `max-w-3xl` → `max-w-5xl`)
- [ ] 2.2 In `App.tsx`, lay out the main content as a responsive grid: at `md`+ two columns `md:grid-cols-[1fr_2fr]` (form left, run list right); single column below `md`
- [ ] 2.3 Make the inline create `RunForm` desktop-only (`hidden md:block`) so mobile shows only the run list

## 3. Mobile "Add run" overlay

- [ ] 3.1 Add a mobile-only "Add run" button (`md:hidden`) above the run list that opens a create `RunFormDialog` (no `initialRun`)
- [ ] 3.2 Verify create from the overlay invalidates `['runs']` and closes the overlay on success; the inline desktop create path still resets in place

## 4. Tests + verify

- [ ] 4.1 Test: the "Add run" trigger opens the create dialog and submitting calls `createRun` with the expected payload
- [ ] 4.2 Confirm the existing edit/delete dialog tests still pass through `RunFormDialog` (edit opens prefilled + saves; delete confirm/decline)
- [ ] 4.3 Run the full client suite (`npm --prefix client test`) and build (`npm --prefix client run build`); backend suite untouched (`npm --prefix server test` 42/42)
- [ ] 4.4 Manually verify in the browser at the `md` boundary: desktop shows form-left/list-right (table wider); mobile hides the inline form, shows "Add run" above the table, and the table still sorts and scrolls; edit/delete overlays work in both
