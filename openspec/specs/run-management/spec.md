# run-management Specification

## Purpose

Manage running-log entries: persisting runs in canonical units, validating run data, exposing CRUD endpoints, and providing the frontend run-entry form and run list view.

## Requirements

### Requirement: Run data model

The system SHALL persist a run as a record with the following fields: a unique identifier, distance in kilometers (number), duration in total seconds (integer), start date-and-time (ISO 8601 DateTime that preserves the time of day the run started), run type (string), and optional notes (string). Distance and duration MUST be stored in their canonical units; unit conversion for display is a presentation concern and MUST NOT change stored values. The stored start date-and-time MUST retain the submitted time of day and MUST NOT be normalized to midnight.

#### Scenario: Run is stored in canonical units

- **WHEN** a run is created with a distance and duration
- **THEN** the system stores distance as kilometers and duration as total seconds without converting them to other units

#### Scenario: Start time of day is preserved

- **WHEN** a run is created with a start date and a start time of day
- **THEN** the system stores a single date-and-time value that retains that time of day, not midnight

#### Scenario: Optional notes omitted

- **WHEN** a run is created without notes
- **THEN** the system stores the run with notes absent (null) and the operation succeeds

### Requirement: Run type validation

The system SHALL accept a run type only from the fixed allowed set: `Easy`, `Recovery`, `Tempo`, `Interval`, `Long Run`, `Race`. When run type is omitted on creation, the system SHALL default it to `Easy`. Any value outside the allowed set MUST be rejected.

#### Scenario: Valid run type accepted

- **WHEN** a run is created with run type `Tempo`
- **THEN** the system stores the run with run type `Tempo`

#### Scenario: Run type defaults to Easy

- **WHEN** a run is created without a run type
- **THEN** the system stores the run with run type `Easy`

#### Scenario: Invalid run type rejected

- **WHEN** a run is created or updated with a run type not in the allowed set
- **THEN** the system rejects the request with HTTP 400 and does not persist the run

### Requirement: Required field validation

The system SHALL require distance, duration, and start date-and-time on creation. Distance MUST be a positive number, duration MUST be a positive integer, and the start date-and-time MUST be a valid ISO 8601 date-time. Requests missing a required field or with an invalid value MUST be rejected.

#### Scenario: Missing required field rejected

- **WHEN** a run is created without a distance, duration, or start date-and-time
- **THEN** the system rejects the request with HTTP 400 and does not persist the run

#### Scenario: Non-positive distance or duration rejected

- **WHEN** a run is created with a distance or duration that is zero or negative
- **THEN** the system rejects the request with HTTP 400

### Requirement: Create run endpoint

The system SHALL expose an endpoint to create a run that, on success, persists the run and returns the created record including its identifier with HTTP 201.

#### Scenario: Run created successfully

- **WHEN** a client sends a valid create-run request
- **THEN** the system persists the run and responds with HTTP 201 and the created run including its id

### Requirement: List runs endpoint

The system SHALL expose an endpoint that returns all runs ordered by date descending (newest first).

#### Scenario: Runs returned newest first

- **WHEN** a client requests the list of runs and multiple runs exist
- **THEN** the system responds with HTTP 200 and the runs ordered by date from newest to oldest

#### Scenario: Empty list

- **WHEN** a client requests the list of runs and none exist
- **THEN** the system responds with HTTP 200 and an empty array

### Requirement: Get run by id endpoint

The system SHALL expose an endpoint that returns a single run by its identifier, and respond with HTTP 404 when no run with that identifier exists.

#### Scenario: Existing run returned

- **WHEN** a client requests a run by an identifier that exists
- **THEN** the system responds with HTTP 200 and the run

#### Scenario: Missing run

- **WHEN** a client requests a run by an identifier that does not exist
- **THEN** the system responds with HTTP 404

### Requirement: Update run endpoint

The system SHALL expose an endpoint to update an existing run. Updates MUST enforce the same validation rules as creation, and respond with HTTP 404 when the run does not exist.

#### Scenario: Run updated successfully

- **WHEN** a client sends a valid update for an existing run
- **THEN** the system persists the changes and responds with HTTP 200 and the updated run

#### Scenario: Update of missing run

- **WHEN** a client updates a run by an identifier that does not exist
- **THEN** the system responds with HTTP 404

### Requirement: Delete run endpoint

The system SHALL expose an endpoint to delete a run by its identifier, and respond with HTTP 404 when the run does not exist.

#### Scenario: Run deleted successfully

- **WHEN** a client deletes a run by an identifier that exists
- **THEN** the system removes the run and responds with a success status

#### Scenario: Delete of missing run

- **WHEN** a client deletes a run by an identifier that does not exist
- **THEN** the system responds with HTTP 404

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

### Requirement: Edit a run from the list

The frontend SHALL allow a user to edit an existing run directly from the run list. Activating the edit control SHALL present a form prefilled with that run's current values (distance, duration, start date, start time of day, run type, and notes), reusing the run-entry form's fields, run-type restriction, and date+time-of-day handling. Submitting the form SHALL update the run via the update endpoint and the run list SHALL reflect the saved values without a full page reload. The user SHALL be able to cancel editing without changing the run. Editing SHALL preserve the run's start time of day unless the user changes it.

#### Scenario: Editing a run prefills its current values

- **WHEN** a user activates the edit control for a run
- **THEN** a form appears prefilled with that run's distance, duration, start date, start time of day, run type, and notes

#### Scenario: Saving an edit updates the run in the list

- **WHEN** a user changes one or more fields in the edit form and submits it
- **THEN** the run is updated via the API and the run list displays the updated values without a full page reload

#### Scenario: Edit preserves start time of day

- **WHEN** a user edits a run without changing its start date or time-of-day fields and submits
- **THEN** the saved run retains its original start time of day, not midnight

#### Scenario: Cancelling an edit leaves the run unchanged

- **WHEN** a user opens the edit form for a run and then cancels
- **THEN** the run is not modified and the list continues to show its original values

#### Scenario: Run type restricted to allowed values when editing

- **WHEN** a user selects a run type in the edit form
- **THEN** only the allowed run types are selectable

### Requirement: Delete a run from the list

The frontend SHALL allow a user to delete a run from the run list. The delete action SHALL require an explicit confirmation before removing the run, to guard against accidental deletion. On confirmation, the run SHALL be deleted via the delete endpoint and removed from the list without a full page reload. If the user declines the confirmation, the run SHALL NOT be deleted.

#### Scenario: Deleting a run requires confirmation

- **WHEN** a user activates the delete control for a run
- **THEN** the user is asked to confirm before the run is deleted

#### Scenario: Confirmed deletion removes the run

- **WHEN** a user confirms deletion of a run
- **THEN** the run is deleted via the API and removed from the run list without a full page reload

#### Scenario: Declined deletion keeps the run

- **WHEN** a user activates the delete control for a run and then declines the confirmation
- **THEN** the run is not deleted and remains in the list

### Requirement: Automated regression test coverage

The run-management API SHALL be covered by an automated test suite that verifies its documented scenarios, so that regressions are caught without manual testing. The suite MUST run against an isolated test database that does not affect development data.

#### Scenario: API endpoints verified by integration tests

- **WHEN** the server test suite runs
- **THEN** it exercises create, list, get-by-id, update, and delete against the documented status codes (201/200/204/400/404), newest-first ordering, the default run type, and start time-of-day preservation, and all assertions pass

#### Scenario: Validation rules verified by unit tests

- **WHEN** the schema and validation-helper unit tests run
- **THEN** they assert the run-type default, rejection of invalid run types, enforcement of required fields, rejection of non-positive distance/duration, and acceptance of partial updates

#### Scenario: Tests are isolated from development data

- **WHEN** the test suite executes
- **THEN** it uses a dedicated test database separate from the development database, and development data is left unchanged
