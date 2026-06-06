# run-analytics Specification

## Purpose

Define read-only analytics derived from existing runs — aggregation endpoints under `/api/stats` (summary totals, weekly mileage, pace trend, run-type breakdown) bucketed in the user's timezone, plus the dashboard view that consumes them with charts and summary cards. Endpoints return canonical units only; the client derives pace and performs all display formatting.

## Requirements

### Requirement: Summary statistics endpoint

The system SHALL expose a read-only `GET /api/stats/summary` endpoint that returns aggregate totals over the user's runs in canonical units: total run count, total `distanceKm`, and total `durationSec`. The endpoint SHALL NOT compute pace or perform display formatting. It SHALL honor the optional `from`/`to` date-range and `timezone` query parameters.

#### Scenario: Totals over all runs

- **WHEN** a client requests `GET /api/stats/summary` with runs present
- **THEN** the response is `{ totalRuns, totalDistanceKm, totalDurationSec }` where each value is the sum/count over the matching runs, in canonical units

#### Scenario: No runs

- **WHEN** a client requests `GET /api/stats/summary` and no runs match
- **THEN** the response is `{ totalRuns: 0, totalDistanceKm: 0, totalDurationSec: 0 }`

### Requirement: Weekly mileage endpoint

The system SHALL expose a read-only `GET /api/stats/weekly` endpoint that buckets the user's runs into Monday-start weeks computed in the resolved timezone and returns, per week, the week-start date (`YYYY-MM-DD` of that week's Monday in the resolved timezone), total `distanceKm`, and run count. Weeks SHALL be ordered chronologically ascending. The returned series SHALL be zero-filled: every week between the first and last week of the series SHALL be present, and a week with no matching runs SHALL be returned with `distanceKm: 0` and `runCount: 0`. The series span SHALL be the `from`/`to` range when both are provided, otherwise the first through last week that contain matching runs.

#### Scenario: Runs grouped into weeks

- **WHEN** a client requests `GET /api/stats/weekly` and runs span multiple weeks
- **THEN** the response is `{ weeks: [{ weekStart, distanceKm, runCount }, ...] }` ordered ascending by `weekStart`, with each week's `distanceKm` and `runCount` summed over runs whose local week starts on `weekStart`

#### Scenario: Gaps between runs are zero-filled

- **WHEN** a client requests `GET /api/stats/weekly` and there is a week with no runs between two weeks that have runs
- **THEN** that intervening week is present in `weeks` with `distanceKm: 0` and `runCount: 0`, preserving the ascending contiguous week sequence

#### Scenario: No runs

- **WHEN** a client requests `GET /api/stats/weekly` and no runs match
- **THEN** the response is `{ weeks: [] }`

### Requirement: Pace trend endpoint

The system SHALL expose a read-only `GET /api/stats/pace` endpoint that buckets the user's runs into the same Monday-start, zero-filled weekly series (in the resolved timezone) and returns, per week, the week-start date, total `distanceKm`, and total `durationSec`, so the client can derive average pace. The endpoint SHALL NOT compute pace itself. Periods SHALL be ordered chronologically ascending, and weeks with no matching runs SHALL be present with `distanceKm: 0` and `durationSec: 0` (the client renders these as a gap rather than a zero pace).

#### Scenario: Distance and duration per week

- **WHEN** a client requests `GET /api/stats/pace` with runs present
- **THEN** the response is `{ periods: [{ weekStart, distanceKm, durationSec }, ...] }` ordered ascending by `weekStart`, with totals summed over each week's runs and intervening empty weeks present with zero totals

#### Scenario: No runs

- **WHEN** a client requests `GET /api/stats/pace` and no runs match
- **THEN** the response is `{ periods: [] }`

### Requirement: Run-type breakdown endpoint

The system SHALL expose a read-only `GET /api/stats/by-type` endpoint that groups the user's runs by run type and returns, per type that appears in the matching set, the type name, run count, and total `distanceKm`. Entries SHALL be ordered by the canonical `RUN_TYPES` order. Types with no matching runs SHALL be omitted.

#### Scenario: Runs grouped by type

- **WHEN** a client requests `GET /api/stats/by-type` with runs of varying types
- **THEN** the response is `{ types: [{ type, count, distanceKm }, ...] }` containing one entry per run type present, ordered by canonical run-type order

#### Scenario: No runs

- **WHEN** a client requests `GET /api/stats/by-type` and no runs match
- **THEN** the response is `{ types: [] }`

### Requirement: Timezone-aware bucketing

Time-based buckets (weeks/days) SHALL be computed in the timezone supplied via the `timezone` query parameter, accepting either an IANA timezone name or a fixed UTC offset. When `timezone` is absent or empty, bucketing SHALL fall back to UTC. A run's bucket SHALL be determined by its local calendar date in the resolved timezone, so runs near midnight are assigned to the correct local day and week.

#### Scenario: Near-midnight run buckets by local day

- **WHEN** a run's stored timestamp falls near midnight UTC and the request supplies a `timezone` whose local date differs from the UTC date
- **THEN** the run is bucketed into the week containing its local calendar date, not its UTC date

#### Scenario: Default to UTC

- **WHEN** a stats request omits the `timezone` parameter
- **THEN** buckets are computed in UTC

### Requirement: Stats query parameter validation

The stats endpoints SHALL validate query parameters with Zod: optional `from` and `to` as `YYYY-MM-DD` calendar dates and an optional `timezone` (IANA name or UTC offset). Invalid parameters SHALL produce a `400` response with the project's structured validation-error body. When provided, `from` and `to` SHALL define an inclusive date range interpreted in the resolved timezone, and `from` SHALL NOT be later than `to`.

#### Scenario: Invalid timezone rejected

- **WHEN** a stats request supplies a `timezone` that is neither a valid IANA name nor a valid UTC offset
- **THEN** the response is `400` with a structured validation error and no aggregation is performed

#### Scenario: Malformed date rejected

- **WHEN** a stats request supplies a `from` or `to` that is not a valid `YYYY-MM-DD` date
- **THEN** the response is `400` with a structured validation error

#### Scenario: Inverted range rejected

- **WHEN** a stats request supplies `from` later than `to`
- **THEN** the response is `400` with a structured validation error

#### Scenario: Date range filters runs

- **WHEN** a stats request supplies a valid `from`/`to` range
- **THEN** only runs whose local calendar date falls within `[from, to]` inclusive are included in the aggregation

### Requirement: Dashboard view with charts and summary

The frontend SHALL provide a dashboard view that consumes the stats endpoints (passing the browser's timezone) and renders, within the existing responsive shell, a row of summary cards (total runs, total distance, total time, average pace), a weekly-mileage bar chart, a pace-trend line chart, and a run-type breakdown pie/donut chart. The client SHALL compute average pace and perform all display formatting; charts SHALL size to their container. Zero-filled weeks with no runs SHALL render as a gap (no point) in the pace-trend line rather than as a zero pace. The dashboard SHALL provide a "hide empty weeks" toggle (default off) that filters zero-run weeks out of the weekly time-series charts client-side, without refetching.

#### Scenario: Dashboard renders aggregated data

- **WHEN** the dashboard is shown and the stats endpoints return data
- **THEN** the summary cards display the computed totals and average pace, and the weekly-mileage, pace-trend, and run-type charts render from the endpoint data

#### Scenario: Hide empty weeks toggle

- **WHEN** the user enables the "hide empty weeks" toggle
- **THEN** weeks with zero runs are removed from the weekly-mileage and pace-trend charts without a network refetch, and disabling the toggle restores the full zero-filled series

#### Scenario: Empty state

- **WHEN** the dashboard is shown and there are no runs
- **THEN** each chart and the summary area show a graceful empty state (e.g. "No runs yet") rather than blank or broken charts

#### Scenario: Responsive layout

- **WHEN** the dashboard is viewed below the medium breakpoint
- **THEN** its content stacks into a single column within the existing shell
