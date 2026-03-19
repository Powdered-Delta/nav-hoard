## Why

当前主站的实际能力已经明显超出 `collection-experience` 现有规格：收藏工具、推荐内容混排、布局切换、隐藏条目解锁等都已落地，但尚未被完整记录。与此同时，现有规格中关于布局形态和推荐区表现的描述也已经与真实实现发生漂移，因此需要先把产品规格与仓库现实重新对齐。

## What Changes

- 修订首页交互规格，使其覆盖当前已落地的主站体验，而不是停留在早期版本的描述。
- 补录收藏相关能力，包括首次提醒、本地导入/导出、复制链接、复制条目 JSON 等实际存在的用户操作。
- 修订推荐内容的展示规则，明确当前“推荐条目与结果流混排”的行为，而不是继续保留独立可折叠推荐区的旧描述。
- 修订结果布局规格，移除与当前实现不一致的 `stream/card/list` 旧表述，改为当前真实存在的布局模式。
- 补录隐藏条目与按键序列解锁机制，明确 `hide` 条目在主站的默认可见性规则与解锁方式。

## Capabilities

### New Capabilities

### Modified Capabilities

- `collection-experience`: update homepage requirements to match the current collection UI, including favorite tools, current layout modes, mixed featured entries, and hidden-entry unlock behavior

## Impact

- OpenSpec: `openspec/specs/collection-experience/spec.md`
- 主站实现：`src/nav-hoard.ts`
- 主站样式：`src/styles-default.css`
- 数据结构与说明：`data/index.json`, `README.md`
