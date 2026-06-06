## ADDED Requirements

### Requirement: GPX import endpoint

The system SHALL expose an endpoint that accepts a single `.gpx` file as `multipart/form-data`, parses it in memory, and returns the extracted run fields as JSON. The endpoint MUST NOT persist a run and MUST NOT write the uploaded file to disk.

#### Scenario: Valid GPX returns parsed fields

- **WHEN** a client uploads a valid `.gpx` file with timestamped track points
- **THEN** the system responds with HTTP 200 and a JSON body containing `distanceKm`, `durationSec`, and `date`, and persists nothing

#### Scenario: Uploaded file is not persisted

- **WHEN** a `.gpx` file is uploaded and parsed
- **THEN** the file is not written to disk and no run record is created

### Requirement: Extracted run fields

The system SHALL derive from the GPX track points: `distanceKm` as the summed geographic distance between consecutive points in kilometers; `durationSec` as the whole-second difference between the first and last track-point timestamps; and `date` as the first track-point timestamp in ISO 8601, preserving the time of day.

#### Scenario: Distance summed across track points

- **WHEN** a GPX with multiple track points is parsed
- **THEN** `distanceKm` equals the total geographic distance along the points, in kilometers

#### Scenario: Duration and start derived from timestamps

- **WHEN** a GPX with timestamped track points is parsed
- **THEN** `durationSec` is the whole-second difference between the last and first timestamps, and `date` is the first timestamp as an ISO 8601 date-time preserving its time of day

### Requirement: Partial extraction without timestamps

The system SHALL still return `distanceKm` when track points have no timestamps, omitting `durationSec` and `date` so the user can supply them.

#### Scenario: GPX without timestamps

- **WHEN** a GPX with track points but no time data is parsed
- **THEN** the system responds with HTTP 200 and a body containing `distanceKm` only (no `durationSec` or `date`)

### Requirement: Upload validation

The system SHALL reject invalid uploads with HTTP 400 and a structured JSON error body, without persisting anything. Rejections include: no file provided, a file that is not a `.gpx` file, a file exceeding the configured size limit, malformed/unparseable GPX, and a GPX containing no track points.

#### Scenario: Missing file

- **WHEN** the request contains no file
- **THEN** the system responds with HTTP 400 and a structured error

#### Scenario: Wrong file type

- **WHEN** the uploaded file is not a `.gpx` file
- **THEN** the system responds with HTTP 400 and a structured error

#### Scenario: Oversized file

- **WHEN** the uploaded file exceeds the configured size limit
- **THEN** the system responds with HTTP 400 and a structured error

#### Scenario: Malformed or empty GPX

- **WHEN** the uploaded file is not valid GPX or contains no track points
- **THEN** the system responds with HTTP 400 and a structured error

### Requirement: Frontend GPX upload pre-fills the form

The run-entry form SHALL provide a control to upload a `.gpx` file. On a successful import, the distance, duration, and date/time fields SHALL be pre-filled from the parsed response; the user then selects a run type, optionally adds notes, and saves through the existing run-creation flow. Import or parse errors SHALL be shown to the user.

#### Scenario: Upload pre-fills the form

- **WHEN** a user uploads a valid `.gpx` file in the run form
- **THEN** the distance, duration, and date/time fields are populated from the parsed data, and the user can review and save the run

#### Scenario: Upload error is surfaced

- **WHEN** an upload fails validation or parsing
- **THEN** the form shows an error message and does not pre-fill the fields
