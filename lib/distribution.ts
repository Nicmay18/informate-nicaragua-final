import type { Noticia } from '@/lib/types';
import { buildFacebookCopy, buildWhatsAppCopy } from '@/lib/distribution/social-copy';

export interface DistributionPayload {
  facebook: string;
  whatsapp: string;
  newsletter: string;
  push: string;
}

const CAT_EMOJI: Record<string, string> = {
  Sucesos: '🚨', Nacionales: '🇳🇮', Economía: '💰', Cultura: '🎭',
  Espectáculos: '🎬', Deportes: '⚽', Tecnología: '💻', Internacionales: '🌍',
  Salud: '🏥', Política: '🏛️', Educación: '📚', General: '📰',
};

/** Extrae 1-2 oraciones completas ≤ maxChars — fallback determinista, nunca inventa. */
function contexto(texto: string, maxChars = 200): string {
  const limpio = String(texto || '').replace(/\n+/g, ' ').trim();
  if (!limpio) return '';
  const oraciones = limpio.match(/[^.!?]+[.!?]+/g) || [];
  let out = '';
  for (const o of oraciones) {
    const l = o.trim();
    if (out.length + l.length + 1 > maxChars && out.length > 0) break;
    out += (out ? ' ' : '') + l;
  }
  if (!out) {
    out = limpio.substring(0, maxChars);
    const esp = out.lastIndexOf(' ');
    if (esp > maxChars * 0.6) out = out.substring(0, esp);
  }
  return out;
}

/**
 * Textos editoriales por canal — cada canal tiene su propio tono.
 * Delega en la capa editorial común (social-copy): el ángulo se extrae
 * una vez y cada canal lo presenta distinto (informar/atraer/compartir).
 * Determinista: nunca inventa datos; todo sale del artículo.
 */
export function generateDistribution(noticia: Noticia, baseUrl = 'https://nicaraguainformate.com'): DistributionPayload {
  const url = `${baseUrl}/noticias/${noticia.slug}`;
  const emoji = CAT_EMOJI[noticia.categoria || ''] || '📰';
  const resumen = String(noticia.resumen || '');
  const hook = contexto(resumen, 200) || noticia.titulo;

  const fb = buildFacebookCopy(noticia);
  const facebook = `${fb.text}\n\n� ${fb.url}`;

  const whatsapp = buildWhatsAppCopy(noticia);

  const newsletter = [
    `<h2><a href="${url}?utm_source=newsletter&utm_medium=social">${noticia.titulo}</a></h2>`,
    `<p>${resumen || hook}</p>`,
    `<p><a href="${url}?utm_source=newsletter&utm_medium=social" style="color:#2563eb;">Leer la noticia completa →</a></p>`,
  ].join('\n');

  const push = `${emoji} ${noticia.titulo}`.substring(0, 90);

  return { facebook, whatsapp, newsletter, push };
}

export function shouldDistribute(noticia: Noticia): boolean {
  return (noticia.scoreMeni ?? 0) >= 80 || noticia.categoria === 'Nacionales' || (noticia.vistas ?? 0) >= 50;
}
