// scripts/migrate-slugs.js
// Ejecutar: node scripts/migrate-slugs.js
// Requiere: npm install firebase-admin (ya instalado)
// Descarga serviceAccountKey.json desde Firebase Console →
// Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 90);
}

async function migrate() {
  const snapshot = await db.collection('noticias').get();
  const batch = db.batch();
  let count = 0;
  const slugs = new Set();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.slug && data.slug.length > 3) continue;

    let slug = generateSlug(data.titulo || 'noticia');

    if (slugs.has(slug)) {
      slug = `${slug}-${doc.id.substring(0, 6)}`;
    }
    slugs.add(slug);

    batch.update(doc.ref, { slug });
    count++;
  }

  await batch.commit();
  console.log(`✅ ${count} noticias migradas con slug`);
  process.exit(0);
}

migrate().catch(console.error);
