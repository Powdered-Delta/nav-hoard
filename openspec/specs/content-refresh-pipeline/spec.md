## Purpose

Define the manual content refresh workflow that fetches source material, normalizes and validates entries, and writes frontend-compatible output files.

## Requirements

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

### Requirement: Refresh pipeline SHALL normalize optional preview image metadata
The tool SHALL accept optional preview image metadata, normalize it with the rest of the entry payload, and keep it consistent across canonical and publish outputs.

#### Scenario: Captured page exposes an Open Graph image
- **WHEN** a captured page contains preview image metadata such as `og:image` or `twitter:image`
- **THEN** the pipeline stores a normalized preview image payload on the draft result

#### Scenario: User provides a local preview asset path
- **WHEN** an entry draft specifies a local preview asset path for a repository-hosted image
- **THEN** the pipeline stores the path in normalized local-preview form instead of converting it to an invalid external URL

#### Scenario: Preview metadata is invalid
- **WHEN** the preview payload is disabled or missing a usable source
- **THEN** the pipeline omits the preview payload from the final entry instead of writing broken metadata
