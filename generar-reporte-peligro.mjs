import { readFileSync, writeFileSync } from 'fs';

try {
  const data = JSON.parse(readFileSync('e:\\PROYECTO\\informate-nicaragua-final\\auditoria-noticias.json', 'utf8'));
  const peligrosas = data.filter(n => n.nivel.includes('PELIGRO'));

  console.log(`Filtrando ${peligrosas.length} noticias en PELIGRO...`);

  // Ordenar por score de menor a mayor (las peores primero)
  peligrosas.sort((a, b) => a.score - b.score);

  let output = `================================================================================
REPORTES DE NOTICIAS EN RIESGO DE RECHAZO ADSENSE / BAJA CALIDAD (PELIGRO)
Total de noticias en peligro: ${peligrosas.length}
================================================================================\n\n`;

  peligrosas.forEach((n, idx) => {
    output += `${idx + 1}. [SCORE: ${n.score}/100] — ${n.titulo}\n`;
    output += `   • ID: ${n.id}  |  Slug: /noticias/${n.slug}\n`;
    output += `   • Palabras: ${n.palabras} (Mínimo recomendado: 500)\n`;
    output += `   • Densidad de datos: ${n.densidad} datos por 100 palabras (Mínimo recomendado: 5.0)\n`;
    output += `   • Problemas clave:\n`;
    if (n.palabras < 350) output += `     - [CRÍTICO] Contenido muy corto (${n.palabras} palabras). Thin content.\n`;
    if (n.relleno > 0) output += `     - Relleno emocional o sensacionalismo: ${n.relleno} frases detectadas.\n`;
    if (n.transiciones_ia > 0) output += `     - Transiciones robóticas de IA: ${n.transiciones_ia} detectadas (ej: además, por su parte, asimismo).\n`;
    if (n.fuentes_atribuidas === 0) output += `     - Sin atribución de fuentes reales (Riesgo EEAT / Falta de autoridad).\n`;
    if (n.citas === 0) output += `     - Sin citas textuales (falta testimonios o comillas de declaraciones).\n`;
    if (n.contexto_local === 0) output += `     - Falta de contexto local (no menciona palabras clave de ciudades o de Nicaragua).\n`;
    if (n.variacion === 'BAJA') output += `     - Monotonía sintáctica (patrón IA: oraciones con longitud idéntica).\n`;
    output += `\n--------------------------------------------------------------------------------\n`;
  });

  writeFileSync('e:\\PROYECTO\\informate-nicaragua-final\\reporte-noticias-peligro.txt', output, 'utf8');
  console.log('Reporte generado con éxito!');
} catch (e) {
  console.error('Error generando el reporte:', e.message);
}
