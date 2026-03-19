## Why

当前仓库已经在本地编辑器中支持浏览器书签 HTML 导入，但这项能力还只是编辑器内部功能，没有被当作独立导入来源在 OpenSpec 中正式建模。随着 `raindrop-import-workflow` 已经被单独抽象出来，浏览器书签导入也需要明确自己的输入边界、导入语义和与共享 pipeline 的关系，避免后续把不同来源的导入逻辑继续混在一起。

## What Changes

- 为浏览器书签导入建立独立 capability，覆盖从书签导出文件读取链接、转换为条目草稿并写入 canonical 数据源的流程。
- 明确该能力与现有编辑器内“导入书签 HTML”功能的关系：编辑器是一个入口，但能力本身不应只被限定为编辑器私有行为。
- 记录浏览器书签导入的基础映射规则，包括标题、URL、来源域名、默认时间字段以及无效链接过滤。
- 记录与共享 pipeline 的复用要求，包括归一化、去重合并、校验与发布输出。
- 为后续可能扩展到 CLI 独立入口、目录层级映射、批量抓取增强保留清晰边界。

## Capabilities

### New Capabilities
- `browser-bookmark-import-workflow`: import browser bookmark exports into NavHoard through a reusable bookmark-to-draft workflow that can share the canonical merge pipeline

### Modified Capabilities
- 无

## Impact

- OpenSpec:
  - `openspec/changes/browser-bookmark-import-workflow/specs/browser-bookmark-import-workflow/spec.md`
- 现有入口与实现：
  - `tools/navhoard-cli/src/editor-html.ts`
  - `tools/navhoard-cli/src/editor.ts`
- 共享 pipeline：
  - `tools/navhoard-cli/src/pipeline.ts`
- 文档：
  - `README.md`
