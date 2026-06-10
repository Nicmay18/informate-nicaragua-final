const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load service account credentials
const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
if (!fs.existsSync(credPath)) {
  console.error('Service account file not found:', credPath);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Output path
const batchPath = path.join(__dirname, 'batch-data.json');

async function main() {
  console.log('Reading all documents from Firestore...');
  const snapshot = await db.collection('noticias').get();
  const batchData = {};

  snapshot.forEach(doc => {
    const id = doc.id;
    const data = doc.data();

    // Exportar todos los campos excepto id
    batchData[id] = data;
  });

  fs.writeFileSync(batchPath, JSON.stringify(batchData, null, 2), 'utf-8');
  console.log(`Exported ${snapshot.size} documents to batch-data.json`);
}

main().catch(err => console.error('Fatal error', err));
