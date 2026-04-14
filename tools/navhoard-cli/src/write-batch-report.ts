import * as fs from 'fs';
import * as path from 'path';

const REPORT_VERSION = 1 as const;

export type BatchReportPayload = Record<string, unknown> & {
  kind: string;
  generated_at: string;
};

/** Writes a JSON report for batch pre-approval (e.g. dry-run) or post-run review. */
export function writeBatchReportJson(filePath: string, payload: BatchReportPayload): void {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const body = { report_version: REPORT_VERSION, ...payload };
  fs.writeFileSync(resolved, `${JSON.stringify(body, null, 2)}\n`, 'utf-8');
  console.log(`Report written: ${path.relative(process.cwd(), resolved) || resolved}`);
}
