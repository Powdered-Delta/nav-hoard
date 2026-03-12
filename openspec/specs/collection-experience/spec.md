## Purpose

Define the homepage interaction requirements for discovery, guidance, empty-state recovery, and safe local favorite persistence.

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

### Requirement: Homepage SHALL support collapsible featured recommendations
The system SHALL allow the author-recommended section to be collapsed into a low-noise summary state.

#### Scenario: Collapse featured recommendations
- **WHEN** featured entries are available and the user collapses the featured section
- **THEN** the system hides the featured cards, keeps a compact summary header visible, and preserves the current page state

### Requirement: Homepage SHALL support switchable result layouts
The system SHALL let the user switch between a default stream layout, a card grid layout, and a single-row list layout for the main result set.

#### Scenario: Switch to stream layout
- **WHEN** the user selects the stream layout
- **THEN** the system renders entries in the default feed-style presentation

#### Scenario: Switch to card layout
- **WHEN** the user selects the card layout
- **THEN** the system renders entries in the existing multi-card grid presentation

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
