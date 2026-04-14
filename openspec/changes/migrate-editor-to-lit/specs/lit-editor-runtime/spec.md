## ADDED Requirements

### Requirement: Local editor SHALL load a dedicated Lit client runtime
The system SHALL serve the local editor as a browser-based Lit application instead of embedding the full editor logic inside a monolithic inline HTML script.

#### Scenario: Open editor shell
- **WHEN** the user runs the local editor command and opens the editor URL
- **THEN** the server returns an HTML shell that boots a dedicated browser module for the editor application

#### Scenario: Bootstrap Lit editor state
- **WHEN** the editor client starts
- **THEN** it fetches the current canonical entries and renders the interactive maintenance interface from client-side state

### Requirement: Local editor runtime SHALL preserve maintenance-safe client behavior
The Lit editor runtime SHALL preserve the current browser-side safeguards needed for manual maintenance work.

#### Scenario: Warn before accidental navigation
- **WHEN** the user has unsaved editor changes and attempts to close or reload the page
- **THEN** the editor warns the user before the browser leaves the current session

#### Scenario: Recover from local editor server restart
- **WHEN** the local editor server restarts or signals a client reload event
- **THEN** the editor reloads the page so the browser reflects the latest local editor code and data state

#### Scenario: Search and featured filters drive the active selection
- **WHEN** the user changes the editor search query or toggles the featured-only filter
- **THEN** the editor keeps the current selection only if it remains inside the current result set, otherwise it selects the first visible result, and clears selection when no result remains

#### Scenario: Clearing the final search keyword resets selection to the full list head
- **WHEN** the current search query changes from non-empty to empty
- **THEN** the editor refreshes the active selection to the first entry in the full visible list and scrolls the list to keep that selection in view

#### Scenario: Initial load selects the first visible entry
- **WHEN** the editor finishes loading the current canonical dataset and at least one entry is available
- **THEN** the editor selects the first entry in the current visible ordering and keeps the list aligned with that selection

#### Scenario: New or imported entries become the active editing target
- **WHEN** the user creates a new entry or imports a batch whose first entry becomes active
- **THEN** the editor selects that new active entry and scrolls the list so the current editing target remains visible

#### Scenario: Deleting the active entry falls back within the current visible result set
- **WHEN** the current active entry is removed and visible results still remain
- **THEN** the editor selects the first remaining entry in the current visible result set instead of preserving a stale selection

#### Scenario: Save preserves selection when possible and falls back within the visible result set
- **WHEN** the user saves edited entries and the previously active entry can still be matched in the refreshed dataset
- **THEN** the editor restores that same active entry after save

#### Scenario: Save falls back when the previous active entry is no longer visible
- **WHEN** the user saves edited entries and the previous active entry cannot be restored in the current visible result set
- **THEN** the editor selects the first visible entry when one exists, or clears the selection when no visible result remains

### Requirement: Local editor runtime SHALL honor shared theme layering
The Lit editor runtime SHALL continue to use the shared style foundation and the project-level custom override entry so the editor remains visually aligned with the rest of the project.

#### Scenario: Shared base and custom styles are loaded
- **WHEN** the editor page is rendered
- **THEN** it loads the shared base stylesheet and the project custom stylesheet before applying editor-private layout styling

#### Scenario: Custom theme override affects the editor
- **WHEN** the project custom stylesheet changes visual tokens used by the editor
- **THEN** the Lit editor reflects those overrides without requiring a separate editor-only theme entry
