import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { inspect } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import {
  DEFAULT_CANONICAL_DATA_FILE,
  PROJECT_ROOT,
  captureDraft,
  loadExistingEntries,
  replaceDraftEntries,
  resolveDataPaths,
  type EntryDraft
} from './pipeline.js';
import { EDITOR_HTML } from './editor-html.js';

interface SavePayload {
  entries?: EntryDraft[];
}

interface CapturePayload {
  url?: string;
}

interface ImageUploadPayload {
  filename?: string;
  contentType?: string;
  dataUrl?: string;
}

const cliOptions = parseCliArgs(process.argv.slice(2));
const port = normalizePort(cliOptions.port ?? process.env.NAVHOARD_EDIT_PORT) ?? 3210;
const host = cliOptions.host || process.env.NAVHOARD_EDIT_HOST || '127.0.0.1';
const outputPath = DEFAULT_CANONICAL_DATA_FILE;
const serverInstanceId = `${process.pid}-${Date.now()}`;
const liveReloadClients = new Set<ServerResponse>();
const editorSourceDir = path.join(PROJECT_ROOT, 'tools', 'navhoard-cli', 'src');
const nodeModulesRoot = path.join(PROJECT_ROOT, 'node_modules');

setupLiveReloadWatchers();

const server = createServer(async (request, response) => {
  try {
    await routeRequest(request, response);
  } catch (error) {
    sendJson(response, 500, {
      error: 'internal_error',
      message: getErrorMessage(error)
    });
  }
});

server.listen(port, host, () => {
  const dataPaths = resolveDataPaths(outputPath);
  console.log('[navhoard-editor] Local editor ready');
  console.log(`[navhoard-editor] URL: http://${host}:${port}`);
  if (host === '0.0.0.0') {
    console.log(`[navhoard-editor] LAN access enabled. Use your machine IP with port ${port}.`);
  }
  console.log(`[navhoard-editor] Canonical data: ${dataPaths.canonicalFile}`);
  console.log('[navhoard-editor] Press Ctrl+C to stop');
});

async function routeRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const method = request.method || 'GET';
  const url = new URL(request.url || '/', `http://${host}:${port}`);

  if (method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    sendHtml(response, 200, EDITOR_HTML);
    return;
  }

  if (method === 'GET' && url.pathname === '/nav-hoard.base.css') {
    sendBaseCss(response);
    return;
  }

  if (method === 'GET' && url.pathname === '/nav-hoard.custom.css') {
    sendCustomCss(response, outputPath);
    return;
  }

  if (method === 'GET' && url.pathname === '/editor-app.js') {
    sendEditorModule(response, 'editor-app.ts');
    return;
  }

  if (method === 'GET' && url.pathname === '/__shared/nav-hoard-i18n.js') {
    sendSharedModule(response, path.join(PROJECT_ROOT, 'src', 'nav-hoard-i18n.ts'));
    return;
  }

  if (method === 'GET' && url.pathname.startsWith('/__modules/')) {
    sendNodeModuleFile(response, url.pathname);
    return;
  }

  if (method === 'GET' && url.pathname === '/__live') {
    openLiveReloadStream(request, response);
    return;
  }

  if (method === 'GET' && url.pathname === '/api/entries') {
    const dataPaths = resolveDataPaths(outputPath);
    const entries = loadExistingEntries(dataPaths);
    sendJson(response, 200, {
      entries,
      canonicalFile: dataPaths.canonicalFile
    });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/save') {
    const payload = await readJsonBody<SavePayload>(request);
    const entries = Array.isArray(payload.entries) ? payload.entries : [];
    const result = replaceDraftEntries(entries, outputPath);

    if (!result.ok) {
      sendJson(response, 400, result);
      return;
    }

    sendJson(response, 200, result);
    return;
  }

  if (method === 'POST' && url.pathname === '/api/capture') {
    const payload = await readJsonBody<CapturePayload>(request);
    const targetUrl = String(payload.url || '').trim();

    if (!targetUrl) {
      sendJson(response, 400, {
        error: 'invalid_request',
        message: 'url is required'
      });
      return;
    }

    const result = await captureDraft(targetUrl);
    sendJson(response, 200, result);
    return;
  }

  if (method === 'POST' && url.pathname === '/api/upload-image') {
    const payload = await readJsonBody<ImageUploadPayload>(request);
    sendJson(response, 200, saveUploadedImage(payload));
    return;
  }

  if (method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true, serverInstanceId });
    return;
  }

  sendJson(response, 404, {
    error: 'not_found',
    path: url.pathname
  });
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const raw = await readBody(request);
  if (!raw.trim()) {
    return {} as T;
  }
  return JSON.parse(raw) as T;
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks).toString('utf8');
}

function sendHtml(response: ServerResponse, statusCode: number, html: string): void {
  response.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(html);
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendCustomCss(response: ServerResponse, targetOutputPath: string): void {
  const dataPaths = resolveDataPaths(targetOutputPath);
  const publicRoot = path.dirname(dataPaths.publishDir);
  const filePath = path.join(publicRoot, 'nav-hoard.custom.css');

  if (!fs.existsSync(filePath)) {
    response.writeHead(200, {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    response.end('');
    return;
  }

  response.writeHead(200, {
    'Content-Type': 'text/css; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(fs.readFileSync(filePath, 'utf8'));
}

function sendBaseCss(response: ServerResponse): void {
  const filePath = path.join(PROJECT_ROOT, 'src', 'styles-base.css');

  response.writeHead(200, {
    'Content-Type': 'text/css; charset=utf-8',
    'Cache-Control': 'no-store'
  });

  if (!fs.existsSync(filePath)) {
    response.end('');
    return;
  }

  response.end(fs.readFileSync(filePath, 'utf8'));
}

function sendEditorModule(response: ServerResponse, filename: string): void {
  const filePath = path.join(editorSourceDir, filename);

  sendSharedModule(response, filePath);
}

function sendSharedModule(response: ServerResponse, filePath: string): void {

  if (!fs.existsSync(filePath)) {
    sendJson(response, 404, {
      error: 'not_found',
      path: filePath
    });
    return;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2020
    },
    fileName: filePath
  });

  response.writeHead(200, {
    'Content-Type': 'text/javascript; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(result.outputText);
}

function sendNodeModuleFile(response: ServerResponse, requestPath: string): void {
  const relativePath = decodeURIComponent(requestPath.replace(/^\/__modules\//, ''));
  const filePath = path.resolve(nodeModulesRoot, relativePath);

  if (!filePath.startsWith(nodeModulesRoot + path.sep) && filePath !== nodeModulesRoot) {
    sendJson(response, 403, {
      error: 'forbidden',
      path: requestPath
    });
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(response, 404, {
      error: 'not_found',
      path: requestPath
    });
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentTypeFor(filePath),
    'Cache-Control': 'no-store'
  });
  response.end(fs.readFileSync(filePath));
}

function openLiveReloadStream(request: IncomingMessage, response: ServerResponse): void {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive'
  });
  response.write(`event: connected\ndata: ${serverInstanceId}\n\n`);
  liveReloadClients.add(response);

  const heartbeat = setInterval(() => {
    if (!response.writableEnded) {
      response.write(': heartbeat\n\n');
    }
  }, 15000);

  request.on('close', () => {
    clearInterval(heartbeat);
    liveReloadClients.delete(response);
    if (!response.writableEnded) {
      response.end();
    }
  });
}

function setupLiveReloadWatchers(): void {
  const dataPaths = resolveDataPaths(outputPath);
  const watchedFiles = [
    path.join(PROJECT_ROOT, 'src', 'styles-base.css'),
    path.join(PROJECT_ROOT, 'src', 'nav-hoard-i18n.ts'),
    path.join(path.dirname(dataPaths.publishDir), 'nav-hoard.custom.css'),
    dataPaths.canonicalFile,
    path.join(editorSourceDir, 'editor-app.ts'),
    path.join(editorSourceDir, 'editor-html.ts')
  ];

  watchedFiles.forEach((filePath) => {
    const directory = path.dirname(filePath);
    const target = path.basename(filePath);

    if (!fs.existsSync(directory)) {
      return;
    }

    fs.watch(directory, (eventType, filename) => {
      if (!filename || String(filename) !== target) {
        return;
      }
      if (eventType !== 'change' && eventType !== 'rename') {
        return;
      }
      broadcastReload();
    });
  });
}

function broadcastReload(): void {
  liveReloadClients.forEach((response) => {
    if (response.writableEnded) {
      liveReloadClients.delete(response);
      return;
    }
    response.write('event: reload\ndata: now\n\n');
  });
}

function normalizePort(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return null;
  }

  return parsed;
}

function parseCliArgs(argv: string[]): { host?: string; port?: string } {
  const result: { host?: string; port?: string } = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--host' && next) {
      result.host = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--host=')) {
      result.host = arg.slice('--host='.length);
      continue;
    }

    if (arg === '--port' && next) {
      result.port = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--port=')) {
      result.port = arg.slice('--port='.length);
    }
  }

  return result;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return inspect(error);
}

function saveUploadedImage(payload: ImageUploadPayload): { src: string; mode: 'local'; enabled: true } {
  const dataUrl = String(payload.dataUrl || '').trim();
  const filename = String(payload.filename || 'preview').trim() || 'preview';
  const contentType = String(payload.contentType || '').trim();
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error('invalid image payload');
  }

  const mimeType = contentType || match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
    throw new Error('image must be between 1 byte and 5MB');
  }

  const extension = extensionFromMime(mimeType) || extensionFromFilename(filename) || 'png';
  const safeBase = filename
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'preview';

  const dataPaths = resolveDataPaths(outputPath);
  const publicRoot = path.dirname(dataPaths.publishDir);
  const assetDir = path.join(publicRoot, 'images', 'previews');
  fs.mkdirSync(assetDir, { recursive: true });

  const basename = `${Date.now()}-${safeBase}.${extension}`;
  fs.writeFileSync(path.join(assetDir, basename), buffer);

  return {
    enabled: true,
    mode: 'local',
    src: `images/previews/${basename}`
  };
}

function extensionFromMime(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized === 'image/jpeg') return 'jpg';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/gif') return 'gif';
  if (normalized === 'image/svg+xml') return 'svg';
  return '';
}

function extensionFromFilename(filename: string): string {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

function contentTypeFor(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.js' || extension === '.mjs') return 'text/javascript; charset=utf-8';
  if (extension === '.json' || extension === '.map') return 'application/json; charset=utf-8';
  if (extension === '.css') return 'text/css; charset=utf-8';
  if (extension === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}
