/**
 * Public Value Engine
 * ===================
 * ¿Esta noticia ayuda al lector o solamente informa?
 * MENI debe ayudar. No solamente contar.
 */

import type { EditorialBrainInput, PublicValueDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectarTipo(texto: string): string {
  const t = texto.toLowerCase();
  if (/accidente|choque|muerte|fallecido/i.test(t)) return 'sucesos';
  if (/precio|inflación|salario|economía/i.test(t)) return 'economia';
  if (/salud|dengue|covid|enfermedad/i.test(t)) return 'salud';
  if (/política|gobierno|asamblea/i.test(t)) return 'politica';
  if (/inundación|deslave|tormenta/i.test(t)) return 'desastre';
  if (/deporte|fútbol|baseball/i.test(t)) return 'deporte';
  return 'general';
}

function detectarSiAyuda(tipo: string): { ayuda: boolean; aporte: string } {
  const tiposQueAyudan: Record<string, string> = {
    economia: 'Traduce cifras a impacto en el bolsillo. El lector sabe cuánto más va a pagar.',
    salud: 'Explica cómo protegerse, qué síntomas buscar, dónde atenderse.',
    desastre: 'Indica qué hacer, dónde evacuar, cómo prepararse.',
    sucesos: 'Explica causas y prevención. El lector aprende a evitar riesgos.',
    politica: 'Explica cómo afecta al ciudadano y qué cambia.',
    deporte: 'Contexto del torneo y significado del resultado.',
    general: 'Aporta contexto y explicación para que el lector entienda mejor.',
  };

  const aporte = tiposQueAyudan[tipo] ?? tiposQueAyudan.general;
  const ayuda = !!aporte;
  return { ayuda, aporte };
}

function detectarSiSoloInforma(texto: string): boolean {
  const t = texto.toLowerCase();
  const soloInforma = [
    /según informó/i, /se informó que/i, /en un comunicado/i,
    /declaró que/i, /manifestó que/i, /aseguró que/i,
  ];
  let coincidencias = 0;
  for (const p of soloInforma) if (p.test(t)) coincidencias++;
  if (coincidencias >= 2 && !/cómo|por qué|qué significa|prevención|impacto/i.test(t)) return true;
  return false;
}

export function runPublicValueEngine(input: EditorialBrainInput): PublicValueDecision {
  const texto = stripHtml(`${input.titulo} ${input.contenido}`);
  const tipo = detectarTipo(texto);

  const { ayuda, aporte } = detectarSiAyuda(tipo);
  const soloInforma = detectarSiSoloInforma(texto);

  let score = 60;
  if (ayuda) score += 20;
  if (!soloInforma) score += 15;
  if (/cómo|por qué|qué hacer|prevención/i.test(texto.toLowerCase())) score += 10;
  score = Math.min(score, 100);

  return { ayudaAlLector: ayuda, soloInforma, queAporta: aporte, score };
}
