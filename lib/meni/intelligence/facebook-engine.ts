/**
 * Facebook Engine — Genera copy para Facebook desde reglas, no desde prompts.
 */

import type { IntelligenceEngineInput, FacebookDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const EMOJIS_POR_CATEGORIA: Record<string, string> = {
  Sucesos: '🚨',
  Nacionales: '🇳🇮',
  Internacionales: '🌍',
  Deportes: '⚽',
  Tecnología: '📱',
  Economía: '💰',
  Cultura: '🎨',
  Espectáculos: '🎬',
  Política: '🏛️',
  Salud: '🏥',
  Educación: '📚',
  General: '📰',
};

function generarGancho(texto: string): string {
  const t = texto.toLowerCase();
  if (/accidente|choque|fallecido/i.test(t)) return 'Detalles del siniestro y estado de las víctimas';
  if (/incendio/i.test(t)) return 'Así fue controlado el siniestro';
  if (/precio|inflación|economía/i.test(t)) return 'Cómo te afecta en el bolsillo';
  if (/salud|dengue|covid/i.test(t)) return 'Lo que debes saber para protegerte';
  if (/deporte/i.test(t)) return 'El resultado y lo que viene';
  if (/detención|captura/i.test(t)) return 'Los cargos y el proceso legal';
  return 'Toda la información que necesitas entender';
}

function generarHashtags(titulo: string, categoria: string, departamento?: string): string[] {
  const tags = new Set<string>();
  tags.add('#NicaraguaInformate');
  const cat = categoria.replace(/[^a-zA-Záéíóúñ]/g, '');
  tags.add(`#${cat}`);
  if (departamento && departamento.trim()) {
    tags.add(`#${departamento.replace(/\s+/g, '')}`);
  }
  const palabras = titulo.split(/\s+/).filter((p) => p.length > 4);
  for (const p of palabras.slice(0, 2)) {
    const clean = p.replace(/[^a-zA-Záéíóúñ]/g, '');
    if (clean.length > 4) tags.add(`#${clean}`);
  }
  return [...tags].slice(0, 6);
}

function computeScore(copy: string, hashtags: string[]): number {
  let score = 60;
  if (copy.length >= 100 && copy.length <= 500) score += 20;
  if (hashtags.length >= 3) score += 10;
  if (hashtags.length >= 5) score += 5;
  if (/https?:\/\//.test(copy)) score += 5;
  return Math.min(score, 100);
}

export function runFacebookEngine(input: IntelligenceEngineInput): FacebookDecision {
  const emoji = EMOJIS_POR_CATEGORIA[input.categoria] || '📰';
  const titulo = stripHtml(input.titulo);
  const texto = stripHtml(input.contenido);
  const gancho = generarGancho(texto);
  const hashtags = generarHashtags(titulo, input.categoria, input.departamento);
  const slug = input.slug || titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const url = `https://informate.ni/noticias/${slug}`;
  const copy = `${emoji} ${titulo}\n\n${gancho}\n\n${url}\n\n${hashtags.join(' ')}`;
  const score = computeScore(copy, hashtags);

  return { copy, emoji, hashtags, score };
}
