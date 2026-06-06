## Why

Manual run entry is tedious when the data already lives in a GPS export. Letting a user upload a `.gpx` file and auto-populating the run's distance, duration, and start time removes that friction — the highest-value Phase 2 feature. The user still reviews and completes the entry (run type, notes) before saving, so accuracy is preserved.

## What Changes

- Add a backend endpoint `POST /api/runs/import` that accepts a single `.gpx` file (multipart/form-data) via Multer **memory storage** — the file is parsed in memory and never written to disk.
- Parse the GPX with a dedicated parsing library and extract from the track points:
  - `distanceKm` — sum of geographic distance between consecutive points, in kilometers
  - `durationSec` — whole seconds between the first and last track-point timestamps
  - `date` — the first track-point timestamp as an ISO 8601 date-time (time of day preserved)
- The endpoint **returns the parsed fields as JSON and does not persist a run.** Creation continues to go through the existing validated `POST /api/runs`.
- Validate the upload: reject missing file, non-`.gpx` file, oversized file, and malformed/empty GPX (no track points) with HTTP 400 + a structured error body. If track points lack timestamps, return `distanceKm` only and omit `durationSec`/`date`.
- Frontend: add a GPX upload control to the run-entry form. On upload, pre-fill distance/duration/date from the response; the user picks run type, adds notes, reviews, and saves via the existing create mutation. Upload/parse errors are surfaced to the user.

## Capabilities

### New Capabilities
- `gpx-import`: upload and parse a `.gpx` file to extract run fields (distance, duration, start date-time) for pre-filling a new run entry, without persisting the file or the run.

### Modified Capabilities
<!-- None. The Run model and run-management CRUD endpoints are unchanged; import returns data that flows into the existing create endpoint. -->

## Impact

- **Backend** (`server/`): new dependency `multer` (+ types) and a GPX-parsing library (pinned in design); new import route/controller; a GPX-parsing module (distance/duration/date extraction); upload validation (type, size, parse errors).
- **Frontend** (`client/`): a file-upload control on the run form; an API client function for the import endpoint; pre-fill + error handling wiring.
- **No changes** to the `Run` Prisma model or the existing run-management endpoints.
- **Out of scope**: storing the raw `.gpx`, map rendering, elevation/pace extraction, multi-file upload, charts.
