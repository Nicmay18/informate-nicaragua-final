/**
 * Diagnostico: qué palabras sensibles siguen apareciendo en las noticias rechazadas
 */

import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('./reporte-auditoria-completa.json', 'utf8'));
const rechazadas = data.todas.filter(n => n.veredicto.emoji === '🔴');

const conteo = {};
rechazadas.forEach(n => {
  n.adSense.hallazgos.forEach(palabra => {
    conteo[palabra] = (conteo[palabra] || 0) + 1;
  });
});

console.log('=== PALABRAS SENSIBLES RESTANTES ===');
console.log(`Total noticias rechazadas: ${rechazadas.length}\n`);

Object.entries(conteo)
  .sort((a, b) => b[1] - a[1])
  .forEach(([palabra, count]) => {
    console.log(`${String(count).padStart(3, ' ')}x  ${palabra}`);
  });
