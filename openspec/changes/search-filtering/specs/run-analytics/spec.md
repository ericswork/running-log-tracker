## MODIFIED Requirements

### Requirement: Dashboard view with charts and summary

The frontend SHALL provide a dashboard view that consumes the stats endpoints (passing the browser's timezone) and renders, within the existing responsive shell, a row of summary cards (total runs, total distance, total time, average pace), a weekly-mileage bar chart, a pace-trend line chart, and a run-type breakdown pie/donut chart. The client SHALL compute average pace and perform all display formatting; charts SHALL size to their container. Zero-filled weeks with no runs SHALL render as a gap (no point) in the pace-trend line rather than as a zero pace. The dashboard SHALL provide a "hide empty weeks" toggle (default off) that filters zero-run weeks out of the weekly time-series charts client-side, without refetching. The dashboard SHALL also provide a date-range control that sets the `from`/`to` passed to the stats endpoints so all cards and charts scope to the selected window; this range is independent of the Log tab's filters, and clearing it returns the dashboard to all-time.

#### Scenario: Dashboard renders aggregated data

- **WHEN** the dashboard is shown and the stats endpoints return data
- **THEN** the summary cards display the computed totals and average pace, and the weekly-mileage, pace-trend, and run-type charts render from the endpoint data

#### Scenario: Date range scopes the dashboard

- **WHEN** the user selects a date range on the dashboard
- **THEN** the cards and charts refetch and reflect only runs within that range, and clearing the range returns the dashboard to all-time

#### Scenario: Hide empty weeks toggle

- **WHEN** the user enables the "hide empty weeks" toggle
- **THEN** weeks with zero runs are removed from the weekly-mileage and pace-trend charts without a network refetch, and disabling the toggle restores the full zero-filled series

#### Scenario: Empty state

- **WHEN** the dashboard is shown and there are no runs
- **THEN** each chart and the summary area show a graceful empty state (e.g. "No runs yet") rather than blank or broken charts

#### Scenario: Responsive layout

- **WHEN** the dashboard is viewed below the medium breakpoint
- **THEN** its content stacks into a single column within the existing shell
