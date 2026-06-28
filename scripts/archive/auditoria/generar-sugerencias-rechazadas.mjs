/**
 * Genera sugerencias de reescritura para noticias rechazadas por AdSense
 */

import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('./reporte-auditoria-completa.json', 'utf8'));
const rechazadas = data.todas.filter(n => n.veredicto.emoji === '🔴');

const REEMPLAZOS = {
  'muere': 'fallece',
  'fallece': 'persona fallecida',
  'falleció': 'fallecimiento registrado',
  'muerto': 'persona sin vida',
  'muerta': 'persona sin vida',
  'asesinad': 'víctima de homicidio',
  'homicidio': 'muerte violenta',
  'accidente fatal': 'siniestro vial',
  'trágico': 'grave',
  'tragedia': 'incidente grave',
  'masacre': 'ataque multiple',
  'violación': 'agresión sexual',
  'secuestro': 'privación de libertad',
  'suicidio': 'muerte autoinfligida',
  'asesinato': 'homicidio',
  'crimen': 'delito',
  'criminal': 'delincuente',
  'muert': 'fallecimiento',
  'víctima mortal': 'persona fallecida',
  'descanse en paz': 'en memoria',
  'luto': 'duelo',
  'sepelio': 'ceremonia fúnebre',
  'funeral': 'ceremonia fúnebre',
  'd.e.p': 'descanse en paz',
  'dep.': 'descanse en paz',
};

function sugerirTitulo(titulo, hallazgos) {
  let sugerido = titulo;
  for (const palabra of hallazgos) {
    const reemplazo = REEMPLAZOS[palabra.toLowerCase()];
    if (reemplazo) {
      const regex = new RegExp(palabra, 'gi');
      sugerido = sugerido.replace(regex, reemplazo);
    }
  }
  return sugerido === titulo ? '[Revisar manualmente]' : sugerido;
}

const lineas = [];
lineas.push('# NOTICIAS RECHAZADAS POR ADSENSE - SUGERENCIAS DE REESCRITURA');
lineas.push(`Fecha: ${new Date().toISOString()}`);
lineas.push(`Total rechazadas: ${rechazadas.length}\n`);
lineas.push('---\n');

rechazadas.forEach((n, i) => {
  const sugerido = sugerirTitulo(n.titulo, n.adSense.hallazgos);
  lineas.push(`${i + 1}. [${n.categoria}] ID: ${n.id}`);
  lineas.push(`   TITULAR ACTUAL:  ${n.titulo}`);
  lineas.push(`   SUGERENCIA:      ${sugerido}`);
  lineas.push(`   HALLAZGOS:       ${n.adSense.hallazgos.join(', ')}`);
  lineas.push(`   SCORE:           ${n.scoreCalidad}/100`);
  lineas.push('');
});

writeFileSync('./sugerencias-rechazadas.txt', lineas.join('\n'));
console.log(`✅ Generado: sugerencias-rechazadas.txt (${rechazadas.length} noticias)`);
