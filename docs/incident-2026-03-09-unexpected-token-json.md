# 页面报错复盘：`Unexpected token '<'`（2026-03-09）

## 现象
- 页面加载时出现报错：
  - `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- 点击“重试”后仍可能复现。

## 直接成因
- 前端把某个接口响应当作 JSON 解析，但实际拿到的是 HTML（通常是 `index.html`，以 `<!DOCTYPE html>` 开头）。
- 当代码执行 `response.json()` 或 `JSON.parse(text)` 时，首字符是 `<`，因此抛出该错误。

## 深层成因
- 数据加载流程先请求 `data/manifest.json`（分片模式），再回退到 `data/index.json`（单文件模式）。
- 在当前部署场景下，`manifest.json` 不存在或路径不匹配时，服务端没有返回明确的 JSON 404，而是回退返回了 HTML 页面。
- 代码对“返回内容是不是 JSON”缺少防护，导致把 HTML 直接按 JSON 解析。
- 同时项目中存在 `src/nav-hoard.ts` 与 `src/nav-hoard.js` 双文件，入口曾使用无扩展名导入，存在命中旧实现的风险，放大了问题复现概率。

## 为什么报错是 `<`
- JSON 文本通常以 `{` 或 `[` 开头。
- HTML 文本通常以 `<` 开头（例如 `<!DOCTYPE html>`）。
- 因此该错误本质是在告诉我们：请求期望 JSON，但收到的是 HTML。

## 已实施修复
- 在 `src/nav-hoard.ts` 增加 `fetchJsonSafe()`：
  - 先读取文本，再安全 `JSON.parse`。
  - 解析失败返回 `null`，避免异常中断。
- 重构 `loadData()`：
  - `manifest.json` 读取失败/非 JSON 时自动回退到 `data/index.json`。
  - 分片与单文件两种结构统一归一化处理。
- 在 `src/main.ts` 改为显式导入 `./nav-hoard.ts`，避免无扩展名解析到旧 `js` 文件。

## 预防建议
- 对所有数据请求统一做“内容校验 + 解析兜底”，不要直接裸调 `response.json()`。
- 对静态数据路径建立启动前检查（例如 CI 校验 `public/data/index.json` 与可选 `manifest.json`）。
- 入口导入避免无扩展名歧义，减少 `.ts/.js` 同名文件共存时的解析偏差。
- 对部署环境配置 SPA fallback 时，给 `/data/*.json` 保留真实 404/错误响应，避免错误地返回 HTML。

