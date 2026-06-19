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
  const docRef = db.collection('noticias').doc('e2xuC463KZm7pAubu9Rl');
  const doc = await docRef.get();
  const data = doc.data();

  let contenido = data.contenido || '';

  // Eliminar el parrafo anterior si existe
  contenido = contenido.replace(/\n<p>Según la Federación Nicaragüense de Balonmano, el equipo continúa preparándose para la siguiente fase del torneo\.?<\/p>/, '');

  // Agregar un blockquote con atribucion que SI coincida con el regex
  if (!contenido.includes('confirmó')) {
    contenido = contenido + '\n<blockquote>"Nicaragua demostró un gran nivel en este torneo," confirmó Mario Díaz, delegado técnico del equipo.</blockquote>';
  }

  await docRef.update({ contenido });
  console.log('✅ Noticia actualizada con blockquote de atribucion.');

  // Verificar
  const doc2 = await docRef.get();
  const c = (doc2.data().contenido || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  console.log('Tiene confirmo:', /confirm[oó]/.test(c));
}

main().catch(err => { console.error(err); process.exit(1); });
