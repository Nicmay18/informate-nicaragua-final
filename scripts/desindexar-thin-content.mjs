/**
 * Script de remediación: marca artículos con <400 palabras como noindex.
 * Uso (PowerShell):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "G:\RESPALDO\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json"
 *   node scripts/desindexar-thin-content.mjs
 *
 * Recomendado: testear primero con DRY_RUN=1
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIN_WORDS = 400;
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const BATCH_SIZE = 50; // Firestore write batch limit

function countWords(html = '') {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function getServiceAccount() {
  // 1. Variable de entorno explícita
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  // 2. Variable inline (para CI/CD)
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    return JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
  }
  // 3. Fallback local (ruta conocida del workspace)
  const fallbackPath = 'g:\\\\RESPALDO\\\\informate-nicaragua-final\\\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json';
  if (existsSync(fallbackPath)) {
    return JSON.parse(readFileSync(fallbackPath, 'utf8'));
  }
  throw new Error('No se encontró service account. Configura GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_ADMIN_CREDENTIALS.');
}

async function main() {
  console.log(`🔍 Escaneando artículos con <${MIN_WORDS} palabras…${DRY_RUN ? ' (DRY RUN — solo lectura)' : ''}\n`);

  const serviceAccount = getServiceAccount();
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
  const db = getFirestore();

  const snapshot = await db.collection('noticias').get();
  console.log(`📊 Total de noticias en Firestore: ${snapshot.size}\n`);

  const thinArticles = [];
  let batch = db.batch();
  let batchCount = 0;
  let processedCount = 0;

  for (const doc of snapshot.docs) {
    processedCount++;
    const data = doc.data();
    const wordCount = countWords(data.contenido || data.resumen || '');

    if (wordCount < MIN_WORDS) {
      thinArticles.push({
        id: doc.id,
        slug: data.slug || doc.id,
        title: (data.titulo || '').replace(/<[^>]*>/g, '').trim() || 'SIN TÍTULO',
        words: wordCount,
        categoria: data.categoria || 'General',
      });

      if (!DRY_RUN) {
        batch.update(doc.ref, {
          noindex: true,
          thinContent: true,
          wordCount: wordCount,
          fechaActualizacion: new Date().toISOString(),
        });
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`  ✅ Batch de ${batchCount} actualizaciones commiteado`);
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    // Progress cada 50
    if (processedCount % 50 === 0) {
      console.log(`  …procesados ${processedCount}/${snapshot.size}`);
    }
  }

  // Commit final del batch
  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`  ✅ Batch final de ${batchCount} actualizaciones commiteado`);
  }

  console.log(`\n📋 Resultados:`);
  console.table(thinArticles);
  console.log(`\n🎯 Total artículos thin: ${thinArticles.length}`);

  const reportPath = join(__dirname, '..', 'thin-content-report.json');
  writeFileSync(reportPath, JSON.stringify(thinArticles, null, 2));
  console.log(`📝 Reporte guardado: ${reportPath}`);

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN: ningún documento fue modificado.');
    console.log('   Ejecuta sin DRY_RUN=1 para aplicar cambios.');
  } else {
    console.log('\n✅ Artículos marcados con noindex=true en Firestore.');
    console.log('🚀 Próximo paso: redeploy para que el frontend respete los metadatos noindex.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
