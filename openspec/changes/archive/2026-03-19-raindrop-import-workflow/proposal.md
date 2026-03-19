## Why

当前仓库已经具备一条可用的 Raindrop 导入链路，但它还只是实现与 README 级说明，没有进入 OpenSpec 作为正式能力被描述。由于这条链路已经承载了真实的数据导入、抓取增强、可选 LLM 补强与重复合并逻辑，现在需要把它收敛为正式规格，避免后续继续演化时缺少统一约束。

## What Changes

- 为 Raindrop 导入建立正式能力规格，覆盖从 CSV 或导出目录读取数据、转换为条目草稿、并写入 canonical 数据源的完整流程。
- 明确导入过程中的字段映射规则，包括标题、摘要、标签、收藏映射、封面图与时间字段的处理方式。
- 记录导入时对现有 pipeline 的复用要求，包括 URL 抓取、归一化、去重合并和发布数据同步。
- 记录可选增强路径，包括关闭抓取的快速导入模式，以及启用 LLM 后对标签进行补强的增强模式。
- 约束导入结果的用户反馈与输出摘要，使导入条数、抓取成功数、重复合并数、预览图映射数等结果可被稳定观察。

## Capabilities

### New Capabilities
- `raindrop-import-workflow`: import Raindrop exports into NavHoard through a reusable CSV-to-draft workflow with optional capture and LLM enhancement

### Modified Capabilities

## Impact

- OpenSpec: `openspec/changes/raindrop-import-workflow/specs/raindrop-import-workflow/spec.md`
- 导入实现：`tools/navhoard-cli/src/import-raindrop.ts`
- 共享 pipeline：`tools/navhoard-cli/src/pipeline.ts`
- 命令入口与文档：`package.json`, `README.md`
- 数据输出：`data/index.json`, `public/data/index.json`
