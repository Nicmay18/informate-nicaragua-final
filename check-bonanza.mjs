import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: 'e:/PROYECTO/informate-nicaragua-final/.env.local' });

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }
  if (privateKeyRaw && projectId && clientEmail) {
    const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return getFirestore();
  }
  console.error('❌ No hay credenciales Firebase');
  process.exit(1);
}

const db = initDb();

async function main() {
  const snap = await db.collection('noticias').get();
  
  let bonanzaFirestore = null;
  let bonanzaId = null;
  
  for (const doc of snap.docs) {
    const t = doc.data().titulo || '';
    if (t.includes('Bonanza') && t.includes('motorizado')) {
      bonanzaFirestore = doc.data();
      bonanzaId = doc.id;
      break;
    }
  }
  
  if (!bonanzaFirestore) {
    console.log('No encontrada en Firestore');
    process.exit(1);
  }
  
  const backup = JSON.parse(readFileSync('e:/PROYECTO/informate-nicaragua-final/firestore-current-backup-1781106719360.json', 'utf8'));
  const bonanzaBackup = backup[bonanzaId];
  
  console.log('=== NOTICIA BONANZA ===');
  console.log('ID:', bonanzaId);
  console.log('\n--- FIRESTORE (actual) ---');
  console.log('Titulo:', bonanzaFirestore.titulo);
  console.log('Contenido length:', (bonanzaFirestore.contenido || '').length);
  console.log('Tiene <strong>:', (bonanzaFirestore.contenido || '').includes('<strong>'));
  console.log('Preview:', (bonanzaFirestore.contenido || '').substring(0, 300).replace(/\n/g, ' '));
  
  if (bonanzaBackup) {
    console.log('\n--- BACKUP 12 JUNIO ---');
    console.log('Titulo:', bonanzaBackup.titulo);
    console.log('Contenido length:', (bonanzaBackup.contenido || '').length);
    console.log('Tiene <strong>:', (bonanzaBackup.contenido || '').includes('<strong>'));
    console.log('Son iguales?:', bonanzaFirestore.contenido === bonanzaBackup.contenido);
  } else {
    console.log('\n--- NO ENCONTRADA EN BACKUP ---');
  }
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
