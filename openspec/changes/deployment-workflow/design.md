## Context

当前仓库已经具备一条完整的 GitHub Pages 部署链路：当代码 push 到 `main` 分支时，GitHub Actions 会自动 checkout 仓库、安装 pnpm 与 Node.js、执行 `pnpm install --frozen-lockfile`、根据仓库名计算 `VITE_BASE_PATH`、运行 `pnpm run build` 生成 `dist/`，再通过 Pages 官方 action 上传并发布构建产物。

与此同时，前端构建配置也已经配合这条链路存在：`vite.config.ts` 从环境变量 `VITE_BASE_PATH` 读取站点基础路径，默认回退到 `/`。README 还额外说明了首次启用 GitHub Pages 时，需要在仓库设置中把 Pages Source 切换为 `GitHub Actions`。

因此，这次设计并不是为一个全新的部署系统做架构设计，而是把当前已经稳定存在的部署路径正式描述出来，明确它的边界、环境假设和自动化约束。这样未来如果修改默认分支、切换构建命令、增加多环境部署或调整 Pages 策略，就能有清晰的基线。

## Goals / Non-Goals

**Goals:**
- 把当前 GitHub Actions + GitHub Pages 部署链路定义为正式 capability。
- 明确部署触发条件、构建步骤、发布步骤与所依赖的仓库配置。
- 明确 `VITE_BASE_PATH` 的自动计算策略，覆盖用户/组织首页仓库与项目页仓库两种场景。
- 明确构建产物来自 `pnpm run build` 的 `dist/` 输出，而不是手工上传流程。
- 让 README 中的部署说明与工作流文件形成统一规范，而不是各自描述。

**Non-Goals:**
- 不在这次变更中为 Netlify、Vercel、Cloudflare Pages 等其他托管平台建立实现规范。
- 不在这次变更中增加多环境部署、预览环境或按分支部署策略。
- 不在这次变更中重做工作流触发分支策略或引入手工审批流程。
- 不在这次变更中定义自托管 CI 或非 GitHub 平台部署方案。
- 不在这次变更中修改主站构建架构本身，只记录现有构建与发布关系。

## Decisions

### 1. 将 GitHub Pages 部署建模为独立 capability
- 方案 A：继续只在 README 中记录部署步骤。
- 方案 B：将部署能力作为独立 capability 写入 OpenSpec。
- 决策：选择方案 B。
- 原因：部署链路已经是实际产品交付的一部分，并且涉及工作流、构建配置和仓库设置三个层面，单靠 README 难以稳定约束后续演进。

### 2. 规格聚焦当前已实现的 GitHub Actions → GitHub Pages 路径
- 方案 A：把所有“静态托管部署方式”都纳入一个宽泛 spec。
- 方案 B：先只覆盖当前真正实现的 GitHub Actions + GitHub Pages 路径。
- 决策：选择方案 B。
- 原因：这与现有仓库能力一致，避免把 README 中“也可部署到任意静态托管”这种泛化用法误写成必须保证的正式部署实现。

### 3. `VITE_BASE_PATH` 维持工作流内自动计算，而不是要求用户手工配置
- 方案 A：要求用户自行设置 `VITE_BASE_PATH`。
- 方案 B：由工作流根据仓库名自动计算 base path。
- 决策：选择方案 B。
- 原因：当前工作流已经这样实现，且能同时覆盖 `owner.github.io` 和项目页仓库，用户体验更稳，出错面更小。

### 4. 构建与发布继续解耦为两个 job
- 方案 A：在单一 job 中完成构建和部署。
- 方案 B：保留 `build` 与 `deploy` 两阶段，使用官方 upload/deploy Pages actions 传递产物。
- 决策：选择方案 B。
- 原因：这符合 GitHub Pages 官方推荐路径，也更利于未来排查构建失败与部署失败的责任边界。

### 5. 首次启用 Pages 的仓库配置视为 capability 的前置条件，而不是实现细节
- 方案 A：把 GitHub 仓库设置视为 README 附注，不纳入规格。
- 方案 B：把“Pages Source 选择 GitHub Actions”记录为可部署前置条件。
- 决策：选择方案 B。
- 原因：如果这一步没做，工作流即便跑完也无法形成预期的 Pages 发布体验，这属于用户必须满足的部署前提。

## Risks / Trade-offs

- [部署能力绑定 GitHub Pages] → 通过把 spec 边界限定为当前已实现路径，避免误导为“通用静态平台部署规范”。
- [默认监听 `main` 分支可能与未来分支策略变化冲突] → 后续若主分支策略变化，再通过新的 change 更新 spec 与工作流。
- [Base path 自动推断依赖仓库命名规则] → 使用 `owner.github.io` 与普通仓库名的明确分支判断，减少手工配置错误。
- [README 与工作流可能再次漂移] → 用 OpenSpec 将二者共同约束到同一条 capability 下。
- [GitHub Pages 仓库设置是平台侧状态，仓库代码无法强制保证] → 在 spec 中把它建模为前置条件，并在文档中显式说明。

## Migration Plan

1. 为 `deployment-workflow` 建立正式 delta spec，记录触发、构建、上传和 Pages 发布规则。
2. 对照现有 `.github/workflows/deploy-pages.yml` 与 `README.md`，确保文档描述与已实现行为一致。
3. 后续如需新增非 Pages 部署方案、多环境部署或分支策略调整，再通过独立 change 扩展。
4. 本次变更不需要迁移历史数据，也不需要修改现有部署产物结构。

## Open Questions

- 后续是否要把“任意静态托管”的通用构建发布建议也拆成单独 capability。
- 如果主开发分支策略未来变化，是否要把部署触发从 `main` 调整为可配置项。
- 是否要在未来引入预览部署或 PR 预览，而不是只保留正式 Pages 发布。
