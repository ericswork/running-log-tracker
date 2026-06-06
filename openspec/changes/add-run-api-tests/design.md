## Context

Phase 1 shipped a run-CRUD API verified only by manual `curl`. As later phases extend the backend, there's no automated guard against regressions. This change adds a test layer for `server/`. The run-management behavior is already specified in `openspec/specs/run-management/spec.md`; its scenarios are the acceptance criteria the tests assert against. No product behavior changes here.

## Goals / Non-Goals

**Goals:**
- API integration tests (Supertest) for the run endpoints, mapping to the run-management spec scenarios.
- Unit tests for the zod schemas and the `parseBody` validation helper.
- A test runner (Vitest) and a `test` script.
- Test isolation: a dedicated SQLite database file, never touching `dev.db`, reset between tests.

**Non-Goals:**
- Frontend/component tests (out of scope for this change).
- Changing any API behavior or the run-management spec.
- CI configuration (can follow later).

## Decisions

**Vitest + Supertest.**
Vitest fits the existing TS/Vite-adjacent tooling and runs TS natively. Supertest drives the Express app in-process over HTTP without binding a port. Alternative considered: Jest — rejected to avoid extra TS config and a second toolchain.

**Extract the Express app into `src/app.ts`.**
`index.ts` currently builds the app and calls `app.listen()` together, so importing it would start a server. We move app construction (middleware + route mounting) into `src/app.ts`, which exports the configured `app`; `index.ts` imports it and calls `listen`. Tests import `app` directly. Behavior is unchanged — same middleware order, same routes.

**Dedicated SQLite test database file, reset between tests.**
Tests run against a separate file (`file:./test.db`), with the schema applied via `prisma db push` (no migration history needed for a throwaway DB) and data reset between tests (delete all rows in a `beforeEach`). Note (discovered during apply): Prisma 7's `db push` has no `--skip-generate` flag; globalSetup invokes `prisma db push --url "file:./test.db" --accept-data-loss`, where `--url` overrides the datasource directly (cleaner than an env var and avoids dotenv-override ambiguity). Alternatives considered: in-memory SQLite (rejected — the better-sqlite3 adapter's in-memory DB is per-connection and complicates applying the schema); reusing `dev.db` (rejected — destroys real data).

**Inline `DATABASE_URL` override in the Vitest setup — not a `.env.test` file.**
The Vitest `setupFiles` sets `process.env.DATABASE_URL = "file:./test.db"` before any test imports the app. There is exactly one test-specific variable and it is not a secret, so a dedicated env file would add ceremony without payoff. Crucially, `src/prisma.ts` runs `import "dotenv/config"`, and `dotenv` does not override already-set env vars — so setting the value inline first means the later dotenv load won't clobber it. The override MUST run before `prisma.ts` is first imported (hence `setupFiles`/`globalSetup`, never inside a test file). Alternative considered: a committed `.env.test` loaded with `dotenv override:true` — rejected as more moving parts and load-order subtlety for a single non-secret value; revisit if test config grows.

**Tests assert against spec scenarios.**
Each `#### Scenario` in the run-management spec becomes one or more `it()` cases. Integration tests cover HTTP status + response shape; unit tests cover the validation rules directly (faster, pinpoint failures).

## Risks / Trade-offs

- **The `index.ts` refactor could subtly change startup** → keep the move mechanical (cut app setup into `app.ts`, import it, call `listen`); verify the server still boots and `/api/health` responds afterward.
- **Test DB env must be set before the Prisma singleton loads** → use a Vitest `setupFiles` (or globalSetup) that sets `DATABASE_URL` and runs `prisma db push` before any test imports the app.
- **`prisma db push` drift from migrations** → acceptable for a disposable test DB; the schema source is the same `schema.prisma`, so it stays in sync.
- **Test DB file must be gitignored** → add the test DB path alongside the existing `*.db` ignore (already covered by the root `*.db` rule, but confirm).

## Open Questions

- Test file location: co-locate `*.test.ts` next to source, or a top-level `server/tests/` dir? (Lean: unit tests co-located, integration tests under `server/tests/`. Settle in tasks.)
- Whether to run `prisma db push` once per suite (globalSetup) vs. rely on a committed `test.db` schema — lean on globalSetup so it's reproducible from a clean clone.
