import type { Noticia } from '@/lib/types';
import { CHANNEL_WINDOWS } from './constants';
import type { Channel, ChannelCopy, DistributionCommand, DistributionPlan, Severity } from './types';

const DAY = 24 * 60 * 60 * 1000;
const SITE = 'https://nicaraguainformate.com';

function toTime(v: unknown): number {
  if (v instanceof Date) return isNaN(v.getTime()) ? Date.now() : v.getTime();
  if (typeof v === 'string' && v.trim()) {
    const t = new Date(v).getTime();
    return isNaN(t) ? Date.now() : t;
  }
  return Date.now();
}

function clean(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function firstSentence(text: string): string {
  const plain = clean(text);
  const match = plain.match(/^.{40,180}?[.!?](\s|$)/);
  return (match?.[0] || plain.slice(0, 160)).trim();
}

function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  const at = text.lastIndexOf(' ', max - 1);
  return `${text.slice(0, at > 0 ? at : max - 1).trim()}…`;
}

/**
 * Cada canal tiene una promesa distinta. Un mismo texto en los cinco
 * canales es la forma más rápida de que ninguno funcione.
 */
function buildCopies(n: Noticia): ChannelCopy[] {
  const url = `${SITE}/noticias/${n.slug}`;
  const titulo = clean(n.titulo);
  const resumen = clean(n.resumen || '');
  const hook = resumen ? firstSentence(resumen) : titulo;
  const tag = n.categoria.replace(/\s+/g, '');

  const drafts: Array<{ channel: Channel; angle: string; text: string }> = [
    {
      channel: 'Facebook',
      angle: 'Conversación: abre con la consecuencia, cierra con pregunta.',
      text: `${hook}\n\n¿Cómo te afecta esto a vos? Contanos en los comentarios.\n\n${url}\n\n#Nicaragua #${tag}`,
    },
    {
      channel: 'Telegram',
      angle: 'Alerta seca: dato primero, sin adornos.',
      text: `${titulo.toUpperCase()}\n\n${cut(hook, 220)}\n\nLeer completo: ${url}`,
    },
    {
      channel: 'WhatsApp',
      angle: 'Mensaje reenviable: corto, personal, sin hashtags.',
      text: `${cut(titulo, 90)}\n\n${cut(hook, 150)}\n\n${url}`,
    },
    {
      channel: 'Newsletter',
      angle: 'Contexto: por qué esta nota importa hoy.',
      text: `${titulo}\n\n${cut(resumen || hook, 320)}\n\nPor qué te lo mandamos: es la nota de ${n.categoria} con mayor relevancia del día.\n\nLeer la nota completa → ${url}`,
    },
    {
      channel: 'Google Discover',
      angle: 'Titular declarativo sin clickbait, imagen mayor a 1200px.',
      text: `${cut(titulo, 70)}\n\nEntradilla sugerida: ${cut(hook, 140)}\n\nRequisito: imagen horizontal de al menos 1200px y autor con biografía activa.`,
    },
  ];

  return drafts.map((d) => ({
    channel: d.channel,
    angle: `${d.angle} Ventana: ${CHANNEL_WINDOWS[d.channel]}.`,
    text: d.text,
    charCount: d.text.length,
  }));
}

/**
 * Selecciona las notas que merecen distribución activa hoy y genera
 * un texto adaptado por canal para cada una.
 */
export function buildDistributionCommand(noticias: Noticia[], now = Date.now()): DistributionCommand {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const recent = published.filter((n) => toTime(n.fecha) > now - 2 * DAY);

  const pool = recent.length > 0 ? recent : published.slice(0, 12);

  const scored = pool
    .map((n) => {
      let score = n.vistas || 0;
      if (n.categoria === 'Nacionales') score += 40;
      if (n.categoria === 'Economía' || n.categoria === 'Tecnología') score += 25;
      if (n.categoria === 'Sucesos') score -= 20;
      if ((n.palabras || 0) >= 500) score += 15;
      if (n.imagen && !n.imagen.includes('logo')) score += 10;
      return { n, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const plans: DistributionPlan[] = scored.map(({ n, score }, i) => {
    const priority: Severity = i === 0 ? 'critica' : i < 3 ? 'alta' : 'media';
    const reason =
      n.categoria === 'Sucesos'
        ? 'Distribuir con cuidado: alto alcance pero no construye marca.'
        : `Prioridad ${priority} · ${n.vistas || 0} vistas actuales · categoría de marca.`;

    return {
      id: `dist-${n.slug}`,
      slug: n.slug,
      title: n.titulo,
      category: n.categoria,
      priority,
      reason: `${reason} Score de distribución: ${score}.`,
      copies: buildCopies(n),
    };
  });

  return { pending: pool.length, plans };
}
