const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const e = path.join(process.cwd(), '.env.local');
if (fs.existsSync(e)) {
  for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
    const l2 = l.replace(/\r$/, '');
    const m = l2.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  }
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  })
});

const db = admin.firestore();
const targetSlug = 'dos-motorizados-mueren-tras-colision-en-la-bajada-de-laguna-de-apoyo';

(async () => {
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
  console.log('Total devueltos:', snap.size);
  const idx = snap.docs.findIndex(d => d.data().slug === targetSlug);
  console.log('Posicion de la nota:', idx === -1 ? 'NO ENCONTRADA' : idx + 1);
  if (idx !== -1) {
    console.log('Titulo:', snap.docs[idx].data().titulo);
    console.log('Fecha:', snap.docs[idx].data().fecha);
  }
  // Top 10 para comparar tipos de fecha
  console.log('\nTop 20 fechas y tipos:');
  snap.docs.slice(0, 20).forEach((d, i) => {
    const data = d.data();
    console.log(`${i+1}. ${d.id} | ${typeof data.fecha} | ${data.categoria} | ${data.titulo?.slice(0,40)}`);
  });
  process.exit(0);
})();
