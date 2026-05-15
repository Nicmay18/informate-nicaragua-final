/**
 * Script para detectar noticias con listas duplicadas (bullets + párrafos)
 * Uso: node scripts/check-duplicate-bullets.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Detecta patrón de duplicación: texto que aparece como <li> y luego como <p>
 * Ejemplo: "Incertidumbre Regional:" aparece en <li> y luego en <p>
 */
function detectDuplicatePattern(contenido) {
  if (!contenido) return false;

  // Patrón 1: texto que termina en : seguido de texto, aparece en <li> y luego en <p>
  // Ejemplo: <li>Incertidumbre Regional: La situación bélica...</li><p>Incertidumbre Regional: La situación bélica...</p>
  const liPattern = /<li>([^<]+):([^<]*)<\/li>/g;
  const matches = [];
  let match;

  while ((match = liPattern.exec(contenido)) !== null) {
    const fullText = match[1] + ':' + match[2];
    // Buscar si este texto aparece también en un <p>
    const pPattern = new RegExp(`<p>${escapeRegExp(fullText)}</p>`);
    if (pPattern.test(contenido)) {
      matches.push({
        text: fullText.substring(0, 50) + '...',
        inLi: true,
        inP: true
      });
    }
  }

  // Patrón 2: bullets con - o * seguidos de texto duplicado
  const bulletPattern = /<li>([^<]+)<\/li>/g;
  const liTexts = [];
  while ((match = bulletPattern.exec(contenido)) !== null) {
    liTexts.push(match[1]);
  }

  // Verificar si esos textos aparecen también fuera de <li>
  const outsideLiTexts = liTexts.filter(text => {
    const regex = new RegExp(escapeRegExp(text));
    const liMatches = (contenido.match(/<li>/g) || []).length;
    const textMatches = (contenido.match(regex) || []).length;
    return textMatches > liMatches; // Aparece más veces que <li> tags
  });

  return {
    hasDuplicates: matches.length > 0 || outsideLiTexts.length > 0,
    pattern1Matches: matches,
    pattern2Matches: outsideLiTexts,
    total: matches.length + outsideLiTexts.length
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function checkAllNews() {
  console.log('🔍 Buscando noticias con listas duplicadas...\n');

  try {
    const snapshot = await db
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(200)
      .get();

    console.log(`📊 Analizando ${snapshot.docs.length} noticias...\n`);

    const affected = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const titulo = data.titulo || 'Sin título';
      const contenido = data.contenido || '';

      const result = detectDuplicatePattern(contenido);

      if (result.hasDuplicates) {
        affected.push({
          id: doc.id,
          slug,
          titulo,
          fecha: data.fecha?.toDate?.() || data.fecha,
          pattern1Count: result.pattern1Matches.length,
          pattern2Count: result.pattern2Matches.length,
          total: result.total,
          matches: result.pattern1Matches
        });
      }
    }

    if (affected.length === 0) {
      console.log('✅ No se encontraron noticias con listas duplicadas.');
    } else {
      console.log(`⚠️  Se encontraron ${affected.length} noticias con duplicación:\n`);
      affected.forEach((news, i) => {
        console.log(`${i + 1}. ${news.titulo}`);
        console.log(`   Slug: ${news.slug}`);
        console.log(`   Fecha: ${news.fecha}`);
        console.log(`   Duplicados: Patrón1=${news.pattern1Count}, Patrón2=${news.pattern2Count}, Total=${news.total}`);
        if (news.matches.length > 0) {
          console.log(`   Ejemplo: "${news.matches[0].text}"`);
        }
        console.log('');
      });

      // Guardar reporte
      const fs = require('fs');
      fs.writeFileSync(
        'duplicate-bullets-report.json',
        JSON.stringify(affected, null, 2)
      );
      console.log('📄 Reporte guardado en duplicate-bullets-report.json');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await admin.app().delete();
  }
}

checkAllNews();
