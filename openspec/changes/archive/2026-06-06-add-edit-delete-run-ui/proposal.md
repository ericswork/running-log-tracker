## Why

The run-management API has supported updating and deleting runs since Phase 1 (`PATCH`/`DELETE /api/runs/:id`, both tested), but the frontend run list only renders runs — there is no way to correct a mistyped entry or remove a run without hitting the API directly. This closes that gap before Phase 3 so users can fully manage their log from the UI.

## What Changes

- Add an **edit** action to each run in the run list. Activating it opens an editable form prefilled with that run's values (type, distance, duration, start date/time, notes); submitting saves via `PATCH /api/runs/:id`.
- Add a **delete** action to each run in the run list, guarded by a confirmation step; confirming removes the run via `DELETE /api/runs/:id`.
- Both actions use React Query mutations that invalidate the `['runs']` query so the list reflects changes without a full page reload.
- The existing run-entry form is reused/adapted to serve both create and edit modes (prefilled values, distinct submit behavior).

Out of scope (deferred to Phase 3): the sortable data-table overhaul, any new or changed backend endpoints.

## Capabilities

### New Capabilities
<!-- None — this extends existing frontend behavior of run-management. -->

### Modified Capabilities
- `run-management`: extend the frontend requirements to cover editing an existing run and deleting a run (with confirmation) directly from the run list, with the list updating without a full page reload.

## Impact

- **Frontend only.** `client/src/components/RunList.tsx` (add edit/delete controls + delete confirmation), `client/src/components/RunForm.tsx` (support an edit/prefill mode), `client/src/api/runs.ts` (add `updateRun` and `deleteRun` calls + React Query mutations invalidating `['runs']`).
- No backend changes: `PATCH`/`DELETE /api/runs/:id` already exist and are covered by the server test suite.
- No new dependencies; no database or schema changes.
