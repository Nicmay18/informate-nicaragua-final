import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Patrones de IA a eliminar
const PATRONES_IA = [
  // H2 + contenido completo de secciones "Contexto..."
  /<h2[^>]*>\s*Contexto[\s\S]*?<\/h2>\s*(?:<p>[\s\S]*?<\/p>\s*)*/gi,
  // También en minúscula si no tiene H2
  /<h2[^>]*>\s*contexto[\s\S]*?<\/h2>\s*(?:<p>[\s\S]*?<\/p>\s*)*/gi,
  // Variantes comunes
  /<h2[^>]*>\s*Contexto de seguridad[\s\S]*?<\/h2>\s*(?:<p>[\s\S]*?<\/p>\s*)*/gi,
  /<h2[^>]*>\s*Contexto de seguridad en la zona[\s\S]*?<\/h2>\s*(?:<p>[\s\S]*?<\/p>\s*)*/gi,
  /<h2[^>]*>\s*Contexto de seguridad en [^<]+<\/h2>\s*(?:<p>[\s\S]*?<\/p>\s*)*/gi,
  /<h2[^>]*>\s*Protocolos de respuesta institucional[\s\S]*?<\/h2>\s*(?:<p>[\s\S]*?<\/p>\s*)*/gi,
  /<h2[^>]*>\s*Recursos útiles y prevención[\s\S]*?<\/h2>\s*(?:<p>[\s\S]*?<\/p>\s*)*/gi,
  /<h2[^>]*>\s*Consejos de prevención[\s\S]*?<\/h2>\s*(?:<p>[\s\S]*?<\/p>\s*)*/gi,
  /<h2[^>]*>\s*Autoridades mantienen investigaciones[\s\S]*?<\/h2>\s*(?:<p>[\s\S]*?<\/p>\s*)*/gi,
  // Citas genéricas
  /De acuerdo con reportes locales verificados por este medio[\s\S]*?coinciden con la cronología de los hechos\.?/gi,
  /En relación a lo ocurrido, especialistas señalaron[\s\S]*?comprender su impacto\.?/gi,
  /Fuentes cercanas al lugar de los hechos confirmaron[\s\S]*?nota periodística\.?/gi,
  /Un vocero local manifestó respecto a la situación[\s\S]*?manera oportuna a la ciudadanía\.?/gi,
];

function limpiarContenido(contenido) {
  let limpio = contenido;

  // 1. Eliminar patrones IA completos (H2 + párrafos)
  for (const regex of PATRONES_IA) {
    limpio = limpio.replace(regex, '');
  }

  // 2. Eliminar la palabra "contexto" suelta en texto plano (sin tags)
  limpio = limpio.replace(/\b[Cc]ontexto\b[^.]*\./g, '');
  limpio = limpio.replace(/\b[Cc]ontexto\b/g, '');

  // 3. Limpiar espacios múltiples
  limpio = limpio.replace(/\n{3,}/g, '\n\n').trim();
  limpio = limpio.replace(/<p>\s*<\/p>/g, '');
  limpio = limpio.replace(/\n\s*\n\s*\n/g, '\n\n');

  return limpio;
}

async function main() {
  const snapshot = await db.collection('noticias').get();
  const afectadas = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const contenido = data.contenido || '';
    const tieneContexto = /\b[Cc]ontexto\b/.test(contenido);
    if (tieneContexto) {
      afectadas.push({ id: doc.id, titulo: data.titulo, slug: data.slug, contenido });
    }
  }

  console.log(`🧹 ${afectadas.length} noticias contienen "contexto" (patrón de IA)\n`);

  const resultados = [];
  for (const n of afectadas) {
    const limpio = limpiarContenido(n.contenido);
    const palabrasAntes = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
    const palabrasDespues = limpio.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;

    await db.collection('noticias').doc(n.id).update({
      contenido: limpio,
      actualizadoEn: new Date(),
      notaLimpieza: 'Eliminados patrones de IA: contexto, protocolos genéricos, citas genéricas',
    });

    resultados.push({
      titulo: n.titulo,
      slug: n.slug,
      palabrasAntes,
      palabrasDespues,
      reduccion: palabrasAntes - palabrasDespues,
    });

    console.log(`✅ ${n.titulo}`);
    console.log(`   Palabras: ${palabrasAntes} → ${palabrasDespues} (eliminadas: ${palabrasAntes - palabrasDespues})`);
  }

  console.log('\n=== RESUMEN ===');
  console.log(`Noticias limpiadas: ${resultados.length}`);
  console.log(`Palabras eliminadas: ${resultados.reduce((s, r) => s + r.reduccion, 0)}`);
}

main().catch(console.error);
