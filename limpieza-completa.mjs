/**
 * LIMPIEZA COMPLETA: Procesa TODAS las noticias con el diccionario completo
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  return getFirestore(app);
}

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
  'muertos': 'personas fallecidas',
  'muertas': 'personas fallecidas',
  'muerte': 'fallecimiento',
  'murió': 'falleció',
  'murieron': 'fallecieron',
  'víctima mortal': 'deceso confirmado',
  'victima mortal': 'deceso confirmado',
  'asesinado': 'víctima de homicidio',
  'asesinada': 'víctima de homicidio',
  'crimen': 'delito',
  'criminal': 'delincuente',
  'homicidio': 'delito grave',
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

async function main() {
  console.log('⚠️  LIMPIEZA COMPLETA DE TODAS LAS NOTICIAS');
  console.log('⚠️  Esperando 5 segundos...\n');
  await new Promise(r => setTimeout(r, 5000));

  const db = initFirebase();
  
  // Obtener TODAS las noticias (sin limit)
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').get();
  console.log(`Total noticias encontradas: ${snap.docs.length}\n`);

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
    const contenidoDespues = segmentarParrafosDensos(sanitizarTexto(contenidoAntes));
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
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
