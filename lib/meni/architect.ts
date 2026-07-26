/**
 * MENI Architect — Escáner de arquitectura y dependency graph del proyecto.
 * Corre únicamente en Node (API / scripts).
 */

import fs from 'fs';
import path from 'path';

export type MeniArchitectNodeType =
  | 'component'
  | 'api'
  | 'hook'
  | 'page'
  | 'lib'
  | 'action'
  | 'script';

export interface MeniArchitectNode {
  id: string;
  type: MeniArchitectNodeType;
  file: string;
  exports: string[];
  imports: string[];
  route?: string;
  collections?: string[];
}

export interface MeniArchitectEdge {
  from: string;
  to: string;
  source: string;
}

export interface MeniArchitectGraph {
  version: '2.1';
  generatedAt: string;
  root: string;
  nodes: MeniArchitectNode[];
  edges: MeniArchitectEdge[];
  summary: {
    components: number;
    apis: number;
    hooks: number;
    pages: number;
    libs: number;
    actions: number;
    scripts: number;
  };
}

const SCAN_DIRS = ['app', 'components', 'lib', 'hooks', 'scripts'];
const EXT = new Set(['.ts', '.tsx', '.mjs']);

function walk(dir: string, files: string[] = []): string[] {
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

function nodeId(file: string, root: string): string {
  return file.replace(root + path.sep, '').replace(/\\/g, '/');
}

function nodeType(file: string): MeniArchitectNodeType {
  if (file.includes('app' + path.sep + 'api')) return 'api';
  if (file.startsWith('hooks' + path.sep) || file.includes(path.sep + 'hooks' + path.sep)) return 'hook';
  if (file.startsWith('scripts' + path.sep) || file.includes(path.sep + 'scripts' + path.sep)) return 'script';
  if (file.includes(path.sep + 'page.tsx') || file.includes(path.sep + 'page.ts')) return 'page';
  if (file.startsWith('components' + path.sep) || file.includes(path.sep + 'components' + path.sep)) return 'component';
  if (file.includes('"use server"') || file.includes("'use server'")) return 'action';
  return 'lib';
}

function extractImports(content: string): string[] {
  const out: string[] = [];
  const regex = /from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    out.push(m[1] ?? m[2]);
  }
  return [...new Set(out)].filter(Boolean);
}

function extractExports(content: string): string[] {
  const names: string[] = [];
  const regex =
    /export\s+(?:default\s+(?:function|class|async\s+function)?\s*([A-Z][A-Za-z0-9]*)?|(?:function|class|const|let|var)\s+([A-Za-z0-9_]+)|\{([^}]+)\})/g;
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

function extractCollections(content: string): string[] {
  const out: string[] = [];
  const regex = /(?:collection|\.collection)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    out.push(m[1]);
  }
  return [...new Set(out)].filter(Boolean);
}

function apiRoute(file: string): string | undefined {
  const match = file.match(/app\b[\\/]api\b[\\/](.+?)[\\/]route\.tsx?$/);
  if (!match) return undefined;
  return '/api/' + match[1].replace(/\\/g, '/');
}

function resolveImport(importPath: string, fromFile: string, root: string): string | undefined {
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
      if (fs.existsSync(c)) return nodeId(c, root);
    }
  } else if (importPath.startsWith('.')) {
    const dir = path.dirname(fromFile);
    const rel = path.resolve(dir, importPath);
    const candidates = [rel + '.ts', rel + '.tsx', rel + '.mjs', path.join(rel, 'index.ts'), path.join(rel, 'index.tsx')];
    for (const c of candidates) {
      if (fs.existsSync(c)) return nodeId(c, root);
    }
  }
  return undefined;
}

export function scanProject(root: string): MeniArchitectGraph {
  const files: string[] = [];
  for (const d of SCAN_DIRS) {
    const full = path.join(root, d);
    if (fs.existsSync(full)) walk(full, files);
  }

  const nodeMap = new Map<string, MeniArchitectNode>();
  for (const file of files) {
    const id = nodeId(file, root);
    const content = fs.readFileSync(file, 'utf-8');
    const type = nodeType(file);
    const node: MeniArchitectNode = {
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

  const edges: MeniArchitectEdge[] = [];
  for (const node of nodeMap.values()) {
    for (const imp of node.imports) {
      const resolved = resolveImport(imp, path.join(root, node.file.replace(/\//g, path.sep)), root);
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

export function writeGraph(graph: MeniArchitectGraph, outPath: string): void {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(graph, null, 2), 'utf-8');
}

export function readGraph(filePath: string): MeniArchitectGraph | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as MeniArchitectGraph;
}
