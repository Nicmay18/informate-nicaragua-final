/**
 * Script de validación post-fix.
 * Uso (PowerShell):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "G:\RESPALDO\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json"
 *   node scripts/validacion-final.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getServiceAccount() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    return JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
  }
  const fallbackPath = join(__dirname, '..', 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
  if (existsSync(fallbackPath)) {
    return JSON.parse(readFileSync(fallbackPath, 'utf8'));
  }
  throw new Error('No se encontró service account. Configura GOOGLE_APPLICATION_CREDENTIALS.');
}

async function main() {
  console.log('=== VALIDACIÓN POST-FIX ===\n');

  const serviceAccount = getServiceAccount();
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  const snapshot = await db.collection('noticias').get();
  const docs = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));

  // 1. Thin content (<400 palabras)
  const thin = docs.filter((d) => (d.data.wordCount || 999) < 400);
  console.log(`1. Artículos <400 palabras: ${thin.length} (target: 0 tras reescritura)`);

  // 2. Noindex
  const noindex = docs.filter((d) => d.data.noindex === true);
  console.log(`2. Artículos con noindex=true: ${noindex.length} (debe coincidir con thin)`);

  // 3. Fecha actualización
  const conFecha = docs.filter((d) => !!d.data.fechaActualizacion).length;
  console.log(`3. Artículos con fechaActualizacion: ${conFecha}/${docs.length}`);

  // 4. Slugs duplicados
  const slugMap = new Map();
  docs.forEach((d) => {
    const slug = d.data.slug || d.id;
    slugMap.set(slug, (slugMap.get(slug) || 0) + 1);
  });
  const duplicates = Array.from(slugMap.entries()).filter(([, count]) => count > 1);
  console.log(`4. Slugs duplicados: ${duplicates.length} (target: 0)`);
  if (duplicates.length > 0) {
    duplicates.slice(0, 5).forEach(([slug, count]) => {
      console.log(`   ⚠️  "${slug}" aparece ${count} veces`);
    });
  }

  // 5. Títulos con HTML
  const dirtyTitles = docs.filter((d) => /<[^>]+>/.test(d.data.titulo || ''));
  console.log(`5. Títulos con HTML incrustado: ${dirtyTitles.length} (target: 0)`);
  if (dirtyTitles.length > 0) {
    dirtyTitles.slice(0, 3).forEach((d) => {
      console.log(`   ⚠️  ID ${d.id}: "${d.data.titulo.substring(0, 60)}…"`);
    });
  }

  // 6. Score de calidad
  const scores = docs.map((d) => d.data.scoreCalidad || 0);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  console.log(`6. Score calidad promedio: ${avgScore.toFixed(1)}/100 (target: >70)`);

  // 7. Distribución por categoría
  const catMap = new Map();
  docs.forEach((d) => {
    const cat = d.data.categoria || 'General';
    catMap.set(cat, (catMap.get(cat) || 0) + 1);
  });
  console.log(`\n7. Distribución por categoría:`);
  Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });

  console.log('\n=== PRÓXIMOS PASOS ===');
  console.log('• Reescribir los artículos desindexados (800+ palabras)');
  console.log('• Solicitar reconsideración en AdSense');
  console.log('• Enviar news-sitemap.xml a Google News Publisher Center');
  console.log('• Monitorear Search Console → Cobertura (target: <24h indexación)');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
