/**
 * FORENSIC GROUND TRUTH — READ ONLY
 * Verifica si scoreCalidad existe realmente en Firestore noticias collection
 * o si está ausente (lo que debería producir scoreMeni = null con el patch)
 *
 * Uso: npx tsx scripts/forensic-ground-truth.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const { getAdminDb } = await import('@/lib/firebase-admin');
  const db = getAdminDb();

  console.log('\n' + '='.repeat(80));
  console.log('  FORENSIC GROUND TRUTH — Firestore noticias collection');
  console.log('  Timestamp:', new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  // Leer 10 documentos de noticias para ver si scoreCalidad existe
  const noticiasSnap = await db.collection('noticias').limit(10).get();
  console.log(`Total noticias leídas (muestra): ${noticiasSnap.size}\n`);

  for (const doc of noticiasSnap.docs) {
    const data = doc.data();
    const hasScoreCalidad = 'scoreCalidad' in data;
    const scoreCalidadValue = data.scoreCalidad;
    const hasScoreMeni = 'scoreMeni' in data;
    const scoreMeniValue = data.scoreMeni;

    console.log(`  slug: ${data.slug || doc.id}`);
    console.log(`    scoreCalidad field exists: ${hasScoreCalidad}`);
    console.log(`    scoreCalidad value: ${scoreCalidadValue}`);
    console.log(`    scoreMeni field exists: ${hasScoreMeni}`);
    console.log(`    scoreMeni value: ${scoreMeniValue}`);
    console.log(`    palabras: ${data.palabras || 'N/A'}`);
    console.log('');
  }

  // Contar totales de scoreCalidad en todas las noticias
  console.log('─'.repeat(60));
  console.log('  Contando scoreCalidad en TODAS las noticias...');
  console.log('─'.repeat(60));

  const allNoticias = await db.collection('noticias').get();
  let hasScoreCalidad = 0;
  let noScoreCalidad = 0;
  let scoreCalidadNull = 0;
  let scoreCalidadZero = 0;
  let scoreCalidadPositive = 0;
  let scoreCalidadUndefined = 0;

  for (const doc of allNoticias.docs) {
    const data = doc.data();
    if ('scoreCalidad' in data) {
      hasScoreCalidad++;
      if (data.scoreCalidad === null) scoreCalidadNull++;
      else if (data.scoreCalidad === 0) scoreCalidadZero++;
      else if (typeof data.scoreCalidad === 'number' && data.scoreCalidad > 0) scoreCalidadPositive++;
      else scoreCalidadUndefined++;
    } else {
      noScoreCalidad++;
    }
  }

  console.log(`  Total noticias: ${allNoticias.size}`);
  console.log(`  Con campo scoreCalidad: ${hasScoreCalidad}`);
  console.log(`    - scoreCalidad = null: ${scoreCalidadNull}`);
  console.log(`    - scoreCalidad = 0: ${scoreCalidadZero}`);
  console.log(`    - scoreCalidad > 0: ${scoreCalidadPositive}`);
  console.log(`    - scoreCalidad = otro (undefined/etc): ${scoreCalidadUndefined}`);
  console.log(`  Sin campo scoreCalidad: ${noScoreCalidad}`);

  // Ahora verificar el snapshot del 2026-08-10
  console.log('\n' + '─'.repeat(60));
  console.log('  Verificando snapshot 2026-08-10 (articles subcollection)');
  console.log('─'.repeat(60));

  const snapArticles = await db
    .collection('nios_daily_snapshots')
    .doc('2026-08-10')
    .collection('articles')
    .limit(10)
    .get();

  console.log(`  Artículos en subcolección (muestra): ${snapArticles.size}\n`);

  for (const doc of snapArticles.docs) {
    const data = doc.data();
    console.log(`  slug: ${data.slug || doc.id}`);
    console.log(`    scoreMeni: ${data.scoreMeni}`);
    console.log(`    scoreCalidad: ${data.scoreCalidad ?? 'N/A'}`);
    console.log(`    palabras: ${data.palabras || 'N/A'}`);
    console.log('');
  }

  // Contar scoreMeni en todos los artículos del snapshot
  console.log('─'.repeat(60));
  console.log('  Contando scoreMeni en snapshot 2026-08-10...');
  console.log('─'.repeat(60));

  const allSnapArticles = await db
    .collection('nios_daily_snapshots')
    .doc('2026-08-10')
    .collection('articles')
    .get();

  let snapNull = 0;
  let snapZero = 0;
  let snapPositive = 0;
  let snapOther = 0;

  for (const doc of allSnapArticles.docs) {
    const data = doc.data();
    if (data.scoreMeni === null) snapNull++;
    else if (data.scoreMeni === 0) snapZero++;
    else if (typeof data.scoreMeni === 'number' && data.scoreMeni > 0) snapPositive++;
    else snapOther++;
  }

  console.log(`  Total artículos en snapshot: ${allSnapArticles.size}`);
  console.log(`  scoreMeni = null: ${snapNull}`);
  console.log(`  scoreMeni = 0: ${snapZero}`);
  console.log(`  scoreMeni > 0: ${snapPositive}`);
  console.log(`  scoreMeni = otro: ${snapOther}`);

  // Verificar si el snapshot tiene articlesFused inline
  const snapDoc = await db.collection('nios_daily_snapshots').doc('2026-08-10').get();
  const snapData = snapDoc.data();
  console.log(`\n  Snapshot doc existe: ${snapDoc.exists}`);
  console.log(`  articlesFused inline: ${snapData?.articlesFused ? Array.isArray(snapData.articlesFused) ? snapData.articlesFused.length : 'no es array' : 'no existe'}`);
  console.log(`  articlesCount: ${snapData?.articlesCount ?? 'N/A'}`);

  // ═══════════════════════════════════════════════════════════════
  // VEREDICTO
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  VEREDICTO GROUND TRUTH');
  console.log('='.repeat(80));

  if (noScoreCalidad > 0 && snapZero > 0) {
    console.log(`  ⚠️  CONTRADICIÓN DETECTADA:`);
    console.log(`     - Noticias sin scoreCalidad en Firestore: ${noScoreCalidad}`);
    console.log(`     - Snapshot con scoreMeni=0: ${snapZero}`);
    console.log(`     El snapshot fue guardado con el CÓDIGO ANTIGUO (coerción null→0).`);
    console.log(`     El patch está en el código pero NO en los datos almacenados.`);
    console.log(`     Para ver el efecto real del patch, hay que re-ejecutar el pipeline.`);
  } else if (noScoreCalidad === 0 && snapZero > 0) {
    console.log(`  ℹ️  Las noticias tienen scoreCalidad=0 explícito en Firestore.`);
    console.log(`     El snapshot refleja fielmente los datos originales.`);
    console.log(`     El patch no cambia nada porque no hay nulls reales.`);
  } else if (snapNull > 0) {
    console.log(`  ✅ El snapshot YA tiene scoreMeni=null para algunos artículos.`);
    console.log(`     El patch está reflejado en los datos.`);
  }
  console.log('='.repeat(80) + '\n');
}

main().catch((e) => {
  console.error('ERROR FATAL:', e);
  process.exit(1);
});
