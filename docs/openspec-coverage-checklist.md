# OpenSpec Coverage Checklist

这份清单用于对照当前仓库实现与 `openspec/` 的覆盖情况。
目标不是判断“代码好不好”，而是回答三个问题：

1. 哪些能力已经被 OpenSpec 正式记录
2. 哪些能力已经实现，但还没有完整进入 OpenSpec
3. 哪些能力虽然记录过，但当前实现已经与文档发生偏移

---

## 对照范围

- 主规格：
  - `openspec/specs/collection-experience/spec.md`
  - `openspec/specs/content-refresh-pipeline/spec.md`
  - `openspec/specs/interactive-entry-workflow/spec.md`
  - `openspec/specs/raindrop-import-workflow/spec.md`
  - `openspec/specs/browser-bookmark-import-workflow/spec.md`
  - `openspec/specs/deployment-workflow/spec.md`
- 活跃变更：
  - `openspec/changes/add-interactive-entry-workflow/`
  - `openspec/changes/refresh-collection-experience/`
  - `openspec/changes/refresh-interactive-entry-workflow/`
  - `openspec/changes/raindrop-import-workflow/`
  - `openspec/changes/browser-bookmark-import-workflow/`
  - `openspec/changes/deployment-workflow/`
- 当前仓库实现：
  - 主站：`src/`
  - 工具链：`tools/navhoard-cli/src/`
  - 部署：`.github/workflows/`
  - 数据结构：`data/index.json`
  - 使用说明：`README.md`

---

## A. 已记录且基本对齐

这些能力在仓库里已经实现，并且在主 OpenSpec 或活跃变更中能找到明确记录。

| 能力 | 当前实现 | OpenSpec 记录 | 结论 |
|---|---|---|---|
| 首页 About / 站点说明入口 | 主站提供说明入口与可展开说明内容 | `collection-experience` | 已记录，基本对齐 |
| 搜索、标签筛选、空状态提示 | 主站支持搜索、标签筛选、清空筛选、空结果提示 | `collection-experience` | 已记录，基本对齐 |
| 收藏的本地持久化与失败回滚 | `localStorage` 持久化与异常提示 | `collection-experience` | 已记录，基本对齐 |
| 收藏导入 / 导出、复制链接、复制条目 JSON | 主站已提供对应工具按钮与提示 | `collection-experience` | 已同步到主 spec |
| 推荐条目混排、隐藏条目解锁、当前布局模式 | 主站已实现 `featured` 混排、`hide` 解锁、`waterfall + list` | `collection-experience` | 已同步到主 spec |
| 内容刷新 pipeline | `navhoard-cli` 支持 RSS / HTML 抓取与规范化 | `content-refresh-pipeline` | 已记录，基本对齐 |
| URL 规范化、去重、校验、写出 | `tools/navhoard-cli/src/pipeline.ts` | `content-refresh-pipeline` | 已记录，基本对齐 |
| Manifest / 分片发布 | 条目较多时输出 `manifest.json` 与 shard | `content-refresh-pipeline` | 已记录，基本对齐 |
| Dry-run 能力 | CLI 支持 `--dry-run` | `content-refresh-pipeline` | 已记录，基本对齐 |
| 预览图元数据归一化 | `preview` 字段由 pipeline 统一处理 | `content-refresh-pipeline` | 已记录，基本对齐 |
| 单条链接 capture / parse / confirm | `entry-workflow` 已具备完整链路 | `interactive-entry-workflow` | 已同步到主 spec |
| 本地编辑器启动与保存链路 | `pnpm run edit` + 保存接口 | `interactive-entry-workflow` | 已同步到主 spec |
| 浏览器书签 HTML 导入（编辑器入口） | 编辑器支持导入书签 HTML 并进入保存链路 | `interactive-entry-workflow` | 已同步到主 spec |
| 编辑器元数据维护、预览图上传、局域网参数、批量维护 | 编辑器支持 `featured`/`hide`、上传预览图、`--host/--port`、批量删除 | `interactive-entry-workflow` | 已同步到主 spec |
| Raindrop 导入工作流 | 独立 CLI 支持导入、抓取、LLM 增强、合并写回 | `raindrop-import-workflow` | 已同步到主 spec |
| 浏览器书签独立导入工作流 | 已明确输入边界、字段映射、共享 pipeline 与编辑器审阅入口 | `browser-bookmark-import-workflow` | 已同步到主 spec |
| GitHub Pages 自动部署 | 工作流、构建配置与 README 已成链路 | `deployment-workflow` | 已同步到主 spec |

---

## B. 已实现，但 OpenSpec 仍未完整覆盖

这些能力现在仓库里已经存在，但主规格或活跃变更中还没有完整表达。

| 能力 | 代码 / 配置证据 | 当前 OpenSpec 状态 | 建议 |
|---|---|---|---|
| 顶层配置 `config.hidden_unlock_password` 的精确语义 | `data/index.json`、`tools/navhoard-cli/src/pipeline.ts` | 前端行为已记录，配置语义仍偏弱 | 后续补配置 / 数据 schema 说明 |
| 样式覆盖入口 `public/nav-hoard.custom.css` | `src/main.ts`、`README.md` | 未形成正式 capability | 若长期保留，后续补主题定制 spec |
| 样式分层维护规则 | `src/styles-base.css`、`src/styles-default.css`、`tools/navhoard-cli/src/editor-html.ts` | 仍主要停留在文档约定 | 若希望长期治理，可正式建模 |

---

## C. 已记录，但与当前实现存在偏移

这些能力已经进入 OpenSpec，但仍有局部内容需要继续收敛。

| 项目 | OpenSpec 描述 | 当前实现 | 结论 |
|---|---|---|---|
| 隐藏内容配置命名 | 当前行为已记录为“解锁序列” | 数据字段仍使用 `hidden_unlock_password` | 后续可考虑统一命名 |
| 编辑器未来增强范围 | 目前已记录当前真实能力 | 若后续新增批量置顶、批量打标签等能力会再次扩展 | 后续继续增量同步 |
| 样式策略 | 目前主要停留在文档与约定层 | 已有明确样式分层和自定义覆盖入口 | 若长期保留，适合后续正式化 |

---

## D. 已记录，但仍处于未完全收口状态

这些内容已经进入 OpenSpec，但从变更任务上看，还没有全部正式归档或标记完成。

| 变更 | 当前状态 | 说明 |
|---|---|---|
| `add-interactive-entry-workflow` | 仍有历史任务未全部勾完 | 主 spec 已同步，但旧 change 任务文档仍落后于现实 |
| `refresh-collection-experience` | artifacts 已完整，主 spec 已同步 | 可后续视实现与文档核对结果归档 |
| `refresh-interactive-entry-workflow` | artifacts 已完整，主 spec 已同步 | 可后续视实现与文档核对结果归档 |
| `raindrop-import-workflow` | artifacts 已完整，主 spec 已同步 | 可后续视实现进度归档 |
| `browser-bookmark-import-workflow` | artifacts 已完整，主 spec 已同步 | 可后续视实现进度归档 |
| `deployment-workflow` | artifacts 已完整，主 spec 已同步 | 可后续视实现进度归档 |

说明：
- 这里的“未完全收口”是指 OpenSpec 工作流层面，不等同于“代码不可用”
- 有些能力已经能正常使用，但 change 任务仍未被显式标记完成或归档

---

## E. 当前最适合继续补录到 OpenSpec 的方向

建议优先补齐仍然明显缺失的部分，而不是继续新开过多 capability。

### 1. 如需长期保留，再考虑 `theme-customization`

建议仅在确认“主题覆盖能力”会长期保留时再正式建 capability，覆盖：

- `public/nav-hoard.custom.css`
- 默认样式与自定义覆盖的分层策略
- 主站与编辑器的样式边界

### 2. 如需进一步收口，再考虑归档已完成 change

建议后续在实现和验证都稳定后，再逐步处理：

- `refresh-collection-experience`
- `refresh-interactive-entry-workflow`
- `raindrop-import-workflow`
- `browser-bookmark-import-workflow`
- `deployment-workflow`

### 3. 如需继续精修数据语义，可补配置 / schema 说明

优先候选：

- `config.hidden_unlock_password` 的语义与命名
- 预览图字段的更细粒度策略
- 主题覆盖入口的长期边界

---

## F. 当前结论

### 当前可以明确说“已经被 OpenSpec 记录”的

- 核心内容刷新、规范化、写出链路
- 单条链接 capture / review / confirm 工作流
- 主站当前核心体验：收藏工具、复制、推荐混排、隐藏解锁、当前布局模式
- 本地编辑器的基础与增强维护链路
- 浏览器书签 HTML 导入入口
- 浏览器书签独立导入工作流
- Raindrop 批量导入工作流
- GitHub Pages 自动部署工作流

### 当前还不能说“已经被 OpenSpec 完整记录”的

- 样式覆盖机制与主题策略
- 隐藏内容配置字段的更完整语义

### 最准确的判断

当前仓库的“主站主链路、编辑器维护链路、导入链路、部署链路”已经基本进入主 OpenSpec，
接下来最明显的缺口主要集中在“样式策略正式化”和“少量配置语义补强”。

---

## G. 建议执行顺序

1. 视需要补 `theme-customization`
2. 补配置 / schema 语义说明
3. 逐步归档已经完成的 changes

这样可以先把仍未正式化的长期维护约定收进去，再做 OpenSpec 流程收尾。

---

## H. 样式策略待记录内容

当前仓库已经形成一套相对稳定的样式分层策略，但这部分还没有被 OpenSpec 正式记录。

建议至少记录以下内容：

- `src/styles-base.css`：全局 token、基础排版、共享布局原语
- `src/styles-default.css`：主站默认视觉规则与共享组件样式
- `public/nav-hoard.custom.css`：项目级个性化覆盖入口，优先用于主题和非结构性调整
- `tools/navhoard-cli/src/editor-html.ts`：编辑器私有样式与交互样式边界

建议记录的规则：

- 项目级视觉微调优先走 `public/nav-hoard.custom.css`
- 只有在需要变成默认共享行为时，才修改 `src/styles-default.css`
- 只有在调整全局 token、基础原语或应用级布局基础时，才修改 `src/styles-base.css`
- 编辑器样式尽量留在 `tools/navhoard-cli/src/editor-html.ts`，避免把编辑器专属规则反向污染主站

建议的 OpenSpec 去向：

- 如果它只是长期维护约定，可先保留在文档与 `AGENTS.md` 中
- 如果你希望未来把“主题覆盖能力”当成正式产品能力，再新建 `theme-customization` capability
