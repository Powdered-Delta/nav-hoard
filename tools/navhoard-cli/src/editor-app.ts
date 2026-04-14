import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

type StatusKind = 'info' | 'success' | 'error';
type TranslationVars = Record<string, string | number | boolean | null | undefined>;

interface EntryPreviewDraft {
  enabled?: boolean;
  mode?: string;
  src?: string;
  alt?: string;
}

interface EntryDraftPayload {
  id?: string;
  url?: string;
  title?: string;
  summary?: string;
  tags?: string[] | string;
  source?: string;
  preview?: EntryPreviewDraft;
  created_at?: string;
  updated_at?: string;
  confidence?: number;
  hide?: boolean;
  featured?: boolean;
  featured_rank?: number;
}

interface EditorEntry {
  localId: string;
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string;
  source: string;
  preview_enabled: boolean;
  preview_mode: string;
  preview_src: string;
  preview_alt: string;
  created_at: string;
  updated_at: string;
  confidence: string;
  hide: boolean;
  featured: boolean;
  featured_rank: string;
}

interface EntriesResponse {
  entries?: EntryDraftPayload[];
  canonicalFile?: string;
}

interface SaveResponse {
  entries?: EntryDraftPayload[];
  total?: number;
  duplicateCount?: number;
  invalidMessages?: string[];
}

interface CaptureResponse {
  status?: 'success' | 'partial' | 'failed';
  draft?: EntryDraftPayload;
  failureReason?: string;
  warnings?: string[];
  message?: string;
}

interface UploadImageResponse {
  src?: string;
  message?: string;
}

interface SharedI18nModule {
  DEFAULT_LOCALE: string;
  SUPPORTED_LOCALES: readonly string[];
  LOCALE_LABELS: Record<string, string>;
  detectPreferredLocale(): string;
  translate(locale: string, key: string, vars?: TranslationVars): string;
  writeStoredLocale(locale: string): boolean;
  formatNumber(locale: string, value: number): string;
}

const FALLBACK_DEFAULT_LOCALE = 'zh-CN';
const FALLBACK_SUPPORTED_LOCALES = ['zh-CN', 'en'];
const FALLBACK_LOCALE_LABELS: Record<string, string> = {
  'zh-CN': '简体中文',
  en: 'English'
};

class NavHoardEditorApp extends LitElement {
  private static readonly persistPreviewStorageKey = 'navhoard-editor-persist-capture-preview';

  override createRenderRoot(): this {
    return this;
  }

  private entries: EditorEntry[] = [];
  private selectedId: string | null = null;
  private search = '';
  private counter = 0;
  private dirty = false;
  private isSaving = false;
  private isSyncing = false;
  /** When true, POST /api/capture asks the server to download remote preview into public/images/previews/. */
  private persistCapturePreview = false;
  private pendingReload = false;
  private ignoreReloadUntil = 0;
  private featuredOnly = false;
  private bulkMode = false;
  private bulkSelectedIds: string[] = [];
  private statusKey: string | null = 'editor.status.initializing';
  private statusVars: TranslationVars | undefined;
  private statusMessageFallback = '';
  private statusKind: StatusKind = 'info';
  private tagDraft = '';
  private canonicalFile = 'data/index.json';
  private liveReloadSource: EventSource | null = null;
  private liveReloadInterval: number | null = null;
  private wasOffline = false;
  private currentServerInstanceId = '';
  private pendingScrollToSelected = false;
  private localeReady = false;
  private locale = FALLBACK_DEFAULT_LOCALE;
  private localeMenuOpen = false;
  private supportedLocales = FALLBACK_SUPPORTED_LOCALES.slice();
  private localeLabels = { ...FALLBACK_LOCALE_LABELS };
  private i18n: SharedI18nModule = {
    DEFAULT_LOCALE: FALLBACK_DEFAULT_LOCALE,
    SUPPORTED_LOCALES: FALLBACK_SUPPORTED_LOCALES,
    LOCALE_LABELS: FALLBACK_LOCALE_LABELS,
    detectPreferredLocale: () => FALLBACK_DEFAULT_LOCALE,
    translate: (_locale, key, vars = {}) =>
      key.replace(/\{(\w+)\}/g, (_match, token) => String(vars[token] ?? '')),
    writeStoredLocale: () => false,
    formatNumber: (_locale, value) => String(value)
  };

  override connectedCallback(): void {
    super.connectedCallback();
    try {
      this.persistCapturePreview =
        localStorage.getItem(NavHoardEditorApp.persistPreviewStorageKey) === '1';
    } catch {
      this.persistCapturePreview = false;
    }
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    window.addEventListener('pointerdown', this.handleWindowPointerDown);
    window.addEventListener('keydown', this.handleWindowKeydown);
    this.startLiveReload();
    void this.initializeApp();
  }

  override disconnectedCallback(): void {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('pointerdown', this.handleWindowPointerDown);
    window.removeEventListener('keydown', this.handleWindowKeydown);
    this.stopLiveReload();
    super.disconnectedCallback();
  }

  override updated(): void {
    if (!this.pendingScrollToSelected) {
      return;
    }

    this.pendingScrollToSelected = false;
    if (!this.selectedId) {
      return;
    }

    const selectedCard = this.querySelector<HTMLElement>(`[data-entry-id="${this.selectedId}"]`);
    selectedCard?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest'
    });
  }

  private handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (!this.dirty) {
      return;
    }
    event.preventDefault();
    event.returnValue = '';
  };
  private handleWindowPointerDown = (event: PointerEvent): void => {
    const path = event.composedPath();
    const insideLocaleMenu = path.some(
      (node) => node instanceof HTMLElement && node.classList.contains('editor-locale-switch-menu')
    );
    if (!insideLocaleMenu) {
      this.localeMenuOpen = false;
      this.touch();
    }
  };
  private handleWindowKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.localeMenuOpen) {
      this.localeMenuOpen = false;
      this.touch();
    }
  };

  private async initializeApp(): Promise<void> {
    await this.loadI18n();
    await this.loadEntries();
  }

  private async loadI18n(): Promise<void> {
    try {
      const sharedModulePath = '/__shared/nav-hoard-i18n.js';
      const module = (await import(sharedModulePath)) as SharedI18nModule;
      this.i18n = module;
      this.supportedLocales = Array.from(module.SUPPORTED_LOCALES);
      this.localeLabels = { ...module.LOCALE_LABELS };
      this.locale = module.detectPreferredLocale();
    } catch (error) {
      console.warn('Failed to load shared i18n runtime', error);
      this.locale = FALLBACK_DEFAULT_LOCALE;
      this.setStatus('Failed to load locale runtime. Continuing with fallback messages.', 'error');
    } finally {
      this.localeReady = true;
      this.updateDocumentTitle();
      this.touch();
    }
  }

  private touch(): void {
    this.requestUpdate();
  }

  private t(key: string, vars?: TranslationVars): string {
    return this.i18n.translate(this.locale, key, vars);
  }

  private formatCount(value: number): string {
    return this.i18n.formatNumber(this.locale, value);
  }

  private updateDocumentTitle(): void {
    document.title = this.dirty ? this.t('editor.title.dirty') : this.t('editor.title.clean');
  }

  private getStatusMessage(): string {
    if (this.statusKey) {
      return this.t(this.statusKey, this.statusVars);
    }
    return this.statusMessageFallback;
  }

  private setStatus(message: string, kind: StatusKind = 'info'): void {
    this.statusKey = null;
    this.statusVars = undefined;
    this.statusMessageFallback = message;
    this.statusKind = kind;
    this.touch();
  }

  private setStatusKey(key: string, kind: StatusKind = 'info', vars?: TranslationVars): void {
    this.statusKey = key;
    this.statusVars = vars;
    this.statusMessageFallback = '';
    this.statusKind = kind;
    this.touch();
  }

  private changeLocale(nextLocale: string): void {
    if (!this.supportedLocales.includes(nextLocale)) {
      return;
    }
    this.locale = nextLocale;
    this.i18n.writeStoredLocale(nextLocale);
    this.localeMenuOpen = false;
    this.updateDocumentTitle();
    this.touch();
  }

  private toggleLocaleMenu(event: Event): void {
    event.stopPropagation();
    this.localeMenuOpen = !this.localeMenuOpen;
    this.touch();
  }

  private markDirty(nextDirty: boolean): void {
    this.dirty = nextDirty;
    this.updateDocumentTitle();
    this.touch();
  }

  private nowIso(): string {
    return new Date().toISOString();
  }

  private isoToLocalInput(value?: string): string {
    const fallback = new Date();
    const date = value ? new Date(value) : fallback;
    const safeDate = Number.isNaN(date.getTime()) ? fallback : date;
    return new Date(safeDate.getTime() - safeDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  private localInputToIso(value?: string): string {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
      return this.nowIso();
    }
    return date.toISOString();
  }

  private makeEntry(partial: EntryDraftPayload): EditorEntry {
    this.counter += 1;
    return {
      localId: `entry-${this.counter}`,
      id: partial.id || '',
      title: partial.title || '',
      url: partial.url || '',
      source: partial.source || '',
      tags: Array.isArray(partial.tags) ? partial.tags.join(', ') : (partial.tags || ''),
      summary: partial.summary || '',
      preview_enabled: partial.preview?.enabled !== false && Boolean(partial.preview?.src),
      preview_mode: partial.preview?.mode || 'auto',
      preview_src: partial.preview?.src || '',
      preview_alt: partial.preview?.alt || '',
      created_at: partial.created_at || this.nowIso(),
      updated_at: partial.updated_at || this.nowIso(),
      confidence: typeof partial.confidence === 'number' ? String(partial.confidence) : '',
      hide: partial.hide === true,
      featured: partial.featured === true,
      featured_rank: typeof partial.featured_rank === 'number' ? String(partial.featured_rank) : ''
    };
  }

  private currentEntry(): EditorEntry | null {
    return this.entries.find((entry) => entry.localId === this.selectedId) || null;
  }

  private getCanonicalFileLabel(): string {
    const normalized = this.canonicalFile.replace(/\\/g, '/');
    if (normalized.endsWith('/data/index.json') || normalized === 'data/index.json') {
      return 'data/index.json';
    }

    const segments = normalized.split('/').filter(Boolean);
    if (segments.length <= 3) {
      return normalized;
    }

    return `…/${segments.slice(-3).join('/')}`;
  }

  private parseEntryTags(value: string): string[] {
    const seen = new Set<string>();
    return String(value || '')
      .split(/[,\n，]/)
      .map((item) => item.trim())
      .map((item) => item.replace(/^#+/, '').replace(/\s+/g, ' ').trim())
      .filter((item) => {
        if (!item || seen.has(item)) {
          return false;
        }
        seen.add(item);
        return true;
      });
  }

  private tagsToString(tags: string[]): string {
    return this.parseEntryTags(tags.join(', ')).join(', ');
  }

  private buildKnownTagSet(excludeLocalId?: string): Set<string> {
    const known = new Set<string>();
    this.entries.forEach((entry) => {
      if (excludeLocalId && entry.localId === excludeLocalId) {
        return;
      }
      this.parseEntryTags(entry.tags).forEach((tag) => known.add(tag));
    });
    return known;
  }

  private buildKnownTagStats(excludeLocalId?: string): Array<{ tag: string; count: number }> {
    const counts = new Map<string, number>();
    this.entries.forEach((entry) => {
      if (excludeLocalId && entry.localId === excludeLocalId) {
        return;
      }
      this.parseEntryTags(entry.tags).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag, this.locale));
  }

  private filteredEntries(): EditorEntry[] {
    const keyword = this.search.trim().toLowerCase();
    const searched = !keyword
      ? this.entries
      : this.entries.filter((entry) =>
          [entry.title, entry.url, entry.source, entry.tags, entry.summary].join(' ').toLowerCase().includes(keyword)
        );
    return this.featuredOnly ? searched.filter((entry) => entry.featured) : searched;
  }

  private defaultSelectedId(entries: EditorEntry[] = this.entries): string | null {
    return entries[0]?.localId || null;
  }

  private queueScrollToSelected(): void {
    if (!this.selectedId) {
      return;
    }
    this.pendingScrollToSelected = true;
  }

  private syncSelectionToCurrentList(options?: { forceFirst?: boolean }): void {
    const items = this.filteredEntries();
    const hasCurrentSelection = this.selectedId ? items.some((entry) => entry.localId === this.selectedId) : false;
    const forceFirst = options?.forceFirst === true;

    if (items.length === 0) {
      if (this.selectedId !== null) {
        this.selectedId = null;
        this.tagDraft = '';
      }
      return;
    }

    if (forceFirst || !hasCurrentSelection) {
      this.selectedId = items[0].localId;
      this.tagDraft = '';
    }

    this.queueScrollToSelected();
  }

  private bulkSelectedSet(): Set<string> {
    return new Set(this.bulkSelectedIds);
  }

  private syncBulkSelection(): void {
    const known = new Set(this.entries.map((entry) => entry.localId));
    this.bulkSelectedIds = this.bulkSelectedIds.filter((localId) => known.has(localId));
  }

  private setBulkMode(nextMode: boolean): void {
    this.bulkMode = nextMode;
    if (!nextMode) {
      this.bulkSelectedIds = [];
    }
    this.touch();
  }

  private toggleBulkSelection(localId: string): void {
    const selected = this.bulkSelectedSet();
    if (selected.has(localId)) {
      selected.delete(localId);
    } else {
      selected.add(localId);
    }
    this.bulkSelectedIds = Array.from(selected);
    this.touch();
  }

  private toggleSelectAllFiltered(): void {
    const items = this.filteredEntries();
    const selected = this.bulkSelectedSet();
    const allSelected = items.length > 0 && items.every((entry) => selected.has(entry.localId));
    if (allSelected) {
      items.forEach((entry) => selected.delete(entry.localId));
    } else {
      items.forEach((entry) => selected.add(entry.localId));
    }
    this.bulkSelectedIds = Array.from(selected);
    this.touch();
  }

  private updateCurrentField<K extends keyof EditorEntry>(field: K, value: EditorEntry[K]): void {
    const entry = this.currentEntry();
    if (!entry) {
      return;
    }
    entry[field] = value;
    if (field !== 'updated_at') {
      entry.updated_at = this.nowIso();
    }
    this.markDirty(true);
  }

  private addTags(nextTags: string[]): void {
    const entry = this.currentEntry();
    if (!entry) {
      return;
    }
    const merged = this.parseEntryTags(entry.tags).concat(nextTags);
    entry.tags = this.tagsToString(merged);
    entry.updated_at = this.nowIso();
    this.tagDraft = '';
    this.markDirty(true);
  }

  private removeTag(targetTag: string): void {
    const entry = this.currentEntry();
    if (!entry) {
      return;
    }
    entry.tags = this.tagsToString(this.parseEntryTags(entry.tags).filter((tag) => tag !== targetTag));
    entry.updated_at = this.nowIso();
    this.markDirty(true);
  }

  private commitTagDraft(): void {
    const nextTags = this.parseEntryTags(this.tagDraft);
    if (nextTags.length === 0) {
      this.tagDraft = '';
      this.touch();
      return;
    }
    this.addTags(nextTags);
  }

  private createEmptyEntry = (): void => {
    const now = this.nowIso();
    const entry = this.makeEntry({
      created_at: now,
      updated_at: now
    });
    this.entries = [entry, ...this.entries];
    this.selectedId = entry.localId;
    this.tagDraft = '';
    this.queueScrollToSelected();
    this.markDirty(true);
    this.setStatusKey('editor.notice.created', 'info');
  };

  private removeCurrentEntry = (): void => {
    const entry = this.currentEntry();
    if (!entry) {
      return;
    }
    if (!window.confirm(this.t('editor.notice.delete_current_confirm'))) {
      return;
    }
    this.entries = this.entries.filter((item) => item.localId !== entry.localId);
    this.selectedId = this.defaultSelectedId();
    this.syncSelectionToCurrentList();
    this.markDirty(true);
    this.setStatusKey('editor.notice.delete_current_done', 'info');
  };

  private removeBulkEntries = (): void => {
    this.syncBulkSelection();
    const selectedIds = this.bulkSelectedIds.slice();
    if (selectedIds.length === 0) {
      this.setStatusKey('editor.notice.delete_empty', 'info');
      return;
    }
    if (!window.confirm(this.t('editor.notice.delete_bulk_confirm', { count: this.formatCount(selectedIds.length) }))) {
      return;
    }

    this.entries = this.entries.filter((entry) => !selectedIds.includes(entry.localId));
    if (selectedIds.includes(String(this.selectedId))) {
      this.selectedId = this.defaultSelectedId();
    }
    this.syncSelectionToCurrentList();
    this.bulkSelectedIds = [];
    this.bulkMode = false;
    this.tagDraft = '';
    this.markDirty(true);
    this.setStatusKey('editor.notice.delete_bulk_done', 'success', { count: this.formatCount(selectedIds.length) });
  };

  private toggleFeaturedEntry(entry: EditorEntry, nextFeatured: boolean): void {
    entry.featured = nextFeatured;
    entry.featured_rank = nextFeatured ? entry.featured_rank || '100' : '';
    entry.updated_at = this.nowIso();
    this.markDirty(true);
    this.setStatusKey(nextFeatured ? 'editor.notice.featured_on' : 'editor.notice.featured_off', 'success');
  }

  private entryToPayload(entry: EditorEntry): EntryDraftPayload {
    const tags = String(entry.tags || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const confidence = entry.confidence === '' ? undefined : Number(entry.confidence);
    return {
      url: entry.url,
      title: entry.title,
      summary: entry.summary,
      tags,
      source: entry.source,
      preview:
        entry.preview_enabled && entry.preview_src
          ? {
              enabled: true,
              mode: entry.preview_mode || 'auto',
              src: entry.preview_src,
              alt: entry.preview_alt || undefined
            }
          : undefined,
      created_at: entry.created_at || this.nowIso(),
      updated_at: entry.updated_at || this.nowIso(),
      confidence: Number.isFinite(confidence) ? confidence : undefined,
      hide: entry.hide ? true : undefined,
      featured: entry.featured === true,
      featured_rank: entry.featured && Number.isFinite(Number(entry.featured_rank)) ? Number(entry.featured_rank) : undefined
    };
  }

  private getSourceMonogram(source: string): string {
    const primary =
      source
        .replace(/^www\./i, '')
        .split('.')
        .find((part) => /^[a-z0-9]/i.test(part)) || 'NH';
    return primary.slice(0, 2).toUpperCase();
  }

  private listEntryMonogram(entry: EditorEntry): string {
    const source = entry.source.trim();
    if (source) {
      return this.getSourceMonogram(source);
    }
    const title = entry.title.trim();
    if (title) {
      const letters = title.replace(/\s+/g, '').slice(0, 2);
      return letters ? letters.toUpperCase() : 'NH';
    }
    return 'NH';
  }

  private resolveListPreviewUrl(entry: EditorEntry): string | null {
    if (!entry.preview_enabled) {
      return null;
    }
    const raw = String(entry.preview_src || '').trim();
    if (!raw) {
      return null;
    }
    if (/^(https?:|\/\/|data:)/i.test(raw)) {
      return raw;
    }
    return raw.startsWith('/') ? raw : `/${raw.replace(/^\/*/, '')}`;
  }

  private applyCaptureResult(
    result: CaptureResponse,
    options?: { previewOnly?: boolean }
  ): { addedTags: string[]; newGlobalTags: string[] } {
    const entry = this.currentEntry();
    if (!entry || !result?.draft) {
      return { addedTags: [], newGlobalTags: [] };
    }
    const draft = result.draft;
    const previewOnly = options?.previewOnly === true;

    if (previewOnly) {
      if (draft.preview?.src) {
        entry.preview_enabled = draft.preview.enabled !== false;
        entry.preview_mode = draft.preview.mode || 'auto';
        entry.preview_src = draft.preview.src;
        entry.preview_alt = draft.preview.alt || entry.title;
        entry.updated_at = draft.updated_at || this.nowIso();
        this.markDirty(true);
      }
      return { addedTags: [], newGlobalTags: [] };
    }

    const previousTags = new Set(this.parseEntryTags(entry.tags));
    const knownTags = this.buildKnownTagSet(entry.localId);
    let addedTags: string[] = [];
    let newGlobalTags: string[] = [];

    entry.url = draft.url || entry.url;
    if (draft.title) entry.title = draft.title;
    if (draft.summary) entry.summary = draft.summary;
    if (draft.source) entry.source = draft.source;
    if (Array.isArray(draft.tags) && draft.tags.length > 0) {
      addedTags = draft.tags.filter((tag) => !previousTags.has(tag));
      newGlobalTags = addedTags.filter((tag) => !knownTags.has(tag));
      entry.tags = draft.tags.join(', ');
    }
    // Capture drafts always set created_at to the fetch moment (for brand-new entries).
    // Editor sync must not replace the bookmark's original created_at.
    entry.updated_at = draft.updated_at || this.nowIso();
    if (typeof draft.confidence === 'number') {
      entry.confidence = String(draft.confidence);
    }
    if (draft.preview?.src) {
      entry.preview_enabled = draft.preview.enabled !== false;
      entry.preview_mode = draft.preview.mode || 'auto';
      entry.preview_src = draft.preview.src;
      entry.preview_alt = draft.preview.alt || entry.title;
    }
    this.markDirty(true);
    return { addedTags, newGlobalTags };
  }

  private async requestJson<T>(input: string, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init);
    const payload = (await response.json()) as T & { message?: string };
    if (!response.ok) {
      const message = payload && typeof payload === 'object' && 'message' in payload
        ? String(payload.message || this.t('editor.notice.request_failed'))
        : this.t('editor.notice.request_failed');
      throw new Error(message);
    }
    return payload;
  }

  private async loadEntries(): Promise<void> {
    try {
      this.setStatusKey('editor.notice.loading_entries', 'info');
      const payload = await this.requestJson<EntriesResponse>('/api/entries');
      this.entries = (payload.entries || []).map((entry) => this.makeEntry(entry));
      this.selectedId = this.defaultSelectedId();
      this.canonicalFile = payload.canonicalFile || this.canonicalFile;
      this.queueScrollToSelected();

      if (!this.selectedId) {
        this.createEmptyEntry();
        this.markDirty(false);
        return;
      }

      this.markDirty(false);
      this.setStatusKey('editor.notice.loaded_entries', 'success', { count: this.formatCount(this.entries.length) });
    } catch (error) {
      this.setStatusKey('editor.notice.load_failed', 'error', { message: this.getErrorMessage(error) });
    }
  }

  private async saveAll(): Promise<void> {
    const selected = this.currentEntry();
    const selectedUrl = selected?.url || '';
    this.isSaving = true;
    this.touch();
    this.setStatusKey('editor.notice.saving', 'info');

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: this.entries.map((entry) => this.entryToPayload(entry)) })
      });
      const payload = (await response.json()) as SaveResponse;

      if (!response.ok) {
        const message = Array.isArray(payload.invalidMessages)
          ? payload.invalidMessages.join('\n')
          : this.t('editor.notice.save_failed');
        this.setStatus(message, 'error');
        return;
      }

      this.entries = (payload.entries || []).map((entry) => this.makeEntry(entry));
      const nextSelected = this.entries.find((entry) => selectedUrl && entry.url === selectedUrl);
      this.selectedId = nextSelected?.localId || this.defaultSelectedId();
      this.syncSelectionToCurrentList();
      const shouldReload = this.pendingReload;
      this.pendingReload = false;
      this.ignoreReloadUntil = Date.now() + 1200;
      this.markDirty(false);
      this.setStatusKey('editor.notice.saved', 'success', {
        total: this.formatCount(payload.total || this.entries.length),
        duplicateCount: this.formatCount(payload.duplicateCount || 0)
      });

      if (shouldReload) {
        window.location.reload();
      }
    } catch (error) {
      this.setStatusKey('editor.notice.save_failed_with_reason', 'error', { message: this.getErrorMessage(error) });
    } finally {
      this.isSaving = false;
      this.touch();
    }
  }

  private async syncCurrentEntry(): Promise<void> {
    const entry = this.currentEntry();
    if (!entry) {
      this.setStatusKey('editor.notice.select_entry_before_sync', 'error');
      return;
    }
    const targetUrl = String(entry.url || '').trim();
    if (!targetUrl) {
      this.setStatusKey('editor.notice.fill_url_before_sync', 'error');
      return;
    }

    this.isSyncing = true;
    this.touch();
    this.setStatusKey('editor.notice.syncing', 'info');

    try {
      const payload = await this.requestJson<CaptureResponse>('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, persistPreview: this.persistCapturePreview })
      });

      const tagMeta = this.applyCaptureResult(payload);
      const messages: string[] = [];
      if (payload.status === 'success') {
        messages.push(this.t('editor.notice.sync_success'));
      } else if (payload.status === 'partial') {
        messages.push(this.t('editor.notice.sync_partial'));
      } else {
        messages.push(this.t('editor.notice.sync_failed'));
      }
      if (payload.failureReason) {
        messages.push(this.t('editor.notice.reason', { reason: payload.failureReason }));
      }
      if (Array.isArray(payload.warnings) && payload.warnings.length > 0) {
        messages.push(this.t('editor.notice.warnings', { warnings: payload.warnings.join('；') }));
      }
      if (tagMeta.addedTags.length > 0) {
        messages.push(this.t('editor.notice.added_tags', { tags: tagMeta.addedTags.join('、') }));
      }
      if (tagMeta.newGlobalTags.length > 0) {
        messages.push(this.t('editor.notice.new_tags', { tags: tagMeta.newGlobalTags.join('、') }));
      }

      this.setStatus(
        messages.join(' '),
        payload.status === 'failed' ? 'error' : payload.status === 'partial' ? 'info' : 'success'
      );
    } catch (error) {
      this.setStatusKey('editor.notice.sync_failed_with_reason', 'error', { message: this.getErrorMessage(error) });
    } finally {
      this.isSyncing = false;
      this.touch();
    }
  }

  private async syncCurrentEntryPreviewOnly(): Promise<void> {
    const entry = this.currentEntry();
    if (!entry) {
      this.setStatusKey('editor.notice.select_entry_before_sync', 'error');
      return;
    }
    const targetUrl = String(entry.url || '').trim();
    if (!targetUrl) {
      this.setStatusKey('editor.notice.fill_url_before_sync', 'error');
      return;
    }

    this.isSyncing = true;
    this.touch();
    this.setStatusKey('editor.notice.syncing', 'info');

    try {
      const payload = await this.requestJson<CaptureResponse>('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, persistPreview: this.persistCapturePreview })
      });

      const hadPreviewSrc = Boolean(payload.draft?.preview?.src);
      this.applyCaptureResult(payload, { previewOnly: true });

      const messages: string[] = [];
      if (hadPreviewSrc) {
        messages.push(this.t('editor.notice.sync_preview_success'));
      } else {
        messages.push(this.t('editor.notice.sync_preview_no_image'));
      }
      if (payload.failureReason) {
        messages.push(this.t('editor.notice.reason', { reason: payload.failureReason }));
      }
      if (Array.isArray(payload.warnings) && payload.warnings.length > 0) {
        messages.push(this.t('editor.notice.warnings', { warnings: payload.warnings.join('；') }));
      }

      const kind: StatusKind =
        payload.status === 'failed' && !hadPreviewSrc
          ? 'error'
          : payload.status === 'failed'
            ? 'info'
            : payload.status === 'partial'
              ? 'info'
              : 'success';
      this.setStatus(messages.join(' '), kind);
    } catch (error) {
      this.setStatusKey('editor.notice.sync_preview_failed_with_reason', 'error', { message: this.getErrorMessage(error) });
    } finally {
      this.isSyncing = false;
      this.touch();
    }
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error(this.t('editor.notice.read_image_failed')));
      reader.readAsDataURL(file);
    });
  }

  private async uploadPreviewFile(file: File | null): Promise<void> {
    if (!file) {
      return;
    }
    const entry = this.currentEntry();
    if (!entry) {
      this.setStatusKey('editor.notice.select_entry_before_upload', 'error');
      return;
    }

    this.setStatusKey('editor.notice.uploading_preview', 'info');

    try {
      const dataUrl = await this.fileToDataUrl(file);
      const payload = await this.requestJson<UploadImageResponse>('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          dataUrl
        })
      });

      entry.preview_enabled = true;
      entry.preview_mode = 'local';
      entry.preview_src = payload.src || '';
      entry.preview_alt = entry.preview_alt || entry.title;
      entry.updated_at = this.nowIso();
      this.markDirty(true);
      this.setStatusKey('editor.notice.uploaded_preview', 'success');
    } catch (error) {
      this.setStatusKey('editor.notice.upload_failed', 'error', { message: this.getErrorMessage(error) });
    }
  }

  private async importBookmarksFromFile(file: File | null): Promise<void> {
    if (!file) {
      return;
    }
    this.setStatusKey('editor.notice.importing_bookmarks', 'info');

    try {
      const text = await file.text();
      const documentNode = new DOMParser().parseFromString(text, 'text/html');
      const links = Array.from(documentNode.querySelectorAll('a[href]'));
      const imported: EditorEntry[] = [];
      const now = this.nowIso();

      links.forEach((anchor) => {
        const href = (anchor.getAttribute('href') || '').trim();
        if (!href || !/^https?:/i.test(href)) {
          return;
        }
        let source = '';
        try {
          source = new URL(href).hostname;
        } catch {
          source = '';
        }
        imported.push(
          this.makeEntry({
            title: (anchor.textContent || '').trim(),
            url: href,
            source,
            tags: '',
            summary: '',
            created_at: now,
            updated_at: now
          })
        );
      });

      if (imported.length === 0) {
        this.setStatusKey('editor.notice.import_bookmarks_empty', 'error');
        return;
      }

      this.entries = [...imported, ...this.entries];
      this.selectedId = imported[0].localId;
      this.tagDraft = '';
      this.queueScrollToSelected();
      this.markDirty(true);
      this.setStatusKey('editor.notice.import_bookmarks_done', 'success', { count: this.formatCount(imported.length) });
    } catch (error) {
      this.setStatusKey('editor.notice.import_bookmarks_failed', 'error', { message: this.getErrorMessage(error) });
    }
  }

  private requestLiveReload(): void {
    if (this.isSaving || Date.now() < this.ignoreReloadUntil) {
      return;
    }
    if (this.dirty) {
      this.pendingReload = true;
      this.setStatusKey('editor.notice.external_reload', 'info');
      return;
    }
    window.location.reload();
  }

  private startLiveReload(): void {
    const startEventStream = (): void => {
      try {
        const source = new EventSource('/__live');
        source.addEventListener('connected', (event) => {
          const nextServerInstanceId = String((event as MessageEvent).data || '');
          if (this.currentServerInstanceId && nextServerInstanceId && this.currentServerInstanceId !== nextServerInstanceId) {
            this.requestLiveReload();
            return;
          }
          this.currentServerInstanceId = nextServerInstanceId;
          this.wasOffline = false;
        });
        source.addEventListener('reload', () => {
          this.requestLiveReload();
        });
        source.onerror = () => {
          source.close();
          window.setTimeout(startEventStream, 1200);
        };
        this.liveReloadSource = source;
      } catch {
        window.setTimeout(startEventStream, 1200);
      }
    };

    const pingServer = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/health?ts=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('offline');
        }
        const payload = (await response.json()) as { serverInstanceId?: string };
        const nextServerInstanceId = String(payload.serverInstanceId || '');
        if (this.currentServerInstanceId && nextServerInstanceId && this.currentServerInstanceId !== nextServerInstanceId) {
          this.requestLiveReload();
          return;
        }
        this.currentServerInstanceId = nextServerInstanceId || this.currentServerInstanceId;
        if (this.wasOffline) {
          this.requestLiveReload();
          return;
        }
        this.wasOffline = false;
      } catch {
        this.wasOffline = true;
      }
    };

    startEventStream();
    this.liveReloadInterval = window.setInterval(() => {
      void pingServer();
    }, 1500);
  }

  private stopLiveReload(): void {
    this.liveReloadSource?.close();
    this.liveReloadSource = null;
    if (this.liveReloadInterval !== null) {
      window.clearInterval(this.liveReloadInterval);
      this.liveReloadInterval = null;
    }
  }

  private openFileInput(id: string): void {
    const input = this.querySelector<HTMLInputElement>(`#${id}`);
    input?.click();
  }

  private handlePersistCapturePreviewChange = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement;
    this.persistCapturePreview = input.checked;
    try {
      localStorage.setItem(NavHoardEditorApp.persistPreviewStorageKey, this.persistCapturePreview ? '1' : '0');
    } catch {
      /* ignore quota / private mode */
    }
    this.touch();
  };

  private handleSearchInput = (event: Event): void => {
    const previousKeyword = this.search.trim();
    this.search = (event.currentTarget as HTMLInputElement).value || '';
    const nextKeyword = this.search.trim();
    this.syncSelectionToCurrentList({
      forceFirst: previousKeyword.length > 0 && nextKeyword.length === 0
    });
    this.touch();
  };

  private handleTagInput = (event: Event): void => {
    this.tagDraft = (event.currentTarget as HTMLInputElement).value || '';
    this.touch();
  };

  private handleTagKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
      event.preventDefault();
      this.commitTagDraft();
      return;
    }
    if (event.key === 'Backspace' && !this.tagDraft.trim()) {
      const entry = this.currentEntry();
      if (!entry) {
        return;
      }
      const tags = this.parseEntryTags(entry.tags);
      if (tags.length > 0) {
        this.removeTag(tags[tags.length - 1]);
      }
    }
  };

  private handleTagPaste = (event: ClipboardEvent): void => {
    const pasted = event.clipboardData?.getData('text') || '';
    if (!pasted || !/[,，\n]/.test(pasted)) {
      return;
    }
    event.preventDefault();
    this.addTags(this.parseEntryTags(pasted.replace(/\n/g, ',')));
  };

  private onPreviewFileChange = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0] || null;
    void this.uploadPreviewFile(file).finally(() => {
      input.value = '';
    });
  };

  private onBookmarkFileChange = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0] || null;
    void this.importBookmarksFromFile(file).finally(() => {
      input.value = '';
    });
  };

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private renderLocaleSwitch() {
    const localeLabel = this.locale === 'zh-CN' ? 'ZH' : 'EN';
    return html`
      <div class="editor-locale-switch-menu">
        <button
          type="button"
          class="editor-locale-switch"
          aria-label=${this.t('locale.label')}
          aria-haspopup="menu"
          aria-expanded=${this.localeMenuOpen ? 'true' : 'false'}
          @click=${(event: Event) => this.toggleLocaleMenu(event)}
        >
          <span class="editor-locale-switch-prefix" aria-hidden="true">Lang</span>
          <span class="editor-locale-switch-value">${localeLabel}</span>
        </button>
        ${this.localeMenuOpen ? html`
          <div class="editor-locale-switch-dropdown" role="menu" aria-label=${this.t('locale.label')}>
            ${this.supportedLocales.map((locale) => html`
              <button
                type="button"
                class="editor-locale-switch-option ${this.locale === locale ? 'active' : ''}"
                role="menuitemradio"
                aria-checked=${this.locale === locale ? 'true' : 'false'}
                @click=${() => this.changeLocale(locale)}
              >
                <span>${locale === 'zh-CN' ? 'ZH' : 'EN'}</span>
                <small>${this.localeLabels[locale] || locale}</small>
              </button>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderTagSuggestions(entry: EditorEntry) {
    const currentTags = new Set(this.parseEntryTags(entry.tags));
    const keyword = this.tagDraft.replace(/^#+/, '').trim().toLowerCase();
    const suggestions = this.buildKnownTagStats(entry.localId)
      .filter((item) => {
        if (currentTags.has(item.tag)) {
          return false;
        }
        if (!keyword) {
          return true;
        }
        return item.tag.toLowerCase().includes(keyword);
      })
      .slice(0, keyword ? 10 : 12);

    if (suggestions.length === 0) {
      return html`<span class="tag-empty">${this.t('editor.empty.no_suggestions')}</span>`;
    }

    return repeat(
      suggestions,
      (item) => item.tag,
      (item) => html`
        <button class="tag-suggestion" type="button" @click=${() => this.addTags([item.tag])}>
          <span>${item.tag}</span>
          <small>${this.formatCount(item.count)}</small>
        </button>
      `
    );
  }

  private renderEntryList(items: EditorEntry[]) {
    this.syncBulkSelection();
    const selected = this.bulkSelectedSet();

    if (items.length === 0) {
      return html`
        <div class="entry-item">
          <strong class="entry-item-title">${this.t('editor.empty.no_matches')}</strong>
          <small>${this.featuredOnly ? this.t('editor.empty.no_featured_results') : this.t('editor.empty.no_search_results')}</small>
        </div>
      `;
    }

    return repeat(
      items,
      (entry) => entry.localId,
      (entry) => {
        const classes = {
          'entry-item': true,
          active: entry.localId === this.selectedId,
          'bulk-mode': this.bulkMode,
          'selected-for-bulk': selected.has(entry.localId)
        };
        const listPreviewUrl = this.resolveListPreviewUrl(entry);
        return html`
          <div
            class=${classMap(classes)}
            data-entry-id=${entry.localId}
            role="button"
            tabindex="0"
            @click=${() => {
              if (this.bulkMode) {
                this.toggleBulkSelection(entry.localId);
                return;
              }
              this.selectedId = entry.localId;
              this.tagDraft = '';
              this.touch();
            }}
            @keydown=${(event: KeyboardEvent) => {
              if (event.key !== 'Enter' && event.key !== ' ') {
                return;
              }
              event.preventDefault();
              if (this.bulkMode) {
                this.toggleBulkSelection(entry.localId);
                return;
              }
              this.selectedId = entry.localId;
              this.tagDraft = '';
              this.touch();
            }}
          >
            <div class="entry-item-inner">
              <div class="entry-item-thumb-wrap">
                ${listPreviewUrl
                  ? html`<img src=${listPreviewUrl} loading="lazy" decoding="async" alt="" />`
                  : html`<div class="entry-item-thumb-fallback">${this.listEntryMonogram(entry)}</div>`}
              </div>
              <div class="entry-item-text">
                <div class="entry-item-head">
                  <div class="entry-featured-meta">
                    ${this.bulkMode
                      ? html`
                          <button
                            class=${classMap({ 'entry-select-toggle': true, active: selected.has(entry.localId) })}
                            type="button"
                            @click=${(event: Event) => {
                              event.stopPropagation();
                              this.toggleBulkSelection(entry.localId);
                            }}
                          >
                            ${selected.has(entry.localId) ? '✓' : ''}
                          </button>
                        `
                      : null}
                    ${entry.featured ? html`<span class="badge">${this.t('editor.badge.featured')}</span>` : null}
                    ${entry.hide ? html`<span class="badge">${this.t('editor.badge.hidden')}</span>` : null}
                    <div style="min-width:0; flex:1;">
                      <strong class="entry-item-title">${entry.title || this.t('editor.card.untitled')}</strong>
                      <small>${entry.url || this.t('editor.card.no_url')}</small>
                    </div>
                  </div>
                  ${entry.featured
                    ? html`
                        <button
                          class="entry-featured-toggle"
                          type="button"
                          @click=${(event: Event) => {
                            event.stopPropagation();
                            this.toggleFeaturedEntry(entry, false);
                          }}
                        >
                          ${this.t('editor.button.unfeature')}
                        </button>
                      `
                    : null}
                </div>
                <small>${entry.tags || this.t('editor.card.no_tags')}</small>
                ${entry.featured
                  ? html`<small>${this.t('editor.summary.featured_sort', { rank: entry.featured_rank || '100' })}</small>`
                  : null}
              </div>
            </div>
          </div>
        `;
      }
    );
  }

  override render() {
    if (!this.localeReady) {
      return html`
        <div class="app">
          <main class="editor">
            <section class="panel panel-muted">
              <div class="status-row">
                <div class="status-copy">
                  <div class=${classMap({ status: true, [this.statusKind]: true })}>${this.getStatusMessage()}</div>
                </div>
              </div>
            </section>
          </main>
        </div>
      `;
    }

    const entry = this.currentEntry();
    const items = this.filteredEntries();
    const selected = this.bulkSelectedSet();
    const selectedCount = this.bulkSelectedIds.length;
    const allFilteredSelected = items.length > 0 && items.every((item) => selected.has(item.localId));
    const entryTags = entry ? this.parseEntryTags(entry.tags) : [];

    return html`
      <div class="app">
        <aside class="sidebar">
          <div class="toolbar">
            <div>
              <h1>${this.t('editor.title.clean')}</h1>
              <div class="file-meta" title=${this.t('editor.summary.local_editing', { file: this.canonicalFile })}>
                <span class="file-meta-text">${this.t('editor.summary.local_editing', { file: this.getCanonicalFileLabel() })}</span>
              </div>
            </div>
            <div class="toolbar-actions">
              <button class="nh-button" type="button" @click=${this.createEmptyEntry}>${this.t('editor.button.new')}</button>
            </div>
          </div>

          <div class="list-toolbar">
            <input
              class="nh-input"
              type="search"
              .value=${this.search}
              placeholder=${this.t('editor.field.search_placeholder')}
              @input=${this.handleSearchInput}
            />
            <button
              class="nh-button"
              type="button"
              @click=${() => {
                this.featuredOnly = !this.featuredOnly;
                this.syncSelectionToCurrentList();
                this.touch();
              }}
            >
              ${this.featuredOnly ? this.t('editor.button.view_all') : this.t('editor.button.featured_only')}
            </button>
          </div>

          <div class="entry-count">
            ${this.t('editor.summary.entries', {
              entries: this.formatCount(this.entries.length),
              filtered: this.formatCount(items.length),
              featuredSuffix: this.featuredOnly ? this.t('editor.summary.entries_featured_suffix') : ''
            })}
          </div>

          <div class="list-actions">
            <button class="nh-button" type="button" @click=${() => this.setBulkMode(!this.bulkMode)}>
              ${this.bulkMode ? this.t('editor.button.bulk_exit') : this.t('editor.button.bulk_enter')}
            </button>
            <button class=${classMap({ 'nh-button': true, hidden: !this.bulkMode })} type="button" @click=${() => this.toggleSelectAllFiltered()}>
              ${allFilteredSelected ? this.t('editor.button.bulk_unselect_all') : this.t('editor.button.bulk_select_all')}
            </button>
            <button
              class=${classMap({ 'nh-button': true, 'nh-button--danger': true, hidden: !this.bulkMode })}
              type="button"
              ?disabled=${!this.bulkMode || selectedCount === 0}
              @click=${this.removeBulkEntries}
            >
              ${selectedCount > 0
                ? this.t('editor.button.bulk_delete_count', { count: this.formatCount(selectedCount) })
                : this.t('editor.button.bulk_delete')}
            </button>
            <div class=${classMap({ 'selection-summary': true, hidden: !this.bulkMode })}>
              ${selectedCount > 0
                ? this.t('editor.summary.bulk_selected', { count: this.formatCount(selectedCount) })
                : this.t('editor.summary.bulk_hint')}
            </div>
          </div>

          <div class="entry-list">${this.renderEntryList(items)}</div>
        </aside>

        <main class="editor">
          <section class="panel panel-muted">
            <div class="status-row">
              <div class="status-copy">
                <div class=${classMap({ status: true, [this.statusKind]: true })}>${this.getStatusMessage()}</div>
              </div>
              ${this.renderLocaleSwitch()}
            </div>
          </section>

          <section class="panel">
            <div class="section-header section-header-main">
              <div class="section-header-copy">
                <h2>${this.t('editor.heading.main')}</h2>
                <div class="muted">${this.t('editor.summary.form_hint')}</div>
              </div>
              <div class="row section-actions">
                <button class="nh-button" type="button" ?disabled=${!entry || this.isSyncing} @click=${() => void this.syncCurrentEntry()}>
                  ${this.isSyncing ? this.t('editor.button.syncing') : this.t('editor.button.sync')}
                </button>
                <button
                  class="nh-button nh-button--ghost"
                  type="button"
                  ?disabled=${!entry || this.isSyncing}
                  @click=${() => void this.syncCurrentEntryPreviewOnly()}
                >
                  ${this.isSyncing ? this.t('editor.button.syncing') : this.t('editor.button.sync_preview')}
                </button>
                <button class="nh-button" type="button" @click=${() => this.openFileInput('bookmark-file')}>
                  ${this.t('editor.button.import_bookmarks')}
                </button>
                <button class="nh-button nh-button--danger" type="button" ?disabled=${!entry} @click=${this.removeCurrentEntry}>
                  ${this.t('common.delete')}
                </button>
                <button class="nh-button nh-button--primary" type="button" ?disabled=${!entry || this.isSaving} @click=${() => void this.saveAll()}>
                  ${this.isSaving ? this.t('editor.button.saving') : this.t('editor.button.save_all')}
                </button>
              </div>
              <div class="section-capture-options">
                <div class="editor-capture-option-row">
                  <label class="editor-capture-option" for="editor-persist-capture-checkbox">
                    <input
                      id="editor-persist-capture-checkbox"
                      type="checkbox"
                      ?disabled=${this.isSyncing}
                      .checked=${this.persistCapturePreview}
                      @change=${this.handlePersistCapturePreviewChange}
                    />
                    <span class="editor-capture-option-label">${this.t('editor.field.persist_capture_preview')}</span>
                  </label>
                  <span class="editor-capture-tooltip-anchor">
                    <button
                      type="button"
                      class="editor-capture-tooltip-trigger"
                      ?disabled=${this.isSyncing}
                      aria-describedby="editor-persist-capture-tip"
                    >
                      <span class="editor-sr-only">${this.t('editor.field.persist_capture_preview_help_label')}</span>
                      <svg
                        class="editor-capture-tooltip-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.85"
                        stroke-linecap="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 16v-5" />
                        <circle cx="12" cy="8" r="1.15" fill="currentColor" stroke="none" />
                      </svg>
                    </button>
                    <span id="editor-persist-capture-tip" role="tooltip" class="editor-capture-tooltip-bubble">
                      ${this.t('editor.field.persist_capture_preview_hint')}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div class="form-grid">
              <label>
                ${this.t('editor.field.title')}
                <input class="nh-input" .value=${entry?.title || ''} ?disabled=${!entry} @input=${(event: Event) => this.updateCurrentField('title', (event.currentTarget as HTMLInputElement).value)} />
              </label>
              <label>
                ${this.t('editor.field.url')}
                <input class="nh-input" type="url" .value=${entry?.url || ''} ?disabled=${!entry} @input=${(event: Event) => this.updateCurrentField('url', (event.currentTarget as HTMLInputElement).value)} />
              </label>
              <label>
                ${this.t('editor.field.source')}
                <input class="nh-input" .value=${entry?.source || ''} ?disabled=${!entry} @input=${(event: Event) => this.updateCurrentField('source', (event.currentTarget as HTMLInputElement).value)} />
              </label>
              <label>
                ${this.t('editor.field.confidence')}
                <input class="nh-input" type="number" step="0.01" min="0" max="1" .value=${entry?.confidence || ''} ?disabled=${!entry} @input=${(event: Event) => this.updateCurrentField('confidence', (event.currentTarget as HTMLInputElement).value)} />
              </label>

              <div class="field-block full">
                <div class="section-header">
                  <span>${this.t('editor.field.tags')}</span>
                  <span class="muted">${this.t('editor.summary.tag_count', { count: this.formatCount(entryTags.length) })}</span>
                </div>
                <div class="tag-editor">
                  <div class="tag-input-row">
                    <input
                      class="nh-input"
                      .value=${this.tagDraft}
                      ?disabled=${!entry}
                      placeholder=${this.t('editor.field.tags_placeholder')}
                      @input=${this.handleTagInput}
                      @keydown=${this.handleTagKeydown}
                      @paste=${this.handleTagPaste}
                      @blur=${() => {
                        if (this.tagDraft.trim()) {
                          this.commitTagDraft();
                        }
                      }}
                    />
                    <button class="nh-button" type="button" ?disabled=${!entry} @click=${() => this.commitTagDraft()}>
                      ${this.t('editor.button.add_tag')}
                    </button>
                  </div>
                  <div class="tag-token-list">
                    <div class="tag-group full">
                      <div class="tag-group-head">
                        <span class="tag-group-label tag-group-label-selected">${this.t('editor.tags.selected')}</span>
                      </div>
                      <div class="tag-token-list">
                        ${entry
                          ? entryTags.length > 0
                            ? repeat(
                                entryTags,
                                (tag) => tag,
                                (tag) => html`
                                  <span class="tag-token">
                                    <span>${tag}</span>
                                    <button class="tag-token-remove" type="button" @click=${() => this.removeTag(tag)}>×</button>
                                  </span>
                                `
                              )
                            : html`<span class="tag-empty">${this.t('editor.empty.no_tags')}</span>`
                          : html`<span class="tag-empty">${this.t('editor.empty.select_entry')}</span>`}
                      </div>
                    </div>
                  </div>
                  <div class="tag-group full">
                    <div class="tag-group-head">
                      <span class="tag-group-label tag-group-label-suggested">${this.t('editor.tags.suggested')}</span>
                    </div>
                    <div class="tag-suggestions">${entry ? this.renderTagSuggestions(entry) : null}</div>
                  </div>
                </div>
              </div>

              <label class="full">
                ${this.t('editor.field.summary')}
                <textarea class="nh-textarea" .value=${entry?.summary || ''} ?disabled=${!entry} @input=${(event: Event) => this.updateCurrentField('summary', (event.currentTarget as HTMLTextAreaElement).value)}></textarea>
              </label>

              <label class="checkbox-field">
                <input
                  type="checkbox"
                  ?checked=${entry?.preview_enabled === true}
                  ?disabled=${!entry}
                  @change=${(event: Event) => {
                    const checked = (event.currentTarget as HTMLInputElement).checked;
                    this.updateCurrentField('preview_enabled', checked);
                    if (!checked && entry) {
                      entry.preview_src = '';
                      entry.preview_alt = '';
                      this.touch();
                    }
                  }}
                />
                ${this.t('editor.field.preview_enabled')}
              </label>
              <label>
                ${this.t('editor.field.preview_mode')}
                <select class="nh-select" .value=${entry?.preview_mode || 'auto'} ?disabled=${!entry} @change=${(event: Event) => this.updateCurrentField('preview_mode', (event.currentTarget as HTMLSelectElement).value)}>
                  <option value="auto">auto</option>
                  <option value="local">local</option>
                  <option value="remote">remote</option>
                </select>
              </label>

              <div class="preview-grid full">
                <div class="field-block">
                  <label>
                    ${this.t('editor.field.preview_src')}
                    <input class="nh-input" .value=${entry?.preview_src || ''} ?disabled=${!entry} @input=${(event: Event) => this.updateCurrentField('preview_src', (event.currentTarget as HTMLInputElement).value)} />
                  </label>
                  <label>
                    ${this.t('editor.field.preview_alt')}
                    <input class="nh-input" .value=${entry?.preview_alt || ''} ?disabled=${!entry} @input=${(event: Event) => this.updateCurrentField('preview_alt', (event.currentTarget as HTMLInputElement).value)} />
                  </label>
                  <div class="row">
                    <button class="nh-button" type="button" ?disabled=${!entry} @click=${() => this.openFileInput('preview-file')}>
                      ${this.t('editor.button.upload_preview')}
                    </button>
                  </div>
                </div>
                <div class="preview-card">
                  ${entry?.preview_src
                    ? html`<img src=${entry.preview_src} alt=${entry.preview_alt || entry.title || 'preview'} />`
                    : html`<span class="muted">${this.t('editor.empty.no_preview')}</span>`}
                </div>
              </div>

              <label>
                ${this.t('editor.field.created_at')}
                <input class="nh-input" type="datetime-local" .value=${entry ? this.isoToLocalInput(entry.created_at) : this.isoToLocalInput()} ?disabled=${!entry} @change=${(event: Event) => this.updateCurrentField('created_at', this.localInputToIso((event.currentTarget as HTMLInputElement).value))} />
              </label>
              <label>
                ${this.t('editor.field.updated_at')}
                <input class="nh-input" type="datetime-local" .value=${entry ? this.isoToLocalInput(entry.updated_at) : this.isoToLocalInput()} ?disabled=${!entry} @change=${(event: Event) => this.updateCurrentField('updated_at', this.localInputToIso((event.currentTarget as HTMLInputElement).value))} />
              </label>

              <label class="checkbox-field">
                <input type="checkbox" ?checked=${entry?.hide === true} ?disabled=${!entry} @change=${(event: Event) => this.updateCurrentField('hide', (event.currentTarget as HTMLInputElement).checked)} />
                ${this.t('editor.field.hide')}
              </label>
              <label class="checkbox-field">
                <input
                  type="checkbox"
                  ?checked=${entry?.featured === true}
                  ?disabled=${!entry}
                  @change=${(event: Event) => {
                    const current = this.currentEntry();
                    if (!current) {
                      return;
                    }
                    this.toggleFeaturedEntry(current, (event.currentTarget as HTMLInputElement).checked);
                  }}
                />
                ${this.t('editor.field.featured')}
              </label>

              <label>
                ${this.t('editor.field.featured_rank')}
                <input class="nh-input" type="number" min="1" max="999" step="1" placeholder=${this.t('editor.field.featured_rank_placeholder')} .value=${entry?.featured_rank || ''} ?disabled=${!entry || !entry.featured} @input=${(event: Event) => this.updateCurrentField('featured_rank', (event.currentTarget as HTMLInputElement).value)} />
              </label>
              <div class="full hint">${this.t('editor.summary.featured_order_hint')}</div>
            </div>
          </section>
        </main>
      </div>

      <input id="bookmark-file" class="hidden" type="file" accept=".html,.htm" @change=${this.onBookmarkFileChange} />
      <input id="preview-file" class="hidden" type="file" accept="image/*" @change=${this.onPreviewFileChange} />
    `;
  }
}

customElements.define('navhoard-editor-app', NavHoardEditorApp);
