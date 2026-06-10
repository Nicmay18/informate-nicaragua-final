const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
if (!fs.existsSync(credPath)) {
  console.error('Service account file not found:', credPath);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log('Exporting full noticias collection...');
  const snapshot = await db.collection('noticias').get();
  const data = {};
  
  snapshot.forEach(doc => {
    data[doc.id] = doc.data();
  });
  
  const outPath = path.join(__dirname, 'firestore-current-backup-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Exported ${snapshot.size} documents to ${outPath}`);
  
  // Also save a readable summary
  const summary = Object.entries(data).map(([id, fields]) => ({
    id,
    titulo: fields.titulo || '',
    hasContenido: !!(fields.contenido && fields.contenido.length > 100),
    contenidoLength: fields.contenido ? fields.contenido.length : 0,
    hasContenidoHtml: !!fields.contenidoHtml,
    categoria: fields.categoria || '',
    fechaPublicacion: fields.fechaPublicacion || '',
  }));
  
  const summaryPath = path.join(__dirname, 'firestore-summary-' + Date.now() + '.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`Summary saved to ${summaryPath}`);
}

main().catch(err => console.error('Fatal error', err));
