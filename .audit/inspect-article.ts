import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getAdminDb } from '../lib/firebase-admin';

const slug = process.argv[2];
const db = getAdminDb();

async function main() {
  const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
  if (snap.empty) { console.log('not found'); return; }
  const d = snap.docs[0].data();
  console.log('TITULO:', d.titulo);
  console.log('CATEGORIA:', d.categoria);
  console.log('AUTOR:', d.autor);
  console.log('RESUMEN:', d.resumen);
  const text = (d.contenido || '').replace(/<[^>]+>/g, ' ');
  console.log('CONTENIDO:', text.slice(0, 1500));
}

main().catch(e => console.error(e));
