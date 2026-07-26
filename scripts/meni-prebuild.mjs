/**
 * MENI v2.1 — Pre-build audit + synchronisation
 * Regenera el dependency graph y el informe de auditoría antes de cada build.
 * Se ejecuta automáticamente en `prebuild` (npm) o manualmente:
 *   node scripts/meni-prebuild.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

const graph = scanProject();
const audit = runAudit(graph);
writeJson(path.join(root, 'public', 'data', 'meni-architect.json'), graph);
writeJson(path.join(root, 'public', 'data', 'meni-audit.json'), audit);

console.log(`[MENI v2.1] Arquitectura escaneada: ${graph.nodes.length} nodos, ${graph.edges.length} aristas`);
console.log(`[MENI v2.1] Auditoría: score ${audit.score}/100, ${audit.issues.length} problemas`);
