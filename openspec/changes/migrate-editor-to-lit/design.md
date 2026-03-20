## Context

`tools/navhoard-cli/src/editor-html.ts` currently embeds the entire editor UI, state machine, and interaction logic inside one server-side HTML string. That approach worked for initial delivery, but the editor now includes search, bulk actions, sync capture, preview uploads, bookmark import, featured / hidden metadata, dirty-state protection, and live reload behavior. The current shape makes it costly to evolve the UI safely and hard to align with the main site's Lit-based component approach.

The editor server in `tools/navhoard-cli/src/editor.ts` already provides a good boundary: it serves the page, exposes JSON APIs, and manages live reload. This change keeps that server boundary stable while replacing the inline browser code with a dedicated Lit client.

## Goals / Non-Goals

**Goals:**
- Move editor rendering and client-side state updates into Lit components and TypeScript modules.
- Preserve current editor feature coverage and existing server API shapes during the migration.
- Keep the editor using shared base/custom CSS entry points, with editor-private styles layered on top.
- Preserve the local development flow of `pnpm run edit`, including automatic refresh after relevant changes.

**Non-Goals:**
- Rebuild the editor server into Vite middleware or merge the editor into the homepage app bundle.
- Redesign the editor information architecture beyond what is needed for parity and maintainability.
- Introduce full i18n in the same change.
- Change the canonical data write pipeline or add new entry fields.

## Decisions

### 1. Keep `editor.ts` as the server and API boundary
The HTTP server, JSON routes, upload handling, and live reload stream already work and are used by the current workflow. Reusing that boundary minimizes migration risk and keeps the refactor focused on the browser layer.

Alternative considered:
- Rebuild the editor on top of Vite dev server. Rejected for now because it would widen the change into build tooling, dev workflow, and deployment semantics all at once.

### 2. Introduce a dedicated Lit editor client entry
The editor page will become a thin HTML shell that loads a module entry such as `editor-app.ts`. The Lit client will own:
- app state
- filtered list rendering
- form rendering
- API requests
- unsaved-change protection
- live reload hooks

Alternative considered:
- Split immediately into many small components before parity. Rejected as the first step because parity is more important than ideal final decomposition.

### 3. Serve browser modules through the existing server with an import-map-based Lit runtime
To avoid adding a second bundler right away, the editor server will serve:
- a thin HTML shell
- a generated or transpiled browser module entry
- import-map aliases for `lit` package modules
- static pass-through routes for needed package files

This keeps the dev loop local to the existing tool while allowing browser-native ESM and Lit usage.

Alternative considered:
- Add a dedicated bundler such as Vite or esbuild just for the editor. Deferred because it solves a future optimization problem but increases immediate migration scope.

### 4. Migrate in parity-first slices
The first Lit version should ship the current editor experience before larger UX redesigns. Internally we can still split into focused sections such as:
- app shell
- list panel
- form panel
- status / toast area

But parity is the acceptance bar for this change.

### 5. Keep style layering aligned with the main site
The Lit editor will continue loading:
- `src/styles-base.css`
- `public/nav-hoard.custom.css`

Editor-only layout and state styles stay scoped to editor modules. Shared tokens remain in the existing shared style files.

## Risks / Trade-offs

- [Browser-module serving is more complex than a static string] → Keep the server-side module routing narrow and document the import map in code.
- [Feature parity could slip during refactor] → Port behavior in slices and validate each current workflow against the existing checklist.
- [Live reload may regress when client modules move out of inline HTML] → Keep the current SSE health/reload logic and move it into a dedicated client utility early.
- [Editor bundle may become fragmented over time] → Start with a small number of modules, then split only where the boundaries are stable.

## Migration Plan

1. Replace the inline script-heavy HTML with a shell document that loads a Lit client entry.
2. Add client modules for editor state, API access, and root rendering while preserving existing endpoints.
3. Port the current editor behaviors into the Lit app with parity-first verification.
4. Keep `EDITOR_HTML` as a shell helper only, then remove legacy inline logic once the Lit app fully owns the page.
5. Validate `pnpm run edit`, save, sync, import, upload, and bulk flows before closing the change.

Rollback is straightforward: restore the previous `editor-html.ts` inline implementation and remove the module-serving routes if parity issues appear.

## Open Questions

- Whether a future follow-up should move the editor to a dedicated Vite-based dev/build path once Lit migration stabilizes.
- Whether a lightweight internal `t()` abstraction should be introduced during or after the Lit migration to prepare for future i18n.
