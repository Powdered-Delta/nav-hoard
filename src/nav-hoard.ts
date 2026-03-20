import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import MiniSearch from 'minisearch';

import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  detectPreferredLocale,
  formatDate as formatLocalizedDate,
  formatNumber,
  translate,
  writeStoredLocale,
  type SupportedLocale
} from './nav-hoard-i18n';
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
  hide?: boolean;
}

interface NavConfig {
  hidden_unlock_password?: string;
}

interface NavDataPayload {
  entries?: unknown;
  config?: unknown;
}

interface NavManifestPayload {
  groups?: unknown;
  config?: unknown;
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
const HIDDEN_UNLOCKED_KEY = 'navhoard:hidden-unlocked';
const DEFAULT_HIDDEN_UNLOCK_PASSWORD = 'up up down down left right left right b a b a';
const DEFAULT_HIDDEN_UNLOCK_SEQUENCE = [
  'arrowup',
  'arrowup',
  'arrowdown',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'arrowleft',
  'arrowright',
  'b',
  'a',
  'b',
  'a'
] as const;

@customElement('nav-hoard')
export class NavHoard extends LitElement {
  private noticeTimer: number | null = null;
  private hiddenUnlockProgress: string[] = [];

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
  @state() private hiddenUnlocked = false;
  @state() private hiddenUnlockPassword = DEFAULT_HIDDEN_UNLOCK_PASSWORD;
  @state() private locale: SupportedLocale = DEFAULT_LOCALE;

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
  private readonly handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const token = this.normalizeKeyToken(event.key);
    if (!token) {
      return;
    }

    const sequence = this.getHiddenUnlockSequence();
    if (sequence.length === 0 || this.hiddenUnlocked) {
      return;
    }

    const nextIndex = this.hiddenUnlockProgress.length;
    if (sequence[nextIndex] === token) {
      this.hiddenUnlockProgress = [...this.hiddenUnlockProgress, token];
    } else if (sequence[0] === token) {
      this.hiddenUnlockProgress = [token];
    } else {
      this.hiddenUnlockProgress = [];
    }

    if (this.hiddenUnlockProgress.length === sequence.length) {
      this.hiddenUnlockProgress = [];
      this.unlockHiddenEntries();
    }
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
    window.addEventListener('keydown', this.handleWindowKeydown);
    this.handleWindowScroll();
    this.handleWindowResize();
    await this.loadData();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.handleWindowScroll);
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('keydown', this.handleWindowKeydown);
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
    this.locale = detectPreferredLocale();
    const layout = this.readStorageValue(LAYOUT_KEY);
    if (layout === 'waterfall' || layout === 'list') {
      this.layoutMode = layout;
    } else if (layout === 'stream' || layout === 'cards') {
      this.layoutMode = 'waterfall';
    }

    this.controlsCollapsed = this.readStorageValue(CONTROLS_COLLAPSED_KEY) === 'true';
    this.favoriteReminderDismissed = this.readStorageValue(FAVORITES_REMINDER_DISMISSED_KEY) === 'true';
    this.hiddenUnlocked = this.readStorageValue(HIDDEN_UNLOCKED_KEY) === 'true';
  }

  private t(key: string, vars?: Record<string, string | number | boolean | null | undefined>): string {
    return translate(this.locale, key, vars);
  }

  private formatCount(value: number): string {
    return formatNumber(this.locale, value);
  }

  private formatVisibleCount(value: number): string {
    return this.t('home.results.visible_count', { count: this.formatCount(value) });
  }

  private changeLocale(nextLocale: string) {
    const normalized = SUPPORTED_LOCALES.includes(nextLocale as SupportedLocale)
      ? (nextLocale as SupportedLocale)
      : DEFAULT_LOCALE;
    this.locale = normalized;
    writeStoredLocale(normalized);
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
      this.showNotice(this.t('home.notice.favorite_parse_failed'), 'error');
    }
  }

  private saveFavorites(): boolean {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(this.favorites));
      return true;
    } catch (error) {
      const message = this.isQuotaExceededError(error)
        ? this.t('home.notice.favorite_save_quota')
        : this.t('home.notice.favorite_save_failed');
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

  private extractConfig(payload: unknown): NavConfig | undefined {
    if (!payload || typeof payload !== 'object' || !('config' in payload)) {
      return undefined;
    }

    const config = (payload as { config?: unknown }).config;
    if (!config || typeof config !== 'object') {
      return undefined;
    }

    const hiddenUnlockPassword = String((config as { hidden_unlock_password?: unknown }).hidden_unlock_password || '').trim();
    if (!hiddenUnlockPassword) {
      return undefined;
    }

    return {
      hidden_unlock_password: hiddenUnlockPassword
    };
  }

  private normalizeUnlockPhrase(value: string): string {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private normalizeKeyToken(value: string): string {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
      return '';
    }

    if (normalized === 'up') return 'arrowup';
    if (normalized === 'down') return 'arrowdown';
    if (normalized === 'left') return 'arrowleft';
    if (normalized === 'right') return 'arrowright';
    if (normalized === '↑' || normalized === '上') return 'arrowup';
    if (normalized === '↓' || normalized === '下') return 'arrowdown';
    if (normalized === '←' || normalized === '左') return 'arrowleft';
    if (normalized === '→' || normalized === '右') return 'arrowright';
    return normalized;
  }

  private getHiddenUnlockSequence(): string[] {
    const phrase = this.normalizeUnlockPhrase(this.hiddenUnlockPassword || DEFAULT_HIDDEN_UNLOCK_PASSWORD);
    if (!phrase) {
      return [...DEFAULT_HIDDEN_UNLOCK_SEQUENCE];
    }

    return phrase
      .split(/[\s,，、>｜|/]+/)
      .map(token => this.normalizeKeyToken(token))
      .filter(Boolean);
  }

  private isEntryHidden(entry: NavEntry): boolean {
    return entry.hide === true && !this.hiddenUnlocked;
  }

  private getAccessibleEntries(): NavEntry[] {
    return this.entries.filter(entry => !this.isEntryHidden(entry));
  }

  private getAccessibleFavoritesCount(): number {
    const accessibleIds = new Set(this.getAccessibleEntries().map(entry => entry.id));
    return this.favorites.filter(id => accessibleIds.has(id)).length;
  }

  private unlockHiddenEntries() {
    if (!this.hiddenUnlocked) {
      this.hiddenUnlocked = true;
      this.writeStorageValue(HIDDEN_UNLOCKED_KEY, 'true');
      this.showNotice(this.t('home.notice.hidden_unlocked'));
    }
    this.buildSearchIndex();
    this.applyFilters();
  }

  private async loadData() {
    try {
      this.loading = true;
      this.error = '';

      const manifestUrl = this.resolveUrl('data/manifest.json');
      let entries: NavEntry[] = [];
      let loadedFromManifest = false;
      let config: NavConfig | undefined;

      const manifest = await this.fetchJsonSafe<NavManifestPayload>(manifestUrl);
      if (manifest && Array.isArray(manifest.groups) && manifest.groups.length > 0) {
        config = this.extractConfig(manifest);
        const groupUrls = manifest.groups.map((group: string) => this.resolveUrl(`data/index-${group}.json`));
        const groupPayloads = await Promise.all(groupUrls.map(url => this.fetchJsonSafe<unknown>(url)));
        loadedFromManifest = groupPayloads.some(payload => payload !== null);
        entries = groupPayloads.flatMap(payload => this.normalizeEntries(payload));
        if (!config) {
          config = groupPayloads.map(payload => this.extractConfig(payload)).find(Boolean);
        }
      }

      if (!loadedFromManifest) {
        const data = await this.fetchJsonSafe<unknown>(this.resolveUrl('data/index.json'));
        if (data === null) {
          throw new Error('Failed to load data/index.json');
        }
        entries = this.normalizeEntries(data);
        config = this.extractConfig(data);
      }

      this.entries = entries;
      this.hiddenUnlockPassword = config?.hidden_unlock_password?.trim() || DEFAULT_HIDDEN_UNLOCK_PASSWORD;
      this.reconcileFavorites();
      this.buildSearchIndex();
      this.applyFilters();
    } catch (error: unknown) {
      console.error('Data load failed', error);
      this.error = error instanceof Error ? error.message : this.t('home.notice.data_load_failed');
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
    const accessibleEntries = this.getAccessibleEntries();
    this.miniSearch = new MiniSearch({
      fields: ['title', 'summary', 'tags'],
      storeFields: ['id', 'title', 'summary', 'tags', 'url', 'source', 'updated_at'],
      searchOptions: { prefix: true, boost: { title: 2 } }
    });

    this.miniSearch.addAll(accessibleEntries.map(entry => ({
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
    let result = this.getAccessibleEntries();

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
    this.showNotice(this.t('home.notice.favorite_reminder_dismissed'));
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
        ? this.t('home.notice.favorite_added_first')
        : (this.favorites.includes(id) ? this.t('home.notice.favorite_added') : this.t('home.notice.favorite_removed'))
    );

    if (!hadFavorite) {
      this.openFavoriteReminder();
    }
    this.applyFilters();
    this.requestUpdate();
  }

  private getLayoutLabel(mode: LayoutMode): string {
    if (mode === 'list') {
      return this.t('home.layout.list');
    }
    return this.t('home.layout.waterfall');
  }

  private hasActiveFilters(): boolean {
    return Boolean(this.searchQuery.trim()) || this.selectedTags.size > 0;
  }

  private formatDate(dateStr: string): string {
    return formatLocalizedDate(this.locale, dateStr, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private getTagStats(): Array<{ tag: string; count: number }> {
    const counts = new Map<string, number>();

    for (const entry of this.getAccessibleEntries()) {
      for (const tag of entry.tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag, this.locale));
  }

  private getVisibleTags(): Array<{ tag: string; count: number }> {
    const tags = this.getTagStats();
    return this.tagsExpanded || tags.length <= 12 ? tags : tags.slice(0, 12);
  }

  private getFeaturedEntries(): NavEntry[] {
    if (this.view !== 'all' || this.hasActiveFilters()) {
      return [];
    }

    return this.getAccessibleEntries()
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
      alt: String(preview?.alt || '').trim() || this.t('home.card.preview_alt', { title: entry.title })
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
      parts.push(this.t('home.controls.summary.search', { query: this.searchQuery }));
    }

    parts.push(this.view === 'favorites'
      ? this.t('home.controls.summary.favorites', { count: this.formatCount(this.getAccessibleFavoritesCount()) })
      : this.t('home.controls.summary.all', { count: this.formatCount(this.getAccessibleEntries().length) }));
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
        this.showNotice(this.t('home.notice.import_no_match'), 'error');
        return;
      }

      this.favorites = Array.from(nextFavorites);
      if (!this.saveFavorites()) {
        return;
      }

      this.applyFilters();
      this.showNotice(this.t('home.notice.import_success', { count: this.formatCount(importedCount) }));
    } catch (error) {
      console.warn('Failed to import favorites', error);
      this.showNotice(this.t('home.notice.import_failed'), 'error');
    }
  }

  private exportFavorites() {
    if (this.favorites.length === 0) {
      this.showNotice(this.t('home.notice.export_empty'), 'error');
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

    this.showNotice(this.t('home.notice.export_success'));
  }

  private async copyEntry(entry: NavEntry) {
    const payload = JSON.stringify(this.buildCopyPayload(entry), null, 2);

    try {
      await this.copyText(payload);
      this.showNotice(this.t('home.notice.copy_entry_success'));
    } catch (error) {
      console.warn('Failed to copy entry', error);
      this.showNotice(this.t('home.notice.copy_failed'), 'error');
    }
  }

  private async copyLink(entry: NavEntry) {
    try {
      await this.copyText(entry.url);
      this.showNotice(this.t('home.notice.copy_link_success'));
    } catch (error) {
      console.warn('Failed to copy link', error);
      this.showNotice(this.t('home.notice.copy_failed'), 'error');
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
          <p>${this.t('home.empty.favorites.title')}</p>
          <p class="empty-hint">${this.t('home.empty.favorites.hint')}</p>
          <button @click=${() => this.onViewChange('all')}>${this.t('home.empty.favorites.cta')}</button>
        ` : hasFilters ? html`
          <p>${this.t('home.empty.filtered.title')}</p>
          <p class="empty-hint">${this.t('home.empty.filtered.hint')}</p>
          <button @click=${() => this.clearFilters()}>${this.t('home.empty.filtered.cta')}</button>
        ` : html`
          <p>${this.t('home.empty.default.title')}</p>
        `}
      </div>
    `;
  }

  private renderAboutPanel(variant: 'inline' | 'popover' = 'inline') {
    if (!this.aboutOpen) {
      return null;
    }

    return html`
      <section class="about-panel ${variant === 'popover' ? 'about-panel-popover' : ''}" aria-label=${this.t('home.about.aria')}>
        <p>${this.t('home.about.p1')}</p>
        <p>${this.t('home.about.p2')}</p>
        <p>${this.t('home.about.p3')}</p>
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
        aria-label=${this.t('home.favorite_reminder.aria')}
        @animationend=${() => this.closeFavoriteReminder()}
      >
        <div class="favorite-reminder-copy">
          <p class="favorite-reminder-kicker">${this.t('home.favorite_reminder.kicker')}</p>
          <p class="favorite-reminder-text">${this.t('home.favorite_reminder.text')}</p>
        </div>
        <div class="favorite-reminder-actions">
          <button class="ghost-btn" type="button" @click=${() => this.closeFavoriteReminder()}>${this.t('common.close')}</button>
          <button class="primary-btn" type="button" @click=${() => this.dismissFavoriteReminderForever()}>
            ${this.t('home.favorite_reminder.dismiss_forever')}
          </button>
        </div>
      </section>
    `;
  }

  private renderActiveFilters() {
    const hasSearch = Boolean(this.searchQuery.trim());
    const tags = Array.from(this.selectedTags);

    if (!hasSearch && tags.length === 0) {
      const hiddenSuffix = this.hiddenUnlocked ? this.t('home.filters.hidden_suffix') : '';
      return html`
        <div class="active-filters empty">
          <span>${this.view === 'favorites'
            ? this.t('home.filters.none_favorites', { hiddenSuffix })
            : this.t('home.filters.none_all', { hiddenSuffix })}</span>
        </div>
      `;
    }

    return html`
      <div class="active-filters">
        <span class="active-filters-label">${this.t('home.filters.current')}</span>
        ${hasSearch ? html`<span class="active-filter-pill">${this.t('home.filters.search_pill', { query: this.searchQuery })}</span>` : ''}
        ${tags.map(tag => html`
          <button class="active-filter-pill removable" @click=${() => this.clearTag(tag)} title=${this.t('home.filters.remove_tag')}>
            #${tag}
          </button>
        `)}
        <button class="clear-link" @click=${() => this.clearFilters()}>${this.t('home.filters.clear')}</button>
      </div>
    `;
  }

  private renderResultMeta() {
    const featuredCount = this.getFeaturedEntries().length;
    const accessibleEntriesCount = this.getAccessibleEntries().length;
    const accessibleFavoritesCount = this.getAccessibleFavoritesCount();
    const baseLabel = this.view === 'favorites'
      ? this.t('home.results.base_favorites', { count: this.formatCount(accessibleFavoritesCount) })
      : this.t('home.results.base_all', { count: this.formatCount(accessibleEntriesCount) });
    const featuredSuffix = featuredCount > 0
      ? this.t('home.results.featured_suffix', { count: this.formatCount(featuredCount) })
      : '';
    return html`
      <div class="result-meta">
        <div>
          <p class="result-title">${this.view === 'favorites' ? this.t('home.results.title_favorites') : this.t('home.results.title_all')}</p>
          <p class="result-subtitle">
            ${this.t('home.results.subtitle', {
              visible: this.formatCount(this.filteredEntries.length),
              baseLabel,
              featuredSuffix
            })}
          </p>
        </div>
        ${this.hasActiveFilters() ? html`
          <button class="ghost-btn" @click=${() => this.clearFilters()}>${this.t('home.filters.clear')}</button>
        ` : ''}
      </div>
    `;
  }

  private renderLayoutSwitch() {
    const options: Array<{ value: LayoutMode; label: string }> = [
      { value: 'waterfall', label: this.t('home.layout.waterfall') },
      { value: 'list', label: this.t('home.layout.list') }
    ];

    return html`
      <div class="layout-switch" role="tablist" aria-label=${this.t('home.layout.aria')}>
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

  private renderLocaleSwitch() {
    return html`
      <label class="locale-switch">
        <span class="toolbar-label">${this.t('locale.label')}</span>
        <select .value=${this.locale} @change=${(event: Event) => this.changeLocale((event.target as HTMLSelectElement).value)}>
          ${SUPPORTED_LOCALES.map((locale) => html`<option value=${locale}>${LOCALE_LABELS[locale]}</option>`)}
        </select>
      </label>
    `;
  }

  private renderSearchDock(tagStats: Array<{ tag: string; count: number }>, visibleTags: Array<{ tag: string; count: number }>, hasMoreTags: boolean) {
    return html`
      <section class="search-dock-shell">
        <div class="search-dock">
          <div class="search-dock-main">
            <div class="search-dock-copy">
              <p class="search-dock-kicker">${this.t('common.brand')}</p>
              <h2>${this.t('home.search.heading')}</h2>
              <p class="search-dock-summary" title=${this.getControlsSummaryText()}>${this.getControlsSummaryText()}</p>
            </div>

            <div class="search-bar search-bar-dock">
              <input
                type="search"
                placeholder=${this.t('home.search.placeholder')}
                .value=${this.searchQuery}
                @input=${this.onSearch}
              />
            </div>

            <div class="search-dock-actions">
              ${this.hasActiveFilters() ? html`
                <button class="ghost-btn" type="button" @click=${() => this.clearFilters()}>${this.t('home.filters.clear')}</button>
              ` : ''}
              <button class="ghost-btn" type="button" @click=${() => this.toggleControlsCollapsed()}>
                ${this.controlsCollapsed ? this.t('home.search.expand_filters') : this.t('home.search.collapse_filters')}
              </button>
              ${this.renderLocaleSwitch()}
            </div>
          </div>

          <div class="search-dock-toolbar">
            <div class="toolbar-group">
              <span class="toolbar-label">${this.t('home.toolbar.view')}</span>
              <div class="view-switch">
                <button type="button" class="${this.view === 'all' ? 'active' : ''}" @click=${() => this.onViewChange('all')}>
                  ${this.t('home.toolbar.all', { count: this.formatCount(this.getAccessibleEntries().length) })}
                </button>
                <button type="button" class="${this.view === 'favorites' ? 'active' : ''}" @click=${() => this.onViewChange('favorites')}>
                  ${this.t('home.toolbar.favorites_count', { count: this.formatCount(this.getAccessibleFavoritesCount()) })}
                </button>
              </div>
            </div>

            <div class="toolbar-group">
              <span class="toolbar-label">${this.t('home.toolbar.layout')}</span>
              ${this.renderLayoutSwitch()}
            </div>

            <div class="toolbar-group toolbar-group-sort">
              <span class="toolbar-label">${this.t('home.toolbar.sort')}</span>
              <div class="sort-control">
                <select .value=${this.sortBy} @change=${this.onSortChange}>
                  <option value="relevance">${this.t('home.toolbar.sort_relevance')}</option>
                  <option value="newest">${this.t('home.toolbar.sort_newest')}</option>
                </select>
              </div>
            </div>

            <div class="toolbar-group toolbar-group-favorites">
              <span class="toolbar-label">${this.t('home.toolbar.favorites')}</span>
              <button class="ghost-btn" @click=${() => this.exportFavorites()} ?disabled=${this.favorites.length === 0}>
                ${this.t('home.toolbar.export_favorites')}
              </button>
              <button class="ghost-btn" @click=${() => this.openFavoritesImport()}>
                ${this.t('home.toolbar.import_favorites')}
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
                  <p class="tag-section-title">${this.t('home.tags.title')}</p>
                  <p class="tag-section-subtitle">${this.t('home.tags.subtitle')}</p>
                </div>
                <div class="search-dock-panel-actions">
                  <span class="toolbar-tip">${this.t('home.toolbar.tip_local_only')}</span>
                  ${tagStats.length > 12 ? html`
                    <button class="ghost-btn" @click=${() => this.toggleTagsExpanded()}>
                      ${this.tagsExpanded
                        ? this.t('home.tags.collapse')
                        : this.t('home.tags.expand_all', { count: this.formatCount(tagStats.length) })}
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
                      title=${this.t('home.tags.filter_title')}
                    >
                      <span>${tag}</span>
                      <small>${this.formatCount(count)}</small>
                    </button>
                  `)}
                </div>
                ${hasMoreTags && !this.tagsExpanded ? html`
                  <p class="tag-collapse-hint">${this.t('home.tags.more_hint', { count: this.formatCount(tagStats.length - visibleTags.length) })}</p>
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
      <section class="compact-search-shell" aria-label=${this.t('home.search.quick')}>
        <div class="compact-search-bar">
          <div class="compact-search-meta">
            <span class="compact-search-title">
              ${this.t('home.search.compact_meta', {
                title: this.view === 'favorites' ? this.t('home.results.title_favorites') : this.t('home.results.title_all'),
                count: this.formatVisibleCount(this.filteredEntries.length)
              })}
            </span>
            ${this.hasActiveFilters() ? html`
              <span class="compact-search-hint">${this.t('home.search.filters_enabled')}</span>
            ` : html`
              <span class="compact-search-hint">${this.t('home.search.quick')}</span>
            `}
          </div>

          <div class="search-bar compact-search-input">
            <input
              type="search"
              placeholder=${this.t('home.search.quick_placeholder')}
              .value=${this.searchQuery}
              @input=${this.onSearch}
            />
          </div>

          <div class="compact-search-actions">
            ${this.hasActiveFilters() ? html`
              <button class="ghost-btn" type="button" @click=${() => this.clearFilters()}>${this.t('common.clear')}</button>
            ` : ''}
            <button class="ghost-btn" type="button" @click=${() => this.toggleCompactFiltersExpanded()}>
              ${this.compactFiltersExpanded ? this.t('home.search.collapse_filters_short') : this.t('home.search.expand_filters_short')}
            </button>
          </div>
        </div>

        ${this.compactFiltersExpanded ? html`
          <div class="compact-search-panel">
            <div class="compact-search-panel-toolbar">
              <div class="toolbar-group">
                <span class="toolbar-label">${this.t('home.toolbar.view')}</span>
                <div class="view-switch">
                  <button type="button" class="${this.view === 'all' ? 'active' : ''}" @click=${() => this.onViewChange('all')}>
                    ${this.t('home.toolbar.all', { count: this.formatCount(this.getAccessibleEntries().length) })}
                  </button>
                  <button type="button" class="${this.view === 'favorites' ? 'active' : ''}" @click=${() => this.onViewChange('favorites')}>
                    ${this.t('home.toolbar.favorites_count', { count: this.formatCount(this.getAccessibleFavoritesCount()) })}
                  </button>
                </div>
              </div>

              <div class="toolbar-group">
                <span class="toolbar-label">${this.t('home.toolbar.layout')}</span>
                ${this.renderLayoutSwitch()}
              </div>

              <div class="toolbar-group toolbar-group-sort">
                <span class="toolbar-label">${this.t('home.toolbar.sort')}</span>
                <div class="sort-control">
                  <select .value=${this.sortBy} @change=${this.onSortChange}>
                    <option value="relevance">${this.t('home.toolbar.sort_relevance')}</option>
                    <option value="newest">${this.t('home.toolbar.sort_newest')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="compact-search-panel-head">
              <div>
                <p class="tag-section-title">${this.t('home.tags.title')}</p>
                <p class="tag-section-subtitle">${this.t('home.tags.subtitle_compact')}</p>
              </div>
              ${tagStats.length > 12 ? html`
                <button class="ghost-btn" @click=${() => this.toggleTagsExpanded()}>
                  ${this.tagsExpanded
                    ? this.t('home.tags.collapse')
                    : this.t('home.tags.expand_all', { count: this.formatCount(tagStats.length) })}
                </button>
              ` : ''}
            </div>

            <div class="tags-scroll tags-scroll-inline">
              <div class="tags-filter">
                ${visibleTags.map(({ tag, count }) => html`
                  <button
                    class="tag-chip ${this.selectedTags.has(tag) ? 'active' : ''}"
                    @click=${() => this.onTagToggle(tag)}
                    title=${this.t('home.tags.filter_title')}
                  >
                    <span>${tag}</span>
                    <small>${this.formatCount(count)}</small>
                  </button>
                `)}
              </div>
              ${hasMoreTags && !this.tagsExpanded ? html`
                <p class="tag-collapse-hint">${this.t('home.tags.more_hint', { count: this.formatCount(tagStats.length - visibleTags.length) })}</p>
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
    const copyTooltip = this.t('home.card.copy_entry');
    const linkTooltip = this.t('home.card.copy_link');

    return html`
      <article class="card ${featured ? 'featured-card' : ''} ${showMediaRail ? 'has-preview' : 'no-preview'}">
        <div class="card-top-actions">
          <button
            class="fav-btn ${favorite ? 'is-active' : ''}"
            type="button"
            title="${favorite ? this.t('home.card.favorite_remove') : this.t('home.card.favorite_add')}"
            aria-label="${favorite ? this.t('home.card.favorite_remove') : this.t('home.card.favorite_add')}"
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
            ${featured ? html`<span class="featured-badge">${this.t('home.card.featured')}</span>` : ''}
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
                ${this.t('home.card.copy_link_button')}
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
                  title=${this.t('home.tags.filter_title')}
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
      return html`<div class="loading">${this.t('common.loading')}</div>`;
    }

    if (this.error) {
      return html`
        <div class="error">
          <p>${this.error}</p>
          <button @click=${() => this.loadData()}>${this.t('common.retry')}</button>
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
              <h1>${this.t('home.topbar.title')}</h1>
              <button type="button" class="about-toggle about-toggle-topbar" @click=${() => this.toggleAbout()} aria-expanded=${this.aboutOpen ? 'true' : 'false'}>
                ${this.aboutOpen ? this.t('home.topbar.about_open') : this.t('home.topbar.about_closed')}
              </button>
            </div>
            ${this.renderAboutPanel('popover')}
          </div>
          <p class="topbar-summary">${this.t('home.search.summary')}</p>
        </header>

        ${this.notice ? html`
          <div class="notice" data-tone=${this.noticeTone} role="status">
            <span>${this.notice}</span>
            <button type="button" @click=${() => this.clearNotice()}>${this.t('home.notice.dismiss')}</button>
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
          <p>${this.t('home.footer.summary')}</p>
        </footer>

        ${this.showBackToTop ? html`
          <button class="back-to-top" type="button" @click=${() => this.scrollToTop()}>
            ${this.t('home.back_to_top')}
          </button>
        ` : ''}
      </div>
    `;
  }
}


