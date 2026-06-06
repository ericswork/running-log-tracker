## Why

Phase 3A established the app shell, themed UI, sortable data table, and dialogs — but the layout is a single column: the run-entry form sits stacked above the run list at every width. On a wide screen that wastes horizontal space, and on a phone the always-visible form pushes the runs far down the page. This change makes the layout responsive — two columns on desktop, a focused single column with an on-demand form on mobile — so the app is comfortable on both, and so Phase 3B's dashboard has a real layout to slot into.

## What Changes

- **Desktop (`md`+):** the main content region becomes two columns — the run-entry **form inline on the left**, the **run list on the right** — with the table column wider than the form (~2:1). The shell's max-width widens to fit two columns.
- **Mobile (`<md`):** the inline form is **hidden**. The content leads with the run list, and an **"Add run" button above the table** opens the create form in a **Dialog** overlay. Submitting creates the run and closes the overlay.
- **Edit** continues to open the prefilled form in the **same Dialog** at every viewport size (unchanged behavior from 3A); saving closes it.
- The create and edit forms are unified behind a single **`RunFormDialog`** (the existing `RunForm` inside a Dialog), so no form logic is duplicated. `RunForm` is adjusted so a successful **create** also fires `onDone` (closing the overlay); the desktop inline create form passes no `onDone` and is unaffected.
- The run list **stays the single sortable data table** at all sizes (no card layout); on narrow screens it scrolls horizontally and **sorting is preserved everywhere**.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `app-shell`: the main content region becomes a responsive two-column layout — form left / table right at `md`+, and a single column below `md` that shows the run list (with an "Add run" trigger above it) and no inline form.
- `run-management`: the run-entry form gains a responsive presentation — inline on desktop, opened via an "Add run" control into a Dialog overlay on small screens — and a successful create now closes its overlay. The run list itself is unchanged (the existing sortable, horizontally-scrollable table serves all sizes).

## Impact

- **Frontend only.** Affected: [App.tsx](client/src/App.tsx) / [AppShell.tsx](client/src/components/layout/AppShell.tsx) (responsive two-column composition + wider max-width), [RunForm.tsx](client/src/components/RunForm.tsx) (create also fires `onDone`), [RunList.tsx](client/src/components/RunList.tsx) (mobile "Add run" trigger + create overlay), and a new `RunFormDialog` under `features/runs/` shared by add and edit.
- **No backend, API, or schema changes**; relative `/api` paths and the run list's data table are untouched. Backend suite stays at 42/42.
- New tests on the existing Vitest + RTL harness for the overlay flows (Add-run opens the create form and submits; Edit opens prefilled). The responsive show/hide is CSS/media-query driven and verified manually in the browser.
- Out of scope: analytics/charts (Phase 3B), search/filtering (Phase 4), a mobile card layout, pagination/virtualization, a Sheet/drawer variant.
