import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import fetch from 'node-fetch';
import Ajv from 'ajv';
import * as yaml from 'yaml';

export interface NavEntry {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
  confidence?: number;
  featured?: boolean;
  featured_rank?: number;
  preview?: NavPreview;
}

export interface EntryDraft {
  url: string;
  title: string;
  summary: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
  confidence?: number;
  featured?: boolean;
  featured_rank?: number;
  preview?: NavPreview;
}

export interface NavPreview {
  enabled?: boolean;
  mode?: 'auto' | 'external' | 'local';
  src?: string;
  alt?: string;
}

export interface OutputPayload {
  version: string;
  updated_at: string;
  entries: NavEntry[];
}

export interface ManifestPayload {
  version: string;
  updated_at: string;
  total: number;
  groups: string[];
}

export interface ValidationResult {
  entries: NavEntry[];
  invalidCount: number;
  invalidMessages: string[];
}

export interface MergeResult {
  entries: NavEntry[];
  duplicateCount: number;
}

export interface WriteSummary {
  mode: 'single' | 'sharded';
  files: string[];
}

export interface DataPaths {
  canonicalFile: string;
  canonicalDir: string;
  publishDir: string;
}

export interface BatchNormalizeContext {
  sourceName: string;
  sourceId?: string;
}

export interface CaptureFetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers?: {
    get(name: string): string | null;
  };
  arrayBuffer?(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

export type CaptureFetcher = (url: string) => Promise<CaptureFetchResponse>;

export interface CaptureDraftOptions {
  html?: string;
  now?: string;
  source?: string;
  fetcher?: CaptureFetcher;
}

export interface CaptureDraftResult {
  status: 'success' | 'partial' | 'failed';
  url: string;
  normalizedUrl: string;
  draft: EntryDraft;
  warnings: string[];
  failureReason?: string;
}

export interface ReviewTemplateData {
  template: string;
  status: CaptureDraftResult['status'];
  confirm: boolean;
  failure_reason?: string;
  warnings: string[];
  entry: EntryDraft;
}

export interface ReviewTemplateParseResult {
  ok: boolean;
  confirmed: boolean;
  status: CaptureDraftResult['status'];
  draft: EntryDraft | null;
  warnings: string[];
  failureReason?: string;
  invalidMessages: string[];
}

export type ConfirmWriteResult =
  | {
      ok: true;
      entry: NavEntry;
      total: number;
      duplicateCount: number;
      mode: 'single' | 'sharded';
      writtenFiles: string[];
      outputPath: string;
    }
  | {
      ok: false;
      invalidMessages: string[];
    };

export type PersistEntriesResult =
  | {
      ok: true;
      entries: NavEntry[];
      total: number;
      duplicateCount: number;
      mode: 'single' | 'sharded';
      writtenFiles: string[];
      outputPath: string;
    }
  | {
      ok: false;
      invalidMessages: string[];
    };

export const DATA_VERSION = '0.2';
export const SHARD_THRESHOLD = 500;
export const MAX_TITLE_LENGTH = 120;
export const MAX_SUMMARY_LENGTH = 300;
export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 20;
export const SUMMARY_FALLBACK = '暂无摘要';
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const DEFAULT_SOURCES_PATH = path.join(PROJECT_ROOT, 'data/sources.yaml');
export const DEFAULT_CONFIG_PATH = path.join(PROJECT_ROOT, 'data/config.yaml');
export const DEFAULT_CANONICAL_DATA_FILE = path.join(PROJECT_ROOT, 'data/index.json');
export const DEFAULT_PUBLISH_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
export const REVIEW_TEMPLATE_VERSION = 'nav-hoard-entry-review/v1';

const KEYWORD_TAGS: Array<[RegExp, string]> = [
  [/react/i, 'React'],
  [/hooks/i, 'Hooks'],
  [/javascript|ecmascript|js\b/i, 'JavaScript'],
  [/typescript|ts\b/i, 'TypeScript'],
  [/css/i, 'CSS'],
  [/html/i, 'HTML'],
  [/node/i, 'Node.js'],
  [/vite/i, 'Vite'],
  [/chrome/i, 'Chrome'],
  [/v8/i, 'V8'],
  [/github/i, 'GitHub'],
  [/copilot|ai/i, 'AI'],
  [/performance|性能/i, '性能'],
  [/frontend|前端/i, '前端'],
  [/tool|工具/i, '工具'],
  [/量子|quantum/i, '量子计算'],
  [/ibm/i, 'IBM'],
  [/syntax|语法/i, '语法']
];

const ajv = new Ajv({ allErrors: true });
const validateEntry = ajv.compile({
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 12, maxLength: 12 },
    url: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1, maxLength: MAX_TITLE_LENGTH },
    summary: { type: 'string', minLength: 1, maxLength: MAX_SUMMARY_LENGTH },
    tags: {
      type: 'array',
      items: { type: 'string', minLength: 1, maxLength: MAX_TAG_LENGTH },
      maxItems: MAX_TAGS
    },
    source: { type: 'string', minLength: 1 },
    created_at: { type: 'string', minLength: 1 },
    updated_at: { type: 'string', minLength: 1 },
    confidence: { type: 'number', minimum: 0, maximum: 1, nullable: true },
    featured: { type: 'boolean', nullable: true },
    featured_rank: { type: 'integer', minimum: 1, maximum: 999, nullable: true },
    preview: {
      type: 'object',
      nullable: true,
      properties: {
        enabled: { type: 'boolean', nullable: true },
        mode: { type: 'string', enum: ['auto', 'external', 'local'], nullable: true },
        src: { type: 'string', minLength: 1, nullable: true },
        alt: { type: 'string', minLength: 1, maxLength: MAX_TITLE_LENGTH, nullable: true }
      },
      additionalProperties: false
    }
  },
  required: ['id', 'url', 'title', 'summary', 'tags', 'source', 'created_at', 'updated_at'],
  additionalProperties: false
});

export function normalizeBatchEntry(entry: EntryDraft, context: BatchNormalizeContext): NavEntry | null {
  const normalizedUrl = normalizeUrl(entry.url);
  if (!normalizedUrl) {
    return null;
  }

  const cleanedTitle = truncate(cleanText(entry.title), MAX_TITLE_LENGTH);
  const cleanedSummary = truncate(cleanText(entry.summary), MAX_SUMMARY_LENGTH);
  const fallbackTitle = truncate(cleanText(context.sourceName || context.sourceId || deriveSourceLabel(normalizedUrl)), MAX_TITLE_LENGTH);
  const finalTitle = cleanedTitle || fallbackTitle;
  const finalSummary = cleanedSummary || generateSummary(finalTitle, normalizedUrl);

  if (!finalTitle || !finalSummary) {
    return null;
  }

  return {
    id: idFromUrl(normalizedUrl),
    url: normalizedUrl,
    title: finalTitle,
    summary: finalSummary,
    tags: inferTags(finalTitle, finalSummary, entry.tags).slice(0, MAX_TAGS),
    source: cleanText(entry.source) || deriveSourceLabel(normalizedUrl, context.sourceName || context.sourceId),
    created_at: toIsoDate(entry.created_at),
    updated_at: toIsoDate(entry.updated_at),
    confidence: normalizeConfidence(entry.confidence, 0.7),
    featured: normalizeFeatured(entry.featured),
    featured_rank: normalizeFeaturedRank(entry.featured_rank, entry.featured),
    preview: normalizePreview(entry.preview)
  };
}

export async function captureDraft(url: string, options: CaptureDraftOptions = {}): Promise<CaptureDraftResult> {
  const rawUrl = cleanText(url);
  const normalizedUrl = normalizeUrl(rawUrl);
  const draftUrl = normalizedUrl || rawUrl;
  const now = toIsoDate(options.now);

  if (!normalizedUrl) {
    return createFailedDraft(rawUrl, draftUrl, now, 'Invalid URL');
  }

  try {
    const html = options.html ?? await fetchPageHtml(normalizedUrl, options.fetcher);
    const parsed = parseHtmlToDraft(normalizedUrl, html, now, options.source);
    return parsed;
  } catch (error) {
    return createFailedDraft(rawUrl, normalizedUrl, now, getErrorMessage(error));
  }
}

export function formatReviewTemplate(result: CaptureDraftResult): string {
  const payload: ReviewTemplateData = {
    template: REVIEW_TEMPLATE_VERSION,
    status: result.status,
    confirm: false,
    failure_reason: result.failureReason,
    warnings: result.warnings,
    entry: {
      ...result.draft,
      tags: [...result.draft.tags]
    }
  };

  return [
    '# NavHoard Entry Review',
    '# Edit the entry fields below, then set confirm: true before writing.',
    '# This fixed template is shared by success, partial, and failure flows.',
    '--- nav-hoard-entry-review ---',
    yaml.stringify(payload).trimEnd(),
    '--- end nav-hoard-entry-review ---'
  ].join('\n');
}

export function parseReviewTemplate(templateText: string): ReviewTemplateParseResult {
  const yamlContent = extractReviewTemplateYaml(templateText);
  if (!yamlContent) {
    return {
      ok: false,
      confirmed: false,
      status: 'failed',
      draft: null,
      warnings: [],
      invalidMessages: ['review template markers are missing or invalid']
    };
  }

  let parsed: unknown;
  try {
    parsed = yaml.parse(yamlContent);
  } catch (error) {
    return {
      ok: false,
      confirmed: false,
      status: 'failed',
      draft: null,
      warnings: [],
      invalidMessages: [`failed to parse review template: ${getErrorMessage(error)}`]
    };
  }

  const payload = (parsed && typeof parsed === 'object' ? parsed : {}) as Partial<ReviewTemplateData> & {
    entry?: Partial<EntryDraft>;
  };
  const invalidMessages: string[] = [];

  if (payload.template !== REVIEW_TEMPLATE_VERSION) {
    invalidMessages.push(`template must equal ${REVIEW_TEMPLATE_VERSION}`);
  }

  const status = normalizeTemplateStatus(payload.status);
  if (!status) {
    invalidMessages.push('status must be one of: success, partial, failed');
  }

  const draft = normalizeTemplateDraft(payload.entry);
  invalidMessages.push(...draft.invalidMessages);

  const warnings = normalizeStringList(payload.warnings);
  const failureReason = cleanText(String(payload.failure_reason || '')) || undefined;
  const confirmed = normalizeConfirmFlag(payload.confirm);

  if (!draft.value) {
    return {
      ok: false,
      confirmed,
      status: status || 'failed',
      draft: null,
      warnings,
      failureReason,
      invalidMessages
    };
  }

  invalidMessages.push(...validateDraftFields(draft.value));

  return {
    ok: invalidMessages.length === 0,
    confirmed,
    status: status || 'failed',
    draft: draft.value,
    warnings,
    failureReason,
    invalidMessages
  };
}

export function confirmReviewedTemplate(
  templateText: string,
  outputPath = DEFAULT_CANONICAL_DATA_FILE
): ConfirmWriteResult {
  const parsed = parseReviewTemplate(templateText);
  if (!parsed.ok || !parsed.draft) {
    return {
      ok: false,
      invalidMessages: parsed.invalidMessages
    };
  }

  if (!parsed.confirmed) {
    return {
      ok: false,
      invalidMessages: ['explicit confirmation required: set confirm to true before writing']
    };
  }

  return confirmAndWriteEntry(parsed.draft, outputPath);
}

export function confirmAndWriteEntry(draft: EntryDraft, outputPath = DEFAULT_CANONICAL_DATA_FILE): ConfirmWriteResult {
  const normalized = normalizeConfirmedEntry(draft);
  if (!normalized.ok) {
    return normalized;
  }

  const dataPaths = resolveDataPaths(outputPath);
  const existingEntries = loadExistingEntries(dataPaths);
  const merged = mergeEntries(existingEntries, [normalized.entry]);
  const validated = validateEntries(merged.entries);

  if (validated.invalidCount > 0) {
    return {
      ok: false,
      invalidMessages: validated.invalidMessages
    };
  }

  const sortedEntries = sortEntries(validated.entries);
  const writeSummary = writeOutputs(dataPaths, sortedEntries);

  return {
    ok: true,
    entry: normalized.entry,
    total: sortedEntries.length,
    duplicateCount: merged.duplicateCount,
    mode: writeSummary.mode,
    writtenFiles: writeSummary.files,
    outputPath: dataPaths.canonicalFile
  };
}

export function replaceDraftEntries(
  drafts: EntryDraft[],
  outputPath = DEFAULT_CANONICAL_DATA_FILE
): PersistEntriesResult {
  return persistDraftEntries(drafts, outputPath, 'replace');
}

export function mergeDraftEntries(
  drafts: EntryDraft[],
  outputPath = DEFAULT_CANONICAL_DATA_FILE
): PersistEntriesResult {
  return persistDraftEntries(drafts, outputPath, 'merge');
}

function persistDraftEntries(
  drafts: EntryDraft[],
  outputPath: string,
  strategy: 'replace' | 'merge'
): PersistEntriesResult {
  const invalidMessages: string[] = [];
  const normalizedEntries: NavEntry[] = [];

  for (const [index, draft] of drafts.entries()) {
    const normalized = normalizeBatchEntry(draft, {
      sourceName: draft.source || draft.title || `entry-${index + 1}`
    });

    if (!normalized) {
      invalidMessages.push(`entry ${index + 1}: unable to normalize draft`);
      continue;
    }

    normalizedEntries.push(normalized);
  }

  if (invalidMessages.length > 0) {
    return {
      ok: false,
      invalidMessages
    };
  }

  const dataPaths = resolveDataPaths(outputPath);
  const existingEntries = strategy === 'merge' ? loadExistingEntries(dataPaths) : [];
  const merged = mergeEntries(existingEntries, normalizedEntries);
  const validated = validateEntries(merged.entries);

  if (validated.invalidCount > 0) {
    return {
      ok: false,
      invalidMessages: validated.invalidMessages
    };
  }

  const sortedEntries = sortEntries(validated.entries);
  const writeSummary = writeOutputs(dataPaths, sortedEntries);

  return {
    ok: true,
    entries: sortedEntries,
    total: sortedEntries.length,
    duplicateCount: merged.duplicateCount,
    mode: writeSummary.mode,
    writtenFiles: writeSummary.files,
    outputPath: dataPaths.canonicalFile
  };
}

function normalizeConfirmedEntry(draft: EntryDraft): ConfirmWriteResult | { ok: true; entry: NavEntry } {
  const invalidMessages: string[] = [];
  const normalizedUrl = normalizeUrl(draft.url);
  if (!normalizedUrl) {
    invalidMessages.push('url is invalid');
  }

  const cleanedTitle = truncate(cleanText(draft.title), MAX_TITLE_LENGTH);
  const cleanedSummary = truncate(cleanText(draft.summary), MAX_SUMMARY_LENGTH);
  if (!cleanedTitle) {
    invalidMessages.push('title is required');
  }
  if (!cleanedSummary) {
    invalidMessages.push('summary is required');
  }

  if (invalidMessages.length > 0 || !normalizedUrl) {
    return { ok: false, invalidMessages };
  }

  const entry: NavEntry = {
    id: idFromUrl(normalizedUrl),
    url: normalizedUrl,
    title: cleanedTitle,
    summary: cleanedSummary,
    tags: inferTags(cleanedTitle, cleanedSummary, draft.tags).slice(0, MAX_TAGS),
    source: cleanText(draft.source) || deriveSourceLabel(normalizedUrl),
    created_at: toIsoDate(draft.created_at),
    updated_at: toIsoDate(draft.updated_at),
    confidence: normalizeConfidence(draft.confidence, 0.7),
    featured: normalizeFeatured(draft.featured),
    featured_rank: normalizeFeaturedRank(draft.featured_rank, draft.featured),
    preview: normalizePreview(draft.preview)
  };

  const validated = validateEntries([entry]);
  if (validated.invalidCount > 0) {
    return {
      ok: false,
      invalidMessages: validated.invalidMessages
    };
  }

  return {
    ok: true,
    entry
  };
}

function parseHtmlToDraft(url: string, html: string, now: string, explicitSource?: string): CaptureDraftResult {
  const $ = load(html);
  const extractedTitle = cleanText(
    $('meta[property="og:title"]').attr('content')
      || $('meta[name="twitter:title"]').attr('content')
      || $('title').first().text()
      || $('h1').first().text()
  );

  const extractedSummary = cleanText(
    $('meta[name="description"]').attr('content')
      || $('meta[property="og:description"]').attr('content')
      || $('meta[name="twitter:description"]').attr('content')
      || $('article p').first().text()
      || $('main p').first().text()
      || $('p').first().text()
  );

  const extractedKeywordTags = cleanText($('meta[name="keywords"]').attr('content') || '')
    .split(/[，,、|/]/)
    .map(tag => truncate(cleanText(tag), MAX_TAG_LENGTH))
    .filter(Boolean);

  const source = cleanText(explicitSource || deriveSourceLabel(url));
  const previewImage = resolvePreviewImage(
    url,
    cleanText(
      $('meta[property="og:image"]').attr('content')
      || $('meta[name="twitter:image"]').attr('content')
      || ''
    )
  );
  const warnings: string[] = [];
  const hasBrokenTitle = isLikelyMojibake(extractedTitle);
  const hasBrokenSummary = isLikelyMojibake(extractedSummary);
  const keywordTags = extractedKeywordTags.filter(tag => !isLikelyMojibake(tag));
  const droppedBrokenTags = extractedKeywordTags.length - keywordTags.length;
  const finalTitle = !hasBrokenTitle && extractedTitle ? extractedTitle : truncate(source, MAX_TITLE_LENGTH);
  const finalSummary = !hasBrokenSummary && extractedSummary ? extractedSummary : generateSummary(finalTitle, url);

  if (hasBrokenTitle) {
    warnings.push('captured title may contain encoding issues; fallback title was used');
  } else if (!extractedTitle) {
    warnings.push('title was generated from source');
  }
  if (hasBrokenSummary) {
    warnings.push('captured summary may contain encoding issues; fallback summary was used');
  } else if (!extractedSummary) {
    warnings.push('summary was generated from fallback');
  }
  if (droppedBrokenTags > 0) {
    warnings.push('some captured tags may contain encoding issues and were skipped');
  }

  const draft: EntryDraft = {
    url,
    title: finalTitle,
    summary: finalSummary,
    tags: inferTags(finalTitle, finalSummary, keywordTags).slice(0, MAX_TAGS),
    source,
    created_at: now,
    updated_at: now,
    confidence: warnings.length > 0 ? 0.6 : 0.8,
    preview: previewImage ? {
      enabled: true,
      mode: 'auto',
      src: previewImage,
      alt: finalTitle
    } : undefined
  };

  return {
    status: warnings.length > 0 ? 'partial' : 'success',
    url,
    normalizedUrl: url,
    draft,
    warnings
  };
}

function createFailedDraft(rawUrl: string, draftUrl: string, now: string, reason: string): CaptureDraftResult {
  const fallbackSource = cleanText(deriveSourceLabel(draftUrl) || 'unknown');
  return {
    status: 'failed',
    url: rawUrl,
    normalizedUrl: draftUrl,
    draft: {
      url: draftUrl,
      title: '',
      summary: '',
      tags: [],
      source: fallbackSource,
      created_at: now,
      updated_at: now,
      confidence: 0
    },
    warnings: [],
    failureReason: reason
  };
}

function extractReviewTemplateYaml(templateText: string): string {
  const match = templateText.match(/--- nav-hoard-entry-review ---\s*([\s\S]*?)\s*--- end nav-hoard-entry-review ---/);
  if (match) {
    return match[1].trim();
  }

  const trimmed = templateText.trim();
  return trimmed;
}

function normalizeTemplateStatus(value: unknown): CaptureDraftResult['status'] | null {
  const normalized = cleanText(String(value || '')).toLowerCase();
  return normalized === 'success' || normalized === 'partial' || normalized === 'failed'
    ? normalized
    : null;
}

function normalizeTemplateDraft(entry: Partial<EntryDraft> | undefined): {
  value: EntryDraft | null;
  invalidMessages: string[];
} {
  if (!entry || typeof entry !== 'object') {
    return {
      value: null,
      invalidMessages: ['entry block is required']
    };
  }

  const invalidMessages: string[] = [];
  const url = cleanText(String(entry.url || ''));
  if (!url) {
    invalidMessages.push('entry.url is required');
  }

  return {
    value: {
      url,
      title: cleanText(String(entry.title || '')),
      summary: cleanText(String(entry.summary || '')),
      tags: normalizeStringList(entry.tags),
      source: cleanText(String(entry.source || '')),
      created_at: cleanText(String(entry.created_at || '')),
      updated_at: cleanText(String(entry.updated_at || '')),
      confidence: normalizeTemplateConfidence(entry.confidence),
      preview: normalizeTemplatePreview((entry as { preview?: unknown }).preview)
    },
    invalidMessages
  };
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => truncate(cleanText(String(item)), MAX_TAG_LENGTH))
      .filter(Boolean)
      .slice(0, MAX_TAGS);
  }

  const text = cleanText(String(value || ''));
  if (!text) {
    return [];
  }

  return text
    .split(/[，,、|/]/)
    .map(item => truncate(cleanText(item), MAX_TAG_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_TAGS);
}

function normalizeTemplateConfidence(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }

  const text = cleanText(String(value || ''));
  if (!text) {
    return undefined;
  }

  const parsed = Number(text);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function normalizeConfirmFlag(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = cleanText(String(value || '')).toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === 'y' || normalized === 'confirmed';
}

function validateDraftFields(draft: EntryDraft): string[] {
  const invalidMessages: string[] = [];

  if (!normalizeUrl(draft.url)) {
    invalidMessages.push('entry.url is invalid');
  }
  if (!truncate(cleanText(draft.title), MAX_TITLE_LENGTH)) {
    invalidMessages.push('entry.title is required');
  }
  if (!truncate(cleanText(draft.summary), MAX_SUMMARY_LENGTH)) {
    invalidMessages.push('entry.summary is required');
  }
  if (!cleanText(draft.source)) {
    invalidMessages.push('entry.source is required');
  }
  if (!cleanText(draft.created_at)) {
    invalidMessages.push('entry.created_at is required');
  }
  if (!cleanText(draft.updated_at)) {
    invalidMessages.push('entry.updated_at is required');
  }
  if (draft.preview && !normalizePreview(draft.preview)) {
    invalidMessages.push('entry.preview is invalid');
  }

  return invalidMessages;
}

async function fetchPageHtml(url: string, fetcher?: CaptureFetcher): Promise<string> {
  const response = fetcher ? await fetcher(url) : await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  if (response.arrayBuffer) {
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers?.get('content-type') || '';
    return decodeHtmlBuffer(buffer, contentType);
  }

  return response.text();
}

function decodeHtmlBuffer(buffer: Buffer, contentType: string): string {
  const headerCharset = normalizeCharsetLabel(extractCharsetFromContentType(contentType));
  const metaCharset = normalizeCharsetLabel(extractCharsetFromHtml(buffer));
  const candidates = uniqueCharsets([
    headerCharset,
    metaCharset,
    'utf-8',
    'gb18030',
    'gbk',
    'big5'
  ]);

  for (const charset of candidates) {
    const decoded = tryDecodeBuffer(buffer, charset);
    if (decoded) {
      return decoded;
    }
  }

  return buffer.toString('utf8');
}

function extractCharsetFromContentType(contentType: string): string | null {
  const match = contentType.match(/charset\s*=\s*["']?\s*([^;"'\s>]+)/i);
  return match ? match[1] : null;
}

function extractCharsetFromHtml(buffer: Buffer): string | null {
  const head = buffer.subarray(0, 4096).toString('latin1');
  const directMatch = head.match(/<meta[^>]+charset\s*=\s*["']?\s*([^"'>\s/]+)/i);
  if (directMatch) {
    return directMatch[1];
  }

  const httpEquivMatch = head.match(
    /<meta[^>]+http-equiv\s*=\s*["']content-type["'][^>]+content\s*=\s*["'][^"']*charset\s*=\s*([^"'>\s;]+)/i
  );
  if (httpEquivMatch) {
    return httpEquivMatch[1];
  }

  return null;
}

function normalizeCharsetLabel(charset: string | null | undefined): string | null {
  if (!charset) {
    return null;
  }

  const normalized = charset.trim().toLowerCase();
  switch (normalized) {
    case 'utf8':
      return 'utf-8';
    case 'gb2312':
    case 'gb_2312':
    case 'gb-2312':
      return 'gb18030';
    case 'gbk':
    case 'cp936':
    case 'ms936':
    case 'x-gbk':
      return 'gbk';
    default:
      return normalized;
  }
}

function uniqueCharsets(candidates: Array<string | null>): string[] {
  const result: string[] = [];
  for (const candidate of candidates) {
    if (!candidate || result.includes(candidate)) {
      continue;
    }
    result.push(candidate);
  }
  return result;
}

function tryDecodeBuffer(buffer: Buffer, charset: string): string | null {
  try {
    return new TextDecoder(charset, { fatal: true }).decode(buffer);
  } catch {
    return null;
  }
}

export function validateEntries(entries: NavEntry[]): ValidationResult {
  const validEntries: NavEntry[] = [];
  const invalidMessages: string[] = [];

  for (const entry of entries) {
    const isValid = validateEntry(entry);
    if (isValid) {
      validEntries.push(entry);
      continue;
    }

    const reason = (validateEntry.errors || [])
      .map(error => `${error.instancePath || '/'} ${error.message}`.trim())
      .join('; ');
    const invalidEntry = entry as NavEntry;
    invalidMessages.push(`${invalidEntry.url || '(missing url)'} -> ${reason}`);
  }

  return {
    entries: validEntries,
    invalidCount: invalidMessages.length,
    invalidMessages
  };
}

export function mergeEntries(existing: NavEntry[], incoming: NavEntry[]): MergeResult {
  const mergedMap = new Map<string, NavEntry>();
  let duplicateCount = 0;

  for (const entry of existing) {
    mergedMap.set(entry.id || idFromUrl(entry.url), normalizePersistedEntry(entry));
  }

  for (const entry of incoming) {
    const current = mergedMap.get(entry.id);
    if (!current) {
      mergedMap.set(entry.id, entry);
      continue;
    }

    duplicateCount += 1;
    const nextUpdated = new Date(entry.updated_at).getTime();
    const currentUpdated = new Date(current.updated_at).getTime();
    const mergedTags = Array.from(new Set([...current.tags, ...entry.tags])).slice(0, MAX_TAGS);

    if (nextUpdated >= currentUpdated) {
      mergedMap.set(entry.id, {
        ...current,
        ...entry,
        tags: mergedTags,
        title: entry.title || current.title,
        summary: entry.summary || current.summary,
        created_at: current.created_at || entry.created_at,
        updated_at: entry.updated_at,
        confidence: Math.max(current.confidence ?? 0, entry.confidence ?? 0),
        featured: entry.featured ?? current.featured ?? false,
        featured_rank: normalizeMergedFeaturedRank(entry, current),
        preview: normalizePreview(entry.preview) ?? normalizePreview(current.preview)
      });
    } else {
      mergedMap.set(entry.id, {
        ...current,
        tags: mergedTags,
        confidence: Math.max(current.confidence ?? 0, entry.confidence ?? 0),
        featured: current.featured ?? false,
        featured_rank: normalizeMergedFeaturedRank(current, entry),
        preview: normalizePreview(current.preview) ?? normalizePreview(entry.preview)
      });
    }
  }

  return {
    entries: Array.from(mergedMap.values()),
    duplicateCount
  };
}

export function resolveDataPaths(outputPath: string): DataPaths {
  const requestedPath = path.resolve(outputPath);
  const repoDataDir = path.join(PROJECT_ROOT, 'data');
  const repoPublicDir = DEFAULT_PUBLISH_DATA_DIR;

  if (isWithinDirectory(requestedPath, repoPublicDir)) {
    const relativePath = path.relative(repoPublicDir, requestedPath) || 'index.json';
    const canonicalFile = path.join(repoDataDir, relativePath);
    return {
      canonicalFile,
      canonicalDir: path.dirname(canonicalFile),
      publishDir: repoPublicDir
    };
  }

  if (isWithinDirectory(requestedPath, repoDataDir)) {
    return {
      canonicalFile: requestedPath,
      canonicalDir: path.dirname(requestedPath),
      publishDir: repoPublicDir
    };
  }

  return {
    canonicalFile: requestedPath,
    canonicalDir: path.dirname(requestedPath),
    publishDir: path.dirname(requestedPath)
  };
}

export function loadExistingEntries(dataPaths: DataPaths): NavEntry[] {
  if (fs.existsSync(dataPaths.canonicalFile)) {
    return readEntryPayload(dataPaths.canonicalFile);
  }
  return [];
}

function readEntryPayload(filePath: string): NavEntry[] {
  try {
    const parsed = parseJsonFile<OutputPayload | NavEntry[]>(filePath);
    if (Array.isArray(parsed)) {
      return parsed.map(entry => normalizePersistedEntry(entry));
    }
    if (Array.isArray(parsed.entries)) {
      return parsed.entries.map(entry => normalizePersistedEntry(entry));
    }
  } catch (error) {
    console.warn(`Failed to parse ${filePath}`, error);
  }
  return [];
}

function parseJsonFile<T>(filePath: string): T {
  return JSON.parse(stripUtf8Bom(fs.readFileSync(filePath, 'utf-8'))) as T;
}

function stripUtf8Bom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

export function writeOutputs(dataPaths: DataPaths, entries: NavEntry[]): WriteSummary {
  ensureDir(dataPaths.canonicalDir);
  ensureDir(dataPaths.publishDir);

  cleanupGeneratedFiles(dataPaths.canonicalDir);
  if (dataPaths.publishDir !== dataPaths.canonicalDir) {
    cleanupGeneratedFiles(dataPaths.publishDir);
  }

  const files: string[] = [];
  const canonicalPayload: OutputPayload = {
    version: DATA_VERSION,
    updated_at: new Date().toISOString(),
    entries
  };
  fs.writeFileSync(dataPaths.canonicalFile, JSON.stringify(canonicalPayload, null, 2), 'utf-8');
  files.push(dataPaths.canonicalFile);

  if (entries.length > SHARD_THRESHOLD) {
    const updatedAt = new Date().toISOString();
    const groupedEntries = groupEntries(entries);
    const groups = Array.from(groupedEntries.keys()).sort();

    for (const group of groups) {
      const shardPath = path.join(dataPaths.publishDir, `index-${group}.json`);
      const payload: OutputPayload = {
        version: DATA_VERSION,
        updated_at: updatedAt,
        entries: groupedEntries.get(group) || []
      };
      fs.writeFileSync(shardPath, JSON.stringify(payload, null, 2), 'utf-8');
      files.push(shardPath);
    }

    const manifestPath = path.join(dataPaths.publishDir, 'manifest.json');
    const manifest: ManifestPayload = {
      version: DATA_VERSION,
      updated_at: updatedAt,
      total: entries.length,
      groups
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    files.push(manifestPath);

    return { mode: 'sharded', files };
  }

  const publishFile = path.join(dataPaths.publishDir, 'index.json');
  fs.writeFileSync(publishFile, JSON.stringify(canonicalPayload, null, 2), 'utf-8');
  if (publishFile !== dataPaths.canonicalFile) {
    files.push(publishFile);
  }
  return { mode: 'single', files };
}

function cleanupGeneratedFiles(outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    return;
  }

  const manifestPath = path.join(outputDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    fs.rmSync(manifestPath, { force: true });
  }

  for (const file of fs.readdirSync(outputDir)) {
    if (/^index-[a-z0-9]+\.json$/i.test(file)) {
      fs.rmSync(path.join(outputDir, file), { force: true });
    }
  }
}

function sortEntries(entries: NavEntry[]): NavEntry[] {
  return [...entries].sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  );
}

function groupEntries(entries: NavEntry[]): Map<string, NavEntry[]> {
  const groups = new Map<string, NavEntry[]>();
  for (const entry of entries) {
    const group = shardGroupForEntry(entry);
    const bucket = groups.get(group) || [];
    bucket.push(entry);
    groups.set(group, bucket);
  }
  return groups;
}

function shardGroupForEntry(entry: NavEntry): string {
  const first = (entry.title || entry.source || 'misc').trim().charAt(0).toLowerCase();
  return /^[a-z0-9]$/.test(first) ? first : 'misc';
}

function normalizePersistedEntry(entry: NavEntry): NavEntry {
  const normalizedUrl = normalizeUrl(entry.url) || entry.url;
  return {
    id: entry.id || idFromUrl(normalizedUrl),
    url: normalizedUrl,
    title: truncate(cleanText(entry.title), MAX_TITLE_LENGTH),
    summary: truncate(cleanText(entry.summary), MAX_SUMMARY_LENGTH) || SUMMARY_FALLBACK,
    tags: inferTags(entry.title, entry.summary, entry.tags),
    source: cleanText(entry.source) || 'unknown',
    created_at: toIsoDate(entry.created_at),
    updated_at: toIsoDate(entry.updated_at),
    confidence: typeof entry.confidence === 'number' ? entry.confidence : 1,
    featured: normalizeFeatured(entry.featured),
    featured_rank: normalizeFeaturedRank(entry.featured_rank, entry.featured),
    preview: normalizePreview(entry.preview)
  };
}

function normalizeFeatured(value: unknown): boolean {
  return value === true;
}

function normalizeFeaturedRank(value: unknown, featured?: unknown): number | undefined {
  if (!normalizeFeatured(featured) && featured !== undefined) {
    return undefined;
  }

  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 999) {
    return value;
  }

  const parsed = Number(String(value ?? '').trim());
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 999) {
    return parsed;
  }

  return normalizeFeatured(featured) ? 100 : undefined;
}

function normalizeMergedFeaturedRank(primary: NavEntry, fallback: NavEntry): number | undefined {
  if (primary.featured) {
    return normalizeFeaturedRank(primary.featured_rank, true);
  }

  if (fallback.featured) {
    return normalizeFeaturedRank(fallback.featured_rank, true);
  }

  return undefined;
}

function normalizePreview(value: unknown): NavPreview | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const preview = value as NavPreview;
  const src = cleanText(String(preview.src || ''));
  const enabled = preview.enabled !== false;
  if (!enabled || !src) {
    return undefined;
  }

  const mode = normalizePreviewMode(preview.mode, src);
  const normalizedSrc = mode === 'local' ? src.replace(/^\/+/, '') : src;
  if (!normalizedSrc) {
    return undefined;
  }

  const alt = truncate(cleanText(String(preview.alt || '')), MAX_TITLE_LENGTH);
  return {
    enabled: true,
    mode,
    src: normalizedSrc,
    alt: alt || undefined
  };
}

function normalizeTemplatePreview(value: unknown): NavPreview | undefined {
  return normalizePreview(value);
}

function normalizePreviewMode(value: unknown, src: string): NavPreview['mode'] {
  const normalized = cleanText(String(value || '')).toLowerCase();
  if (normalized === 'auto' || normalized === 'external' || normalized === 'local') {
    return normalized;
  }
  return /^https?:\/\//i.test(src) ? 'external' : 'local';
}

function resolvePreviewImage(pageUrl: string, src: string): string {
  if (!src) {
    return '';
  }

  try {
    return new URL(src, pageUrl).toString();
  } catch {
    return '';
  }
}

function isWithinDirectory(targetPath: string, directoryPath: string): boolean {
  const relativePath = path.relative(directoryPath, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
    }
    url.hash = '';

    const nextParams = Array.from(url.searchParams.entries())
      .filter(([key]) => !key.toLowerCase().startsWith('utm_') && key.toLowerCase() !== 'ref')
      .sort(([left], [right]) => left.localeCompare(right));

    url.search = '';
    for (const [key, value] of nextParams) {
      url.searchParams.append(key, value);
    }

    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.toString();
  } catch {
    return '';
  }
}

function idFromUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 12);
}

function cleanText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F]+/g, ' ')
    .trim();
}

function isLikelyMojibake(value: string): boolean {
  if (!value) {
    return false;
  }

  return (
    value.includes('�')
    || value.includes('锟斤拷')
    || /Ã[\u0080-\u00BF]/u.test(value)
    || /Â[\u0080-\u00BF]/u.test(value)
    || /ðŸ[\u0080-\u00BF]/u.test(value)
  );
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function inferTags(title: string, summary: string, rawTags: string[] = []): string[] {
  const tags = new Set<string>();

  for (const tag of rawTags) {
    const cleaned = truncate(cleanText(tag), MAX_TAG_LENGTH);
    if (cleaned) {
      tags.add(cleaned);
    }
  }

  const corpus = `${title} ${summary}`;
  for (const [pattern, label] of KEYWORD_TAGS) {
    if (pattern.test(corpus)) {
      tags.add(label);
    }
    if (tags.size >= MAX_TAGS) {
      break;
    }
  }

  if (tags.size === 0) {
    tags.add('收藏');
  }

  return Array.from(tags).slice(0, MAX_TAGS);
}

function generateSummary(title: string, url: string): string {
  if (title) {
    return truncate(title, MAX_SUMMARY_LENGTH);
  }
  return truncate(`来自 ${url} 的链接内容。`, MAX_SUMMARY_LENGTH) || SUMMARY_FALLBACK;
}

function deriveSourceLabel(normalizedUrl: string, fallback = ''): string {
  try {
    return new URL(normalizedUrl).hostname;
  } catch {
    return fallback || 'unknown';
  }
}

function toIsoDate(rawValue?: string): string {
  if (!rawValue) {
    return new Date().toISOString();
  }
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function normalizeConfidence(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, value));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
