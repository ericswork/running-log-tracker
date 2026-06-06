## MODIFIED Requirements

### Requirement: Run list view

The frontend SHALL display all runs newest-first using data fetched with TanStack React Query. Each run in the list SHALL expose an edit control and a delete control for that run.

#### Scenario: Runs displayed newest first

- **WHEN** the run list view loads and runs exist
- **THEN** the runs are displayed ordered from newest to oldest

#### Scenario: Each run offers edit and delete controls

- **WHEN** the run list view displays a run
- **THEN** that run presents controls to edit it and to delete it

## ADDED Requirements

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
