## 1. Canonical Data Path

- [x] 1.1 Decide the single canonical source of truth between `data/index.json` and `public/data/index.json`
- [x] 1.2 Refactor shared read/write helpers so batch update and single-entry write use the same path abstraction
- [x] 1.3 Verify the frontend still reads generated data correctly after the path decision

## 2. Shared Single-Entry Pipeline

- [x] 2.1 Extract a reusable `captureDraft(url)` flow from the current content pipeline
- [x] 2.2 Return structured draft results for both successful and failed capture attempts
- [x] 2.3 Add a shared `confirmAndWriteEntry()` path with normalization, dedupe, and schema validation

## 3. Interactive Review Template

- [x] 3.1 Define one fixed review template that covers success, partial success, and failure cases
- [x] 3.2 Implement parsing of user-edited template content back into a validated entry payload
- [x] 3.3 Require explicit user confirmation before any entry is written

## 4. Skill Workflow

- [x] 4.1 Create a NavHoard entry-add skill that guides URL input and draft review
- [x] 4.2 Wire the skill to the shared single-entry pipeline instead of duplicating business rules
- [x] 4.3 Return clear next-step prompts after write, including optional local verification

## 5. Follow-Up Enhancements

- [ ] 5.1 Add repository submission checks for git identity, remote, and related prerequisites
- [ ] 5.2 Add optional LLM configuration checks with deterministic fallback messaging
- [ ] 5.3 Decide whether repository submission remains guidance-only or gains an execution path in a later iteration

## 6. Verification

- [x] 6.1 Type-check the refactored pipeline and any new skill support scripts
- [x] 6.2 Exercise one successful and one failed URL capture flow end to end
- [x] 6.3 Verify duplicate URLs merge as expected in the confirmed write path
