const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccount = require('G:/RESPALDO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Parsear títulos ajustados (quitar número, sufijo SEO y conteo de chars)
function parseAdjustedTitles(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  
  return lines.map(line => {
    // Quitar número al inicio: "1. "
    let text = line.replace(/^\d+\.\s*/, '');
    // Quitar sufijo SEO: " | NI 2026 (70)" o " | Nicaragua 2026 (70)" o " (70)"
    text = text.replace(/\s*\|\s*(?:NI|Nicaragua)(?:\s+2026)?\s*\(\d+\)\s*$/, '');
    text = text.replace(/\s*\(\d+\)\s*$/, '');
    return text.trim();
  });
}

// Normalizar para comparación
function normalize(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calcular score de similitud
function similarityScore(a, b) {
  const wordsA = new Set(normalize(a).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalize(b).split(' ').filter(w => w.length > 2));
  
  let common = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) common++;
  }
  
  const total = Math.max(wordsA.size, wordsB.size);
  return total === 0 ? 0 : common / total;
}

async function main() {
  try {
    const adjustedTitles = parseAdjustedTitles(path.join(__dirname, '..', 'titulos_ajustados_70.txt'));
    const currentData = JSON.parse(fs.readFileSync(path.join(__dirname, 'current-titles.json'), 'utf8'));
    
    console.log(`Títulos ajustados: ${adjustedTitles.length}`);
    console.log(`Noticias en Firestore: ${currentData.length}`);
    
    const matches = [];
    const unmatched = [];
    
    for (const adjTitle of adjustedTitles) {
      let bestMatch = null;
      let bestScore = -1;
      
      for (const curr of currentData) {
        const score = similarityScore(adjTitle, curr.titulo);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = curr;
        }
      }
      
      if (bestScore >= 0.5) {
        matches.push({
          id: bestMatch.id,
          oldTitle: bestMatch.titulo,
          newTitle: adjTitle,
          score: bestScore,
        });
      } else {
        unmatched.push({
          adjusted: adjTitle,
          bestGuess: bestMatch ? bestMatch.titulo : null,
          score: bestScore,
        });
      }
    }
    
    console.log(`\nMatches encontrados: ${matches.length}`);
    console.log(`Sin match: ${unmatched.length}`);
    
    // Guardar preview para revisión
    fs.writeFileSync(
      path.join(__dirname, 'title-matches-preview.json'),
      JSON.stringify({ matches, unmatched }, null, 2)
    );
    
    console.log('\nPrimeros 15 matches:');
    matches.slice(0, 15).forEach((m, i) => {
      console.log(`\n${i + 1}. [${m.id}]`);
      console.log(`   Actual:  ${m.oldTitle}`);
      console.log(`   Nuevo:   ${m.newTitle}`);
      console.log(`   Score:   ${(m.score * 100).toFixed(1)}%`);
    });
    
    if (unmatched.length > 0) {
      console.log('\n--- Sin match (primeros 5) ---');
      unmatched.slice(0, 5).forEach(u => {
        console.log(`Ajustado: ${u.adjusted}`);
        if (u.bestGuess) console.log(`Mejor guess: ${u.bestGuess} (${(u.score * 100).toFixed(1)}%)`);
      });
    }
    
    // Preguntar antes de actualizar - por ahora solo preview
    console.log('\n✅ Preview guardado en title-matches-preview.json');
    console.log('Revisá el preview y confirmá para aplicar los cambios a Firestore.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main();
