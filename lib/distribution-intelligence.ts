import type { Noticia } from '@/lib/types';

export type DistributionChannel = 'Telegram' | 'WhatsApp' | 'Newsletter' | 'Facebook';
export type DistributionDecision = 'SEND' | 'OMIT' | 'INSUFFICIENT_DATA';
export type DistributionProvenance = 'HEURISTIC' | 'INSUFFICIENT_DATA';

export interface ChannelRecommendation {
  channel: DistributionChannel;
  decision: DistributionDecision;
  priority: number;
  reason: string;
  evidence: string[];
  action: string;
  confidence: DistributionProvenance;
  format?: string;
}

interface ChannelRule {
  channel: DistributionChannel;
  decision: (n: Noticia) => DistributionDecision;
  priority: (n: Noticia) => number;
  reason: (n: Noticia) => string;
  action: (n: Noticia) => string;
  format: (n: Noticia, articleUrl: string | null) => string | undefined;
}

function isHighInterest(n: Noticia): boolean {
  return n.categoria === 'Nacionales' || n.categoria === 'Sucesos';
}

function hasViews(n: Noticia, min: number): boolean {
  return typeof n.vistas === 'number' && n.vistas >= min;
}

function hasQuality(n: Noticia, min: number): boolean {
  return typeof n.scoreMeni === 'number' && n.scoreMeni >= min;
}

export function recommendDistribution(noticia: Noticia): ChannelRecommendation[] {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? null;
  const articleUrl = baseUrl ? `${baseUrl}/noticias/${noticia.slug}` : null;

  const channelRules: ChannelRule[] = [
    {
      channel: 'Telegram',
      decision: () => 'SEND',
      priority: () => 1,
      reason: () => 'Canal directo y ágil para alertas informativas.',
      action: () => 'Enviar alerta inmediata con titular y enlace.',
      format: (n) =>
        `${n.categoria}: ${n.titulo}\n${n.resumen?.slice(0, 140)}…\nLeer más: /noticias/${n.slug}`,
    },
    {
      channel: 'WhatsApp',
      decision: (n) =>
        isHighInterest(n) || hasQuality(n, 90) ? 'SEND' : 'OMIT',
      priority: (n) =>
        isHighInterest(n) || hasQuality(n, 90) ? 1 : 0,
      reason: (n) =>
        isHighInterest(n)
          ? 'Categoría de alto interés para comunidad.'
          : hasQuality(n, 90)
            ? 'ScoreMeni ≥90 indica calidad.'
            : 'No hay indicadores de interés suficiente.',
      action: (n) =>
        isHighInterest(n) || hasQuality(n, 90)
          ? 'Compartir en grupos de WhatsApp.'
          : 'No enviar a WhatsApp.',
      format: (n, url) =>
        url
          ? `📰 ${n.titulo}\n\n${n.resumen?.slice(0, 160)}…\n👉 ${url}`
          : undefined,
    },
    {
      channel: 'Facebook',
      decision: (n) =>
        ['Tecnología', 'Deportes', 'Internacionales'].includes(n.categoria) || hasViews(n, 80)
          ? 'SEND'
          : 'OMIT',
      priority: (n) =>
        ['Tecnología', 'Deportes', 'Internacionales'].includes(n.categoria) || hasViews(n, 80)
          ? 2
          : 0,
      reason: (n) =>
        ['Tecnología', 'Deportes', 'Internacionales'].includes(n.categoria)
          ? `Categoría ${n.categoria} invita a comentar.`
          : hasViews(n, 80)
            ? '≥80 vistas indican tracción para formato largo.'
            : 'Sin tracción suficiente ni categoría prioritaria.',
      action: (n) =>
        ['Tecnología', 'Deportes', 'Internacionales'].includes(n.categoria) || hasViews(n, 80)
          ? 'Publicar en Facebook con contexto.'
          : 'Omitir Facebook.',
      format: (n, url) =>
        url
          ? `${n.titulo}\n\nContexto: ${n.resumen?.slice(0, 220)}…\n\n¿Qué opinas? Lee el análisis completo: ${url}`
          : undefined,
    },
    {
      channel: 'Newsletter',
      decision: (n) =>
        ['Nacionales', 'Internacionales'].includes(n.categoria) || hasViews(n, 150)
          ? 'SEND'
          : 'OMIT',
      priority: (n) =>
        ['Nacionales', 'Internacionales'].includes(n.categoria) || hasViews(n, 150)
          ? 3
          : 0,
      reason: (n) =>
        ['Nacionales', 'Internacionales'].includes(n.categoria)
          ? 'Categoría apropiada para resumen.'
          : hasViews(n, 150)
            ? '≥150 vistas la hacen destacable.'
            : 'No reúne criterios para resumen.',
      action: (n) =>
        ['Nacionales', 'Internacionales'].includes(n.categoria) || hasViews(n, 150)
          ? 'Incluir en resumen matutino o semanal.'
          : 'No incluir en newsletter.',
      format: (n) => `• ${n.titulo}: ${n.resumen?.slice(0, 120)}… Leer más.`,
    },
  ];

  return channelRules
    .map((rule) => {
      const decision = rule.decision(noticia);
      const confidence: DistributionProvenance =
        !baseUrl && ['WhatsApp', 'Facebook'].includes(rule.channel)
          ? 'INSUFFICIENT_DATA'
          : 'HEURISTIC';

      const evidence: string[] = [
        `categoria=${noticia.categoria}`,
      ];
      if (typeof noticia.vistas === 'number') evidence.push(`vistas=${noticia.vistas}`);
      else evidence.push('vistas=NO_DATA');
      if (typeof noticia.scoreMeni === 'number') evidence.push(`scoreMeni=${noticia.scoreMeni}`);
      else evidence.push('scoreMeni=NO_DATA');
      if (!baseUrl) evidence.push('NEXT_PUBLIC_SITE_URL=NO_DATA (sin dominio confirmado)');
      else evidence.push(`dominio=${baseUrl}`);

      return {
        channel: rule.channel,
        decision,
        priority: rule.priority(noticia),
        reason: rule.reason(noticia),
        evidence,
        action: rule.action(noticia),
        confidence,
        format: rule.format(noticia, articleUrl),
      };
    })
    .sort((a, b) => a.priority - b.priority);
}
