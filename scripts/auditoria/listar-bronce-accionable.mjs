import fs from 'fs';

const datos = JSON.parse(fs.readFileSync('auditor-resultado.json'));

// Cruzar con backup para obtener slugs
const backupFile = fs.existsSync('backup-noticias-2026-06-15.json')
  ? 'backup-noticias-2026-06-15.json'
  : 'backup-noticias-2026-06-14.json';
const backup = JSON.parse(fs.readFileSync(backupFile));
const slugMap = Object.fromEntries(backup.map(n => [n.id, n.slug]));

const bronce = datos
  .filter(r => r.nivel === 'BRONCE')
  .map(r => ({ ...r, slug: slugMap[r.id] || r.id }))
  .sort((a, b) => a.palabras - b.palabras);

const bajoCont = bronce.filter(r => r.palabras < 500);
const reparables = bronce.filter(r => r.palabras >= 500);

function issues(r) {
  const p = [];
  if (r.palabras < 500)            p.push(`⚠️ CORTAS(${r.palabras}p)`);
  if (r.densidad < 1)              p.push('🔴 sin-datos');
  else if (r.densidad < 3)        p.push('🟠 pocos-datos');
  if (r.contextoCount === 0)      p.push('🔴 sin-contexto');
  else if (r.contextoCount < 2)   p.push('🟠 contexto-débil');
  if (r.fAtrib.length === 0 && r.citas === 0) p.push('🟠 sin-fuentes');
  if (r.relleno.length)           p.push('🟡 relleno');
  return p.join(' | ');
}

// ── GRUPO A: Bajo contenido (<500 palabras) — requieren redacción manual ──
console.log(`\n${'═'.repeat(70)}`);
console.log(`📝 GRUPO A — ${bajoCont.length} noticias con BAJO CONTENIDO (<500 palabras)`);
console.log(`   ⚠️  Estas necesitan redacción manual para llegar a ORO`);
console.log('═'.repeat(70));
for (const r of bajoCont) {
  console.log(`\n  [${String(r.palabras).padStart(3)}p] score:${r.score} — ${r.titulo?.substring(0, 65)}`);
  console.log(`          slug: ${r.slug}`);
  console.log(`          issues: ${issues(r)}`);
}

// ── GRUPO B: Reparables (≥500 palabras) — pueden subir a ORO con ajustes ──
console.log(`\n${'═'.repeat(70)}`);
console.log(`🔧 GRUPO B — ${reparables.length} noticias REPARABLES (≥500 palabras, score 80-89)`);
console.log(`   ✅  Con añadir fuentes/datos suben a ORO`);
console.log('═'.repeat(70));

// Sub-agrupar por score
const cerca = reparables.filter(r => r.score >= 85);
const medio = reparables.filter(r => r.score >= 80 && r.score < 85);
const lejos = reparables.filter(r => r.score < 80);

if (cerca.length) {
  console.log(`\n  🟡 Score 85-89 — a UN arreglo de ORO (${cerca.length} noticias):`);
  for (const r of cerca) {
    console.log(`    [${r.palabras}p] score:${r.score} — ${r.titulo?.substring(0, 60)}`);
    console.log(`       slug: ${r.slug}`);
    console.log(`       fix: ${issues(r)}`);
  }
}
if (medio.length) {
  console.log(`\n  🟠 Score 80-84 (${medio.length} noticias):`);
  for (const r of medio) {
    console.log(`    [${r.palabras}p] score:${r.score} — ${r.titulo?.substring(0, 60)}`);
    console.log(`       slug: ${r.slug}`);
    console.log(`       fix: ${issues(r)}`);
  }
}
if (lejos.length) {
  console.log(`\n  🔴 Score <80 (${lejos.length} noticias):`);
  for (const r of lejos) {
    console.log(`    [${r.palabras}p] score:${r.score} — ${r.titulo?.substring(0, 60)}`);
    console.log(`       slug: ${r.slug}`);
    console.log(`       fix: ${issues(r)}`);
  }
}

// Guardar JSON para usar en scripts de mejora
const output = { bajoCont, reparables, generado: new Date().toISOString() };
fs.writeFileSync('bronce-accionable.json', JSON.stringify(output, null, 2));
console.log(`\n\n💾 Guardado: bronce-accionable.json (${bajoCont.length} bajo contenido + ${reparables.length} reparables)`);
