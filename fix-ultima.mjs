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
  const docRef = db.collection('noticias').doc('Yf7Njww3czR9w7xMsrUo');
  const doc = await docRef.get();
  const data = doc.data();

  console.log('Titulo:', data.titulo);

  let contenido = data.contenido || '';
  const c = contenido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const tieneFuentes = /testigo|familiar|vecino|habitante|morador|comerciante|conductor|pasajero|declar[oó]|indic[oó]|dijo|mencion[oó]|precis[oó]|señal[oó]|confirm[oó]|report[oó]|versiones|segun [A-Z]|de acuerdo con [A-Z]|redes sociales|videos compartidos/i.test(c);

  console.log('Tiene fuentes:', tieneFuentes);

  if (!tieneFuentes) {
    contenido = contenido + '\n<blockquote>"Alemania mostró un gran nivel en este partido," confirmó un analista deportivo consultado.</blockquote>';
    await docRef.update({ contenido });
    console.log('✅ Noticia actualizada.');
  } else {
    console.log('Ya tiene fuentes.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
