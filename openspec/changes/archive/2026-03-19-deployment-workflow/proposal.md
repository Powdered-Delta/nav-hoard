## Why

当前仓库已经具备一条可用的 GitHub Pages 自动部署链路，但这条链路目前只存在于工作流文件和 README 中，还没有被 OpenSpec 作为正式能力描述。随着前端站点、数据产物和 Pages 部署已经形成稳定工作流，现在需要把部署路径正式建模，避免后续调整分支策略、Base Path 或构建入口时缺少统一约束。

## What Changes

- 为静态站点部署建立独立 capability，覆盖 GitHub Actions 自动构建与 GitHub Pages 发布流程。
- 明确部署触发条件、构建环境、构建命令、产物上传与 Pages 发布步骤。
- 记录 `VITE_BASE_PATH` 的自动计算规则，区分用户/组织首页仓库与项目页仓库。
- 记录首次启用 GitHub Pages 时的仓库侧前置操作与依赖关系。
- 保持部署能力聚焦于当前仓库已经实现的 Pages 工作流，不扩展到其他托管平台的实现细节。

## Capabilities

### New Capabilities
- `deployment-workflow`: build and publish the NavHoard static site through GitHub Actions and GitHub Pages with automatic base path handling

### Modified Capabilities
- 无

## Impact

- OpenSpec:
  - `openspec/changes/deployment-workflow/specs/deployment-workflow/spec.md`
- 部署实现：
  - `.github/workflows/deploy-pages.yml`
  - `vite.config.ts`
- 文档：
  - `README.md`
- 构建产物：
  - `dist/`
