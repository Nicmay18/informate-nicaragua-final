import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'informate-instant-nicaragua-c7bc9eb4f553.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Normalizar fecha de Firestore (string ISO, Timestamp, o Date)
function normalizarFecha(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val.toDate && typeof val.toDate === 'function') return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  return String(val);
}

// Período de afectación: 12 junio 2026 → hoy
const INICIO = new Date('2026-06-12T00:00:00-06:00').toISOString();
const HOY = new Date().toISOString();

async function main() {
  console.log('==========================================');
  console.log('FASE 1: Noticias publicadas 12 jun - hoy');
  console.log(`Rango: ${INICIO.slice(0,10)} → ${HOY.slice(0,10)}`);
  console.log('==========================================\n');

  const snapshot = await db.collection('noticias').get();
  const candidatas = [];
  const conNoindexAhora = [];
  const antesDel12Jun = [];
  let fechasMuestra = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const fechaRaw = data.fecha || data.fechaPublicacion || data.createdAt || null;
    const fecha = normalizarFecha(fechaRaw);
    const noindex = data.noindex === true;

    if (!fecha) continue;

    // Muestra de tipos de fecha (primeros 5)
    if (fechasMuestra.length < 5) {
      fechasMuestra.push({ slug: data.slug || doc.id, tipo: typeof fechaRaw, valor: String(fechaRaw).slice(0,60), normalizado: fecha?.slice(0,10) });
    }

    if (noindex) {
      conNoindexAhora.push({ slug: data.slug || doc.id, titulo: data.titulo, fecha });
    } else if (fecha >= INICIO && fecha <= HOY) {
      candidatas.push({
        id: doc.id,
        slug: data.slug || doc.id,
        titulo: data.titulo || '(sin título)',
        categoria: data.categoria || 'General',
        fecha,
        vistas: data.vistas || 0,
        noindexActual: false,
      });
    } else {
      antesDel12Jun.push({ slug: data.slug || doc.id, fecha: fecha.slice(0,10) });
    }
  }

  // Priorizar: más recientes, más vistas, Sucesos/Nacionales
  candidatas.sort((a, b) => {
    const catScore = (c) => (c === 'Sucesos' || c === 'Nacionales') ? 10000 : 0;
    const scoreA = catScore(a.categoria) + (a.vistas || 0) + new Date(a.fecha).getTime() / 1e6;
    const scoreB = catScore(b.categoria) + (b.vistas || 0) + new Date(b.fecha).getTime() / 1e6;
    return scoreB - scoreA;
  });

  console.log('Muestra de fechas en Firestore:');
  fechasMuestra.forEach(f => console.log(`  ${f.slug}: tipo=${f.tipo} | valor=${f.valor} | normalizado=${f.normalizado}`));

  console.log(`\nNoticias en Firestore: ${snapshot.size}`);
  console.log(`Con NOINDEX activo ahora (URGENTE): ${conNoindexAhora.length}`);
  console.log(`Publicadas 12 jun - hoy (candidatas): ${candidatas.length}`);
  console.log(`Antes del 12 jun (ya indexadas): ${antesDel12Jun.length}\n`);

  if (conNoindexAhora.length > 0) {
    console.log('=== URGENTE: Estas tienen noindex=TRUE ahora ===');
    conNoindexAhora.forEach(n => console.log(`  [NOINDEX] ${n.slug} | ${n.fecha}`));
    console.log('');
  }

  if (candidatas.length === 0) {
    console.log('NO hay noticias en el rango 12 jun - hoy.');
    console.log('Rango de fechas encontradas:');
    const fechasUnicas = [...new Set(antesDel12Jun.map(n => n.fecha))].sort();
    console.log(`  Primera: ${fechasUnicas[0]} | Última: ${fechasUnicas[fechasUnicas.length-1]}`);
    console.log('\nEsto puede significar:');
    console.log('  a) Las fechas están en otro campo (createdAt, publishedAt)');
    console.log('  b) Las noticias recientes no tienen campo fecha');
    console.log('  c) Todas las noticias son del período anterior al 12 jun');
    return;
  }

  console.log(`=== TOP 30 candidatas a re-indexar (de ${candidatas.length}) ===`);
  candidatas.slice(0, 30).forEach((n, i) => {
    console.log(`${String(i+1).padStart(2)}. [${n.categoria}] ${n.slug} | Vistas:${n.vistas} | ${n.fecha.slice(0,10)}`);
  });

  // CSV completo para spreadsheet
  const csvLines = [
    'slug,titulo,categoria,fecha,vistas,url,prioridad,estado_gsc,solicitud_indexacion,indexado_fecha',
    ...candidatas.map((n, i) => {
      const url = `https://nicaraguainformate.com/noticias/${n.slug}`;
      const prioridad = i < 20 ? 'ALTA' : (i < 50 ? 'MEDIA' : 'BAJA');
      return `${n.slug},"${(n.titulo || '').replace(/"/g, '""')}",${n.categoria},${n.fecha},${n.vistas},${url},${prioridad},,`;
    }),
  ];

  const csvPath = join(__dirname, 'recuperacion-seo-batch.csv');
  writeFileSync(csvPath, csvLines.join('\n'), 'utf8');

  // Batch para 100/día (límite GSC)
  const batch100 = candidatas.slice(0, 100);
  const batchPath = join(__dirname, 'recuperacion-dia1-urls.txt');
  writeFileSync(batchPath, batch100.map(n => `https://nicaraguainformate.com/noticias/${n.slug}`).join('\n'), 'utf8');

  console.log(`\nCSV completo: ${csvPath}`);
  console.log(`URLs día 1 (${batch100.length}): ${batchPath}`);
  console.log(`\nPara solicitar indexación manual en GSC:`);
  console.log(`1. Copiar las URLs de recuperacion-dia1-urls.txt`);
  console.log(`2. Ir a Google Search Console → Inspeccionar URL`);
  console.log(`3. Pegar cada URL → "Solicitar indexación"`);
  console.log(`4. Máximo 100 por día`);
}

main().catch(console.error);
