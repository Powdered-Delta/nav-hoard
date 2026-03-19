## ADDED Requirements

### Requirement: Local editor SHALL support entry metadata controls for featured and hidden states
The system SHALL allow the local editor to view and edit entry-level `featured`, `featured_rank`, and `hide` metadata as part of normal manual maintenance.

#### Scenario: Toggle featured state in the editor
- **WHEN** the user marks or unmarks an entry as featured in the local editor
- **THEN** the editor updates the entry draft to reflect `featured` state and preserves a usable featured order value when needed

#### Scenario: Toggle hidden state in the editor
- **WHEN** the user marks or unmarks an entry as hidden in the local editor
- **THEN** the editor updates the entry draft to reflect the `hide` state before save

### Requirement: Local editor SHALL support preview image upload and preview metadata editing
The system SHALL allow the local editor to upload preview images into the project publish tree and edit the preview metadata used by NavHoard entries.

#### Scenario: Upload a local preview image
- **WHEN** the user uploads an image from the local editor
- **THEN** the system stores the file under `public/images/previews/` and updates the current entry draft with a usable preview source

#### Scenario: Edit preview metadata manually
- **WHEN** the user edits preview enablement, mode, source, or alt text in the local editor
- **THEN** the current entry draft reflects those preview metadata changes before save

### Requirement: Local editor SHALL support host and port customization for local or LAN access
The system SHALL allow the local editor service to run on a user-specified host and port so it can be accessed beyond the default localhost address when needed.

#### Scenario: Run editor on a custom host
- **WHEN** the user starts the editor with a host override such as `--host 0.0.0.0`
- **THEN** the editor service binds to the requested host and reports a browser-accessible address

#### Scenario: Run editor on a custom port
- **WHEN** the user starts the editor with a port override
- **THEN** the editor service listens on the requested port instead of the default editor port

### Requirement: Local editor SHALL support bulk maintenance actions on filtered results
The system SHALL allow the local editor to filter the current entry list, select multiple matching entries, and perform bulk deletion on the selected subset.

#### Scenario: Filter to featured entries only
- **WHEN** the user activates the editor's featured-only filter
- **THEN** the list view shows only entries currently marked as featured

#### Scenario: Delete multiple selected entries
- **WHEN** the user enters bulk mode, selects one or more entries from the current filtered result set, and confirms deletion
- **THEN** the editor removes the selected entries from the working list before the next save
