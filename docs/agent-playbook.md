# Nav Hoard Agent Playbook

这份文档面向支持本地 skill / prompt / 会话工作流的 Agent（含 **OpenClaw**、Codex、Cursor 等同类工具）。

**维护入口优先级（与根目录 [`AGENTS.md`](../AGENTS.md) 一致）：** 条目的**主推荐路径**是由你在会话里引导用户完成「URL → 抓取/模板 → 用户确认 → `entry-workflow confirm`」；**`pnpm run entry-workflow`** 与 **`pnpm run edit`** 分别是「无会话、纯终端」与「批量/可视化管理」下的**备选**。不要默认让用户先去手改 `data/index.json`。

目标不是解释项目本身，而是帮助 Agent 用尽量稳定、低歧义的方式完成：
- 条目录入
- 数据编辑
- 本地验证
- 提交与部署前准备

人类可读的项目简介、技术栈与常用命令见仓库根目录的 [`README.md`](../README.md)。公开演示部署（GitHub Pages）：[https://powdered-delta.github.io/nav-hoard/](https://powdered-delta.github.io/nav-hoard/)。

若用户**明确要求**用一句话完成「数据更新 + `git push` + Pages 部署」，先读 **[`docs/agent-one-shot-publish.md`](agent-one-shot-publish.md)**：其中给出**可复制话术**、环境先决条件，以及如何与「默认须用户确认再 push」的规则对齐（一次性授权 / 豁免 Pre-write 的写法）。

## 核心原则

- 唯一规范数据源是 `data/index.json`
- `pnpm run edit` 是本地维护工具，不属于线上部署产物
- GitHub Pages 部署入口是：`push` 到 `main`
- `dist/` 是构建输出，不是人工维护入口

## 推荐工作流

### 场景一：用户要新增或修改条目

**默认假设：** 用户正在通过 **Agent / OpenClaw 会话**与你协作。你的职责是走 skill + `entry-workflow` 管线，而不是把「打开编辑器」或「手改 JSON」当作第一选项。

按优先级为用户选择入口：

1. **会话式主链路（推荐）**
   - 遵循 [`skills/nav-hoard-entry-add/SKILL.md`](../skills/nav-hoard-entry-add/SKILL.md)
   - 引导用户提供 URL → 运行 `pnpm run entry-workflow -- capture ...` → 展示/解释审阅模板 → 遵守 `AGENTS.md` 的 **Pre-write confirmation**（`summary`、完整 `tags`、新 tag 点名）→ 用户同意后再 `confirm`
   - 指定 URL / 站点 / 条目的新增、纠错、补摘要、修乱码、改标签：**优先**用本链路完成
   - 在线抓取失败时：仍交付可编辑模板，由用户补齐字段后再 `parse` / `confirm`
   - 更新已有条目且摘要或 tag 有**实质性**变化时：先向用户展示差异并确认，再写入

2. **命令行单条（备选：用户明确在终端自跑、或 Agent 仅代为执行命令）**
   - 与上相同的 `pnpm run entry-workflow -- ...` 命令；区别仅在于没有会话包装时由用户自己跑

3. **本地可视化编辑（备选）**
   - `pnpm run edit`：适合批量整理、书签 HTML 导入、长时间表单式编辑、或用户明确要求用网页编辑器

4. **命令行按 URL 批量删除**
   - `pnpm run entries-remove -- --urls-from path/to/urls.txt`（默认 dry-run，确认后加 `--write`）
   - 也可重复 `--url <url>`，或与 `--stdin` 管道组合；未匹配到的 URL 会列出并以退出码 `2` 提示

### 场景二：Raindrop 导出或 `sources.yaml` 多源批量

- 统一遵循 **[`skills/nav-hoard-batch-and-import/SKILL.md`](../skills/nav-hoard-batch-and-import/SKILL.md)** 中的 **五步走**（定目标 → 配置 → 小样 / `--dry-run` → 用户确认全量 → 写后验收），并优先使用 CLI **`--report <path>`** 生成 **preflight / apply** 的 JSON 报告，便于中途审批与结束 review。
- **禁止**在用户未确认范围与模式（是否抓取、是否 `--llm-enhance`、是否去掉 `--dry-run`），且未就 **preflight 报告要点**达成一致时，直接跑全量导入或全量多源写库。
- 批量结果不逐条走单条 skill 的 YAML 审阅；写后应用 `pnpm run dev` 或 `pnpm run edit` 做抽查与标签整理。

无论走哪种入口，最终都必须落到：

```text
data/index.json
```

## 标准推进顺序

在条目录入或编辑完成后，Agent 应默认按以下顺序推进：

1. 确认变更已写入 `data/index.json`
2. 如有需要，提示用户本地验证：
   - 页面验证：`pnpm run dev`
   - 构建验证：`pnpm run build`
3. 整理变更摘要
4. 在用户明确确认后，再执行：
   - `git add`
   - `git commit`
   - `git push`
5. 若仓库使用 GitHub Pages，则等待 Actions 自动部署

## 禁止事项

Agent 不应：

- 把 `edit` 误解为部署产物的一部分
- 直接手改 `dist/`
- 在单条条目新增或修订时，跳过 **抓取 + 审阅模板 + 用户确认** 这一主链路（含 `entry-workflow`），直接手改 `data/index.json`（除非用户同意且 `AGENTS.md` 中的最后手段条款适用）
- 在更新已有条目时，遇到大幅描述变更或明显 tag 增删，未经用户确认直接应用
- 假设 GitHub Pages 已经启用
- 未经用户确认直接 `git commit` 或 `git push`
- 绕过 `data/index.json`，只改 `public/data/`

## 部署约定

如果用户采用 GitHub Pages 方案，Agent 应默认理解为：

- 部署触发条件：`push` 到 `main`
- 构建入口：GitHub Actions
- Pages 工作流文件：`.github/workflows/deploy-pages.yml`
- 工作流中 `actions/configure-pages@v5` 已设置 `enablement: true`，可在仓库尚未创建 Pages 站点时尝试自动启用；若仍失败，仍需用户在仓库设置中完成一次来源配置。

如果用户尚未启用 GitHub Pages，Agent 应停在提示阶段，并引导用户完成：

1. 打开仓库 `Settings`
2. 进入 `Pages`
3. 在 `Build and deployment` 的 `Source` 中选择 `GitHub Actions`（不要选 “Deploy from a branch”）

## 检查清单

在准备提交或部署前，Agent 可按以下清单自检：

- [ ] 变更是否落在 `data/index.json` 或项目源码中
- [ ] 是否误改了 `dist/`
- [ ] 是否完成了至少一种本地验证
- [ ] 是否已整理好变更摘要
- [ ] 是否已获得用户对 `commit` / `push` 的明确确认
- [ ] 若目标是 GitHub Pages，是否确认仓库已启用 Pages + Actions

## 快速命令

主链路相关（会话中优先代用户执行）：

```bash
pnpm install
pnpm run build:cli

pnpm run entry-workflow -- capture --url "https://example.com" --write .tmp/navhoard-entry-review.yaml
pnpm run entry-workflow -- parse --template .tmp/navhoard-entry-review.yaml
pnpm run entry-workflow -- confirm --template .tmp/navhoard-entry-review.yaml
```

本地验证与备选维护：

```bash
pnpm run dev
pnpm run build
pnpm run edit
```

补充说明：
- `confirm` 默认会写入仓库根目录下的 `data/index.json`，并同步 `public/data/index.json`
- 如果要覆盖输出路径，优先使用绝对路径，不要依赖相对 `--output data/index.json`
