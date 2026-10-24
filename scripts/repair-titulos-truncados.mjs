// repair-titulos-truncados.mjs — lote de títulos truncados con "…" (N9)
// Protocolo idéntico a P2: snapshot -> fingerprint -> backup -> apply -> post-verify.
// SIMULACIÓN por defecto. --apply requiere autorización expresa.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))) });
const db = getFirestore();

const REPARACIONES = [
  { slug: 'cuatro-nicaraguenses-mueren-en-el-exterior-en-menos-de-una', actual: 'Cuatro nicaragüenses mueren en Costa Rica, El…', nuevo: 'Cuatro nicaragüenses mueren en Costa Rica, El Salvador y Estados Unidos' },
  { slug: 'dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami', actual: 'Dos nicaragüenses fallecen en accidentes ocurridos en…', nuevo: 'Dos nicaragüenses fallecen en accidentes ocurridos en Honduras y Miami' },
  { slug: 'robo-de-caja-fuerte-con-14-000-en-quilali-termina-con-un-detenido', actual: 'Robo de caja fuerte con $14,000 en Quilalí termina con un…', nuevo: 'Robo de caja fuerte con $14,000 en Quilalí termina con un detenido' },
  { slug: 'dos-hombres-mueren-por-descargas-electricas-en-managua', actual: 'Dos hombres mueren por descargas eléctricas en…', nuevo: 'Dos hombres mueren por descargas eléctricas en Managua' },
  { slug: 'sandboarding-en-cerro-negro-conquista-redes-y-atrae-turistas-a-leon', actual: 'Sandboarding en Cerro Negro conquista redes y atrae turistas a…', nuevo: 'Sandboarding en Cerro Negro conquista redes y atrae turistas a León' },
  { slug: 'nicaragua-festival-ia-y-hackathon-impulsan-la-innovacion', actual: 'Evento de IA buscan revolucionar innovación en Nicaragua y…', nuevo: 'Festival IA y Hackathon Nicaragua 2026 impulsan la innovación' },
  { slug: 'fuertes-lluvias-provocan-inundaciones-y-suspenden-trafico-en-rosita', actual: 'Fuertes lluvias provocan inundaciones y suspenden tráfico en…', nuevo: 'Fuertes lluvias provocan inundaciones y suspenden tráfico en Rosita' },
  { slug: 'comercios-esperan-alta-actividad-por-dia-de-las-madres-en-nicaragua', actual: 'Comercios esperan alta actividad por Día de las Madres en…', nuevo: 'Comercios esperan alta actividad por Día de las Madres en Nicaragua' },
  { slug: 'tres-motociclistas-mueren-en-accidentes-de-transito-en-nicaragua', actual: 'Tres personas mueren en accidentes de motocicleta…', nuevo: 'Tres personas mueren en accidentes de motocicleta en Nicaragua' },
  { slug: 'juez-deja-libre-a-nicaraguense-investigada-por-muerte-de-su-hermana', actual: 'Juez deja libre a nicaragüense investigada por muerte de su…', nuevo: 'Juez deja libre a nicaragüense investigada por muerte de su hermana' },
  { slug: 'bluefields-celebra-el-palo-de-mayo-con-musica-y-tradicion-caribena', actual: 'Bluefields celebra el Palo de Mayo con música y tradición…', nuevo: 'Bluefields celebra el Palo de Mayo con música y tradición caribeña' },
  { slug: 'brigada-medica-realiza-cirugia-cardiacas-gratuitas-en-hospital-de-leon', actual: 'Brigada médica realiza cirugía cardíacas gratuitas en hospital…', nuevo: 'Brigada médica realiza cirugías cardíacas gratuitas en hospital de León' },
  { slug: 'modernizan-aeropuerto-de-bluefields-con-inversion-de-us-10-millones', actual: 'Modernizan aeropuerto de Bluefields con inversión de US$10…', nuevo: 'Modernizan aeropuerto de Bluefields con inversión de US$10 millones' },
  { slug: 'rosita-nicaragua-lagunas-turismo-cultura', actual: 'Rosita, Nicaragua: lagunas, cultura Mayangna y turismo de…', nuevo: 'Rosita, Nicaragua: lagunas, cultura Mayangna y turismo' },
  { slug: 'doctora-nicaraguense-muere-en-ataque-armado-en-poptun-peten', actual: 'Doctora nicaragüense muere en ataque armado en…', nuevo: 'Doctora nicaragüense muere en ataque armado en Poptún, Petén' },
  { slug: 'estudiante-de-13-anos-muere-tras-golpe-en-escuela-de-diriomo', actual: 'Estudiante de 13 años muere tras golpe en escuela de…', nuevo: 'Estudiante de 13 años muere tras golpe en escuela de Diriomo' },
  { slug: 'nicaraguenses-mueren-en-hechos-violentos-registrados-en-costa-rica', actual: 'Nicaragüenses mueren en hechos graves registrados…', nuevo: 'Nicaragüenses mueren en hechos graves registrados en Costa Rica' },
  { slug: 'esteliana-fallece-ahogada-en-playa-de-san-sebastian-espana', actual: 'Esteliana muere ahogada en playa de San Sebastián,…', nuevo: 'Esteliana muere ahogada en playa de San Sebastián, España' },
];

const sha = s => createHash('sha256').update(String(s)).digest('hex');
const shaDoc = d => sha([d.titulo, d.resumen, d.contenido].join('\u0001'));

const corpus = JSON.parse(readFileSync('.audit/corpus.json', 'utf8'));
const bySlug = new Map(corpus.map(d => [d.slug, d.id]));

console.log(`\n=== REPARACIÓN TÍTULOS TRUNCADOS ${APPLY ? '(APLICAR)' : '(SIMULACIÓN)'} ===\n`);
const resultados = [];
for (const r of REPARACIONES) {
  const id = bySlug.get(r.slug);
  if (!id) { resultados.push({ slug: r.slug, estado: 'OMITIDO', razon: 'id no localizado' }); continue; }
  const snap = await db.collection('noticias').doc(id).get();
  if (!snap.exists) { resultados.push({ slug: r.slug, estado: 'OMITIDO', razon: 'doc inexistente' }); continue; }
  const d = snap.data();
  const base = { id, slug: r.slug, shaAntes: shaDoc(d), tituloActual: d.titulo, tituloEsperado: r.actual, tituloNuevo: r.nuevo, reparacionForense: d.reparacionForense || null };

  if (d.reparacionForense?.tituloTruncado?.aplicado) { resultados.push({ ...base, estado: 'OMITIDO', razon: 'ya procesado (guardia anti-doble)' }); continue; }
  if (d.titulo !== r.actual) { resultados.push({ ...base, estado: 'DRIFT', razon: `título difiere de la auditoría: "${String(d.titulo).slice(0, 60)}"` }); continue; }
  if (APPLY) {
    base.shaDespues = shaDoc({ ...d, titulo: r.nuevo });
    await snap.ref.update({
      titulo: r.nuevo,
      'reparacionForense.tituloTruncado': { aplicado: true, fecha: new Date().toISOString(), regla: 'titulos-truncados-N9' },
      requiresReevaluation: true,
    });
    const post = (await snap.ref.get()).data();
    base.shaDespues = shaDoc(post);
    base.estado = post.titulo === r.nuevo ? 'APLICADO+VERIFICADO' : 'ERROR-POSTLECTURA';
    resultados.push(base);
  } else {
    resultados.push({ ...base, estado: 'APLICABLE', tituloDespues: r.nuevo, shaDespues: shaDoc({ ...d, titulo: r.nuevo }) });
  }
}

const resumen = {};
for (const r of resultados) resumen[r.estado] = (resumen[r.estado] || 0) + 1;
console.log(JSON.stringify(resumen));
for (const r of resultados) {
  console.log(`${r.estado.padEnd(18)} ${r.slug}${r.estado === 'APLICABLE' || r.estado === 'APLICADO+VERIFICADO' ? ` → "${r.tituloNuevo}"` : r.razon ? ` — ${r.razon}` : ''}`);
}
mkdirSync('.audit', { recursive: true });
writeFileSync(APPLY ? '.audit/repair-titulos-truncados-backup.json' : '.audit/repair-titulos-truncados-simulacion.json',
  JSON.stringify({ fecha: new Date().toISOString(), aplicar: APPLY, total: resultados.length, resumen, resultados }, null, 2));
console.log(`\nLog: .audit/repair-titulos-truncados-${APPLY ? 'backup' : 'simulacion'}.json`);
process.exit(0);
