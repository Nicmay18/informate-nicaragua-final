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
  const doc = await db.collection('noticias').doc('iowQzBgiwSPPXCC4EsJD').get();
  const data = doc.data();

  console.log('=== NOTICIA iowQzBgiwSPPXCC4EsJD ===');
  console.log('Titulo:', data.titulo);
  console.log('Categoria:', data.categoria);
  console.log('Nivel:', data.nivel || 'sin nivel');

  const c = (data.contenido || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esGuia = /\b(c[oó]mo|tramitar|requisitos|pasos|gu[ií]a|documentos necesarios|donde|cuanto cuesta)\b/i.test((data.titulo || '') + ' ' + c);
  console.log('Es guia?:', esGuia);

  const tieneFuentesGuia = esGuia && /polic[ií]a nacional|migraci[oó]n|ministerio|instituci[oó]n|oficial|gobierno|reglamento|decreto|ley \d|segun el|de acuerdo con el/i.test(c);
  console.log('Fuentes guia:', tieneFuentesGuia);

  // Buscar si hay alguna referencia oficial
  const oficiales = ['policía nacional', 'ministerio', 'gobierno', 'reglamento', 'decreto', 'ley ', 'institución', 'oficial'];
  oficiales.forEach(p => {
    if (c.includes(p)) console.log('ENCONTRADO:', p);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
