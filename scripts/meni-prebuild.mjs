/**
 * MENI v2.1 — Pre-build audit + synchronisation
 * Regenera el dependency graph y el informe de auditoría antes de cada build.
 * Se ejecuta automáticamente en `prebuild` (npm) o manualmente:
 *   node scripts/meni-prebuild.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');

const SCAN_DIRS = ['app', 'components', 'lib', 'hooks', 'scripts'];
const EXT = new Set(['.ts', '.tsx', '.mjs']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      walk(full, files);
    } else if (entry.isFile() && EXT.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function nodeId(file) {
  return file.replace(root + path.sep, '').replace(/\\/g, '/');
}

function nodeType(file, content) {
  if (file.includes('app' + path.sep + 'api')) return 'api';
  if (file.startsWith('hooks' + path.sep) || file.includes(path.sep + 'hooks' + path.sep)) return 'hook';
  if (file.startsWith('scripts' + path.sep) || file.includes(path.sep + 'scripts' + path.sep)) return 'script';
  if (file.includes(path.sep + 'page.tsx') || file.includes(path.sep + 'page.ts')) return 'page';
  if (file.startsWith('components' + path.sep) || file.includes(path.sep + 'components' + path.sep)) return 'component';
  if (content.includes('"use server"') || content.includes("'use server'")) return 'action';
  return 'lib';
}

function extractImports(content) {
  const out = [];
  const regex = /from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    out.push(m[1] ?? m[2]);
  }
  return [...new Set(out)].filter(Boolean);
}

function extractExports(content) {
  const names = [];
  const regex = /export\s+(?:default\s+(?:function|class|async\s+function)?\s*([A-Z][A-Za-z0-9]*)?|(?:function|class|const|let|var)\s+([A-Za-z0-9_]+)|\{([^}]+)\})/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    if (m[1]) names.push(m[1]);
    if (m[2]) names.push(m[2]);
    if (m[3]) {
      m[3].split(',').forEach((n) => {
        const s = n.trim();
        if (s && !s.includes(' as ')) names.push(s);
      });
    }
  }
  return [...new Set(names)].filter(Boolean).slice(0, 20);
}

function extractCollections(content) {
  const out = [];
  const regex = /(?:collection|\.collection)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    out.push(m[1]);
  }
  return [...new Set(out)].filter(Boolean);
}

function apiRoute(file) {
  const match = file.match(/app\b[\\/]api\b[\\/](.+?)[\\/]route\.tsx?$/);
  if (!match) return undefined;
  return '/api/' + match[1].replace(/\\/g, '/');
}

function resolveImport(importPath, fromFile) {
  if (importPath.startsWith('@/')) {
    const rel = importPath.slice(2);
    const candidates = [
      path.join(root, rel + '.ts'),
      path.join(root, rel + '.tsx'),
      path.join(root, rel, 'index.ts'),
      path.join(root, rel, 'index.tsx'),
      path.join(root, rel + '.mjs'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return nodeId(c);
    }
  } else if (importPath.startsWith('.')) {
    const dir = path.dirname(fromFile);
    const rel = path.resolve(dir, importPath);
    const candidates = [rel + '.ts', rel + '.tsx', rel + '.mjs', path.join(rel, 'index.ts'), path.join(rel, 'index.tsx')];
    for (const c of candidates) {
      if (fs.existsSync(c)) return nodeId(c);
    }
  }
  return undefined;
}

function scanProject() {
  const files = [];
  for (const d of SCAN_DIRS) {
    const full = path.join(root, d);
    if (fs.existsSync(full)) walk(full, files);
  }

  const nodeMap = new Map();
  for (const file of files) {
    const id = nodeId(file);
    const content = fs.readFileSync(file, 'utf-8');
    const type = nodeType(file, content);
    const node = {
      id,
      type,
      file: id,
      exports: extractExports(content),
      imports: extractImports(content),
      route: apiRoute(file),
      collections: extractCollections(content),
    };
    nodeMap.set(id, node);
  }

  const edges = [];
  for (const node of nodeMap.values()) {
    for (const imp of node.imports) {
      const resolved = resolveImport(imp, path.join(root, node.file.replace(/\//g, path.sep)));
      if (resolved && resolved !== node.id) {
        edges.push({ from: node.id, to: resolved, source: imp });
      }
    }
  }

  const nodes = Array.from(nodeMap.values());
  const summary = {
    components: nodes.filter((n) => n.type === 'component').length,
    apis: nodes.filter((n) => n.type === 'api').length,
    hooks: nodes.filter((n) => n.type === 'hook').length,
    pages: nodes.filter((n) => n.type === 'page').length,
    libs: nodes.filter((n) => n.type === 'lib').length,
    actions: nodes.filter((n) => n.type === 'action').length,
    scripts: nodes.filter((n) => n.type === 'script').length,
  };

  return {
    version: '2.1',
    generatedAt: new Date().toISOString(),
    root,
    nodes,
    edges,
    summary,
  };
}

function runAudit(graph) {
  const issues = [];

  // 1. Componentes no registrados: deben importar '@/lib/meni' o residir bajo MENI
  const isolated = graph.nodes.filter((n) => {
    if (n.type !== 'component' && n.type !== 'page' && n.type !== 'hook') return false;
    return !n.imports.some((i) => i.includes('/meni') || i.includes('@/lib/meni'));
  });
  if (isolated.length > 0) {
    issues.push({
      area: 'registro',
      severidad: 'media',
      mensaje: `${isolated.length} componentes/hooks no referencian MENI`,
      nodos: isolated.map((n) => n.id),
    });
  }

  // 2. APIs sin autenticación visible
  const apisSinAuth = graph.nodes.filter((n) => {
    if (n.type !== 'api') return false;
    return !fs.readFileSync(path.join(root, n.file), 'utf-8').includes('verificarAuth');
  });
  if (apisSinAuth.length > 0) {
    issues.push({
      area: 'seguridad',
      severidad: 'alta',
      mensaje: `${apisSinAuth.length} rutas API no llaman verificarAuth`,
      nodos: apisSinAuth.map((n) => n.id),
    });
  }

  // 3. Páginas sin metadata/SEO
  const pagesSinMetadata = graph.nodes.filter((n) => {
    if (n.type !== 'page') return false;
    const content = fs.readFileSync(path.join(root, n.file), 'utf-8');
    return !content.includes('export const metadata') && !content.includes('generateMetadata');
  });
  if (pagesSinMetadata.length > 0) {
    issues.push({
      area: 'seo',
      severidad: 'baja',
      mensaje: `${pagesSinMetadata.length} páginas carecen de metadata`,
      nodos: pagesSinMetadata.map((n) => n.id),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    version: '2.1',
    score: Math.max(0, 100 - issues.length * 8),
    issues,
  };
}

function hashContent(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

function inferDomain(p, type) {
  const lower = p.toLowerCase();
  if (lower.includes('app/api/admin') || lower.includes('app/admin') || lower.includes('/admin/')) return 'Admin';
  if (lower.includes('lib/meni')) return 'MENI';
  if (lower.includes('lib/seo') || lower.includes('seo')) return 'SEO';
  if (lower.includes('lib/db') || lower.includes('firebase') || lower.includes('firestore')) return 'Firebase';
  if (lower.includes('app/noticias') || lower.includes('/noticias/')) return 'Noticias';
  if (lower.includes('app/categoria') || lower.includes('/categoria/')) return 'Categorías';
  if (lower.includes('audio') || lower.includes('radio')) return 'Audio';
  if (lower.includes('adsense') || lower.includes('ads')) return 'Adsense';
  if (lower.includes('analytics') || lower.includes('gtag')) return 'Analytics';
  if (lower.includes('jsonld') || lower.includes('schema')) return 'JSON-LD';
  if (lower.includes('discover') || lower.includes('eeat') || lower.includes('scoring')) return 'IA / EEAT';
  if (lower.includes('/components/') || lower.startsWith('components/')) return 'UI';
  if (lower.startsWith('app/') || type === 'page' || type === 'layout') return 'App';
  if (lower.startsWith('scripts/')) return 'Scripts';
  if (lower.startsWith('hooks/')) return 'Hooks';
  return 'General';
}

function assetRisk(a) {
  let score = 0;
  if (a.firestoreCollections.length > 0) score += 2;
  if (a.apiRoutes.length > 0) score += 1;
  if (a.serverActions.length > 0) score += 1;
  if (a.dependsOn.some((d) => d.toLowerCase().includes('firestore') || d.toLowerCase().includes('db/homepage'))) score += 2;
  if (a.dependsOn.some((d) => d.toLowerCase().includes('seo'))) score += 1;
  if (a.dependsOn.some((d) => d.toLowerCase().includes('metadata') || d.toLowerCase().includes('jsonld'))) score += 1;
  if (a.dependsOn.some((d) => d.toLowerCase().includes('homepage') || d === 'app/page.tsx')) score += 1;
  if (a.dependsOn.some((d) => d.toLowerCase().includes('admin'))) score += 1;
  if (a.domain === 'Firebase' || a.domain === 'SEO') score += 1;
  if (score >= 6) return 'critical';
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function assetStatus(a) {
  const lower = a.path.toLowerCase();
  if (lower.includes('deprecated') || lower.includes('/deprecated/')) return 'deprecated';
  if (lower.includes('experimental') || lower.includes('draft')) return 'experimental';
  const isEntry = a.path === 'app/layout.tsx' || a.path === 'app/page.tsx' || a.path.startsWith('app/api/') || a.path.startsWith('scripts/') || a.type === 'api' || a.type === 'page' || a.type === 'layout';
  if (!isEntry && a.usedBy.length === 0) return 'orphan';
  return 'active';
}

function buildRegistryFromGraph(root, graph) {
  const generatedAt = new Date().toISOString();
  const assetMap = new Map();

  for (const n of graph.nodes) {
    const full = path.join(root, n.file.replace(/\//g, path.sep));
    let content = '';
    let mtime = generatedAt;
    let birthtime = generatedAt;
    try {
      content = fs.readFileSync(full, 'utf-8');
      const stat = fs.statSync(full);
      mtime = stat.mtime.toISOString();
      birthtime = stat.birthtime.toISOString();
    } catch {}

    let type = n.type;
    if (n.file.includes('/layout.tsx') || n.file.includes('/layout.ts') || n.file.endsWith('/layout.tsx')) type = 'layout';
    if (content.includes('"use server"') || content.includes("'use server'")) type = 'action';

    const name = path.basename(n.file);
    const domain = inferDomain(n.file, type);
    const asset = {
      id: n.id,
      name,
      path: n.file,
      type,
      domain,
      dependsOn: [],
      usedBy: [],
      exports: n.exports ?? [],
      imports: n.imports ?? [],
      firestoreCollections: n.collections ?? [],
      apiRoutes: n.route ? [n.route] : [],
      serverActions: type === 'action' ? (n.exports ?? []) : [],
      hooks: [],
      tags: [type, domain],
      risk: 'low',
      status: 'active',
      createdAt: birthtime,
      updatedAt: mtime,
      lastAudit: generatedAt,
      hash: hashContent(content),
    };
    assetMap.set(n.id, asset);
  }

  for (const n of graph.nodes) {
    const a = assetMap.get(n.id);
    a.dependsOn = graph.edges
      .filter((e) => e.from === n.id && e.to !== n.id)
      .map((e) => e.to)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    a.usedBy = graph.edges
      .filter((e) => e.to === n.id && e.from !== n.id)
      .map((e) => e.from)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    a.hooks = a.dependsOn.filter((depId) => assetMap.get(depId)?.type === 'hook');
  }

  const assets = Array.from(assetMap.values());
  for (const a of assets) {
    a.risk = assetRisk(a);
    a.status = assetStatus(a);
    a.tags = [...new Set([a.type, a.domain, ...(a.firestoreCollections.length ? ['firestore'] : []), ...(a.apiRoutes.length ? ['api'] : []), ...(a.serverActions.length ? ['server-action'] : []), ...(a.hooks.length ? ['hooks'] : []), ...(a.risk === 'high' || a.risk === 'critical' ? ['high-risk'] : []), ...(a.status === 'orphan' ? ['orphan'] : [])])];
  }

  const byType = {};
  const byStatus = {};
  const byRisk = {};
  const byDomain = {};
  const domains = {};
  for (const a of assets) {
    byType[a.type] = (byType[a.type] ?? 0) + 1;
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    byRisk[a.risk] = (byRisk[a.risk] ?? 0) + 1;
    byDomain[a.domain] = (byDomain[a.domain] ?? 0) + 1;
    domains[a.domain] = domains[a.domain] ?? [];
    domains[a.domain].push(a.id);
  }

  const warnings = [];
  const orphans = assets.filter((a) => a.status === 'orphan').map((a) => a.id);
  if (orphans.length) warnings.push({ code: 'ORPHAN', severity: 'medium', message: `${orphans.length} activos huérfanos`, assetIds: orphans });
  const byName = new Map();
  for (const a of assets) byName.set(a.name, [...(byName.get(a.name) ?? []), a.id]);
  const dupes = Array.from(byName.values()).filter((arr) => arr.length > 1).flat();
  if (dupes.length) warnings.push({ code: 'DUPLICATE_NAME', severity: 'low', message: 'Nombres de archivo duplicados', assetIds: dupes });
  const highRisk = assets.filter((a) => a.risk === 'high' || a.risk === 'critical').map((a) => a.id);
  if (highRisk.length) warnings.push({ code: 'HIGH_RISK', severity: 'high', message: `${highRisk.length} activos de alto riesgo`, assetIds: highRisk });

  return {
    version: '3.0',
    generatedAt,
    root,
    assets,
    domains,
    summary: {
      total: assets.length,
      byType,
      byDomain,
      byStatus,
      byRisk,
      orphans: orphans.length,
      duplicates: dupes.length,
      highRisk: highRisk.length,
    },
    audit: { generatedAt, warnings },
  };
}

function saveRegistry(root, registry) {
  const dir = path.join(root, 'data', 'meni');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'registry.json'), JSON.stringify(registry, null, 2), 'utf-8');
  fs.mkdirSync(path.join(root, 'public', 'data'), { recursive: true });
  fs.writeFileSync(path.join(root, 'public', 'data', 'meni-registry.json'), JSON.stringify(registry, null, 2), 'utf-8');

  const historyDir = path.join(root, 'data', 'meni', 'history');
  fs.mkdirSync(historyDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(historyDir, `registry-${ts}.json`), JSON.stringify(registry, null, 2), 'utf-8');
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

const graph = scanProject();
const audit = runAudit(graph);
writeJson(path.join(root, 'public', 'data', 'meni-architect.json'), graph);
writeJson(path.join(root, 'public', 'data', 'meni-audit.json'), audit);

const registry = buildRegistryFromGraph(root, graph);
saveRegistry(root, registry);

console.log(`[MENI v3.0] Arquitectura escaneada: ${graph.nodes.length} nodos, ${graph.edges.length} aristas`);
console.log(`[MENI v3.0] Registry: ${registry.summary.total} activos, ${registry.summary.orphans} huérfanos, ${registry.summary.highRisk} riesgo alto`);
console.log(`[MENI v3.0] Auditoría: score ${audit.score}/100, ${audit.issues.length} problemas`);
