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

const CORTE_INICIO = new Date('2026-06-12T00:00:00-06:00');
const CORTE_FIN = new Date(); // hoy

async function main() {
  console.log('==========================================');
  console.log('FASE 1: IDENTIFICACIÓN — Noticias con noindex');
  console.log(`Rango: ${CORTE_INICIO.toISOString()} → ${CORTE_FIN.toISOString()}`);
  console.log('==========================================\n');

  const snapshot = await db.collection('noticias').get();
  const noticiasConNoindex = [];
  const noticiasLimpias = [];
  const noticiasSinCampo = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const noindex = data.noindex === true;
    const fecha = data.fecha || '';
    const fechaPub = new Date(fecha);

    // Verificar si tiene lastNoindexDate o historial
    const lastNoindex = data.lastNoindexDate || data.noindexFecha || null;
    
    if (noindex) {
      noticiasConNoindex.push({
        id: doc.id,
        slug: data.slug || doc.id,
        titulo: data.titulo || '(sin título)',
        categoria: data.categoria || 'General',
        fecha: fecha,
        vistas: data.vistas || 0,
        lastNoindexDate: lastNoindex,
      });
    } else if (lastNoindex) {
      // Tenía noindex pero ahora está limpia — candidata a re-indexar
      const lastNoindexDate = new Date(lastNoindex);
      if (lastNoindexDate >= CORTE_INICIO && lastNoindexDate <= CORTE_FIN) {
        noticiasLimpias.push({
          id: doc.id,
          slug: data.slug || doc.id,
          titulo: data.titulo || '(sin título)',
          categoria: data.categoria || 'General',
          fecha: fecha,
          vistas: data.vistas || 0,
          lastNoindexDate: lastNoindex,
          limpiaDesde: data.fechaActualizacion || data.fecha || 'desconocida',
        });
      }
    } else {
      noticiasSinCampo.push({
        id: doc.id,
        slug: data.slug || doc.id,
        titulo: data.titulo || '(sin título)',
        categoria: data.categoria || 'General',
        fecha: fecha,
        vistas: data.vistas || 0,
      });
    }
  }

  console.log(`Total noticias en Firestore: ${snapshot.size}`);
  console.log(`Con noindex=TRUE ahora: ${noticiasConNoindex.length}`);
  console.log(`Con noindex previo (12 jun - hoy): ${noticiasLimpias.length}`);
  console.log(`Sin historial de noindex: ${noticiasSinCampo.length}\n`);

  if (noticiasConNoindex.length > 0) {
    console.log('--- URGENTE: Noticias CON noindex activo ---');
    noticiasConNoindex.forEach(n => {
      console.log(`  [${n.categoria}] ${n.slug} | Vistas: ${n.vistas}`);
    });
    console.log('');
  }

  // Priorizar noticias limpias: más vistas, Sucesos/Nacionales, más recientes
  noticiasLimpias.sort((a, b) => {
    const catScore = (c) => (c === 'Sucesos' || c === 'Nacionales') ? 1000 : 0;
    const scoreA = (a.vistas || 0) + catScore(a.categoria) + (new Date(a.fecha).getTime() / 1e9);
    const scoreB = (b.vistas || 0) + catScore(b.categoria) + (new Date(b.fecha).getTime() / 1e9);
    return scoreB - scoreA;
  });

  console.log('--- TOP 20 noticias para re-indexar (priorizadas) ---');
  const top20 = noticiasLimpias.slice(0, 20);
  top20.forEach((n, i) => {
    console.log(`${String(i+1).padStart(2)}. [${n.categoria}] ${n.slug} | Vistas: ${n.vistas} | Último noindex: ${n.lastNoindexDate || 'N/A'}`);
  });

  // Guardar CSV completo para spreadsheet
  const csvLines = [
    'slug,titulo,categoria,fecha,vistas,lastNoindexDate,prioridad,url',
    ...noticiasLimpias.map(n => {
      const url = `https://nicaraguainformate.com/noticias/${n.slug}`;
      const prioridad = (n.categoria === 'Sucesos' || n.categoria === 'Nacionales') ? 'ALTA' : 'MEDIA';
      return `${n.slug},"${(n.titulo || '').replace(/"/g, '""')}",${n.categoria},${n.fecha},${n.vistas},${n.lastNoindexDate || ''},${prioridad},${url}`;
    }),
  ];

  const csvPath = join(__dirname, 'recuperacion-seo.csv');
  writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
  console.log(`\nCSV guardado en: ${csvPath}`);
  console.log(`Total candidatas a re-indexar: ${noticiasLimpias.length}`);
}

main().catch(console.error);
