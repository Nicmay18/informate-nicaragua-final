const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccount = require('G:/RESPALDO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function main() {
  try {
    const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
    
    const noticias = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      noticias.push({
        id: doc.id,
        slug: data.slug || '',
        titulo: data.titulo || '',
        fecha: data.fecha || '',
      });
    });

    // Guardar en JSON para revisión
    fs.writeFileSync(
      path.join(__dirname, 'current-titles.json'),
      JSON.stringify(noticias, null, 2)
    );

    console.log(`Extraídas ${noticias.length} noticias`);
    console.log('\nPrimeras 20 noticias:');
    noticias.slice(0, 20).forEach((n, i) => {
      console.log(`${i + 1}. [${n.id}] ${n.titulo.substring(0, 70)}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main();
