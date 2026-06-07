## MODIFIED Requirements

### Requirement: List runs endpoint

The system SHALL expose an endpoint that returns runs ordered by date descending (newest first). The endpoint SHALL accept the optional run-search filter query parameters (a whole-day `from`/`to` date range, a `minDistanceKm`/`maxDistanceKm` distance band, and one or more `type` values); when no filter parameters are supplied it SHALL return all runs, newest first (unchanged behavior). The detailed filtering semantics and validation are defined by the `run-search` capability.

#### Scenario: Runs returned newest first

- **WHEN** a client requests the list of runs and multiple runs exist
- **THEN** the system responds with HTTP 200 and the runs ordered by date from newest to oldest

#### Scenario: Empty list

- **WHEN** a client requests the list of runs and none exist
- **THEN** the system responds with HTTP 200 and an empty array

#### Scenario: Filter parameters narrow the result

- **WHEN** a client requests the list of runs with one or more valid run-search filter parameters
- **THEN** the system responds with HTTP 200 and only the runs matching those filters, still ordered newest first
