## Context

Phase 1 delivered run CRUD; entry is fully manual. GPX files (from watches/Strava) already contain the track data needed to fill most of a run entry. This change adds a parse-only import endpoint plus a frontend upload control that pre-fills the existing form. It builds on the run-management API and the group-2 `app.ts` structure from the test change; it does not change the `Run` model or the CRUD endpoints.

## Goals / Non-Goals

**Goals:**
- `POST /api/runs/import` — accept one `.gpx` upload, parse in memory, return `{ distanceKm, durationSec?, date? }`.
- Robust validation: file presence, extension/type, size limit, malformed/empty GPX → 400 with a structured body.
- Graceful partial extraction: distance-only when timestamps are absent.
- Frontend: upload control on the run form that pre-fills distance/duration/date and surfaces errors.

**Non-Goals:**
- Persisting the uploaded file or creating the run in the import endpoint (creation stays on `POST /api/runs`).
- Map rendering, elevation/pace, multi-file upload, charts.
- Changing the `Run` model or CRUD endpoints.

## Decisions

**Multer with memory storage; file never hits disk.**
`multer.memoryStorage()` gives the file as a buffer we parse and discard. No upload directory, no cleanup, no gitignore entry. A `limits.fileSize` cap rejects oversized uploads before parsing. Alternative considered: disk storage — rejected (adds cleanup + storage for no Phase-2 benefit).

**GPX library: `@we-gold/gpxjs`, with a haversine fallback for distance.**
Research showed `@we-gold/gpxjs` is the actively maintained, TypeScript-first option that runs server-side (via `xmldom-qsa`); older parsers (`gpxparser`, `gpx-parse`) are years stale. We use it to parse the XML and read track points + timestamps. For `distanceKm` we prefer the library's computed distance, but if its distance output proves unreliable/absent we compute it ourselves with the haversine formula over the parsed points — the library owns the tedious XML parsing, and we keep ownership of the one number that matters. This must be verified against a real `.gpx` during implementation. Alternatives considered: pure manual XML + haversine (rejected — the user chose a dedicated library); stale parsers (rejected — maintenance risk).

**Parse-only endpoint returning data, not a run.**
Import returns the extracted fields; the frontend pre-fills the form and the user saves via the existing validated `POST /api/runs`. This reuses all Phase-1 validation and avoids a second creation path. Alternative considered: import creates the run directly — rejected (no review step; can't set type/notes; duplicates validation).

**Graceful partial extraction.**
Distance needs only coordinates; duration/date need timestamps. If timestamps are absent, return `distanceKm` only and omit the others, so a GPX without time data is still useful. The response shape is therefore `{ distanceKm: number, durationSec?: number, date?: string }`.

**Structured 400s, reusing the existing error shape.**
Validation failures (no file, wrong type, too large, malformed, no track points) return HTTP 400 with a structured JSON body consistent with the existing `ValidationError` shape, so the frontend handles errors uniformly.

## Risks / Trade-offs

- **Library distance/time API may differ from assumptions** → verify against a real `.gpx` early; fall back to haversine for distance if needed. Treat this like the Prisma 7 discovery — confirm, don't assume.
- **`xmldom`-based parsing of a hostile/huge file** → the Multer `fileSize` limit caps input; parsing happens only after the size check.
- **Multer + Express 5 typing** → Express 5 is recent; confirm `@types/multer` types line up (similar to the `Request<{id}>` quirk in Phase 1). Mitigation: type the handler explicitly.
- **Timezone of the start `date`** → preserve the timestamp exactly as in the GPX (usually UTC `Z`); display conversion is a frontend concern, consistent with Phase 1.

## Open Questions

- File size limit value — propose a few MB (e.g., 5 MB); settle in tasks. Long activities produce large GPX, but text compresses; 5 MB is generous.
- `.gpx` detection — rely on extension + reject on parse failure, or also check MIME type? (MIME for `.gpx` is inconsistent across browsers; lean on extension + parse-failure as the real guard.)
