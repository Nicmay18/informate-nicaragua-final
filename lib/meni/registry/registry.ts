/**
 * MENI OS v3.0 — Registry Core
 * Lógica de construcción, cálculo de riesgo, dominios y estados del inventario.
 */

import crypto from 'crypto';
import type { MeniAsset, MeniAssetStatus, MeniAssetType, MeniRegistry, MeniRegistryWarning, MeniRiskLevel } from './registry-types';
import type { MeniArchitectEdge, MeniArchitectGraph, MeniArchitectNode } from '../architect';

interface FileInfo {
  content: string;
  mtime: Date;
  birthtime: Date;
}

export function hashContent(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

function assetName(path: string): string {
  return path.split('/').pop() ?? path;
}

function inferDomain(path: string, type: MeniAssetType): string {
  const lower = path.toLowerCase();
  if (lower.includes('app/api/admin') || lower.includes('app/admin') || lower.includes('/admin/')) return 'Admin';
  if (lower.includes('lib/meni')) return 'MENI';
  if (lower.includes('lib/seo') || lower.includes('seo')) return 'SEO';
  if (lower.includes('lib/db') || lower.includes('firebase') || lower.includes('firestore')) return 'Firebase';
  if (lower.includes('app/noticias') || lower.includes('/noticias/')) return 'Noticias';
  if (lower.includes('app/categoria') || lower.includes('/categoria/')) return 'Categorías';
  if (lower.includes('audio') || lower.includes('radio')) return 'Audio';
  if (lower.includes('adsense') || lower.includes('ads')) return 'Adsense';
  if (lower.includes('analytics') || lower.includes('gtag') || lower.includes('tagmanager')) return 'Analytics';
  if (lower.includes('jsonld') || lower.includes('schema')) return 'JSON-LD';
  if (lower.includes('discover') || lower.includes('eeat') || lower.includes('scoring')) return 'IA / EEAT';
  if (lower.includes('components/') || lower.includes('/components/')) return 'UI';
  if (lower.startsWith('app/') || type === 'page') return 'App';
  if (lower.startsWith('scripts/')) return 'Scripts';
  if (lower.startsWith('hooks/')) return 'Hooks';
  return 'General';
}

function inferTags(asset: MeniAsset): string[] {
  const tags = [asset.type, asset.domain];
  if (asset.firestoreCollections.length > 0) tags.push('firestore');
  if (asset.apiRoutes.length > 0) tags.push('api');
  if (asset.serverActions.length > 0) tags.push('server-action');
  if (asset.hooks.length > 0) tags.push('hooks');
  if (asset.risk === 'high' || asset.risk === 'critical') tags.push('high-risk');
  if (asset.status === 'orphan') tags.push('orphan');
  return [...new Set(tags)];
}

function computeRisk(asset: MeniAsset): MeniRiskLevel {
  let score = 0;
  if (asset.firestoreCollections.length > 0) score += 2;
  if (asset.apiRoutes.length > 0) score += 1;
  if (asset.serverActions.length > 0) score += 1;
  if (asset.dependsOn.some((d) => d.toLowerCase().includes('firestore') || d.toLowerCase().includes('db/homepage'))) score += 2;
  if (asset.dependsOn.some((d) => d.toLowerCase().includes('seo'))) score += 1;
  if (asset.dependsOn.some((d) => d.toLowerCase().includes('metadata') || d.toLowerCase().includes('jsonld'))) score += 1;
  if (asset.dependsOn.some((d) => d.toLowerCase().includes('homepage') || d === 'app/page.tsx')) score += 1;
  if (asset.dependsOn.some((d) => d.toLowerCase().includes('admin'))) score += 1;
  if (asset.domain === 'Firebase' || asset.domain === 'SEO') score += 1;

  if (score >= 6) return 'critical';
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function isEntryPoint(path: string, type: MeniAssetType): boolean {
  return (
    path === 'app/layout.tsx' ||
    path === 'app/page.tsx' ||
    path.startsWith('app/api/') ||
    path.startsWith('scripts/') ||
    type === 'api' ||
    type === 'page'
  );
}

function inferStatus(asset: MeniAsset): MeniAssetStatus {
  const lower = asset.path.toLowerCase();
  if (lower.includes('deprecated') || asset.path.includes('/deprecated/')) return 'deprecated';
  if (lower.includes('experimental') || lower.includes('draft')) return 'experimental';
  if (!isEntryPoint(asset.path, asset.type) && asset.usedBy.length === 0) return 'orphan';
  return 'active';
}

function toAssetType(nodeType: MeniArchitectNode['type']): MeniAssetType {
  switch (nodeType) {
    case 'component':
      return 'component';
    case 'page':
      return 'page';
    case 'api':
      return 'api';
    case 'hook':
      return 'hook';
    case 'action':
      return 'action';
    case 'script':
      return 'script';
    default:
      return 'lib';
  }
}

export function buildAssetFromNode(
  node: MeniArchitectNode,
  info: FileInfo,
  generatedAt: string
): MeniAsset {
  const type = toAssetType(node.type);
  const id = node.id;
  const name = assetName(node.id);
  const domain = inferDomain(node.id, type);

  const asset: MeniAsset = {
    id,
    name,
    path: node.id,
    type,
    domain,
    description: undefined,
    dependsOn: [],
    usedBy: [],
    exports: node.exports ?? [],
    imports: node.imports ?? [],
    firestoreCollections: node.collections ?? [],
    apiRoutes: node.route ? [node.route] : [],
    serverActions: type === 'action' ? (node.exports ?? []) : [],
    hooks: [],
    tags: [],
    risk: 'low',
    status: 'active',
    createdAt: info.birthtime.toISOString(),
    updatedAt: info.mtime.toISOString(),
    lastAudit: generatedAt,
    hash: hashContent(info.content),
  };

  return asset;
}

export function linkAssets(assets: MeniAsset[], edges: MeniArchitectEdge[]): MeniAsset[] {
  const map = new Map<string, MeniAsset>();
  for (const a of assets) map.set(a.id, a);

  for (const a of assets) {
    // dependencias directas: aristas salientes
    a.dependsOn = edges
      .filter((e) => e.from === a.id && e.to !== a.id)
      .map((e) => e.to)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // consumidores: aristas entrantes
    a.usedBy = edges
      .filter((e) => e.to === a.id && e.from !== a.id)
      .map((e) => e.from)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // hooks usados por este activo
    a.hooks = a.dependsOn.filter((depId) => map.get(depId)?.type === 'hook');
  }

  return assets;
}

export function finalizeAssets(assets: MeniAsset[]): MeniAsset[] {
  for (const a of assets) {
    a.risk = computeRisk(a);
    a.status = inferStatus(a);
    a.tags = inferTags(a);
  }
  return assets;
}

function buildDomains(assets: MeniAsset[]): Record<string, string[]> {
  const domains: Record<string, string[]> = {};
  for (const a of assets) {
    domains[a.domain] ??= [];
    domains[a.domain].push(a.id);
  }
  return domains;
}

function countBy<K extends string>(items: K[]): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const k of items) {
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function runAudit(assets: MeniAsset[]): { generatedAt: string; warnings: MeniRegistryWarning[] } {
  const warnings: MeniRegistryWarning[] = [];

  const orphans = assets.filter((a) => a.status === 'orphan').map((a) => a.id);
  if (orphans.length > 0) {
    warnings.push({
      code: 'ORPHAN',
      severity: 'medium',
      message: `${orphans.length} activos están huérfanos`,
      assetIds: orphans,
    });
  }

  // Duplicados por nombre
  const byName = new Map<string, string[]>();
  for (const a of assets) byName.set(a.name, [...(byName.get(a.name) ?? []), a.id]);
  const duplicates = Array.from(byName.values()).filter((arr) => arr.length > 1).flat();
  if (duplicates.length > 0) {
    warnings.push({
      code: 'DUPLICATE_NAME',
      severity: 'low',
      message: `Existen nombres de archivo duplicados`,
      assetIds: duplicates,
    });
  }

  const highRisk = assets.filter((a) => a.risk === 'high' || a.risk === 'critical').map((a) => a.id);
  if (highRisk.length > 0) {
    warnings.push({
      code: 'HIGH_RISK',
      severity: 'high',
      message: `${highRisk.length} activos de alto riesgo`,
      assetIds: highRisk,
    });
  }

  return { generatedAt: new Date().toISOString(), warnings };
}

export interface BuildRegistryInput {
  root: string;
  graph: MeniArchitectGraph;
  fileInfo: Map<string, FileInfo>;
  existingRegistry?: MeniRegistry | null;
}

export function buildRegistry(input: BuildRegistryInput): MeniRegistry {
  const generatedAt = new Date().toISOString();
  const { graph, fileInfo, root } = input;

  const assets: MeniAsset[] = [];
  for (const node of graph.nodes) {
    const info = fileInfo.get(node.id);
    if (!info) continue;
    assets.push(buildAssetFromNode(node, info, generatedAt));
  }

  linkAssets(assets, graph.edges);
  finalizeAssets(assets);

  const domains = buildDomains(assets);
  const audit = runAudit(assets);

  const byStatus = countBy(assets.map((a) => a.status));
  const byRisk = countBy(assets.map((a) => a.risk));

  return {
    version: '3.0',
    generatedAt,
    root,
    assets,
    domains,
    summary: {
      total: assets.length,
      byType: countBy(assets.map((a) => a.type)) as Partial<Record<MeniAssetType, number>>,
      byDomain: Object.fromEntries(Object.entries(domains).map(([k, v]) => [k, v.length])),
      byStatus,
      byRisk,
      orphans: assets.filter((a) => a.status === 'orphan').length,
      duplicates: audit.warnings.find((w) => w.code === 'DUPLICATE_NAME')?.assetIds.length ?? 0,
      highRisk: assets.filter((a) => a.risk === 'high' || a.risk === 'critical').length,
    },
    audit,
  };
}

export function findAsset(registry: MeniRegistry, id: string): MeniAsset | undefined {
  return registry.assets.find((a) => a.id === id);
}

export function filterAssets(
  registry: MeniRegistry,
  query: string,
  options: { type?: string; domain?: string; status?: string; risk?: string } = {}
): MeniAsset[] {
  const q = query.trim().toLowerCase();
  return registry.assets.filter((a) => {
    if (q && !a.id.toLowerCase().includes(q) && !a.name.toLowerCase().includes(q) && !a.exports.some((e) => e.toLowerCase().includes(q))) return false;
    if (options.type && a.type !== options.type) return false;
    if (options.domain && a.domain !== options.domain) return false;
    if (options.status && a.status !== options.status) return false;
    if (options.risk && a.risk !== options.risk) return false;
    return true;
  });
}
