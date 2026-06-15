import fs from 'fs';
const datos = JSON.parse(fs.readFileSync('auditor-resultado.json'));
const conTrans = datos.filter(r => r.transiciones.tot > 0);
console.log(`${conTrans.length} noticias con transiciones IA residuales:\n`);
const conteo = {};
for (const r of conTrans) {
  console.log(`[${r.score}] ${r.nivel} | ${(r.titulo||'').substring(0,50)}`);
  console.log(`   → ${r.transiciones.f.join(', ')}`);
  for (const f of r.transiciones.f) {
    const palabra = f.replace(/\(\d+\)/, '');
    conteo[palabra] = (conteo[palabra] || 0) + 1;
  }
}
console.log('\n═══ Conteo por conector ═══');
for (const [k, v] of Object.entries(conteo).sort((a,b)=>b[1]-a[1])) {
  console.log(`${k.padEnd(20)} ${v}`);
}
