## 1. Data model & Prisma

- [x] 1.1 Define a `Run` model in `server/prisma/schema.prisma` (id, distanceKm Float, durationSec Int, date DateTime, type String, notes String?, createdAt DateTime @default(now()))
- [x] 1.2 Run the initial migration to create the SQLite table (`prisma migrate dev`)
- [x] 1.3 Add a Prisma client singleton module the API can import

## 2. Validation

- [x] 2.1 Install `zod` in `server/`
- [x] 2.2 Add a shared `RUN_TYPES` constant (`Easy`, `Recovery`, `Tempo`, `Interval`, `Long Run`, `Race`) in `server/`
- [x] 2.3 Define `zod` create/update schemas: positive distance (km) and duration (sec), valid ISO date-time for start, run type as `z.enum(RUN_TYPES)` defaulting to `Easy`, optional notes; infer request types from the schemas
- [x] 2.4 Map `zod` parse failures to HTTP 400 with a structured JSON error body

## 3. Backend API

- [x] 3.1 Create a runs controller with handlers: create, list, getById, update, delete
- [x] 3.2 Wire a runs router under `/api/runs` and mount it in `index.ts`
- [x] 3.3 Implement create → validate, persist, return 201 with the created run
- [x] 3.4 Implement list → return all runs ordered by date descending (200, empty array when none)
- [x] 3.5 Implement getById → 200 with the run, 404 when not found
- [x] 3.6 Implement update → validate, 200 with updated run, 404 when not found
- [x] 3.7 Implement delete → success status, 404 when not found
- [x] 3.8 Ensure invalid input returns 400 with a JSON error body and is not persisted

## 4. Frontend data layer

- [x] 4.1 Install `@tanstack/react-query` in `client/`
- [x] 4.2 Add a `QueryClientProvider` at the app root
- [x] 4.3 Configure a dev proxy (Vite) or base URL so the client reaches the API
- [x] 4.4 Write typed API client functions for the five run endpoints

## 5. Frontend UI

- [x] 5.1 Build a run-entry form (distance, duration, separate start-date and start-time inputs, run type select from allowed values, optional notes); combine date + time into one ISO date-time on submit
- [x] 5.2 Wire form submit to a React Query mutation that invalidates the `["runs"]` query on success
- [x] 5.3 Build a run list view that fetches via `useQuery` and renders runs newest-first
- [x] 5.4 Confirm a newly created run appears in the list without a full page reload

## 6. Verification

- [x] 6.1 Manually exercise each endpoint (curl or REST client) against the spec scenarios, including 400/404 cases
- [x] 6.2 Verify end-to-end in the browser: add a run via the form, see it appear newest-first
- [x] 6.3 Confirm `dev.db` is gitignored and not committed
