## 1. Tooling: Tailwind + shadcn/ui

- [x] 1.1 Install and configure Tailwind v4 via `@tailwindcss/vite` in the client; add the Tailwind import to the global stylesheet
- [x] 1.2 Initialize shadcn/ui (components config, path aliases, base CSS variables/theme tokens); verify `npm --prefix client run build` and `npm --prefix client run dev` still succeed
- [x] 1.3 Add the shadcn primitives this change needs (e.g. button, table, dialog, alert-dialog, dropdown/select for the theme toggle)

## 2. Frontend test harness

- [ ] 2.1 Add Vitest + React Testing Library + jsdom + `@testing-library/jest-dom` as client dev deps and a `test` script in `client/package.json`
- [ ] 2.2 Add `client/vitest.config.ts` (jsdom environment) and a setup file registering jest-dom matchers and mocking `matchMedia` (and `ResizeObserver` if needed)
- [ ] 2.3 Add a `renderWithClient` test helper that wraps components in a fresh `QueryClientProvider`
- [ ] 2.4 Add a smoke test proving the harness runs green (`npm --prefix client test`)

## 3. App shell + theming

- [ ] 3.1 Add a `ThemeProvider` that toggles a `dark` class on `<html>`, persists the choice in localStorage, and defaults to system preference
- [ ] 3.2 Replace the bare `App.tsx` with an app shell (header + main content region); place the theme toggle in the header
- [ ] 3.3 Re-home `RunForm` and the run list into the main content region (behavior unchanged)
- [ ] 3.4 Add tests: theme toggle switches appearance, and the chosen theme persists across a reload

## 4. Run list as a sortable data table

- [ ] 4.1 Add `@tanstack/react-table` and build a shadcn data table for runs with columns date, distance, duration, type (formatting unchanged — km + h:mm:ss, locale date-time)
- [ ] 4.2 Enable client-side sorting on date, distance, duration, and type; default sort = date descending (preserves newest-first)
- [ ] 4.3 Add an actions column with per-row Edit and Delete controls
- [ ] 4.4 Add a test asserting that sorting by a column reorders the displayed runs

## 5. Edit + delete in the table

- [ ] 5.1 Wire the row Edit control to open `RunForm` (with `initialRun`) inside a shadcn `Dialog`; Save/Cancel close it via the existing `onDone` callback
- [ ] 5.2 Replace the `window.confirm` delete with a shadcn `AlertDialog`; confirming calls the `deleteRun` mutation (invalidates `['runs']`), declining makes no API call
- [ ] 5.3 Add tests: edit dialog opens prefilled and saving submits an update; delete confirm removes the run and decline makes no delete request

## 6. Verify

- [ ] 6.1 Run the full client test suite (`npm --prefix client test`) — all green
- [ ] 6.2 Confirm `npm --prefix client run build` typechecks/builds and the backend suite is untouched (`npm --prefix server test` still 42/42)
- [ ] 6.3 Manually verify in the dev app: table sorts by each column, edit dialog and delete confirmation work, theme toggle persists, and create/edit still submit unchanged payloads
