---
name: nav-hoard-batch-and-import
description: Nav Hoard 批量数据入口的方法论：Raindrop 与 sources.yaml 多源抓取；强调小样/dry-run、可选 --report JSON 做中途审批与结束 review，与单条 skill 分工。
---

# Nav Hoard：批量导入与多源刷新

本 skill 描述 **Raindrop 全量/批量导入** 与 **`navhoard-cli` 多源批量抓取** 的推荐做法。单条 URL 的会话维护请用 [`../nav-hoard-entry-add/SKILL.md`](../nav-hoard-entry-add/SKILL.md)。

## 与单条主链路的边界

| 场景 | 使用 |
| --- | --- |
| 一条 URL、要审阅模板再写入 | `nav-hoard-entry-add` + `entry-workflow` |
| Raindrop `export.csv` 或导出目录整批进库 | 本文 + `pnpm run import:raindrop` |
| 多个 RSS/HTML 源定期合并进 `data/index.json` | 本文 + `pnpm run navhoard-cli` |
| 批量删 URL、书签 HTML 大量导入后的整理 | `docs/agent-playbook.md` + `entries-remove` / `pnpm run edit` |

## 方法论（五步走）

### 1. 明确目标与风险

- **Raindrop**：一次会写入/合并大量条目；可能引入大量**新 tags**、抓取失败回退到 CSV 字段。
- **多源抓取**：依赖 `data/sources.yaml` 中 `enabled` 源数量；可能触发站点速率限制；可用 **`--dry-run`** 先看统计再真写。

批量路径**没有**单条 skill 里的 YAML 逐条审阅；风险靠 **小样 + 日志 + 结构化报告 + 写后抽查** 控制。

### 1.1 报告：中途审批与结束 review（推荐始终生成）

CLI 支持把一次运行的关键指标写成 **JSON**（`report_version: 1`），便于人类或 Agent 对照、存档、贴进 PR 描述。

| 阶段 | 目的 | 典型做法 |
| --- | --- | --- |
| **Preflight（预检）** | 全量写入前审批 | `navhoard-cli` 使用 **`--dry-run` + `--report .tmp/navhoard-cli-preflight.json`**。将报告中的 `final_entry_count`、`fetch_stats`、`invalid_messages` 摘要给用户，**得到明确同意后再去掉 dry-run**。 |
| **Apply（执行后）** | 落库后复盘 | 正式跑时再加 **`--report .tmp/navhoard-cli-apply-<日期时间>.json`**（Raindrop 用 **`--report .tmp/raindrop-import-apply.json`**）。可与 preflight 对比 `final_entry_count` / `written_files`；再结合 **`pnpm run dev`** 或 **`pnpm run edit`** 做内容抽查。 |

命名建议：统一放在 **`.tmp/`**（若不希望提交到 Git，可把该目录记入 `.gitignore`；若希望 PR 里带报告，可改到 `docs/reports/` 等已跟踪路径）。

**Raindrop**：当前命令在**成功写库后**写报告（用于结束 review）；小样本试跑同样可加 `--report`，便于与全量报告对比行数与抓取统计。

**报告 JSON 顶层字段速览**（`report_version` 恒为 `1`）：

- **`navhoard-cli-batch`**：`dry_run`、`sources_path`、`config_path`、`output_path`、`publish_dir`、`fetch_stats`（每源 `fetched` / `accepted` / `invalid` / `warnings`）、`duplicate_count`、`invalid_count`、`invalid_messages`（截断）、`final_entry_count`、`output_mode`、`written_files`（dry-run 时为空数组）。
- **`raindrop-import`**：`input_path`、`output_path`、`config_path`、`fetch_enabled`、`llm_enhance_requested`、`featured_from_favorite`、`row_count`、各计数字段、`merged_total`、`duplicate_count`、`written_files`。

### 2. 环境与配置

1. 仓库根目录：`pnpm install`。
2. CLI：`pnpm run build:cli`（或与 `pnpm run build` 一起做）。
3. 私密配置：复制 `data/config.sample.yaml` → **`data/config.yaml`**（已在 `.gitignore` 中）。Raindrop 若用 **`--llm-enhance`**，须在 `config.yaml` 中配置可用的 `llm`（缺 key 时程序会降级为无 LLM 并给出警告）。
4. **Raindrop**：把官方导出的 CSV 或含 `export.csv` 的目录放到约定路径（常用：项目下 `export/` 目录）。
5. **多源**：编辑 **`data/sources.yaml`**（顶层 `sources:` 数组；每项需 `id`、`type`（`rss` | `html`）、`url`；用 `enabled: false` 临时关掉某个源）。

### 3. 小样验证（强烈建议）

- **Raindrop**：先准备 **小样本 CSV**（几十条即可），例如复制导出行到 `.tmp/raindrop-sample.csv`，跑通后再全量；小样与全量都建议加 **`--report`**。
- **多源**：先执行 **`--dry-run` + `--report`**，把 **preflight 报告**交给用户确认后，再去掉 dry-run 真写并生成 **apply 报告**。

### 4. 全量执行

在用户对「范围、是否抓取、是否 LLM」有明确确认后再跑全量（见下方命令摘要）。

### 5. 写后验收

- 看终端输出的 merged 数量、invalid 提示、`Written files` 列表。
- 本地 **`pnpm run dev`** 抽查卡片与标签；词表敏感时用 **`pnpm run edit`** 做批量整理或删改 tags。
- 若需提交：确认 `data/index.json` 与工具链生成的 **`public/data/`** 一致后再 `git add`（与根目录 `AGENTS.md` 的 canonical 规则一致）。

## 命令摘要（在仓库根目录执行）

### Raindrop 导入

默认输入为 `export/export.csv`（可用 `--input` 覆盖）；默认输出为规范库 **`data/index.json`**（可用 `--output` 覆盖）。

```bash
# 普通导入：抓取补全 + 与现库合并写回（成功写库后写 JSON 报告）
pnpm run import:raindrop -- --input export --output data/index.json --config data/config.yaml --report .tmp/raindrop-import-apply.json

# 小样本试跑（建议全量前先跑）
pnpm run import:raindrop -- --input .tmp/raindrop-sample.csv --output data/index.json --config data/config.yaml --report .tmp/raindrop-import-preflight.json

# 抓取基础上再用 LLM 优化标签（需 config 中 llm）
pnpm run import:raindrop -- --input export --output data/index.json --config data/config.yaml --llm-enhance

# 只做 CSV 字段、不请求目标站点
pnpm run import:raindrop -- --input export --output data/index.json --config data/config.yaml --no-fetch

# 将 Raindrop 收藏映射为条目 featured（可选）
pnpm run import:raindrop -- --input export --output data/index.json --config data/config.yaml --featured-from-favorite
```

### 多源批量（`sources.yaml`）

```bash
# 只统计、不写文件 + 预检报告（中途审批用）
pnpm run navhoard-cli -- --sources data/sources.yaml --config data/config.yaml --output data/index.json --dry-run --report .tmp/navhoard-cli-preflight.json

# 正式写回 + 执行后复盘报告
pnpm run navhoard-cli -- --sources data/sources.yaml --config data/config.yaml --output data/index.json --report .tmp/navhoard-cli-apply.json
```

## Agent 协作注意点

- **默认**为每次批量/多源运行加上 **`--report`**，并在全量前把 **preflight 报告要点**（条目规模、invalid、各源 fetched/accepted）展示给用户做中途审批。
- **不要**在用户未确认「是否全量、是否开 LLM、是否抓取」以及（若已跑 preflight）**未对照预检结论**时，代为执行全量 Raindrop 或去掉 `--dry-run` 的多源命令。
- 全量前可建议用户 **备份** `data/index.json`（复制到 `.tmp/` 或分支）。
- 批量写入后，**单条 Pre-write confirmation**（`AGENTS.md` 里针对 `summary`/`tags` 的逐条确认）通常不适用每一条；若用户要求严格词表，应明确改为 **小样 + edit 整理** 或拆成多次较小导入。
- 实现细节与字段规则以 `tools/navhoard-cli/src/import-raindrop.ts`、`tools/navhoard-cli/src/cli.ts`、`tools/navhoard-cli/src/pipeline.ts` 为准。

## 延伸阅读

- 总览与禁忌：`docs/agent-playbook.md`
- 仓库维护总规则：`AGENTS.md`
