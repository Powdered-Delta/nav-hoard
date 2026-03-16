import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import fetch from 'node-fetch';
import * as yaml from 'yaml';
import { CaptureDraftResult, DEFAULT_CANONICAL_DATA_FILE, EntryDraft, PROJECT_ROOT, captureDraft, mergeDraftEntries } from './pipeline.js';

interface RaindropRow {
  id?: string;
  title?: string;
  note?: string;
  excerpt?: string;
  url?: string;
  tags?: string;
  created?: string;
  cover?: string;
  highlights?: string;
  favorite?: string;
}

interface LlmConfig {
  provider?: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  wireApi?: string;
  wire_api?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
}

interface AppConfig {
  llm?: LlmConfig;
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('navhoard-import-raindrop')
    .description('Import Raindrop.io CSV export into Nav Hoard canonical data')
    .option('-i, --input <path>', 'path to Raindrop export CSV or export directory', path.join('export', 'export.csv'))
    .option('-o, --output <path>', 'canonical output path', DEFAULT_CANONICAL_DATA_FILE)
    .option('-c, --config <path>', 'path to config.yaml', path.join('data', 'config.yaml'))
    .option('--no-fetch', 'skip URL capture and import from CSV fields only')
    .option('--llm-enhance', 'use configured LLM to enhance tags after capture')
    .option('--featured-from-favorite', 'map Raindrop favorite=true to featured=true', false)
    .parse(process.argv);

  const options = program.opts<{
    input: string;
    output: string;
    config: string;
    fetch: boolean;
    llmEnhance: boolean;
    featuredFromFavorite: boolean;
  }>();

  const inputPath = resolveCsvInput(options.input);
  const outputPath = resolveRepoPath(options.output);
  const config = options.llmEnhance ? loadConfig(options.config) : {};
  const rawContent = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCsv(rawContent);
  const drafts = await buildDrafts(rows, options, config.llm);

  if (drafts.length === 0) {
    console.error(`No valid rows found in ${inputPath}`);
    process.exitCode = 1;
    return;
  }

  const result = mergeDraftEntries(drafts, outputPath);
  if (!result.ok) {
    console.error('Failed to import Raindrop export:');
    for (const message of result.invalidMessages) {
      console.error(`- ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  const capturedCount = drafts.filter(draft => draft.confidence === 0.8).length;
  const llmEnhancedCount = drafts.filter(draft => draft.confidence === 0.86).length;
  const previewCount = drafts.filter(draft => Boolean(draft.preview?.src)).length;
  const featuredCount = drafts.filter(draft => draft.featured === true).length;

  console.log(`Imported ${drafts.length} entries from ${path.relative(process.cwd(), inputPath) || inputPath}`);
  console.log(`Captured successfully: ${capturedCount}`);
  console.log(`LLM enhanced: ${llmEnhancedCount}`);
  console.log(`Merged total: ${result.total}`);
  console.log(`Duplicates merged: ${result.duplicateCount}`);
  console.log(`Preview images mapped: ${previewCount}`);
  console.log(`Featured mapped: ${featuredCount}`);
  console.log(`Canonical data: ${result.outputPath}`);
  console.log('Written files:');
  for (const file of result.writtenFiles) {
    console.log(`- ${file}`);
  }
}

async function buildDrafts(
  rows: Array<Record<string, string>>,
  options: {
    fetch: boolean;
    llmEnhance: boolean;
    featuredFromFavorite: boolean;
  },
  llmConfig?: LlmConfig
): Promise<EntryDraft[]> {
  const drafts: EntryDraft[] = [];
  const llmEnabled = options.llmEnhance && isLlmConfigured(llmConfig);

  if (options.llmEnhance && !llmEnabled) {
    console.warn('LLM enhancement requested, but config/apiKey is missing. Falling back to non-LLM import.');
  }

  for (const row of rows) {
    const baseDraft = mapRowToDraft(row, options.featuredFromFavorite);
    if (!baseDraft) {
      continue;
    }

    if (!options.fetch) {
      drafts.push(baseDraft);
      continue;
    }

    const captured = await safeCapture(baseDraft.url, baseDraft.source);
    const mergedDraft = mergeCapturedDraft(baseDraft, captured);
    if (!llmEnabled) {
      drafts.push(mergedDraft);
      continue;
    }

    drafts.push(await enhanceDraftWithLlm(mergedDraft, llmConfig as LlmConfig));
  }

  return drafts;
}

function loadConfig(configPath: string): AppConfig {
  const resolvedPath = resolveRepoPath(configPath);
  if (!fs.existsSync(resolvedPath)) {
    return {};
  }

  const parsed = yaml.parse(fs.readFileSync(resolvedPath, 'utf-8')) as AppConfig | null;
  if (!parsed || typeof parsed !== 'object') {
    return {};
  }

  return {
    ...parsed,
    llm: parsed.llm ? {
      ...parsed.llm,
      apiKey: resolveEnvPlaceholder(parsed.llm.apiKey)
    } : undefined
  };
}

function resolveEnvPlaceholder(value?: string): string {
  const rawValue = cleanCell(value);
  const match = rawValue.match(/^\$\{([A-Z0-9_]+)\}$/i);
  if (!match) {
    return rawValue;
  }
  return cleanCell(process.env[match[1]]);
}

function isLlmConfigured(config?: LlmConfig): boolean {
  return Boolean(
    cleanCell(config?.provider)
    && cleanCell(config?.endpoint)
    && cleanCell(config?.model)
    && cleanCell(config?.apiKey)
  );
}

function resolveCsvInput(inputPath: string): string {
  const resolved = resolveRepoPath(inputPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Input path not found: ${resolved}`);
  }

  const stats = fs.statSync(resolved);
  if (stats.isDirectory()) {
    const csvPath = path.join(resolved, 'export.csv');
    if (fs.existsSync(csvPath)) {
      return csvPath;
    }
    throw new Error(`No export.csv found in directory: ${resolved}`);
  }

  return resolved;
}

function resolveRepoPath(inputPath: string): string {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  return path.resolve(PROJECT_ROOT, inputPath);
}

function mapRowToDraft(row: Record<string, string>, featuredFromFavorite: boolean): EntryDraft | null {
  const typed = row as RaindropRow;
  const url = cleanCell(typed.url);
  if (!url) {
    return null;
  }

  const title = cleanCell(typed.title);
  const note = cleanCell(typed.note);
  const excerpt = cleanCell(typed.excerpt);
  const created = cleanCell(typed.created);
  const cover = cleanCell(typed.cover);
  const source = deriveHostname(url);
  const tags = splitTags(typed.tags);
  const summary = note || excerpt || '';
  const createdAt = created || new Date().toISOString();
  const featured = featuredFromFavorite ? parseBoolean(typed.favorite) : undefined;

  return {
    url,
    title: title || source || url,
    summary,
    tags,
    source,
    created_at: createdAt,
    updated_at: createdAt,
    confidence: 0.95,
    featured,
    preview: cover ? {
      enabled: true,
      mode: 'external',
      src: cover,
      alt: title || undefined
    } : undefined
  };
}

async function safeCapture(url: string, source: string): Promise<CaptureDraftResult | null> {
  try {
    return await captureDraft(url, { source });
  } catch {
    return null;
  }
}

async function enhanceDraftWithLlm(draft: EntryDraft, config: LlmConfig): Promise<EntryDraft> {
  try {
    const suggestedTags = await requestLlmTags(draft, config);
    if (suggestedTags.length === 0) {
      return draft;
    }

    return {
      ...draft,
      tags: mergeTags(draft.tags, suggestedTags),
      confidence: 0.86
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`LLM enhancement skipped for ${draft.url}: ${message}`);
    return draft;
  }
}

async function requestLlmTags(draft: EntryDraft, config: LlmConfig): Promise<string[]> {
  const wireApi = resolveWireApi(config);
  const endpoint = resolveLlmEndpoint(config.endpoint, wireApi);
  const apiKey = cleanCell(config.apiKey);
  const model = cleanCell(config.model);
  const timeout = Math.max(Number(config.timeout || 30000), 1000);
  const temperature = typeof config.temperature === 'number' ? config.temperature : 0.2;
  const maxTokens = typeof config.maxTokens === 'number' ? config.maxTokens : 160;
  const retries = Math.max(Number(config.retries || 1), 1);

  const messages = [
    {
      role: 'system',
      content: 'You generate concise website tags. Return only JSON like {"tags":["标签1","标签2"]}. Keep 1 to 5 tags. Each tag must be within 20 characters. Prefer Chinese tags when suitable. Preserve useful technical proper nouns.'
    },
    {
      role: 'user',
      content: JSON.stringify({
        url: draft.url,
        title: draft.title,
        summary: draft.summary,
        source: draft.source,
        existing_tags: draft.tags
      })
    }
  ];

  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = wireApi === 'responses'
        ? await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model,
              temperature,
              max_output_tokens: maxTokens,
              input: [
                {
                  role: 'system',
                  content: messages[0].content
                },
                {
                  role: 'user',
                  content: messages[1].content
                }
              ]
            }),
            signal: controller.signal
          })
        : await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model,
              temperature,
              max_tokens: maxTokens,
              messages,
              response_format: { type: 'json_object' }
            }),
            signal: controller.signal
          });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const payload = await response.json() as Record<string, unknown>;
      const content = wireApi === 'responses'
        ? extractResponsesText(payload)
        : extractChatCompletionsText(payload);
      return parseLlmTags(content);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function resolveWireApi(config: LlmConfig): 'chat_completions' | 'responses' {
  const rawValue = cleanCell(config.wireApi || config.wire_api).toLowerCase();
  return rawValue === 'responses' ? 'responses' : 'chat_completions';
}

function resolveLlmEndpoint(rawEndpoint?: string, wireApi: 'chat_completions' | 'responses' = 'chat_completions'): string {
  const endpoint = cleanCell(rawEndpoint);
  if (!endpoint) {
    return '';
  }

  if (/\/chat\/completions$/i.test(endpoint) || /\/responses$/i.test(endpoint)) {
    return endpoint;
  }

  if (/\/v1\/?$/i.test(endpoint)) {
    return wireApi === 'responses'
      ? `${endpoint.replace(/\/+$/, '')}/responses`
      : `${endpoint.replace(/\/+$/, '')}/chat/completions`;
  }

  try {
    const url = new URL(endpoint);
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = wireApi === 'responses' ? '/v1/responses' : '/v1/chat/completions';
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    return endpoint;
  }

  return endpoint;
}

function extractChatCompletionsText(payload: Record<string, unknown>): string {
  const typed = payload as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  return cleanCell(typed.choices?.[0]?.message?.content);
}

function extractResponsesText(payload: Record<string, unknown>): string {
  const typed = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
  };

  if (cleanCell(typed.output_text)) {
    return cleanCell(typed.output_text);
  }

  for (const item of typed.output || []) {
    for (const content of item.content || []) {
      if (cleanCell(content.text)) {
        return cleanCell(content.text);
      }
    }
  }

  return '';
}

function parseLlmTags(content: string): string[] {
  if (!content) {
    return [];
  }

  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned) as { tags?: unknown };
  if (!Array.isArray(parsed.tags)) {
    return [];
  }

  return parsed.tags
    .map(tag => cleanCell(String(tag)))
    .filter(Boolean);
}

function mergeCapturedDraft(baseDraft: EntryDraft, captured: CaptureDraftResult | null): EntryDraft {
  if (!captured || captured.status === 'failed') {
    return baseDraft;
  }

  const capturedDraft = captured.draft;
  return {
    ...baseDraft,
    url: captured.normalizedUrl || baseDraft.url,
    title: cleanCell(capturedDraft.title) || baseDraft.title,
    summary: cleanCell(capturedDraft.summary) || baseDraft.summary,
    tags: mergeTags(baseDraft.tags, capturedDraft.tags),
    source: cleanCell(capturedDraft.source) || baseDraft.source,
    updated_at: baseDraft.updated_at,
    confidence: captured.status === 'success' ? 0.8 : 0.7,
    preview: capturedDraft.preview ?? baseDraft.preview
  };
}

function splitTags(rawTags?: string): string[] {
  return cleanCell(rawTags)
    .split(',')
    .map(tag => cleanCell(tag))
    .filter(Boolean);
}

function parseBoolean(rawValue?: string): boolean {
  return cleanCell(rawValue).toLowerCase() === 'true';
}

function deriveHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

function cleanCell(value?: string): string {
  return String(value || '').replace(/\uFEFF/g, '').trim();
}

function mergeTags(existingTags: string[], capturedTags?: string[]): string[] {
  return Array.from(new Set([...(existingTags || []), ...((capturedTags || []).map(tag => cleanCell(tag)).filter(Boolean))])).slice(0, 5);
}

function parseCsv(content: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let index = 0;
  let inQuotes = false;

  while (index < content.length) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        index += 2;
        continue;
      }

      inQuotes = !inQuotes;
      index += 1;
      continue;
    }

    if (!inQuotes && char === ',') {
      currentRow.push(currentCell);
      currentCell = '';
      index += 1;
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      currentRow.push(currentCell);
      currentCell = '';
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];

      if (char === '\r' && next === '\n') {
        index += 2;
      } else {
        index += 1;
      }
      continue;
    }

    currentCell += char;
    index += 1;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map(header => cleanCell(header));

  return dataRows.map(row => {
    const record: Record<string, string> = {};
    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      record[headers[columnIndex]] = row[columnIndex] ?? '';
    }
    return record;
  });
}

void main();
