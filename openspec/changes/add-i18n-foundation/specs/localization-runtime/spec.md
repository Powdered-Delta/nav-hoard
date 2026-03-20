## ADDED Requirements

### Requirement: UI surfaces SHALL use a shared localization runtime
The system SHALL provide a shared localization runtime for UI chrome so the homepage and the local editor can render locale-specific labels, helper copy, notices, and action text from catalog keys instead of hardcoded literals.

#### Scenario: Resolve a supported locale catalog
- **WHEN** a UI surface initializes with a supported locale
- **THEN** the localization runtime resolves strings from that locale catalog for visible UI text

#### Scenario: Fall back for unsupported locale input
- **WHEN** the current locale preference is unsupported or incomplete
- **THEN** the localization runtime falls back to the configured default locale instead of leaving keys or mixed placeholders visible

### Requirement: Localization runtime SHALL support browser detection and persisted manual override
The system SHALL choose an initial locale from the browser when possible and allow the user to manually override that locale for later visits in the same browser.

#### Scenario: Detect a supported browser locale
- **WHEN** the browser reports a supported locale and the user has not saved a manual preference
- **THEN** the runtime initializes the UI in that supported locale

#### Scenario: Persist a manual locale choice
- **WHEN** the user switches the UI to another supported locale
- **THEN** the runtime stores that preference locally and reuses it after reload

### Requirement: Localization runtime SHALL support interpolation and locale-aware formatting
The system SHALL support parameterized strings and locale-aware formatting for counts, dates, and similar UI values without forcing callers to assemble translated sentences manually.

#### Scenario: Render a count-based UI message
- **WHEN** a UI message includes a dynamic count such as visible entry totals or favorite totals
- **THEN** the localization runtime returns a locale-appropriate formatted string using the translated message template

#### Scenario: Render locale-aware date or time labels
- **WHEN** a UI surface needs to show a formatted date or time label through the localization layer
- **THEN** the runtime uses locale-aware formatting instead of hardcoded date text

### Requirement: Localization runtime SHALL localize UI chrome only
The system SHALL localize interface text while leaving user-managed entry content unchanged unless a later capability explicitly expands the scope.

#### Scenario: Entry content remains unchanged across locale switch
- **WHEN** the user changes the UI locale
- **THEN** stored entry titles, summaries, tags, and other content fields remain as-authored while only interface text changes
