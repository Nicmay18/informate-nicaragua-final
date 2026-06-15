import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const sa = JSON.parse(fs.readFileSync('scripts/firebase-admin-key.json'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

function fmt(ts) {
  if (!ts) return 'sin fecha';
  if (ts.toDate) return ts.toDate().toLocaleString('es-NI');
  if (ts._seconds) return new Date(ts._seconds * 1000).toLocaleString('es-NI');
  if (typeof ts === 'string') return ts;
  return String(ts);
}

(async () => {
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => {
    const data = d.data();
    docs.push({
      id: d.id,
      titulo: data.titulo,
      actualizado: data.fechaActualizacion,
      contenido: (data.contenido || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });
  });

  // Ordenar por fecha de actualización (más reciente primero)
  docs.sort((a, b) => {
    const ta = a.actualizado?._seconds || (a.actualizado?.toDate ? a.actualizado.toDate().getTime()/1000 : 0);
    const tb = b.actualizado?._seconds || (b.actualizado?.toDate ? b.actualizado.toDate().getTime()/1000 : 0);
    return tb - ta;
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('LAS 15 NOTICIAS EDITADAS MÁS RECIENTEMENTE');
  console.log('(si ves TUS correcciones manuales aquí con fecha de hoy ~9am, tu trabajo está intacto)');
  console.log('═══════════════════════════════════════════════════════\n');

  docs.slice(0, 15).forEach((d, i) => {
    console.log(`${i+1}. ${(d.titulo||'').substring(0,55)}`);
    console.log(`   Última edición: ${fmt(d.actualizado)}`);
    console.log(`   Inicio del texto: "${d.contenido.substring(0, 180)}..."`);
    console.log('');
  });
})().then(() => process.exit(0));
