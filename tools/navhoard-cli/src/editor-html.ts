export const EDITOR_HTML = String.raw`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NavHoard Editor</title>
    <link rel="stylesheet" href="/nav-hoard.base.css" />
    <link rel="stylesheet" href="/nav-hoard.custom.css" />
    <style>
      :root {
        color-scheme: dark;
        --editor-bg: var(--background, #0b1220);
        --editor-bg-soft: rgba(11, 16, 32, 0.84);
        --editor-panel: linear-gradient(180deg, rgba(12, 18, 36, 0.82), rgba(11, 16, 32, 0.74));
        --editor-panel-muted: rgba(18, 27, 50, 0.82);
        --editor-border: var(--border-color, rgba(148, 163, 184, 0.22));
        --editor-border-strong: rgba(124, 156, 255, 0.34);
        --editor-text: var(--text-color, #e8edf9);
        --editor-text-soft: var(--text-soft, #95a3c7);
        --editor-accent: var(--primary, #7c9cff);
        --editor-accent-strong: var(--primary-strong, #5a78ff);
        --editor-accent-soft: var(--primary-soft, rgba(124, 156, 255, 0.14));
        --editor-danger: #dc2626;
        --editor-shadow: var(--nh-shadow, 0 20px 50px rgba(15, 23, 42, 0.18));
        --editor-shadow-soft: var(--nh-shadow-soft, 0 10px 30px rgba(15, 23, 42, 0.12));
        --editor-entry-bg: linear-gradient(180deg, rgba(16, 24, 44, 0.96), rgba(12, 19, 35, 0.9));
        --editor-entry-active-bg: linear-gradient(180deg, rgba(31, 46, 84, 0.92), rgba(18, 29, 59, 0.9));
      }
      html, body {
        height: 100%;
        overflow: hidden;
      }
      body { background: transparent; color: var(--editor-text); }
      .app {
        display: grid;
        grid-template-columns: 360px 1fr;
        height: 100vh;
        gap: 18px;
        max-width: min(100%, calc(var(--max-width, 1180px) + 160px));
        margin: 0 auto;
        padding: 20px;
        overflow: hidden;
      }
      .sidebar, .editor {
        min-height: 0;
        padding: 20px;
      }
      .sidebar {
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background:
          linear-gradient(180deg, rgba(15, 24, 48, 0.94), rgba(12, 19, 38, 0.9)),
          linear-gradient(135deg, rgba(124, 156, 255, 0.12), rgba(110, 231, 255, 0.06));
        color: var(--editor-text);
        overflow: hidden;
      }
      .editor {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-height: 0;
        padding: 0 4px 0 0;
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(124, 156, 255, 0.4) rgba(255, 255, 255, 0.04);
      }
      .editor::-webkit-scrollbar {
        width: 10px;
      }
      .editor::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 999px;
      }
      .editor::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(124, 156, 255, 0.52), rgba(90, 120, 255, 0.38));
        border-radius: 999px;
        border: 2px solid rgba(11, 16, 32, 0.7);
      }
      .editor::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(124, 156, 255, 0.72), rgba(90, 120, 255, 0.54));
      }
      h1, h2 { margin: 0; }
      .muted { color: var(--editor-text-soft); font-size: 13px; }
      .toolbar, .list-toolbar, .row {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .toolbar { justify-content: space-between; }
      .nh-input,
      .entry-item {
        outline: none;
      }
      textarea.nh-input {
        min-height: 140px;
        resize: vertical;
      }
      .nh-button {
        white-space: nowrap;
      }
      .entry-list {
        margin-top: 16px;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: 8px;
        min-height: 0;
        overflow: auto;
        padding-right: 4px;
        scrollbar-width: thin;
        scrollbar-color: rgba(124, 156, 255, 0.4) rgba(255, 255, 255, 0.04);
      }
      .entry-list::-webkit-scrollbar {
        width: 10px;
      }
      .entry-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 999px;
      }
      .entry-list::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(124, 156, 255, 0.52), rgba(90, 120, 255, 0.38));
        border-radius: 999px;
        border: 2px solid rgba(11, 16, 32, 0.7);
      }
      .entry-list::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(124, 156, 255, 0.72), rgba(90, 120, 255, 0.54));
      }
      .list-toolbar {
        justify-content: space-between;
      }
      .list-toolbar .nh-input {
        flex: 1 1 auto;
      }
      .list-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      .selection-summary {
        font-size: 12px;
        color: var(--editor-text-soft);
      }
      .entry-item {
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 16px;
        padding: 12px;
        background: var(--editor-entry-bg);
        cursor: pointer;
        text-align: left;
        color: var(--editor-text);
        box-shadow: var(--editor-shadow-soft);
        appearance: none;
        transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
      }
      .entry-item-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 6px;
      }
      .entry-item.active {
        border-color: var(--editor-border-strong);
        box-shadow:
          0 0 0 1px rgba(124, 156, 255, 0.22) inset,
          0 18px 38px rgba(27, 39, 94, 0.2);
        background: var(--editor-entry-active-bg);
      }
      .entry-item:hover {
        border-color: rgba(124, 156, 255, 0.24);
        transform: translateY(-1px);
      }
      .entry-item.bulk-mode {
        cursor: default;
      }
      .entry-item.bulk-mode:hover {
        transform: none;
      }
      .entry-item.selected-for-bulk {
        border-color: color-mix(in srgb, var(--editor-accent) 46%, transparent);
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--editor-accent) 24%, transparent) inset,
          0 14px 30px rgba(27, 39, 94, 0.16);
      }
      .entry-item strong {
        display: block;
        margin-bottom: 6px;
        color: var(--editor-text);
      }
      .entry-item small {
        display: block;
        color: var(--editor-text-soft);
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .entry-featured-badge {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        padding: 0 8px;
        border-radius: 999px;
        background: rgba(124, 156, 255, 0.14);
        color: #dce7ff;
        font-size: 12px;
        line-height: 1;
        white-space: nowrap;
      }
      .entry-featured-toggle {
        flex: 0 0 auto;
        min-height: 24px;
        padding: 0 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--editor-text-soft);
        cursor: pointer;
        transition: 180ms ease;
      }
      .entry-featured-toggle:hover {
        border-color: rgba(124, 156, 255, 0.28);
        background: rgba(124, 156, 255, 0.1);
        color: #f8fbff;
      }
      .entry-featured-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .entry-select-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        margin-right: 6px;
        border-radius: 8px;
        border: 1px solid color-mix(in srgb, var(--editor-accent) 26%, transparent);
        background: color-mix(in srgb, var(--editor-accent) 8%, transparent);
        color: var(--editor-text-soft);
        cursor: pointer;
        flex: 0 0 auto;
      }
      .entry-select-toggle.active {
        color: #fff;
        border-color: color-mix(in srgb, var(--editor-accent) 54%, transparent);
        background: color-mix(in srgb, var(--editor-accent) 24%, transparent);
      }
      .panel {
        background: var(--editor-panel);
        padding: 18px;
        border-color: rgba(255, 255, 255, 0.08);
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .form-grid .full {
        grid-column: 1 / -1;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 14px;
      }
      .status {
        min-height: 24px;
        font-size: 13px;
        white-space: pre-wrap;
      }
      .status.error { color: var(--editor-danger); }
      .status.success { color: #059669; }
      .status.info { color: var(--editor-accent); }
      .hint {
        font-size: 12px;
        color: var(--editor-text-soft);
      }
      .check-row {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 44px;
        padding: 0 12px;
        border: 1px solid var(--editor-border);
        border-radius: 12px;
        background: var(--editor-panel-muted);
      }
      .check-row input[type='checkbox'] {
        width: 16px;
        height: 16px;
        margin: 0;
      }
      .hidden { display: none; }
      .url-row {
        display: flex;
        gap: 8px;
        align-items: stretch;
      }
      .url-row input {
        flex: 1 1 auto;
      }
      .tag-field {
        gap: 8px;
      }
      .tag-editor {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px;
        border: 1px solid var(--editor-border);
        border-radius: 14px;
        background: var(--editor-panel-muted);
      }
      .tag-chip-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 24px;
      }
      .tag-token,
      .tag-suggestion {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 30px;
        padding: 0 10px;
        border: 1px solid color-mix(in srgb, var(--editor-accent) 28%, transparent);
        border-radius: 999px;
        background: color-mix(in srgb, var(--editor-accent) 10%, transparent);
        color: var(--editor-text);
        line-height: 1;
      }
      .tag-token::before,
      .tag-suggestion::before {
        content: '#';
        color: var(--editor-accent);
        opacity: 0.88;
      }
      .tag-token-remove {
        border: 0;
        padding: 0;
        background: transparent;
        color: var(--editor-text-soft);
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
      }
      .tag-token-remove:hover {
        color: var(--editor-text);
      }
      .tag-input-row {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .tag-input-row .nh-input {
        flex: 1 1 220px;
      }
      .tag-editor-meta {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
        font-size: 12px;
        color: var(--editor-text-soft);
      }
      .tag-suggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .tag-suggestion {
        cursor: pointer;
        transition: 180ms ease;
      }
      .tag-suggestion:hover {
        border-color: color-mix(in srgb, var(--editor-accent) 42%, transparent);
        background: color-mix(in srgb, var(--editor-accent) 16%, transparent);
        color: #fff;
      }
      .tag-suggestion small {
        color: inherit;
        opacity: 0.7;
      }
      .tag-empty {
        color: var(--editor-text-soft);
        font-size: 12px;
      }
      @media (max-width: 960px) {
        html, body {
          overflow: auto;
        }
        .app {
          grid-template-columns: 1fr;
          height: auto;
          min-height: 100vh;
          padding: 12px;
          overflow: visible;
        }
        .sidebar,
        .editor {
          overflow: visible;
        }
        .entry-list {
          flex: none;
          min-height: 0;
          max-height: 280px;
        }
        .form-grid { grid-template-columns: 1fr; }
        .url-row { flex-direction: column; }
        .list-actions {
          align-items: stretch;
        }
        .tag-input-row {
          flex-direction: column;
          align-items: stretch;
        }
      }
    </style>
  </head>
  <body>
    <div class="app">
      <aside class="sidebar nh-panel">
        <div class="toolbar">
          <div>
            <h1>NavHoard Editor</h1>
            <div class="muted">本地编辑 data/index.json</div>
          </div>
          <button id="new-entry" class="nh-button nh-button--ghost" type="button">新建</button>
        </div>
        <div class="list-toolbar" style="margin-top: 16px;">
          <input id="search-input" class="nh-input" type="search" placeholder="搜索标题 / URL / 标签" />
          <button id="featured-filter" class="nh-button nh-button--ghost" type="button">只看置顶</button>
        </div>
        <div class="list-actions">
          <button id="bulk-toggle" class="nh-button nh-button--ghost" type="button">批量选择</button>
          <button id="bulk-select-all" class="nh-button nh-button--ghost hidden" type="button">全选当前结果</button>
          <button id="bulk-delete" class="nh-button nh-button--danger hidden" type="button">删除选中</button>
          <span id="bulk-summary" class="selection-summary hidden">未选择条目</span>
        </div>
        <div class="muted" id="entry-count" style="margin-top: 10px;">加载中…</div>
        <div class="entry-list" id="entry-list"></div>
      </aside>
      <main class="editor">
        <section class="panel nh-panel">
          <div class="toolbar">
            <div>
              <h2>条目编辑</h2>
              <div class="muted">先支持好新建、同步、导入、保存这条链路。</div>
            </div>
            <div class="row">
              <input id="bookmark-file" class="hidden" type="file" accept=".html,.htm,text/html" />
              <input id="preview-file" class="hidden" type="file" accept="image/*" />
              <button id="import-bookmarks" class="nh-button nh-button--ghost" type="button">导入书签</button>
              <button id="delete-entry" class="nh-button nh-button--danger" type="button">删除</button>
              <button id="save-all" class="nh-button" type="button">保存全部</button>
            </div>
          </div>
          <div id="status" class="status info" style="margin-top: 12px;"></div>
        </section>

        <section class="panel nh-panel">
          <div class="form-grid">
            <label class="full">
              标题
              <input id="field-title" class="nh-input" type="text" placeholder="例如：深入理解 React Hooks 的工作原理" />
            </label>
            <label class="full">
              URL
              <div class="url-row">
                <input id="field-url" class="nh-input" type="url" placeholder="https://example.com/article" />
                <button id="sync-entry" class="nh-button nh-button--ghost" type="button">同步</button>
              </div>
              <div class="hint">推荐流程：点击新建，填入 URL，再点同步，自动补齐标题、摘要、标签和来源。</div>
            </label>
            <label>
              来源
              <input id="field-source" class="nh-input" type="text" placeholder="example.com" />
            </label>
            <label class="full tag-field">
              标签
              <div class="tag-editor">
                <div id="field-tags-selected" class="tag-chip-list"></div>
                <div class="tag-input-row">
                  <input id="field-tags-input" class="nh-input" type="text" placeholder="输入标签后按回车 / 逗号添加" />
                  <button id="field-tags-add" class="nh-button nh-button--ghost" type="button">添加标签</button>
                </div>
                <div class="tag-editor-meta">
                  <span>支持回车、逗号、粘贴多个标签；点击已添加标签右侧 × 可删除。</span>
                  <span id="field-tags-count">0 个标签</span>
                </div>
                <div id="field-tags-suggestions" class="tag-suggestions"></div>
              </div>
              <input id="field-tags" type="hidden" />
            </label>
            <label class="full">
              摘要
              <textarea id="field-summary" class="nh-input" placeholder="摘要可手动填写；留空时保存流程会自动补全。"></textarea>
            </label>
            <label>
              预览图
              <span class="check-row">
                <input id="field-preview-enabled" type="checkbox" />
                <span>为这条内容启用预览图</span>
              </span>
            </label>
            <label>
              预览图模式
              <select id="field-preview-mode" class="nh-input">
                <option value="auto">自动抓取</option>
                <option value="external">外链</option>
                <option value="local">本地 public</option>
              </select>
            </label>
            <label class="full">
              预览图地址
              <div class="url-row">
                <input id="field-preview-src" class="nh-input" type="text" placeholder="https://example.com/cover.jpg 或 images/previews/demo.png" />
                <button id="upload-preview" class="nh-button nh-button--ghost" type="button">上传图片</button>
              </div>
              <div class="hint">自动抓取会在点击“同步”后尝试填充；本地上传会保存到 public/images/previews/。</div>
            </label>
            <label class="full">
              预览图说明
              <input id="field-preview-alt" class="nh-input" type="text" placeholder="例如：文章头图、站点封面" />
            </label>
            <label>
              创建时间
              <input id="field-created-at" class="nh-input" type="datetime-local" />
            </label>
            <label>
              更新时间
              <input id="field-updated-at" class="nh-input" type="datetime-local" />
            </label>
            <label>
              置信度（可选）
              <input id="field-confidence" class="nh-input" type="number" min="0" max="1" step="0.1" placeholder="0.7" />
            </label>
            <label>
              默认隐藏
              <span class="check-row">
                <input id="field-hidden" type="checkbox" />
                <span>启用后，主站默认不展示这条内容</span>
              </span>
            </label>
            <label>
              作者推荐 / 置顶
              <span class="check-row">
                <input id="field-featured" type="checkbox" />
                <span>在首页“作者推荐”区展示这条内容</span>
              </span>
            </label>
            <label>
              推荐顺序
              <input id="field-featured-rank" class="nh-input" type="number" min="1" max="999" step="1" placeholder="数字越小越靠前" />
            </label>
            <div class="full hint">保存时会统一执行 URL 规范化、标签清洗、去重、校验，并同步生成发布数据。</div>
          </div>
        </section>
      </main>
    </div>

    <script>
      const state = {
        entries: [],
        selectedId: null,
        search: '',
        counter: 0,
        dirty: false,
        isSaving: false,
        pendingReload: false,
        ignoreReloadUntil: 0,
        featuredOnly: false,
        bulkMode: false,
        bulkSelectedIds: []
      };

      const elements = {
        entryList: document.getElementById('entry-list'),
        entryCount: document.getElementById('entry-count'),
        status: document.getElementById('status'),
        searchInput: document.getElementById('search-input'),
        featuredFilter: document.getElementById('featured-filter'),
        bulkToggle: document.getElementById('bulk-toggle'),
        bulkSelectAll: document.getElementById('bulk-select-all'),
        bulkDelete: document.getElementById('bulk-delete'),
        bulkSummary: document.getElementById('bulk-summary'),
        newEntry: document.getElementById('new-entry'),
        deleteEntry: document.getElementById('delete-entry'),
        saveAll: document.getElementById('save-all'),
        syncEntry: document.getElementById('sync-entry'),
        importBookmarks: document.getElementById('import-bookmarks'),
        bookmarkFile: document.getElementById('bookmark-file'),
        previewFile: document.getElementById('preview-file'),
        uploadPreview: document.getElementById('upload-preview'),
        title: document.getElementById('field-title'),
        url: document.getElementById('field-url'),
        source: document.getElementById('field-source'),
        tags: document.getElementById('field-tags'),
        tagsInput: document.getElementById('field-tags-input'),
        tagsAdd: document.getElementById('field-tags-add'),
        tagsSelected: document.getElementById('field-tags-selected'),
        tagsSuggestions: document.getElementById('field-tags-suggestions'),
        tagsCount: document.getElementById('field-tags-count'),
        summary: document.getElementById('field-summary'),
        previewEnabled: document.getElementById('field-preview-enabled'),
        previewMode: document.getElementById('field-preview-mode'),
        previewSrc: document.getElementById('field-preview-src'),
        previewAlt: document.getElementById('field-preview-alt'),
        createdAt: document.getElementById('field-created-at'),
        updatedAt: document.getElementById('field-updated-at'),
        confidence: document.getElementById('field-confidence'),
        hidden: document.getElementById('field-hidden'),
        featured: document.getElementById('field-featured'),
        featuredRank: document.getElementById('field-featured-rank')
      };

      function nowIso() {
        return new Date().toISOString();
      }

      function nowLocalInputValue() {
        return isoToLocalInput(nowIso());
      }

      function isoToLocalInput(value) {
        if (!value) return nowLocalInputValue();
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return nowLocalInputValue();
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }

      function localInputToIso(value) {
        if (!value) return nowIso();
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return nowIso();
        return date.toISOString();
      }

      function makeEntry(partial) {
        state.counter += 1;
        return {
          localId: 'entry-' + state.counter,
          id: partial.id || '',
          title: partial.title || '',
          url: partial.url || '',
          source: partial.source || '',
          tags: Array.isArray(partial.tags) ? partial.tags.join(', ') : (partial.tags || ''),
          summary: partial.summary || '',
          preview_enabled: partial.preview && partial.preview.enabled !== false,
          preview_mode: partial.preview && partial.preview.mode ? partial.preview.mode : 'auto',
          preview_src: partial.preview && partial.preview.src ? partial.preview.src : '',
          preview_alt: partial.preview && partial.preview.alt ? partial.preview.alt : '',
          created_at: partial.created_at || nowIso(),
          updated_at: partial.updated_at || nowIso(),
          confidence: typeof partial.confidence === 'number' ? String(partial.confidence) : '',
          hide: partial.hide === true,
          featured: partial.featured === true,
          featured_rank: typeof partial.featured_rank === 'number' ? String(partial.featured_rank) : ''
        };
      }

      function currentEntry() {
        return state.entries.find(function(entry) { return entry.localId === state.selectedId; }) || null;
      }

      function parseEntryTags(value) {
        const seen = new Set();
        return String(value || '')
          .split(/[,，]/)
          .map(function(item) { return item.trim(); })
          .map(function(item) { return item.replace(/^#+/, '').replace(/\s+/g, ' ').trim(); })
          .filter(function(item) {
            if (!item || seen.has(item)) return false;
            seen.add(item);
            return true;
          });
      }

      function tagsToString(tags) {
        return parseEntryTags((tags || []).join(', ')).join(', ');
      }

      function buildKnownTagSet(excludeLocalId) {
        const known = new Set();
        state.entries.forEach(function(entry) {
          if (excludeLocalId && entry.localId === excludeLocalId) {
            return;
          }
          parseEntryTags(entry.tags).forEach(function(tag) {
            known.add(tag);
          });
        });
        return known;
      }

      function buildKnownTagStats(excludeLocalId) {
        const counts = new Map();
        state.entries.forEach(function(entry) {
          if (excludeLocalId && entry.localId === excludeLocalId) {
            return;
          }
          parseEntryTags(entry.tags).forEach(function(tag) {
            counts.set(tag, (counts.get(tag) || 0) + 1);
          });
        });
        return Array.from(counts.entries())
          .map(function(tuple) { return { tag: tuple[0], count: tuple[1] }; })
          .sort(function(left, right) {
            return right.count - left.count || String(left.tag).localeCompare(String(right.tag), 'zh-CN');
          });
      }

      function toTimestamp(value) {
        const timestamp = Date.parse(String(value || ''));
        return Number.isFinite(timestamp) ? timestamp : 0;
      }

      function sortEntriesForList(entries) {
        return entries.slice().sort(function(left, right) {
          const createdDiff = toTimestamp(right.created_at) - toTimestamp(left.created_at);
          if (createdDiff !== 0) return createdDiff;

          const updatedDiff = toTimestamp(right.updated_at) - toTimestamp(left.updated_at);
          if (updatedDiff !== 0) return updatedDiff;

          return String(right.localId).localeCompare(String(left.localId));
        });
      }

      function filteredEntries() {
        const keyword = state.search.trim().toLowerCase();
        const entries = !keyword
          ? state.entries
          : state.entries.filter(function(entry) {
          return [entry.title, entry.url, entry.source, entry.tags, entry.summary]
            .join(' ')
            .toLowerCase()
            .includes(keyword);
          });
        const filtered = state.featuredOnly
          ? entries.filter(function(entry) { return entry.featured === true; })
          : entries;
        return sortEntriesForList(filtered);
      }

      function bulkSelectedSet() {
        return new Set(state.bulkSelectedIds);
      }

      function syncBulkSelection() {
        const known = new Set(state.entries.map(function(entry) { return entry.localId; }));
        state.bulkSelectedIds = state.bulkSelectedIds.filter(function(localId) {
          return known.has(localId);
        });
      }

      function setBulkMode(nextMode) {
        state.bulkMode = nextMode;
        if (!nextMode) {
          state.bulkSelectedIds = [];
        }
        renderList();
      }

      function toggleBulkSelection(localId) {
        const selected = bulkSelectedSet();
        if (selected.has(localId)) {
          selected.delete(localId);
        } else {
          selected.add(localId);
        }
        state.bulkSelectedIds = Array.from(selected);
        renderList();
      }

      function toggleSelectAllFiltered() {
        const items = filteredEntries();
        const selected = bulkSelectedSet();
        const allSelected = items.length > 0 && items.every(function(entry) { return selected.has(entry.localId); });

        if (allSelected) {
          items.forEach(function(entry) { selected.delete(entry.localId); });
        } else {
          items.forEach(function(entry) { selected.add(entry.localId); });
        }

        state.bulkSelectedIds = Array.from(selected);
        renderList();
      }

      function setStatus(message, kind) {
        elements.status.textContent = message;
        elements.status.className = 'status ' + (kind || 'info');
      }

      function markDirty(nextDirty) {
        state.dirty = nextDirty;
        document.title = nextDirty ? 'NavHoard Editor *' : 'NavHoard Editor';
      }

      function requestLiveReload() {
        if (state.isSaving || Date.now() < state.ignoreReloadUntil) {
          return;
        }

        if (state.dirty) {
          state.pendingReload = true;
          setStatus('检测到外部变更。为避免丢失你当前的修改，将在保存后再刷新页面。', 'info');
          return;
        }

        window.location.reload();
      }

      function renderList() {
        const previousScrollTop = elements.entryList.scrollTop;
        const items = filteredEntries();
        syncBulkSelection();
        const selected = bulkSelectedSet();
        const selectedCount = state.bulkSelectedIds.length;
        const allFilteredSelected = items.length > 0 && items.every(function(entry) { return selected.has(entry.localId); });

        elements.entryCount.textContent = '当前条目：' + state.entries.length + '；筛选结果：' + items.length + (state.featuredOnly ? '；仅看置顶' : '');
        elements.featuredFilter.textContent = state.featuredOnly ? '查看全部' : '只看置顶';
        elements.bulkToggle.textContent = state.bulkMode ? '退出批量' : '批量选择';
        elements.bulkSelectAll.classList.toggle('hidden', !state.bulkMode);
        elements.bulkDelete.classList.toggle('hidden', !state.bulkMode);
        elements.bulkSummary.classList.toggle('hidden', !state.bulkMode);
        elements.bulkSelectAll.textContent = allFilteredSelected ? '取消全选' : '全选当前结果';
        elements.bulkDelete.textContent = selectedCount > 0 ? '删除选中（' + selectedCount + '）' : '删除选中';
        elements.bulkDelete.disabled = !state.bulkMode || selectedCount === 0;
        elements.bulkSummary.textContent = state.bulkMode
          ? (selectedCount > 0 ? '已选 ' + selectedCount + ' 条，可直接删除。' : '勾选或点击条目来选择待删除项。')
          : '未选择条目';
        elements.entryList.innerHTML = '';

        if (items.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'entry-item';
          empty.innerHTML = '<strong>没有匹配条目</strong><small>' + (state.featuredOnly ? '当前没有置顶条目，或搜索条件未命中置顶内容。' : '可以新建条目，或清空搜索条件。') + '</small>';
          elements.entryList.appendChild(empty);
          elements.entryList.scrollTop = previousScrollTop;
          return;
        }

        items.forEach(function(entry) {
          const card = document.createElement('div');
          card.className = 'entry-item'
            + (entry.localId === state.selectedId ? ' active' : '')
            + (state.bulkMode ? ' bulk-mode' : '')
            + (selected.has(entry.localId) ? ' selected-for-bulk' : '');
          card.tabIndex = 0;
          card.setAttribute('role', 'button');
          card.innerHTML = '<div class="entry-item-head">'
            + '<div class="entry-featured-meta">'
            + (state.bulkMode
              ? '<button class="entry-select-toggle' + (selected.has(entry.localId) ? ' active' : '') + '" type="button" aria-label="' + (selected.has(entry.localId) ? '取消选择' : '选择条目') + '">' + (selected.has(entry.localId) ? '✓' : '') + '</button>'
              : '')
            + (entry.featured ? '<span class="entry-featured-badge">置顶</span>' : '')
            + (entry.hide ? '<span class="entry-featured-badge">隐藏</span>' : '')
            + '<strong>' + escapeHtml(entry.title || '(未命名条目)') + '</strong>'
            + '</div>'
            + (entry.featured ? '<button class="entry-featured-toggle" type="button">取消置顶</button>' : '')
            + '</div>'
            + '<small>' + escapeHtml(entry.url || '未填写 URL') + '</small>'
            + '<small>' + escapeHtml(entry.tags || '无标签') + '</small>'
            + (entry.featured ? '<small>排序 ' + escapeHtml(entry.featured_rank || '100') + '</small>' : '');

          card.addEventListener('click', function() {
            if (state.bulkMode) {
              toggleBulkSelection(entry.localId);
              return;
            }
            state.selectedId = entry.localId;
            render();
          });
          card.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (state.bulkMode) {
                toggleBulkSelection(entry.localId);
                return;
              }
              state.selectedId = entry.localId;
              render();
            }
          });

          const selectToggle = card.querySelector('.entry-select-toggle');
          if (selectToggle) {
            selectToggle.addEventListener('click', function(event) {
              event.stopPropagation();
              toggleBulkSelection(entry.localId);
            });
          }

          const featuredToggle = card.querySelector('.entry-featured-toggle');
          if (featuredToggle) {
            featuredToggle.addEventListener('click', function(event) {
              event.stopPropagation();
              toggleFeaturedEntry(entry, false);
            });
          }

          elements.entryList.appendChild(card);
        });

        elements.entryList.scrollTop = previousScrollTop;
      }

      function renderForm() {
        const entry = currentEntry();
        const disabled = !entry;
        [
          elements.title,
          elements.url,
          elements.source,
          elements.tagsInput,
          elements.tagsAdd,
          elements.summary,
          elements.previewEnabled,
          elements.previewMode,
          elements.previewSrc,
          elements.previewAlt,
          elements.uploadPreview,
          elements.createdAt,
          elements.updatedAt,
          elements.confidence,
          elements.hidden,
          elements.featured,
          elements.featuredRank,
          elements.deleteEntry,
          elements.saveAll,
          elements.syncEntry
        ].forEach(function(el) {
          el.disabled = disabled;
        });

        if (!entry) {
          elements.title.value = '';
          elements.url.value = '';
          elements.source.value = '';
          elements.tags.value = '';
          elements.tagsInput.value = '';
          elements.tagsCount.textContent = '0 个标签';
          elements.tagsSelected.innerHTML = '<span class="tag-empty">暂无标签，输入后按回车快速添加。</span>';
          elements.tagsSuggestions.innerHTML = '';
          elements.summary.value = '';
          elements.previewEnabled.checked = false;
          elements.previewMode.value = 'auto';
          elements.previewSrc.value = '';
          elements.previewAlt.value = '';
          elements.createdAt.value = nowLocalInputValue();
          elements.updatedAt.value = nowLocalInputValue();
          elements.confidence.value = '';
          elements.hidden.checked = false;
          elements.featured.checked = false;
          elements.featuredRank.value = '';
          return;
        }

        elements.title.value = entry.title;
        elements.url.value = entry.url;
        elements.source.value = entry.source;
        elements.tags.value = entry.tags;
        elements.tagsInput.value = '';
        elements.summary.value = entry.summary;
        elements.previewEnabled.checked = entry.preview_enabled === true;
        elements.previewMode.value = entry.preview_mode || 'auto';
        elements.previewSrc.value = entry.preview_src || '';
        elements.previewAlt.value = entry.preview_alt || '';
        elements.createdAt.value = isoToLocalInput(entry.created_at);
        elements.updatedAt.value = isoToLocalInput(entry.updated_at);
        elements.confidence.value = entry.confidence;
        elements.hidden.checked = entry.hide === true;
        elements.featured.checked = entry.featured === true;
        elements.featuredRank.value = entry.featured_rank || '';
        renderTagEditor(entry);
      }

      function renderTagEditor(entry) {
        if (!entry) {
          return;
        }

        const tags = parseEntryTags(entry.tags);
        elements.tags.value = tags.join(', ');
        elements.tagsCount.textContent = tags.length + ' 个标签';
        elements.tagsSelected.innerHTML = '';

        if (tags.length === 0) {
          elements.tagsSelected.innerHTML = '<span class="tag-empty">暂无标签，输入后按回车快速添加。</span>';
        } else {
          tags.forEach(function(tag) {
            const chip = document.createElement('span');
            chip.className = 'tag-token';
            chip.innerHTML = '<span>' + escapeHtml(tag) + '</span>';

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'tag-token-remove';
            remove.textContent = '×';
            remove.setAttribute('aria-label', '移除标签 ' + tag);
            remove.addEventListener('click', function() {
              removeTag(tag);
            });

            chip.appendChild(remove);
            elements.tagsSelected.appendChild(chip);
          });
        }

        renderTagSuggestions(entry);
      }

      function renderTagSuggestions(entry) {
        const currentTags = new Set(parseEntryTags(entry.tags));
        const keyword = String(elements.tagsInput.value || '')
          .replace(/^#+/, '')
          .trim()
          .toLowerCase();
        const suggestions = buildKnownTagStats(entry.localId)
          .filter(function(item) {
            if (currentTags.has(item.tag)) return false;
            if (!keyword) return true;
            return item.tag.toLowerCase().includes(keyword);
          })
          .slice(0, keyword ? 10 : 12);

        elements.tagsSuggestions.innerHTML = '';

        if (suggestions.length === 0) {
          elements.tagsSuggestions.innerHTML = '<span class="tag-empty">没有可推荐的现有标签。</span>';
          return;
        }

        suggestions.forEach(function(item) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'tag-suggestion';
          button.innerHTML = '<span>' + escapeHtml(item.tag) + '</span><small>' + item.count + '</small>';
          button.addEventListener('click', function() {
            addTags([item.tag]);
          });
          elements.tagsSuggestions.appendChild(button);
        });
      }

      function addTags(nextTags) {
        const entry = currentEntry();
        if (!entry) return;
        const merged = parseEntryTags(entry.tags).concat(nextTags || []);
        const normalized = parseEntryTags(merged.join(', '));
        entry.tags = tagsToString(normalized);
        entry.updated_at = nowIso();
        markDirty(true);
        elements.tagsInput.value = '';
        renderTagEditor(entry);
        renderList();
      }

      function removeTag(targetTag) {
        const entry = currentEntry();
        if (!entry) return;
        entry.tags = tagsToString(parseEntryTags(entry.tags).filter(function(tag) {
          return tag !== targetTag;
        }));
        entry.updated_at = nowIso();
        markDirty(true);
        renderTagEditor(entry);
        renderList();
      }

      function commitTagInput() {
        const raw = String(elements.tagsInput.value || '');
        const nextTags = parseEntryTags(raw);
        if (nextTags.length === 0) {
          elements.tagsInput.value = '';
          const entry = currentEntry();
          if (entry) renderTagSuggestions(entry);
          return;
        }
        addTags(nextTags);
      }

      function render() {
        renderList();
        renderForm();
      }

      function toggleFeaturedEntry(entry, nextFeatured) {
        entry.featured = nextFeatured;
        entry.featured_rank = nextFeatured ? (entry.featured_rank || '100') : '';
        entry.updated_at = nowIso();
        markDirty(true);
        if (entry.localId === state.selectedId) {
          renderForm();
        }
        renderList();
        setStatus(nextFeatured ? '已置顶当前条目。' : '已取消置顶，列表仍按创建时间排序。', 'success');
      }

      function updateCurrentField(field, value) {
        const entry = currentEntry();
        if (!entry) return;
        entry[field] = value;
        if (field !== 'updated_at') {
          entry.updated_at = nowIso();
        }
        markDirty(true);
        renderList();
      }

      function escapeHtml(text) {
        return String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function createEmptyEntry() {
        const entry = makeEntry({
          created_at: nowIso(),
          updated_at: nowIso()
        });
        state.entries.unshift(entry);
        state.selectedId = entry.localId;
        markDirty(true);
        setStatus('已创建空白条目。下一步可以直接填写 URL 后点击同步。', 'info');
        render();
      }

      function removeCurrentEntry() {
        const entry = currentEntry();
        if (!entry) return;
        const ok = window.confirm('确认删除当前条目？此操作在保存前可通过刷新页面撤销。');
        if (!ok) return;
        state.entries = state.entries.filter(function(item) { return item.localId !== entry.localId; });
        state.selectedId = state.entries[0] ? state.entries[0].localId : null;
        markDirty(true);
        setStatus('已删除当前条目，记得保存。', 'info');
        render();
      }

      function removeBulkEntries() {
        syncBulkSelection();
        const selectedIds = state.bulkSelectedIds.slice();
        if (selectedIds.length === 0) {
          setStatus('请先选择要删除的条目。', 'info');
          return;
        }

        const ok = window.confirm('确认删除已选中的 ' + selectedIds.length + ' 条内容？此操作在保存前可通过刷新页面撤销。');
        if (!ok) return;

        state.entries = state.entries.filter(function(entry) {
          return !selectedIds.includes(entry.localId);
        });

        if (selectedIds.includes(state.selectedId)) {
          state.selectedId = state.entries[0] ? state.entries[0].localId : null;
        }

        state.bulkSelectedIds = [];
        state.bulkMode = false;
        markDirty(true);
        render();
        setStatus('已删除 ' + selectedIds.length + ' 条条目，记得保存。', 'success');
      }

      function entryToPayload(entry) {
        const tags = String(entry.tags || '')
          .split(',')
          .map(function(item) { return item.trim(); })
          .filter(Boolean);
        const confidence = entry.confidence === '' ? undefined : Number(entry.confidence);
        return {
          url: entry.url,
          title: entry.title,
          summary: entry.summary,
          tags: tags,
          source: entry.source,
          preview: entry.preview_enabled && entry.preview_src
            ? {
                enabled: true,
                mode: entry.preview_mode || 'auto',
                src: entry.preview_src,
                alt: entry.preview_alt || undefined
              }
            : undefined,
          created_at: entry.created_at || nowIso(),
          updated_at: entry.updated_at || nowIso(),
          confidence: Number.isFinite(confidence) ? confidence : undefined,
          hide: entry.hide === true ? true : undefined,
          featured: entry.featured === true,
          featured_rank: entry.featured === true && Number.isFinite(Number(entry.featured_rank))
            ? Number(entry.featured_rank)
            : undefined
        };
      }

      async function loadEntries() {
        setStatus('正在读取当前数据…', 'info');
        const response = await fetch('/api/entries');
        const payload = await response.json();
        state.entries = (payload.entries || []).map(makeEntry);
        state.selectedId = state.entries[0] ? state.entries[0].localId : null;

        if (!state.selectedId) {
          createEmptyEntry();
          markDirty(false);
          return;
        }

        markDirty(false);
        render();
        setStatus('已加载 ' + state.entries.length + ' 条记录。', 'success');
      }

      async function saveAll() {
        const selected = currentEntry();
        const selectedUrl = selected ? selected.url : '';
        setStatus('正在保存…', 'info');
        elements.saveAll.disabled = true;
        state.isSaving = true;

        try {
          const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: state.entries.map(entryToPayload) })
          });
          const payload = await response.json();

          if (!response.ok) {
            const message = Array.isArray(payload.invalidMessages)
              ? payload.invalidMessages.join('\n')
              : '保存失败';
            setStatus(message, 'error');
            return;
          }

          state.entries = (payload.entries || []).map(makeEntry);
          const nextSelected = state.entries.find(function(entry) { return selectedUrl && entry.url === selectedUrl; });
          state.selectedId = nextSelected ? nextSelected.localId : (state.entries[0] ? state.entries[0].localId : null);
          markDirty(false);
          state.pendingReload = false;
          state.ignoreReloadUntil = Date.now() + 1200;
          render();
          setStatus('保存成功：共 ' + payload.total + ' 条，合并重复 ' + payload.duplicateCount + ' 条。', 'success');
        } catch (error) {
          setStatus(String(error), 'error');
        } finally {
          state.isSaving = false;
          elements.saveAll.disabled = false;
        }
      }

      function applyCaptureResult(result) {
        const entry = currentEntry();
        if (!entry || !result || !result.draft) return { addedTags: [], newGlobalTags: [] };
        const draft = result.draft;
        const previousTags = new Set(parseEntryTags(entry.tags));
        const knownTags = buildKnownTagSet(entry.localId);
        let addedTags = [];
        let newGlobalTags = [];

        entry.url = draft.url || entry.url;
        if (draft.title) entry.title = draft.title;
        if (draft.summary) entry.summary = draft.summary;
        if (draft.source) entry.source = draft.source;
        if (Array.isArray(draft.tags) && draft.tags.length > 0) {
          addedTags = draft.tags.filter(function(tag) { return !previousTags.has(tag); });
          newGlobalTags = addedTags.filter(function(tag) { return !knownTags.has(tag); });
          entry.tags = draft.tags.join(', ');
        }
        if (draft.created_at) entry.created_at = draft.created_at;
        entry.updated_at = draft.updated_at || nowIso();
        if (typeof draft.confidence === 'number') {
          entry.confidence = String(draft.confidence);
        }
        if (draft.preview && draft.preview.src) {
          entry.preview_enabled = draft.preview.enabled !== false;
          entry.preview_mode = draft.preview.mode || 'auto';
          entry.preview_src = draft.preview.src;
          entry.preview_alt = draft.preview.alt || entry.title;
        }
        entry.featured = entry.featured === true;
        entry.featured_rank = entry.featured_rank || '';
        markDirty(true);
        return {
          addedTags: addedTags,
          newGlobalTags: newGlobalTags
        };
      }

      async function fileToDataUrl(file) {
        return await new Promise(function(resolve, reject) {
          const reader = new FileReader();
          reader.onload = function() { resolve(String(reader.result || '')); };
          reader.onerror = function() { reject(reader.error || new Error('读取图片失败')); };
          reader.readAsDataURL(file);
        });
      }

      async function uploadPreviewFile(file) {
        if (!file) return;
        setStatus('正在上传预览图…', 'info');
        const entry = currentEntry();
        if (!entry) {
          setStatus('请先选择一个条目。', 'error');
          return;
        }

        const dataUrl = await fileToDataUrl(file);
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            dataUrl: dataUrl
          })
        });
        const payload = await response.json();
        if (!response.ok) {
          setStatus(payload.message || '上传失败', 'error');
          return;
        }

        entry.preview_enabled = true;
        entry.preview_mode = 'local';
        entry.preview_src = payload.src || '';
        entry.preview_alt = entry.preview_alt || entry.title;
        entry.updated_at = nowIso();
        markDirty(true);
        render();
        setStatus('预览图已上传到 public 目录，可直接保存。', 'success');
      }

      async function syncCurrentEntry() {
        const entry = currentEntry();
        if (!entry) {
          setStatus('请先选择或新建一个条目。', 'error');
          return;
        }

        const targetUrl = String(entry.url || elements.url.value || '').trim();
        if (!targetUrl) {
          setStatus('请先填写 URL，再点击同步。', 'error');
          return;
        }

        elements.syncEntry.disabled = true;
        setStatus('正在同步并抓取页面内容…', 'info');

        try {
          const response = await fetch('/api/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl })
          });
          const payload = await response.json();

          if (!response.ok) {
            setStatus(payload.message || '同步失败', 'error');
            return;
          }

          const tagMeta = applyCaptureResult(payload);
          render();

          const messages = [];
          if (payload.status === 'success') {
            messages.push('同步成功，已自动填充主要字段。');
          } else if (payload.status === 'partial') {
            messages.push('已完成同步，但部分字段使用了回退结果。');
          } else {
            messages.push('未抓取到完整内容，已保留可继续手动编辑的草稿。');
          }
          if (payload.failureReason) {
            messages.push('原因：' + payload.failureReason);
          }
          if (Array.isArray(payload.warnings) && payload.warnings.length > 0) {
            messages.push('提示：' + payload.warnings.join('；'));
          }
          if (tagMeta && Array.isArray(tagMeta.addedTags) && tagMeta.addedTags.length > 0) {
            messages.push('已补充标签：' + tagMeta.addedTags.join('、') + '。');
          }
          if (tagMeta && Array.isArray(tagMeta.newGlobalTags) && tagMeta.newGlobalTags.length > 0) {
            messages.push('发现新的标签词：' + tagMeta.newGlobalTags.join('、') + '。');
          }

          setStatus(messages.join(' '), payload.status === 'failed' ? 'error' : (payload.status === 'partial' ? 'info' : 'success'));
        } catch (error) {
          setStatus('同步失败：' + String(error), 'error');
        } finally {
          elements.syncEntry.disabled = false;
        }
      }

      async function importBookmarksFromFile(file) {
        if (!file) return;
        setStatus('正在解析书签文件…', 'info');
        const text = await file.text();
        const documentNode = new DOMParser().parseFromString(text, 'text/html');
        const links = Array.from(documentNode.querySelectorAll('a[href]'));
        const imported = [];
        const now = nowIso();

        links.forEach(function(anchor) {
          const href = (anchor.getAttribute('href') || '').trim();
          if (!href || !/^https?:/i.test(href)) return;
          let source = '';
          try {
            source = new URL(href).hostname;
          } catch (error) {
            source = '';
          }
          imported.push(makeEntry({
            title: (anchor.textContent || '').trim(),
            url: href,
            source: source,
            tags: '',
            summary: '',
            created_at: now,
            updated_at: now
          }));
        });

        if (imported.length === 0) {
          setStatus('未从该文件中识别到可导入的 HTTP 或 HTTPS 书签。', 'error');
          return;
        }

        state.entries = imported.concat(state.entries);
        state.selectedId = imported[0].localId;
        markDirty(true);
        render();
        setStatus('已导入 ' + imported.length + ' 条书签，请检查后保存。', 'success');
      }

      elements.searchInput.addEventListener('input', function(event) {
        state.search = event.target.value || '';
        renderList();
      });
      elements.featuredFilter.addEventListener('click', function() {
        state.featuredOnly = !state.featuredOnly;
        renderList();
      });
      elements.bulkToggle.addEventListener('click', function() {
        setBulkMode(!state.bulkMode);
      });
      elements.bulkSelectAll.addEventListener('click', function() {
        toggleSelectAllFiltered();
      });
      elements.bulkDelete.addEventListener('click', function() {
        removeBulkEntries();
      });
      elements.newEntry.addEventListener('click', createEmptyEntry);
      elements.deleteEntry.addEventListener('click', removeCurrentEntry);
      elements.saveAll.addEventListener('click', saveAll);
      elements.syncEntry.addEventListener('click', syncCurrentEntry);
      elements.uploadPreview.addEventListener('click', function() {
        elements.previewFile.click();
      });
      elements.importBookmarks.addEventListener('click', function() {
        elements.bookmarkFile.click();
      });
      elements.bookmarkFile.addEventListener('change', function(event) {
        const file = event.target.files && event.target.files[0];
        importBookmarksFromFile(file).finally(function() {
          event.target.value = '';
        });
      });
      elements.previewFile.addEventListener('change', function(event) {
        const file = event.target.files && event.target.files[0];
        uploadPreviewFile(file).catch(function(error) {
          setStatus('上传失败：' + String(error), 'error');
        }).finally(function() {
          event.target.value = '';
        });
      });

      [
        [elements.title, 'title'],
        [elements.url, 'url'],
        [elements.source, 'source'],
        [elements.summary, 'summary'],
        [elements.previewSrc, 'preview_src'],
        [elements.previewAlt, 'preview_alt'],
        [elements.confidence, 'confidence'],
        [elements.featuredRank, 'featured_rank']
      ].forEach(function(tuple) {
        tuple[0].addEventListener('input', function(event) {
          updateCurrentField(tuple[1], event.target.value);
        });
      });

      elements.tagsInput.addEventListener('input', function() {
        const entry = currentEntry();
        if (!entry) return;
        renderTagSuggestions(entry);
      });
      elements.tagsInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
          event.preventDefault();
          commitTagInput();
          return;
        }
        if (event.key === 'Backspace' && !elements.tagsInput.value.trim()) {
          const entry = currentEntry();
          if (!entry) return;
          const tags = parseEntryTags(entry.tags);
          if (tags.length > 0) {
            removeTag(tags[tags.length - 1]);
          }
        }
      });
      elements.tagsInput.addEventListener('blur', function() {
        if (!elements.tagsInput.value.trim()) return;
        commitTagInput();
      });
      elements.tagsInput.addEventListener('paste', function(event) {
        const pasted = event.clipboardData ? event.clipboardData.getData('text') : '';
        if (!pasted || !/[,，\n]/.test(pasted)) return;
        event.preventDefault();
        addTags(parseEntryTags(pasted.replace(/\n/g, ',')));
      });
      elements.tagsAdd.addEventListener('click', function() {
        commitTagInput();
      });

      elements.featured.addEventListener('change', function(event) {
        const entry = currentEntry();
        if (!entry) return;
        toggleFeaturedEntry(entry, event.target.checked);
      });
      elements.hidden.addEventListener('change', function(event) {
        updateCurrentField('hide', event.target.checked);
      });
      elements.previewEnabled.addEventListener('change', function(event) {
        updateCurrentField('preview_enabled', event.target.checked);
        const entry = currentEntry();
        if (!entry) return;
        if (!event.target.checked) {
          entry.preview_src = '';
          entry.preview_alt = '';
        }
        renderForm();
        renderList();
      });
      elements.previewMode.addEventListener('change', function(event) {
        updateCurrentField('preview_mode', event.target.value);
      });

      elements.createdAt.addEventListener('change', function(event) {
        updateCurrentField('created_at', localInputToIso(event.target.value));
      });
      elements.updatedAt.addEventListener('change', function(event) {
        updateCurrentField('updated_at', localInputToIso(event.target.value));
      });

      window.addEventListener('beforeunload', function(event) {
        if (!state.dirty) return;
        event.preventDefault();
        event.returnValue = '';
      });

      (function setupEditorLiveReload() {
        let wasOffline = false;
        let currentServerInstanceId = '';

        function startEventStream() {
          try {
            const source = new EventSource('/__live');
            source.addEventListener('connected', function(event) {
              const nextServerInstanceId = String(event.data || '');
              if (currentServerInstanceId && nextServerInstanceId && currentServerInstanceId !== nextServerInstanceId) {
                requestLiveReload();
                return;
              }
              currentServerInstanceId = nextServerInstanceId;
              wasOffline = false;
            });
            source.addEventListener('reload', function() {
              requestLiveReload();
            });
            source.onerror = function() {
              source.close();
              window.setTimeout(startEventStream, 1200);
            };
          } catch (error) {
            window.setTimeout(startEventStream, 1200);
          }
        }

        async function pingServer() {
          try {
            const response = await fetch('/api/health?ts=' + Date.now(), { cache: 'no-store' });
            if (!response.ok) {
              throw new Error('offline');
            }
            const payload = await response.json();
            const nextServerInstanceId = String((payload && payload.serverInstanceId) || '');
            if (currentServerInstanceId && nextServerInstanceId && currentServerInstanceId !== nextServerInstanceId) {
              requestLiveReload();
              return;
            }
            currentServerInstanceId = nextServerInstanceId || currentServerInstanceId;
            if (wasOffline) {
              requestLiveReload();
              return;
            }
            wasOffline = false;
          } catch (error) {
            wasOffline = true;
          }
        }

        startEventStream();
        window.setInterval(pingServer, 1500);
      })();

      loadEntries().catch(function(error) {
        setStatus('加载失败：' + String(error), 'error');
      });
    </script>
  </body>
</html>`;
