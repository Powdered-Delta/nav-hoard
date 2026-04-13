#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import type { NavEntry } from '@nav-hoard/types';
import {
  DEFAULT_CANONICAL_DATA_FILE,
  loadExistingEntries,
  normalizeUrl,
  resolveDataPaths,
  sortEntries,
  validateEntries,
  writeOutputs
} from './pipeline.js';
import { stripPnpmArgvSeparators } from './strip-pnpm-argv.js';

async function readStdinText(): Promise<string> {
  if (process.stdin.isTTY) {
    return '';
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function parseUrlLines(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    out.push(trimmed);
  }
  return out;
}

function collectTargetUrls(options: {
  url?: string[];
  urlsFrom?: string;
  stdin?: boolean;
  stdinText: string;
}): { urls: string[]; errors: string[] } {
  const errors: string[] = [];
  const urls: string[] = [];

  for (const u of options.url || []) {
    if (u.trim()) {
      urls.push(u.trim());
    }
  }

  if (options.urlsFrom) {
    const filePath = path.resolve(options.urlsFrom);
    if (!fs.existsSync(filePath)) {
      errors.push(`urls file not found: ${filePath}`);
    } else {
      urls.push(...parseUrlLines(fs.readFileSync(filePath, 'utf8')));
    }
  }

  if (options.stdin) {
    urls.push(...parseUrlLines(options.stdinText));
  }

  return { urls, errors };
}

function normalizeTargetKey(raw: string): string | null {
  const key = normalizeUrl(raw);
  return key || null;
}

function run(): void {
  const argv = stripPnpmArgvSeparators(process.argv);

  const program = new Command();

  program
    .name('navhoard-entries-remove')
    .description('Remove Nav Hoard entries by URL (matches pipeline URL normalization)')
    .version('0.1.0')
    .option('-o, --output <path>', 'Canonical data file path', DEFAULT_CANONICAL_DATA_FILE)
    .option('--url <url>', 'Target URL (repeatable)', (value: string, previous: string[]) => {
      return previous.concat([value]);
    }, [] as string[])
    .option('--urls-from <path>', 'Text file: one URL per line, # starts a comment')
    .option('--stdin', 'Read additional URLs from stdin (non-TTY pipes)')
    .option('--write', 'Apply removals to data/index.json and public/data (default is dry-run)')
    .action(async (options: {
      output: string;
      url: string[];
      urlsFrom?: string;
      stdin?: boolean;
      write?: boolean;
    }) => {
      const stdinText = options.stdin ? await readStdinText() : '';
      const { urls: rawTargets, errors } = collectTargetUrls({
        url: options.url,
        urlsFrom: options.urlsFrom,
        stdin: options.stdin,
        stdinText
      });

      if (errors.length > 0) {
        for (const message of errors) {
          console.error(message);
        }
        process.exit(1);
      }

      if (rawTargets.length === 0) {
        console.error('No target URLs. Use --url, --urls-from, and/or pipe lines with --stdin.');
        program.help({ error: true });
      }

      const targetKeys = new Map<string, string>();
      const badTargets: string[] = [];
      for (const raw of rawTargets) {
        const key = normalizeTargetKey(raw);
        if (!key) {
          badTargets.push(raw);
          continue;
        }
        if (!targetKeys.has(key)) {
          targetKeys.set(key, raw);
        }
      }

      if (badTargets.length > 0) {
        console.error('Invalid or unparsable URLs (skipped):');
        for (const u of badTargets) {
          console.error(`- ${u}`);
        }
        process.exit(1);
      }

      const dataPaths = resolveDataPaths(options.output);
      const existing = loadExistingEntries(dataPaths);
      const removeKeys = new Set(targetKeys.keys());

      const matched: NavEntry[] = [];
      const kept: NavEntry[] = [];

      for (const entry of existing) {
        const entryKey = normalizeUrl(entry.url) || entry.url;
        if (removeKeys.has(entryKey)) {
          matched.push(entry);
        } else {
          kept.push(entry);
        }
      }

      const matchedKeys = new Set(matched.map((e) => normalizeUrl(e.url) || e.url));
      const unmatchedTargets: string[] = [];
      for (const [key, label] of targetKeys) {
        if (!matchedKeys.has(key)) {
          unmatchedTargets.push(label);
        }
      }

      console.log('--- entries-remove plan ---');
      console.log(`targets (unique): ${targetKeys.size}`);
      console.log(`matched entries: ${matched.length}`);
      console.log(`remaining entries: ${kept.length}`);

      if (matched.length > 0) {
        console.log('will remove:');
        for (const entry of matched) {
          console.log(`- ${entry.url}`);
          console.log(`  id=${entry.id} title=${entry.title}`);
        }
      }

      if (unmatchedTargets.length > 0) {
        console.log('no matching entry (check spelling or trailing slash):');
        for (const u of unmatchedTargets) {
          console.log(`- ${u}`);
        }
      }

      if (!options.write) {
        console.log('--- dry-run: no files written (pass --write to apply) ---');
        process.exit(unmatchedTargets.length > 0 ? 2 : 0);
      }

      if (matched.length === 0) {
        console.error('Nothing to remove; aborting write.');
        process.exit(1);
      }

      const validated = validateEntries(sortEntries(kept));
      if (validated.invalidCount > 0) {
        console.error('Remaining data failed validation after removal:');
        for (const message of validated.invalidMessages) {
          console.error(`- ${message}`);
        }
        process.exit(1);
      }

      const writeSummary = writeOutputs(dataPaths, validated.entries);
      console.log('--- write complete ---');
      console.log(`output mode: ${writeSummary.mode}`);
      for (const file of writeSummary.files) {
        console.log(`- ${file}`);
      }
      process.exit(unmatchedTargets.length > 0 ? 2 : 0);
    });

  void program.parseAsync(argv).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}

run();
