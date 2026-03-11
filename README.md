# 积径 Nav Hoard

一个轻量、可嵌入的现代网址导航页，基于 Vite + Lit + Web Components 构建。

> 精选链接，随手收藏。纯前端只读，内容更新通过手动工具完成。

## 特性

- 单页面设计，无路由依赖
- 实时搜索 + 标签筛选 + 排序
- 本地收藏（localStorage 持久化）
- 响应式布局，移动端友好
- CSS 变量系统，自动适配博客主题（如 multiterm）
- 数据分片 + MiniSearch 全文索引，支持 5k+ 条目
- 总 JS gzip < 20KB

## 技术栈

- **构建**: Vite 5
- **UI**: Lit 3 (Web Components)
- **搜索**: MiniSearch
- **样式**: CSS 自定义属性 + 原生 CSS

## 快速开始

### 开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

### 构建

```bash
# 默认 basePath = /
npm run build

# Adapter 模式示例：挂载到 /nav/
VITE_BASE_PATH=/nav/ npm run build
```

构建产物在 `dist/` 目录。

### 预览

```bash
npx vite preview
```

## 部署方式

### Standalone（独立站）

将 `dist/` 部署到 GitHub Pages 或任何静态托管（Vercel/Netlify/S3）。

默认路径为 `/`，可直接访问 `https://yourdomain.com/`。

### Adapter（博客挂载）

将 `dist/` 的内容复制到博客的静态资源目录下，按挂载路径配置 `VITE_BASE_PATH`。

**Astro 示例**（multiterm 主题）：

```bash
VITE_BASE_PATH=/nav/ npm run build
# 将 dist 目录复制到博客的 /public/nav/ 下
```

在博客页面中使用：

```astro
---
import NavHoard from 'nav-hoard';
---
<NavHoard />
```

或直接引入 JS：

```html
<script type="module" src="/nav/assets/main.js"></script>
<nav-hoard></nav-hoard>
```

## 主题兼容性

组件内部定义 `--nh-*` 变量，默认映射到常见 Astro 主题变量，开箱即用：

```css
:host {
  --nh-bg: var(--background, #ffffff);
  --nh-text: var(--text-color, #1a1a1a);
  --nh-accent: var(--primary, #2563eb);
  /* ... */
}
```

如果你的博客使用 multiterm 主题，无需额外配置。

其他主题可通过覆盖 `--nh-*` 变量适配，或者使用 AI 生成映射：

**AI Prompt**：

```
你是一个 CSS 专家。以下是我的博客主题 CSS 变量定义（复制粘贴 global.css 中的 :root 部分）：

<PASTE_CSS_VARIABLES>

请生成一个 CSS 块，为 nav-hoard 组件设置 --nh-* 变量，使其视觉上与博客保持一致。只输出 CSS。
```

将生成的 `nav-hoard { ... }` 加入全局样式即可。

## 数据格式

前端加载 `data/index.json`，结构：

```json
{
  "version": "0.2",
  "updated_at": "ISO8601",
  "entries": [
    {
      "id": "string",
      "url": "string",
      "title": "string",
      "summary": "string",
      "tags": ["tag1", "tag2"],
      "source": "string",
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ]
}
```

当条目数超过 500 时，可自动分片：`data/index-a.json`, `data/index-b.json` 等，并创建 `data/manifest.json` 分组索引。

## 更新数据（copenclaw）

内容更新依赖 `copenclaw` 工具（待实现），流程：

```bash
# 配置抓取源（data/sources.yaml）和 LLM（data/config.yaml）
npx copenclaw --sources data/sources.yaml --output public/data/index.json [--pr]
```

生成新数据后重新构建部署即可。

## 项目结构

```
nav-hoard/
├── data/                # copenclaw 使用的配置与源
│   ├── sources.yaml
│   └── config.yaml
├── public/
│   └── data/            # 前端加载的 JSON 数据（构建时复制到 dist）
│       └── index.json
├── src/
│   ├── nav-hoard.ts    # Web Component
│   ├── styles.css      # 组件样式
│   └── main.ts         # 入口
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 开发计划

- [x] MVP 前端（搜索、筛选、收藏）
- [x] 响应式 + 主题兼容
- [ ] copenclaw 数据更新工具
- [ ] CI/PR 自动化流程
- [ ] 更多主题适配示例

## License

MIT
