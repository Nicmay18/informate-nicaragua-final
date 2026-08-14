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
const slug = 'dos-motorizados-mueren-tras-colision-en-la-bajada-de-laguna-de-apoyo';

(async () => {
  const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
  if (snap.empty) { console.log('NO ENCONTRADO'); process.exit(0); }
  const d = snap.docs[0].data();
  console.log('nivel:', d.nivel);
  console.log('nivelScore:', d.nivelScore);
  console.log('nivelFecha:', d.nivelFecha);
  console.log('scoreMeni:', d.scoreMeni);
  console.log('calificacion:', d.calificacion);
  console.log('aprobadoMeni:', d.aprobadoMeni);
  console.log('publicado:', d.publicado);
  console.log('estado:', d.estado);
  process.exit(0);
})();
