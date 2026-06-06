## 1. Dependencies & GPX parsing module

- [x] 1.1 Install `multer` (+ `@types/multer`) and `@we-gold/gpxjs` in `server/` (also `xmldom-qsa` — required for server-side parsing)
- [x] 1.2 Create a GPX-parsing module: given a file buffer/string, return `{ distanceKm, durationSec?, date? }`
- [x] 1.3 Verify against a real sample `.gpx`: confirmed track points + timestamps + reliable distance (library `distance.total` matches independent haversine within 2%; no fallback needed)
- [x] 1.4 Handle the no-timestamp case (return `distanceKm` only); throw a typed parse error for malformed GPX or zero track points

## 2. Import endpoint

- [x] 2.1 Configure Multer with `memoryStorage()` and a `limits.fileSize` cap (single file field)
- [x] 2.2 Add `POST /api/runs/import` to the runs router, wired through Multer
- [x] 2.3 Controller: validate file presence + `.gpx` extension; on success parse the buffer and return 200 with `{ distanceKm, durationSec?, date? }` (no persistence)
- [x] 2.4 Map all failure modes to HTTP 400 with a structured error body: missing file, wrong type, oversized (Multer limit), malformed GPX, no track points

## 3. Frontend upload

- [x] 3.1 Add an API client function `importGpx(file)` that POSTs multipart to `/api/runs/import` and returns the parsed fields
- [x] 3.2 Add a `.gpx` file input to the run form
- [x] 3.3 On upload, call `importGpx`, pre-fill distance + (when present) duration and date/time fields; leave run type/notes for the user
- [x] 3.4 Surface upload/parse errors in the form; do not pre-fill on error
- [x] 3.5 Fix: distance input used `step="0.01"`, rejecting imported high-precision distances; relax to `step="any"` and store the value as-is (no rounding). Backend test asserts a high-precision distance persists unchanged.

## 4. Verification

- [x] 4.1 Backend: `curl -F` upload a valid sample `.gpx` → 200 with expected `distanceKm`/`durationSec`/`date`; sanity-check distance against a known value (covered by import.api.test.ts + parser haversine cross-check)
- [x] 4.2 Backend: verify 400s for missing file, non-`.gpx`, oversized, malformed, and no-track-points cases (covered by import.api.test.ts)
- [x] 4.3 Backend: verify a no-timestamp GPX returns `distanceKm` only (covered by import.api.test.ts)
- [x] 4.4 Frontend: upload a `.gpx` in the browser → form pre-fills → review → save creates the run via the existing flow (confirmed by user)
- [x] 4.5 Add backend tests for the GPX-parsing module and the import endpoint (Vitest + Supertest), consistent with the existing suite (brought forward, right after the endpoint was built)
