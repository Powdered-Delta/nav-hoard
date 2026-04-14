## Why

当前项目已经具备批量抓取和前端展示能力，但还缺少一条适合个人维护者的“单链接快速录入”路径，以及一个适合集中整理数据的“本地可视化编辑”入口。为了让内容维护同时覆盖会话式新增与人工批量整理两类场景，需要补上由 Agent 引导的交互式工作流，并提供本地网页编辑器入口，与现有内容流水线复用核心逻辑。

## What Changes

- 新增交互式单链接入库能力：Agent 引导用户输入 URL、抓取页面内容、生成条目草稿模板、等待用户修改确认后再写入数据源。
- 新增本地可视化编辑模式：维护者可通过 `npm run edit` 打开网页编辑器，直接编辑唯一数据源并执行导入。
- 新增失败兜底流程：当抓取失败、抽取失败或内容不完整时，仍返回统一模板，允许用户手动补全条目并继续入库。
- 修改现有内容流水线，使批量抓取、交互式单条录入与本地编辑器共享同一套 URL 规范化、抽取、去重、校验与写入逻辑。
- 将本地验证提示、仓库提交检查、LLM 配置检查保留为后续增强阶段，不阻塞首版交互式录入与本地编辑闭环落地。

## Capabilities

### New Capabilities
- `interactive-entry-workflow`: 通过 Agent 发起的单链接抓取、模板确认、入库与后续操作引导工作流。
- `local-editor-workflow`: 通过本地网页编辑器进行读取、编辑、保存与导入的人工维护工作流。

### Modified Capabilities
- `content-refresh-pipeline`: 扩展为可复用的底层内容处理流水线，支持批量更新与单条录入共用抓取、去重、校验和写入能力。

## Impact

- Agent skill：新增面向 NavHoard 的交互式录入技能目录与模板资源
- CLI / pipeline：`tools/navhoard-cli/src/cli.ts`、本地编辑器服务及相关辅助模块
- 数据文件：`data/index.json`、`public/data/index.json` 及相关写入路径策略
- 规格与文档：`openspec/specs/content-refresh-pipeline/spec.md`、新增 / 修改 `interactive-entry-workflow` 相关 spec、README / PRD 说明
