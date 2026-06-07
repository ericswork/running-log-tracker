## MODIFIED Requirements

### Requirement: List runs endpoint

The system SHALL expose an endpoint that returns runs paginated and sorted server-side, defaulting to date descending (newest first). The endpoint SHALL accept optional pagination parameters `limit` (positive, default 20, capped at 100) and `offset` (non-negative, default 0), and sorting parameters `sort` (one of date, distance, duration, or run type; default date) and `order` (ascending or descending; default descending), in addition to the run-search filter parameters; pagination, sorting, and filtering SHALL compose. The response SHALL be an envelope `{ runs, total, limit, offset }`, where `runs` is the requested page of run records, `total` is the count of all runs matching the active filters, and `limit`/`offset` echo the page window. Invalid pagination or sorting parameters SHALL produce a `400` with the project's structured `ValidationError` body. The detailed filtering semantics are defined by the `run-search` capability.

#### Scenario: Default page newest first

- **WHEN** a client requests the list of runs with no parameters and runs exist
- **THEN** the system responds with HTTP 200 and an envelope whose `runs` is the first page (at most the default `limit`) ordered newest to oldest, with `total` equal to the number of runs and `limit`/`offset` reflecting the page window

#### Scenario: Empty list

- **WHEN** a client requests the list of runs and none exist
- **THEN** the system responds with HTTP 200 and `{ runs: [], total: 0, limit, offset }`

#### Scenario: Requesting a page window

- **WHEN** a client requests the list with `limit` and `offset`
- **THEN** the system responds with that slice of the matching, sorted runs in `runs`, and `total` reflects the full count of matching runs (not just the page)

#### Scenario: Sorting by a column and direction

- **WHEN** a client requests the list with `sort` and `order`
- **THEN** the runs in the page are ordered by that column in that direction (with a stable tie-break)

#### Scenario: Total reflects active filters

- **WHEN** a client requests the list with run-search filter parameters
- **THEN** `total` counts only the runs matching those filters, and `runs` is a page drawn from that filtered, sorted set

#### Scenario: Invalid pagination or sorting rejected

- **WHEN** a client supplies an invalid `limit`, `offset`, `sort`, or `order`
- **THEN** the system responds with `400` and a structured validation error, and no runs are returned

### Requirement: Run list view

The frontend SHALL display runs in a data table using data fetched with TanStack React Query, showing one server-provided page at a time. The table SHALL default to newest-first (date descending) ordering and SHALL allow the user to sort by date, distance, duration, and run type, with sorting performed server-side (the chosen column and direction drive the request, not an in-memory re-sort). The view SHALL provide pagination controls — previous/next (disabled at the respective bounds) and a "page X of Y" indicator derived from the total count — and SHALL return to the first page whenever the filters or the sort change. Each row SHALL expose an edit control and a delete control for that run.

#### Scenario: Runs displayed newest first by default

- **WHEN** the run list table loads and runs exist
- **THEN** the first page of runs is displayed ordered from newest to oldest

#### Scenario: User sorts the table by a column

- **WHEN** the user activates sorting on the date, distance, duration, or run type column
- **THEN** the table requests that column and direction from the server and displays the first page of the re-sorted runs

#### Scenario: User pages through the runs

- **WHEN** the user activates the next or previous control
- **THEN** the table fetches and displays the adjacent page, and the controls are disabled at the first/last page

#### Scenario: Changing filters or sort resets to the first page

- **WHEN** the user changes a filter or the sort while not on the first page
- **THEN** the view returns to the first page of the new result

#### Scenario: Each row offers edit and delete controls

- **WHEN** the run list table displays a run
- **THEN** that row presents controls to edit it and to delete it
