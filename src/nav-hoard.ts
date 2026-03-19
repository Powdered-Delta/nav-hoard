import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import MiniSearch from 'minisearch';

type NoticeTone = 'info' | 'error';
type LayoutMode = 'waterfall' | 'list';
type PreviewMode = 'auto' | 'external' | 'local';

export interface NavPreview {
  enabled?: boolean;
  mode?: PreviewMode;
  src?: string;
  alt?: string;
}

export interface NavEntry {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
  featured?: boolean;
  featured_rank?: number;
  preview?: NavPreview;
}

interface FavoriteExportItem {
  id?: string;
  url?: string;
  title?: string;
}

interface ResolvedPreview {
  mode: PreviewMode;
  src: string;
  alt: string;
}

const FAVORITES_KEY = 'navhoard:favorites';
const LAYOUT_KEY = 'navhoard:layout-mode';
const CONTROLS_COLLAPSED_KEY = 'navhoard:controls-collapsed';
const FAVORITES_REMINDER_DISMISSED_KEY = 'navhoard:favorites-reminder-dismissed';

@customElement('nav-hoard')
export class NavHoard extends LitElement {
  private noticeTimer: number | null = null;

  protected createRenderRoot() {
    return this;
  }

  @property({ type: String }) basePath = '/';

  @state() private entries: NavEntry[] = [];
  @state() private filteredEntries: NavEntry[] = [];
  @state() private searchQuery = '';
  @state() private selectedTags: Set<string> = new Set();
  @state() private sortBy: 'newest' | 'relevance' = 'relevance';
  @state() private favorites: string[] = [];
  @state() private view: 'all' | 'favorites' = 'all';
  @state() private layoutMode: LayoutMode = 'waterfall';
  @state() private loading = true;
  @state() private error = '';
  @state() private notice = '';
  @state() private noticeTone: NoticeTone = 'info';
  @state() private aboutOpen = false;
  @state() private tagsExpanded = false;
  @state() private controlsCollapsed = false;
  @state() private favoriteReminderOpen = false;
  @state() private favoriteReminderDismissed = false;
  @state() private showBackToTop = false;
  @state() private compactSearchVisible = false;
  @state() private compactFiltersExpanded = false;
  @state() private viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;

  private miniSearch: MiniSearch | null = null;

  private readonly handleWindowScroll = () => {
    this.showBackToTop = window.scrollY > 560;
    this.compactSearchVisible = window.scrollY > 220;
    if (window.scrollY <= 220) {
      this.compactFiltersExpanded = false;
    }
  };
  private readonly handleWindowResize = () => {
    this.viewportWidth = window.innerWidth;
  };

  async connectedCallback() {
    super.connectedCallback();

    const envBase = import.meta.env?.VITE_BASE_PATH;
    if (this.basePath === '/' && envBase && envBase !== '/') {
      this.basePath = envBase;
    }

    this.loadUiPreferences();
    this.loadFavorites();
    window.addEventListener('scroll', this.handleWindowScroll, { passive: true });
    window.addEventListener('resize', this.handleWindowResize, { passive: true });
    this.handleWindowScroll();
    this.handleWindowResize();
    await this.loadData();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.handleWindowScroll);
    window.removeEventListener('resize', this.handleWindowResize);
    super.disconnectedCallback();
  }

  private readStorageValue(key: string): string {
    try {
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  }

  private writeStorageValue(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to write storage key: ${key}`, error);
      return false;
    }
  }

  private loadUiPreferences() {
    const layout = this.readStorageValue(LAYOUT_KEY);
    if (layout === 'waterfall' || layout === 'list') {
      this.layoutMode = layout;
    } else if (layout === 'stream' || layout === 'cards') {
      this.layoutMode = 'waterfall';
    }

    this.controlsCollapsed = this.readStorageValue(CONTROLS_COLLAPSED_KEY) === 'true';
    this.favoriteReminderDismissed = this.readStorageValue(FAVORITES_REMINDER_DISMISSED_KEY) === 'true';
  }

  private loadFavorites() {
    const stored = this.readStorageValue(FAVORITES_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      this.favorites = Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === 'string')
        : [];
    } catch (error) {
      console.warn('Failed to parse favorites', error);
      this.showNotice('本地收藏读取失败，已忽略损坏数据。', 'error');
    }
  }

  private saveFavorites(): boolean {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(this.favorites));
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

  private isQuotaExceededError(error: unknown): boolean {
    return error instanceof DOMException
      && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
  }

  private showNotice(message: string, tone: NoticeTone = 'info') {
    if (this.noticeTimer !== null) {
      window.clearTimeout(this.noticeTimer);
      this.noticeTimer = null;
    }

    this.notice = message;
    this.noticeTone = tone;

    if (tone === 'info') {
      this.noticeTimer = window.setTimeout(() => {
        this.clearNotice();
      }, 2200);
    }
  }

  private clearNotice() {
    if (this.noticeTimer !== null) {
      window.clearTimeout(this.noticeTimer);
      this.noticeTimer = null;
    }

    this.notice = '';
    this.noticeTone = 'info';
  }

  private resolveUrl(path: string): string {
    const base = this.basePath || '/';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }

  private async fetchJsonSafe<T>(url: string): Promise<T | null> {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      console.warn(`Invalid JSON response from ${url}`, error);
      return null;
    }
  }

  private normalizeEntries(payload: unknown): NavEntry[] {
    if (Array.isArray(payload)) {
      return payload as NavEntry[];
    }

    if (payload && typeof payload === 'object' && 'entries' in payload) {
      const entries = (payload as { entries?: unknown }).entries;
      if (Array.isArray(entries)) {
        return entries as NavEntry[];
      }
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
        const groupUrls = manifest.groups.map((group: string) => this.resolveUrl(`data/index-${group}.json`));
        const groupPayloads = await Promise.all(groupUrls.map(url => this.fetchJsonSafe<unknown>(url)));
        loadedFromManifest = groupPayloads.some(payload => payload !== null);
        entries = groupPayloads.flatMap(payload => this.normalizeEntries(payload));
      }

      if (!loadedFromManifest) {
        const data = await this.fetchJsonSafe<unknown>(this.resolveUrl('data/index.json'));
        if (data === null) {
          throw new Error('Failed to load data/index.json');
        }
        entries = this.normalizeEntries(data);
      }

      this.entries = entries;
      this.reconcileFavorites();
      this.buildSearchIndex();
      this.applyFilters();
    } catch (error: unknown) {
      console.error('Data load failed', error);
      this.error = error instanceof Error ? error.message : '数据加载失败，请稍后重试。';
    } finally {
      this.loading = false;
    }
  }

  private reconcileFavorites() {
    const entryIds = new Set(this.entries.map(entry => entry.id));
    const nextFavorites = this.favorites.filter(id => entryIds.has(id));
    if (nextFavorites.length !== this.favorites.length) {
      this.favorites = nextFavorites;
      this.saveFavorites();
    }
  }

  private buildSearchIndex() {
    this.miniSearch = new MiniSearch({
      fields: ['title', 'summary', 'tags'],
      storeFields: ['id', 'title', 'summary', 'tags', 'url', 'source', 'updated_at'],
      searchOptions: { prefix: true, boost: { title: 2 } }
    });

    this.miniSearch.addAll(this.entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      tags: entry.tags.join(' '),
      url: entry.url,
      source: entry.source,
      updated_at: entry.updated_at
    })));
  }

  private applyFilters() {
    let result = this.entries;

    if (this.view === 'favorites') {
      result = result.filter(entry => this.favorites.includes(entry.id));
    }

    if (this.selectedTags.size > 0) {
      result = result.filter(entry =>
        Array.from(this.selectedTags).every(tag => entry.tags.includes(tag))
      );
    }

    if (this.searchQuery.trim()) {
      if (this.miniSearch) {
        const hits = this.miniSearch.search(this.searchQuery);
        const hitIds = new Set(hits.map(hit => hit.id));
        result = result.filter(entry => hitIds.has(entry.id));
      } else {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(entry =>
          entry.title.toLowerCase().includes(query)
          || entry.summary.toLowerCase().includes(query)
          || entry.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
    }

    if (this.sortBy === 'newest') {
      result = [...result].sort(
        (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
      );
    } else if (this.sortBy === 'relevance' && this.miniSearch && this.searchQuery.trim()) {
      const hitMap = new Map(this.miniSearch.search(this.searchQuery).map(hit => [hit.id, hit]));
      result = result
        .map(entry => ({ entry, score: hitMap.get(entry.id)?.score ?? 0 }))
        .sort((left, right) => right.score - left.score)
        .map(item => item.entry);
    }

    this.filteredEntries = result;
  }

  private onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
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
    const nextTags = new Set(this.selectedTags);
    if (nextTags.has(tag)) {
      nextTags.delete(tag);
    } else {
      nextTags.add(tag);
    }
    this.selectedTags = nextTags;
    this.applyFilters();
  }

  private clearTag(tag: string) {
    const nextTags = new Set(this.selectedTags);
    nextTags.delete(tag);
    this.selectedTags = nextTags;
    this.applyFilters();
  }

  private onSortChange(event: Event) {
    this.sortBy = (event.target as HTMLSelectElement).value as 'newest' | 'relevance';
    this.applyFilters();
  }

  private onViewChange(view: 'all' | 'favorites') {
    this.view = view;
    this.applyFilters();
  }

  private openFavoriteReminder() {
    if (!this.favoriteReminderDismissed) {
      this.favoriteReminderOpen = true;
    }
  }

  private closeFavoriteReminder() {
    this.favoriteReminderOpen = false;
  }

  private dismissFavoriteReminderForever() {
    this.favoriteReminderDismissed = true;
    this.writeStorageValue(FAVORITES_REMINDER_DISMISSED_KEY, 'true');
    this.favoriteReminderOpen = false;
    this.showNotice('后续收藏时将不再弹出本地保存提醒。');
  }

  private toggleFavorite(id: string) {
    const previous = [...this.favorites];
    const hadFavorite = this.favorites.includes(id);
    const isFirstFavorite = !hadFavorite && previous.length === 0;

    this.favorites = hadFavorite
      ? this.favorites.filter(favoriteId => favoriteId !== id)
      : [...this.favorites, id];

    if (!this.saveFavorites()) {
      this.favorites = previous;
      return;
    }

    this.showNotice(
      isFirstFavorite
        ? '已加入第一次收藏。收藏数据只保存在当前浏览器本地，建议及时导出备份。'
        : (this.favorites.includes(id) ? '已加入收藏。' : '已取消收藏。')
    );

    if (!hadFavorite) {
      this.openFavoriteReminder();
    }
    this.applyFilters();
    this.requestUpdate();
  }

  private getLayoutLabel(mode: LayoutMode): string {
    if (mode === 'list') {
      return '列表';
    }
    return '瀑布流';
  }

  private hasActiveFilters(): boolean {
    return Boolean(this.searchQuery.trim()) || this.selectedTags.size > 0;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private getTagStats(): Array<{ tag: string; count: number }> {
    const counts = new Map<string, number>();

    for (const entry of this.entries) {
      for (const tag of entry.tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag, 'zh-CN'));
  }

  private getVisibleTags(): Array<{ tag: string; count: number }> {
    const tags = this.getTagStats();
    return this.tagsExpanded || tags.length <= 12 ? tags : tags.slice(0, 12);
  }

  private getFeaturedEntries(): NavEntry[] {
    if (this.view !== 'all' || this.hasActiveFilters()) {
      return [];
    }

    return this.entries
      .filter(entry => entry.featured)
      .sort((left, right) => {
        const rankDelta = (left.featured_rank ?? 100) - (right.featured_rank ?? 100);
        if (rankDelta !== 0) {
          return rankDelta;
        }
        return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
      });
  }

  private getVisibleEntries(): NavEntry[] {
    const featuredEntries = this.getFeaturedEntries();
    if (featuredEntries.length === 0) {
      return this.filteredEntries;
    }

    const featuredIds = new Set(featuredEntries.map(entry => entry.id));
    const regularEntries = this.filteredEntries.filter(entry => !featuredIds.has(entry.id));
    return [...featuredEntries, ...regularEntries];
  }

  private getWaterfallColumnCount(): number {
    if (this.viewportWidth <= 768) {
      return 1;
    }
    if (this.viewportWidth <= 1120) {
      return 2;
    }
    return 3;
  }

  private estimateWaterfallWeight(entry: NavEntry): number {
    const preview = this.getResolvedPreview(entry);
    const summaryLength = entry.summary.length;
    const tagWeight = entry.tags.length * 18;
    const featuredWeight = entry.featured ? 24 : 0;
    return 180 + (preview ? 120 : 0) + summaryLength * 0.52 + tagWeight + featuredWeight;
  }

  private buildWaterfallColumns(entries: NavEntry[]): NavEntry[][] {
    const columnCount = this.getWaterfallColumnCount();
    const columns = Array.from({ length: columnCount }, () => [] as NavEntry[]);
    const heights = Array.from({ length: columnCount }, () => 0);

    for (const entry of entries) {
      let targetIndex = 0;
      for (let index = 1; index < heights.length; index += 1) {
        if (heights[index] < heights[targetIndex]) {
          targetIndex = index;
        }
      }

      columns[targetIndex].push(entry);
      heights[targetIndex] += this.estimateWaterfallWeight(entry);
    }

    return columns;
  }

  private resolvePreviewUrl(preview: NavPreview | undefined): string {
    const rawSrc = String(preview?.src || '').trim();
    if (!preview || preview.enabled === false || !rawSrc) {
      return '';
    }

    if (/^(https?:)?\/\//i.test(rawSrc) || rawSrc.startsWith('data:')) {
      return rawSrc;
    }

    if (preview.mode === 'local') {
      return this.resolveUrl(rawSrc.replace(/^\/+/, ''));
    }

    try {
      return new URL(rawSrc, window.location.href).toString();
    } catch {
      return '';
    }
  }

  private getResolvedPreview(entry: NavEntry): ResolvedPreview | null {
    const preview = entry.preview;
    const src = this.resolvePreviewUrl(preview);
    if (!src) {
      return null;
    }

    return {
      mode: preview?.mode || 'external',
      src,
      alt: String(preview?.alt || '').trim() || `${entry.title} 的预览图`
    };
  }

  private buildCopyPayload(entry: NavEntry): NavEntry {
    const preview = this.getResolvedPreview(entry);
    if (!preview) {
      return entry;
    }

    return {
      ...entry,
      preview: {
        enabled: true,
        mode: preview.mode === 'local' ? 'external' : preview.mode,
        src: preview.src,
        alt: preview.alt
      }
    };
  }

  private toggleAbout() {
    this.aboutOpen = !this.aboutOpen;
  }

  private toggleTagsExpanded() {
    this.tagsExpanded = !this.tagsExpanded;
  }

  private toggleControlsCollapsed() {
    this.controlsCollapsed = !this.controlsCollapsed;
    this.writeStorageValue(CONTROLS_COLLAPSED_KEY, String(this.controlsCollapsed));
  }

  private toggleCompactFiltersExpanded() {
    this.compactFiltersExpanded = !this.compactFiltersExpanded;
  }

  private onLayoutChange(mode: LayoutMode) {
    this.layoutMode = mode;
    this.writeStorageValue(LAYOUT_KEY, mode);
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private getControlsSummaryText(): string {
    const parts: string[] = [];

    if (this.searchQuery.trim()) {
      parts.push(`搜索：${this.searchQuery}`);
    }

    parts.push(this.view === 'favorites' ? `收藏 ${this.favorites.length} 条` : `全部 ${this.entries.length} 条`);
    parts.push(this.getLayoutLabel(this.layoutMode));

    return parts.join(' · ');
  }

  private isFavorite(id: string): boolean {
    return this.favorites.includes(id);
  }

  private getSourceMonogram(source: string): string {
    const primary = source
      .replace(/^www\./i, '')
      .split('.')
      .find(part => /^[a-z0-9]/i.test(part)) || 'NH';
    return primary.slice(0, 2).toUpperCase();
  }

  private findFavoriteEntry(item: FavoriteExportItem): NavEntry | null {
    if (item.id) {
      const byId = this.entries.find(entry => entry.id === item.id);
      if (byId) {
        return byId;
      }
    }

    if (item.url) {
      const byUrl = this.entries.find(entry => entry.url === item.url);
      if (byUrl) {
        return byUrl;
      }
    }

    return null;
  }

  private openFavoritesImport() {
    const input = this.querySelector('#favorites-import-input') as HTMLInputElement | null;
    input?.click();
  }

  private async handleFavoritesImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as { favorites?: FavoriteExportItem[] } | FavoriteExportItem[];
      const items = Array.isArray(payload) ? payload : Array.isArray(payload.favorites) ? payload.favorites : [];
      const nextFavorites = new Set(this.favorites);
      let importedCount = 0;

      for (const item of items) {
        const matched = this.findFavoriteEntry(item);
        if (!matched || nextFavorites.has(matched.id)) {
          continue;
        }
        nextFavorites.add(matched.id);
        importedCount += 1;
      }

      if (importedCount === 0) {
        this.showNotice('导入完成，但没有匹配到当前站点中的条目。', 'error');
        return;
      }

      this.favorites = Array.from(nextFavorites);
      if (!this.saveFavorites()) {
        return;
      }

      this.applyFilters();
      this.showNotice(`已导入 ${importedCount} 条收藏。收藏数据仍只保存在当前浏览器本地。`);
    } catch (error) {
      console.warn('Failed to import favorites', error);
      this.showNotice('导入失败：文件格式不正确。', 'error');
    }
  }

  private exportFavorites() {
    if (this.favorites.length === 0) {
      this.showNotice('当前还没有收藏内容可导出。', 'error');
      return;
    }

    const favoriteEntries = this.entries.filter(entry => this.favorites.includes(entry.id));
    const payload = {
      version: 'nav-hoard-favorites/v1',
      exported_at: new Date().toISOString(),
      favorites: favoriteEntries.map(entry => ({
        id: entry.id,
        url: entry.url,
        title: entry.title
      }))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nav-hoard-favorites-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    this.showNotice('已导出收藏备份文件。你可以稍后在任意浏览器中导入它。');
  }

  private async copyEntry(entry: NavEntry) {
    const payload = JSON.stringify(this.buildCopyPayload(entry), null, 2);

    try {
      await this.copyText(payload);
      this.showNotice('已复制条目 JSON，可直接粘贴到你的 NavHoard 编辑器或录入流程。');
    } catch (error) {
      console.warn('Failed to copy entry', error);
      this.showNotice('复制失败：当前浏览器不允许访问剪贴板。', 'error');
    }
  }

  private async copyLink(entry: NavEntry) {
    try {
      await this.copyText(entry.url);
      this.showNotice('已复制链接，可直接分享给别人或保存到别处。');
    } catch (error) {
      console.warn('Failed to copy link', error);
      this.showNotice('复制失败：当前浏览器不允许访问剪贴板。', 'error');
    }
  }

  private async copyText(value: string) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.padding = '0';
    textarea.style.border = '0';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = document.execCommand('copy');

    textarea.remove();

    if (selection) {
      selection.removeAllRanges();
      if (previousRange) {
        selection.addRange(previousRange);
      }
    }

    if (!copied) {
      throw new Error('execCommand copy failed');
    }
  }

  private renderEmptyState() {
    const isFavoritesEmpty = this.view === 'favorites' && this.favorites.length === 0;
    const hasFilters = this.hasActiveFilters();

    return html`
      <div class="empty-state">
        ${isFavoritesEmpty ? html`
          <p>你还没有收藏内容。</p>
          <p class="empty-hint">收藏只保存在当前浏览器本地，建议定期导出一份备份文件。</p>
          <button @click=${() => this.onViewChange('all')}>先去看看全部内容</button>
        ` : hasFilters ? html`
          <p>没有找到符合当前条件的内容。</p>
          <p class="empty-hint">可以清空筛选，或者试试更宽松的关键词。</p>
          <button @click=${() => this.clearFilters()}>清空筛选</button>
        ` : html`
          <p>暂时还没有可展示的内容。</p>
        `}
      </div>
    `;
  }

  private renderAboutPanel(variant: 'inline' | 'popover' = 'inline') {
    if (!this.aboutOpen) {
      return null;
    }

    return html`
      <section class="about-panel ${variant === 'popover' ? 'about-panel-popover' : ''}" aria-label="关于 NavHoard">
        <p>这里收录的是公开链接卡片，方便你通过搜索、标签和收藏重新发现内容。</p>
        <p>收藏状态只保存在当前浏览器本地，不会自动同步；如果准备长期使用，建议定期导出收藏。</p>
        <p>如果你想把某条内容带到自己的 NavHoard，可以点击卡片复制图标，把条目 JSON 粘贴到编辑器或录入流程里。</p>
      </section>
    `;
  }

  private renderFavoriteReminderToast() {
    if (!this.favoriteReminderOpen) {
      return null;
    }

    return html`
      <section
        class="favorite-reminder-toast"
        role="status"
        aria-live="polite"
        aria-label="收藏提醒"
        @animationend=${() => this.closeFavoriteReminder()}
      >
        <div class="favorite-reminder-copy">
          <p class="favorite-reminder-kicker">收藏提醒</p>
          <p class="favorite-reminder-text">
            收藏仅保存在当前浏览器本地，可用“导出收藏 / 导入收藏”备份或迁移。
          </p>
        </div>
        <div class="favorite-reminder-actions">
          <button class="ghost-btn" type="button" @click=${() => this.closeFavoriteReminder()}>
            关闭
          </button>
          <button class="primary-btn" type="button" @click=${() => this.dismissFavoriteReminderForever()}>
            不再提醒
          </button>
        </div>
      </section>
    `;
  }

  private renderActiveFilters() {
    const hasSearch = Boolean(this.searchQuery.trim());
    const tags = Array.from(this.selectedTags);

    if (!hasSearch && tags.length === 0) {
      return html`
        <div class="active-filters empty">
          <span>当前未使用筛选，正在展示 ${this.view === 'favorites' ? '收藏视图' : '全部内容'}。</span>
        </div>
      `;
    }

    return html`
      <div class="active-filters">
        <span class="active-filters-label">当前筛选</span>
        ${hasSearch ? html`<span class="active-filter-pill">搜索：${this.searchQuery}</span>` : ''}
        ${tags.map(tag => html`
          <button class="active-filter-pill removable" @click=${() => this.clearTag(tag)} title="移除该标签">
            #${tag}
          </button>
        `)}
        <button class="clear-link" @click=${() => this.clearFilters()}>清空筛选</button>
      </div>
    `;
  }

  private renderResultMeta() {
    const featuredCount = this.getFeaturedEntries().length;
    return html`
      <div class="result-meta">
        <div>
          <p class="result-title">${this.view === 'favorites' ? '我的收藏' : '结果列表'}</p>
          <p class="result-subtitle">
            当前共显示 ${this.filteredEntries.length} 条结果
            ${this.view === 'favorites' ? ` / 已收藏 ${this.favorites.length} 条` : ` / 总计 ${this.entries.length} 条`}
            ${featuredCount > 0 ? ` / 含推荐 ${featuredCount} 条` : ''}
          </p>
        </div>
        ${this.hasActiveFilters() ? html`
          <button class="ghost-btn" @click=${() => this.clearFilters()}>
            清空筛选
          </button>
        ` : ''}
      </div>
    `;
  }

  private renderLayoutSwitch() {
    const options: Array<{ value: LayoutMode; label: string }> = [
      { value: 'waterfall', label: '瀑布' },
      { value: 'list', label: '列表' }
    ];

    return html`
      <div class="layout-switch" role="tablist" aria-label="切换布局">
        ${options.map(option => html`
          <button
            type="button"
            class="${this.layoutMode === option.value ? 'active' : ''}"
            @click=${() => this.onLayoutChange(option.value)}
          >
            ${option.label}
          </button>
        `)}
      </div>
    `;
  }

  private renderSearchDock(tagStats: Array<{ tag: string; count: number }>, visibleTags: Array<{ tag: string; count: number }>, hasMoreTags: boolean) {
    return html`
      <section class="search-dock-shell">
        <div class="search-dock">
          <div class="search-dock-main">
            <div class="search-dock-copy">
              <p class="search-dock-kicker">NavHoard</p>
              <h2>先搜索，再决定要不要筛选</h2>
              <p class="search-dock-summary" title=${this.getControlsSummaryText()}>${this.getControlsSummaryText()}</p>
            </div>

            <div class="search-bar search-bar-dock">
              <input
                type="search"
                placeholder="搜索标题、摘要或标签，例如 React、浏览器、编译器..."
                .value=${this.searchQuery}
                @input=${this.onSearch}
              />
            </div>

            <div class="search-dock-actions">
              ${this.hasActiveFilters() ? html`
                <button class="ghost-btn" type="button" @click=${() => this.clearFilters()}>
                  清空筛选
                </button>
              ` : ''}
              <button class="ghost-btn" type="button" @click=${() => this.toggleControlsCollapsed()}>
                ${this.controlsCollapsed ? '展开筛选面板' : '收起筛选面板'}
              </button>
            </div>
          </div>

          <div class="search-dock-toolbar">
            <div class="toolbar-group">
              <span class="toolbar-label">视图</span>
              <div class="view-switch">
                <button type="button" class="${this.view === 'all' ? 'active' : ''}" @click=${() => this.onViewChange('all')}>
                  全部 (${this.entries.length})
                </button>
                <button type="button" class="${this.view === 'favorites' ? 'active' : ''}" @click=${() => this.onViewChange('favorites')}>
                  收藏 (${this.favorites.length})
                </button>
              </div>
            </div>

            <div class="toolbar-group">
              <span class="toolbar-label">布局</span>
              ${this.renderLayoutSwitch()}
            </div>

            <div class="toolbar-group toolbar-group-sort">
              <span class="toolbar-label">排序</span>
              <div class="sort-control">
                <select .value=${this.sortBy} @change=${this.onSortChange}>
                  <option value="relevance">相关度优先</option>
                  <option value="newest">最新优先</option>
                </select>
              </div>
            </div>

            <div class="toolbar-group toolbar-group-favorites">
              <span class="toolbar-label">收藏</span>
              <button class="ghost-btn" @click=${() => this.exportFavorites()} ?disabled=${this.favorites.length === 0}>
                导出收藏
              </button>
              <button class="ghost-btn" @click=${() => this.openFavoritesImport()}>
                导入收藏
              </button>
              <input
                id="favorites-import-input"
                class="hidden-file-input"
                type="file"
                accept="application/json,.json"
                @change=${(event: Event) => this.handleFavoritesImport(event)}
              />
            </div>
          </div>

          ${this.controlsCollapsed ? '' : html`
            <div class="search-dock-panel">
              <div class="search-dock-panel-head">
                <div>
                  <p class="tag-section-title">热门标签</p>
                  <p class="tag-section-subtitle">先搜索，再用标签快速缩小范围。</p>
                </div>
                <div class="search-dock-panel-actions">
                  <span class="toolbar-tip">收藏只保存在本地浏览器，可随时导入 / 导出。</span>
                  ${tagStats.length > 12 ? html`
                    <button class="ghost-btn" @click=${() => this.toggleTagsExpanded()}>
                      ${this.tagsExpanded ? '收起标签' : `展开全部 ${tagStats.length} 个标签`}
                    </button>
                  ` : ''}
                </div>
              </div>

              <div class="tags-scroll tags-scroll-inline">
                <div class="tags-filter">
                  ${visibleTags.map(({ tag, count }) => html`
                    <button
                      class="tag-chip ${this.selectedTags.has(tag) ? 'active' : ''}"
                      @click=${() => this.onTagToggle(tag)}
                      title="按此标签筛选"
                    >
                      <span>${tag}</span>
                      <small>${count}</small>
                    </button>
                  `)}
                </div>
                ${hasMoreTags && !this.tagsExpanded ? html`
                  <p class="tag-collapse-hint">还有 ${tagStats.length - visibleTags.length} 个标签未展开。</p>
                ` : ''}
              </div>
            </div>
          `}
        </div>
      </section>
    `;
  }

  private renderSidebar() {
    return null;
  }

  private renderCompactSearchBar(tagStats: Array<{ tag: string; count: number }>, visibleTags: Array<{ tag: string; count: number }>, hasMoreTags: boolean) {
    if (!this.compactSearchVisible) {
      return null;
    }

    return html`
      <section class="compact-search-shell" aria-label="快速搜索">
        <div class="compact-search-bar">
          <div class="compact-search-meta">
            <span class="compact-search-title">${this.view === 'favorites' ? '收藏' : '全部'} · ${this.filteredEntries.length} 条</span>
            ${this.hasActiveFilters() ? html`
              <span class="compact-search-hint">已启用筛选</span>
            ` : html`
              <span class="compact-search-hint">快速搜索</span>
            `}
          </div>

          <div class="search-bar compact-search-input">
            <input
              type="search"
              placeholder="快速搜索标题、摘要或标签..."
              .value=${this.searchQuery}
              @input=${this.onSearch}
            />
          </div>

          <div class="compact-search-actions">
            ${this.hasActiveFilters() ? html`
              <button class="ghost-btn" type="button" @click=${() => this.clearFilters()}>
                清空
              </button>
            ` : ''}
            <button class="ghost-btn" type="button" @click=${() => this.toggleCompactFiltersExpanded()}>
              ${this.compactFiltersExpanded ? '收起筛选' : '展开筛选'}
            </button>
          </div>
        </div>

        ${this.compactFiltersExpanded ? html`
          <div class="compact-search-panel">
            <div class="compact-search-panel-toolbar">
              <div class="toolbar-group">
                <span class="toolbar-label">视图</span>
                <div class="view-switch">
                  <button type="button" class="${this.view === 'all' ? 'active' : ''}" @click=${() => this.onViewChange('all')}>
                    全部 (${this.entries.length})
                  </button>
                  <button type="button" class="${this.view === 'favorites' ? 'active' : ''}" @click=${() => this.onViewChange('favorites')}>
                    收藏 (${this.favorites.length})
                  </button>
                </div>
              </div>

              <div class="toolbar-group">
                <span class="toolbar-label">布局</span>
                ${this.renderLayoutSwitch()}
              </div>

              <div class="toolbar-group toolbar-group-sort">
                <span class="toolbar-label">排序</span>
                <div class="sort-control">
                  <select .value=${this.sortBy} @change=${this.onSortChange}>
                    <option value="relevance">相关度优先</option>
                    <option value="newest">最新优先</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="compact-search-panel-head">
              <div>
                <p class="tag-section-title">热门标签</p>
                <p class="tag-section-subtitle">滚动时也能继续细化筛选条件。</p>
              </div>
              ${tagStats.length > 12 ? html`
                <button class="ghost-btn" @click=${() => this.toggleTagsExpanded()}>
                  ${this.tagsExpanded ? '收起标签' : `展开全部 ${tagStats.length} 个标签`}
                </button>
              ` : ''}
            </div>

            <div class="tags-scroll tags-scroll-inline">
              <div class="tags-filter">
                ${visibleTags.map(({ tag, count }) => html`
                  <button
                    class="tag-chip ${this.selectedTags.has(tag) ? 'active' : ''}"
                    @click=${() => this.onTagToggle(tag)}
                    title="按此标签筛选"
                  >
                    <span>${tag}</span>
                    <small>${count}</small>
                  </button>
                `)}
              </div>
              ${hasMoreTags && !this.tagsExpanded ? html`
                <p class="tag-collapse-hint">还有 ${tagStats.length - visibleTags.length} 个标签未展开。</p>
              ` : ''}
            </div>
          </div>
        ` : ''}
      </section>
    `;
  }

  private renderCard(entry: NavEntry, featured = entry.featured === true) {
    const favorite = this.isFavorite(entry.id);
    const preview = this.getResolvedPreview(entry);
    const showMediaRail = Boolean(preview) || this.layoutMode === 'list';
    const copyTooltip = '复制条目 JSON，可粘贴到你的 NavHoard 编辑器或录入流程';
    const linkTooltip = '复制当前卡片链接，适合直接分享';

    return html`
      <article class="card ${featured ? 'featured-card' : ''} ${showMediaRail ? 'has-preview' : 'no-preview'}">
        <div class="card-top-actions">
          <button
            class="fav-btn ${favorite ? 'is-active' : ''}"
            type="button"
            title="${favorite ? '取消收藏' : '加入收藏'}"
            aria-label="${favorite ? '取消收藏' : '加入收藏'}"
            aria-pressed="${favorite}"
            @click=${() => this.toggleFavorite(entry.id)}
          >
            ${favorite ? '★' : '☆'}
          </button>
        </div>

        ${showMediaRail ? (preview ? html`
          <a class="card-preview" href="${entry.url}" target="_blank" rel="noopener noreferrer" aria-label="${entry.title}">
            <img class="card-preview-media" src="${preview.src}" alt="${preview.alt}" loading="lazy" decoding="async" />
          </a>
        ` : html`
          <div class="card-preview card-preview-placeholder" aria-hidden="true">
            <span class="card-preview-placeholder-mark">${this.getSourceMonogram(entry.source)}</span>
            <span class="card-preview-placeholder-source">${entry.source}</span>
          </div>
        `) : ''}

        <div class="card-body">
          <header>
            ${featured ? html`<span class="featured-badge">作者推荐</span>` : ''}
            <h3><a href="${entry.url}" target="_blank" rel="noopener noreferrer">${entry.title}</a></h3>
            <div class="meta">
              <span class="source">${entry.source}</span>
              <button
                class="copy-link-inline"
                type="button"
                @click=${() => this.copyLink(entry)}
                aria-label="${linkTooltip}"
                data-tooltip="${linkTooltip}"
              >
                复制链接
              </button>
            </div>
          </header>

          <p class="summary">${entry.summary}</p>

          <footer>
            <div class="tags">
              ${entry.tags.map(tag => html`
                <button
                  class="tag ${this.selectedTags.has(tag) ? 'active' : ''}"
                  @click=${() => this.onTagToggle(tag)}
                  title="按此标签筛选"
                >
                  ${tag}
                </button>
              `)}
            </div>
            <div class="card-footer-meta">
              <span class="date">${this.formatDate(entry.updated_at)}</span>
            </div>
          </footer>
        </div>

        <div class="card-bottom-actions">
          <button
            class="copy-btn"
            type="button"
            @click=${() => this.copyEntry(entry)}
            aria-label="${copyTooltip}"
            data-tooltip="${copyTooltip}"
          >
            ⤴
          </button>
        </div>
      </article>
    `;
  }

  private renderEntries(entries: NavEntry[]) {
    if (entries.length === 0) {
      return this.renderEmptyState();
    }

    if (this.layoutMode !== 'waterfall') {
      return entries.map(entry => this.renderCard(entry));
    }

    const columns = this.buildWaterfallColumns(entries);
    return html`
      <div class="waterfall-columns">
        ${columns.map(column => html`
          <div class="waterfall-column">
            ${column.map(entry => this.renderCard(entry))}
          </div>
        `)}
      </div>
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

    const tagStats = this.getTagStats();
    const visibleTags = this.getVisibleTags();
    const hasMoreTags = tagStats.length > visibleTags.length;
    const visibleEntries = this.getVisibleEntries();

    return html`
      <div class="nh-container">
        <header class="nh-topbar">
          <div class="nh-topbar-main">
            <p class="eyebrow">NavHoard</p>
            <div class="topbar-title-row">
              <h1>公开链接收藏站</h1>
              <button type="button" class="about-toggle about-toggle-topbar" @click=${() => this.toggleAbout()} aria-expanded=${this.aboutOpen ? 'true' : 'false'}>
                ${this.aboutOpen ? '收起说明' : '了解站点'}
              </button>
            </div>
            ${this.renderAboutPanel('popover')}
          </div>
          <p class="topbar-summary">优先搜索，必要时再筛选；主列表默认直接展示推荐与最新内容。</p>
        </header>

        ${this.notice ? html`
          <div class="notice" data-tone=${this.noticeTone} role="status">
            <span>${this.notice}</span>
            <button type="button" @click=${() => this.clearNotice()}>知道了</button>
          </div>
        ` : ''}

        ${this.renderFavoriteReminderToast()}
        ${this.renderCompactSearchBar(tagStats, visibleTags, hasMoreTags)}
        ${this.renderSearchDock(tagStats, visibleTags, hasMoreTags)}

        <main class="content-stack content-stack-full">
          ${this.renderActiveFilters()}
          ${this.renderResultMeta()}
          <section class="entries-grid layout-${this.layoutMode}">
            ${this.renderEntries(visibleEntries)}
          </section>
        </main>

        <footer class="nh-footer">
          <p>公开链接卡片 · 手动维护 · 收藏只保存在当前浏览器</p>
        </footer>

        ${this.showBackToTop ? html`
          <button class="back-to-top" type="button" @click=${() => this.scrollToTop()}>
            回到顶部
          </button>
        ` : ''}
      </div>
    `;
  }
}


