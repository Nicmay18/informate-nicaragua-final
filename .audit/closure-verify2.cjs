const admin = require('firebase-admin');
const path = require('path');
const sa = require(path.resolve('../informate-instant-nicaragua-firebase-adminsdk-fbsvc-fa9b81a61a.json'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const out = {};

  // 1) las 2 notas "extra" (fecha más reciente)
  const recent = await db.collection('noticias').orderBy('fecha', 'desc').limit(5).get();
  out.recientes = recent.docs.map(d => {
    const x = d.data();
    return { slug: x.slug, fecha: x.fecha, estado: x.estado, autor: x.autor };
  });

  // 2) el residuo href="" — contexto del HTML alrededor
  const art = await db.collection('noticias').doc('CMo0EIdKF9E5CYTJj8H9').get();
  const c = art.data()?.contenido || '';
  const idx = c.indexOf('href=""');
  out.hrefResiduo = idx >= 0 ? { ctx: c.slice(Math.max(0, idx - 120), idx + 80), fecha: art.data()?.fecha, estado: art.data()?.estado } : null;

  // 3) campos de la cola + buscar contradicion_factual por todos los campos
  const q = await db.collection('editorial_review_queue').limit(3).get();
  out.queueSampleFields = q.docs.map(d => ({ id: d.id, keys: Object.keys(d.data()) }));
  const qAll = await db.collection('editorial_review_queue').get();
  let contradic = [];
  for (const d of qAll.docs) {
    const s = JSON.stringify(d.data()).toLowerCase() + ' ' + d.id.toLowerCase();
    if (s.includes('contradiccion')) contradic.push({ id: d.id, estado: d.data().estado || d.data().status });
  }
  out.contradiccionDocs = contradic;

  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
