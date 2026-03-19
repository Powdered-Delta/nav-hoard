## ADDED Requirements

### Requirement: Homepage SHALL provide local favorite maintenance tools
The system SHALL provide explicit local-favorite maintenance actions so users can understand, back up, and move their favorites without relying on remote storage.

#### Scenario: First favorite opens local-storage reminder
- **WHEN** the user adds the first favorite and the reminder has not been permanently dismissed
- **THEN** the system displays a reminder that favorites are stored only in the current browser and offers dismiss actions

#### Scenario: Export favorites from current browser
- **WHEN** the user activates the favorite export action and at least one favorite exists
- **THEN** the system downloads a portable favorites backup derived from the current browser-local favorite state

#### Scenario: Import favorites into current browser
- **WHEN** the user selects a valid exported favorites file
- **THEN** the system imports matching favorites into the current browser-local state and keeps unmatched items out of the active favorite list

### Requirement: Homepage SHALL support lightweight sharing and reuse actions
The system SHALL provide card-level actions for copying a public link and copying a normalized entry payload for reuse in another NavHoard workflow.

#### Scenario: Copy public link for an entry
- **WHEN** the user activates the copy-link action on a card
- **THEN** the system writes the entry URL to the clipboard and shows a success or failure notice

#### Scenario: Copy normalized entry payload for reuse
- **WHEN** the user activates the copy-entry action on a card
- **THEN** the system writes a normalized entry JSON payload to the clipboard and preserves usable preview metadata for downstream reuse

### Requirement: Homepage SHALL support hidden entries gated by an unlock sequence
The system SHALL hide entries marked as hidden from normal discovery views until the user completes the configured unlock sequence.

#### Scenario: Hidden entries stay excluded by default
- **WHEN** an entry is marked as hidden and the unlock sequence has not been completed
- **THEN** the system excludes that entry from result lists, tag counts, featured calculations, and visible totals

#### Scenario: Unlock sequence reveals hidden entries
- **WHEN** the user completes the configured unlock key sequence
- **THEN** the system reveals hidden entries in the homepage experience and persists the unlocked state for later visits in the same browser

## MODIFIED Requirements

### Requirement: Homepage SHALL support switchable result layouts
The system SHALL let the user switch between the currently supported homepage layouts for the main result set.

#### Scenario: Switch to waterfall layout
- **WHEN** the user selects the waterfall layout
- **THEN** the system renders entries in the masonry-style multi-column presentation used by the current homepage

#### Scenario: Switch to list layout
- **WHEN** the user selects the list layout
- **THEN** the system renders one entry per row in a denser list presentation

## REMOVED Requirements

### Requirement: Homepage SHALL support collapsible featured recommendations
**Reason**: The homepage no longer models featured content as a separate collapsible block. Featured entries are surfaced through the main result flow using featured metadata and ordering.
**Migration**: Replace this requirement with one that describes featured-entry surfacing within the main result experience.

## ADDED Requirements

### Requirement: Homepage SHALL surface featured entries within the main result flow
The system SHALL surface featured entries inside the main result experience when the default discovery view is active and no additional filters are narrowing the list.

#### Scenario: Featured entries appear ahead of regular results in default browsing
- **WHEN** the user is in the default all-items view without active search or tag filters and featured entries exist
- **THEN** the system places featured entries ahead of regular entries according to featured ordering while keeping them in the same overall result flow

#### Scenario: Featured entries stop floating above filtered results
- **WHEN** the user applies a search query, switches to favorites, or adds tag filters
- **THEN** the system stops giving featured entries a special surfaced position and treats them as normal matching results
