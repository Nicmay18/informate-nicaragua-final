import type { Noticia } from '@/lib/types';

export interface DistributionPayload {
  facebook: string;
  whatsapp: string;
  newsletter: string;
  push: string;
}

export function generateDistribution(noticia: Noticia, baseUrl = 'https://nicaraguainformate.com'): DistributionPayload {
  const url = `${baseUrl}/noticias/${noticia.slug}`;

  const facebook = `${noticia.titulo}\n\n${noticia.resumen}\n\nLeer más: ${url}`;

  const whatsapp = `📰 *${noticia.titulo}*\n\n${noticia.resumen.slice(0, 120)}…\n\n👉 ${url}`;

  const newsletter = `<h2><a href="${url}">${noticia.titulo}</a></h2><p>${noticia.resumen}</p>`;

  const push = `🔥 ${noticia.titulo} — ${noticia.categoria}`;

  return { facebook, whatsapp, newsletter, push };
}

export function shouldDistribute(noticia: Noticia): boolean {
  return (noticia.scoreMeni ?? 0) >= 80 || noticia.categoria === 'Nacionales' || (noticia.vistas ?? 0) >= 50;
}
