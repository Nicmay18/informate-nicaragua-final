import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const sa = JSON.parse(fs.readFileSync('scripts/firebase-admin-key.json'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// PASE FINAL CATCH-ALL: sustituye conectores IA en CUALQUIER posición
// (inicio de bloque, tras dos puntos, en listas, sin comas) por conectores naturales.
function limpiarFinal(html) {
  let t = html;

  // --- "sin embargo" / "no obstante" → "pero" (en cualquier posición) ---
  // Mid con comas: "x, sin embargo, y" → "x, pero y"
  t = t.replace(/,\s*(?:sin embargo|no obstante)\s*,\s*/gi, ', pero ');
  // Tras dos puntos o punto y coma: ": Sin embargo" → ": pero"
  t = t.replace(/([:;]\s*)(?:sin embargo|no obstante)\s*,?\s*/gi, '$1');
  // Restantes (cualquier posición) → "pero"
  t = t.replace(/\b(?:sin embargo|no obstante)\s*,?\s*/gi, 'pero ');

  // --- "asimismo" → "también" ---
  t = t.replace(/,\s*asimismo\s*,\s*/gi, ', y también ');
  t = t.replace(/\basimismo\s*,?\s*/gi, 'también ');

  // --- "además" → "también" / quitar ---
  t = t.replace(/,\s*adem[áa]s\s*,\s*/gi, ', ');
  t = t.replace(/\badem[áa]s de\b/gi, 'aparte de');
  t = t.replace(/\badem[áa]s\s*,?\s*/gi, 'también ');

  // --- "finalmente" → quitar ---
  t = t.replace(/,\s*finalmente\s*,\s*/gi, ', ');
  t = t.replace(/\bfinalmente\s*,?\s*/gi, '');

  // --- "por su parte" → quitar ---
  t = t.replace(/,\s*por su parte\s*,?\s*/gi, ', ');
  t = t.replace(/\bpor su parte\s*,?\s*/gi, '');

  // --- "en cuanto a" → "sobre" ---
  t = t.replace(/\ben cuanto a\b/gi, 'sobre');

  // --- "de igual manera" / "del mismo modo" → quitar ---
  t = t.replace(/,?\s*de igual manera\s*,?\s*/gi, ' ');
  t = t.replace(/,?\s*del mismo modo\s*,?\s*/gi, ' ');

  // --- Limpieza de espacios / comas / puntuación ---
  t = t.replace(/\s+,/g, ',');
  t = t.replace(/,\s*,/g, ',');
  t = t.replace(/\s+\./g, '.');
  t = t.replace(/\.\s*\./g, '.');
  t = t.replace(/,\s*\./g, '.');
  t = t.replace(/\s{2,}/g, ' ');
  t = t.replace(/<p>\s*,\s*/gi, '<p>');
  t = t.replace(/\s+<\/p>/gi, '</p>');
  t = t.replace(/([:;])\s*pero\s+/gi, '$1 '); // ": pero" sobrante
  // Recapitalizar inicio de párrafo
  t = t.replace(/<p>\s*([a-záéíóúñ])/g, (m, l) => '<p>' + l.toUpperCase());
  // Recapitalizar después de punto
  t = t.replace(/([.!?]\s+)([a-záéíóúñ])/g, (m, p, l) => p + l.toUpperCase());
  // "Pero" tras punto que quedó en minúscula al inicio
  t = t.replace(/<p>pero /g, '<p>Pero ');

  return t.trim();
}

(async () => {
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').get();
  let modificadas = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const original = data.contenido || '';
    const limpio = limpiarFinal(original);
    if (limpio !== original) {
      await db.collection('noticias').doc(doc.id).update({ contenido: limpio });
      modificadas++;
      console.log(`✏️  ${data.categoria} | ${(data.titulo||'').substring(0,48)}`);
    }
  }
  console.log('\n═══════════════════════════════════════');
  console.log('Modificadas:', modificadas);
  console.log('═══════════════════════════════════════');
  process.exit(0);
})();
