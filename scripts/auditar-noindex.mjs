/**
 * Script de auditoria: lista todas las noticias con noindex=true en Firestore.
 * Uso (PowerShell):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "G:\RESPALDO\...json"
 *   node scripts/auditar-noindex.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

function getServiceAccount() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    return JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
  }
  const fallback = 'g:\\RESPALDO\\informate-nicaragua-final\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json';
  if (existsSync(fallback)) return JSON.parse(readFileSync(fallback, 'utf8'));
  throw new Error('No se encontro service account');
}

async function main() {
  const sa = getServiceAccount();
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
  const db = getFirestore();

  const snap = await db.collection('noticias').get();
  console.log(`Total noticias: ${snap.size}\n`);

  const noindexList = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.noindex === true) {
      const palabras = (d.contenido || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
      noindexList.push({
        id: doc.id,
        slug: d.slug || doc.id,
        titulo: (d.titulo || 'SIN TITULO').substring(0, 60),
        palabras,
        categoria: d.categoria || 'General',
        fecha: d.fecha?.toDate?.() ? d.fecha.toDate().toISOString().slice(0, 10) : (d.fecha || 'N/A'),
      });
    }
  }

  console.log(`Noticias con noindex=true: ${noindexList.length}\n`);
  console.table(noindexList);

  const thin = noindexList.filter(n => n.palabras < 400);
  console.log(`\nDe esas, ${thin.length} tienen <400 palabras (thin content).`);
  console.log('Si queres indexarlas, expandi el contenido y quita el campo noindex desde el panel o Firebase.`');
}

main().catch(e => { console.error(e); process.exit(1); });
