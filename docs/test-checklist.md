# Nav Hoard 测试 Checklist

这份清单用于当前分支的功能验收。

说明：
- `[x]` 表示本轮已完成并通过
- `[ ]` 表示仍需人工确认或尚未执行
- 自动化可完成的项目会尽量由 Agent 先处理

## 1. 环境同步

- [ ] 确认当前分支正确：`git branch --show-current`
- [ ] 拉取远程最新代码：`git pull`
- [ ] 安装依赖：`pnpm install`
- [x] 构建 CLI：`pnpm run navhoard-cli:build`

## 2. 主站验收

- [ ] 启动前端开发服务：`pnpm run dev`
- [ ] 页面可正常打开，无白屏、无模块 MIME 报错
- [ ] 搜索功能正常
- [ ] 标签筛选正常
- [ ] 收藏功能正常
- [ ] 首次收藏提示正常
- [ ] 复制链接 / 复制卡片正常
- [ ] 瀑布流 / 列表切换正常
- [ ] 置顶内容展示正常
- [ ] 有图 / 无图卡片样式正常
- [ ] 自定义样式文件 `public/nav-hoard.custom.css` 生效

## 3. 编辑器验收

- [ ] 启动编辑器：`pnpm run edit`
- [ ] 编辑器页面可正常打开：`http://127.0.0.1:3210`
- [ ] 左右两栏独立滚动正常
- [ ] 条目搜索正常
- [ ] 新建条目正常
- [ ] 点击“同步”后能自动回填标题 / 摘要 / 标签 / 来源
- [ ] “保存全部”不再弹重新加载确认框
- [ ] 列表按 `created_at` 倒序
- [ ] 置顶条目带标记
- [ ] 可在列表中快速取消置顶
- [ ] “只看置顶”筛选正常
- [ ] 导入浏览器书签 HTML 正常
- [ ] 上传预览图正常
- [ ] 修改 editor 源码后页面会自动刷新

## 4. 数据链路验收

- [ ] 所有维护结果最终写入 `data/index.json`
- [ ] 保存后同步生成 `public/data/index.json`
- [ ] 重复 URL 会合并
- [ ] 新条目能在主站展示

## 5. 构建验收

- [x] 主站构建通过：`pnpm run build`
- [x] CLI 构建通过：`pnpm run navhoard-cli:build`

## 6. 文档验收

- [ ] README 可读、无关键乱码
- [ ] `docs/agent-playbook.md` 可读
- [ ] `docs/agent-style-playbook.md` 可读

## 7. 自动化结果

- [x] 运行 `pnpm run navhoard-cli:build`
- [x] 运行 `pnpm run build`
- [x] Smoke check：启动已构建 editor 服务并检查 `/api/health`
- [x] Smoke check：检查前端构建产物存在

自动化结果补充说明：
- `pnpm run navhoard-cli:build` 通过
- `pnpm run build` 通过
- 已启动构建后的 editor 服务并确认：
  - `GET /api/health` 返回 `200`
  - `GET /` 返回 `200`
  - 首页内容包含 `NavHoard Editor`
- 已确认前端构建产物存在：
  - `dist/index.html`
  - `dist/assets/main-DxY7xnOF.css`
  - `dist/assets/main-ButF9G2o.js`

## 8. 通过标准

- [ ] 主站可用
- [ ] 编辑器可用
- [ ] 数据维护链路正确
- [ ] 构建通过
- [ ] 文档可读
