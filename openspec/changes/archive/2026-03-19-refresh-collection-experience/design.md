## Context

当前 `collection-experience` 规格只覆盖了主站早期的一部分首页行为，但主站实现已经继续演化，形成了更完整的收藏、复制、推荐混排、布局切换与隐藏条目解锁体验。由于这些能力分散在 `src/nav-hoard.ts`、`src/styles-default.css`、`data/index.json` 和 `README.md` 中，继续沿用旧规格会导致后续功能讨论、验收和归档都缺乏统一依据。

这次变更不引入新的前端架构，也不改变现有实现主线；它的核心目标是把“当前已经稳定存在的主站行为”重新收敛进同一个 capability 中，并修正旧规格与真实实现之间的漂移。

## Goals / Non-Goals

**Goals:**
- 让 `collection-experience` 能完整描述当前主站的真实交互行为。
- 把收藏工具能力补录进规格，包括首次提醒、本地导入导出、复制链接、复制条目 JSON。
- 修订推荐内容的规格描述，使其匹配当前“推荐条目与普通结果混排”的实现。
- 修订布局规格，使其与当前 `waterfall + list` 的实际模式一致。
- 把隐藏条目与按键序列解锁机制纳入主站体验规格，明确它与 `hide` 数据字段的关系。

**Non-Goals:**
- 不在这次变更中新增 Raindrop 导入规格。
- 不在这次变更中补部署工作流规格。
- 不在这次变更中改变编辑器能力边界或编辑器交互模型。
- 不在这次变更中重构主站实现，只做规格补录与对齐。

## Decisions

### 1. 继续修改现有 `collection-experience`，而不是拆成多个首页子 capability
- 方案 A：直接修订现有 `collection-experience`。
- 方案 B：把收藏工具、推荐条目、隐藏解锁拆成多个新 capability。
- 决策：选择方案 A。
- 原因：这些能力都属于同一张首页里的发现与操作体验，拆分后会造成能力边界过碎，增加后续规格维护成本。

### 2. 把“推荐条目”定义为结果流中的一种展示状态，而不是单独的页面区块
- 方案 A：规格继续保留独立、可折叠推荐区的旧描述。
- 方案 B：规格改为“推荐条目在默认视图中参与结果流展示，但保留推荐标记与排序语义”。
- 决策：选择方案 B。
- 原因：当前实现里推荐条目已经通过 `featured` / `featured_rank` 混排进主结果流，规格应以真实实现为准。

### 3. 把布局规格收敛为当前真实存在的模式
- 方案 A：保留 `stream / card / list` 的旧规格，再等待未来实现回补。
- 方案 B：把规格改成当前实际可选的 `waterfall / list`。
- 决策：选择方案 B。
- 原因：OpenSpec 应优先描述当前有效行为，而不是历史设想；未来如果重新引入新布局，再通过新变更补充即可。

### 4. 把隐藏条目能力放在首页体验规格中，而不是单独开新 spec
- 方案 A：新建独立 capability 描述隐藏内容访问。
- 方案 B：作为 `collection-experience` 的一部分补录。
- 决策：选择方案 B。
- 原因：当前隐藏能力直接影响首页结果可见性、计数、标签统计和解锁方式，本质上属于首页交互体验的一部分。

### 5. 把数据字段与前端行为一起记录，但不在本次 design 中扩展数据 schema 范围
- 方案 A：只描述前端行为，不提 `hide` 与 `config.hidden_unlock_password`。
- 方案 B：在设计里明确这些字段与首页行为的关系，但不把更广的数据模型扩展纳入本次 change。
- 决策：选择方案 B。
- 原因：如果只写前端行为，会丢掉这项能力赖以成立的数据来源；但这次变更仍以主站体验补录为核心，不扩大到整个数据体系重构。

## Risks / Trade-offs

- [把多个首页能力继续放在同一个 capability 中] → 规格会变长，但能保持“用户首页体验”这个边界完整，避免碎片化。
- [规格以当前实现为准] → 会放弃一部分旧设想的描述，但可显著降低实现/规格长期漂移。
- [隐藏条目纳入首页规格] → 会让 `collection-experience` 触及少量数据字段语义，但这是为了准确描述前端可见性规则。
- [这次不处理 Raindrop 与部署规格] → 仍会留下后续缺口，但可以保证本次 change 范围清晰、推进更快。

## Migration Plan

1. 先更新 `refresh-collection-experience` 下的 delta spec，只修改 `collection-experience`。
2. 评审时以当前主站实现为基准，逐项核对 spec 是否覆盖真实行为。
3. 若 spec 通过，再决定是否继续为 `raindrop-import-workflow` 与 `deployment-workflow` 新开变更。
4. 本次变更不涉及运行时迁移、数据迁移或回滚脚本。

## Open Questions

- 是否要在后续 change 中把 `config.hidden_unlock_password` 重命名为更准确的字段名，例如 `hidden_unlock_sequence`。
- 是否要把样式覆盖入口 `public/nav-hoard.custom.css` 单独提升为正式 capability，而不是只保留在 README 中。
