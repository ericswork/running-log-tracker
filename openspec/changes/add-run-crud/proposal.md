## Why

The running log needs a foundational way to record and manage runs before any of the higher-value features (file upload, charts, filtering) can exist. This change delivers the core data model and full CRUD flow end-to-end, establishing the stack wiring (Express + Prisma + SQLite ↔ React + React Query) that every later phase builds on.

## What Changes

- Introduce a `Run` data model persisted with Prisma + SQLite, with fields: distance (kilometers, number), duration (total seconds, integer), date (ISO 8601 DateTime), run type (validated string), and optional notes.
- Add Express REST endpoints: create, list, get-by-id, update, and delete runs.
- Validate run type server-side against a fixed allowed list (`Easy`, `Recovery`, `Tempo`, `Interval`, `Long Run`, `Race`); reject invalid values with a 400.
- Add a React form to create a run and a list view showing all runs newest-first, wired with TanStack React Query.

## Capabilities

### New Capabilities
- `run-management`: Create, read, update, and delete run entries, including the run data model, server-side validation rules, and the REST API contract.

### Modified Capabilities
<!-- None — this is the first capability. -->

## Impact

- **Backend** (`server/`): new Prisma `Run` model + migration, run routes/controller, `zod` request schemas, JSON error responses.
- **Frontend** (`client/`): React Query client setup, API client functions, a run-entry form component (separate date and time inputs), and a run list component.
- **Dependencies**: adds Prisma client usage (already initialized); backend adds `zod`; frontend adds `@tanstack/react-query`.
- **Out of scope** (later phases): GPX file upload, charts/aggregations, and search/filtering.
