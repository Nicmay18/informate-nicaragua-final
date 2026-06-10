const admin = require('firebase-admin');

const serviceAccount = require('G:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function check() {
  // Buscar noticias con "Arjona" en el título
  const snap = await db.collection('noticias')
    .orderBy('fecha', 'desc')
    .limit(50)
    .get();

  const found = snap.docs.filter(d => {
    const t = (d.data().titulo || '').toLowerCase();
    return t.includes('arjona') || t.includes('aventura');
  });

  if (found.length === 0) {
    console.log('No se encontró noticia de Arjona/Aventura en las 50 más recientes.');
    console.log('\nMostrando las 10 noticias más recientes por fecha:');
    snap.docs.slice(0, 10).forEach(d => {
      const data = d.data();
      console.log(`- ${data.titulo} | cat: ${data.categoria} | fecha: ${data.fecha?.toDate?.() || data.fecha}`);
    });
    process.exit(0);
  }

  found.forEach(d => {
    const data = d.data();
    console.log('ID:', d.id);
    console.log('Título:', data.titulo);
    console.log('Categoría:', data.categoria);
    console.log('Fecha raw:', data.fecha);
    if (data.fecha?.toDate) {
      console.log('Fecha toDate:', data.fecha.toDate().toISOString());
    } else if (data.fecha?._seconds) {
      console.log('Fecha _seconds:', new Date(data.fecha._seconds * 1000).toISOString());
    }
    console.log('Publicado:', data.publicado);
    console.log('Destacada:', data.destacada);
    console.log('Vistas:', data.vistas);
    console.log('---');
  });

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
