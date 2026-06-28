/**
 * Limpia SOLO las noticias rechazadas del ultimo reporte de auditoria
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
  'asesinato': 'homicidio consumado',
  'violación': 'agresión sexual',
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

async function main() {
  const db = initFirebase();
  const reporte = JSON.parse(readFileSync('./reporte-auditoria-completa.json', 'utf8'));
  const rechazadas = reporte.todas.filter(n => n.veredicto.emoji === '🔴');
  
  console.log(`Limpiando ${rechazadas.length} noticias rechazadas...\n`);
  
  for (const noticia of rechazadas) {
    const doc = await db.collection('noticias').doc(noticia.id).get();
    if (!doc.exists) {
      console.log(`  ⚠️  ${noticia.id}: no encontrada`);
      continue;
    }
    
    const data = doc.data();
    const tituloAntes = data.titulo || '';
    const resumenAntes = data.resumen || '';
    const contenidoAntes = data.contenido || '';
    
    const tituloDespues = sanitizarTexto(tituloAntes);
    const resumenDespues = sanitizarTexto(resumenAntes);
    const contenidoDespues = sanitizarTexto(contenidoAntes);
    
    const cambia = tituloDespues !== tituloAntes || resumenDespues !== resumenAntes || contenidoDespues !== contenidoAntes;
    
    if (cambia) {
      await db.collection('noticias').doc(noticia.id).update({
        titulo: tituloDespues,
        resumen: resumenDespues,
        contenido: contenidoDespues,
        ultimaActualizacionAutomatica: new Date()
      });
      console.log(`  ✅ ${noticia.id}: limpiada`);
    } else {
      console.log(`  ℹ️  ${noticia.id}: sin cambios (${noticia.adSense.hallazgos.join(', ')})`);
    }
  }
  
  console.log('\n✅ Proceso completado');
}

main().catch(err => { console.error(err); process.exit(1); });
