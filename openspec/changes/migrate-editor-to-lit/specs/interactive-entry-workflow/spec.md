## MODIFIED Requirements

### Requirement: Local editor SHALL provide a visual maintenance entry
The system SHALL provide a local browser-based editor that reads from and writes to the canonical data source for manual maintenance, with the editor interface delivered by a dedicated Lit-based client runtime served by the local editor service.

#### Scenario: Open local editor
- **WHEN** the user runs the local edit command
- **THEN** the system starts a local editor service and loads the current canonical entry list in a browser-accessible page

#### Scenario: Boot the Lit editor client
- **WHEN** the browser receives the editor page from the local editor service
- **THEN** the page boots the Lit editor client and hydrates the maintenance interface from the current canonical dataset

#### Scenario: Save edited entries
- **WHEN** the user edits entries and clicks save
- **THEN** the system validates, normalizes, deduplicates, and writes the resulting entries through the shared write path

#### Scenario: Sync URL into entry draft
- **WHEN** the user creates a new local entry, fills in a URL, and clicks sync
- **THEN** the system attempts to capture the target page and auto-fills available title, summary, tags, and source fields before save
