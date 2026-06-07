## MODIFIED Requirements

### Requirement: Filterable run-list query parameters

The `GET /api/runs` endpoint SHALL accept optional, Zod-validated query parameters that narrow the matching runs, combined with AND: `from`/`to` (`YYYY-MM-DD`) as an inclusive **whole-day** date range against the raw stored timestamp (no timezone parameter), `minDistanceKm`/`maxDistanceKm` (numbers), and `type` (one or more values, each in `RUN_TYPES`, supplied repeatably or comma-separated). When no filter parameters are supplied, all runs match. Invalid parameters — a malformed date, a non-numeric distance, a `type` not in `RUN_TYPES`, or an inverted range (`from > to` or `minDistanceKm > maxDistanceKm`) — SHALL produce a `400` with the project's structured `ValidationError` body and no results. The matching runs SHALL be returned within the paginated list response defined by the `run-management` capability (the `{ runs, total, limit, offset }` envelope, newest-first by default): filtering determines which runs match — narrowing both the returned page and the `total` count.

#### Scenario: Filter by whole-day date range

- **WHEN** a client requests `GET /api/runs?from=2026-06-01&to=2026-06-07`
- **THEN** only runs whose stored timestamp falls between `2026-06-01T00:00:00.000Z` and `2026-06-07T23:59:59.999Z` inclusive are matched

#### Scenario: Filter by distance band

- **WHEN** a client requests `GET /api/runs?minDistanceKm=5&maxDistanceKm=10`
- **THEN** only runs with `distanceKm` between 5 and 10 inclusive are matched

#### Scenario: Filter by multiple run types

- **WHEN** a client requests `GET /api/runs?type=Easy,Tempo` (or repeated `type` params)
- **THEN** only runs whose `type` is Easy or Tempo are matched

#### Scenario: Filters combine with AND

- **WHEN** a client supplies a date range, a distance band, and one or more types together
- **THEN** only runs matching all of the supplied constraints are matched

#### Scenario: No parameters matches all runs

- **WHEN** a client requests `GET /api/runs` with no filter parameters
- **THEN** all runs match (returned via the paginated list response, newest first by default)

#### Scenario: No matches returns an empty page

- **WHEN** filters are supplied that no run satisfies
- **THEN** the response is HTTP 200 with an empty page (`runs: []` and `total: 0`)

#### Scenario: Invalid filter rejected

- **WHEN** a client supplies a malformed date, a non-numeric distance, an unknown `type`, or an inverted range
- **THEN** the response is `400` with a structured validation error and no runs are returned
