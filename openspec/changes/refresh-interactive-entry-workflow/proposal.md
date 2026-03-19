## Why

当前 `interactive-entry-workflow` 已经在主 spec 中记录了单条录入、基础本地编辑与书签导入入口，但编辑器本身已经继续演进：它现在支持 `featured` / `hide` 维护、预览图上传、局域网访问参数、批量选择删除、只看置顶等真实能力。这些行为如果继续只留在代码和 README 中，会让编辑器的正式规格长期落后于实际维护工作流。

## What Changes

- 修订 `interactive-entry-workflow`，让本地编辑器规格覆盖当前已落地的人工维护能力，而不是停留在早期最小版本。
- 补录编辑器中的 `featured` / `featured_rank` 与 `hide` 字段维护能力。
- 补录编辑器中的预览图上传与预览元数据编辑能力。
- 补录编辑器的运行方式说明，包括 `--host` / `--port` 参数与局域网访问场景。
- 补录编辑器中的只看置顶、批量选择与批量删除等列表维护能力。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `interactive-entry-workflow`: update the local editor requirements to match the current visual maintenance workflow, including entry metadata toggles, image upload, LAN access options, and bulk maintenance actions

## Impact

- OpenSpec:
  - `openspec/specs/interactive-entry-workflow/spec.md`
- 编辑器实现：
  - `tools/navhoard-cli/src/editor.ts`
  - `tools/navhoard-cli/src/editor-html.ts`
- 文档：
  - `README.md`
