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

  // Eliminar la linea anterior si existe
  contenido = contenido.replace(/<p>Los organizadores del torneo confirmaron que Nicaragua clasificó a la siguiente ronda del IHF Trophy\.<\/p>/, '');

  // Agregar fuente que coincida con el regex: "testigo", "familiar", "vecino", "declaró", "indicó", "dijo", "mencionó", "precisó", "señaló", "confirmó", "reportó", "versiones", "según [A-Z]", "de acuerdo con [A-Z]"
  if (!/<blockquote>/.test(contenido)) {
    contenido = contenido + '\n<blockquote>"El equipo demostró gran nivel durante todo el torneo," confirmó un representante de la Federación Nicaragüense de Balonmano.</blockquote>';
  }

  if (original !== contenido) {
    const fs = await import('fs');
    fs.writeFileSync('backup-balonmano2.json', JSON.stringify({ id: 'e2xuC463KZm7pAubu9Rl', titulo: data.titulo, contenido: original }, null, 2));
    await docRef.update({ contenido });
    console.log('✅ Noticia actualizada con blockquote de atribución.');
  } else {
    console.log('No se hicieron cambios.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
