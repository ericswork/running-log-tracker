## MODIFIED Requirements

### Requirement: Run list view

The frontend SHALL display runs in a data table using data fetched with TanStack React Query, showing one server-provided page at a time of a fixed 10 runs per page. The table SHALL default to newest-first (date descending) ordering and SHALL allow the user to sort by date, distance, duration, and run type, with sorting performed server-side (the chosen column and direction drive the request, not an in-memory re-sort). Below the table the view SHALL provide a pagination bar with three sections: a "page X of Y" indicator derived from the total count, numbered page buttons, and previous/next controls (disabled at the respective bounds). On narrow (mobile) widths the numbered page buttons MAY be hidden so the bar shows only the indicator and previous/next; the numbered buttons SHALL be shown on wider screens. On narrow (mobile) widths a compact pagination bar (indicator + previous/next) MAY additionally appear above the table so paging does not require scrolling past the whole list. The view SHALL return to the first page whenever the filters or the sort change. When the page count is large the numbered buttons SHALL be windowed around the current page with an ellipsis collapsing the omitted pages, always including the first and last page so those buttons double as jump-to-first and jump-to-last; the current page SHALL be marked and SHALL not act as a navigation target. When the current page becomes empty after a run is deleted (its offset falls beyond the reduced total), the view SHALL clamp back to the last non-empty page rather than display an empty page. Each row SHALL expose an edit control and a delete control for that run.

#### Scenario: Runs displayed newest first by default

- **WHEN** the run list table loads and runs exist
- **THEN** the first page of up to 10 runs is displayed ordered from newest to oldest

#### Scenario: User sorts the table by a column

- **WHEN** the user activates sorting on the date, distance, duration, or run type column
- **THEN** the table requests that column and direction from the server and displays the first page of the re-sorted runs

#### Scenario: User pages through the runs

- **WHEN** the user activates the next or previous control
- **THEN** the table fetches and displays the adjacent page, and the controls are disabled at the first/last page

#### Scenario: User jumps to a specific page

- **WHEN** the user activates a numbered page button
- **THEN** the table fetches and displays that page, which is then marked as current and is not itself a navigation target

#### Scenario: First and last page buttons jump to the ends

- **WHEN** the user activates the always-shown first-page or last-page numbered button
- **THEN** the table fetches and displays the first or last page respectively

#### Scenario: Numbered pages are windowed for large page counts

- **WHEN** the total spans more pages than can be shown at once
- **THEN** the numbered buttons show the first page, the last page, and a window around the current page, with an ellipsis standing in for the omitted pages

#### Scenario: Changing filters or sort resets to the first page

- **WHEN** the user changes a filter or the sort while not on the first page
- **THEN** the view returns to the first page of the new result

#### Scenario: Deleting the last run on the last page clamps to the previous page

- **WHEN** the user deletes the only run on the last page while not on the first page
- **THEN** the view clamps to the now-last non-empty page instead of showing an empty page

#### Scenario: Each row offers edit and delete controls

- **WHEN** the run list table displays a run
- **THEN** that row presents controls to edit it and to delete it
