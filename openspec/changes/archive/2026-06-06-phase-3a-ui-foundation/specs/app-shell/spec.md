## ADDED Requirements

### Requirement: Application shell and layout

The frontend SHALL render the application within a consistent shell composed of a header region and a main content region. The run entry form and run list SHALL be presented within the main content region. The shell SHALL be styled using the adopted UI component system (shadcn/ui + Tailwind).

#### Scenario: App renders within the shell

- **WHEN** the application loads
- **THEN** a header region and a main content region are rendered, with the run entry form and run list inside the main content region

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
