# frontend-testing Specification

## Purpose

Define the client-side automated component-test harness and the run-management UI behaviors it must cover.

## Requirements

### Requirement: Frontend automated test harness

The client SHALL have an automated component-test harness (Vitest + React Testing Library running in a jsdom environment) runnable via a `test` script in the client package. Tests SHALL render components with the application's data-fetching provider (TanStack React Query) via a shared test helper, and SHALL mock the runs API module so tests run without a live backend.

#### Scenario: Client test script runs the component suite

- **WHEN** the client `test` script is run
- **THEN** Vitest executes the component tests in a jsdom environment and reports pass/fail results

#### Scenario: Tests run without a backend

- **WHEN** a component test renders a component that fetches or mutates runs
- **THEN** the runs API module is mocked so no real network request is made

### Requirement: Run-management UI test coverage

The frontend test harness SHALL cover the run-management UI behaviors introduced or changed in this phase: data-table sorting, the edit flow, and the delete confirmation flow.

#### Scenario: Table sorting is covered

- **WHEN** the run-management UI test suite runs
- **THEN** it asserts that sorting the run table by a column reorders the displayed runs

#### Scenario: Edit flow is covered

- **WHEN** the run-management UI test suite runs
- **THEN** it asserts that activating edit opens a form prefilled with the run's values and that saving submits an update

#### Scenario: Delete confirmation flow is covered

- **WHEN** the run-management UI test suite runs
- **THEN** it asserts that confirming a delete removes the run and that declining the confirmation makes no delete request
