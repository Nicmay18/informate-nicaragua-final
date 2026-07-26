/**
 * MENI OS v3.0 — Registry Sync
 * Orquesta escaneo, construcción del Registry, detección de cambios y snapshots.
 */

import fs from 'fs';
import path from 'path';
import { scanProject } from '../architect';
import { buildRegistry } from './registry';
import { loadRegistry, loadLatestSnapshot, saveRegistry, saveSnapshot } from './registry-store';
import type { MeniRegistry, MeniSyncResult } from './registry-types';

function collectFileInfo(root: string, fileIds: string[]): Map<string, { content: string; mtime: Date; birthtime: Date }> {
  const map = new Map<string, { content: string; mtime: Date; birthtime: Date }>();
  for (const id of fileIds) {
    const full = path.join(root, id.replace(/\//g, path.sep));
    if (!fs.existsSync(full)) continue;
    const stat = fs.statSync(full);
    const content = fs.readFileSync(full, 'utf-8');
    map.set(id, { content, mtime: stat.mtime, birthtime: stat.birthtime });
  }
  return map;
}

export function diffRegistry(previous: MeniRegistry | null, current: MeniRegistry): { added: string[]; removed: string[]; modified: string[] } {
  if (!previous) {
    return { added: current.assets.map((a) => a.id), removed: [], modified: [] };
  }
  const prevIds = new Set(previous.assets.map((a) => a.id));
  const currIds = new Set(current.assets.map((a) => a.id));

  const added = current.assets.filter((a) => !prevIds.has(a.id)).map((a) => a.id);
  const removed = previous.assets.filter((a) => !currIds.has(a.id)).map((a) => a.id);

  const prevMap = new Map(previous.assets.map((a) => [a.id, a]));
  const modified: string[] = [];
  for (const a of current.assets) {
    const p = prevMap.get(a.id);
    if (p && p.hash !== a.hash) modified.push(a.id);
  }

  return { added, removed, modified };
}

export function syncRegistry(root: string, persist = true): MeniSyncResult {
  const previous = persist ? loadRegistry(root) ?? loadLatestSnapshot(root) : null;
  const graph = scanProject(root);
  const fileInfo = collectFileInfo(root, graph.nodes.map((n) => n.id));
  const current = buildRegistry({ root, graph, fileInfo, existingRegistry: previous });
  const { added, removed, modified } = diffRegistry(previous, current);

  let snapshotPath = '';
  if (persist) {
    saveRegistry(root, current);
    if (added.length > 0 || removed.length > 0 || modified.length > 0) {
      snapshotPath = saveSnapshot(root, current);
    }
  }

  return {
    registry: current,
    changed: added.length + removed.length + modified.length,
    added,
    removed,
    modified,
    snapshotPath,
  };
}
