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

  console.log('Titulo:', data.titulo);
  console.log('Categoria:', data.categoria);

  const c = (data.contenido || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  console.log('\n=== PALABRAS BUSCADAS ===');
  const buscar = ['testigo','familiar','vecino','declaro','indico','dijo','menciono','preciso','senalo','confirmo','reporto','versiones','segun','redes sociales','videos compartidos','organizadores','aficionados','director tecnico','dt','entrenador','capitan','jugador','seleccion','federacion','indico que','segun el','declaro que','declaro que','menciono que','preciso que','senalado','confirmado'];
  buscar.forEach(p => {
    if (c.includes(p)) console.log('ENCONTRADO:', p);
  });

  console.log('\n=== BUSCAR "dijo" o "indico" o "segun" ===');
  const matches = c.match(/\w*dij\w*|\w*indic\w*|\w*segun\w*|\w*mencion\w*|\w*declar\w*|\w*precis\w*|\w*senal\w*|\w*confirm\w*|\w*report\w*/gi);
  if (matches) {
    [...new Set(matches)].forEach(m => console.log('  ->', m));
  } else {
    console.log('Ninguna encontrada');
  }

  console.log('\n=== CONTENIDO COMPLETO ===');
  const fs = await import('fs');
  fs.writeFileSync('balonmano-contenido.txt', data.contenido);
  console.log('Guardado en balonmano-contenido.txt');
}

main().catch(err => { console.error(err); process.exit(1); });
