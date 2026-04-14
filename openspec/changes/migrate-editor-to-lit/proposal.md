## Why

The local editor has grown from a temporary inline HTML string into a dense maintenance surface with search, batch actions, capture sync, preview uploads, and import workflows. Continuing to extend it inside one server-side template now makes feature work, visual consistency, and future localization noticeably harder.

## What Changes

- Replace the current monolithic string-template editor UI with a Lit-based client application served by the existing local editor server.
- Preserve the current editor maintenance workflow and server APIs while moving rendering, state updates, and event handling into typed frontend modules.
- Reuse the project's shared style foundation and keep `public/nav-hoard.custom.css` as the project-level override entry for editor theming.
- Keep the editor in local-tool scope only; this migration does not make the editor part of the production homepage bundle.

## Capabilities

### New Capabilities
- `lit-editor-runtime`: Define the module-based local editor client runtime, bootstrap flow, and shared-style integration for manual maintenance.

### Modified Capabilities
- `interactive-entry-workflow`: The local editor requirements now include a Lit-based browser client that preserves the existing maintenance capabilities during the migration.

## Impact

- Affected code: `tools/navhoard-cli/src/editor.ts`, `tools/navhoard-cli/src/editor-html.ts`, new editor client modules under `tools/navhoard-cli/src/`
- Affected dependencies: add Lit-based client build support inside the editor toolchain, while avoiding a second UI framework
- Affected UX: editor rendering, state management, and hot-reload behavior become easier to maintain without changing the canonical save pipeline
