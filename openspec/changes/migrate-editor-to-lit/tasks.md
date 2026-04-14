## 1. Editor runtime scaffold

- [x] 1.1 Replace the monolithic inline editor HTML with a thin shell document that boots a Lit client entry
- [x] 1.2 Extend the editor server to serve the Lit client modules and required browser package routes
- [x] 1.3 Add shared editor client utilities for API calls, live reload, and unsaved-change protection

## 2. Lit parity migration

- [x] 2.1 Implement a Lit root editor app that loads entries, manages working state, and renders the two-pane layout
- [x] 2.2 Port the list/search/filter/bulk-selection interactions into Lit while preserving current editor behavior
- [x] 2.3 Port the entry form, sync flow, preview upload, bookmark import, and save flow into Lit

## 3. Verification and cleanup

- [x] 3.1 Remove or retire legacy inline editor logic once Lit owns the page
- [x] 3.2 Run targeted validation for `pnpm run edit` and the core editor workflows
- [x] 3.3 Update editor-facing documentation if the local workflow or implementation boundary changed materially
