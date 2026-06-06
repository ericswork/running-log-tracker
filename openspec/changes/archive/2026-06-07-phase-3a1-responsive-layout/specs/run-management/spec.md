## MODIFIED Requirements

### Requirement: Run entry form

The frontend SHALL provide a form to create a run capturing distance, duration, start date, start time of day (as a separate input from the date), run type (selected from the allowed set), and optional notes. The date and time inputs SHALL be combined into a single ISO 8601 date-time when submitted to the API. On successful submission the new run SHALL appear in the run list without a full page reload. The form SHALL be presented responsively: shown inline on wider viewports, and on small viewports opened on demand via an "Add run" control into a dialog overlay that closes automatically on successful creation.

#### Scenario: Submitting the form creates a run

- **WHEN** a user fills in valid run details and submits the form
- **THEN** the run is created via the API and the run list updates to include it

#### Scenario: Run type restricted to allowed values

- **WHEN** a user selects a run type in the form
- **THEN** only the allowed run types are selectable

#### Scenario: Add-run control opens the form on small viewports

- **WHEN** a user activates the "Add run" control on a small viewport
- **THEN** the run-entry form opens in a dialog overlay

#### Scenario: Creating a run from the overlay closes it

- **WHEN** a user creates a run from the dialog overlay
- **THEN** the run is created, the run list updates without a full page reload, and the overlay closes
