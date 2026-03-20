## Why

NavHoard currently hardcodes most UI strings in Chinese across both the homepage and the local editor. Now that the editor has a maintainable Lit client, it is a good moment to add a lightweight i18n foundation before more UI copy and workflow guidance accumulates.

## What Changes

- Add a lightweight localization runtime for UI chrome, notices, labels, and workflow copy without introducing a full i18n framework yet.
- Support at least `zh-CN` and `en` locale catalogs, with browser-locale detection, fallback behavior, and a persisted manual override.
- Apply the i18n layer to the homepage and the local editor UI while keeping entry content itself unchanged.
- Keep formatting concerns such as counts, dates, and message interpolation inside the localization layer so later migration to a heavier framework stays possible.

## Capabilities

### New Capabilities
- `localization-runtime`: Define locale catalogs, locale selection, fallback, persistence, and UI string formatting for NavHoard surfaces.

### Modified Capabilities
- `collection-experience`: Homepage UI controls, notices, empty states, and helper copy become locale-aware and user-switchable.
- `interactive-entry-workflow`: The local editor UI, status messages, and maintenance actions become locale-aware while preserving the current workflows.

## Impact

- Affected code: `src/nav-hoard.ts`, `tools/navhoard-cli/src/editor-app.ts`, and new shared i18n helper/catalog modules
- Affected UX: homepage and editor UI chrome gain locale switching and locale-aware copy while entry data remains untouched
- Affected dependencies: no new i18n framework is required for the first phase; the change should rely on a thin internal runtime plus built-in `Intl`
