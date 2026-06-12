// scripts/auditar-indexacion.mjs
// Verifica palabras y noindex de las noticias reportadas como "Descubiertas sin indexar"
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(
  (await import('../informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json', { assert: { type: 'json' } })).default
);
initializeApp({ credential: cert(serviceAccount), projectId: 'informate-instant-nicaragua' });
const db = getFirestore();

// Slugs a verificar (de Search Console "Descubiertas sin indexar" y "Excluida por noindex")
const SLUGS_TO_CHECK = [
  // Descubiertas sin indexar
  'accidente-de-moto-en-puente-muco-deja-investigacion-abierta',
  'accidente-de-transito-en-san-ramon-deja-dos-heridos',
  'amgen-alertas-por-tavneos-tras-investigacion-de-seguridad',
  // Excluida por noindex (CRÍTICO — verificar si es error)
  'kfc-anuncia-apertura-de-sus-primeros-restaurantes-en-managua-mp8ojs8n',
  'colision-en-puente-muco-deja-un-fallecido-y-un-herido-mp51i7ze',
  'tragedia-en-ee-uu-joven-de-rio-san-juan-muere-en-accidente-mop68q2t',
];

function countWords(html) {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ');
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

async function main() {
  console.log('🔍 AUDITORÍA FORENSE — Noticias reportadas por Search Console\n');
  const results = [];

  for (const slug of SLUGS_TO_CHECK) {
    try {
      const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
      if (snap.empty) {
        results.push({ slug, estado: '❌ NO ENCONTRADA EN FIRESTORE', palabras: 0, noindex: null });
        continue;
      }
      const data = snap.docs[0].data();
      const palabras = countWords(data.contenido || '');
      const noindex = data.noindex === true;
      const estado = noindex ? '🔴 NOINDEX=TRUE' : palabras < 400 ? '🟡 THIN CONTENT' : '🟢 OK';
      results.push({ slug, estado, palabras, noindex, titulo: data.titulo || 'Sin título' });
    } catch (err) {
      results.push({ slug, estado: `❌ ERROR: ${err.message}`, palabras: 0, noindex: null });
    }
  }

  console.table(results.map((r) => ({
    Slug: r.slug.substring(0, 50),
    Estado: r.estado,
    Palabras: r.palabras,
    Noindex: r.noindex === true ? 'SÍ' : r.noindex === false ? 'NO' : 'N/A',
    Título: r.titulo ? r.titulo.substring(0, 40) : '',
  })));

  // Resumen crítico
  const kfc = results.find((r) => r.slug.includes('kfc'));
  if (kfc && kfc.noindex === true) {
    console.log('\n🚨🚨🚨 ALERTA CRÍTICA 🚨🚨🚨');
    console.log('El artículo KFC (tu #1 en tráfico con 82 clics) tiene noindex=true');
    console.log('Esto bloquea que Google lo muestre en resultados de búsqueda.');
    console.log('ACCION URGENTE: Quitar noindex=true de este documento en Firestore.');
  }

  const thinCount = results.filter((r) => r.palabras > 0 && r.palabras < 400 && !r.noindex).length;
  if (thinCount > 0) {
    console.log(`\n⚠️ ${thinCount} artículos son thin content (<400 palabras) y NO tienen noindex`);
    console.log('Ejecutar: node scripts/desindexar-thin-content.mjs para marcarlos.');
  }
}

main().catch(console.error);
