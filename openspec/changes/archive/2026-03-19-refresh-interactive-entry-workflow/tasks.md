## 1. Editor Metadata And Preview Support

- [ ] 1.1 Verify the editor can read and write `featured`, `featured_rank`, and `hide` metadata through the existing save pipeline
- [ ] 1.2 Verify local preview image upload writes files to `public/images/previews/` and updates entry preview metadata
- [ ] 1.3 Verify manual preview metadata edits persist through save without breaking normalization

## 2. Editor Runtime And List Maintenance Behavior

- [ ] 2.1 Verify the editor supports custom `--host` and `--port` runtime options for localhost and LAN access scenarios
- [ ] 2.2 Verify the featured-only filter reflects current featured state in the editor list
- [ ] 2.3 Verify bulk selection and bulk deletion operate on the current filtered result set without corrupting the working entry list

## 3. Spec And Documentation Alignment

- [ ] 3.1 Sync the approved delta into `openspec/specs/interactive-entry-workflow/spec.md`
- [ ] 3.2 Update README wording if the finalized editor capability description diverges from the current docs
- [ ] 3.3 Keep `docs/openspec-coverage-checklist.md` aligned with the expanded editor coverage status
