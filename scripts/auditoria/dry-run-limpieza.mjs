/**
 * Simulacion local del endpoint /api/admin/clean-backlog en modo dry-run
 * Muestra que cambios haria SIN modificar Firestore
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

// ─── Scoring inline (para script standalone) ───
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

// ─── MAIN DRY-RUN ───
async function main() {
  console.log('🔍 DRY-RUN: Simulando limpieza de noticias (SIN modificar Firestore)\n');

  const db = initFirebase();
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();

  let modificadas = 0;
  let cambiosTitulo = 0;
  let cambiosContenido = 0;
  let cambiosResumen = 0;
  let cambiosScore = 0;

  console.log('=== PRIMEROS 15 CAMBIOS DETECTADOS ===\n');

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

    const cambiaTitulo = tituloDespues !== tituloAntes;
    const cambiaResumen = resumenDespues !== resumenAntes;
    const cambiaContenido = contenidoDespues !== contenidoAntes;
    const cambiaScore = scoreDespues !== scoreAntes;

    if (cambiaTitulo || cambiaResumen || cambiaContenido || cambiaScore) {
      modificadas++;
      if (cambiaTitulo) cambiosTitulo++;
      if (cambiaResumen) cambiosResumen++;
      if (cambiaContenido) cambiosContenido++;
      if (cambiaScore) cambiosScore++;

      if (modificadas <= 15) {
        console.log(`--- Noticia #${modificadas} ---`);
        console.log(`Categoria: ${data.categoria || 'N/A'}`);
        if (cambiaTitulo) {
          console.log(`TITULO:`);
          console.log(`  ANTES:  ${tituloAntes.substring(0, 80)}`);
          console.log(`  DESPUES: ${tituloDespues.substring(0, 80)}`);
        }
        if (cambiaResumen) {
          console.log(`RESUMEN cambiado (${resumenAntes.length} -> ${resumenDespues.length} chars)`);
        }
        if (cambiaContenido) {
          console.log(`CONTENIDO: parrafos segmentados`);
        }
        console.log(`SCORE: ${scoreAntes === -1 ? 'N/A' : scoreAntes} -> ${scoreDespues}`);
        console.log('');
      }
    }
  }

  console.log('');
  console.log('=== RESUMEN DRY-RUN ===');
  console.log(`Total revisadas:     ${snap.docs.length}`);
  console.log(`Total a modificar:   ${modificadas}`);
  console.log(`  - Titulos:         ${cambiosTitulo}`);
  console.log(`  - Resumenes:       ${cambiosResumen}`);
  console.log(`  - Contenidos:      ${cambiosContenido}`);
  console.log(`  - Scores:          ${cambiosScore}`);
  console.log('');
  console.log('Esto fue una simulacion. No se modifico ningun dato en Firestore.');
  console.log('Para ejecutar en produccion: POST /api/admin/clean-backlog con X-Admin-Token');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
