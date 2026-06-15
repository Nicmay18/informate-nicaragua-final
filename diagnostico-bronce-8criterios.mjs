import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 8 criterios unificados
function validar8Criterios(n) {
  const texto = n.contenido || '';
  const textoLower = texto.toLowerCase();
  const palabras = texto.trim().split(/\s+/).filter(w => w.length > 0).length;
  const parrafos = texto.split(/\n+/).filter(p => p.trim().length > 20);
  const lead = parrafos[0] || '';
  const palabrasLead = lead.trim().split(/\s+/).filter(w => w.length > 0).length;
  const tieneH2 = /<h2[^>]*>/i.test(texto);
  const tieneStrong = /<strong>/i.test(texto) || /<b>/i.test(texto);
  const tieneDatos = /\d/.test(texto);
  const citas = (texto.match(/["\u201c][^"\u201d]{8,}["\u201d]/g) || []).length;
  const atribuciones = /inform[oó]|confirm[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó]|manifest[oó]|afirm[oó]|agreg[oó]|asegur[oó]|destac[oó]|mencion[oó]|aclar[oó]|coment[oó]|expres[oó]|anunc[ió]|revel[oó]/i.test(texto);
  const blockquotes = (texto.match(/<blockquote>/g) || []).length;
  const passCitas = citas >= 1 || atribuciones || blockquotes >= 1;
  const titulo = n.titulo || '';
  const tituloOK = titulo.length >= 50 && titulo.length <= 70;
  const meta = n.resumen || '';
  const metaOK = meta.length >= 150 && meta.length <= 170;
  const tieneImagen = n.imagenDestacada && n.imagenDestacada.length > 5;

  const criterios = {
    contenido: { ok: palabras >= 500, actual: palabras, esperado: 500 },
    lead: { ok: palabrasLead >= 35, actual: palabrasLead, esperado: 35 },
    h2: { ok: tieneH2, actual: tieneH2 ? 'Sí' : 'No', esperado: 'Sí' },
    strong: { ok: tieneStrong || tieneDatos, actual: tieneStrong ? 'Sí' : (tieneDatos ? 'Datos numéricos' : 'No'), esperado: 'Sí' },
    citas: { ok: passCitas, actual: citas, esperado: '>=1' },
    titulo: { ok: tituloOK, actual: titulo.length, esperado: '50-70' },
    meta: { ok: metaOK, actual: meta.length, esperado: '150-170' },
    imagen: { ok: tieneImagen, actual: tieneImagen ? 'Sí' : 'No', esperado: 'Sí' },
  };

  const aprobados = Object.values(criterios).filter(c => c.ok).length;
  const nivel = aprobados >= 7 ? 'ORO' : (aprobados >= 5 ? 'PLATA' : 'BRONCE');
  const faltantes = Object.entries(criterios).filter(([,c]) => !c.ok).map(([k]) => k);

  return { nivel, aprobados, faltantes, criterios, palabras, titulo: n.titulo };
}

const noticias = JSON.parse(readFileSync(path.join(__dirname, 'backup-noticias-2026-06-14.json'), 'utf8'));

const bronce = noticias
  .map(n => ({ ...n, ...validar8Criterios(n) }))
  .filter(n => n.nivel === 'BRONCE')
  .sort((a, b) => b.aprobados - a.aprobados);

console.log(`══════════════════════════════════════════════════════════════════`);
console.log(`  DIAGNÓSTICO BRONCE — ${bronce.length} noticias`);
console.log(`══════════════════════════════════════════════════════════════════\n`);

// Estadísticas por criterio faltante
const stats = { contenido: 0, lead: 0, h2: 0, strong: 0, citas: 0, titulo: 0, meta: 0, imagen: 0 };
for (const n of bronce) {
  for (const f of n.faltantes) stats[f]++;
}

console.log('Frecuencia de criterios fallidos:');
const statsOrdenado = Object.entries(stats).sort((a,b) => b[1] - a[1]);
for (const [k, v] of statsOrdenado) {
  if (v > 0) console.log(`  ${k.padEnd(12)} ${String(v).padStart(3)} noticias (${(v/bronce.length*100).toFixed(0)}%)`);
}

console.log('\n──────────────────────────────────────────────────────────────────');
console.log('NOTICIAS MÁS CERCANAS A PLATA/ORO (6-7/8 criterios):');
console.log('──────────────────────────────────────────────────────────────────\n');

const masCerca = bronce.filter(n => n.aprobados >= 6).slice(0, 20);
for (const n of masCerca) {
  console.log(`[${n.aprobados}/8] ${n.titulo.substring(0, 70)}`);
  console.log(`    Falta: ${n.faltantes.join(', ')} | Palabras: ${n.palabras}`);
}

if (masCerca.length === 0) {
  const top5 = bronce.slice(0, 10);
  for (const n of top5) {
    console.log(`[${n.aprobados}/8] ${n.titulo.substring(0, 70)}`);
    console.log(`    Falta: ${n.faltantes.join(', ')} | Palabras: ${n.palabras}`);
  }
}

console.log('\n──────────────────────────────────────────────────────────────────');
console.log('RECOMENDACIÓN:');
console.log('──────────────────────────────────────────────────────────────────');
const autoFixables = bronce.filter(n => {
  const f = n.faltantes;
  // Se puede arreglar automáticamente si solo falta: h2, citas, strong, o meta/título ajustable
  const soloAuto = f.every(x => ['h2','citas','strong','meta','titulo','imagen'].includes(x));
  return soloAuto && !f.includes('contenido') && !f.includes('lead');
}).length;

const requierenExpansion = bronce.filter(n => n.faltantes.includes('contenido') || n.faltantes.includes('lead')).length;

console.log(`  ${autoFixables} noticias pueden subir con correcciones AUTOMÁTICAS (h2, citas, strong, meta)`);
console.log(`  ${requierenExpansion} noticias necesitan EXPANSIÓN MANUAL de contenido (faltan palabras o lead)`);
console.log(`  Total: ${bronce.length}`);

process.exit(0);
