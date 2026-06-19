import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const sa = JSON.parse(fs.readFileSync('scripts/firebase-admin-key.json'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// ========== SUSTITUCIÓN EDITORIAL DE CONECTORES IA ==========
// Regla del Jefe de Redacción: eliminar conectores robóticos.
// Donde quitarlos rompe la gramática, sustituir por conector natural NO penalizado.
// El orden importa: primero las construcciones largas, luego las simples.

function limpiarEditorial(html) {
  let t = html;

  // ---- "además de" (construcción aditiva) → "aparte de" ----
  t = t.replace(/\badem[áa]s de\b/gi, 'aparte de');

  // ---- "sin embargo" / "no obstante" mid-oración → "pero" ----
  // Caso ", sin embargo," → ", pero "
  t = t.replace(/,\s*sin embargo\s*,/gi, ', pero');
  t = t.replace(/,\s*no obstante\s*,/gi, ', pero');
  // Caso "x, sin embargo y" → "x, pero y"
  t = t.replace(/,\s*sin embargo\s+/gi, ', pero ');
  t = t.replace(/,\s*no obstante\s+/gi, ', pero ');

  // ---- "asimismo" → "también" ----
  t = t.replace(/,\s*asimismo\s*,/gi, ', y también');
  t = t.replace(/,\s*asimismo\s+/gi, ', y también ');
  t = t.replace(/\basimismo\s+/gi, 'también ');

  // ---- "de igual manera" / "del mismo modo" → "igual" / quitar ----
  t = t.replace(/,?\s*de igual manera\s*,?/gi, ' ');
  t = t.replace(/,?\s*del mismo modo\s*,?/gi, ' ');
  t = t.replace(/,?\s*de la misma forma\s*,?/gi, ' ');

  // ---- "por su parte" → quitar (suele ser relleno atributivo) ----
  t = t.replace(/,\s*por su parte\s*,/gi, ',');
  t = t.replace(/\s+por su parte\s*,/gi, ',');
  t = t.replace(/\s+por su parte\s+/gi, ' ');

  // ---- "por lo tanto" / "en consecuencia" → "por eso" ----
  t = t.replace(/,?\s*por lo tanto\s*,?/gi, ', por eso ');
  t = t.replace(/,?\s*en consecuencia\s*,?/gi, ', por eso ');

  // ---- "finalmente" / "para finalizar" → quitar (cierre robótico) ----
  t = t.replace(/<p>\s*finalmente\s*,?\s*/gi, '<p>');
  t = t.replace(/([.!?]\s+)finalmente\s*,?\s+/gi, '$1');
  t = t.replace(/,\s*finalmente\s*,/gi, ',');
  t = t.replace(/\s+finalmente\s+/gi, ' ');

  // ---- "además" mid-oración → "también" o quitar ----
  // ", además ," → ","
  t = t.replace(/,\s*adem[áa]s\s*,/gi, ',');
  // ", además ofrece" → ", y también ofrece"
  t = t.replace(/,\s*adem[áa]s\s+/gi, ', y también ');
  // "el local además ofrece" → "el local también ofrece"
  t = t.replace(/\badem[áa]s\s+/gi, 'también ');

  // ---- "es importante destacar/señalar que" → quitar ----
  t = t.replace(/,?\s*es importante (?:destacar|se\u00f1alar|mencionar|resaltar) que\s*/gi, ' ');
  t = t.replace(/,?\s*cabe (?:destacar|se\u00f1alar|mencionar|resaltar) que\s*/gi, ' ');
  t = t.replace(/,?\s*en este sentido\s*,?/gi, ' ');
  t = t.replace(/,?\s*en este contexto\s*,?/gi, ' ');
  t = t.replace(/,?\s*al respecto\s*,?/gi, ' ');
  t = t.replace(/,?\s*por otro lado\s*,?/gi, ' ');
  t = t.replace(/<p>\s*en conclusi[óo]n\s*,?\s*/gi, '<p>');
  t = t.replace(/,?\s*en conclusi[óo]n\s*,?/gi, ' ');
  t = t.replace(/<p>\s*en resumen\s*,?\s*/gi, '<p>');

  // ---- Limpieza de espacios/comas/puntuación ----
  t = t.replace(/\s+,/g, ',');
  t = t.replace(/,\s*,/g, ',');
  t = t.replace(/\s+\./g, '.');
  t = t.replace(/\.\s*\./g, '.');
  t = t.replace(/,\s*\./g, '.');
  t = t.replace(/\s{2,}/g, ' ');
  t = t.replace(/<p>\s*,\s*/gi, '<p>');
  t = t.replace(/\s+<\/p>/gi, '</p>');
  // Recapitalizar inicio de párrafo
  t = t.replace(/<p>\s*([a-záéíóúñ])/g, (m, l) => '<p>' + l.toUpperCase());
  // Recapitalizar después de punto
  t = t.replace(/([.!?]\s+)([a-záéíóúñ])/g, (m, p, l) => p + l.toUpperCase());

  return t.trim();
}

(async () => {
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').get();

  let modificadas = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const original = data.contenido || '';
    const limpio = limpiarEditorial(original);
    if (limpio !== original) {
      await db.collection('noticias').doc(doc.id).update({ contenido: limpio });
      modificadas++;
      console.log(`✏️  ${data.categoria} | ${(data.titulo||'').substring(0,48)}`);
    }
  }
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('Modificadas:', modificadas);
  console.log('═══════════════════════════════════════');
  process.exit(0);
})();
