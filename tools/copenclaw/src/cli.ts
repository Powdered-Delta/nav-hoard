#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import Parser from 'rss-parser';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import fetch from 'node-fetch';
import Ajv from 'ajv';

interface Source {
  id: string;
  name: string;
  type: 'rss' | 'html';
  url: string;
  selector?: HtmlSelectorConfig;
  priority?: number;
  enabled?: boolean;
  llm?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  };
}

interface Config {
  llm?: {
    provider?: string;
    apiKey?: string;
    endpoint?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    retries?: number;
  };
}

interface NavEntry {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
  confidence?: number;
}

interface OutputPayload {
  version: string;
  updated_at: string;
  entries: NavEntry[];
}

interface ManifestPayload {
  version: string;
  updated_at: string;
  total: number;
  groups: string[];
}

interface CliOptions {
  sources: string;
  config: string;
  output: string;
  pr?: boolean;
  dryRun?: boolean;
  base: string;
}

interface FetchStats {
  sourceId: string;
  fetched: number;
  accepted: number;
  invalid: number;
  warnings: string[];
}

interface ValidationResult {
  entries: NavEntry[];
  invalidCount: number;
  invalidMessages: string[];
}

interface MergeResult {
  entries: NavEntry[];
  duplicateCount: number;
}

interface WriteSummary {
  mode: 'single' | 'sharded';
  files: string[];
}

type HtmlSelectorConfig = {
  item: string;
  title?: string;
  link?: string;
  content?: string;
  summary?: string;
  date?: string;
  tags?: string;
};

const DATA_VERSION = '0.2';
const SHARD_THRESHOLD = 500;
const MAX_TITLE_LENGTH = 120;
const MAX_SUMMARY_LENGTH = 300;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 20;
const SUMMARY_FALLBACK = '暂无摘要';

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
    confidence: { type: 'number', minimum: 0, maximum: 1, nullable: true }
  },
  required: ['id', 'url', 'title', 'summary', 'tags', 'source', 'created_at', 'updated_at'],
  additionalProperties: false
});

const program = new Command();

program
  .name('copenclaw')
  .description('Nav Hoard data update tool')
  .version('0.1.0')
  .option('--sources <path>', 'Path to sources.yaml', 'data/sources.yaml')
  .option('--config <path>', 'Path to config.yaml', 'data/config.yaml')
  .option('--output <path>', 'Output data file', 'public/data/index.json')
  .option('--pr', 'Create a pull request (not implemented)')
  .option('--dry-run', 'Do not write files, just print stats')
  .option('--base <branch>', 'Base branch for PR', 'main')
  .action(async (options: CliOptions) => {
    try {
      const configPath = path.resolve(options.config);
      const sourcesPath = path.resolve(options.sources);
      const outputPath = path.resolve(options.output);

      if (!fs.existsSync(configPath)) {
        console.error(`Config file not found: ${configPath}`);
        process.exit(1);
      }

      if (!fs.existsSync(sourcesPath)) {
        console.error(`Sources file not found: ${sourcesPath}`);
        process.exit(1);
      }

      const config = loadConfig(configPath);
      const sources = loadSources(sourcesPath);
      const enabledSources = sources.filter(source => source.enabled !== false);

      console.log(`Loaded ${enabledSources.length} enabled sources.`);
      if (config.llm?.provider) {
        console.log(`LLM provider configured: ${config.llm.provider} (deterministic enrichment active).`);
      }

      const collectedEntries: NavEntry[] = [];
      const fetchStats: FetchStats[] = [];

      for (const source of enabledSources) {
        console.log(`Fetching ${source.name} (${source.type})...`);
        const stats: FetchStats = {
          sourceId: source.id,
          fetched: 0,
          accepted: 0,
          invalid: 0,
          warnings: []
        };

        try {
          const rawEntries = source.type === 'rss'
            ? await fetchRssSource(source)
            : await fetchHtmlSource(source);

          stats.fetched = rawEntries.length;
          const normalizedEntries = rawEntries
            .map(entry => normalizeEntry(entry, source))
            .filter((entry): entry is NavEntry => Boolean(entry));

          stats.accepted = normalizedEntries.length;
          stats.invalid = stats.fetched - stats.accepted;
          collectedEntries.push(...normalizedEntries);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          stats.warnings.push(message);
          console.error(`  Failed to fetch ${source.url}: ${message}`);
        }

        fetchStats.push(stats);
        console.log(`  fetched=${stats.fetched} accepted=${stats.accepted} invalid=${stats.invalid}`);
      }

      const existingEntries = loadExistingEntries(outputPath);
      const merged = mergeEntries(existingEntries, collectedEntries);
      const validated = validateEntries(merged.entries);
      const sortedEntries = [...validated.entries].sort(
        (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
      );

      const nextMode: WriteSummary['mode'] = sortedEntries.length > SHARD_THRESHOLD ? 'sharded' : 'single';
      if (options.dryRun) {
        printSummary({
          fetchStats,
          duplicateCount: merged.duplicateCount,
          invalidCount: validated.invalidCount,
          invalidMessages: validated.invalidMessages,
          total: sortedEntries.length,
          mode: nextMode,
          outputPath,
          writtenFiles: []
        });
      } else {
        const writeSummary = writeOutputs(outputPath, sortedEntries);
        printSummary({
          fetchStats,
          duplicateCount: merged.duplicateCount,
          invalidCount: validated.invalidCount,
          invalidMessages: validated.invalidMessages,
          total: sortedEntries.length,
          mode: writeSummary.mode,
          outputPath,
          writtenFiles: writeSummary.files
        });
      }

      if (options.pr) {
        console.log(`PR creation is not implemented yet. Please commit the generated files and open a PR against ${options.base}.`);
      }
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  });

program.parse();

function loadConfig(configPath: string): Config {
  return yaml.parse(fs.readFileSync(configPath, 'utf-8')) as Config;
}

function loadSources(sourcesPath: string): Source[] {
  const parsed = yaml.parse(fs.readFileSync(sourcesPath, 'utf-8')) as { sources?: Source[] };
  if (!Array.isArray(parsed.sources)) {
    throw new Error('sources.yaml must contain a top-level sources array.');
  }
  return parsed.sources.filter(source => source && source.id && source.url);
}

async function fetchRssSource(source: Source): Promise<NavEntry[]> {
  const parser = new Parser();
  const feed = await parser.parseURL(source.url);
  return feed.items.map(item => ({
    id: '',
    url: item.link || '',
    title: item.title || '',
    summary: item.contentSnippet || item.content || item.summary || '',
    tags: Array.isArray(item.categories) ? item.categories : [],
    source: source.name,
    created_at: item.isoDate || new Date().toISOString(),
    updated_at: item.isoDate || new Date().toISOString(),
    confidence: 0.8
  }));
}

async function fetchHtmlSource(source: Source): Promise<NavEntry[]> {
  if (!source.selector?.item) {
    throw new Error(`HTML source ${source.id} is missing selector.item`);
  }

  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = load(html);
  const entries: NavEntry[] = [];

  $(source.selector.item).each((_, element) => {
    const node = $(element);
    const url = extractField(node, source.selector?.link) || extractField(node, 'a@href');
    const title = extractField(node, source.selector?.title) || extractField(node, 'a');
    const summary = extractField(node, source.selector?.summary) || extractField(node, source.selector?.content);
    const tags = extractTags(node, source.selector?.tags);
    const date = extractField(node, source.selector?.date);

    entries.push({
      id: '',
      url: toAbsoluteUrl(url, source.url),
      title,
      summary,
      tags,
      source: source.name,
      created_at: toIsoDate(date),
      updated_at: toIsoDate(date),
      confidence: 0.7
    });
  });

  return entries;
}

function normalizeEntry(entry: NavEntry, source: Source): NavEntry | null {
  const normalizedUrl = normalizeUrl(entry.url);
  if (!normalizedUrl) {
    return null;
  }

  const cleanedTitle = truncate(cleanText(entry.title), MAX_TITLE_LENGTH);
  const cleanedSummary = truncate(cleanText(entry.summary), MAX_SUMMARY_LENGTH);
  const sourceLabel = deriveSourceLabel(normalizedUrl, source);
  const tags = inferTags(cleanedTitle, cleanedSummary, entry.tags).slice(0, MAX_TAGS);

  const finalEntry: NavEntry = {
    id: idFromUrl(normalizedUrl),
    url: normalizedUrl,
    title: cleanedTitle || truncate(source.name, MAX_TITLE_LENGTH),
    summary: cleanedSummary || generateSummary(cleanedTitle, normalizedUrl),
    tags,
    source: sourceLabel,
    created_at: toIsoDate(entry.created_at),
    updated_at: toIsoDate(entry.updated_at),
    confidence: typeof entry.confidence === 'number' ? Math.max(0, Math.min(1, entry.confidence)) : 0.7
  };

  if (!finalEntry.title || !finalEntry.summary) {
    return null;
  }

  return finalEntry;
}

function validateEntries(entries: NavEntry[]): ValidationResult {
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

function mergeEntries(existing: NavEntry[], incoming: NavEntry[]): MergeResult {
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
        confidence: Math.max(current.confidence ?? 0, entry.confidence ?? 0)
      });
    } else {
      mergedMap.set(entry.id, {
        ...current,
        tags: mergedTags,
        confidence: Math.max(current.confidence ?? 0, entry.confidence ?? 0)
      });
    }
  }

  return {
    entries: Array.from(mergedMap.values()),
    duplicateCount
  };
}

function loadExistingEntries(outputPath: string): NavEntry[] {
  const outputDir = path.dirname(outputPath);
  const manifestPath = path.join(outputDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ManifestPayload;
      if (Array.isArray(manifest.groups)) {
        return manifest.groups.flatMap(group => {
          const shardPath = path.join(outputDir, `index-${group}.json`);
          if (!fs.existsSync(shardPath)) {
            return [];
          }
          return readEntryPayload(shardPath);
        });
      }
    } catch (error) {
      console.warn(`Failed to parse existing manifest: ${manifestPath}`, error);
    }
  }

  if (fs.existsSync(outputPath)) {
    return readEntryPayload(outputPath);
  }

  return [];
}

function readEntryPayload(filePath: string): NavEntry[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as OutputPayload | NavEntry[];
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

function writeOutputs(outputPath: string, entries: NavEntry[]): WriteSummary {
  const outputDir = path.dirname(outputPath);
  ensureDir(outputDir);
  cleanupGeneratedFiles(outputDir);

  if (entries.length > SHARD_THRESHOLD) {
    const updatedAt = new Date().toISOString();
    const groupedEntries = groupEntries(entries);
    const files: string[] = [];
    const groups = Array.from(groupedEntries.keys()).sort();

    for (const group of groups) {
      const shardPath = path.join(outputDir, `index-${group}.json`);
      const payload: OutputPayload = {
        version: DATA_VERSION,
        updated_at: updatedAt,
        entries: groupedEntries.get(group) || []
      };
      fs.writeFileSync(shardPath, JSON.stringify(payload, null, 2), 'utf-8');
      files.push(shardPath);
    }

    const manifestPath = path.join(outputDir, 'manifest.json');
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

  const payload: OutputPayload = {
    version: DATA_VERSION,
    updated_at: new Date().toISOString(),
    entries
  };
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  return { mode: 'single', files: [outputPath] };
}

function cleanupGeneratedFiles(outputDir: string) {
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
  if (/[a-z]/.test(first)) {
    return first;
  }
  if (/[0-9]/.test(first)) {
    return '0-9';
  }
  return 'misc';
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
    confidence: typeof entry.confidence === 'number' ? entry.confidence : 1
  };
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

function deriveSourceLabel(normalizedUrl: string, source: Source): string {
  try {
    return new URL(normalizedUrl).hostname;
  } catch {
    return source.name || source.id;
  }
}

function extractField(node: ReturnType<typeof load>['prototype'], selector?: string): string {
  if (!selector) {
    return '';
  }

  const selectorText = selector.trim();
  if (!selectorText) {
    return '';
  }

  const atIndex = selectorText.lastIndexOf('@');
  const hasAttr = atIndex > 0;
  const cssSelector = hasAttr ? selectorText.slice(0, atIndex) : selectorText;
  const attrName = hasAttr ? selectorText.slice(atIndex + 1) : '';
  const target = cssSelector ? node.find(cssSelector).first() : node;

  if (target.length === 0) {
    return '';
  }

  if (!attrName || attrName === 'text') {
    return cleanText(target.text());
  }

  return cleanText(target.attr(attrName) || '');
}

function extractTags(node: ReturnType<typeof load>['prototype'], selector?: string): string[] {
  const raw = extractField(node, selector);
  if (!raw) {
    return [];
  }
  return raw
    .split(/[、,，|/]/)
    .map(tag => truncate(cleanText(tag), MAX_TAG_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_TAGS);
}

function toAbsoluteUrl(rawUrl: string, baseUrl: string): string {
  if (!rawUrl) {
    return '';
  }
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return rawUrl;
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

function printSummary(input: {
  fetchStats: FetchStats[];
  duplicateCount: number;
  invalidCount: number;
  invalidMessages: string[];
  total: number;
  mode: 'single' | 'sharded';
  outputPath: string;
  writtenFiles: string[];
}) {
  console.log('--- Summary ---');
  for (const stat of input.fetchStats) {
    console.log(`${stat.sourceId}: fetched=${stat.fetched}, accepted=${stat.accepted}, invalid=${stat.invalid}`);
    for (const warning of stat.warnings) {
      console.warn(`  warning: ${warning}`);
    }
  }
  console.log(`duplicates merged: ${input.duplicateCount}`);
  console.log(`invalid dropped: ${input.invalidCount}`);
  console.log(`final entries: ${input.total}`);
  console.log(`output mode: ${input.mode}`);
  console.log(`target: ${input.outputPath}`);

  if (input.writtenFiles.length > 0) {
    console.log('written files:');
    for (const file of input.writtenFiles) {
      console.log(`- ${file}`);
    }
  } else {
    console.log('dry-run: no files were written');
  }

  if (input.invalidMessages.length > 0) {
    console.warn('invalid entry details:');
    for (const message of input.invalidMessages.slice(0, 10)) {
      console.warn(`- ${message}`);
    }
  }
}
