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
        --editor-panel: linear-gradient(180deg, rgba(12, 18, 36, 0.88), rgba(11, 16, 32, 0.76));
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
      html,
      body {
        height: 100%;
        overflow: hidden;
      }
      body {
        margin: 0;
        background: transparent;
        color: var(--editor-text);
      }
      navhoard-editor-app {
        display: block;
        height: 100%;
      }
      .app {
        display: grid;
        grid-template-columns: 360px minmax(0, 1fr);
        gap: 18px;
        height: 100vh;
        max-width: min(100%, calc(var(--max-width, 1180px) + 160px));
        margin: 0 auto;
        padding: 20px;
        overflow: hidden;
      }
      .sidebar,
      .editor {
        min-height: 0;
      }
      .sidebar {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 28px;
        background:
          linear-gradient(180deg, rgba(15, 24, 48, 0.94), rgba(12, 19, 38, 0.9)),
          linear-gradient(135deg, rgba(124, 156, 255, 0.12), rgba(110, 231, 255, 0.06));
        color: var(--editor-text);
        overflow: hidden;
        box-shadow: var(--editor-shadow);
      }
      .editor {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 0 4px 0 0;
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(124, 156, 255, 0.4) rgba(255, 255, 255, 0.04);
      }
      .editor::-webkit-scrollbar,
      .entry-list::-webkit-scrollbar {
        width: 10px;
      }
      .editor::-webkit-scrollbar-track,
      .entry-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 999px;
      }
      .editor::-webkit-scrollbar-thumb,
      .entry-list::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(124, 156, 255, 0.52), rgba(90, 120, 255, 0.38));
        border-radius: 999px;
        border: 2px solid rgba(11, 16, 32, 0.7);
      }
      .editor::-webkit-scrollbar-thumb:hover,
      .entry-list::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(124, 156, 255, 0.72), rgba(90, 120, 255, 0.54));
      }
      .toolbar,
      .list-toolbar,
      .row,
      .toolbar-actions,
      .list-actions,
      .status-row,
      .section-header {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .toolbar,
      .list-toolbar,
      .section-header {
        justify-content: space-between;
      }
      .section-header-main {
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 8px;
      }
      .section-header-copy {
        min-width: 0;
        flex: 1 1 100%;
      }
      .section-actions {
        width: 100%;
        justify-content: flex-end;
        align-items: center;
      }
      .status-row {
        justify-content: space-between;
        align-items: flex-start;
      }
      .toolbar-actions {
        justify-content: flex-end;
        margin-left: auto;
      }
      .status-copy {
        min-width: 0;
        flex: 1 1 auto;
      }
      h1,
      h2 {
        margin: 0;
      }
      h2 {
        font-size: 20px;
        line-height: 1.25;
      }
      .muted,
      .selection-summary,
      .hint {
        color: var(--editor-text-soft);
        font-size: 13px;
      }
      .section-header-copy .muted {
        line-height: 1.55;
      }
      .file-meta {
        display: block;
        margin-top: 4px;
        max-width: min(100%, 420px);
      }
      .file-meta-text {
        display: block;
        overflow: hidden;
        color: var(--editor-text-soft);
        font-size: 12px;
        line-height: 1.35;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .entry-count {
        font-size: 13px;
        color: var(--editor-text-soft);
      }
      .entry-list {
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
      .entry-item {
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 18px;
        padding: 12px 14px;
        background: var(--editor-entry-bg);
        text-align: left;
        color: var(--editor-text);
        box-shadow: var(--editor-shadow-soft);
        transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
        cursor: pointer;
      }
      .entry-item:hover {
        transform: translateY(-1px);
        border-color: rgba(124, 156, 255, 0.28);
      }
      .entry-item.active {
        border-color: var(--editor-border-strong);
        box-shadow:
          0 0 0 1px rgba(124, 156, 255, 0.22) inset,
          0 18px 38px rgba(27, 39, 94, 0.2);
        background: var(--editor-entry-active-bg);
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
      .entry-item-head,
      .entry-featured-meta {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
      .entry-item-head {
        justify-content: space-between;
        margin-bottom: 6px;
      }
      .entry-featured-meta {
        flex: 1;
        min-width: 0;
      }
      .entry-item-title {
        display: block;
        margin-bottom: 6px;
        color: var(--editor-text);
        font-weight: 700;
      }
      .entry-item small {
        display: block;
        color: var(--editor-text-soft);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .badge {
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
      .entry-select-toggle,
      .entry-featured-toggle {
        flex: 0 0 auto;
        min-height: 28px;
        min-width: 28px;
        padding: 0 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--editor-text-soft);
        cursor: pointer;
        transition: 180ms ease;
      }
      .entry-select-toggle.active,
      .entry-featured-toggle:hover {
        border-color: rgba(124, 156, 255, 0.28);
        background: rgba(124, 156, 255, 0.1);
        color: var(--editor-text);
      }
      .status {
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(11, 16, 32, 0.55);
        color: var(--editor-text);
        line-height: 1.6;
      }
      .status.info {
        border-color: rgba(124, 156, 255, 0.18);
      }
      .status.success {
        border-color: rgba(52, 211, 153, 0.24);
      }
      .status.error {
        border-color: rgba(239, 68, 68, 0.24);
      }
      .panel {
        padding: 18px 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        background: var(--editor-panel);
        box-shadow: var(--editor-shadow-soft);
      }
      .panel-muted {
        background: var(--editor-panel-muted);
      }
      .form-grid,
      .preview-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .full {
        grid-column: 1 / -1;
      }
      label,
      .field-block {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 15px;
        font-weight: 600;
        color: var(--editor-text);
      }
      .checkbox-field {
        flex-direction: row;
        align-items: center;
      }
      .checkbox-field input {
        width: auto;
      }
      .nh-input,
      .nh-select,
      .nh-textarea {
        width: 100%;
        min-height: 44px;
        padding: 10px 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        background: rgba(8, 12, 24, 0.56);
        color: var(--editor-text);
        font-size: 14px;
        font-weight: 400;
        outline: none;
      }
      .nh-textarea {
        min-height: 160px;
        resize: vertical;
      }
      .nh-input:focus,
      .nh-select:focus,
      .nh-textarea:focus {
        border-color: rgba(124, 156, 255, 0.34);
        box-shadow: 0 0 0 3px rgba(124, 156, 255, 0.12);
      }
      .nh-button {
        min-height: 40px;
        padding: 0 14px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: var(--editor-text);
        cursor: pointer;
      }
      .nh-button:hover:not(:disabled) {
        border-color: rgba(124, 156, 255, 0.3);
        background: rgba(124, 156, 255, 0.1);
      }
      .nh-button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .editor-locale-switch-menu {
        position: relative;
      }
      .editor-locale-switch {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-height: 36px;
        min-width: 108px;
        padding: 0 32px 0 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: var(--editor-text);
        transition: 180ms ease;
        cursor: pointer;
      }
      .editor-locale-switch:hover,
      .editor-locale-switch:focus-within {
        border-color: rgba(124, 156, 255, 0.3);
        background: rgba(124, 156, 255, 0.1);
      }
      .editor-locale-switch::after {
        content: '\25BE';
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-52%);
        color: var(--editor-text-soft);
        font-size: 11px;
        pointer-events: none;
      }
      .editor-locale-switch-prefix {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 34px;
        height: 18px;
        padding: 0 6px;
        border-radius: 999px;
        background: rgba(124, 156, 255, 0.14);
        color: #dce7ff;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        flex: 0 0 auto;
      }
      .editor-locale-switch-value {
        color: var(--editor-text);
        font-size: 13px;
        font-weight: 600;
      }
      .editor-locale-switch-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        z-index: 8;
        min-width: 164px;
        padding: 8px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        background: rgba(12, 19, 38, 0.98);
        box-shadow: var(--editor-shadow-soft);
      }
      .editor-locale-switch-option {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 38px;
        padding: 0 10px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: var(--editor-text);
        cursor: pointer;
        text-align: left;
      }
      .editor-locale-switch-option:hover,
      .editor-locale-switch-option:focus-visible,
      .editor-locale-switch-option.active {
        background: rgba(124, 156, 255, 0.12);
      }
      .editor-locale-switch-option span {
        font-size: 13px;
        font-weight: 700;
      }
      .editor-locale-switch-option small {
        color: var(--editor-text-soft);
        font-size: 12px;
      }
      .nh-button--primary {
        border-color: rgba(124, 156, 255, 0.3);
        background: linear-gradient(180deg, rgba(124, 156, 255, 0.22), rgba(90, 120, 255, 0.18));
      }
      .nh-button--danger {
        border-color: rgba(220, 38, 38, 0.28);
        color: #fecaca;
      }
      .hidden {
        display: none !important;
      }
      .tag-editor {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .tag-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .tag-group-head {
        display: flex;
        align-items: center;
      }
      .tag-group-label {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      .tag-group-label-selected {
        background: rgba(124, 156, 255, 0.18);
        color: #dce7ff;
      }
      .tag-group-label-suggested {
        background: rgba(255, 255, 255, 0.05);
        color: var(--editor-text-soft);
      }
      .tag-input-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
      }
      .tag-token-list,
      .tag-suggestions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .tag-token,
      .tag-suggestion,
      .tag-empty {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 32px;
        padding: 0 10px;
        border-radius: 999px;
        color: var(--editor-text);
      }
      .tag-token {
        border: 1px solid rgba(124, 156, 255, 0.3);
        background: linear-gradient(180deg, rgba(124, 156, 255, 0.22), rgba(90, 120, 255, 0.12));
        box-shadow: inset 0 0 0 1px rgba(124, 156, 255, 0.08);
      }
      .tag-token > span:first-child {
        font-weight: 700;
      }
      .tag-empty {
        border: 1px dashed rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.04);
        color: var(--editor-text-soft);
      }
      .tag-token-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border: 0;
        border-radius: 999px;
        background: rgba(8, 12, 24, 0.3);
        color: #dce7ff;
        cursor: pointer;
      }
      .tag-suggestion {
        border: 1px dashed rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.03);
        color: var(--editor-text-soft);
        cursor: pointer;
        transition: 180ms ease;
      }
      .tag-suggestion:hover,
      .tag-suggestion:focus-visible {
        border-color: rgba(124, 156, 255, 0.28);
        background: rgba(124, 156, 255, 0.08);
        color: var(--editor-text);
      }
      .tag-suggestion small {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--editor-text-soft);
      }
      .preview-card {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 180px;
        overflow: hidden;
        border: 1px dashed rgba(255, 255, 255, 0.14);
        border-radius: 18px;
        background: rgba(8, 12, 24, 0.4);
      }
      .preview-card img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      @media (max-width: 1080px) {
        .app,
        .preview-grid,
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 720px) {
        .app {
          padding: 12px;
          gap: 12px;
        }
        .toolbar-actions {
          width: auto;
          justify-content: flex-end;
        }
        .status-row {
          align-items: stretch;
        }
        .sidebar,
        .panel {
          padding: 16px;
        }
        .tag-input-row {
          grid-template-columns: 1fr;
        }
        .editor-locale-switch {
          padding-right: 32px;
        }
      }
    </style>
    <script type="importmap">
      {
        "imports": {
          "lit": "/__modules/lit/index.js",
          "lit/": "/__modules/lit/",
          "lit-element": "/__modules/lit-element/index.js",
          "lit-element/": "/__modules/lit-element/",
          "lit-html": "/__modules/lit-html/lit-html.js",
          "lit-html/": "/__modules/lit-html/",
          "@lit/reactive-element": "/__modules/@lit/reactive-element/reactive-element.js",
          "@lit/reactive-element/": "/__modules/@lit/reactive-element/"
        }
      }
    </script>
  </head>
  <body>
    <navhoard-editor-app></navhoard-editor-app>
    <script type="module" src="/editor-app.js"></script>
  </body>
</html>`;

