# Nav Hoard

一个轻量、可嵌入、以数据文件为中心的网址导航项目。

它包含两部分：

- 前端站点：基于 `Vite + Lit + Web Components`
- 内容维护工具：`navhoard-cli`，负责批量更新和单条交互式录入

适合个人项目、博客挂载页、静态导航页，以及“内容放在仓库里维护”的工作流。

## 功能概览

- 单页面导航页，支持搜索、标签筛选、收藏
- 前端纯静态部署，默认可部署到 GitHub Pages
- `data/index.json` 作为唯一规范数据源
- `public/data/` 作为前端运行时发布产物目录
- 支持批量抓取更新
- 支持单条 URL 交互式录入、审阅、确认后写入

## 技术栈

- 前端：`Lit 3`、`MiniSearch`
- 构建：`Vite 5`、`TypeScript`
- 内容维护：`tools/navhoard-cli`
- 部署：`GitHub Actions + GitHub Pages`

## 目录结构

```text
nav-hoard/
├── data/
│   ├── index.json              # 规范数据源（single source of truth）
│   ├── sources.yaml            # 批量抓取源配置
│   └── config.yaml             # 抓取/模型配置
├── public/
│   └── data/                   # 前端运行时数据（由 data/index.json 发布生成）
├── src/                        # 前端源码
├── tools/
│   └── navhoard-cli/              # 数据维护工具
├── .github/
│   └── workflows/
│       └── deploy-pages.yml    # GitHub Pages 自动部署
└── README.md
```

## 数据约定

### 规范数据源

- 项目唯一规范数据源是 `data/index.json`
- 后续不论是批量更新还是单条交互录入，都应写到这个文件

数据结构示例：

```json
{
  "version": "0.2",
  "updated_at": "2026-03-11T00:00:00.000Z",
  "entries": [
    {
      "id": "abc123def456",
      "url": "https://example.com",
      "title": "Example",
      "summary": "Example summary",
      "tags": ["Example", "工具"],
      "source": "example.com",
      "created_at": "2026-03-11T00:00:00.000Z",
      "updated_at": "2026-03-11T00:00:00.000Z"
    }
  ]
}
```

### 前端发布数据

- 前端默认从 `public/data/` 读取运行时数据
- 条目较少时读取 `data/index.json`
- 条目较多时读取 `data/manifest.json` 和 `data/index-*.json`

也就是说：

- `data/index.json`：内容维护的真实来源
- `public/data/*`：给前端读的发布产物

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动前端开发服务器

```bash
pnpm run dev
```

默认访问：`http://localhost:3000`

### 3. 构建前端

```bash
pnpm run build
```

构建产物输出到 `dist/`。

### 4. 本地预览生产构建

```bash
pnpm run preview
```

## 内容维护

### 先构建 `navhoard-cli`

首次使用 `navhoard-cli` 的批量更新或单条录入工作流前，先构建工具：

```bash
pnpm run navhoard-cli:build
```

## 批量更新数据

如果你已经配置好了 `data/sources.yaml` 和 `data/config.yaml`，可以运行：

```bash
pnpm run navhoard-cli -- --sources data/sources.yaml --config data/config.yaml --output data/index.json
```

执行结果：

- 读取抓取源配置
- 拉取并归一化条目
- 合并到 `data/index.json`
- 同步生成 `public/data/` 下的前端运行时数据

## 交互式添加单条链接

这是当前项目推荐的“个人维护”方式。

### 方式一：直接通过命令行工作流

#### 第 1 步：抓取 URL 并生成审阅模板

```bash
pnpm run entry-workflow -- capture --url "https://example.com" --write .tmp/navhoard-entry-review.yaml
```

这一步会：

- 尝试抓取并提取页面内容
- 生成统一的审阅模板
- 把模板写入 `.tmp/navhoard-entry-review.yaml`

#### 第 2 步：编辑模板

打开 `.tmp/navhoard-entry-review.yaml`，检查并修改：

- `title`
- `summary`
- `tags`
- `source`
- `confirm`

注意：

- 如果抓取成功，模板里会有自动提取结果
- 如果抓取失败，也会返回一个可编辑模板
- 真正写入前，必须把 `confirm: false` 改成 `confirm: true`

#### 第 3 步：可选，先只解析模板不写入

```bash
pnpm run entry-workflow -- parse --template .tmp/navhoard-entry-review.yaml
```

这一步适合先检查模板是否合法。

#### 第 4 步：确认并写入数据源

```bash
pnpm run entry-workflow -- confirm --template .tmp/navhoard-entry-review.yaml --output data/index.json
```

这一步会：

- 解析你修改后的模板
- 校验字段
- 归一化 URL
- 与已有数据去重合并
- 写入 `data/index.json`
- 同步生成 `public/data/` 发布产物

#### 第 5 步：本地验证

```bash
pnpm run dev
```

打开页面后确认新条目已经展示、搜索可用、标签正常。

如果你平时录入链接比较频繁，推荐先在本地累计一批条目，再统一确认、提交和发布，这样内容整理和验证会更顺手。

### 方式二：通过 skill / 会话能力模板

项目已经准备了两份 skill：

- `skills/nav-hoard-entry-add/SKILL.md`：仓库内可提交的通用版本
- `.codex/skills/nav-hoard-entry-add/Skill.md`：本地可直接使用的 Codex 版本

你可以在会话里直接说类似的话：

- “帮我给 NavHoard 添加一个新条目”
- “为这个项目录入一个链接”
- “抓取这个 URL，生成模板让我确认后再写入”

这份 skill / 会话模板会引导你完成：

1. 输入 URL
2. 抓取内容
3. 返回统一模板
4. 等你修改并确认
5. 写入 `data/index.json`
6. 提示你是否需要本地验证或继续提交

如果你使用的是其他支持本地 skill、提示词目录或会话工作流的 Agent，也可以直接参考 `skills/nav-hoard-entry-add/SKILL.md` 进行适配，不需要限定为 Codex。

## 部署到 GitHub Pages

项目已接入 GitHub Actions 工作流：

- `.github/workflows/deploy-pages.yml`

### 工作流行为

当你把代码 push 到 `main` 分支时，工作流会自动：

1. 安装依赖
2. 自动计算 `VITE_BASE_PATH`
3. 执行 `pnpm run build`
4. 上传 `dist/`
5. 发布到 GitHub Pages

### Base Path 说明

工作流会自动区分两种 Pages 场景：

- 用户/组织主页仓库：`owner.github.io` → `VITE_BASE_PATH=/`
- 项目页仓库：`repo-name` → `VITE_BASE_PATH=/repo-name/`

因此通常不需要你手动改 `vite.config.ts`。

### 第一次启用 GitHub Pages

在 GitHub 仓库里执行：

1. 打开 `Settings`
2. 进入 `Pages`
3. 在 `Source` 中选择 `GitHub Actions`

完成后，只要 push 到 `main`，就会自动部署。

如果仓库或组织默认禁用了 Actions，还需要额外检查：

1. 打开 `Settings`
2. 进入 `Actions` → `General`
3. 确认当前仓库允许运行 GitHub Actions workflow

如果这是组织仓库，还要确认组织层面没有禁止该仓库运行 Actions。

### 推荐发布流程

1. 本地修改代码或数据
2. 本地验证：`pnpm run dev`
3. 提交并 push 到 `main`
4. 等待 GitHub Actions 部署完成
5. 打开 Pages 地址验收

## 作为独立站使用

如果你只想把它当一个独立静态站点：

```bash
pnpm run build
```

然后把 `dist/` 部署到任意静态托管平台即可。

## 作为博客挂载页使用

如果你希望挂载到博客子路径，例如 `/nav/`：

```bash
VITE_BASE_PATH=/nav/ pnpm run build
```

然后把 `dist/` 内容拷贝到博客静态资源目录下。

## 常用命令速查

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run preview

pnpm run navhoard-cli:build
pnpm run navhoard-cli -- --sources data/sources.yaml --config data/config.yaml --output data/index.json

pnpm run entry-workflow -- capture --url "https://example.com" --write .tmp/navhoard-entry-review.yaml
pnpm run entry-workflow -- parse --template .tmp/navhoard-entry-review.yaml
pnpm run entry-workflow -- confirm --template .tmp/navhoard-entry-review.yaml --output data/index.json
```

## 当前进度

- [x] 前端导航页 MVP
- [x] 规范数据路径统一
- [x] 单条抓取草稿管线
- [x] 统一审阅模板与确认写入
- [x] skill 工作流模板
- [x] GitHub Pages 自动部署
- [ ] 仓库提交检查与更完整的自动提交流程

## License

MIT
