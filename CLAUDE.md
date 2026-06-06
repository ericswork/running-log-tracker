# CLAUDE.md

Guidance for working in this repository.

## Project

Full-stack running log: log runs manually or by uploading a `.gpx` file (auto-fills the entry), browse history, with a training dashboard planned. Personal/practice project — single-user, no auth. Developed **spec-driven with OpenSpec**.

Monorepo, two independently-run apps + shared specs:
- `client/` — Vite + React 19 + TypeScript, TanStack React Query; **Tailwind v4 + shadcn/ui** (UI), **TanStack Table** (run table); tests via **Vitest + React Testing Library + jsdom**
- `server/` — Express 5 + TypeScript (run via **tsx**), Prisma 7 + SQLite (better-sqlite3 driver adapter), Zod; Multer + `@we-gold/gpxjs` for GPX
- `openspec/` — living specs (`specs/`) + archived changes (`changes/archive/`)

## Status & continuity

> This file doubles as a session-handoff. Read this section first to resume mid-project.

**Done (each shipped as an archived OpenSpec change in `openspec/changes/archive/`):**
- **Core run CRUD** (`add-run-crud`) — `/api/runs` create/list/get/update/delete + manual-entry form + newest-first list. → tag `v0.1.0`
- **Backend test suite** (`add-run-api-tests`) — Vitest + Supertest, isolated `test.db`. → tag `v0.1.1`
- **GPX import** (`add-gpx-import`) — parse-only `POST /api/runs/import` + upload-to-prefill UI. → tag `v0.2.0`
- **Edit/delete run UI** (`add-edit-delete-run-ui`) — frontend-only: per-run edit/delete controls in the list; `RunForm` reused for create+edit (prefill + ISO date-time split); delete via `window.confirm`. API (`PATCH`/`DELETE`) was already in place. → tag `v0.2.1`
- **UI foundation** (`phase-3a-ui-foundation`) — adopted **shadcn/ui + Tailwind v4**; app shell + header + **light/dark theming** (persisted); run list → **sortable data table** (TanStack Table); edit/delete moved into shadcn **Dialog**/**AlertDialog** (replacing `window.confirm`); first **frontend test harness** (Vitest + RTL + jsdom). → tag `v0.3.0`
- **Responsive layout** (`phase-3a1-responsive-layout`) — two-column desktop (form left / table right, table wider) and single-column mobile with an **"Add run" overlay**; shared **`RunFormDialog`** powers add + edit. → tag `v0.3.0`

Current totals: **42 backend tests** + **15 frontend tests** passing; living specs `run-management` (13 reqs), `gpx-import` (5), `app-shell` (2), `frontend-testing` (2). Milestones tagged via GitHub Desktop (latest **v0.3.0**).

**Next up:** Phase 3B (→ `v0.3.1`).

**Phase 3B — Dashboard & analytics (the UI overhaul shipped in 3A/3A.1; this is the data half):**
1. Aggregated/analytics endpoints (weekly mileage, pace trend, run-type breakdown) — separate from `GET /api/runs`; Zod query-param validation + tests (test-as-you-go).
2. React charts consuming them — **chart lib not yet chosen** (Recharts or Nivo; decide at proposal time).
3. Dashboard view rendered inside the existing app shell/layout.
- Watch-out: decide **timezone handling** for time-based aggregations (start times stored as submitted/UTC).

**Phase 4 (later):** search & filtering — flexible query params on `GET /api/runs` (date range, distance, run type) + filter UI.

## Commands

```bash
npm run dev                      # root: runs server (:4000) + client (:5173) together
npm --prefix server test         # backend test suite (Vitest + Supertest)
npm --prefix server run test:watch
npm --prefix server run build    # tsc -> dist/
npm --prefix client test         # frontend tests (Vitest + RTL); test:watch also available
npm --prefix client run build    # tsc -b && vite build
npm --prefix server exec prisma migrate dev   # apply schema / create dev.db
```

Dev server has HMR (frontend) and `tsx watch` (backend) — source edits are live; restart only for config/dep/`.env` changes. Vite proxies `/api` → `:4000`.

## Architecture & key decisions

- **Prisma 7 requires a driver adapter** (no built-in engine). `server/src/prisma.ts` is a singleton built with `PrismaBetterSqlite3({ url: DATABASE_URL })`; loads `dotenv`.
- **tsx + nodenext**: `server/tsconfig.json` uses `module`/`moduleResolution: "nodenext"` — required because `@types/node` v25 + TS 6 break with legacy `"node"` resolution. Do not switch back to ts-node.
- **Run type is a validated string, not a Prisma enum** (SQLite has no enum). Single source of truth: `RUN_TYPES` in `server/src/runs/constants.ts` = Easy, Recovery, Tempo, Interval, Long Run, Race; default Easy.
- **Canonical units**: `distanceKm` (km, float), `durationSec` (seconds, int), `date` (DateTime, **preserves time of day** — never normalize to midnight). Formatting/conversion is frontend-only.
- **Validation via Zod** (`server/src/runs/schemas.ts`): `createRunSchema` (type defaults to Easy) and `updateRunSchema = createRunSchema.partial()` — **update is PATCH/partial**. Use `parseBody()` from `server/src/lib/validation.ts`; it returns `{ok,data}` or `{ok:false,status:400,body}` with a structured `ValidationError` shape.
- **Layering**: routes → controller → Prisma. Not-found is an explicit `findUnique` check → 404.
- **App split for testability**: `server/src/app.ts` exports the configured Express `app` (no `listen`); `server/src/index.ts` imports it and calls `listen()`. Tests import `app` via Supertest.
- **GPX import is parse-only**: `POST /api/runs/import` (Multer **memory storage**, 5 MB cap) returns `{distanceKm, durationSec?, date?}` and **persists nothing** — the run is created via `POST /api/runs`. `@we-gold/gpxjs` needs a DOM in Node, so it's used via `parseGPXWithCustomParser` + **`xmldom-qsa`**. No timestamps → distance only. Malformed/empty → `GpxParseError` → 400.
- **Frontend**: relative `/api` paths (Vite proxy). React Query `useQuery(['runs'])`; create/update/delete mutations invalidate `['runs']`. Client **duplicates** `Run`/`RUN_TYPES` types (no shared package — accepted). Distance input is `step="any"` (stored as-is, no rounding).
- **UI stack (Phase 3A)**: **Tailwind v4** via `@tailwindcss/vite` (no `tailwind.config`; theme tokens + `@theme inline` in `src/index.css`), **shadcn/ui** (`components.json`, new-york/neutral; primitives in `src/components/ui/`), `@` path alias → `src/`. **Feature-based folders** (not Atomic Design): `components/ui` (primitives), `components/layout` (AppShell, ThemeProvider, ThemeToggle), `features/runs` (RunsTable, RunFormDialog). No CSS-in-JS.
- **Run form/dialog reuse**: `RunForm` is the single create/edit component (create when no `initialRun`); a successful create **and** edit both fire `onDone`. `features/runs/RunFormDialog` wraps it in a Dialog for both add (mobile/overlay) and edit (all sizes). Delete uses an `AlertDialog`.
- **Responsive layout (Phase 3A.1)**: `App.tsx` is a `md:grid-cols-[1fr_2fr]` (form left / table right); inline form is `hidden md:block` and a `md:hidden` "Add run" button opens the create overlay on mobile. Gotchas baked in: grid items need `min-w-0` so the table's `overflow-x-auto` clamps instead of widening the page; `html { scrollbar-gutter: stable }` stops dialog-open layout shift; shell is `max-w-6xl` so the desktop table fits without scrolling.
- **Frontend client validates duration** > 0 before submit (the three h/m/s inputs can't use native `required`).

## Layout (key files)

```
server/src/
  app.ts, index.ts, prisma.ts
  runs/{router,controller,schemas,constants,import}.ts
  lib/validation.ts
  gpx/parse.ts            # parseGpx(source) -> {distanceKm,durationSec?,date?}; GpxParseError
  generated/prisma/       # generated client (gitignored)
server/{prisma/schema.prisma, prisma.config.ts, vitest.config.ts, vitest.setup.ts, vitest.globalSetup.ts}
server/tests/{runs.api,import.api}.test.ts + fixtures/*.gpx
server/src/**/*.test.ts   # unit tests co-located
client/src/
  main.tsx, App.tsx              # App = ThemeProvider > AppShell > grid(form, RunList)
  api/runs.ts                    # fetch/create/update/delete + importGpx
  index.css                      # Tailwind import + shadcn theme tokens
  lib/utils.ts                   # cn()
  components/ui/                 # shadcn primitives (button, table, dialog, alert-dialog, dropdown-menu, input, label, select, textarea)
  components/layout/             # AppShell, ThemeProvider, ThemeToggle (+ .test)
  components/{RunForm,RunList}.tsx  # RunForm (create/edit) ; RunList (table container + edit/delete dialogs)
  features/runs/                 # RunsTable, RunFormDialog (+ .test)
  test/                          # setup.ts (jsdom mocks: matchMedia, ResizeObserver, localStorage), renderWithClient.tsx
client/{vite.config.ts (/api proxy + tailwind + @ alias), vitest.config.ts, components.json}
openspec/specs/{run-management,gpx-import,app-shell,frontend-testing}/spec.md
```

## API

`GET /api/health` · `GET /api/runs` (newest first) · `POST /api/runs` · `GET /api/runs/:id` · `PATCH /api/runs/:id` · `DELETE /api/runs/:id` · `POST /api/runs/import` (multipart `.gpx`, parse-only).

## Testing

**Backend** — Vitest + Supertest. Isolated `test.db`: `vitest.globalSetup.ts` runs `prisma db push --url`; `vitest.setup.ts` sets `DATABASE_URL` inline (before prisma import) and `deleteMany` in `beforeEach`. **`fileParallelism: false`** — all DB-backed test files share one SQLite file. Verify changes by running tests; `dev.db` must stay untouched.

**Frontend** (from Phase 3A) — Vitest + React Testing Library + jsdom; own `client/vitest.config.ts` (separate from `vite.config.ts` so the Tailwind plugin isn't pulled in). `src/test/setup.ts` registers jest-dom and mocks `matchMedia`/`ResizeObserver`/`localStorage` (jsdom's are missing/partial); `renderWithClient` wraps components in a fresh `QueryClient`. Component tests mock the `api/runs` module (no live backend). Responsive show/hide is CSS/media-query driven → **not jsdom-testable**, verify those manually. Dialog/AlertDialog tests use `fireEvent` (Radix + jsdom dislike `userEvent` pointer checks).

## Working conventions

- **OpenSpec, full flow**: `/opsx:propose` → review the spec together → `/opsx:apply` **group-by-group, stopping after each group for review** → `/opsx:archive` (sync delta into living specs). Record apply-time discoveries back into the change's `design.md`.
- **Test-as-you-go**: add tests in the same change as the endpoint they cover — do not defer to the end.
- Prefer **kilometers** and second-based duration everywhere server-side; convert only for display.
- Git is managed via **GitHub Desktop**; each milestone is committed, tagged, and released (latest `v0.3.0`).

## Gotchas

- Don't write the uploaded GPX to disk (memory storage by design).
- Don't add a Prisma enum for run type (SQLite); extend `RUN_TYPES` instead.
- Don't set `Content-Type` manually on the GPX upload fetch — the browser sets the multipart boundary.
- Generated Prisma client and `*.db` files are gitignored; `server/.env` must be created on a fresh clone (`DATABASE_URL="file:./dev.db"`).
- **Client TS 6**: don't add `baseUrl` to tsconfig (deprecated → TS5101 build error); the `@/*` `paths` alias works without it under `moduleResolution: "bundler"`.
- Don't remove `min-w-0` from the layout grid columns or `scrollbar-gutter: stable` from `html` — they fix table-overflow-widens-page and dialog-open layout-shift respectively.
- shadcn primitives are added via `npx shadcn@latest add <name>` (pulls the consolidated `radix-ui` package); don't hand-write them.
