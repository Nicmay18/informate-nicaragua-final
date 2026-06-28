const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load service account credentials (same as inject_batch.js)
const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
if (!fs.existsSync(credPath)) {
  console.error('Service account file not found:', credPath);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Paths
const batchPath = path.join(__dirname, 'batch-data.json');

// Load existing batch-data.json or start empty
let batchData = {};
if (fs.existsSync(batchPath)) {
  try {
    batchData = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  } catch (e) {
    console.error('Error parsing existing batch-data.json, starting fresh');
    batchData = {};
  }
}

// Helper to create placeholder ORO content for a given title
function createPlaceholder(title) {
  const lead = `Lead de 40 palabras que incluye nombre, edad, qué ocurrió, cuándo y dónde. ${title}`;
  const body = `<h2>Lead</h2><p>${lead}</p><h2>Desarrollo</h2><p>Contenido ORO genérico para la noticia. Se mantiene estilo periodístico, sin relleno emocional.</p>`;
  return {
    titulo: title,
    contenido: body,
  };
}

async function main() {
  const snapshot = await db.collection('noticias').get();
  let added = 0;
  snapshot.forEach(doc => {
    const id = doc.id;
    if (!batchData[id]) {
      const data = doc.data();
      const title = data.titulo || `Noticia ${id}`;
      batchData[id] = createPlaceholder(title);
      added++;
    }
  });
  fs.writeFileSync(batchPath, JSON.stringify(batchData, null, 2), 'utf-8');
  console.log(`Se añadieron ${added} entradas al batch-data.json (placeholders).`);
}

main().catch(err => console.error('Fatal error', err));
