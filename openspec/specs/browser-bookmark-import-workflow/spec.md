## Purpose

Define the requirements for importing browser bookmark exports into NavHoard through a reusable bookmark-to-draft workflow that stays compatible with the canonical save pipeline.

## Requirements

### Requirement: Browser bookmark import SHALL accept bookmark HTML exports as input
The system SHALL support importing browser bookmark export files in HTML format, and SHALL treat that HTML file as the canonical input boundary for the current bookmark import workflow.

#### Scenario: User selects a bookmark HTML file
- **WHEN** the user provides a browser bookmark export file in supported HTML format
- **THEN** the system reads the file and begins bookmark link extraction

#### Scenario: User provides a file without importable bookmark links
- **WHEN** the provided file does not contain any usable `http` or `https` bookmark links
- **THEN** the system MUST stop the import attempt and report that no importable bookmarks were found

### Requirement: Browser bookmark import SHALL extract only valid web links into entry drafts
The system SHALL parse bookmark export content, extract anchor links with usable `http` or `https` URLs, and skip unsupported or malformed links instead of creating invalid drafts.

#### Scenario: Bookmark file contains standard web links
- **WHEN** the bookmark export contains one or more `<a href>` links with `http` or `https` URLs
- **THEN** the system extracts those links and converts them into entry drafts

#### Scenario: Bookmark file contains unsupported link schemes
- **WHEN** the bookmark export contains links with unsupported schemes such as `javascript:`, `chrome:`, `file:`, or empty URLs
- **THEN** the system MUST skip those links during import

### Requirement: Browser bookmark import SHALL apply a minimal stable field mapping
The system SHALL map each imported bookmark link into a NavHoard draft using the bookmark URL, the anchor text as the preferred title, the hostname as the source, and generated timestamps when source timestamps are unavailable.

#### Scenario: Bookmark has anchor text
- **WHEN** an imported bookmark link has visible anchor text
- **THEN** the system uses that text as the initial draft title

#### Scenario: Bookmark source has no explicit metadata beyond the URL
- **WHEN** the imported bookmark does not provide summary, tags, preview, or source timestamps
- **THEN** the system creates a draft with empty summary and tags, derives the source from the URL hostname, and assigns current timestamps for `created_at` and `updated_at`

### Requirement: Browser bookmark import SHALL remain compatible with the canonical merge pipeline
The system SHALL feed imported bookmark drafts into the shared canonical normalization, deduplication, validation, and write pipeline instead of defining a separate final-write path.

#### Scenario: Imported bookmarks are saved to the collection
- **WHEN** imported bookmark drafts are accepted by the user and persisted
- **THEN** the system writes them through the shared canonical save path so normalization, duplicate merge, and publish output remain consistent with other workflows

#### Scenario: Imported bookmark duplicates existing content
- **WHEN** one or more imported bookmark URLs already exist in the canonical dataset after normalization
- **THEN** the shared pipeline merges duplicates instead of creating parallel duplicate entries

### Requirement: Browser bookmark import SHALL support editor-based review before persistence
The system SHALL allow imported bookmark drafts to be inserted into the local editor for inspection and further editing before the user saves them to the canonical dataset.

#### Scenario: Bookmark import succeeds inside the local editor
- **WHEN** the user imports a valid bookmark HTML file in the local editor
- **THEN** the system inserts the imported drafts into the editor state, selects the first imported draft, and marks the editor as having unsaved changes

#### Scenario: User wants to refine imported bookmarks before saving
- **WHEN** imported bookmark drafts appear in the local editor
- **THEN** the user can review and edit them before triggering the shared save workflow
