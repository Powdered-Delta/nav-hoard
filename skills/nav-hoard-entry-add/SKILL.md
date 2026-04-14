---
name: nav-hoard-entry-add
description: 为 Nav Hoard 通过单条 URL 交互式添加或修订条目。推荐作为 OpenClaw / Cursor / Codex 等会话 Agent 的默认数据维护主链路；底层使用 entry-workflow，与纯终端 CLI 或 pnpm run edit 备选方案共用同一写入规范。
---

# Nav Hoard Entry Add

这个 skill 是**单条条目维护的推荐主链路**（会话里由 Agent 执行），不限定具体 Agent 产品。纯终端用户可自行运行 skill 中的同一组 `entry-workflow` 命令；需要批量可视化管理时再用 `pnpm run edit`。

适用场景（与根目录 `AGENTS.md` 中 “entry maintenance” 对齐）：

- **新增**：用户提供 URL，要写入一条新收藏。
- **修订 / 刷新**：同一 URL 已在 `data/index.json` 中，用户要按当前页面重新抓取或改标题、摘要、标签、来源、预览等（仍走同一条 `capture` → 模板链路；CLI 会与已有条目合并）。
- Agent 需要先抓取（或拿到失败时的可编辑模板），再交给用户审阅。
- 用户确认摘要与标签等后，再由 Agent 执行 `confirm` 写入规范数据。

**不在本 skill 范围内**：按 URL 批量删除（`entries-remove`）；Raindrop 与 `sources.yaml` 批量路径见 **[`../nav-hoard-batch-and-import/SKILL.md`](../nav-hoard-batch-and-import/SKILL.md)**；书签批量导入与长时间表单整理更适合 **`pnpm run edit`**。总览仍可读 `docs/agent-playbook.md`。

## 工作流

1. 如果用户还没提供 URL，先引导用户输入 URL。
2. 确保仓库根目录已 `pnpm install`，且 CLI 已编译（`pnpm run build:cli`，或与站点一起做 `pnpm run build`）。
3. 生成审阅模板：
   - `pnpm run entry-workflow -- capture --url "<URL>" --write .tmp/navhoard-entry-review.yaml`
4. 把模板返回给用户审阅和修改。（可选：在写入前运行 `pnpm run entry-workflow -- parse --template .tmp/navhoard-entry-review.yaml` 做解析校验，不写入。）
5. **写入前**：遵守仓库根目录 `AGENTS.md` 中的 **Pre-write confirmation**：向用户展示拟写入的 `summary` 与完整 `tags` 列表，并得到明确同意；若任一 tag 在 canonical `data/index.json` 的全库 `tags` 中为**首次出现**，须逐个点名该新 tag 并请用户确认后再继续。用户明确放弃该审阅步骤的，仅以 `AGENTS.md` 所写豁免条款为准。若本次是对**已有条目**的更新，且 `AGENTS.md` 所列「实质性变更」成立（例如摘要含义明显变化、标签归类明显调整、标题可能代表不同页面），须向用户**清晰展示前后差异**并得到确认后再写入。在完成本步之前，不得执行下一步的 `confirm` 或把模板里的 `confirm` 改为 `true`。
6. 明确提醒用户：只有把 `confirm: false` 改成 `confirm: true`，才允许写入。
7. 用户确认后写入：
   - `pnpm run entry-workflow -- confirm --template .tmp/navhoard-entry-review.yaml --output data/index.json`
8. 写入完成后，提供后续建议：
   - 本地验证：`pnpm run dev`
   - 如有需要，再继续 commit / push / 发布
   - 如果用户维护频率较高，建议先累计一批条目，再统一确认和提交

## 说明

- 单条写入前的 **summary / tags / 新 tag** 规则以仓库 `AGENTS.md` 的 **Pre-write confirmation** 为权威说明；本技能工作流须与之对齐。
- 抓取成功、部分成功、抓取失败，都统一返回同一种模板。
- 抓取失败时，也要把失败原因和可编辑模板交给用户，而不是直接中断流程。
- 所有写入都走 `data/index.json` 这条规范数据路径。
- 业务规则以 `tools/navhoard-cli/src/pipeline.ts` 和 `tools/navhoard-cli/src/entry-workflow.ts` 为准。

## 常用命令

```bash
pnpm run build:cli
pnpm run entry-workflow -- capture --url "https://example.com" --write .tmp/navhoard-entry-review.yaml
pnpm run entry-workflow -- parse --template .tmp/navhoard-entry-review.yaml
pnpm run entry-workflow -- confirm --template .tmp/navhoard-entry-review.yaml --output data/index.json
```
