# app-shell Specification

## Purpose

Define the frontend application shell — a consistent header and main content region housing the run-management UI — and user-facing light/dark theming.

## Requirements

### Requirement: Application shell and layout

The frontend SHALL render the application within a consistent shell composed of a header region and a main content region, styled using the adopted UI component system (shadcn/ui + Tailwind). The main content region SHALL be responsive: at the medium breakpoint and wider it SHALL present **two columns** — the run-entry form on the left and the run list on the right, with the run-list column wider than the form column; below the medium breakpoint it SHALL present a **single column** that leads with the run list and does not show the inline run-entry form.

#### Scenario: App renders within the shell

- **WHEN** the application loads
- **THEN** a header region and a main content region are rendered, with the run list inside the main content region

#### Scenario: Two-column layout on wider viewports

- **WHEN** the application is viewed at the medium breakpoint or wider
- **THEN** the main content region shows two columns with the run-entry form on the left and the run list on the right, and the run-list column is wider than the form column

#### Scenario: Single-column layout on small viewports

- **WHEN** the application is viewed below the medium breakpoint
- **THEN** the main content region shows a single column that leads with the run list and does not display the inline run-entry form

### Requirement: Light and dark theming

The frontend SHALL support light and dark themes with a user-facing toggle in the application shell. The selected theme SHALL persist across page reloads. When the user has made no explicit choice, the theme SHALL follow the operating system / browser preference.

#### Scenario: User toggles the theme

- **WHEN** the user activates the theme toggle
- **THEN** the application switches between light and dark appearance

#### Scenario: Theme choice persists across reloads

- **WHEN** the user selects a theme and then reloads the page
- **THEN** the previously selected theme is applied

#### Scenario: Theme defaults to system preference

- **WHEN** the application loads and the user has not previously chosen a theme
- **THEN** the theme follows the operating system / browser color-scheme preference

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

### Requirement: Application branding

The application shell SHALL present a consistent visual brand: a brand accent color, a logo mark, and a branded page identity. A single brand accent color SHALL be applied through the theme tokens so that primary controls (buttons, selected toggles) and focus states use it, and the accent SHALL be defined for both the light and dark themes with legible contrast. The header SHALL display a logo mark alongside the "Running Log" title, with the mark colored by the brand accent and treated as decorative (the title provides the accessible name). The browser document SHALL use the title "Running Log" and a matching favicon.

#### Scenario: Header shows the title and logo mark

- **WHEN** the application loads
- **THEN** the header displays the "Running Log" title together with a logo mark

#### Scenario: Brand accent applies in both themes

- **WHEN** the application is viewed in either the light or the dark theme
- **THEN** primary controls and focus states use the brand accent color, with legible contrast in that theme

#### Scenario: Branded document identity

- **WHEN** the application is open in a browser
- **THEN** the browser tab shows the title "Running Log" and the app's favicon
