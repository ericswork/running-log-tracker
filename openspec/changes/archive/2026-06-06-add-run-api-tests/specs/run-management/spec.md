## ADDED Requirements

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
