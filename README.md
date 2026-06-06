# Running Log & Training Dashboard

A full-stack app for logging runs and visualizing training — log runs manually (GPX upload and charts coming in later phases), then track mileage, pace, and run-type trends. Built with React + TypeScript on the frontend and Express + Prisma on the backend, developed spec-driven with [OpenSpec](https://github.com/Fission-AI/OpenSpec).

> **Status:** Phase 1 (Core CRUD) complete. See [Roadmap](#roadmap).

## Tech stack

| | |
|---|---|
| **Frontend** | Vite, React 19, TypeScript, TanStack React Query |
| **Backend** | Express 5, TypeScript (run via `tsx`), Prisma 7 + SQLite (better-sqlite3 driver adapter), Zod |
| **Tooling** | OpenSpec (spec-driven workflow), `concurrently` (root dev launcher) |

## Project structure

```
running-log-tracker/
├── client/          # Vite + React + TypeScript app
│   └── src/
│       ├── api/         # typed API client (runs.ts)
│       └── components/  # RunForm, RunList
├── server/          # Express + TypeScript API
│   ├── prisma/          # schema.prisma + migrations
│   └── src/
│       ├── runs/        # controller, router, schemas, constants
│       ├── lib/         # validation helpers
│       ├── prisma.ts    # PrismaClient singleton (+ adapter)
│       └── index.ts     # Express entry point
├── openspec/        # specs and change proposals (spec-driven dev)
└── package.json     # root dev launcher (runs client + server together)
```

## Getting started

### Prerequisites
- Node.js (LTS) and npm

### Setup

```bash
# 1. Install dependencies (root launcher, server, client)
npm install
npm install --prefix server
npm install --prefix client

# 2. Configure the server environment
#    (server/.env is gitignored — create it on a fresh clone)
echo 'DATABASE_URL="file:./dev.db"' > server/.env

# 3. Create the SQLite database and generate the Prisma client
npm --prefix server exec prisma migrate dev
```

### Run

From the repo root, start both apps together:

```bash
npm run dev
```

- **Client:** http://localhost:5173
- **API:** http://localhost:4000 (the Vite dev server proxies `/api` to it)

One `Ctrl-C` stops both; logs are labeled `[server]` / `[client]`.

## API

Base path: `/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/runs` | List all runs (newest first) |
| `POST` | `/api/runs` | Create a run |
| `GET` | `/api/runs/:id` | Get a run by id |
| `PATCH` | `/api/runs/:id` | Update a run (partial) |
| `DELETE` | `/api/runs/:id` | Delete a run |

### Run model

| Field | Type | Notes |
|---|---|---|
| `id` | string (cuid) | |
| `distanceKm` | number | kilometers (canonical unit) |
| `durationSec` | integer | total seconds |
| `date` | DateTime (ISO 8601) | start date **and** time, preserved |
| `type` | string | one of: Easy, Recovery, Tempo, Interval, Long Run, Race (default: Easy) |
| `notes` | string \| null | optional |
| `createdAt` | DateTime | set on creation |

Request bodies are validated with Zod; invalid input returns `400` with a structured error body, and missing records return `404`.

## Development workflow

This project uses **OpenSpec** for spec-driven development. Each feature is a *change*: write a proposal + spec + tasks, implement against them, then archive (folding the delta into the living specs under `openspec/specs/`).

```bash
/opsx:propose   # draft a new change (proposal, design, specs, tasks)
/opsx:apply     # implement the tasks
/opsx:archive   # finalize and update living specs
```

## Roadmap

- [x] **Phase 1 — Core CRUD:** manual run entry, full stack wired end-to-end
- [ ] **Phase 2 — File upload:** Multer + GPX parser, auto-populate runs from `.gpx`
- [ ] **Phase 3 — Dashboard & charts:** aggregated endpoints + React charts; UI overhaul (shadcn/ui, app shell, data table, theming)
- [ ] **Phase 4 — Search & filtering:** flexible query params + controlled filter UI

### Known limitations (Phase 1)
- UI is intentionally minimal — a full design pass lands in Phase 3
- No automated tests yet (endpoints verified manually; a Vitest + Supertest suite is planned)
- Distance is kilometers-only; single-user; no authentication
- SQLite is for local development, not production
