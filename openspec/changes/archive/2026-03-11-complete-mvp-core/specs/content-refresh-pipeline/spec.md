## ADDED Requirements

### Requirement: Manual refresh pipeline SHALL ingest enabled source types
The `navhoard-cli` tool SHALL ingest every enabled source defined in `sources.yaml` for the supported source types (`rss` and `html`).

#### Scenario: Enabled RSS source is fetched
- **WHEN** an enabled RSS source is configured
- **THEN** the tool fetches the feed and converts its items into candidate navigation entries

#### Scenario: Enabled HTML source is fetched
- **WHEN** an enabled HTML source with selectors is configured
- **THEN** the tool fetches the page, extracts matching items, and converts them into candidate navigation entries

### Requirement: Refresh pipeline SHALL normalize and validate output entries
The tool SHALL normalize URLs, deduplicate entries by normalized identity, and validate the final output against the navigation entry schema before writing files.

#### Scenario: Duplicate entries are merged
- **WHEN** multiple candidates resolve to the same normalized URL identity
- **THEN** the tool keeps the newest content and merges tags without duplicates

#### Scenario: Invalid entry is rejected
- **WHEN** a candidate entry is missing required fields or violates schema constraints
- **THEN** the tool excludes the invalid entry from output and reports the validation failure in the console summary

### Requirement: Refresh pipeline SHALL support manifest-based sharding
The tool SHALL write a single `index.json` for smaller datasets and SHALL generate `manifest.json` plus shard files when the entry count exceeds the sharding threshold.

#### Scenario: Dataset stays under threshold
- **WHEN** the validated entry count is less than or equal to the sharding threshold
- **THEN** the tool writes only `index.json` in the output directory

#### Scenario: Dataset exceeds threshold
- **WHEN** the validated entry count is greater than the sharding threshold
- **THEN** the tool writes `manifest.json` and grouped shard files that the frontend can resolve

### Requirement: Refresh pipeline SHALL support preview execution
The tool SHALL support a dry-run mode that performs fetch, normalization, and validation without writing output files.

#### Scenario: Dry-run execution completes
- **WHEN** the user runs the tool with `--dry-run`
- **THEN** the tool prints counts and warnings for the computed output without modifying files
