/**
 * Busca noticias con noindex=true y muestra sus slugs exactos.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

function getServiceAccount() {
  const fallback = 'E:\\PROYECTO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json';
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  if (existsSync(fallback)) return JSON.parse(readFileSync(fallback, 'utf8'));
  throw new Error('Service account no encontrado');
}

async function main() {
  const sa = getServiceAccount();
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
  const db = getFirestore();

  const snap = await db.collection('noticias').where('noindex', '==', true).get();
  console.log(`Noticias con noindex=true: ${snap.size}\n`);

  for (const doc of snap.docs) {
    const d = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Slug: ${d.slug || 'SIN SLUG'}`);
    console.log(`Titulo: ${(d.titulo || 'SIN TITULO').substring(0, 70)}`);
    console.log(`Palabras: ${(d.contenido || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length}`);
    console.log('---');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
