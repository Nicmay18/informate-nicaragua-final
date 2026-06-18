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

  const c = (data.contenido || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  console.log('Titulo:', data.titulo);
  console.log('Categoria:', data.categoria);
  console.log('');

  // Verificar que palabras busca el script
  const tieneFuentesNoticia = /testigo|familiar|vecino|habitante|morador|comerciante|conductor|pasajero|declar[oó]|indic[oó]|dijo|mencion[oó]|precis[oó]|señal[oó]|confirm[oó]|report[oó]|versiones|segun [A-Z]|de acuerdo con [A-Z]|redes sociales|videos compartidos/i.test(c);
  console.log('tieneFuentesNoticia:', tieneFuentesNoticia);

  console.log('');
  const buscar = ['confirmo','confirmó','declaro','declaró','indico','indicó','dijo','menciono','mencionó','preciso','precisó','senalo','señaló','segun','testigo','familiar','vecino'];
  buscar.forEach(p => {
    if (c.includes(p)) console.log('ENCONTRADO:', p);
  });

  console.log('');
  console.log('ULTIMOS 800 chars:');
  console.log(data.contenido.substring(Math.max(0, data.contenido.length - 800)));
}

main().catch(err => { console.error(err); process.exit(1); });
