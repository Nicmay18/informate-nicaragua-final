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
  const backup = JSON.parse(readFileSync('e:/PROYECTO/informate-nicaragua-final/firestore-current-backup-1781106719360.json', 'utf8'));
  const snap = await db.collection('noticias').get();
  
  let enAmbos = 0;
  let soloFirestore = 0;
  let soloBackup = 0;
  let posibleDeepSeek = 0;
  let posibleOriginal = 0;
  
  for (const doc of snap.docs) {
    const id = doc.id;
    const data = doc.data();
    const contenido = data.contenido || '';
    
    if (backup[id]) {
      enAmbos++;
      const backupContenido = backup[id].contenido || '';
      // Si el contenido en Firestore es diferente al backup y tiene muchos <strong>, probablemente es DeepSeek
      if (contenido !== backupContenido) {
        const strongCount = (contenido.match(/<strong>/g) || []).length;
        const backupStrongCount = (backupContenido.match(/<strong>/g) || []).length;
        if (strongCount > backupStrongCount + 5) {
          posibleDeepSeek++;
        }
      } else {
        posibleOriginal++;
      }
    } else {
      soloFirestore++;
      // Si no está en el backup y tiene muchos <strong>, es nueva y probablemente DeepSeek
      const strongCount = (contenido.match(/<strong>/g) || []).length;
      if (strongCount > 5) posibleDeepSeek++;
    }
  }
  
  for (const id of Object.keys(backup)) {
    if (!snap.docs.find(d => d.id === id)) {
      soloBackup++;
    }
  }
  
  console.log('=== ANÁLISIS BACKUP vs FIRESTORE ===');
  console.log('Noticias en ambos (backup + Firestore):', enAmbos);
  console.log('Noticias solo en Firestore (nuevas):', soloFirestore);
  console.log('Noticias solo en backup (borradas):', soloBackup);
  console.log('Probablemente DeepSeek (muchas negritas):', posibleDeepSeek);
  console.log('Probablemente original:', posibleOriginal);
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
