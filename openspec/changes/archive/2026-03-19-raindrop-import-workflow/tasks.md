## 1. Import Input And Mapping

- [ ] 1.1 Verify `import-raindrop` accepts both CSV file paths and export directories containing `export.csv`
- [ ] 1.2 Verify row-to-draft mapping preserves URL, title, summary, tags, source, created time, and optional preview metadata
- [ ] 1.3 Verify rows without usable URLs are skipped without producing invalid drafts

## 2. Enhancement And Merge Behavior

- [ ] 2.1 Verify `--no-fetch` imports only CSV-derived fields without invoking page capture
- [ ] 2.2 Verify capture mode merges captured fields and tags without discarding original Raindrop tags
- [ ] 2.3 Verify `--llm-enhance` remains optional and falls back cleanly when config is incomplete
- [ ] 2.4 Verify `--featured-from-favorite` is the only path that maps Raindrop favorites to featured entries

## 3. Output And Documentation

- [ ] 3.1 Verify imports continue to write through `mergeDraftEntries` and publish canonical plus runtime data outputs
- [ ] 3.2 Verify success and failure summaries report stable counts for imports, capture, enhancement, duplicates, previews, and featured mappings
- [ ] 3.3 Update user-facing documentation so Raindrop import inputs, enhancement flags, and config expectations match the recorded spec
