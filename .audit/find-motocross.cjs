const admin = require('firebase-admin');
const path = require('path');
const sa = require(path.resolve('../informate-instant-nicaragua-firebase-adminsdk-fbsvc-fa9b81a61a.json'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const snap = await db.collection('noticias').where('categoria', '==', 'Deportes').get();
  const hits = [];
  for (const d of snap.docs) {
    const x = d.data();
    const t = `${x.titulo || ''} ${x.resumen || ''}`.toLowerCase();
    if (/motocross|motocicl|enduro|automovil|rally|carrera.*moto|pista.*moto|motor/.test(t)) {
      hits.push({ id: d.id, slug: x.slug, titulo: x.titulo, estado: x.estado, resumen: (x.resumen || '').slice(0, 120) });
    }
  }
  console.log(JSON.stringify(hits, null, 1));
  console.log('total deportes:', snap.size, '| motor/motocross:', hits.length);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
