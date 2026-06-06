## 1. Dependencies & GPX parsing module

- [x] 1.1 Install `multer` (+ `@types/multer`) and `@we-gold/gpxjs` in `server/` (also `xmldom-qsa` — required for server-side parsing)
- [x] 1.2 Create a GPX-parsing module: given a file buffer/string, return `{ distanceKm, durationSec?, date? }`
- [x] 1.3 Verify against a real sample `.gpx`: confirmed track points + timestamps + reliable distance (library `distance.total` matches independent haversine within 2%; no fallback needed)
- [x] 1.4 Handle the no-timestamp case (return `distanceKm` only); throw a typed parse error for malformed GPX or zero track points

## 2. Import endpoint

- [ ] 2.1 Configure Multer with `memoryStorage()` and a `limits.fileSize` cap (single file field)
- [ ] 2.2 Add `POST /api/runs/import` to the runs router, wired through Multer
- [ ] 2.3 Controller: validate file presence + `.gpx` extension; on success parse the buffer and return 200 with `{ distanceKm, durationSec?, date? }` (no persistence)
- [ ] 2.4 Map all failure modes to HTTP 400 with a structured error body: missing file, wrong type, oversized (Multer limit), malformed GPX, no track points

## 3. Frontend upload

- [ ] 3.1 Add an API client function `importGpx(file)` that POSTs multipart to `/api/runs/import` and returns the parsed fields
- [ ] 3.2 Add a `.gpx` file input to the run form
- [ ] 3.3 On upload, call `importGpx`, pre-fill distance + (when present) duration and date/time fields; leave run type/notes for the user
- [ ] 3.4 Surface upload/parse errors in the form; do not pre-fill on error

## 4. Verification

- [ ] 4.1 Backend: `curl -F` upload a valid sample `.gpx` → 200 with expected `distanceKm`/`durationSec`/`date`; sanity-check distance against a known value
- [ ] 4.2 Backend: verify 400s for missing file, non-`.gpx`, oversized, malformed, and no-track-points cases
- [ ] 4.3 Backend: verify a no-timestamp GPX returns `distanceKm` only
- [ ] 4.4 Frontend: upload a `.gpx` in the browser → form pre-fills → review → save creates the run via the existing flow
- [ ] 4.5 Add backend tests for the GPX-parsing module and the import endpoint (Vitest + Supertest), consistent with the existing suite
