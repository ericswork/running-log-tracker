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
- **Dashboard & analytics** (`phase-3b-dashboard-analytics`) — read-only `/api/stats` aggregation endpoints (weekly mileage, pace trend, run-type breakdown, summary) bucketed in the **user's timezone** (IANA or UTC offset; Zod-validated); **Recharts** dashboard (summary cards + bar/line/donut, "hide empty weeks" toggle) behind a **Log/Dashboard Tabs** switch in the shell. First backend work since Phase 1. → tag `v0.3.1`

Current totals: **72 backend tests** + **34 frontend tests** passing; living specs `run-management` (13 reqs), `gpx-import` (5), `app-shell` (3), `frontend-testing` (2), `run-analytics` (7). Milestones tagged via GitHub Desktop (latest **v0.3.1**).

**Next up:** Phase 4.

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
- **Analytics endpoints (Phase 3B)**: read-only `/api/stats/*`, **derived from existing runs — no schema/persistence**. Same layering + `parseBody`/Zod as runs. Aggregation is **pure JS over all runs** (fine at single-user scale) in `server/src/stats/buckets.ts` (framework-free, unit-tested independently of HTTP); the controller just validates query params, `findMany`s, and wraps results. Canonical units only — **no pace/formatting server-side**.
- **Timezone bucketing**: `server/src/stats/buckets.ts` resolves the `timezone` query param (IANA via `Intl.DateTimeFormat` try/catch, or a fixed `±HH:MM`/`±HHMM`/`Z` offset shim; absent/empty → UTC) to a run's **local** calendar date, so near-midnight runs land on the correct local day. Weeks are **Monday-start (ISO-8601)**, keyed by the local `weekStart` date. Weekly/pace series are **zero-filled** across the span (`from`/`to` when both given, else first→last week with runs); the "hide empty weeks" UI toggle filters those out **client-side** (no refetch). Pace is undefined for zero-distance weeks → the client renders a **gap** (null point, `connectNulls={false}`), never a 0 pace.
- **Dashboard (Phase 3B)**: `features/dashboard/` — React Query hooks (`hooks.ts`) hitting `/api/stats` with the **browser timezone** attached; pure `shape.ts`/`format.ts` (unit-tested) turn endpoint data + derive pace/labels for **Recharts** (`ResponsiveContainer`-wrapped bar/line/donut). Charts show a "No runs yet" `EmptyState` when their data is empty. A shadcn **Tabs** (`Log` default / `Dashboard`) in `App.tsx` switches views — **no router**; the Log tab holds the existing form+table grid unchanged.

## Layout (key files)

```
server/src/
  app.ts, index.ts, prisma.ts
  runs/{router,controller,schemas,constants,import}.ts
  stats/{router,controller,schemas}.ts   # read-only /api/stats (analytics)
  stats/buckets.ts        # pure tz-aware aggregators (+ buckets.test.ts co-located)
  lib/validation.ts
  gpx/parse.ts            # parseGpx(source) -> {distanceKm,durationSec?,date?}; GpxParseError
  generated/prisma/       # generated client (gitignored)
server/{prisma/schema.prisma, prisma.config.ts, vitest.config.ts, vitest.setup.ts, vitest.globalSetup.ts}
server/tests/{runs.api,import.api,stats.api}.test.ts + fixtures/*.gpx
server/src/**/*.test.ts   # unit tests co-located (e.g. stats/buckets.test.ts)
client/src/
  main.tsx, App.tsx              # App = ThemeProvider > AppShell > Tabs(Log: form+RunList | Dashboard)
  api/{runs.ts, stats.ts}        # runs CRUD + importGpx ; stats fetchers (browser tz attached)
  index.css                      # Tailwind import + shadcn theme tokens (incl. --chart-1..5)
  lib/utils.ts                   # cn()
  components/ui/                 # shadcn primitives (button, table, dialog, alert-dialog, dropdown-menu, input, label, select, textarea, card, checkbox, tabs)
  components/layout/             # AppShell, ThemeProvider, ThemeToggle (+ .test)
  components/{RunForm,RunList}.tsx  # RunForm (create/edit) ; RunList (table container + edit/delete dialogs)
  features/runs/                 # RunsTable, RunFormDialog (+ .test)
  features/dashboard/            # Dashboard, SummaryCards, {WeeklyMileage,PaceTrend,TypeBreakdown}Chart, ChartCard, EmptyState; hooks.ts, shape.ts, format.ts (+ .test)
  test/                          # setup.ts (jsdom mocks: matchMedia, ResizeObserver, localStorage), renderWithClient.tsx
client/{vite.config.ts (/api proxy + tailwind + @ alias), vitest.config.ts, components.json}
openspec/specs/{run-management,gpx-import,app-shell,frontend-testing,run-analytics}/spec.md
```

## API

`GET /api/health` · `GET /api/runs` (newest first) · `POST /api/runs` · `GET /api/runs/:id` · `PATCH /api/runs/:id` · `DELETE /api/runs/:id` · `POST /api/runs/import` (multipart `.gpx`, parse-only).

**Analytics** (read-only, derived from runs; optional `from`/`to` = `YYYY-MM-DD` + `timezone` = IANA name or UTC offset; invalid → 400):
`GET /api/stats/summary` → `{totalRuns,totalDistanceKm,totalDurationSec}` · `GET /api/stats/weekly` → `{weeks:[{weekStart,distanceKm,runCount}]}` · `GET /api/stats/pace` → `{periods:[{weekStart,distanceKm,durationSec}]}` · `GET /api/stats/by-type` → `{types:[{type,count,distanceKm}]}`.

## Testing

**Backend** — Vitest + Supertest. Isolated `test.db`: `vitest.globalSetup.ts` runs `prisma db push --url`; `vitest.setup.ts` sets `DATABASE_URL` inline (before prisma import) and `deleteMany` in `beforeEach`. **`fileParallelism: false`** — all DB-backed test files share one SQLite file. Verify changes by running tests; `dev.db` must stay untouched.

**Frontend** (from Phase 3A) — Vitest + React Testing Library + jsdom; own `client/vitest.config.ts` (separate from `vite.config.ts` so the Tailwind plugin isn't pulled in). `src/test/setup.ts` registers jest-dom and mocks `matchMedia`/`ResizeObserver`/`localStorage` (jsdom's are missing/partial); `renderWithClient` wraps components in a fresh `QueryClient`. Component tests mock the `api/runs`/`api/stats` modules (no live backend). Responsive show/hide is CSS/media-query driven → **not jsdom-testable**, verify those manually. Dialog/AlertDialog tests use `fireEvent` (Radix + jsdom dislike `userEvent` pointer checks); **Radix Tabs switch on `fireEvent.mouseDown` (button 0), not `click`** (Checkbox does toggle on click). **Recharts SVG/layout isn't meaningfully testable in jsdom** (0-size `ResponsiveContainer`) — assert chart card titles / empty states and unit-test the pure `shape.ts`/`format.ts` instead; verify visuals manually.

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
- Don't compute pace or format units server-side — `/api/stats` returns canonical units only; the client derives pace (`durationSec/distanceKm`) and formats. Don't bucket off a run's raw UTC date — always resolve the request timezone first (`stats/buckets.ts`).
- To type-check without emitting build artifacts use `tsc --noEmit` (or `tsc --noEmit -p tsconfig.app.json` on the client). Plain `npm run build`/`tsc` emits to `dist/` (server `dist/` is gitignored; don't commit it).
