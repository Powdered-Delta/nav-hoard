## Why

当前项目已经覆盖了 MVP 的基础浏览能力，但与 PRD 对照后，仍缺少两块核心价值：一是首页内的引导与状态体验还不完整，二是 `navhoard-cli` 手动更新链路还停留在原型阶段，尚不能稳定地产出符合约束的数据。现在补齐这两部分，可以让项目从“可演示”进入“可日常使用和维护”的状态。

## What Changes

- 补齐首页核心交互：增加 `About` 说明入口，完善搜索无结果、收藏为空、数据加载失败等状态反馈，并提供清空筛选/返回全部视图等恢复路径。
- 强化本地收藏持久化：为 `localStorage` 收藏写入增加异常兜底，特别是 `QuotaExceededError` 场景下的用户提示。
- 完成 `navhoard-cli` 的主要数据更新流程：支持 RSS/HTML 数据源抓取、URL 规范化去重、基础标签/摘要补全、Schema 校验、按阈值分片输出和 `manifest.json` 生成。
- 让数据更新工具在失败时给出可操作的控制台反馈，并在 `--dry-run` 下输出统计结果，便于手动执行和 PR 前检查。

## Capabilities

### New Capabilities
- `collection-experience`: 首页内的引导说明、空状态恢复路径、收藏持久化容错与核心交互完整性。
- `content-refresh-pipeline`: 手动触发的数据抓取、清洗、校验、分片输出与更新统计流程。

### Modified Capabilities
- None.

## Impact

- 前端组件：`src/nav-hoard.ts`
- 数据更新工具：`tools/navhoard-cli/src/cli.ts`
- 数据产物：`public/data/index.json`、新增 `public/data/manifest.json` 与分片文件
- 文档与变更记录：`docs/PRD.md`、`openspec/changes/complete-mvp-core/*`
