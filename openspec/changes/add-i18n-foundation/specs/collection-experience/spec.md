## ADDED Requirements

### Requirement: Homepage SHALL expose a locale switcher for interface language
The system SHALL provide a homepage control that lets the user switch between supported interface locales without leaving the page.

#### Scenario: Switch homepage locale manually
- **WHEN** the user selects another supported locale from the homepage locale control
- **THEN** the homepage rerenders its interface text in the selected locale and stores that preference for later visits

### Requirement: Homepage SHALL render interface text through the localization runtime
The system SHALL render homepage controls, helper copy, notices, empty states, and other interface chrome through the shared localization runtime.

#### Scenario: Empty-state copy changes with locale
- **WHEN** the user views a homepage empty state in a different supported locale
- **THEN** the empty-state message and recovery action labels appear in that locale

#### Scenario: Notice copy changes with locale
- **WHEN** the homepage shows a toast or notice after actions such as favorite, import, export, or copy
- **THEN** the visible notice text is rendered in the active locale
