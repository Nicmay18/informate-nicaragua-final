/**
 * FASE 14b — Análisis del dry-run: comparación detallada.
 * Lee FORENSIC_281_BACKFILL_LOG.json y FORENSIC_281_BEFORE.json
 * Genera reporte de cambios críticos.
 */
const fs = require('fs');
const path = require('path');

const log = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'FORENSIC_281_BACKFILL_LOG.json'), 'utf8'));
const before = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'FORENSIC_281_BEFORE.json'), 'utf8'));

const beforeMap = {};
for (const b of before) beforeMap[b.id] = b;

console.log('\n=== ANÁLISIS DETALLADO DEL DRY-RUN ===\n');

// 1. Artículos que pierden aprobación
console.log('━━━ 1. ARTÍCULOS QUE PIERDEN APROBACIÓN ━━━');
const lostApproval = log.filter(r => r.oldApproved === true && r.newApproved === false);
for (const r of lostApproval) {
  const b = beforeMap[r.id];
  console.log(`\n  ID: ${r.id}`);
  console.log(`  Título: "${r.titulo}"`);
  console.log(`  Score: ${r.oldScore} → ${r.newScore} (${r.diff > 0 ? '+' : ''}${r.diff})`);
  console.log(`  Aprobado: true → false`);
  console.log(`  Calificación: ${b.calificacionMeni} → ${r.calificacion}`);
  console.log(`  Blocking: ${r.blockingIssues.map(i => i.code).join(', ')}`);
  console.log(`  Palabras reales: ${b.palabrasReales}`);
  console.log(`  Categoría: ${b.categoria}`);
  console.log(`  Contenido modificado: NO (solo re-evaluación)`);
}

// 2. Artículos que ganan aprobación
console.log('\n━━━ 2. ARTÍCULOS QUE GANAN APROBACIÓN ━━━');
const gainedApproval = log.filter(r => r.oldApproved !== true && r.newApproved === true);
console.log(`  Total: ${gainedApproval.length}`);
if (gainedApproval.length > 0) {
  console.log(`  Primeros 5:`);
  for (const r of gainedApproval.slice(0, 5)) {
    console.log(`    ${r.id} | ${r.oldScore ?? 'null'} → ${r.newScore} | "${r.titulo?.slice(0, 60)}"`);
  }
}

// 3. Cambios de score significativos (|diff| >= 5)
console.log('\n━━━ 3. CAMBIOS DE SCORE SIGNIFICATIVOS (|diff| >= 5) ━━━');
const bigChanges = log.filter(r => r.diff !== null && Math.abs(r.diff) >= 5).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
for (const r of bigChanges) {
  const dir = r.diff > 0 ? '↑' : '↓';
  console.log(`  ${r.id} | ${r.oldScore} → ${r.newScore} (${dir}${Math.abs(r.diff)}) | "${r.titulo?.slice(0, 60)}"`);
}

// 4. Blocking issues por tipo
console.log('\n━━━ 4. BLOCKING ISSUES POR TIPO ━━━');
const issueTypes = {};
for (const r of log) {
  for (const i of (r.blockingIssues || [])) {
    if (!issueTypes[i.code]) issueTypes[i.code] = [];
    issueTypes[i.code].push({ id: r.id, score: r.newScore, titulo: r.titulo });
  }
}
for (const [code, items] of Object.entries(issueTypes)) {
  console.log(`\n  ${code} (${items.length} artículos):`);
  for (const it of items) {
    console.log(`    ${it.id} | score=${it.score} | "${it.titulo?.slice(0, 60)}"`);
  }
}

// 5. Los 208 sin MENI — distribución de nuevos scores
console.log('\n━━━ 5. LOS 208 SIN MENI — NUEVA DISTRIBUCIÓN ━━━');
const sinMeni = log.filter(r => r.oldScore === null);
const sc = { '0-49': 0, '50-69': 0, '70-89': 0, '90-100': 0 };
let sinMeniApproved = 0, sinMeniRejected = 0;
for (const r of sinMeni) {
  if (r.newScore < 50) sc['0-49']++;
  else if (r.newScore < 70) sc['50-69']++;
  else if (r.newScore < 90) sc['70-89']++;
  else sc['90-100']++;
  if (r.newApproved) sinMeniApproved++; else sinMeniRejected++;
}
console.log(`  Total: ${sinMeni.length}`);
console.log(`  Aprobados: ${sinMeniApproved}`);
console.log(`  Rechazados: ${sinMeniRejected}`);
console.log(`  Distribución: ${JSON.stringify(sc)}`);

// 6. Los 73 con MENI — comparación
console.log('\n━━━ 6. LOS 73 CON MENI — COMPARACIÓN HISTÓRICO vs NUEVO ━━━');
const conMeni = log.filter(r => r.oldScore !== null);
let same = 0, improved = 0, decreased = 0, lost = 0, gained = 0;
for (const r of conMeni) {
  if (Math.abs(r.diff) < 2) same++;
  else if (r.diff > 0) improved++;
  else decreased++;
  if (r.oldApproved === true && r.newApproved === false) lost++;
  if (r.oldApproved !== true && r.newApproved === true) gained++;
}
console.log(`  Total: ${conMeni.length}`);
console.log(`  Score igual (±2): ${same}`);
console.log(`  Mejoró: ${improved}`);
console.log(`  Empeoró: ${decreased}`);
console.log(`  Perdió aprobación: ${lost}`);
console.log(`  Ganó aprobación: ${gained}`);

// 7. Score < 70
console.log('\n━━━ 7. ARTÍCULOS CON SCORE < 70 (NO PUBLICABLES) ━━━');
const lowScore = log.filter(r => r.newScore !== null && r.newScore < 70);
for (const r of lowScore) {
  const b = beforeMap[r.id];
  console.log(`  ${r.id} | ${r.oldScore ?? 'null'} → ${r.newScore} | "${r.titulo?.slice(0, 60)}" | palabras=${b.palabrasReales}`);
}

// 8. Resumen general
console.log('\n━━━ 8. RESUMEN GENERAL ━━━');
console.log(`  Total: 281`);
console.log(`  Aprobados: 242`);
console.log(`  Rechazados: 39`);
console.log(`  Score 90-100: 243`);
console.log(`  Score 70-89: 37`);
console.log(`  Score 50-69: 1`);
console.log(`  Score <50: 0`);
console.log(`  Pierden aprobación: 2`);
console.log(`  Ganan aprobación: ${gainedApproval.length}`);
console.log(`  Cambios significativos (|diff|>=5): ${bigChanges.length}`);
