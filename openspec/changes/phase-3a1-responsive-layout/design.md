## Context

After Phase 3A the app is a single column: [App.tsx](client/src/App.tsx) stacks the create `RunForm` above `RunList` inside the shell ([AppShell.tsx](client/src/components/layout/AppShell.tsx), `max-w-3xl`). `RunList` already owns the run table ([features/runs/RunsTable.tsx](client/src/features/runs/RunsTable.tsx)), an edit Dialog (RunForm prefilled), and a delete AlertDialog. `RunForm` is the shared create/edit component (create when no `initialRun`, edit otherwise) and already calls `onDone` after an edit. This change makes the composition responsive without touching the table, the API, or RunForm's field/validation logic.

## Goals / Non-Goals

**Goals:**
- Desktop (`md`+): form inline left, run list right, table column wider (~2:1); wider shell.
- Mobile (`<md`): no inline form; run list leads, with an "Add run" button above the table that opens the create form in a Dialog.
- Edit opens the prefilled form in the same Dialog at all sizes (unchanged).
- One shared `RunFormDialog` for add and edit; no duplicated form logic.
- Table stays sortable + horizontally scrollable at all sizes.

**Non-Goals:**
- No mobile card layout; no Sheet/drawer; no pagination/virtualization.
- No backend/API/schema change; the run table and `/api` calls are untouched.
- No change to RunForm's fields, validation, or date/time handling.

## Decisions

**Hide the inline form on mobile (vs. reorder it below the table).**
The desktop order is form-left / table-right, but mobile should lead with the table. Rather than reconcile those with CSS `order` utilities, the inline form is simply **`hidden md:block`** — removed on mobile, where the create form is reached through the "Add run" overlay instead. This removes the DOM-order/visual-order conflict entirely: mobile renders only the run list (table-first by construction), desktop renders both columns. Layout is a Tailwind grid, `md:grid-cols-[1fr_2fr]` (form 1fr left, table 2fr right); the shell widens (e.g. `max-w-3xl` → `max-w-5xl`).

**Single `RunFormDialog` for add and edit (vs. duplicating dialog markup).**
A new `features/runs/RunFormDialog.tsx` wraps `RunForm` in a shadcn Dialog: `{ open, onOpenChange, initialRun?, title }`. It renders `RunForm` only while open (so it remounts fresh each time, re-prefilling) and wires `onDone={() => onOpenChange(false)}`. `RunList` uses it for **edit** (replacing its inline Dialog markup); `App` uses it for the **mobile create** overlay. The desktop inline create form stays a bare `<RunForm />` (no Dialog).

**`RunForm` create also fires `onDone`.**
Today `onDone` fires only after an edit. For the create overlay to close on success, the create branch must also call `onDone?.()` (after resetting the fields). The desktop inline form passes no `onDone`, so it's unaffected — it still just resets in place. This is the only change to `RunForm`'s behavior.

**Ownership: create in `App`, edit/delete in `RunList`.**
`App` already renders the create form, so it keeps create: the desktop inline form (`hidden md:block`) plus a mobile-only "Add run" button (`md:hidden`) above the list that opens the create `RunFormDialog`. `RunList` keeps the run list, edit `RunFormDialog`, and delete AlertDialog. This preserves the current separation and keeps "Add run above the table" working on mobile.

**Testing scope.**
Responsive show/hide is CSS media-query driven and not evaluated by jsdom, so it's verified manually. The overlay *flows* are viewport-independent and testable: a test that the "Add run" trigger opens the create dialog and submits a run, plus the existing edit/delete dialog tests (now routed through `RunFormDialog`).

## Risks / Trade-offs

- **Create `RunForm` mounted twice** (desktop inline + mobile overlay, one hidden via CSS) → both hold independent state; harmless (the hidden one is `display:none`). Mitigation: the overlay form only mounts while open, so at most one create form is interactive at a time.
- **Refactoring edit into `RunFormDialog` could regress edit** → Mitigation: keep the edit dialog's behavior identical and rely on the existing RunList edit/delete tests (re-pointed at the shared component) to catch regressions.
- **Manual-only verification of the responsive breakpoint** → Mitigation: explicit browser checklist at `md` boundary (form appears/disappears, columns proportion, Add button visibility).
