## 1. API layer

- [x] 1.1 Add `updateRun(id, patch)` to [client/src/api/runs.ts](client/src/api/runs.ts) calling `PATCH /api/runs/:id` with a partial body, returning the updated run
- [x] 1.2 Add `deleteRun(id)` to [client/src/api/runs.ts](client/src/api/runs.ts) calling `DELETE /api/runs/:id`
- [x] 1.3 Ensure both surface non-2xx responses as thrown errors, consistent with the existing `createRun`/`fetchRuns` helpers

## 2. RunForm edit mode

- [x] 2.1 Add an optional `initialRun` prop to [client/src/components/RunForm.tsx](client/src/components/RunForm.tsx); with no `initialRun` the create path stays unchanged
- [x] 2.2 When `initialRun` is provided, prefill all fields and split its stored ISO date-time back into separate date and time-of-day inputs (inverse of the existing combine logic)
- [x] 2.3 Support an edit submit path that calls `updateRun` via a `useMutation` whose `onSuccess` invalidates `['runs']`; keep run-type restriction intact
- [x] 2.4 Add an `onCancel`/`onDone` callback and a Cancel control so an in-progress edit can be dismissed without saving

## 3. RunList edit & delete controls

- [x] 3.1 Add edit and delete controls to each run row in [client/src/components/RunList.tsx](client/src/components/RunList.tsx)
- [x] 3.2 Track which run (if any) is being edited; activating edit renders RunForm prefilled for that run (inline), and only one run is editable at a time
- [x] 3.3 Wire the delete control to a confirmation step, then call `deleteRun` via a `useMutation` whose `onSuccess` invalidates `['runs']`; declining the confirmation makes no API call
- [x] 3.4 On successful edit, close the edit form so the row returns to read-only display of the saved values

## 4. Verify

- [x] 4.1 Manually verify in the running dev app: edit a run and confirm the list shows updated values without reload, and that start time-of-day is preserved when date/time are left unchanged — _data layer verified via live API round-trip (PATCH preserves 14:37 time-of-day on partial update, type unchanged); in-browser click-through confirmed by user_
- [x] 4.2 Manually verify delete: confirming removes the run from the list; declining leaves it untouched — _API verified (DELETE→204, GET→404); confirm-dialog UX confirmed by user_
- [x] 4.3 Confirm no backend changes were needed and the server test suite still passes (`npm --prefix server test`) — 42/42 pass; `git status` shows no tracked source changes
