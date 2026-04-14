#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  DEFAULT_CANONICAL_DATA_FILE,
  captureDraft,
  confirmReviewedTemplate,
  formatReviewTemplate,
  parseReviewTemplate
} from './pipeline.js';
import { stripPnpmArgvSeparators } from './strip-pnpm-argv.js';

const program = new Command();

program
  .name('nav-hoard-entry-workflow')
  .description('Interactive single-entry workflow for NavHoard')
  .version('0.1.0');

program
  .command('capture')
  .description('Capture one URL and render a review template')
  .requiredOption('--url <url>', 'Target URL to capture')
  .option('--source <source>', 'Override source label')
  .option('--html-file <path>', 'Read HTML from a local file instead of fetching')
  .option('--write <path>', 'Write the rendered review template to a file')
  .action(async (options: {
    url: string;
    source?: string;
    htmlFile?: string;
    write?: string;
  }) => {
    const html = options.htmlFile
      ? fs.readFileSync(path.resolve(options.htmlFile), 'utf8')
      : undefined;

    const result = await captureDraft(options.url, {
      source: options.source,
      html
    });
    const template = formatReviewTemplate(result);

    if (options.write) {
      const filePath = path.resolve(options.write);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, template, 'utf8');
      console.log(`Review template written: ${filePath}`);
    } else {
      console.log(template);
    }

    console.log('--- Result ---');
    console.log(`status: ${result.status}`);
    console.log(`url: ${result.normalizedUrl || result.url}`);
    if (result.failureReason) {
      console.log(`failureReason: ${result.failureReason}`);
    }
    if (result.warnings.length > 0) {
      console.log(`warnings: ${result.warnings.join(' | ')}`);
    }
  });

program
  .command('parse')
  .description('Parse a user-edited review template without writing')
  .requiredOption('--template <path>', 'Template file path')
  .action((options: { template: string }) => {
    const templateText = fs.readFileSync(path.resolve(options.template), 'utf8');
    const parsed = parseReviewTemplate(templateText);
    console.log(JSON.stringify(parsed, null, 2));
    process.exit(parsed.ok ? 0 : 1);
  });

program
  .command('confirm')
  .description('Confirm a user-edited template and write the entry')
  .requiredOption('--template <path>', 'Template file path')
  .option('--output <path>', 'Canonical output path', DEFAULT_CANONICAL_DATA_FILE)
  .action((options: { template: string; output: string }) => {
    const templateText = fs.readFileSync(path.resolve(options.template), 'utf8');
    const result = confirmReviewedTemplate(templateText, options.output);

    if (!result.ok) {
      console.error('Failed to write reviewed entry.');
      for (const message of result.invalidMessages) {
        console.error(`- ${message}`);
      }
      process.exit(1);
    }

    console.log('Entry written successfully.');
    console.log(`target: ${result.outputPath}`);
    console.log(`total entries: ${result.total}`);
    console.log(`duplicates merged: ${result.duplicateCount}`);
    console.log(`output mode: ${result.mode}`);
    console.log('written files:');
    for (const file of result.writtenFiles) {
      console.log(`- ${file}`);
    }
    console.log('Next steps:');
    console.log('- Run `pnpm run dev` to verify locally');
    console.log('- If everything looks good, commit and push to trigger deployment');
  });

void program.parseAsync(stripPnpmArgvSeparators(process.argv));
