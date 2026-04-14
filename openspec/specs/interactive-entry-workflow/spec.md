## Purpose

Define the requirements for single-link entry capture, reviewed confirmation, and local visual maintenance of the NavHoard canonical dataset.

## Requirements

### Requirement: Agent SHALL guide single-link entry capture
The system SHALL provide an interactive workflow in which the Agent asks the user for a URL, attempts to capture page content, and returns a reviewable entry draft before any data is written.

#### Scenario: Start capture from a user-provided URL
- **WHEN** the user invokes the interactive entry workflow and provides a URL
- **THEN** the system attempts to fetch and extract the target page content and prepares a structured draft for review

#### Scenario: Draft is shown before write
- **WHEN** the system finishes capture or fallback generation
- **THEN** it presents a structured template containing the candidate fields and waits for explicit user confirmation before writing data

### Requirement: Interactive workflow SHALL support failure fallback
The system SHALL return a usable fallback template even when content capture fails or only partially succeeds.

#### Scenario: Capture fails completely
- **WHEN** the system cannot fetch or parse the target URL
- **THEN** it returns a failure template with the URL, failure reason, and editable placeholder fields for manual completion

#### Scenario: Capture succeeds partially
- **WHEN** the system extracts only part of the expected content
- **THEN** it marks the draft as partial and still allows the user to edit and confirm the final entry

### Requirement: Interactive workflow SHALL require explicit confirmation before write
The system SHALL not write any entry until the user has reviewed and explicitly confirmed the final draft.

#### Scenario: User confirms reviewed entry
- **WHEN** the user submits the reviewed draft as the final version
- **THEN** the system proceeds to the shared confirmed-write path

#### Scenario: User has not confirmed the draft
- **WHEN** the draft is still under review or missing required fields
- **THEN** the system does not write data and instead asks the user to continue editing or confirm explicitly

### Requirement: Interactive workflow SHALL provide next-step guidance after write
After a confirmed entry is written, the system SHALL provide clear next-step guidance for local verification.

#### Scenario: Offer local verification after write
- **WHEN** the system successfully writes the confirmed entry
- **THEN** it returns suggested local verification steps or commands for the user to run next

### Requirement: Local editor SHALL provide a visual maintenance entry
The system SHALL provide a local browser-based editor that reads from and writes to the canonical data source for manual maintenance.

#### Scenario: Open local editor
- **WHEN** the user runs the local edit command
- **THEN** the system starts a local editor service and loads the current canonical entry list in a browser-accessible page

#### Scenario: Save edited entries
- **WHEN** the user edits entries and clicks save
- **THEN** the system validates, normalizes, deduplicates, and writes the resulting entries through the shared write path

#### Scenario: Sync URL into entry draft
- **WHEN** the user creates a new local entry, fills in a URL, and clicks sync
- **THEN** the system attempts to capture the target page and auto-fills available title, summary, tags, and source fields before save

### Requirement: Local editor SHALL support bookmark import
The system SHALL support importing browser bookmark HTML into the canonical data source through the shared normalization pipeline.

#### Scenario: Import bookmark HTML
- **WHEN** the user uploads a browser bookmark export file in the local editor
- **THEN** the system extracts bookmark links, converts them into entry drafts, merges duplicates, and saves the result through the shared write path

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
