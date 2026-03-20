## ADDED Requirements

### Requirement: Local editor SHALL expose a locale switcher for interface language
The system SHALL provide a local editor control that lets the user switch between supported interface locales without restarting the editor service.

#### Scenario: Switch editor locale manually
- **WHEN** the user selects another supported locale from the editor UI
- **THEN** the editor rerenders its interface text in the selected locale and stores that preference for later visits

### Requirement: Local editor SHALL render maintenance UI text through the localization runtime
The system SHALL render editor labels, buttons, helper text, status messages, empty states, and maintenance notices through the shared localization runtime.

#### Scenario: Editor status messages change with locale
- **WHEN** the editor reports save, sync, import, upload, or validation status in another supported locale
- **THEN** the visible status message is rendered in the active locale

#### Scenario: Editor controls change with locale
- **WHEN** the user changes the editor locale
- **THEN** the editor's visible control labels and helper copy rerender in the selected locale while preserving the current editing state
