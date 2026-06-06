## Why

Phase 1 (run CRUD) was verified manually with ad-hoc `curl` sweeps — nothing repeatable guards against regressions as Phases 2–4 add file upload, charts, and filtering. An automated test suite turns the run-management spec scenarios into executable checks, so future changes can't silently break existing behavior.

## What Changes

- Add **Vitest** as the test runner in `server/`, with **Supertest** for HTTP-level integration tests.
- **Refactor** `server/src/index.ts` to separate app configuration from the network listener: a new `src/app.ts` exports the configured Express `app`; `index.ts` imports it and calls `app.listen()`. This lets tests import the app without binding a port. (No behavior change — same routes, same middleware.)
- Add **API integration tests** (Supertest + an isolated test database) covering the run-management endpoints against their spec scenarios.
- Add **unit tests** for the zod create/update schemas and the `parseBody` validation helper.
- Use a **dedicated SQLite test database file**, separate from `dev.db`, with schema applied via `prisma db push` and data reset between tests.
- Add a `test` script (`vitest`) to `server/package.json`.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `run-management`: adds a quality requirement that the API be covered by an automated regression test suite running against an isolated test database. No existing behavior changes — this records the testing bar as a requirement.

## Impact

- **Backend** (`server/`): new `src/app.ts` (extracted app), slimmed `src/index.ts`; new `tests/` (or `*.test.ts`) files; new dev dependencies (`vitest`, `supertest`, `@types/supertest`); a `test` script; Vitest config; a test-DB setup that points `DATABASE_URL` at a separate file and resets between tests.
- **No frontend changes.**
- **No changes** to product behavior, the API contract, or `openspec/specs/run-management/spec.md`.
- **Gitignore**: the test database file must be ignored like `dev.db`.
