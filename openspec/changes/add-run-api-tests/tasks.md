## 1. Test tooling setup

- [x] 1.1 Install dev dependencies in `server/`: `vitest`, `supertest`, `@types/supertest`
- [x] 1.2 Add a `test` script (`vitest run`) and a `test:watch` script (`vitest`) to `server/package.json`
- [x] 1.3 Add a Vitest config (`vitest.config.ts`) with a Node environment and a setup/globalSetup file

## 2. App refactor for testability

- [x] 2.1 Create `server/src/app.ts` exporting the configured Express `app` (middleware + `/api/health` + `/api/runs` router), with no `app.listen()`
- [x] 2.2 Slim `server/src/index.ts` to import `app` from `./app` and call `app.listen()`
- [x] 2.3 Verify the server still boots and `/api/health` responds (no behavior change)

## 3. Test database isolation

- [x] 3.1 In Vitest `setupFiles`, set `process.env.DATABASE_URL = "file:./test.db"` inline (no `.env.test`) so it runs before `src/prisma.ts` is first imported (dotenv won't override an already-set value)
- [x] 3.2 Apply the schema to the test DB with `prisma db push` in globalSetup
- [x] 3.3 Reset data between tests (delete all `Run` rows in `beforeEach`) so tests are independent
- [x] 3.4 Confirm the test DB file is gitignored and `dev.db` is never touched by the suite

## 4. API integration tests (Supertest)

- [ ] 4.1 Create → 201 with the created run; type defaults to `Easy` when omitted; start time-of-day preserved (not midnight)
- [ ] 4.2 List → 200 newest-first; 200 with empty array when none
- [ ] 4.3 Get by id → 200 when found; 404 when not found
- [ ] 4.4 Update (PATCH) → 200 partial update; 404 when not found; 400 on invalid value
- [ ] 4.5 Delete → 204 when found; 404 when not found
- [ ] 4.6 Validation → 400 on invalid run type, missing required fields, and non-positive distance/duration (and not persisted)

## 5. Unit tests (schemas + validation helper)

- [ ] 5.1 `createRunSchema`: valid input passes; type defaults to `Easy`; invalid type rejected; missing required field rejected; non-positive distance/duration rejected
- [ ] 5.2 `updateRunSchema`: partial input accepted; invalid value rejected
- [ ] 5.3 `parseBody`: returns typed data on success; returns `{ ok: false, status: 400, body }` with structured details on failure

## 6. Verification

- [ ] 6.1 Run `npm --prefix server test` — all tests pass
- [ ] 6.2 Confirm `dev.db` is unchanged and the test DB is gitignored / not committed
