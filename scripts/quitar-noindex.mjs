/**
 * Quita noindex=true de noticias especificas para que Google las indexe.
 * Uso (PowerShell):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "E:\PROYECTO\informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json"
 *   node scripts/quitar-noindex.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

function getServiceAccount() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  const fallback = 'E:\\PROYECTO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json';
  if (existsSync(fallback)) return JSON.parse(readFileSync(fallback, 'utf8'));
  throw new Error('Service account no encontrado. Seteá GOOGLE_APPLICATION_CREDENTIALS.');
}

const SLUGS_A_CORREGIR = [
  'accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte-mplrwih2',
  'fin-de-semana-deja-ocho-fallecidos-en-accidentes-viales-mq5g5h8x',
];

async function main() {
  const sa = getServiceAccount();
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
  const db = getFirestore();

  for (const slug of SLUGS_A_CORREGIR) {
    const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
    if (snap.empty) {
      console.log(`❌ No encontrada: ${slug}`);
      continue;
    }
    const doc = snap.docs[0];
    const data = doc.data();

    if (data.noindex === true) {
      await doc.ref.update({ noindex: false });
      console.log(`✅ noindex removido: ${slug} (${doc.id})`);
    } else {
      console.log(`⏭️ Sin noindex: ${slug} (${doc.id})`);
    }
  }

  console.log('\nListo. Hace redeploy en Vercel para que el frontend sirva los meta tags actualizados.');
}

main().catch(e => { console.error(e); process.exit(1); });
