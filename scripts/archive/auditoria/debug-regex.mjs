import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config({ path: '.env.local' });

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

async function main() {
  const db = initFirebase();
  const doc = await db.collection('noticias').doc('e2xuC463KZm7pAubu9Rl').get();
  const data = doc.data();

  const contenido = data.contenido || '';
  const c = contenido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  console.log('Contenido length:', contenido.length);
  console.log('');

  // Buscar "segun" en el contenido
  const segunIdx = c.indexOf('segun');
  console.log('Index of segun:', segunIdx);
  if (segunIdx >= 0) {
    console.log('Context:', c.substring(segunIdx, segunIdx + 50));
  }

  // Probar regex individualmente
  console.log('');
  console.log('Regex tests:');
  console.log('segun [A-Z]:', /segun [A-Z]/.test(c));
  console.log('segun [a-z]:', /segun [a-z]/.test(c));
  console.log('confirmo:', /confirm[oó]/.test(c));
  console.log('declaro:', /declar[oó]/.test(c));
  console.log('indico:', /indic[oó]/.test(c));
  console.log('dijo:', /dijo/.test(c));

  // Ver si tiene la frase que agregamos
  console.log('');
  console.log('Tiene "federación":', c.includes('federacion'));
  console.log('Tiene "nicaragüense":', c.includes('nicaraguense'));

  // Ultimos 200 chars
  console.log('');
  console.log('Ultimos 200 chars:');
  console.log(contenido.substring(contenido.length - 200));
}

main().catch(err => { console.error(err); process.exit(1); });
