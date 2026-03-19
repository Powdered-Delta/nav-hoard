## Purpose

Define the homepage interaction requirements for discovery, guidance, empty-state recovery, favorite maintenance, featured surfacing, hidden-entry access, and safe local persistence.

## Requirements

### Requirement: Homepage SHALL provide inline about guidance
The system SHALL provide an `About` entry on the homepage that explains collection rules, update workflow, and storage behavior without leaving the current page.

#### Scenario: Open and close About content
- **WHEN** the user activates the `About` control
- **THEN** the system displays inline guidance about what the site collects, how data is updated, and how favorites are stored

#### Scenario: Dismiss About content
- **WHEN** the user closes the `About` content
- **THEN** the system hides the guidance and returns focus to the homepage controls

### Requirement: Homepage SHALL distinguish empty-state causes
The system SHALL render different empty-state messages and recovery actions for search/filter misses and empty favorites.

#### Scenario: Search or tag filter returns no results
- **WHEN** the current query or selected tags produce zero matching entries in the `all` view
- **THEN** the system displays a "未找到匹配内容" style message and offers an action to clear active filters

#### Scenario: Favorites view has no saved items
- **WHEN** the user switches to the favorites view and no favorites are stored
- **THEN** the system displays a favorites-empty message and offers an action to return to the full list

### Requirement: Favorite persistence SHALL fail safely
The system SHALL handle favorite persistence failures without leaving the UI in an inconsistent state.

#### Scenario: Storage quota is exceeded
- **WHEN** saving favorites throws a quota-related storage error
- **THEN** the system reverts the attempted favorite toggle and shows a user-facing message explaining that storage is full

#### Scenario: Storage write fails for another reason
- **WHEN** saving favorites throws a non-quota error
- **THEN** the system reverts the attempted favorite toggle and shows a generic storage failure message

### Requirement: Homepage SHALL keep discovery controls compact and reachable
The system SHALL keep search and filtering controls within easy reach during browsing, while allowing users to collapse dense control panels when they want to focus on content.

#### Scenario: Collapse and reopen discovery controls
- **WHEN** the user toggles the discovery controls section
- **THEN** the system collapses the detailed controls into a compact summary bar and allows the user to reopen them without losing current filters

#### Scenario: Keep controls reachable while scrolling
- **WHEN** the user scrolls through the homepage
- **THEN** the system keeps the compact discovery controls in a sticky position so search and layout actions remain available

#### Scenario: Return to top from deep browsing
- **WHEN** the user has scrolled far away from the top of the page
- **THEN** the system offers an explicit return-to-top action

### Requirement: Homepage SHALL support switchable result layouts
The system SHALL let the user switch between the currently supported homepage layouts for the main result set.

#### Scenario: Switch to waterfall layout
- **WHEN** the user selects the waterfall layout
- **THEN** the system renders entries in the masonry-style multi-column presentation used by the current homepage

#### Scenario: Switch to list layout
- **WHEN** the user selects the list layout
- **THEN** the system renders one entry per row in a denser list presentation

### Requirement: Homepage SHALL render optional preview images safely
The system SHALL display preview images when an entry provides valid preview metadata, while remaining fully usable when no image is available.

#### Scenario: Entry has preview metadata
- **WHEN** an entry includes enabled preview metadata with a usable image source
- **THEN** the system renders the preview image in the selected layout and uses the provided fallback text when available

#### Scenario: Entry has no preview metadata
- **WHEN** an entry does not include preview metadata
- **THEN** the system renders the entry without a broken image placeholder

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

### Requirement: Homepage SHALL surface featured entries within the main result flow
The system SHALL surface featured entries inside the main result experience when the default discovery view is active and no additional filters are narrowing the list.

#### Scenario: Featured entries appear ahead of regular results in default browsing
- **WHEN** the user is in the default all-items view without active search or tag filters and featured entries exist
- **THEN** the system places featured entries ahead of regular entries according to featured ordering while keeping them in the same overall result flow

#### Scenario: Featured entries stop floating above filtered results
- **WHEN** the user applies a search query, switches to favorites, or adds tag filters
- **THEN** the system stops giving featured entries a special surfaced position and treats them as normal matching results
