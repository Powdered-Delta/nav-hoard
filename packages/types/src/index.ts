/**
 * Shared Nav Hoard data shapes for the static site and tools/navhoard-cli.
 */

export type PreviewMode = 'auto' | 'external' | 'local';

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
  confidence?: number;
  featured?: boolean;
  featured_rank?: number;
  preview?: NavPreview;
  hide?: boolean;
}

export interface NavConfig {
  hidden_unlock_password?: string;
}

export interface OutputPayload {
  version: string;
  updated_at: string;
  entries: NavEntry[];
  config?: NavConfig;
}

export interface ManifestPayload {
  version: string;
  updated_at: string;
  total: number;
  groups: string[];
  config?: NavConfig;
}
