// Escaneo de referencias: para cada archivo en components/ lib/ hooks/ app/(no rutas)
// cuenta cuántos archivos del proyecto lo importan. Solo lectura.
// Uso: node .audit/dead-code-scan.mjs > .audit/dead-code-raw.txt
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep, basename, dirname } from 'path';

const ROOT = process.cwd();
const SRC_DIRS = ['app', 'components', 'lib', 'hooks', 'middleware.ts', 'scripts', 'tests', 'e2e'];
const IGNORE = new Set(['node_modules', '.next', '.git', '.audit', 'public', 'coverage', 'playwright-report']);

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (IGNORE.has(e)) continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(e) && !e.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const allFiles = SRC_DIRS.flatMap(d => {
  const p = join(ROOT, d);
  try { return statSync(p).isDirectory() ? walk(p) : [p]; } catch { return []; }
});

const contents = new Map(allFiles.map(f => [f, readFileSync(f, 'utf8')]));

// Next.js entrypoints (referenciados por convención, no por import)
const isEntry = (rel) =>
  /^app[\\/].*(page|layout|route|loading|error|not-found|template|default|sitemap|robots|opengraph-image|manifest|icon|middleware)\.(ts|tsx|js)$/.test(rel) ||
  rel === 'middleware.ts' || /^tests[\\/]|\.test\.|\.spec\.|^e2e[\\/]|^scripts[\\/]/.test(rel) ||
  /instrumentation|sentry\.(client|server|edge)\.config|next\.config|tailwind\.config|postcss\.config|vitest\.config|playwright\.config/.test(rel);

function moduleKeys(absFile) {
  const rel = relative(ROOT, absFile).split(sep).join('/');
  const noExt = rel.replace(/\.(tsx?|m?js|cjs)$/, '');
  const keys = new Set([`@/${noExt}`, `./${noExt}`, noExt]);
  if (basename(noExt) === 'index') { const d = dirname(noExt); keys.add(`@/${d}`); keys.add(d); }
  return { rel, noExt, keys };
}

const results = [];
for (const f of allFiles) {
  const { rel, noExt, keys } = moduleKeys(f);
  const base = basename(noExt);
  const dirBase = basename(dirname(noExt));
  let refs = 0; const refFiles = [];
  for (const [other, src] of contents) {
    if (other === f) continue;
    // import ... from '<key>'  |  import('<key>')  |  require('<key>')
    let hit = false;
    for (const k of keys) {
      if (src.includes(`'${k}'`) || src.includes(`"${k}"`)) { hit = true; break; }
    }
    if (!hit) {
      // imports relativos: resolver cada especificador './x' | '../x' contra el archivo importador
      const specRe = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
      let m;
      while ((m = specRe.exec(src))) {
        const resolved = relative(ROOT, join(dirname(other), m[1])).split(sep).join('/').replace(/\.(tsx?|m?js|cjs)$/, '');
        const target = noExt;
        if (resolved === target || resolved === target.replace(/\/index$/, '') || `${resolved}/index` === target) { hit = true; break; }
      }
    }
    if (hit) { refs++; if (refFiles.length < 3) refFiles.push(relative(ROOT, other).split(sep).join('/')); }
  }
  const entry = isEntry(rel);
  const lines = contents.get(f).split('\n').length;
  results.push({ rel, refs, entry, lines, refFiles, dirBase });
}

const dead = results.filter(r => !r.entry && r.refs === 0).sort((a, b) => b.lines - a.lines);
console.log(`ARCHIVOS: ${results.length} | ENTRYPOINTS: ${results.filter(r => r.entry).length} | SIN REFERENCIAS (no-entry): ${dead.length}`);
console.log(`LÍNEAS sin referencia: ${dead.reduce((s, r) => s + r.lines, 0)}\n`);
for (const r of dead) console.log(`${String(r.lines).padStart(5)}  ${r.rel}`);
