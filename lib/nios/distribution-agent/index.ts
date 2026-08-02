import type { Noticia } from '@/lib/types';

export interface DistributionQueueItem {
  id: string;
  slug: string;
  title: string;
  categoria: string;
  channel: 'facebook' | 'telegram' | 'whatsapp' | 'newsletter' | 'push' | 'x';
  status: 'pending' | 'sent';
  text: string;
  date: string;
}

export interface DistributionAgent {
  queue: DistributionQueueItem[];
  pending: number;
  sent: number;
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function runDistributionAgent(noticias: Noticia[]): DistributionAgent {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = noticias
    .filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado')
    .filter((n) => toDate(n.fecha).getTime() >= todayStart.getTime())
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0));

  const queue: DistributionQueueItem[] = [];

  const channels: DistributionQueueItem['channel'][] = ['facebook', 'telegram', 'whatsapp', 'newsletter', 'push', 'x'];

  for (const n of today.slice(0, 5)) {
    for (const channel of channels) {
      let text = '';
      const url = `https://nicaraguainformate.com/noticias/${n.slug}`;
      switch (channel) {
        case 'facebook':
          text = `${n.titulo}\n\n${n.resumen.slice(0, 120)}...\n\nLeé más: ${url}`;
          break;
        case 'telegram':
          text = `📰 ${n.titulo}\n\n${n.resumen.slice(0, 150)}...\n\n${url}`;
          break;
        case 'whatsapp':
          text = `*${n.titulo}*\n\n${n.resumen.slice(0, 90)}...\n\n${url}`;
          break;
        case 'newsletter':
          text = `Hoy: ${n.titulo}\n${n.resumen.slice(0, 200)}...\nVer noticia: ${url}`;
          break;
        case 'push':
          text = `🔴 ${n.titulo}`;
          break;
        case 'x':
          text = `${n.titulo.slice(0, 120)} ${url}`;
          break;
      }
      queue.push({
        id: `${n.slug}-${channel}`,
        slug: n.slug,
        title: n.titulo,
        categoria: n.categoria,
        channel,
        status: 'pending',
        text,
        date: new Date().toISOString(),
      });
    }
  }

  return { queue, pending: queue.length, sent: 0 };
}
