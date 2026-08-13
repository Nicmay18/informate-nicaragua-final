/**
 * Test directo de conexión Firebase con FIREBASE_PRIVATE_KEY
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const l of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const l2 = l.replace(/\r$/, '');
    const m = l2.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].replace(/^["']|["']$/g, '');
      v = v.replace(/\\n/g, '\n');
      process.env[m[1]] = v;
    }
  }
}

const admin = require('firebase-admin');

const sa = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

if (sa.privateKey && sa.privateKey.includes('\\n')) {
  sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: sa.projectId,
});

const db = admin.firestore();

async function main() {
  const snap = await db.collection('noticias').limit(2).get();
  console.log('CONECTADO. Docs:', snap.size);
  for (const d of snap.docs) {
    console.log(d.id, d.data().titulo?.slice(0, 50));
  }
  process.exit(0);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
