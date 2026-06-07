## ADDED Requirements

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
