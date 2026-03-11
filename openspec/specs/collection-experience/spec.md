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
