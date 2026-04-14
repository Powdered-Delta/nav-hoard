## 1. Scope And Input Validation

- [ ] 1.1 Verify browser bookmark import is modeled as an independent capability with bookmark HTML as the current supported input boundary
- [ ] 1.2 Verify imports reject files that do not contain usable `http` or `https` bookmark links
- [ ] 1.3 Verify unsupported link schemes are skipped without producing invalid drafts

## 2. Mapping And Persistence Behavior

- [ ] 2.1 Verify imported bookmark links map into drafts with stable defaults for title, source, summary, tags, and timestamps
- [ ] 2.2 Verify imported bookmark drafts persist through the shared canonical merge pipeline instead of a custom write path
- [ ] 2.3 Verify duplicate bookmark URLs merge correctly with existing canonical entries after normalization

## 3. Editor Entry Point And Documentation

- [ ] 3.1 Verify the local editor import flow inserts imported drafts into editor state and marks unsaved changes before persistence
- [ ] 3.2 Update documentation to describe browser bookmark import as a reusable import workflow, with the editor as the current primary entry point
- [ ] 3.3 Record any deferred follow-up work for bookmark folder mapping, CLI entry, or optional capture enhancement as future changes rather than expanding this scope
