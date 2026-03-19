## ADDED Requirements

### Requirement: Content pipeline SHALL support reusable single-entry capture
The content pipeline SHALL expose a reusable single-entry capture path that accepts one URL, fetches and extracts page content, and returns a normalized draft without immediately writing data.

#### Scenario: Single-entry draft is generated
- **WHEN** the single-entry capture path receives a valid URL
- **THEN** it returns a normalized draft containing URL, title, summary, tags, source, and capture status fields

#### Scenario: Single-entry capture reports structured failure
- **WHEN** the single-entry capture path cannot complete extraction
- **THEN** it returns a structured failure result with the URL and an explicit failure reason

### Requirement: Content pipeline SHALL support confirmed single-entry write
The content pipeline SHALL support writing a user-confirmed single entry through the same normalization, deduplication, and validation process used by batch updates.

#### Scenario: Confirmed entry is written through shared write path
- **WHEN** the user confirms a reviewed entry draft
- **THEN** the system normalizes the final fields, merges duplicates if needed, validates the result, and writes the entry using the shared data output path

#### Scenario: Confirmed entry fails validation
- **WHEN** the user-confirmed entry still violates schema requirements
- **THEN** the system refuses to write the entry and reports the invalid fields back to the user

### Requirement: Content pipeline SHALL preserve a single canonical write path
The system SHALL use one canonical content write path for both batch updates and confirmed single-entry writes.

#### Scenario: Batch update and single-entry write share the same abstraction
- **WHEN** either workflow reads or writes content data
- **THEN** it goes through the same path abstraction instead of duplicating file target logic in multiple places
