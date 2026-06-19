require('ts-node').register({ transpileOnly: true });
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

// Load service account credentials
const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
if (!fs.existsSync(credPath)) {
  console.error('Service account file not found:', credPath);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: serviceAccount.project_id });
const db = admin.firestore();

async function main() {
  const batchPath = path.join(__dirname, 'batch-data.json');
  const raw = fs.readFileSync(batchPath, 'utf-8');
  const data = JSON.parse(raw);
  const ids = Object.keys(data);
  console.log(`Updating ${ids.length} articles`);
  for (const id of ids) {
    const fields = data[id];
    try {
      await db.doc(`noticias/${id}`).update({
        ...fields,
        restauradoEn: new Date().toISOString(),
      });
      console.log(`✅ Updated ${id}`);
    } catch (e) {
      console.error(`❌ Error updating ${id}:`, e.message);
    }
  }
  console.log('Done');
}

main().catch(err => console.error('Fatal error', err));
