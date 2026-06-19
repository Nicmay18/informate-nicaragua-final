import fs from 'fs';
const datos = JSON.parse(fs.readFileSync('auditor-resultado.json'));
const bronce = datos.filter(r => r.nivel === 'BRONCE');

// Recalcular qué punto pierde cada BRONCE
const faltantes = {
  'palabras<500': 0,
  'tiene relleno': 0,
  'tiene transiciones IA': 0,
  'densidad<3': 0,
  'densidad<1 (crítico)': 0,
  'variación no ALTA': 0,
  'contexto<2': 0,
  'contexto=0 (crítico)': 0,
  'sin fuentes ni citas': 0,
};

for (const r of bronce) {
  if (r.palabras < 500) faltantes['palabras<500']++;
  if (r.relleno.length) faltantes['tiene relleno']++;
  if (r.transiciones.tot) faltantes['tiene transiciones IA']++;
  if (r.densidad < 3) faltantes['densidad<3']++;
  if (r.densidad < 1) faltantes['densidad<1 (crítico)']++;
  if (r.varOr !== 'ALTA') faltantes['variación no ALTA']++;
  if (r.contextoCount < 2) faltantes['contexto<2']++;
  if (r.contextoCount === 0) faltantes['contexto=0 (crítico)']++;
  if (r.fAtrib.length === 0 && r.citas === 0) faltantes['sin fuentes ni citas']++;
}

console.log('═══════════════════════════════════════════');
console.log(`ANÁLISIS DE ${bronce.length} NOTICIAS BRONCE`);
console.log('¿Qué les impide llegar a ORO (90)?');
console.log('═══════════════════════════════════════════');
for (const [k, v] of Object.entries(faltantes).sort((a,b)=>b[1]-a[1])) {
  const pct = (v/bronce.length*100).toFixed(0);
  console.log(`${k.padEnd(28)} ${String(v).padStart(3)} (${pct}%)`);
}

// Distribución de scores
console.log('');
console.log('Distribución de scores BRONCE:');
const rangos = { '85-89': 0, '80-84': 0, '75-79': 0 };
for (const r of bronce) {
  if (r.score >= 85) rangos['85-89']++;
  else if (r.score >= 80) rangos['80-84']++;
  else rangos['75-79']++;
}
for (const [k, v] of Object.entries(rangos)) console.log(`  ${k}: ${v}`);

// Cuántas están a UN solo arreglo de ORO
console.log('');
const cercaORO = bronce.filter(r => r.score >= 85);
console.log(`${cercaORO.length} BRONCE están en 85-89 (a un arreglo de ORO)`);

// De las que solo tienen transiciones como problema
const soloTrans = bronce.filter(r => r.transiciones.tot > 0 && r.relleno.length === 0 && r.densidad >= 3 && r.contextoCount >= 2);
console.log(`${soloTrans.length} BRONCE: su ÚNICO problema son las transiciones IA`);

const soloDensidad = bronce.filter(r => r.densidad < 3 && r.relleno.length === 0 && r.transiciones.tot === 0);
console.log(`${soloDensidad.length} BRONCE: su único problema es densidad de datos baja`);
