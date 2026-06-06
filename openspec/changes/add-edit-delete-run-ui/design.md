## Context

The run list ([client/src/components/RunList.tsx](client/src/components/RunList.tsx)) currently renders each run read-only. The create form ([client/src/components/RunForm.tsx](client/src/components/RunForm.tsx)) posts new runs via a React Query mutation that invalidates `['runs']`. The API already exposes `PATCH /api/runs/:id` and `DELETE /api/runs/:id` (covered by the server suite), so this change is frontend-only: wire up edit and delete from the list. RunForm submits a combined ISO date-time built from separate date + time-of-day inputs, and run type is restricted to the allowed set — the edit path must preserve both behaviors.

## Goals / Non-Goals

**Goals:**
- Each run in the list exposes edit and delete controls.
- Editing opens a form prefilled with the run's current values and saves via `PATCH`.
- Deleting requires explicit confirmation, then removes via `DELETE`.
- The list reflects edits and deletions without a full page reload (React Query invalidation of `['runs']`).
- Reuse the existing RunForm rather than duplicating field/validation logic.

**Non-Goals:**
- No sortable data-table or layout overhaul (Phase 3).
- No backend/API/schema changes.
- No optimistic UI, undo, or bulk actions.
- No new dependencies.
- No automated frontend tests in this change (see Decisions).

## Decisions

**Reuse RunForm for both create and edit (vs. a separate EditRunForm).**
RunForm already owns the field set, the date+time→ISO combination, and run-type restriction. Duplicating that for edit would risk drift. Decision: parameterize RunForm with an optional `initialRun` (prefill) and an `onSubmitMode` so it can either create (`POST`) or update (`PATCH`). When editing, it splits the stored ISO date-time back into separate date and time-of-day inputs to match the create UX. Alternative considered — a thin separate edit component — rejected to keep a single source of truth for run fields.

**Inline edit toggle per run (vs. modal/route).**
Editing toggles the selected run's row into edit mode (renders RunForm in place / above the list with that run loaded). Keeps the change small and avoids introducing a router or modal system; a modal can come with the Phase 3 UI overhaul. Only one run is editable at a time; opening edit on another run (or cancelling) closes the previous one.

**Delete confirmation via a simple guard (vs. custom dialog component).**
Use a lightweight confirmation step before issuing `DELETE` (e.g. a native `window.confirm`, or a two-step "Delete → Confirm" inline control). This satisfies the "guard against accidental deletion" requirement without building a dialog component that Phase 3's shadcn/ui adoption would replace anyway.

**Mutations live alongside the existing API layer.**
Add `updateRun(id, patch)` and `deleteRun(id)` to [client/src/api/runs.ts](client/src/api/runs.ts) mirroring the existing `createRun`/`fetchRuns`. Edit and delete each use a `useMutation` whose `onSuccess` invalidates `['runs']`, consistent with the create flow.

> **Apply-time discovery (Group 1):** `updateRun`, `deleteRun`, and `UpdateRunPayload` already existed in [client/src/api/runs.ts](client/src/api/runs.ts) — written in an earlier phase but never wired into the UI. They match this design as-is (`updateRun` reuses the shared `handle()` thrower; `deleteRun` checks `res.ok` directly since `DELETE` returns 204). No code changes needed for Group 1; the remaining work is purely the RunForm/RunList wiring in Groups 2–3.

**Frontend tests deferred (manual verification only this change).**
The client has no test harness today (no Vitest/React Testing Library/jsdom — all 42 existing tests are backend). Standing one up is harness work distinct from this feature, and follows the project's precedent of adding test infrastructure as its own change (backend tests landed via `add-run-api-tests`, after the CRUD). Decision (user-confirmed): verify edit/delete manually here (Group 4) and revisit frontend testing later, likely bundled with the Phase 3 UI overhaul that rebuilds RunForm/RunList anyway. Trade-off: edit/delete ship without regression coverage in the interim — acceptable for a single-user practice app.

## Risks / Trade-offs

- **ISO split/recombine round-trip** → A stored date-time must be split into date + time-of-day for editing and recombined on submit without shifting the time. Mitigation: reuse the exact combine logic the create form already uses, and derive the inverse from the same representation; manually verify time-of-day is preserved after an edit (aligns with the canonical "preserve time of day" rule).
- **`window.confirm` is unstyled / blocks the thread** → Acceptable for a single-user practice app and explicitly temporary; Phase 3's UI overhaul replaces it. Noted so it isn't mistaken for the final UX.
- **Edit form prefill drift if RunForm props grow** → Mitigation: keep the create call path unchanged (no `initialRun` ⇒ existing behavior) so the create flow is a strict subset and existing form behavior is untouched.
