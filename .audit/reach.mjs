// Reachability: which lib/ modules are never imported anywhere?
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = 'G:/RESPALDO/informate-nicaragua-final';
const SKIP = new Set(['node_modules', '.next', '.git', 'coverage', 'appx', 'articulos-generados', 'articulos-seo']);
const files = [];
function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e) || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|mjs|cjs|js)$/.test(e) && !e.endsWith('.test.ts')) files.push(p);
  }
}
walk(ROOT);

// Map lib module -> specifier used in imports (@/lib/x or relative)
const libFiles = files.filter(f => f.includes('\\lib\\'));
const src = files.map(f => [f, readFileSync(f, 'utf8').slice(0, 200000)]);

const dead = [];
for (const lf of libFiles) {
  const rel = relative(join(ROOT, 'lib'), lf).replace(/\\/g, '/').replace(/\.(ts|tsx)$/, '');
  const relNoIndex = rel.replace(/\/index$/, '');
  const pats = [`@/lib/${rel}'`, `@/lib/${rel}"`, `@/lib/${relNoIndex}'`, `@/lib/${relNoIndex}"`, `'./`, `'../`];
  let refs = 0;
  for (const [f, c] of src) {
    if (f === lf) continue;
    if (c.includes(`@/lib/${rel}`) || (relNoIndex !== rel && c.includes(`@/lib/${relNoIndex}`))) refs++;
  }
  if (refs === 0) dead.push(rel);
}
console.log('LIB FILES:', libFiles.length, '| SIN REFERENCIA @/lib:', dead.length);
dead.forEach(d => console.log('  ' + d));
