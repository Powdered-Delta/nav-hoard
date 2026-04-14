# Nav Hoard Repo Instructions

## First Check

Before changing content or code, inspect these entry points first:

1. `package.json`
2. `tools/navhoard-cli/`
3. `skills/nav-hoard-entry-add/SKILL.md`
4. `docs/agent-playbook.md`

Do not jump straight to patching `data/index.json` unless the tool-driven path is unavailable or clearly broken.

For UI or styling tasks, inspect these first:

1. `public/nav-hoard.custom.css`
2. `src/styles-default.css`
3. `src/nav-hoard.ts`
4. `tools/navhoard-cli/src/editor-html.ts`

## Entry Maintenance Rules

These requests all count as entry maintenance:

- add a new site
- update an existing record
- refresh a site record from its current page
- fix title, summary, tags, preview, source, or timestamps for one entry

For entry maintenance, use this priority order:

1. If the task is a single-entry add, update, or refresh, use `skills/nav-hoard-entry-add/SKILL.md` as the workflow guide.
2. Prefer `pnpm run entry-workflow -- ...` for single-entry capture, review, and confirm flows.
3. Prefer `pnpm run edit` for manual review, bulk cleanup, or when a human-in-the-loop editor is the better fit.
4. Only edit `data/index.json` directly as a last resort, and explain why the CLI or editor path was not used.

### Pre-write confirmation

Before running `entry-workflow confirm`, setting `confirm: true` on a review template, or otherwise persisting an entry to `data/index.json` (including `pnpm run edit` saves that write entries):

1. Show the user the proposed **`summary`** and the full proposed **`tags`** list, and obtain **explicit user confirmation** that those fields may be written.
2. If any proposed tag is **new to the corpus** (the string does not appear on any other entry’s `tags` in canonical `data/index.json`), **call out each such new tag by name** and confirm with the user before writing, so one-off vocabulary does not land without notice.

Unless the user clearly waives this step (for example, they state that captured summary and tags should be written as-is with no further questions), do not complete a write after capture or refresh without the confirmations above.

When updating an existing entry, do not write immediately if the refreshed result would materially change the current content.

Treat these cases as requiring user confirmation before write:

- the summary or description changes meaningfully, not just wording cleanup
- tags are added or removed in a way that changes categorization
- the title changes enough that it may represent a different page, scope, or site identity

In those cases, show the proposed change clearly and ask the user to confirm before applying it.

## Direct Edit Restrictions

When handling entry maintenance:

- Do not treat direct `apply_patch` changes to `data/index.json` as the default path.
- Do not edit `public/data/index.json` by hand unless the normal write pipeline cannot be used.
- If a direct edit is unavoidable, update both `data/index.json` and `public/data/index.json`, and state the reason in the final response.

## Expected Decision Heuristic

If the user asks to update, refresh, fix, adjust, retag, or revise a record, or provides a URL plus a maintenance intent, assume the request should go through the repo's maintenance workflow first.

The agent should explicitly ask itself:

1. Is there already a script or skill for this?
2. Is this a single-entry workflow?
3. Can `entry-workflow` or `edit` handle this before I patch data files directly?

If the answer may be yes, inspect the workflow first.

## Canonical Data Rules

- `data/index.json` is the canonical source of truth.
- `public/data/` is publish output and should normally be updated by the toolchain, not by manual editing.
- `dist/` is never a content-maintenance target.
- If content changes were written to `data/index.json`, do not leave `public/data/` stale on purpose.

## Style Maintenance Rules

- Prefer `public/nav-hoard.custom.css` for project-level visual tuning, theme alignment, and non-structural style overrides.
- Only edit `src/styles-default.css` when the change should become part of the default shared component styling.
- Only edit `src/styles-base.css` when adjusting global tokens, shared primitives, or app-wide layout foundations.
- For main-site interaction or markup changes, inspect `src/nav-hoard.ts` before changing styles in isolation.
- Keep editor styling changes scoped to `tools/navhoard-cli/src/editor-html.ts` unless a shared style dependency is truly required.

## Editor Maintenance Rules

- `pnpm run edit` is the primary manual maintenance tool for bulk cleanup, tag curation, preview adjustments, and review-heavy content work.
- Editor UI, form behavior, batch actions, and in-browser workflows live in `tools/navhoard-cli/src/editor-html.ts`.
- Editor server behavior such as host, port, API routes, and live reload lives in `tools/navhoard-cli/src/editor.ts`.
- If improving editor UX, prefer fixing the interaction model instead of only changing helper text.

## Skill Path Notes

- Repository-tracked, shareable skills should be referenced from `skills/`.
- `.codex/skills/` may exist as a local or mirrored working directory, but should not be treated as the only canonical skill location for repository guidance.

## Final Response Requirement

If the agent chose not to use the skill or CLI path for an entry-maintenance task, the final response must say:

- which tool or skill was considered
- why it was not used
- what risk that introduced
