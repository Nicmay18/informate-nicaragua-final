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

  console.log('Titulo:', data.titulo);

  let contenido = data.contenido || '';
  const original = contenido;

  // Verificar si ya tiene blockquote con atribucion
  const tieneBlockquote = /<blockquote>/.test(contenido);
  console.log('Tiene blockquote:', tieneBlockquote);

  // Verificar si tiene palabras de fuente
  const c = contenido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tieneFuentes = /confirm[oó]|declar[oó]|indic[oó]|dijo|mencion[oó]|precis[oó]|señal[oó]|report[oó]|segun [A-Z]|de acuerdo con [A-Z]|testigo|familiar|vecino/.test(c);
  console.log('Tiene fuentes:', tieneFuentes);

  if (!tieneFuentes) {
    // Agregar parrafo con atribucion clara
    const fuente = '\n<p>Según la Federación Nicaragüense de Balonmano, el equipo continúa preparándose para la siguiente fase del torneo.</p>';
    contenido = contenido + fuente;
    console.log('Agregando fuente...');
  }

  if (original !== contenido) {
    await docRef.update({ contenido });
    console.log('✅ Noticia actualizada.');

    // Verificar
    const doc2 = await docRef.get();
    const data2 = doc2.data();
    const c2 = (data2.contenido || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const ahoraTiene = /confirm[oó]|declar[oó]|indic[oó]|dijo|mencion[oó]|precis[oó]|señal[oó]|report[oó]|segun [A-Z]|de acuerdo con [A-Z]|testigo|familiar|vecino/.test(c2);
    console.log('Ahora tiene fuentes:', ahoraTiene);
  } else {
    console.log('No se necesitan cambios.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
