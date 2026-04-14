# Nav Hoard Agent Style Playbook

这份文档面向需要为 Nav Hoard 修改样式的 Agent。

目标是让 Agent 在改视觉时尽量：
- 不破坏现有结构
- 不把共享样式改散
- 不误把“项目默认样式”和“用户自定义覆盖”混在一起

## 核心原则

- 先分清“默认样式”与“项目自定义覆盖”
- 先改共享层，再改页面层，最后才改局部选择器
- 主站和 editor 能共用的样式，优先放到共享层
- 不要改 `dist/`

## 样式层级

当前项目有 4 层样式入口：

1. `src/styles-base.css`
   - 共享基础层
   - 放颜色变量、背景、圆角、阴影、基础表单、基础按钮、通用 panel
   - **主站和 editor 都会使用**

2. `src/styles-default.css`
   - 主站默认样式
   - 放导航页、卡片区、筛选区、主入口布局等主站专属样式

3. `tools/navhoard-cli/src/editor-html.ts`
   - editor 专属样式
   - 只放 editor 独有布局与交互样式
   - 能抽到共享层的，不要留在这里

4. `public/nav-hoard.custom.css`
   - 用户自定义覆盖层
   - 在默认样式之后加载
   - 用于项目级主题定制，不应该承载核心默认视觉逻辑

## 修改落点选择

### 场景一：改主站和 editor 都会用到的视觉

例如：
- 主色
- 背景色
- 圆角
- 阴影
- 通用按钮
- 通用输入框

优先修改：

```text
src/styles-base.css
```

### 场景二：只改主站外观

例如：
- 首页 header
- 标签区
- 主卡片布局
- 主站 toast / 收藏按钮 / 列表布局

优先修改：

```text
src/styles-default.css
```

### 场景三：只改 editor 外观

例如：
- 左右双栏布局
- editor 列表滚动区
- editor 表单区布局
- editor 专属 badge / 快捷按钮

优先修改：

```text
tools/navhoard-cli/src/editor-html.ts
```

### 场景四：用户明确要求“不要改默认样式，只做当前项目覆盖”

优先修改：

```text
public/nav-hoard.custom.css
```

## 推荐修改顺序

当 Agent 接到样式需求时，建议按这个顺序思考：

1. 这是主站专属、editor 专属，还是两边共用？
2. 能否通过覆盖变量解决，而不是新增很多选择器？
3. 如果是默认能力，是否应该进源码层，而不是放到 `public/nav-hoard.custom.css`？
4. 修改后是否会影响已有交互状态：
   - hover
   - active
   - focus
   - sticky
   - scroll
   - mobile layout

## 推荐做法

- 优先改 `:root` 或共享变量
- 优先复用已有类：
  - `.nh-panel`
  - `.nh-input`
  - `.nh-button`
- 优先保持主站与 editor 的视觉语言一致
- 如果 editor 新增了可复用样式，考虑上提到 `src/styles-base.css`
- 小步修改，避免一次重写整段样式

## 禁止事项

- 把本应属于默认样式的逻辑塞进 `public/nav-hoard.custom.css`
- 为了解决局部问题，复制整大段主样式
- 新增大量高优先级选择器或过深嵌套
- 直接改 `dist/`
- 在未验证前随意调整共享变量命名

## 验证方式

样式修改后，Agent 至少应做这些检查：

### 主站验证

```bash
pnpm run dev
```

检查：
- 首页是否正常渲染
- 搜索 / 标签 / 收藏 / 复制按钮是否正常
- 深浅层级是否还清晰

### editor 验证

```bash
pnpm run edit
```

检查：
- 左右双栏是否正常
- 列表与表单是否都可滚动
- 输入框 / 按钮 / badge / sticky 区域是否正常

### 构建验证

```bash
pnpm run build
pnpm run build:cli
```

## 决策表

| 需求 | 优先修改位置 |
| --- | --- |
| 改主色 / 背景 / 圆角 / 阴影 | `src/styles-base.css` |
| 改主站卡片 / 标签 / header | `src/styles-default.css` |
| 改 editor 布局 / editor 列表 / editor 表单 | `tools/navhoard-cli/src/editor-html.ts` |
| 做项目级主题覆盖 | `public/nav-hoard.custom.css` |

## 判断标准

如果 Agent 改完样式后，满足下面这几点，就说明落点大概率是对的：

- 主站和 editor 没被无关改动一起带歪
- 共享视觉被放进共享层
- 项目级个性化覆盖仍然可以通过 `public/nav-hoard.custom.css` 完成
- 代码库没有新增一堆重复样式
