/**
 * Reader Retention Engine
 * =======================
 * Analiza en qué párrafo abandonaría el lector.
 * Recomienda reestructurar si hay riesgos.
 */

import type { EditorialBrainInput, ReaderRetentionDecision, RetentionRisk } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function analizarRiesgos(texto: string): RetentionRisk[] {
  const riesgos: RetentionRisk[] = [];
  const parrafos = texto.split(/\n\s*\n|<p>/i).filter(p => p.trim().length > 0);

  for (let i = 0; i < parrafos.length; i++) {
    const p = parrafos[i].toLowerCase();
    const numParrafo = i + 1;

    if (p.split(/\s+/).length > 80) {
      riesgos.push({
        parrafo: numParrafo,
        razon: 'Párrafo demasiado largo (>80 palabras)',
        solucion: 'Dividir en 2-3 párrafos cortos de 2-3 oraciones',
      });
    }
    if (/según|informó|declaró|manifestó/i.test(p) && !/cómo|por qué|impacto/i.test(p)) {
      riesgos.push({
        parrafo: numParrafo,
        razon: 'Párrafo solo transcribe declaración sin agregar valor',
        solucion: 'Añadir contexto o explicación después de la declaración',
      });
    }
    if (i > 0 && i < parrafos.length - 1 && p.split(/\s+/).length < 15) {
      riesgos.push({
        parrafo: numParrafo,
        razon: 'Párrafo muy corto que rompe el ritmo de lectura',
        solucion: 'Fusionar con el párrafo anterior o ampliar',
      });
    }
    if (/además|asimismo|por otro lado|cabe destacar|es importante señalar/i.test(p)) {
      riesgos.push({
        parrafo: numParrafo,
        razon: 'Transición robótica típica de IA',
        solucion: 'Reemplazar por una transición natural o eliminar',
      });
    }
    if (i === 0 && !/qué|cómo|por qué|dónde|quién/i.test(p) && p.split(/\s+/).length > 40) {
      riesgos.push({
        parrafo: numParrafo,
        razon: 'Primer párrafo denso sin gancho',
        solucion: 'Empezar con el hecho principal en una oración directa',
      });
    }
  }

  return riesgos;
}

function generarEstrategia(riesgos: RetentionRisk[]): string {
  if (riesgos.length === 0) return 'Estructura sin riesgos detectados. Mantener párrafos cortos.';
  const estrategias: string[] = [];
  if (riesgos.some(r => r.razon.includes('largo'))) estrategias.push('Párrafos de máximo 3 oraciones');
  if (riesgos.some(r => r.razon.includes('transcribe'))) estrategias.push('Después de cada declaración, añadir explicación o contexto');
  if (riesgos.some(r => r.razon.includes('robótica'))) estrategias.push('Eliminar transiciones automáticas');
  if (riesgos.some(r => r.razon.includes('gancho'))) estrategias.push('Empezar con el hecho en una oración directa');
  return estrategias.length > 0 ? estrategias.join('. ') : 'Revisar estructura general.';
}

export function runReaderRetentionEngine(input: EditorialBrainInput): ReaderRetentionDecision {
  const texto = stripHtml(input.contenido);
  const riesgos = analizarRiesgos(texto);
  const reestructurar = riesgos.length >= 2;
  const estrategia = generarEstrategia(riesgos);

  let score = 80;
  score -= riesgos.length * 8;
  if (reestructurar) score -= 10;
  score = Math.max(0, Math.min(score, 100));

  return { riesgos, reestructurar, estrategia, score };
}
