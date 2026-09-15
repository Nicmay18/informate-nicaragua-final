// Conteo read-only de documentos en colección 'noticias' por estado.
import 'dotenv/config';
import { getAdminDb } from '../lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  const snap = await db.collection('noticias').select('estado', 'noindex', 'slug', 'publicado', 'archived').get();
  const byEstado: Record<string, number> = {};
  let noindex = 0, archived = 0, noSlug = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const e = data.estado || '(sin estado)';
    byEstado[e] = (byEstado[e] || 0) + 1;
    if (data.noindex) noindex++;
    if (data.archived) archived++;
    if (!data.slug) noSlug++;
  }
  console.log('TOTAL docs:', snap.size);
  console.log('Por estado:', JSON.stringify(byEstado));
  console.log('noindex:', noindex, '| archived:', archived, '| sin slug:', noSlug);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
