import type { Noticia } from '@/lib/types';

export interface EditorialDimensions {
  claridad: number;
  contexto: number;
  utilidad: number;
  confianza: number;
}

export interface EditorialIntelligenceResult {
  valorEditorial: number;
  dimensions: EditorialDimensions;
  lectorEntiende: {
    que: boolean;
    quien: boolean;
    cuando: boolean;
    donde: boolean;
    significado: boolean;
  };
  antecedentes: boolean;
  explicacion: boolean;
  impacto: boolean;
  recomendacion: 'Publicable' | 'Revisión' | 'Mejorar';
  fortalezas: string[];
  oportunidades: string[];
}

const CLARIDAD_KEYWORDS = {
  que: ['ocurrió', 'sucedió', 'pasó', 'se trata de', 'consiste en', 'se realizó', 'se aprobó', 'se anunció'],
  quien: ['autoridades', 'gobierno', 'alcaldes', 'ministerio', 'presidente', 'empresa', 'organización', 'policía'],
  cuando: ['este', 'ayer', 'hoy', 'la semana pasada', 'el lunes', 'el martes', '2026', 'a las'],
  donde: ['en nicaragua', 'en managua', 'en león', 'en granada', 'en chinandega', 'departamento de', 'región'],
  significado: ['significa', 'implica', 'impacto', 'consecuencia', 'resultado', 'por lo tanto', 'en consecuencia'],
};

function scoreBoolean(value: boolean, weight = 1): number {
  return value ? weight : 0;
}

function normalize(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function hasMatch(text: string, patterns: string[]): boolean {
  const t = text.toLowerCase();
  return patterns.some((p) => t.includes(p.toLowerCase()));
}

function detectClaridad(noticia: Noticia): Record<keyof EditorialIntelligenceResult['lectorEntiende'], boolean> {
  const text = `${noticia.titulo} ${noticia.resumen} ${noticia.contenido || ''} ${(noticia.puntosClave || []).join(' ')}`;
  return {
    que: hasMatch(text, CLARIDAD_KEYWORDS.que),
    quien: hasMatch(text, CLARIDAD_KEYWORDS.quien),
    cuando: hasMatch(text, CLARIDAD_KEYWORDS.cuando),
    donde: hasMatch(text, CLARIDAD_KEYWORDS.donde),
    significado: hasMatch(text, CLARIDAD_KEYWORDS.significado),
  };
}

function detectContext(noticia: Noticia): { antecedentes: boolean; explicacion: boolean; impacto: boolean } {
  const text = `${noticia.resumen} ${noticia.contenido || ''}`.toLowerCase();
  return {
    antecedentes: /\b(antes|previo|anterior|históric|desde 20\d{2}|desde hace|en el pasado)\b/.test(text),
    explicacion: /\b(por qué|porque|debido a|la razón|se debe a|explicado|significa|consiste)\b/.test(text),
    impacto: /\b(impacto|consecuencia|afecta|afectará|significa|resultado|beneficio|perjuicio)\b/.test(text),
  };
}

function scoreContext(context: ReturnType<typeof detectContext>, contentLength: number): number {
  let s = 0;
  s += scoreBoolean(context.antecedentes, 0.25);
  s += scoreBoolean(context.explicacion, 0.35);
  s += scoreBoolean(context.impacto, 0.40);
  // Una explicación robusta suele tener cuerpo suficiente.
  s += Math.min(0.25, contentLength / 2000);
  return normalize(s);
}

function scoreConfidence(noticia: Noticia): number {
  let s = 0;
  if (noticia.autor?.trim()) s += 0.25;
  if (noticia.metaDescription?.trim() && noticia.metaDescription.length >= 80) s += 0.15;
  if (noticia.keywords?.trim()) s += 0.15;
  if (noticia.imagen && noticia.imagen !== '/logo.webp') s += 0.15;
  if (noticia.pieFoto?.trim()) s += 0.10;
  if (noticia.puntosClave && noticia.puntosClave.length >= 2) s += 0.20;
  return normalize(s);
}

function scoreUtility(noticia: Noticia, lector: EditorialIntelligenceResult['lectorEntiende']): number {
  let s = 0;
  if (noticia.puntosClave && noticia.puntosClave.length >= 2) s += 0.30;
  if (noticia.tags && noticia.tags.length >= 2) s += 0.10;
  if (noticia.excerpt?.trim() || noticia.resumen?.trim()) s += 0.20;
  // Utilidad también depende de que el lector entienda el qué y el impacto.
  s += scoreBoolean(lector.que, 0.20);
  s += scoreBoolean(lector.significado, 0.20);
  return normalize(s);
}

function recommendation(score: number): EditorialIntelligenceResult['recomendacion'] {
  if (score >= 90) return 'Publicable';
  if (score >= 75) return 'Revisión';
  return 'Mejorar';
}

export function evaluateEditorialIntelligence(noticia: Noticia): EditorialIntelligenceResult {
  const lector = detectClaridad(noticia);
  const context = detectContext(noticia);
  const content = noticia.contenido || '';

  const claridad = normalize(
    (Object.values(lector).filter(Boolean).length / 5) * 1.0
  );
  const contexto = scoreContext(context, content.length);
  const utilidad = scoreUtility(noticia, lector);
  const confianza = scoreConfidence(noticia);

  const weights = { claridad: 0.30, contexto: 0.25, utilidad: 0.25, confianza: 0.20 };
  const valorEditorial = Math.round(
    (claridad * weights.claridad +
      contexto * weights.contexto +
      utilidad * weights.utilidad +
      confianza * weights.confianza) * 100
  );

  const fortalezas: string[] = [];
  const oportunidades: string[] = [];

  if (lector.que) fortalezas.push('Responde qué ocurrió.');
  else oportunidades.push('Explicar con más claridad qué ocurrió.');
  if (lector.significado) fortalezas.push('Aporta contexto del significado.');
  else oportunidades.push('Añadir por qué le importa al lector.');
  if (context.impacto) fortalezas.push('Menciona impacto o consecuencias.');
  else oportunidades.push('Incluir impacto para el ciudadano.');
  if (confianza >= 0.7) fortalezas.push('Fuentes y metadatos de confianza adecuados.');
  else oportunidades.push('Completar autor, metadescription y keywords.');

  return {
    valorEditorial,
    dimensions: {
      claridad: Math.round(claridad * 100),
      contexto: Math.round(contexto * 100),
      utilidad: Math.round(utilidad * 100),
      confianza: Math.round(confianza * 100),
    },
    lectorEntiende: lector,
    antecedentes: context.antecedentes,
    explicacion: context.explicacion,
    impacto: context.impacto,
    recomendacion: recommendation(valorEditorial),
    fortalezas,
    oportunidades,
  };
}
