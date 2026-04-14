## Purpose

Define the batch import requirements for bringing Raindrop exports into the NavHoard canonical dataset through the shared normalization and publish pipeline.

## Requirements

### Requirement: Raindrop import SHALL accept both CSV files and export directories
The system SHALL allow the Raindrop import command to read either a direct CSV file path or a directory containing `export.csv`, and SHALL fail with a clear error when neither form resolves to a readable export file.

#### Scenario: Import from a CSV file path
- **WHEN** the user runs the import command with `--input` pointing to a valid Raindrop CSV file
- **THEN** the system reads that file as the import source

#### Scenario: Import from an export directory
- **WHEN** the user runs the import command with `--input` pointing to a directory that contains `export.csv`
- **THEN** the system resolves `export.csv` inside that directory and uses it as the import source

#### Scenario: Input path cannot be resolved
- **WHEN** the provided `--input` path does not exist or a directory does not contain `export.csv`
- **THEN** the system MUST stop the import and report a path-related error

### Requirement: Raindrop import SHALL map export rows into NavHoard entry drafts
The system SHALL convert each valid Raindrop row into a NavHoard draft using the row URL as the required key, while preserving useful source metadata for later normalization and merge.

#### Scenario: Row contains a URL
- **WHEN** a Raindrop export row contains a non-empty `url`
- **THEN** the system creates a draft with mapped title, summary, tags, source hostname, created time, updated time, and optional preview image metadata

#### Scenario: Row omits title or summary fields
- **WHEN** the Raindrop row lacks a usable title or note-like summary
- **THEN** the system uses the source hostname or URL as the title fallback and uses the available note/excerpt fields as summary fallback when present

#### Scenario: Row has no URL
- **WHEN** a Raindrop export row does not contain a usable `url`
- **THEN** the system MUST skip that row instead of creating an invalid draft

### Requirement: Raindrop import SHALL preserve source tags while allowing optional enhancement
The system SHALL keep the original Raindrop tags as the base tag set, merge in captured or LLM-suggested tags without duplicates, and keep enhancement behavior behind explicit import options.

#### Scenario: Import runs in no-fetch mode
- **WHEN** the user passes `--no-fetch`
- **THEN** the system imports drafts using only CSV-derived fields and original tags without attempting page capture

#### Scenario: Import runs with capture enabled
- **WHEN** the user runs the import command without `--no-fetch`
- **THEN** the system attempts to capture each URL, merges any captured title, summary, source, preview, and suggested tags into the draft, and keeps the original tags in the merged tag set

#### Scenario: Import runs with LLM enhancement enabled
- **WHEN** the user passes `--llm-enhance` and a valid LLM config is available
- **THEN** the system requests additional tags from the configured model and merges them with existing tags without overwriting the original Raindrop tags

#### Scenario: LLM enhancement is requested without a usable config
- **WHEN** the user passes `--llm-enhance` but the configured provider, endpoint, model, or API key is unavailable
- **THEN** the system falls back to non-LLM import behavior and reports that LLM enhancement was skipped

### Requirement: Raindrop favorite mapping SHALL remain opt-in
The system SHALL treat Raindrop favorite state as an optional source for NavHoard featured state, and SHALL only map it when the user explicitly enables that behavior.

#### Scenario: Favorite mapping is enabled
- **WHEN** the user passes `--featured-from-favorite` and a Raindrop row has `favorite=true`
- **THEN** the imported draft is marked as featured

#### Scenario: Favorite mapping is not enabled
- **WHEN** the user does not pass `--featured-from-favorite`
- **THEN** the system MUST NOT convert Raindrop favorite state into featured state during import

### Requirement: Raindrop import SHALL write through the canonical merge pipeline
The system SHALL write imported drafts through the shared canonical merge pipeline instead of directly writing final JSON, so URL normalization, validation, duplicate merging, and publish output stay consistent with other entry workflows.

#### Scenario: Valid drafts are imported
- **WHEN** one or more valid drafts are produced from the Raindrop source
- **THEN** the system passes them through the shared merge pipeline and writes the canonical dataset plus the published runtime data files

#### Scenario: Import produces no valid drafts
- **WHEN** all rows are skipped or invalid and no draft remains
- **THEN** the system MUST fail the import instead of writing an empty update

#### Scenario: Merge pipeline rejects invalid data
- **WHEN** canonical validation fails during merge
- **THEN** the system MUST stop the import and report the invalid messages returned by the merge pipeline

### Requirement: Raindrop import SHALL report a stable execution summary
The system SHALL report an execution summary after a successful run so users can verify how many rows were imported, enhanced, merged, and published.

#### Scenario: Import completes successfully
- **WHEN** the import command finishes without a fatal error
- **THEN** the system reports the import source, imported entry count, capture success count, LLM enhancement count, merged total, duplicate merge count, preview mapping count, featured mapping count, canonical output path, and written files
