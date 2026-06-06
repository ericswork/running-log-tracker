# CLAUDE.md

Guidance for working in this repository.

## Project

Full-stack running log: log runs manually or by uploading a `.gpx` file (auto-fills the entry), browse history, with a training dashboard planned. Personal/practice project — single-user, no auth. Developed **spec-driven with OpenSpec**.

Monorepo, two independently-run apps + shared specs:
- `client/` — Vite + React 19 + TypeScript, TanStack React Query
- `server/` — Express 5 + TypeScript (run via **tsx**), Prisma 7 + SQLite (better-sqlite3 driver adapter), Zod; Multer + `@we-gold/gpxjs` for GPX
- `openspec/` — living specs (`specs/`) + archived changes (`changes/archive/`)

## Status & continuity

> This file doubles as a session-handoff. Read this section first to resume mid-project.

**Done (each shipped as an archived OpenSpec change in `openspec/changes/archive/`):**
- **Core run CRUD** (`add-run-crud`) — `/api/runs` create/list/get/update/delete + manual-entry form + newest-first list. → tag `v0.1.0`
- **Backend test suite** (`add-run-api-tests`) — Vitest + Supertest, isolated `test.db`. → tag `v0.1.1`
- **GPX import** (`add-gpx-import`) — parse-only `POST /api/runs/import` + upload-to-prefill UI. → tag `v0.2.0`

Current totals: **42 backend tests passing**; living specs `run-management` (11 reqs) + `gpx-import` (5 reqs). Git is **local only — no GitHub remote**; tags/releases drafted but not pushed.

**Next up (do before Phase 3):**
- **Edit/delete run UI** — its own small OpenSpec change. The API already supports `PATCH`/`DELETE` (tested); the frontend list has no edit/delete controls yet (deliberately cut from Phase 1's UI tasks). Start with `/opsx:propose`.

**Phase 3 — Dashboard & charts + UI overhaul (bundled):**
1. Aggregated/analytics endpoints (weekly mileage, pace trend, run-type breakdown) — separate from `GET /api/runs`; add Zod query-param validation + tests.
2. React charts consuming them (chart lib **not yet chosen** — Recharts or Nivo; pick early).
3. UI overhaul: adopt **shadcn/ui** (in stack, not installed), app shell + layout, **run list as a sortable data table** (natural home for the edit/delete actions — could absorb that change here), light/dark theming.
- Watch-outs: charts need a real layout (why the UI overhaul is bundled); decide timezone handling for time-based aggregations (start times stored as submitted/UTC).

**Phase 4 (later):** search & filtering — flexible query params on `GET /api/runs` (date range, distance, run type) + filter UI.

## Commands

```bash
npm run dev                      # root: runs server (:4000) + client (:5173) together
npm --prefix server test         # backend test suite (Vitest + Supertest)
npm --prefix server run test:watch
npm --prefix server run build    # tsc -> dist/
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
- **Frontend**: relative `/api` paths (Vite proxy). React Query `useQuery(['runs'])`; create mutation invalidates `['runs']`. Client **duplicates** `Run`/`RUN_TYPES` types (no shared package — accepted). Distance input is `step="any"` (stored as-is, no rounding).

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
client/src/{main,App}.tsx, api/runs.ts, components/{RunForm,RunList}.tsx
client/vite.config.ts     # /api proxy
openspec/specs/{run-management,gpx-import}/spec.md
```

## API

`GET /api/health` · `GET /api/runs` (newest first) · `POST /api/runs` · `GET /api/runs/:id` · `PATCH /api/runs/:id` · `DELETE /api/runs/:id` · `POST /api/runs/import` (multipart `.gpx`, parse-only).

## Testing

Vitest + Supertest. Isolated `test.db`: `vitest.globalSetup.ts` runs `prisma db push --url`; `vitest.setup.ts` sets `DATABASE_URL` inline (before prisma import) and `deleteMany` in `beforeEach`. **`fileParallelism: false`** — all DB-backed test files share one SQLite file. Verify changes by running tests; `dev.db` must stay untouched.

## Working conventions

- **OpenSpec, full flow**: `/opsx:propose` → review the spec together → `/opsx:apply` **group-by-group, stopping after each group for review** → `/opsx:archive` (sync delta into living specs). Record apply-time discoveries back into the change's `design.md`.
- **Test-as-you-go**: add tests in the same change as the endpoint they cover — do not defer to the end.
- Prefer **kilometers** and second-based duration everywhere server-side; convert only for display.
- Git is **local only (no GitHub remote yet)**; commits are made via GitHub Desktop.

## Gotchas

- Don't write the uploaded GPX to disk (memory storage by design).
- Don't add a Prisma enum for run type (SQLite); extend `RUN_TYPES` instead.
- Don't set `Content-Type` manually on the GPX upload fetch — the browser sets the multipart boundary.
- Generated Prisma client and `*.db` files are gitignored; `server/.env` must be created on a fresh clone (`DATABASE_URL="file:./dev.db"`).
