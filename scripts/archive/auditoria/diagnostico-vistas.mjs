import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  console.log('=== DIAGNÓSTICO DE VISTAS ===\n');

  // 1. Verificar colección 'views'
  const viewsSnap = await db.collection('views').get();
  console.log('Documentos en colección views:', viewsSnap.size);
  let totalViewsCount = 0;
  viewsSnap.forEach(d => {
    const c = d.data().count || 0;
    totalViewsCount += c;
  });
  console.log('Total count en views:', totalViewsCount);

  // 2. Verificar campo vistas en noticias
  const noticiasSnap = await db.collection('noticias').get();
  console.log('\nNoticias totales:', noticiasSnap.size);

  let conVistas = 0;
  let sinVistas = 0;
  let totalVistasNoticias = 0;
  const topNoticias = [];

  noticiasSnap.forEach(d => {
    const data = d.data();
    const v = data.vistas || 0;
    if (v > 0) conVistas++;
    else sinVistas++;
    totalVistasNoticias += v;
    topNoticias.push({ titulo: data.titulo, slug: data.slug, vistas: v });
  });

  console.log('Noticias CON vistas:', conVistas);
  console.log('Noticias SIN vistas:', sinVistas);
  console.log('Total vistas en noticias:', totalVistasNoticias);

  // Top 10
  topNoticias.sort((a, b) => b.vistas - a.vistas);
  console.log('\nTop 10 noticias por vistas:');
  topNoticias.slice(0, 10).forEach((n, i) => {
    console.log(`  ${i + 1}. ${n.titulo} (${n.vistas})`);
  });

  // 3. Verificar últimos 5 logs de tráfico
  const trafficSnap = await db.collection('traffic_log').orderBy('timestamp', 'desc').limit(5).get();
  console.log('\nÚltimos 5 logs de tráfico:', trafficSnap.size);
  trafficSnap.forEach(d => {
    const data = d.data();
    const ts = data.timestamp?.toDate?.() || 'sin fecha';
    console.log(`  - ${data.slug} | ${data.referrer || 'directo'} | ${ts}`);
  });

  // 4. Comparar views vs noticias para los mismos slugs
  console.log('\n=== COMPARACIÓN views vs noticias ===');
  const mismosSlugs = [];
  for (const vDoc of viewsSnap.docs.slice(0, 20)) {
    const slug = vDoc.id;
    const vCount = vDoc.data().count || 0;
    const nDoc = noticiasSnap.docs.find(n => n.data().slug === slug);
    const nVistas = nDoc ? (nDoc.data().vistas || 0) : 0;
    if (vCount !== nVistas) {
      mismosSlugs.push({ slug, viewsCount: vCount, noticiasVistas: nVistas });
    }
  }

  if (mismosSlugs.length > 0) {
    console.log(`${mismosSlugs.length} slugs con desfase:`);
    mismosSlugs.forEach(m => {
      console.log(`  ${m.slug}: views=${m.viewsCount} noticias=${m.noticiasVistas}`);
    });
  } else {
    console.log('No hay desfase en los primeros 20 slugs revisados.');
  }
}

main().catch(console.error);
