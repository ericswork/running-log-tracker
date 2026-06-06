## MODIFIED Requirements

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
