import type { Noticia } from '@/lib/types';

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
 * Textos editoriales por canal — cada canal tiene su propio tono:
 * - Facebook: contexto + pregunta de engagement (audiencia general)
 * - WhatsApp: formato de grupo/comunidad, directo y escaneable
 * - Newsletter: HTML con jerarquía editorial
 * - Push: alerta breve ≤ 90 chars
 * Determinista: nunca inventa datos; todo sale del artículo.
 */
export function generateDistribution(noticia: Noticia, baseUrl = 'https://nicaraguainformate.com'): DistributionPayload {
  const url = `${baseUrl}/noticias/${noticia.slug}`;
  const emoji = CAT_EMOJI[noticia.categoria || ''] || '📰';
  const resumen = String(noticia.resumen || '');
  const hook = contexto(resumen, 200) || noticia.titulo;
  const breve = contexto(resumen, 120) || noticia.titulo;

  const facebook = [
    `${emoji} ${noticia.titulo}`,
    '',
    hook,
    '',
    `👀 Lee los detalles completos:`,
    `${url}?utm_source=facebook`,
    '',
    `¿Qué opinás? Te leemos en los comentarios 👇`,
    `#NicaraguaInformate`,
  ].join('\n');

  const whatsapp = [
    `${emoji} *${noticia.titulo}*`,
    '',
    `_${breve}_`,
    '',
    `Leé la nota completa 👇`,
    `${url}?utm_source=whatsapp`,
  ].join('\n');

  const newsletter = [
    `<h2><a href="${url}">${noticia.titulo}</a></h2>`,
    `<p>${resumen || hook}</p>`,
    `<p><a href="${url}" style="color:#2563eb;">Leer la noticia completa →</a></p>`,
  ].join('\n');

  const push = `${emoji} ${noticia.titulo}`.substring(0, 90);

  return { facebook, whatsapp, newsletter, push };
}

export function shouldDistribute(noticia: Noticia): boolean {
  return (noticia.scoreMeni ?? 0) >= 80 || noticia.categoria === 'Nacionales' || (noticia.vistas ?? 0) >= 50;
}
