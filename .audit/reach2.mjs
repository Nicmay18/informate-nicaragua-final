// Import-graph reachability: BFS desde entrypoints (app/**, middleware.ts,
// tests/**, scripts/**) resolviendo @/ y rutas relativas.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';

const ROOT = 'G:/RESPALDO/informate-nicaragua-final';
const SKIP = new Set(['node_modules', '.next', '.git', 'coverage', 'appx', 'articulos-generados', 'articulos-seo', 'reports', 'assets', 'bin', 'docs', 'data', 'bigquery', 'policies', 'content', 'locales']);
const files = [];
function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e) || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e) && !e.endsWith('.d.ts')) files.push(p);
  }
}
walk(ROOT);
const fileSet = new Set(files);

function resolveSpec(spec, fromFile) {
  let base;
  if (spec.startsWith('@/')) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec);
  else return null; // package import
  const cands = [base, base + '.ts', base + '.tsx', base + '.mjs', join(base, 'index.ts'), join(base, 'index.tsx')];
  for (const c of cands) if (fileSet.has(c)) return c;
  return null;
}

const IMPORT_RE = /(?:import\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?|import\s*\(|require\s*\(|export\s+(?:\*|\{[^}]*\})\s+from\s+)\s*['"`]([^'"`]+)['"`]/g;

const entries = files.filter(f => f.includes('\\app\\') || f.endsWith('middleware.ts'));
const seen = new Set(entries);
const queue = [...entries];
while (queue.length) {
  const f = queue.pop();
  const c = readFileSync(f, 'utf8');
  for (const m of c.matchAll(IMPORT_RE)) {
    const r = resolveSpec(m[1], f);
    if (r && !seen.has(r)) { seen.add(r); queue.push(r); }
  }
}

const libFiles = files.filter(f => f.includes('\\lib\\'));
const unreachable = libFiles.filter(f => !seen.has(f)).map(f => relative(join(ROOT, 'lib'), f).replace(/\\/g, '/'));
console.log('ENTRYPOINTS:', entries.length, '| ALCANZADOS:', seen.size, '| LIB TOTAL:', libFiles.length, '| LIB NO ALCANZABLES:', unreachable.length);
// agrupar por directorio
const byDir = {};
for (const u of unreachable) { const d = u.includes('/') ? u.slice(0, u.lastIndexOf('/')) : '(root)'; (byDir[d] = byDir[d] || []).push(u); }
for (const [d, list] of Object.entries(byDir).sort()) console.log(`\n${d} (${list.length}):`); 
// imprimir plano tambien
console.log('\n=== LISTA ===');
unreachable.forEach(u => console.log(u));
