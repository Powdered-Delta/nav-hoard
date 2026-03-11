import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import MiniSearch from 'minisearch';
import './styles.css';

export interface NavEntry {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
}

type NoticeTone = 'info' | 'error';

@customElement('nav-hoard')
export class NavHoard extends LitElement {
  static styles = css`
    /* 主样式由 ./styles.css 提供，使用 CSS 变量 */
  `;

  @property({ type: String }) basePath = '/';
  @state() private entries: NavEntry[] = [];
  @state() private filteredEntries: NavEntry[] = [];
  @state() private searchQuery = '';
  @state() private selectedTags: Set<string> = new Set();
  @state() private sortBy: 'newest' | 'relevance' = 'relevance';
  @state() private favorites: string[] = [];
  @state() private view: 'all' | 'favorites' = 'all';
  @state() private loading = true;
  @state() private error = '';
  @state() private notice = '';
  @state() private noticeTone: NoticeTone = 'info';
  @state() private aboutOpen = false;

  async connectedCallback() {
    super.connectedCallback();

    // 自动从构建环境变量注入 basePath
    const envBase = import.meta.env?.VITE_BASE_PATH;
    if (this.basePath === '/' && envBase && envBase !== '/') {
      this.basePath = envBase;
    }

    this.loadFavorites();
    await this.loadData();
  }

  private loadFavorites() {
    const stored = localStorage.getItem('navhoard:favorites');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.favorites = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
      } catch (e) {
        console.warn('Failed to parse favorites', e);
        this.showNotice('本地收藏读取失败，已忽略损坏数据。', 'error');
      }
    }
  }

  private saveFavorites(): boolean {
    try {
      localStorage.setItem('navhoard:favorites', JSON.stringify(this.favorites));
      return true;
    } catch (error) {
      const message = this.isQuotaExceededError(error)
        ? '收藏保存失败：本地存储空间已满，请清理后重试。'
        : '收藏保存失败，请稍后重试。';
      this.showNotice(message, 'error');
      console.warn('Failed to persist favorites', error);
      return false;
    }
  }

  private toggleFavorite(id: string) {
    const previous = this.favorites;
    if (this.favorites.includes(id)) {
      this.favorites = this.favorites.filter(fid => fid !== id);
    } else {
      this.favorites = [...this.favorites, id];
    }

    if (!this.saveFavorites()) {
      this.favorites = previous;
      return;
    }

    this.showNotice(this.favorites.includes(id) ? '已加入收藏。' : '已取消收藏。');
    this.applyFilters();
    this.requestUpdate();
  }

  private isFavorite(id: string): boolean {
    return this.favorites.includes(id);
  }

  private isQuotaExceededError(error: unknown): boolean {
    return error instanceof DOMException && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }

  private showNotice(message: string, tone: NoticeTone = 'info') {
    this.notice = message;
    this.noticeTone = tone;
  }

  private clearNotice() {
    this.notice = '';
    this.noticeTone = 'info';
  }

  private async fetchJsonSafe<T>(url: string): Promise<T | null> {
    const response = await fetch(url);
    if (!response.ok) return null;

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch (err) {
      console.warn(`Invalid JSON response from ${url}`, err);
      return null;
    }
  }

  private normalizeEntries(payload: unknown): NavEntry[] {
    if (Array.isArray(payload)) return payload as NavEntry[];
    if (payload && typeof payload === 'object' && 'entries' in payload) {
      const entries = (payload as { entries?: unknown }).entries;
      if (Array.isArray(entries)) return entries as NavEntry[];
    }
    return [];
  }

  private async loadData() {
    try {
      this.loading = true;
      this.error = '';

      const manifestUrl = this.resolveUrl('data/manifest.json');
      let entries: NavEntry[] = [];
      let loadedFromManifest = false;

      const manifest = await this.fetchJsonSafe<{ groups?: unknown }>(manifestUrl);
      if (manifest && Array.isArray(manifest.groups) && manifest.groups.length > 0) {
        const groupUrls = manifest.groups.map((g: string) => this.resolveUrl(`data/index-${g}.json`));
        const groupPayloads = await Promise.all(groupUrls.map((url: string) => this.fetchJsonSafe<unknown>(url)));
        loadedFromManifest = groupPayloads.some(payload => payload !== null);
        entries = groupPayloads.flatMap(payload => this.normalizeEntries(payload));
      }

      if (!loadedFromManifest) {
        const dataUrl = this.resolveUrl('data/index.json');
        const data = await this.fetchJsonSafe<unknown>(dataUrl);
        if (data === null) {
          throw new Error('Failed to load data/index.json');
        }
        entries = this.normalizeEntries(data);
      }

      this.entries = entries;
      this.buildSearchIndex();
      this.applyFilters();
    } catch (err: any) {
      console.error('Data load failed', err);
      this.error = err.message || '数据加载失败，请稍后重试';
    } finally {
      this.loading = false;
    }
  }

  private resolveUrl(path: string): string {
    const base = this.basePath || '/';
    // Keep one slash between base path and relative asset path.
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }

  private miniSearch: MiniSearch | null = null;

  private buildSearchIndex() {
    this.miniSearch = new MiniSearch({
      fields: ['title', 'summary', 'tags'],
      storeFields: ['id', 'title', 'summary', 'tags', 'url', 'source', 'updated_at'],
      searchOptions: { prefix: true, boost: { title: 2 } }
    });

    const docs = this.entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      tags: entry.tags.join(' '),
      url: entry.url,
      source: entry.source,
      updated_at: entry.updated_at
    }));

    this.miniSearch.addAll(docs);
  }

  private applyFilters() {
    let result = this.entries;

    // 视图过滤
    if (this.view === 'favorites') {
      result = result.filter(e => this.favorites.includes(e.id));
    }

    // 标签过滤
    if (this.selectedTags.size > 0) {
      result = result.filter(e =>
        this.selectedTags.size === 0 || Array.from(this.selectedTags).every(t => e.tags.includes(t))
      );
    }

    // 搜索
    if (this.searchQuery.trim()) {
      if (this.miniSearch) {
        const hits = this.miniSearch.search(this.searchQuery);
        const hitIds = new Set(hits.map(h => h.id));
        result = result.filter(e => hitIds.has(e.id));
      } else {
        const q = this.searchQuery.toLowerCase();
        result = result.filter(e =>
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.tags.some(t => t.toLowerCase().includes(q))
        );
      }
    }

    // 排序
    if (this.sortBy === 'newest') {
      result = [...result].sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } else if (this.sortBy === 'relevance' && this.miniSearch && this.searchQuery.trim()) {
      // Use MiniSearch score order when in relevance mode.
      const hitMap = new Map(this.miniSearch.search(this.searchQuery).map(h => [h.id, h]));
      result = result
        .map(e => ({ e, score: hitMap.get(e.id)?.score ?? 0 }))
        .sort((a, b) => b.score - a.score)
        .map(a => a.e);
    }

    this.filteredEntries = result;
  }

  private onSearch(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
    this.applyFilters();
  }

  private clearFilters() {
    this.searchQuery = '';
    this.selectedTags = new Set();
    this.sortBy = 'relevance';
    if (this.view !== 'all') {
      this.view = 'all';
    }
    this.applyFilters();
  }

  private onTagToggle(tag: string) {
    const newTags = new Set(this.selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    this.selectedTags = newTags;
    this.applyFilters();
  }

  private onSortChange(e: Event) {
    this.sortBy = (e.target as HTMLSelectElement).value as 'newest' | 'relevance';
    this.applyFilters();
  }

  private onViewChange(view: 'all' | 'favorites') {
    this.view = view;
    this.applyFilters();
  }

  private toggleAbout() {
    this.aboutOpen = !this.aboutOpen;
  }

  private hasActiveFilters(): boolean {
    return Boolean(this.searchQuery.trim()) || this.selectedTags.size > 0;
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private getAllTags(): string[] {
    const tagSet = new Set<string>();
    this.entries.forEach(e => e.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }

  private renderEmptyState() {
    const isFavoritesEmpty = this.view === 'favorites' && this.favorites.length === 0;
    const hasFilters = this.hasActiveFilters();

    return html`
      <div class="empty-state">
        ${isFavoritesEmpty ? html`
          <p>你还没有收藏内容。</p>
          <button @click=${() => this.onViewChange('all')}>去首页看看</button>
        ` : hasFilters ? html`
          <p>未找到匹配内容。</p>
          <button @click=${() => this.clearFilters()}>清空筛选</button>
        ` : html`
          <p>暂无可展示内容。</p>
        `}
      </div>
    `;
  }

  private renderAboutPanel() {
    if (!this.aboutOpen) {
      return null;
    }

    return html`
      <section class="about-panel" aria-label="关于 Nav Hoard">
        <p>这里收录的是公开链接卡片，便于按关键词和标签重新发现内容。</p>
        <p>数据通过手动执行 <code>navhoard-cli</code> 更新，收藏状态仅保存在当前浏览器的本地存储中。</p>
        <p>如果搜索没有结果，可以清空筛选；如果收藏为空，可以切回“全部”继续浏览。</p>
      </section>
    `;
  }

  private renderCard(entry: NavEntry) {
    const fav = this.isFavorite(entry.id);
    return html`
      <article class="card">
        <header>
          <h3><a href="${entry.url}" target="_blank" rel="noopener noreferrer">${entry.title}</a></h3>
          <div class="meta">
            <span class="source">${entry.source}</span>
            <span class="date">${this.formatDate(entry.updated_at)}</span>
          </div>
        </header>
        <p class="summary">${entry.summary}</p>
        <footer>
          <div class="tags">
            ${entry.tags.map(tag => html`
              <button
                class="tag ${this.selectedTags.has(tag) ? 'active' : ''}"
                @click=${() => this.onTagToggle(tag)}
                title="点击筛选此标签"
              >
                #${tag}
              </button>
            `)}
          </div>
          <button class="fav-btn" title="${fav ? '取消收藏' : '收藏'}" @click=${() => this.toggleFavorite(entry.id)}>
            ${fav ? '★' : '☆'}
          </button>
        </footer>
      </article>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">加载中...</div>`;
    }

    if (this.error) {
      return html`
        <div class="error">
          <p>${this.error}</p>
          <button @click=${() => this.loadData()}>重试</button>
        </div>
      `;
    }

    const allTags = this.getAllTags();
    const activeTagCount = this.selectedTags.size;

    return html`
      <div class="nh-container">
        <header class="nh-header">
          <h1>积径 · Nav Hoard</h1>
          <p class="subtitle">精选链接，随手收藏</p>
          <button type="button" class="about-toggle" @click=${() => this.toggleAbout()} aria-expanded=${this.aboutOpen ? 'true' : 'false'}>
            ${this.aboutOpen ? '收起说明' : 'About'}
          </button>
          ${this.renderAboutPanel()}
        </header>

        ${this.notice ? html`
          <div class="notice" data-tone=${this.noticeTone} role="status">
            <span>${this.notice}</span>
            <button type="button" @click=${() => this.clearNotice()}>知道了</button>
          </div>
        ` : ''}

        <div class="controls">
          <div class="search-bar">
            <input
              type="search"
              placeholder="搜索标题、摘要或标签..."
              .value=${this.searchQuery}
              @input=${this.onSearch}
            />
          </div>

          <div class="filter-bar">
            <div class="view-switch">
              <button type="button" class="${this.view === 'all' ? 'active' : ''}" @click=${() => this.onViewChange('all')}>
                全部 (${this.entries.length})
              </button>
              <button type="button" class="${this.view === 'favorites' ? 'active' : ''}" @click=${() => this.onViewChange('favorites')}>
                我的收藏 (${this.favorites.length})
              </button>
            </div>

            <div class="tags-filter">
              ${allTags.map(tag => html`
                <button
                  class="tag-chip ${this.selectedTags.has(tag) ? 'active' : ''}"
                  @click=${() => this.onTagToggle(tag)}
                >
                  #${tag}
                </button>
              `)}
            </div>

            <div class="sort-control">
              <select .value=${this.sortBy} @change=${this.onSortChange}>
                <option value="relevance">相关度优先</option>
                <option value="newest">最新优先</option>
              </select>
            </div>
          </div>
        </div>

        <main class="entries-grid">
          ${this.filteredEntries.length === 0 ? this.renderEmptyState() : this.filteredEntries.map(entry => this.renderCard(entry))}
        </main>

        <footer class="nh-footer">
          <p>数据来自公开源 | 手动更新</p>
        </footer>
      </div>
    `;
  }
}

