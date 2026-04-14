# 一句话让 Agent：更新数据并推送 / 部署（配置指南）

本页说明：如何在**你已明确愿意承担后果**的前提下，用**一句（或一小段）固定话术**让会话 Agent 走完「数据写入 → Git → 远程部署」——并与仓库里 [`AGENTS.md`](../AGENTS.md)、[`docs/agent-playbook.md`](agent-playbook.md) 的约定对齐。

## 1. 这和默认规则的关系

- **默认**：Agent 不应在你未明确同意时执行 `git commit` / `git push`（见 `AGENTS.md`）。
- **本指南**：当你发出的指令里**清楚包含**「允许写入摘要与标签」「允许提交并推送到某分支」等含义时，**该条消息本身即视为你对 Pre-write、commit、push 的一次性授权**（与 `AGENTS.md` 里 “Unless the user clearly waives…” 同一类豁免）。
- **若你不想自动推送**：指令里不要出现提交/推送/deploy 类要求；只写「按 skill 录入这条 URL」即可。

## 2. 环境先决条件（缺一则 Agent 应报错或停下）

| 项 | 说明 |
| --- | --- |
| 本机 Git 身份与远端写权限 | `git remote` 可写；HTTPS 需凭据助手 / PAT；SSH 需 agent 与 key。 |
| 工作目录 | Agent 会话 cwd 为**仓库根目录**（与 `package.json` 同级）。 |
| CLI | 已 `pnpm install`；至少 `pnpm run build:cli`（或完整 `pnpm run build`）。 |
| 单条写入 | 仍走 [`skills/nav-hoard-entry-add/SKILL.md`](../skills/nav-hoard-entry-add/SKILL.md)；批量走 [`skills/nav-hoard-batch-and-import/SKILL.md`](../skills/nav-hoard-batch-and-import/SKILL.md)。 |
| GitHub Pages（若要线上更新） | 仓库已启用 Pages + **GitHub Actions** 来源；推送目标分支与现有 [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) 一致（默认 `main`）。 |

## 3. 可复制的一句话范本（按需改 URL / 分支）

下面每条都尽量**自包含**：数据规则 + 豁免审阅 + 授权 Git + 部署预期。任选其一发给 Agent。

**A. 单条新增（抓取成功则按模板写库并推送 `main`）**

> 在本仓库根目录按 `skills/nav-hoard-entry-add/SKILL.md` 处理：对 `https://example.com/foo` 执行 `entry-workflow` 的 capture → 若抓取结果合理则把模板里 `summary` / `tags` **按抓取结果原样写入**（我豁免逐条再问）；将 `confirm: true` 后执行 confirm。然后 `git add data/index.json public/data`（若有其它被改文件一并 add）、`git commit -m "chore: add entry example.com/foo"`、`git push origin main`。我确认已检查远程与分支，并授权本次 push；若 push 失败请把完整错误贴出来。

**B. 你已手改 YAML，只让 Agent 确认并推送**

> 审阅模板已是 `.tmp/navhoard-entry-review.yaml` 且我已把 `confirm: true`；请直接 `pnpm run entry-workflow -- confirm --template .tmp/navhoard-entry-review.yaml`，然后按与 **A** 相同的 `git add` / `commit` / `push origin main` 执行；`summary`/`tags` 以模板为准，不再向我二次确认。

**C. 只更新数据、不推送（便于你先本地 `pnpm run dev`）**

> 只执行 **A** 里到 `entry-workflow confirm` 为止，**不要** `git commit` / `push`。

**D. 批量（Raindrop / sources）且全量后推送**

> 按 `skills/nav-hoard-batch-and-import/SKILL.md`：我已看过 preflight 报告并同意全量；执行（写出你的具体命令）。完成后 `git add …`、`git commit -m "…"`、`git push origin main`；我授权本次写入与 push。

## 4. 建议 Agent 的执行顺序（便于你复制到系统提示）

1. `pnpm run build:cli`（若 `tools/navhoard-cli/dist` 非最新）。  
2. 数据：`capture` →（必要时 `parse`）→ `confirm`，或批量 skill 中的命令。  
3. 确认 `public/data/` 与 `data/index.json` 无遗漏（`git status`）。  
4. `pnpm run build`（可选但推荐，避免 CI 才爆）。  
5. `git add` → `git commit` → `git push`（仅当用户指令含授权）。  
6. 若用 GitHub Pages：提示用户到 Actions 查看部署；失败则贴日志。

## 5. 风险与不建议场景

- **豁免 Pre-write** 容易把不想要的 tag/摘要写进语料；首次建议用 **C** 或不用豁免句式。  
- **自动 push** 会覆盖远程历史语境下的 `main`；多人协作时改用 PR 工作流，本指南不替代 Code Review。  
- **含密钥的 `data/config.yaml`** 不应被 commit；若 Agent 误加，须立即 `git reset` 并轮换密钥。  
- 仓库**未提供**官方 `npm run ship` 一键脚本；话术语义 + 环境凭据才是「配置」核心。

## 6. 相关链接

- 单条 skill：[`skills/nav-hoard-entry-add/SKILL.md`](../skills/nav-hoard-entry-add/SKILL.md)  
- 批量 skill：[`skills/nav-hoard-batch-and-import/SKILL.md`](../skills/nav-hoard-batch-and-import/SKILL.md)  
- 总流程与禁忌：[`docs/agent-playbook.md`](agent-playbook.md)  
- 写入前摘要与标签规则：[`AGENTS.md`](../AGENTS.md)  
