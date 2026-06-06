## MODIFIED Requirements

### Requirement: Run list view

The frontend SHALL display all runs in a data table using data fetched with TanStack React Query. The table SHALL default to newest-first (date descending) ordering and SHALL allow the user to sort by date, distance, duration, and run type. Each row SHALL expose an edit control and a delete control for that run.

#### Scenario: Runs displayed newest first by default

- **WHEN** the run list table loads and runs exist
- **THEN** the runs are displayed ordered from newest to oldest

#### Scenario: User sorts the table by a column

- **WHEN** the user activates sorting on the date, distance, duration, or run type column
- **THEN** the table reorders the runs by that column

#### Scenario: Each row offers edit and delete controls

- **WHEN** the run list table displays a run
- **THEN** that row presents controls to edit it and to delete it
