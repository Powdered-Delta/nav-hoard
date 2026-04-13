---
name: nav-hoard-entry-add
description: 为 NavHoard 通过单条 URL 交互式添加新条目。适用于会话型 Agent 需要引导用户输入链接、抓取页面内容、返回统一审阅模板、等待用户确认后写入数据源的场景。
---

# NavHoard Entry Add

这个 skill 是一份通用会话工作流模板，不限定具体 Agent 产品。

适用场景：

- 用户想给 NavHoard 添加一个新链接
- Agent 需要先抓取内容，再返回可编辑模板
- 用户确认后，Agent 再把条目写入 `data/index.json`

## 工作流

1. 如果用户还没提供 URL，先引导用户输入 URL。
2. 确保仓库根目录已 `pnpm install`，且 CLI 已编译（`pnpm run build:cli`，或与站点一起做 `pnpm run build`）。
3. 生成审阅模板：
   - `pnpm run entry-workflow -- capture --url "<URL>" --write .tmp/navhoard-entry-review.yaml`
4. 把模板返回给用户审阅和修改。
5. 明确提醒用户：只有把 `confirm: false` 改成 `confirm: true`，才允许写入。
6. 用户确认后写入：
   - `pnpm run entry-workflow -- confirm --template .tmp/navhoard-entry-review.yaml --output data/index.json`
7. 写入完成后，提供后续建议：
   - 本地验证：`pnpm run dev`
   - 如有需要，再继续 commit / push / 发布
   - 如果用户维护频率较高，建议先累计一批条目，再统一确认和提交

## 说明

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
