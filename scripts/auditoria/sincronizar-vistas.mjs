import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  console.log('🔄 Sincronizando vistas de colección views → noticias.vistas\n');

  const viewsSnap = await db.collection('views').get();
  const noticiasSnap = await db.collection('noticias').get();

  // Crear mapa slug → vistas de views
  const viewsMap = new Map();
  viewsSnap.forEach(d => {
    viewsMap.set(d.id, d.data().count || 0);
  });

  // Crear mapa slug → noticiaRef
  const noticiasMap = new Map();
  noticiasSnap.forEach(d => {
    const data = d.data();
    if (data.slug) {
      noticiasMap.set(data.slug, { ref: d.ref, id: d.id, titulo: data.titulo });
    }
  });

  let sincronizadas = 0;
  let noEncontradas = 0;

  for (const [slug, count] of viewsMap.entries()) {
    const noticia = noticiasMap.get(slug);
    if (noticia) {
      await noticia.ref.update({
        vistas: count,
        actualizadoEn: new Date(),
      });
      console.log(`✅ ${noticia.titulo.substring(0, 60)} → ${count} vistas`);
      sincronizadas++;
    } else {
      console.log(`⚠️  Slug no encontrado en noticias: ${slug}`);
      noEncontradas++;
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Sincronizadas: ${sincronizadas}`);
  console.log(`No encontradas: ${noEncontradas}`);
  console.log(`Total en views: ${viewsSnap.size}`);
}

main().catch(console.error);
