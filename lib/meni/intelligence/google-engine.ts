/**
 * Google Engine — Genera título SEO, meta descripción, slug y keywords desde reglas.
 */

import type { IntelligenceEngineInput, GoogleDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function generarTituloSEO(titulo: string, departamento?: string): string {
  let base = titulo.trim();
  if (base.length > 68) {
    base = base.slice(0, 65).replace(/\s+\S*$/, '') + '…';
  }
  if (departamento && departamento.trim() && !base.includes(departamento)) {
    const suffix = ` en ${departamento}`;
    if (base.length + suffix.length <= 68) {
      base += suffix;
    }
  }
  return base;
}

function generarMetaDescripcion(texto: string, titulo: string): string {
  const textoPlano = stripHtml(texto);
  let meta = textoPlano.slice(0, 155);
  if (meta.length === 155) {
    meta = meta.replace(/\s+\S*$/, '') + '…';
  }
  if (meta.length < 120) {
    meta = `${titulo}. ${meta}`;
    if (meta.length > 160) meta = meta.slice(0, 157).replace(/\s+\S*$/, '') + '…';
  }
  return meta;
}

function generarSlug(titulo: string): string {
  const stopwords = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'y', 'a', 'que', 'se', 'con', 'por', 'para', 'su']);
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w && !stopwords.has(w))
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function generarKeywords(titulo: string, texto: string, categoria: string, departamento?: string): string[] {
  const keywords = new Set<string>();
  const textoCompleto = `${titulo} ${texto}`;
  const palabras = textoCompleto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const freq: Record<string, number> = {};
  for (const p of palabras) {
    freq[p] = (freq[p] || 0) + 1;
  }
  const top = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([w]) => w);
  for (const w of top) keywords.add(w);
  keywords.add(categoria.toLowerCase());
  if (departamento && departamento.trim()) keywords.add(departamento.toLowerCase());
  if (/accidente|choque/i.test(textoCompleto)) keywords.add('accidente');
  if (/incendio/i.test(textoCompleto)) keywords.add('incendio');
  if (/managua/i.test(textoCompleto)) keywords.add('managua');
  return [...keywords].slice(0, 8);
}

function detectarSchemaType(categoria: string): string {
  if (/deporte/i.test(categoria)) return 'SportsEvent';
  if (/economía|salud/i.test(categoria)) return 'Article';
  return 'NewsArticle';
}

function computeScore(titulo: string, meta: string, slug: string, keywords: string[]): number {
  let score = 50;
  if (titulo.length >= 50 && titulo.length <= 68) score += 15;
  if (meta.length >= 120 && meta.length <= 165) score += 15;
  if (slug.length > 0 && slug.length <= 50) score += 10;
  if (keywords.length >= 5) score += 10;
  return Math.min(score, 100);
}

export function runGoogleEngine(input: IntelligenceEngineInput): GoogleDecision {
  const tituloSEO = generarTituloSEO(input.titulo, input.departamento);
  const metaDescripcion = generarMetaDescripcion(input.contenido, input.titulo);
  const slug = input.slug || generarSlug(input.titulo);
  const keywords = generarKeywords(input.titulo, input.contenido, input.categoria, input.departamento);
  const schemaType = detectarSchemaType(input.categoria);
  const score = computeScore(tituloSEO, metaDescripcion, slug, keywords);

  return { tituloSEO, metaDescripcion, slug, keywords, schemaType, score };
}
