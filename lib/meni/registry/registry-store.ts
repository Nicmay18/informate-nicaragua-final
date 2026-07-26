/**
 * MENI OS v3.0 — Registry Store
 * Persistencia del registro: fuente oficial en data/meni y caché en public/data.
 */

import fs from 'fs';
import path from 'path';
import type { MeniRegistry } from './registry-types';

const DATA_DIR = 'data/meni';
const HISTORY_DIR = 'data/meni/history';
const PUBLIC_CACHE = 'public/data/meni-registry.json';

function ensureDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function getRegistryPaths(root: string): {
  registryJson: string;
  historyDir: string;
  publicCache: string;
} {
  return {
    registryJson: path.join(root, DATA_DIR, 'registry.json'),
    historyDir: path.join(root, HISTORY_DIR),
    publicCache: path.join(root, PUBLIC_CACHE),
  };
}

export function loadRegistry(root: string): MeniRegistry | null {
  const { registryJson } = getRegistryPaths(root);
  if (!fs.existsSync(registryJson)) return null;
  try {
    return JSON.parse(fs.readFileSync(registryJson, 'utf-8')) as MeniRegistry;
  } catch {
    return null;
  }
}

export function saveRegistry(root: string, registry: MeniRegistry): void {
  const { registryJson, publicCache } = getRegistryPaths(root);
  ensureDir(registryJson);
  fs.writeFileSync(registryJson, JSON.stringify(registry, null, 2), 'utf-8');

  ensureDir(publicCache);
  fs.writeFileSync(publicCache, JSON.stringify(registry, null, 2), 'utf-8');
}

export function saveSnapshot(root: string, registry: MeniRegistry): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(root, HISTORY_DIR, `registry-${ts}.json`);
  ensureDir(file);
  fs.writeFileSync(file, JSON.stringify(registry, null, 2), 'utf-8');
  return file;
}

export function loadLatestSnapshot(root: string): MeniRegistry | null {
  const { historyDir } = getRegistryPaths(root);
  if (!fs.existsSync(historyDir)) return null;
  const files = fs
    .readdirSync(historyDir)
    .filter((f) => f.startsWith('registry-') && f.endsWith('.json'))
    .sort();
  if (files.length === 0) return null;
  const latest = path.join(historyDir, files[files.length - 1]);
  try {
    return JSON.parse(fs.readFileSync(latest, 'utf-8')) as MeniRegistry;
  } catch {
    return null;
  }
}

export function listSnapshots(root: string): string[] {
  const { historyDir } = getRegistryPaths(root);
  if (!fs.existsSync(historyDir)) return [];
  return fs
    .readdirSync(historyDir)
    .filter((f) => f.startsWith('registry-') && f.endsWith('.json'))
    .sort();
}
