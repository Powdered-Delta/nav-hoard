## Context

The homepage and the editor both contain a large number of hardcoded Chinese strings. That makes future non-Chinese usage, copy maintenance, and editor/homepage consistency harder than it needs to be. We already evaluated that a thin internal i18n layer is the best fit right now: it keeps the codebase lightweight, avoids locking us into a framework too early, and still leaves a clean migration path to something like `@lit/localize` later.

This change is intentionally about UI localization only. It does not attempt to translate entry content such as titles, summaries, sources, or tags.

## Goals / Non-Goals

**Goals:**
- Introduce a shared, lightweight i18n foundation for homepage and editor UI strings.
- Support browser-locale detection with a user-controlled override that persists locally.
- Add at least `zh-CN` and `en` catalogs for current UI chrome and workflow messages.
- Centralize interpolation and locale-aware formatting so future copy changes do not re-scatter strings through UI files.

**Non-Goals:**
- Translate entry data content or imported third-party content.
- Add a full external i18n framework in this phase.
- Localize README, specs, or CLI console output in the same change unless needed for product UX.
- Solve every future copy governance question up front.

## Decisions

### 1. Use a thin internal runtime instead of a framework
We will implement a small internal i18n layer with:
- locale catalog objects
- a `t(key, vars?)` helper
- fallback lookup
- `Intl`-based formatting helpers

This matches the earlier product decision to stay dependency-light while creating a clean boundary for a future framework migration.

Alternative considered:
- Adopt `@lit/localize` now. Deferred because it is better once the product needs extraction, build-time localization, or more surfaces than homepage + editor.

### 2. Scope localization to UI chrome, not entry content
The i18n layer will cover:
- labels
- buttons
- empty states
- notices / toasts / status messages
- helper text
- lightweight count/date formatting

It will not translate user-maintained entry fields.

Alternative considered:
- Translate entry content too. Rejected because it changes product semantics and would need authoring, storage, and review rules well beyond UI i18n.

### 3. Share locale state across homepage and editor where practical
Both surfaces should use the same locale key and locale catalog structure so users see consistent language behavior. A local preference key such as `nav-hoard:locale` should override browser detection.

Alternative considered:
- Let homepage and editor each manage locale independently. Rejected because it creates copy drift and inconsistent user expectations.

### 4. Default to browser locale with supported-locale fallback
The runtime should:
- try exact locale match first
- fall back to language family when possible
- otherwise fall back to default `zh-CN`

This keeps the existing Chinese-first experience intact while allowing automatic English pickup for supported users.

### 5. Add a visible locale switcher to both homepage and editor
Users should not need to change browser settings to test or use another UI language. A manual switcher also makes verification and copy review much easier.

## Risks / Trade-offs

- [Key naming drifts between homepage and editor] → Use one shared catalog namespace and prefer descriptive dotted keys.
- [Lightweight runtime becomes ad hoc over time] → Keep interpolation/formatting inside helper functions instead of hand-building strings in components.
- [Partial migration leaves mixed-language UI] → Treat homepage and editor chrome migration as part of the same implementation change.
- [Future framework migration could still be costly] → Preserve a clean `t()` boundary so a future provider swap happens behind the API instead of across all render code.

## Migration Plan

1. Add shared locale definitions, lookup helpers, and persistence rules.
2. Wire homepage locale state and a visible locale switcher.
3. Replace homepage hardcoded UI strings with catalog keys.
4. Wire the same locale foundation into the editor and replace editor UI strings.
5. Validate browser detection, manual switching, fallback, and persistence across reloads.

Rollback is low-risk: revert the i18n helper usage and keep the existing Chinese literals as before.

## Open Questions

- Whether future phases should extend localization to CLI interactive prompts as product UX, not just developer output.
- Whether the locale switcher should eventually be configurable from data or theme config instead of hardcoded supported locales.
