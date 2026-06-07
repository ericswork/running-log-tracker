# run-search Specification

## Purpose

Define filtering of the run history: optional, server-side, Zod-validated filter query parameters on `GET /api/runs` (whole-day date range, distance band, multi run-type), and the Log-tab filter bar that drives them. A shared date-range control is reused by the dashboard's date-range picker.

## Requirements

### Requirement: Filterable run-list query parameters

The `GET /api/runs` endpoint SHALL accept optional, Zod-validated query parameters that narrow the returned runs, combined with AND: `from`/`to` (`YYYY-MM-DD`) as an inclusive **whole-day** date range against the raw stored timestamp (no timezone parameter), `minDistanceKm`/`maxDistanceKm` (numbers), and `type` (one or more values, each in `RUN_TYPES`, supplied repeatably or comma-separated). When no parameters are supplied the endpoint SHALL return all runs (newest first), unchanged. Invalid parameters — a malformed date, a non-numeric distance, a `type` not in `RUN_TYPES`, or an inverted range (`from > to` or `minDistanceKm > maxDistanceKm`) — SHALL produce a `400` with the project's structured `ValidationError` body and no results. The response SHALL remain a newest-first `Run[]`.

#### Scenario: Filter by whole-day date range

- **WHEN** a client requests `GET /api/runs?from=2026-06-01&to=2026-06-07`
- **THEN** only runs whose stored timestamp falls between `2026-06-01T00:00:00.000Z` and `2026-06-07T23:59:59.999Z` inclusive are returned, newest first

#### Scenario: Filter by distance band

- **WHEN** a client requests `GET /api/runs?minDistanceKm=5&maxDistanceKm=10`
- **THEN** only runs with `distanceKm` between 5 and 10 inclusive are returned

#### Scenario: Filter by multiple run types

- **WHEN** a client requests `GET /api/runs?type=Easy,Tempo` (or repeated `type` params)
- **THEN** only runs whose `type` is Easy or Tempo are returned

#### Scenario: Filters combine with AND

- **WHEN** a client supplies a date range, a distance band, and one or more types together
- **THEN** only runs matching all of the supplied constraints are returned

#### Scenario: No parameters returns all runs

- **WHEN** a client requests `GET /api/runs` with no filter parameters
- **THEN** all runs are returned ordered newest first (current behavior)

#### Scenario: No matches returns empty

- **WHEN** filters are supplied that no run satisfies
- **THEN** the response is HTTP 200 with an empty array

#### Scenario: Invalid filter rejected

- **WHEN** a client supplies a malformed date, a non-numeric distance, an unknown `type`, or an inverted range
- **THEN** the response is `400` with a structured validation error and no runs are returned

### Requirement: Run filter bar

The Log tab SHALL present a filter bar above the runs table (stacked above the table on small viewports) with controls for a date range, a distance minimum/maximum, and a run-type multi-select, plus a control to clear all filters. The active filters SHALL drive the run-list query so that changing a filter updates the table, and the UI SHALL indicate when filters are active (e.g. a result count). When active filters match no runs, the table area SHALL show a "No runs match your filters" empty state, distinct from the empty state shown when no runs exist at all. Filter state SHALL be local UI state (not persisted to the URL).

The run-type multi-select SHALL render the run types as toggle chips that **default to all selected**, with explicit **"Select all"** and **"Clear"/"None"** controls. Selection is explicit (no implicit "empty means all" rule): all selected returns runs of every type; a non-empty subset returns runs of those types; selecting **no** types SHALL show the "No runs match your filters" empty state. Activating "Clear filters" SHALL reset the chips back to all selected.

#### Scenario: Applying a filter narrows the list

- **WHEN** the user sets one or more filters in the filter bar
- **THEN** the runs table updates to show only runs matching the active filters

#### Scenario: Select all and clear run types

- **WHEN** the user activates "Select all" for run types
- **THEN** every run-type chip is selected and runs of all types are shown; and **WHEN** the user instead deselects every run-type chip, **THEN** the "No runs match your filters" empty state is shown

#### Scenario: Clearing filters restores all runs

- **WHEN** the user activates "Clear filters"
- **THEN** all filters are removed, the run-type chips return to all-selected, and the table shows all runs again, newest first

#### Scenario: No-match empty state

- **WHEN** active filters match no runs
- **THEN** the table area shows a "No runs match your filters" message rather than a blank table
