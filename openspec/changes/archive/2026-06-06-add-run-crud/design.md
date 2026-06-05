## Context

This is the first feature in a fresh monorepo (`client/` Vite + React + TS, `server/` Express + TS, Prisma + SQLite already initialized). No `Run` model or routes exist yet. This change wires the full stack end-to-end so later phases (GPX upload, charts, filtering) have a working data layer and API to extend. Constraints: SQLite as the datastore, TanStack React Query on the frontend, and the project's "validate run type as a string" decision (SQLite + Prisma have no native enum on this provider).

## Goals / Non-Goals

**Goals:**
- A persisted `Run` model and migration in Prisma/SQLite.
- Five REST endpoints (create, list, get-by-id, update, delete) under an `/api/runs` prefix with consistent JSON error responses.
- Server-side validation: required fields, positive numeric distance/duration, valid date, and run type restricted to the allowed set with an `Easy` default.
- Frontend: React Query provider, typed API client, a create-run form, and a newest-first list that refreshes on mutation.

**Non-Goals:**
- GPX file upload / parsing (Phase 2).
- Aggregations or charts (Phase 3).
- Search / filtering query params (Phase 4).
- Authentication, pagination, and multi-user concerns.

## Decisions

**Run type stored as a validated `String`, not a Prisma enum.**
Prisma does not support `enum` on the SQLite provider. We store run type as a `String` and validate against a single shared constant (`RUN_TYPES`) in the Express layer. Alternative considered: a `RunType` lookup table with a foreign key — rejected as overkill for six fixed values in a practice app, and it complicates the API shape.

**Distance in kilometers (float), duration in total seconds (int), start date-and-time as a single `DateTime`.**
Storing canonical units keeps aggregation math (Phase 3) trivial and avoids ambiguity. The run's start is stored as one `DateTime` that preserves the time of day (not normalized to midnight) — the frontend collects date and time as two separate inputs and composes them into one ISO 8601 string before sending. Display-time conversion (e.g., pace, HH:MM:SS, separating date vs. time again) is a frontend concern. Alternative considered: storing a formatted duration string — rejected because it can't be summed or averaged.

**Validation with `zod`.**
Request bodies are validated against `zod` schemas in the Express layer (a create schema and an update schema), with run type modeled as a `z.enum` over the allowed set and the default applied when omitted. `zod` gives declarative, reusable schemas and rich error messages, and its inferred types can back the controller's request typing. Alternative considered: a hand-written validation helper — rejected in favor of the clearer, less error-prone declarative approach.

**Prisma 7 with the better-sqlite3 driver adapter.**
Prisma 7 removed the built-in query engine, so the runtime client requires a driver adapter. We use `@prisma/adapter-better-sqlite3`, instantiated from `DATABASE_URL` and passed to `new PrismaClient({ adapter })` in the singleton. Alternative considered: downgrading to Prisma 6 (where `new PrismaClient()` works with no adapter) — rejected to stay on the current, supported major version. This was discovered during implementation and was not in the original stack note.

**`tsx` as the dev runner (replacing `ts-node`), and `nodenext` module resolution.**
`@types/node` v25 exposes its globals through a package `exports` map that the legacy `moduleResolution: "node"` can't read, and TypeScript 6 deprecates that setting — so `tsconfig` moves to `module`/`moduleResolution: "nodenext"`. `ts-node` does not resolve `nodenext` cleanly at runtime, so the dev script uses `tsx watch`, which handles it natively and bundles file-watching (no separate nodemon needed). Alternatives considered: keep `ts-node` with ESM loader tuning — rejected as fiddly; add nodemon — unnecessary since `tsx watch` already watches. This deviates from the original "ts-node" stack note and was decided during implementation.

**Layering: `routes → controller → Prisma client`.**
A thin route file maps HTTP verbs to controller functions; controllers handle validation and call a shared Prisma client singleton. This separation makes the upcoming phases easy to slot in. Alternative considered: inline handlers in `index.ts` — rejected; doesn't scale past one feature.

**React Query owns server state; mutations invalidate the runs query.**
The create form fires a mutation that invalidates the `["runs"]` query on success, so the list re-fetches and updates without a manual reload. Alternative considered: optimistic updates — deferred; not worth the complexity for the first feature.

## Risks / Trade-offs

- **String run type allows drift if validation is bypassed** → centralize the allowed list in one exported constant used by both validation and (optionally) the frontend select, so there's a single source of truth.
- **No shared types between client and server** → for now, define request/response types independently on each side; accept minor duplication. If it becomes painful, consider a shared `types` package later.
- **SQLite file is local/dev-only** → fine for a practice project; not a production datastore. Document `dev.db` is gitignored.
- **Bleeding-edge stack (Prisma 7, TypeScript 6, `@types/node` 25)** → newer majors mean fewer examples and occasional setup friction (the adapter and module-resolution changes above). Mitigation: pin versions via the lockfile and keep the generated Prisma client (`src/generated/prisma`) gitignored and regenerated from the schema.
- **`zod` schema must stay aligned with the Prisma model** → derive the run-type enum from the same shared `RUN_TYPES` constant the schema uses, so there is one source of truth; map each schema rule to a spec scenario so coverage is auditable.

## Open Questions

- Resolved: distance is entered and stored in kilometers only (no miles conversion in Phase 1).
- Resolved: the form collects date and time as separate inputs and stores a single `DateTime` that preserves the time of day.
- Timezone handling: the start date-and-time is stored as submitted; whether to anchor to local time or UTC for display is deferred until charts (Phase 3) need consistent bucketing.
