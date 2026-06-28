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
  const doc = await db.collection('noticias').doc('MHJfaX05ygumyujBuPa5').get();
  const data = doc.data();

  console.log('=== ARTICULO ===');
  console.log('Titulo:', data.titulo);
  console.log('Categoria:', data.categoria);

  const c = (data.contenido || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Exact same logic as diagnostic script
  const esGuia = /\b(c[oó]mo|tramitar|requisitos|pasos|gu[ií]a|documentos necesarios|donde|cuanto cuesta)\b/i.test((data.titulo || '') + ' ' + c) && data.categoria === 'Nacionales';
  const tieneFuentesGuia = esGuia && /polic[ií]a nacional|migraci[oó]n|ministerio|instituci[oó]n|oficial|gobierno|reglamento|decreto|ley \d|segun el|de acuerdo con el/i.test(c);
  const tieneFuentesNoticia = /testigo|familiar|vecino|habitante|morador|comerciante|conductor|pasajero|declar[oó]|indic[oó]|dijo|mencion[oó]|precis[oó]|señal[oó]|confirm[oó]|report[oó]|versiones|segun [A-Z]|de acuerdo con [A-Z]|redes sociales|videos compartidos/i.test(c);

  console.log('Es guia?:', esGuia);
  console.log('Tiene fuentes guia?:', tieneFuentesGuia);
  console.log('Tiene fuentes noticia?:', tieneFuentesNoticia);
  console.log('TIENE FUENTES (total):', tieneFuentesGuia || tieneFuentesNoticia);

  console.log('\n=== PALABRAS BUSCADAS ===');
  const buscar = ['testigo','familiar','vecino','declaro','indico','dijo','menciono','preciso','segun','policia','ministerio','oficial','gobierno','reglamento','decreto','autoridades','indico'];
  buscar.forEach(p => {
    if (c.includes(p)) console.log('ENCONTRADO:', p);
  });

  // Buscar segun seguido de mayuscula
  const segunMatches = c.match(/segun\s+[a-záéíóúñ]/gi);
  if (segunMatches) console.log('segun + minuscula:', segunMatches);

  const segunMayus = c.match(/segun\s+[A-ZÁÉÍÓÚÑ]/gi);
  if (segunMayus) console.log('segun + MAYUSCULA:', segunMayus);

  // Buscar "de acuerdo con"
  const deAcuerdo = c.match(/de acuerdo con\s+[A-ZÁÉÍÓÚÑ]/gi);
  if (deAcuerdo) console.log('de acuerdo con:', deAcuerdo);
}

main().catch(err => { console.error(err); process.exit(1); });
