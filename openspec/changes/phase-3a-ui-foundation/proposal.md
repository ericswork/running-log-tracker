## Why

The app currently renders as a bare, unstyled `App.tsx` with the run list as a plain `<ul>` and a `window.confirm` for deletes — a deliberate Phase 1/2 stopgap. Phase 3's dashboard and charts need a real layout to live in, so before building them we establish the UI foundation: a proper app shell, a sortable run table, styled components via shadcn/ui, theming, and the project's first frontend test harness. This is Phase 3A; the dashboard/analytics ride on top of it in Phase 3B.

## What Changes

- Install and configure **shadcn/ui** and its **Tailwind CSS** dependency in the Vite + React 19 client (currently in the stack but not installed).
- Replace the bare `App.tsx` with an **app shell + layout** (header + main content area) and re-home the existing `RunForm` and run list into it **without changing their behavior**.
- Convert the run list from a `<ul>` into a **sortable data table** (sortable by date, distance, duration, run type).
- **Relocate** the existing per-run edit and delete actions into the table, and **replace the native `window.confirm` delete with a styled shadcn confirmation dialog**.
- Add **light/dark theming** with a user-facing toggle (persisted across reloads).
- Stand up the project's first **frontend test harness** — Vitest + React Testing Library + jsdom, a `test` script in `client/package.json`, and a React Query test wrapper — and add component tests for table sorting and the edit/delete flows.

## Capabilities

### New Capabilities
- `app-shell`: the application layout/shell (header, main content region) and light/dark theming with a persisted user toggle.
- `frontend-testing`: a frontend automated-test harness (Vitest + React Testing Library) and component-test coverage for run-management UI behaviors.

### Modified Capabilities
- `run-management`: the run list view becomes a **sortable data table**; per-run **edit/delete actions move into the table**; the **delete confirmation upgrades** from a native browser dialog to a styled confirmation dialog. Existing create/edit/list behavior (RunForm, newest-first default, time-of-day preservation) is preserved.

## Impact

- **Frontend only.** New dev/runtime deps: `tailwindcss` (+ PostCSS/config), shadcn/ui components, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`. New `test` script in `client/package.json`.
- Affected files: `client/src/App.tsx` (app shell), `client/src/components/RunList.tsx` (→ data table), `client/src/components/RunForm.tsx` (re-homed; behavior unchanged), new theming + layout + UI primitive components, new test setup + test files, Vite/Tailwind/Vitest config.
- **No backend, schema, or API changes.** `GET/POST/PATCH/DELETE /api/runs` are untouched; the client keeps relative `/api` paths via the Vite proxy. Backend suite (42 tests) should remain green and unmodified.
- Out of scope: analytics/stats endpoints and charts (Phase 3B); search & filtering (Phase 4).
