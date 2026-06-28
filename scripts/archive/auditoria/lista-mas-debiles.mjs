import fs from 'fs';
const datos = JSON.parse(fs.readFileSync('auditor-resultado.json'));
// Ordenar por score ascendente (las más débiles primero)
datos.sort((a, b) => a.score - b.score);

console.log('═══════════════════════════════════════════════════════════');
console.log('LAS 25 NOTICIAS MÁS DÉBILES (prioriza estas para corregir a mano)');
console.log('═══════════════════════════════════════════════════════════\n');

const top = datos.slice(0, 25);
top.forEach((r, i) => {
  console.log(`${String(i+1).padStart(2)}. [${r.score}] ${r.nivel.padEnd(7)} | ${r.categoria.padEnd(15)} | ${(r.titulo||'').substring(0,52)}`);
  const falta = [];
  if (r.palabras < 450) falta.push(`corto (${r.palabras} pal, faltan ${450-r.palabras})`);
  if (r.relleno.length) falta.push(`relleno: ${r.relleno.join('/')}`);
  if (r.transiciones.tot) falta.push(`transiciones IA: ${r.transiciones.f.join('/')}`);
  if (r.densidad < 2) falta.push(`POCOS DATOS (densidad ${r.densidad}, mete cifras/fechas/horas)`);
  if (r.contextoCount === 0) falta.push('SIN CONTEXTO (menciona lugar/entidad concreta)');
  if (r.fAtrib.length === 0 && r.citas === 0) falta.push('sin fuente ni cita');
  console.log(`    → FALTA: ${falta.join('  |  ')}`);
  console.log(`    id: ${r.id}\n`);
});
