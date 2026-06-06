## Context

The client is Vite + React 19 + TS with TanStack React Query. UI today is unstyled: [App.tsx](client/src/App.tsx) is a bare `<main>`, [RunList.tsx](client/src/components/RunList.tsx) renders a `<ul>` with inline edit (RunForm swapped into the row) and a `window.confirm` delete, and [RunForm.tsx](client/src/components/RunForm.tsx) owns create+edit with a date+time-of-day split. shadcn/ui is named in the stack but not installed, and there is no Tailwind setup and no frontend test harness. This change builds the UI foundation Phase 3B's dashboard will sit in — without touching the backend or the API contract.

## Goals / Non-Goals

**Goals:**
- shadcn/ui + Tailwind installed and working in the Vite client.
- An app shell (header + main) with the run entry/list re-homed into it.
- Run list rendered as a client-sortable data table (date, distance, duration, type).
- Edit/delete relocated into the table; delete confirmation is a styled dialog, not `window.confirm`.
- Light/dark theme with a persisted toggle.
- A frontend test harness (Vitest + RTL + jsdom) with first component tests for sorting and edit/delete.

**Non-Goals:**
- No analytics endpoints or charts (Phase 3B).
- No backend, schema, or API changes; the 42-test backend suite stays green and untouched.
- No search/filtering (Phase 4), no pagination, no column show/hide, no virtualization.
- No change to RunForm's field set, validation, or date/time-of-day handling — it is restyled and re-homed only.

## Decisions

**Tailwind v4 via `@tailwindcss/vite` (vs Tailwind v3 + PostCSS).**
shadcn/ui supports Tailwind v4, and v4's first-party Vite plugin is the lightest setup on Vite 8 (no `tailwind.config.js`/PostCSS chain). Decision: Tailwind v4 + `@tailwindcss/vite`, CSS-variable theming as shadcn generates it. Alternative (v3 + postcss) rejected as more config for no benefit on a greenfield client.

**Data table = TanStack Table + shadcn table primitives (vs hand-rolled `<table>` sorting).**
shadcn's data-table pattern wraps `@tanstack/react-table` (already same-family as React Query). It gives `getSortedRowModel` and a column model for free, so sorting by date/distance/duration/type is declarative. Default sort stays **date descending** to preserve today's newest-first behavior. Alternative — manual `useState` sort + `<table>` — rejected; it would reinvent what TanStack Table does and be harder to test.

**Edit opens RunForm in a shadcn Dialog (vs inline-in-row form).**
Today edit swaps RunForm into the list item. Inside a table row that's awkward (column layout, colspan). Decision: the row's Edit action opens RunForm inside a shadcn `Dialog`; Save/Cancel close it via the existing `onDone` callback. RunForm is reused unchanged — only its container moves from an inline `<li>` to a `Dialog`. This is a deliberate UX evolution from Phase 2's inline edit and should be called out at archive time. Delete uses a shadcn `AlertDialog` for confirmation (replacing `window.confirm`); declining still makes no API call.

**Theming via a ThemeProvider + `class` strategy, persisted in localStorage.**
A small `ThemeProvider` toggles a `dark` class on `<html>` and persists the choice (default: follow system). This is the standard shadcn theming approach and keeps charts (3B) themable later. Toggle lives in the app-shell header.

**Component structure: lightweight feature-based folders (vs Atomic Design).**
Full Atomic Design (atoms/molecules/organisms/templates/pages) is rejected as overkill at this app's size and redundant with shadcn — shadcn's generated `components/ui/` already serves as the primitives layer. Instead: `components/ui/` (shadcn primitives), `components/layout/` (AppShell, Header, ThemeToggle), `features/runs/` (RunForm, RunsTable, columns, dialogs), `App.tsx` as composition root. This scales into Phase 3B as `features/dashboard/` beside `features/runs/`.

**Styling: Tailwind + shadcn only; no CSS-in-JS.**
Runtime CSS-in-JS (styled-components/Emotion) is rejected — it duplicates and competes with the Tailwind/shadcn system already chosen, carries runtime cost, and the ecosystem favors zero-runtime styling. One-off dynamic styles use inline `style`/CSS variables; theming rides shadcn's CSS variables.

**Frontend test harness: Vitest + jsdom + RTL, separate config from the server.**
The client gets its own `vitest.config.ts` (environment `jsdom`), a setup file registering `@testing-library/jest-dom` and mocking `matchMedia` (jsdom lacks it; theming/`prefers-color-scheme` needs it), and a `renderWithClient` helper that wraps components in a fresh `QueryClientProvider`. A `test` script is added to `client/package.json`. First tests cover: table sorts by a chosen column, and the edit/delete flows (dialog opens, confirm/decline behavior). Network is mocked at the `api/runs` module boundary so tests stay unit-level (no MSW for now).

## Risks / Trade-offs

- **shadcn/Tailwind v4 setup friction on Vite 8 / React 19** → Mitigation: follow shadcn's official Vite guide, pin known-good versions, verify `npm run build` + `npm run dev` after install before building components on top.
- **Data-table rewrite is the riskiest UI change** (RunList is substantially rewritten) → Mitigation: land it behind the new test harness — write the sorting/edit/delete tests as part of this change so the rewrite is covered, not eyeballed.
- **Edit UX changes from inline to dialog** → Acceptable and arguably better; flagged as an intentional deviation from the Phase 2 `add-edit-delete-run-ui` spec wording (which said "inline"), to be reconciled in the run-management delta.
- **jsdom gaps** (`matchMedia`, ResizeObserver) can break theming/table tests → Mitigation: mock them in the Vitest setup file.
- **Restyling RunForm risks regressing its behavior** → Mitigation: Non-Goal forbids logic changes; tests assert create/edit still submit the same payloads.
