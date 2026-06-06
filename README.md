# Running Log & Training Dashboard

A full-stack web app for logging runs and tracking training. Record runs by hand or by uploading a GPS track, then review your history — with mileage, pace, and run-type insights as the dashboard grows. Built with React + TypeScript on the frontend and Express + Prisma on the backend, and developed spec-driven with [OpenSpec](https://github.com/Fission-AI/OpenSpec).

## Features

- **Run logging** — record a run's distance, duration, start date & time, type (Easy, Recovery, Tempo, Interval, Long Run, Race), and optional notes.
- **GPX import** — upload a `.gpx` file (from a watch, Strava, etc.) and the entry form auto-fills distance, duration, and start time from the track; you review and save.
- **REST API** — full create/read/update/delete for runs, with schema validation and structured error responses.
- **Run history** — browse logged runs, newest first.

## Tech stack

| | |
|---|---|
| **Frontend** | Vite, React 19, TypeScript, TanStack React Query |
| **Backend** | Express 5, TypeScript (run via `tsx`), Prisma 7 + SQLite (better-sqlite3 driver adapter), Zod |
| **Uploads / parsing** | Multer (in-memory), `@we-gold/gpxjs` |
| **Testing** | Vitest + Supertest (backend) |
| **Tooling** | OpenSpec (spec-driven workflow), `concurrently` (root dev launcher) |

## Architecture

A monorepo with two independently-run apps and a shared spec directory:

```
running-log-tracker/
├── client/      # Vite + React + TypeScript app (form, run list, typed API client)
├── server/      # Express + TypeScript API
│   ├── prisma/      # schema + migrations (SQLite)
│   └── src/         # app + routes/controllers, validation, GPX parsing, Prisma client
├── openspec/    # living specs + change history (spec-driven development)
└── package.json # root dev launcher (runs client + server together)
```

The frontend talks to the backend over `/api`; in development, Vite proxies those requests to the Express server.

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

### Test

```bash
npm --prefix server test        # run the backend test suite
npm --prefix server run test:watch
```

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
| `POST` | `/api/runs/import` | Parse an uploaded `.gpx` and return run fields (does not persist) |

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

## Conventions

- **Units & time** — distance is stored in kilometers and duration in whole seconds (the canonical units); the start date-time preserves the time of day. Display formatting is a frontend concern.
- **GPX uploads** are parsed in memory and never written to disk.
- **SQLite** is used for local development; the database file is gitignored.
- **Single-user, no authentication** — this is a personal/practice project.

## Development workflow

This project uses **OpenSpec** for spec-driven development. Each feature is a *change*: write a proposal + spec + tasks, implement against them, then archive (folding the delta into the living specs under `openspec/specs/`). Automated tests are added alongside the code they cover.

```bash
/opsx:propose   # draft a new change (proposal, design, specs, tasks)
/opsx:apply     # implement the tasks
/opsx:archive   # finalize and update living specs
```

The current capability specs live in [`openspec/specs/`](openspec/specs/).

## Roadmap

Planned, in no fixed order:

- Edit and delete runs from the UI
- Dashboard with charts (weekly mileage, pace trend, run-type breakdown)
- Search and filtering (by date range, distance, run type)
- UI/design polish (component library, theming, sortable data table)
