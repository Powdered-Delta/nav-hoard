# Agent Playbook

这份文档面向支持本地 skill / prompt / 会话工作流的 Agent（例如龙虾一类工具）。

目标不是解释项目本身，而是帮助 Agent 用尽量稳定、低歧义的方式完成：
- 条目录入
- 数据编辑
- 本地验证
- 提交与部署前准备

## 一句话原则

- 唯一规范数据源是 `data/index.json`
- `pnpm run edit` 是本地维护工具，不属于线上部署产物
- GitHub Pages 部署入口是：`push` 到 `main`
- `dist/` 是构建输出，不是人工维护入口

## 推荐工作流

### 场景一：用户要新增或修改条目

Agent 应优先判断用户更适合哪种入口：

1. **本地可视化编辑**
   - 启动：`pnpm run edit`
   - 适合人工集中整理、批量检查、导入书签

2. **命令行单条录入**
   - 使用：`pnpm run entry-workflow -- ...`
   - 适合明确知道 URL，且希望走抓取 → 审阅 → 确认写入链路

3. **会话式 Agent / skill 录入**
   - 由 Agent 引导输入 URL
   - 抓取内容
   - 返回统一模板
   - 用户确认后写入 `data/index.json`

无论走哪种入口，最终都必须落到：

```text
data/index.json
```

## 数据修改后的固定顺序

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

## 不应做的事

Agent 不应：

- 把 `edit` 误解为部署产物的一部分
- 直接手改 `dist/`
- 假设 GitHub Pages 已经启用
- 未经用户确认直接 `git commit` 或 `git push`
- 绕过 `data/index.json`，只改 `public/data/`

## GitHub Pages 约定

如果用户采用 GitHub Pages 方案，Agent 应默认理解为：

- 部署触发条件：`push` 到 `main`
- 构建入口：GitHub Actions
- Pages 工作流文件：`.github/workflows/deploy-pages.yml`

如果用户尚未启用 GitHub Pages，Agent 应停在提示阶段，并引导用户完成：

1. 打开仓库 `Settings`
2. 进入 `Pages`
3. 在 `Source` 中选择 `GitHub Actions`

## 推荐检查清单

在准备提交或部署前，Agent 可按以下清单自检：

- [ ] 变更是否落在 `data/index.json` 或项目源码中
- [ ] 是否误改了 `dist/`
- [ ] 是否完成了至少一种本地验证
- [ ] 是否已整理好变更摘要
- [ ] 是否已获得用户对 `commit` / `push` 的明确确认
- [ ] 若目标是 GitHub Pages，是否确认仓库已启用 Pages + Actions

## 快速命令

```bash
pnpm install
pnpm run navhoard-cli:build

pnpm run edit
pnpm run dev
pnpm run build

pnpm run entry-workflow -- capture --url "https://example.com" --write .tmp/navhoard-entry-review.yaml
pnpm run entry-workflow -- confirm --template .tmp/navhoard-entry-review.yaml --output data/index.json
```
