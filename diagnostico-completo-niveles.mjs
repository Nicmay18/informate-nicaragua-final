import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validar8Criterios(n) {
  const texto = n.contenido || '';
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

  return { nivel, aprobados, faltantes, criterios, palabras, titulo: n.titulo, id: n.id };
}

const noticias = JSON.parse(readFileSync(path.join(__dirname, 'backup-noticias-2026-06-14.json'), 'utf8'));
const evaluadas = noticias.map(n => ({ ...n, ...validar8Criterios(n) }));

const oro = evaluadas.filter(n => n.nivel === 'ORO');
const plata = evaluadas.filter(n => n.nivel === 'PLATA');
const bronce = evaluadas.filter(n => n.nivel === 'BRONCE');

console.log('══════════════════════════════════════════════════════════════════');
console.log('  PANORAMA COMPLETO — 8 Criterios Unificados');
console.log('══════════════════════════════════════════════════════════════════\n');
console.log(`  🟠 ORO:   ${String(oro.length).padStart(3)} noticias`);
console.log(`  ⚪ PLATA: ${String(plata.length).padStart(3)} noticias`);
console.log(`  🟤 BRONCE:${String(bronce.length).padStart(3)} noticias`);
console.log(`  ────────────────────────`);
console.log(`  TOTAL:   ${evaluadas.length} noticias\n`);

// Estadísticas BRONCE
if (bronce.length > 0) {
  const stats = { contenido: 0, lead: 0, h2: 0, strong: 0, citas: 0, titulo: 0, meta: 0, imagen: 0 };
  for (const n of bronce) {
    for (const f of n.faltantes) stats[f]++;
  }
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('  BRONCE: Qué les falta');
  console.log('══════════════════════════════════════════════════════════════════');
  const orden = Object.entries(stats).sort((a,b) => b[1] - a[1]);
  for (const [k, v] of orden) {
    if (v > 0) console.log(`  ${k.padEnd(12)} ${String(v).padStart(3)} noticias`);
  }

  console.log('\n──────────────────────────────────────────────────────────────────');
  console.log('  BRONCE: Más cercanas a subir (6-7/8 criterios)');
  console.log('──────────────────────────────────────────────────────────────────');
  const cerca = bronce.filter(n => n.aprobados >= 6).sort((a,b) => b.aprobados - a.aprobados);
  for (const n of cerca.slice(0, 15)) {
    console.log(`  [${n.aprobados}/8] ${n.titulo.substring(0, 65)}`);
    console.log(`      Faltan: ${n.faltantes.join(', ')}`);
  }

  const autoFixables = bronce.filter(n => {
    const f = n.faltantes;
    return f.every(x => ['h2','citas','strong','meta','titulo','imagen'].includes(x)) && !f.includes('contenido') && !f.includes('lead');
  });
  const expansion = bronce.filter(n => n.faltantes.includes('contenido') || n.faltantes.includes('lead'));

  console.log('\n──────────────────────────────────────────────────────────────────');
  console.log('  PLAN DE ACCIÓN PARA BRONCE');
  console.log('──────────────────────────────────────────────────────────────────');
  console.log(`  ✅ ${autoFixables.length} pueden subir con CORRECCIONES AUTOMÁTICAS`);
  console.log(`  📝 ${expansion.length} necesitan EXPANSIÓN MANUAL (más palabras/lead)`);
  console.log(`  ⚠️  Las que faltan palabras/contenido NO se pueden inventar automáticamente.`);
}

// Estadísticas PLATA
if (plata.length > 0) {
  const statsP = { contenido: 0, lead: 0, h2: 0, strong: 0, citas: 0, titulo: 0, meta: 0, imagen: 0 };
  for (const n of plata) {
    for (const f of n.faltantes) statsP[f]++;
  }
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('  PLATA: Qué les falta para llegar a ORO');
  console.log('══════════════════════════════════════════════════════════════════');
  const ordenP = Object.entries(statsP).sort((a,b) => b[1] - a[1]);
  for (const [k, v] of ordenP) {
    if (v > 0) console.log(`  ${k.padEnd(12)} ${String(v).padStart(3)} noticias`);
  }

  const autoFixablesP = plata.filter(n => {
    const f = n.faltantes;
    return f.every(x => ['h2','citas','strong','meta','titulo','imagen'].includes(x)) && !f.includes('contenido') && !f.includes('lead');
  });
  console.log(`\n  ✅ ${autoFixablesP.length} PLATA pueden subir a ORO con correcciones automáticas`);
}

process.exit(0);
