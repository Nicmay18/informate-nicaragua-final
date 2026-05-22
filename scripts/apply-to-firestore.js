const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('G:/RESPALDO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function main() {
  try {
    const preview = JSON.parse(fs.readFileSync(path.join(__dirname, 'title-matches-preview.json'), 'utf8'));
    const matches = preview.matches;

    console.log(`Actualizando ${matches.length} noticias en Firestore...\n`);

    // Actualizar en batches de 10 para no saturar
    const batchSize = 10;
    let updated = 0;

    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = db.batch();
      const chunk = matches.slice(i, i + batchSize);

      for (const match of chunk) {
        const ref = db.collection('noticias').doc(match.id);
        batch.update(ref, { titulo: match.newTitle });
      }

      await batch.commit();
      updated += chunk.length;
      console.log(`✓ Actualizados ${updated}/${matches.length}`);

      // Pequeña pausa entre batches
      if (i + batchSize < matches.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log('\n✅ Todos los títulos actualizados exitosamente en Firestore.');
    console.log(`Total: ${updated} noticias`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main();
