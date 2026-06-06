## ADDED Requirements

### Requirement: Tabbed navigation between log and dashboard

The application shell SHALL provide a tabbed navigation control switching between two views — **Log** and **Dashboard** — with **Log** as the default. The Log tab SHALL render the existing run-entry form and run list (the current behavior and responsive layout) unchanged. The Dashboard tab SHALL render the analytics dashboard. Tab selection SHALL be client-side state with no URL routing.

#### Scenario: Default tab is Log

- **WHEN** the application loads
- **THEN** the Log tab is active and the run-entry form and run list are shown as before

#### Scenario: Switching to the Dashboard tab

- **WHEN** the user selects the Dashboard tab
- **THEN** the analytics dashboard is shown in the main content region

#### Scenario: Switching back to the Log tab

- **WHEN** the user selects the Log tab after viewing the Dashboard
- **THEN** the run-entry form and run list are shown with their existing layout and behavior intact
