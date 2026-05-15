/**
 * Script para limpiar noticias con listas duplicadas (bullets + párrafos)
 * Uso: node scripts/clean-duplicate-bullets.js
 * 
 * ESTE SCRIPT MODIFICA FIREBASE - HACER BACKUP ANTES
 */

const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Limpia duplicaciones de bullets en contenido HTML
 * Estrategia: eliminar párrafos que repiten texto de <li>
 */
function cleanDuplicateBullets(contenido) {
  if (!contenido) return contenido;

  let cleaned = contenido;
  let changes = 0;

  // Paso 1: Extraer todos los textos de <li>
  const liPattern = /<li>(.*?)<\/li>/g;
  const liTexts = [];
  let match;
  while ((match = liPattern.exec(contenido)) !== null) {
    liTexts.push(match[1]);
  }

  // Paso 2: Para cada texto de <li>, eliminar <p> que lo repita exactamente
  liTexts.forEach(text => {
    const escapedText = escapeRegExp(text);
    // Buscar <p> que contiene exactamente el mismo texto (sin tags HTML dentro)
    const pPattern = new RegExp(`<p>${escapedText}<\\/p>`, 'g');
    const beforeCount = (cleaned.match(pPattern) || []).length;
    cleaned = cleaned.replace(pPattern, '');
    const afterCount = (cleaned.match(pPattern) || []).length;
    if (beforeCount > 0) changes += beforeCount;
  });

  // Paso 3: Limpiar párrafos vacíos resultantes
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
  cleaned = cleaned.replace(/<p><br\s*\/?><\/p>/g, '');

  // Paso 4: Normalizar espacios
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return { cleaned, changes };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function cleanAllNews() {
  console.log('🧹 Limpiando noticias con listas duplicadas...\n');
  console.log('⚠️  ESTE SCRIPT MODIFICA FIREBASE DIRECTAMENTE\n');

  // Confirmación
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question('¿Continuar con la limpieza? (yes/no): ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('❌ Cancelado por usuario.');
    await admin.app().delete();
    process.exit(0);
  }

  try {
    const snapshot = await db
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(200)
      .get();

    console.log(`📊 Procesando ${snapshot.docs.length} noticias...\n`);

    const cleaned = [];
    const skipped = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const titulo = data.titulo || 'Sin título';
      const contenido = data.contenido || '';

      const { cleaned: newContent, changes } = cleanDuplicateBullets(contenido);

      if (changes > 0) {
        await db.collection('noticias').doc(doc.id).update({
          contenido: newContent,
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        });

        cleaned.push({
          id: doc.id,
          slug,
          titulo,
          changes
        });

        console.log(`✅ ${titulo} (${slug}) - ${changes} duplicaciones eliminadas`);
      } else {
        skipped.push({ slug, titulo });
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Limpiadas: ${cleaned.length}`);
    console.log(`   ⏭️  Sin cambios: ${skipped.length}`);

    if (cleaned.length > 0) {
      const fs = require('fs');
      fs.writeFileSync(
        'cleaned-bullets-report.json',
        JSON.stringify(cleaned, null, 2)
      );
      console.log(`📄 Reporte guardado en cleaned-bullets-report.json`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await admin.app().delete();
  }
}

cleanAllNews();
