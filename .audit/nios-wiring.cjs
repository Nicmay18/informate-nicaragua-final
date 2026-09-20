/**
 * Strict wiring audit: for each lib/nios module, find files whose import/require
 * statements reference it via @/lib/nios/<path> or relative paths.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'out', 'coverage', '.audit']);
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p, out); }
    else if (EXT.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const importRe = /(?:import|export)[^'"]*from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)|import\(['"]([^'"]+)['"]\)/g;

function resolveImport(spec, fromFile) {
  if (spec.startsWith('@/')) return spec.slice(2); // lib/... or app/...
  if (spec.startsWith('.')) {
    const abs = path.resolve(path.dirname(fromFile), spec);
    return path.relative(ROOT, abs).replace(/\\/g, '/');
  }
  return null; // package import
}

// map: module path without ext -> importers
const importers = new Map();
for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  let m;
  while ((m = importRe.exec(src))) {
    const spec = m[1] || m[2] || m[3];
    if (!spec) continue;
    const r = resolveImport(spec, f);
    if (!r) continue;
    // strip extension variants and /index
    const candidates = [r, r + '/index', r.replace(/\.(ts|tsx|js|jsx|mjs)$/, '')];
    for (const c of candidates) {
      if (!importers.has(c)) importers.set(c, []);
      importers.get(c).push(rel);
    }
  }
}

const niosFiles = walk(path.join(ROOT, 'lib', 'nios'))
  .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
const report = [];
for (const nf of niosFiles) {
  const key = path.relative(ROOT, nf).replace(/\\/g, '/').replace(/\.tsx?$/, ''); // lib/nios/x
  const list = new Set(importers.get(key) || []);
  // index files: also check directory import
  if (key.endsWith('/index')) {
    const dir = key.slice(0, -('/index'.length));
    for (const i of importers.get(dir) || []) list.add(i);
  }
  // check extensionless dir import for file modules
  const arr = [...list].filter(c => c !== key + '.ts');
  const external = arr.filter(c => !c.startsWith('lib/nios/'));
  report.push({
    module: key.replace(/^lib\/nios\//, ''),
    total: arr.length,
    external,
    byCron: arr.filter(c => c.startsWith('app/api/cron/')),
    byRoute: arr.filter(c => c.startsWith('app/api/') && !c.startsWith('app/api/cron/')),
    byPanel: arr.filter(c => c.startsWith('app/panel') || c.startsWith('app/admin') || c.startsWith('components/')),
    byTest: arr.filter(c => c.startsWith('tests/') || c.startsWith('scripts/')),
    internalOnly: arr.filter(c => c.startsWith('lib/nios/')),
  });
}
report.sort((a, b) => a.module.localeCompare(b.module));
const orphans = report.filter(r => r.total === 0);
const internalOnly = report.filter(r => r.total > 0 && r.external.length === 0 && r.byTest.length === 0);
console.log(`NIOS modules: ${report.length} | orphans: ${orphans.length} | internal-only: ${internalOnly.length}`);
console.log('\n=== ORPHANS (nadie los importa) ===');
orphans.forEach(r => console.log('  ' + r.module));
console.log('\n=== INTERNAL-ONLY (solo los usa lib/nios o nadie externo) ===');
internalOnly.forEach(r => console.log(`  ${r.module}  <- ${r.internalOnly.slice(0, 3).join(', ')}`));
console.log('\n=== EXTERNALLY WIRED ===');
report.filter(r => r.external.length > 0 || r.byTest.length > 0).forEach(r => {
  const tags = [r.byCron.length ? 'CRON' : '', r.byRoute.length ? 'API' : '', r.byPanel.length ? 'UI' : '', r.byTest.length ? 'TEST/SCRIPT' : ''].filter(Boolean).join('+');
  console.log(`  ${r.module.padEnd(46)} ${tags.padEnd(20)} ext: ${[...r.external, ...r.byTest].slice(0, 4).join(', ')}`);
});
fs.writeFileSync('.audit/nios-wiring.json', JSON.stringify(report, null, 2));
