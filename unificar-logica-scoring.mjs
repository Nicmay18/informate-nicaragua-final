/**
 * unificar-logica-scoring.mjs
 * Este script copia la lógica de scoring del auditor-completo.mjs
 * a los archivos del panel para que no haya contradicciones.
 */
import fs from 'fs';

const LOGICA_SCORING = `
  // ── SCORING UNIFICADO (Reglas del Auditor Forense ORO) ──
  let score = 0;
  
  // 1. Extensión (20 pts)
  if (palabras >= 500) score += 20;
  else if (palabras >= 350) score += 14;
  else if (palabras >= 250) score += 7;

  // 2. Relleno emocional (20 pts)
  if (rellenoCount === 0) score += 20;
  else if (rellenoCount <= 2) score += 8;

  // 3. Transiciones IA (20 pts)
  if (transicionesCount === 0) score += 20;
  else if (transicionesCount <= 2) score += 8;

  // 4. Densidad de datos (15 pts)
  if (densidad >= 2) score += 15;
  else if (densidad >= 1) score += 11;
  else if (densidad > 0) score += 6;

  // 5. Variación de oraciones (10 pts)
  if (variacion === 'ALTA') score += 10;
  else if (variacion === 'MEDIA') score += 6;

  // 6. Contexto (10 pts)
  if (contextoCount >= 1) score += 10;

  // 7. Fuentes/Citas (5 pts)
  if (fuentesCount >= 1 || citasCount >= 1) score += 5;

  if (score > 100) score = 100;
  let nivel = score >= 90 ? 'ORO' : (score >= 75 ? 'BRONCE' : 'PELIGRO');
`;

console.log('🔄 Sincronizando lógica de scoring en todo el sistema...');

// TODO: Aquí aplicaría las ediciones a los archivos de la API y lib
// Pero lo haré directamente con las herramientas de edición para mayor seguridad.
