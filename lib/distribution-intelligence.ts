import type { Noticia } from '@/lib/types';

export type DistributionChannel = 'Telegram' | 'WhatsApp' | 'Newsletter' | 'Facebook';

export interface ChannelRecommendation {
  channel: DistributionChannel;
  priority: number;
  reason: string;
  format: string;
}

function importanceScore(noticia: Noticia): number {
  let s = 0;
  if (noticia.categoria === 'Nacionales' || noticia.categoria === 'Sucesos') s += 3;
  if (noticia.vistas && noticia.vistas > 100) s += 2;
  if (noticia.scoreMeni && noticia.scoreMeni >= 90) s += 2;
  if (noticia.puntosClave && noticia.puntosClave.length > 0) s += 1;
  return s;
}

export function recommendDistribution(noticia: Noticia): ChannelRecommendation[] {
  const score = importanceScore(noticia);
  const recs: ChannelRecommendation[] = [];

  // Telegram: informativo, rápido, todas las noticias
  recs.push({
    channel: 'Telegram',
    priority: score >= 5 ? 1 : 2,
    reason: 'Canal directo y ágil para alertas informativas.',
    format: `${noticia.categoria}: ${noticia.titulo}\n${noticia.resumen?.slice(0, 140)}…\nLeer más: /noticias/${noticia.slug}`,
  });

  // WhatsApp: alto interés nacional o sucesos
  if (score >= 4) {
    recs.push({
      channel: 'WhatsApp',
      priority: 1,
      reason: 'Noticia de alto interés para compartir en comunidad.',
      format: `📰 ${noticia.titulo}\n\n${noticia.resumen?.slice(0, 160)}…\n👉 https://nicaraguainformate.com/noticias/${noticia.slug}`,
    });
  }

  // Facebook: curiosidad + contexto, mejor para noticias con impacto o utilidad
  if (noticia.categoria === 'Tecnología' || noticia.categoria === 'Deportes' || noticia.categoria === 'Internacionales' || (noticia.vistas && noticia.vistas > 80)) {
    recs.push({
      channel: 'Facebook',
      priority: 2,
      reason: 'Formato más largo, invita a comentar.',
      format: `${noticia.titulo}\n\nContexto: ${noticia.resumen?.slice(0, 220)}…\n\n¿Qué opinas? Lee el análisis completo: https://nicaraguainformate.com/noticias/${noticia.slug}`,
    });
  }

  // Newsletter: resumen, nacionales y evergreen
  if (noticia.categoria === 'Nacionales' || noticia.categoria === 'Internacionales' || (noticia.vistas && noticia.vistas > 150)) {
    recs.push({
      channel: 'Newsletter',
      priority: 3,
      reason: 'Destacar en resumen matutino o semanal.',
      format: `• ${noticia.titulo}: ${noticia.resumen?.slice(0, 120)}… Leer más.`,
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}
