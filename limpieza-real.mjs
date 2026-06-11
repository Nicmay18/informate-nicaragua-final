/**
 * Script local: LIMPIEZA REAL de noticias en Firestore
 * Ejecuta sanitizacion + slicing + recalculo de score
 * 
 * Uso: node limpieza-real.mjs
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Firebase init ───
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  return getFirestore(app);
}

// ─── Scoring inline ───
function calcularScoreEditorial(noticia) {
  let score = 0;
  if (!noticia) return 0;
  const textoPlano = (noticia.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;
  if (palabras >= 500) score += 30;
  else if (palabras >= 250) score += 15;
  const lt = (noticia.titulo || '').length;
  if (lt >= 30 && lt <= 70) score += 20;
  else if (lt > 0) score += 5;
  const lr = (noticia.resumen || '').length;
  if (lr >= 120 && lr <= 160) score += 20;
  else if (lr > 0) score += 5;
  if (noticia.imagen && noticia.imagen.trim() !== '' && noticia.imagen.trim() !== '/logo.webp') score += 15;
  const tieneH2H3 = /<h[23][^>]*>/i.test(noticia.contenido || '');
  const tieneStrong = /<strong[^>]*>|<b>/i.test(noticia.contenido || '');
  if (tieneH2H3) score += 10;
  if (tieneStrong) score += 5;
  return Math.max(0, Math.min(100, score));
}

// ─── Diccionario y helpers ───
const DICCIONARIO_SEGURO = {
  'trágico accidente': 'incidente vial fatal',
  'tragico accidente': 'incidente vial fatal',
  'trágica muerte': 'pérdida fatal',
  'tragica muerte': 'pérdida fatal',
  'murió de forma': 'perdió la vida de forma',
  'murio de forma': 'perdió la vida de forma',
  ' sangrienta': ' de alto impacto',
  'horrendo homicidio': 'hecho delictivo bajo investigación',
  'muere': 'fallece',
  'muerto': 'persona fallecida',
  'muerta': 'persona fallecida',
  'víctima mortal': 'deceso confirmado',
  'victima mortal': 'deceso confirmado',
  'asesinado': 'víctima de homicidio',
  'asesinada': 'víctima de homicidio',
  'crimen': 'delito',
  'criminal': 'delincuente',
  'homicidio': 'muerte violenta',
  'suicidio': 'muerte autoinfligida',
  'masacre': 'ataque múltiple',
  'tragedia': 'incidente grave',
  'trágico': 'grave',
  'tragicos': 'graves',
  'trágicos': 'graves',
  'sepelio': 'ceremonia fúnebre',
  'funeral': 'ceremonia fúnebre',
  'luto': 'duelo',
};

function sanitizarTexto(texto) {
  if (!texto) return '';
  let limpio = texto;
  Object.keys(DICCIONARIO_SEGURO).forEach((clave) => {
    const regex = new RegExp(clave, 'gi');
    limpio = limpio.replace(regex, DICCIONARIO_SEGURO[clave]);
  });
  return limpio;
}

function segmentarParrafosDensos(html) {
  if (!html) return '';
  const parrafos = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (!parrafos) return html;
  let procesado = html;
  parrafos.forEach((original) => {
    const texto = original.replace(/<[^>]+>/g, '').trim();
    const palabras = texto.split(/\s+/).filter(Boolean);
    if (palabras.length > 90) {
      const oraciones = texto.match(/[^.!?]+[.!?]+(\s|$)/g);
      if (oraciones && oraciones.length > 1) {
        const mitad = Math.ceil(oraciones.length / 2);
        const p1 = oraciones.slice(0, mitad).join('').trim();
        const p2 = oraciones.slice(mitad).join('').trim();
        const nuevo = `<p>${p1}</p><p>${p2}</p>`;
        procesado = procesado.replace(original, nuevo);
      }
    }
  });
  return procesado;
}

// ─── MAIN ───
async function main() {
  console.log('⚠️  LIMPIEZA REAL DE NOTICIAS EN FIRESTORE');
  console.log('⚠️  Este script MODIFICARA datos. Asegurate de tener backup.\n');
  console.log('Presiona Ctrl+C para cancelar. Esperando 5 segundos...\n');

  await new Promise(r => setTimeout(r, 5000));

  const db = initFirebase();
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();

  let modificadas = 0;
  let batchOps = 0;
  const batch = db.batch();

  for (const doc of snap.docs) {
    const data = doc.data();
    const tituloAntes = data.titulo || '';
    const resumenAntes = data.resumen || '';
    const contenidoAntes = data.contenido || '';
    const scoreAntes = data.scoreCalidad ?? -1;

    const tituloDespues = sanitizarTexto(tituloAntes);
    const resumenDespues = sanitizarTexto(resumenAntes);
    const contenidoDespues = segmentarParrafosDensos(contenidoAntes);
    const scoreDespues = calcularScoreEditorial({
      titulo: tituloDespues,
      resumen: resumenDespues,
      contenido: contenidoDespues,
      imagen: data.imagen || '',
    });

    const cambia = tituloDespues !== tituloAntes || resumenDespues !== resumenAntes ||
                   contenidoDespues !== contenidoAntes || scoreDespues !== scoreAntes;

    if (cambia) {
      const docRef = db.collection('noticias').doc(doc.id);
      batch.update(docRef, {
        titulo: tituloDespues,
        resumen: resumenDespues,
        contenido: contenidoDespues,
        scoreCalidad: scoreDespues,
        ultimaActualizacionAutomatica: new Date(),
      });
      batchOps++;
      modificadas++;

      if (batchOps >= 450) {
        await batch.commit();
        console.log(`  -> Batch de ${batchOps} noticias guardado...`);
        batchOps = 0;
      }
    }
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  console.log(`\n✅ COMPLETADO: ${modificadas} noticias modificadas de ${snap.docs.length}`);
  console.log('Todos los cambios fueron guardados en Firestore.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
