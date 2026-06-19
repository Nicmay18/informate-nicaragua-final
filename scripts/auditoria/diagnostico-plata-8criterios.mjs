import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const sa = JSON.parse(readFileSync(join(__dirname, 'scripts', 'firebase-admin-key.json'), 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  return getFirestore(app);
}

function validar8(n) {
  const contenido = n.contenido || '';
  const titulo = n.titulo || '';
  const resumen = n.resumen || '';
  const imagen = n.imagen || '';

  const s = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = s.split(/\s+/).filter(w => w.length > 0).length;
  const h2s = (contenido.match(/<h2[\s>]/gi) || []).length;

  const strongsHtml = (contenido.match(/<strong>/gi) || []).length;
  const strongsMd = (contenido.match(/\*\*.+?\*\*/g) || []).length;
  const nombresPropios = (s.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
  const fechas = (s.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const numeros = (s.match(/\b\d{2,4}\b/g) || []).length;
  const strongs = strongsHtml + strongsMd + (nombresPropios >= 3 ? 1 : 0) + (fechas >= 1 ? 1 : 0) + (numeros >= 3 ? 1 : 0);

  const blockquotesHtml = (contenido.match(/<blockquote>/gi) || []).length;
  const citasCurvas = (contenido.match(/["\u00AB][^"\u00BB]{10,}["\u00BB]/g) || []).length;
  const citasRectas = (contenido.match(/["'][^"']{10,}?["']/g) || []).length;
  const atribucion = /(?:explic|dij|manifest|afirm|precis|señal|senal|indic|confirm|declar|agreg|asegur|destac|mencion|aclar|coment|expres|anunc|revel|según|segun)/i.test(contenido) ? 1 : 0;
  const blockquotes = blockquotesHtml + citasCurvas + citasRectas + atribucion;

  const parrafos = contenido.match(/<p>(.*?)<\/p>/g) || [];
  let lead = 0;
  for (const p of parrafos) {
    const pt = p.replace(/<[^>]*>/g, '').trim();
    const count = pt.split(/\s+/).filter(w => w.length > 0).length;
    if (count > 3) { lead = count; break; }
  }
  if (lead === 0) {
    const pp = s.split(/\n\s*\n/)[0] || s;
    lead = pp.split(/\s+/).filter(w => w.length > 0).length;
  }

  const tl = titulo.length;
  const rl = resumen.length;

  const checks = [
    { nombre: 'Extensión ≥500', pasa: palabras >= 500, valor: palabras + ' pal' },
    { nombre: 'Lead ≥35', pasa: lead >= 35, valor: lead + ' pal' },
    { nombre: 'h2 ≥1', pasa: h2s >= 1, valor: h2s },
    { nombre: 'Negritas/datos', pasa: strongs >= 1, valor: strongs },
    { nombre: 'Citas/atribución', pasa: blockquotes >= 1, valor: blockquotes },
    { nombre: 'Título 50-70 ch', pasa: tl >= 50 && tl <= 70, valor: tl + ' ch' },
    { nombre: 'Meta 150-170 ch', pasa: rl >= 150 && rl <= 170, valor: rl + ' ch' },
    { nombre: 'Imagen', pasa: !!(imagen && imagen.length), valor: imagen ? 'Sí' : 'No' },
  ];

  const passCount = checks.filter(c => c.pasa).length;
  const nivel = passCount === 8 ? 'ORO' : passCount >= 6 ? 'PLATA' : 'BRONCE';
  return { nivel, passCount, checks, titulo, id: n.id };
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  const plata = [];

  snapshot.forEach(d => {
    const n = d.data();
    n.id = d.id;
    const v = validar8(n);
    if (v.nivel === 'PLATA') plata.push(v);
  });

  // Ordenar por passCount descendente (las más cerca de ORO primero)
  plata.sort((a, b) => b.passCount - a.passCount);

  console.log(`=== ${plata.length} NOTICIAS EN PLATA ===\n`);
  plata.forEach(x => {
    console.log(`[${x.titulo.slice(0, 55)}] (${x.passCount}/8)`);
    const faltan = x.checks.filter(c => !c.pasa).map(c => `${c.nombre}: ${c.valor}`);
    console.log(`  FALTA: ${faltan.join(' | ')}\n`);
  });

  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
