/**
 * Originality Engine — Mide explicación vs transcripción.
 * Si la nota solo cambia palabras → score = 20
 * Si reorganiza → score = 50
 * Si aporta contexto → score = 80
 * Si explica mejor → score = 100
 */

import type { IntelligenceEngineInput, OriginalityDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const TRANSICIONES_IA = [
  'en un giro inesperado',
  'cabe destacar que',
  'es importante mencionar',
  'no obstante',
  'por otro lado',
  'en este sentido',
  'vale la pena señalar',
  'como es de conocimiento',
  'hay que tener en cuenta',
];

const ADJETIVOS_EMOCIONALES = [
  'impactante', 'escalofriante', 'terrible', 'dramático', 'devastador',
  'conmocionado', 'horroroso', 'espeluznante', 'trágico', 'fatal',
];

const PALABRAS_RELLENO = [
  'diversos', 'múltiples', 'numerosos', 'algunos', 'ciertos',
  'se comenta', 'se dice', 'se rumorea', 'al parecer',
];

function detectarNivelTranscripcion(texto: string, titulo: string, fuente?: string): number {
  if (!fuente) return 50;
  const textoNoticia = stripHtml(`${titulo} ${texto}`).toLowerCase();
  const textoFuente = stripHtml(fuente).toLowerCase();
  const palabrasNoticia = textoNoticia.split(/\s+/).filter(Boolean);
  let coincidencias = 0;
  const ventana = 3;
  for (let i = 0; i < palabrasNoticia.length - ventana; i++) {
    const ngrama = palabrasNoticia.slice(i, i + ventana).join(' ');
    if (textoFuente.includes(ngrama)) coincidencias++;
  }
  const total = Math.max(palabrasNoticia.length - ventana, 1);
  return Math.round((coincidencias / total) * 100);
}

function detectarNivelReorganizacion(texto: string): number {
  const parrafos = texto.split(/\n+/).filter((p) => p.trim().length > 20);
  if (parrafos.length <= 1) return 20;
  let score = 40;
  if (parrafos.length >= 3) score += 20;
  if (/<h2/i.test(texto)) score += 20;
  if (/<strong/i.test(texto)) score += 10;
  if (/<blockquote/i.test(texto)) score += 10;
  return Math.min(score, 100);
}

function detectarNivelAporteContexto(texto: string): number {
  let score = 20;
  const textoLower = texto.toLowerCase();
  if (/\bantecedente\b|\bcontexto\b|\bhistoria\b|\bprevio\b|\banterior\b/i.test(textoLower)) score += 20;
  if (/\bporque\b|\bdebido a\b|\bcomo resultado\b|\bcausa\b|\bmotivo\b/i.test(textoLower)) score += 20;
  if (/\bconsecuencia\b|\bimpacto\b|\bafectación\b|\bimplicación\b/i.test(textoLower)) score += 20;
  if (/\bpara los\b|\blos habitantes\b|\blos ciudadanos\b|\bnicaragüense/i.test(textoLower)) score += 20;
  return Math.min(score, 100);
}

function detectarNivelExplicacion(texto: string): number {
  let score = 20;
  const textoLower = texto.toLowerCase();
  if (/\bqué es\b|\bqué significa\b|\bcómo funciona\b/i.test(textoLower)) score += 25;
  if (/\bes decir\b|\bo sea\b|\ben otras palabras\b|\bexplicado de otra forma\b/i.test(textoLower)) score += 20;
  if (/\bpor ejemplo\b|\bcomo cuando\b|\bsupongamos que\b/i.test(textoLower)) score += 15;
  if (/\besto significa que\b|\blo que quiere decir\b|\bpara entenderlo mejor\b/i.test(textoLower)) score += 20;
  return Math.min(score, 100);
}

function detectarContaminacion(texto: string): { ia: string[]; emocional: string[]; relleno: string[] } {
  const textoLower = texto.toLowerCase();
  const ia = TRANSICIONES_IA.filter((t) => textoLower.includes(t));
  const emocional = ADJETIVOS_EMOCIONALES.filter((t) => textoLower.includes(t));
  const relleno = PALABRAS_RELLENO.filter((t) => textoLower.includes(t));
  return { ia, emocional, relleno };
}

function determinarVeredicto(
  transcripcion: number,
  reorganizacion: number,
  contexto: number,
  explicacion: number,
): { veredicto: OriginalityDecision['veredicto']; razon: string } {
  if (explicacion >= 70 && contexto >= 60) {
    return {
      veredicto: 'explica_mejor',
      razon: 'La nota explica mejor: aporta contexto, aclara conceptos y organiza la información para que el lector comprenda.',
    };
  }
  if (contexto >= 60) {
    return {
      veredicto: 'aporta_contexto',
      razon: 'La nota aporta contexto más allá de la fuente, pero podría explicar mejor los conceptos.',
    };
  }
  if (reorganizacion >= 50 && transcripcion < 40) {
    return {
      veredicto: 'reorganiza',
      razon: 'La nota reorganiza la información pero no aporta contexto ni explicación adicional.',
    };
  }
  return {
    veredicto: 'solo_cambia_palabras',
    razon: 'La nota solo cambia palabras de la fuente. No aporta contexto, no explica, no reorganiza. No tiene valor diferencial.',
  };
}

function computeScore(
  transcripcion: number,
  reorganizacion: number,
  contexto: number,
  explicacion: number,
  contaminacion: { ia: string[]; emocional: string[]; relleno: string[] },
): number {
  let score = 20;
  if (reorganizacion >= 50) score = 50;
  if (contexto >= 60) score = 80;
  if (explicacion >= 70 && contexto >= 60) score = 100;
  score -= contaminacion.ia.length * 5;
  score -= contaminacion.emocional.length * 5;
  score -= contaminacion.relleno.length * 3;
  if (transcripcion > 60) score -= 20;
  return Math.max(0, Math.min(score, 100));
}

export function runOriginalityEngine(input: IntelligenceEngineInput): OriginalityDecision {
  const texto = stripHtml(input.contenido);
  const nivelTranscripcion = detectarNivelTranscripcion(texto, input.titulo, input.fuente);
  const nivelReorganizacion = detectarNivelReorganizacion(input.contenido);
  const nivelAporteContexto = detectarNivelAporteContexto(texto);
  const nivelExplicacion = detectarNivelExplicacion(texto);
  const contaminacion = detectarContaminacion(texto);
  const { veredicto, razon } = determinarVeredicto(
    nivelTranscripcion,
    nivelReorganizacion,
    nivelAporteContexto,
    nivelExplicacion,
  );
  const score = computeScore(
    nivelTranscripcion,
    nivelReorganizacion,
    nivelAporteContexto,
    nivelExplicacion,
    contaminacion,
  );

  return {
    nivelTranscripcion,
    nivelReorganizacion,
    nivelAporteContexto,
    nivelExplicacion,
    score,
    veredicto,
    razon,
  };
}
