import type { NoticiaInput } from '@/lib/editorial';
import { normalizeKeywords } from '@/lib/editorial/extractor';
import type { Noticia } from '@/lib/types';
import type { PortadaConfig, PortadaItem, PortadaSectionId, PortadaSlot } from './types';

export const PORTADA_SECTIONS: PortadaSectionId[] = [
  'principal',
  'destacadas',
  'ultimas',
  'mas_leidas',
  'recomendadas_ia',
  'ocultas',
];

export const SECTION_META: Record<
  PortadaSectionId,
  { label: string; limit: number; description: string }
> = {
  principal: { label: 'Portada Principal', limit: 1, description: 'Noticia principal fijada' },
  destacadas: { label: 'Destacadas', limit: 3, description: 'Tres noticias destacadas' },
  ultimas: { label: 'Últimas Noticias', limit: 6, description: 'Lo más reciente' },
  mas_leidas: { label: 'Más Leídas', limit: 5, description: 'Por número de vistas' },
  recomendadas_ia: { label: 'Recomendadas por IA', limit: 5, description: 'Mejor score editorial' },
  ocultas: { label: 'Ocultas', limit: 999, description: 'No se mostrarán en portada' },
};

export function noticiaToInput(noticia: Noticia): NoticiaInput {
  return {
    titulo: noticia.titulo || '',
    contenido: noticia.contenido || '',
    resumen: noticia.resumen || '',
    categoria: noticia.categoria || 'General',
    autor: noticia.autor || '',
    fecha: noticia.fecha || new Date().toISOString(),
    fechaActualizacion: noticia.fechaActualizacion,
    imagenDestacada: noticia.imagen,
    imagen: noticia.imagen,
    slug: noticia.slug || noticia.id,
    palabrasClave:
      noticia.tags?.length
        ? noticia.tags
        : normalizeKeywords(noticia.keywords),
    keywords: noticia.keywords,
  };
}

export function tiempoLectura(noticia: Noticia): string {
  const words =
    noticia.palabras ||
    (noticia.contenido ? noticia.contenido.split(/\s+/).length : 0);
  const min = Math.max(1, Math.ceil((words || 0) / 200));
  return `${min} min`;
}

export function formatFecha(fecha: string): string {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleDateString('es-NI', { dateStyle: 'medium' });
  } catch {
    return fecha;
  }
}

export function veredictoLabel(v: string): string {
  const map: Record<string, string> = {
    no_publicar: 'No publicar',
    publicar_breve: 'Breve',
    publicar_estandar: 'Estándar',
    publicar_destacado: 'Destacado',
    portada: 'Portada',
    cobertura_especial: 'Cobertura',
    EDITOR_INCONSISTENT: 'Revisar',
  };
  return map[v] ?? v;
}

export function veredictoColor(v: string): string {
  const colors: Record<string, string> = {
    no_publicar: 'text-red-400',
    publicar_breve: 'text-gray-400',
    publicar_estandar: 'text-yellow-300',
    publicar_destacado: 'text-blue-400',
    portada: 'text-green-400',
    cobertura_especial: 'text-purple-400',
    EDITOR_INCONSISTENT: 'text-orange-400',
  };
  return colors[v] ?? 'text-gray-400';
}

function nextPosition(slots: PortadaSlot[]): number {
  return slots.length ? Math.max(...slots.map(s => s.position)) + 1 : 1;
}

function newSlot(
  section: PortadaSectionId,
  slug: string,
  position: number,
  pinned = false,
): PortadaSlot {
  return {
    id: `${section}-${slug}-${Date.now()}`,
    section,
    slug,
    position,
    pinned,
  };
}

export function moveSlug(
  config: PortadaConfig,
  slug: string,
  target: PortadaSectionId,
  pinned = false,
): PortadaConfig {
  const sections: Record<PortadaSectionId, PortadaSlot[]> = { ...config.sections };
  for (const s of PORTADA_SECTIONS) {
    sections[s] = sections[s].filter(slot => slot.slug !== slug);
  }
  const pos = nextPosition(sections[target]);
  sections[target] = [...sections[target], newSlot(target, slug, pos, pinned)];
  return { ...config, sections, version: config.version + 1 };
}

export function togglePin(
  config: PortadaConfig,
  slug: string,
  section: PortadaSectionId,
): PortadaConfig {
  const slot = config.sections[section].find(s => s.slug === slug);
  if (!slot) return config;
  if (!slot.pinned && section !== 'principal') {
    return moveSlug(config, slug, 'principal', true);
  }
  return {
    ...config,
    sections: {
      ...config.sections,
      [section]: config.sections[section].map(s =>
        s.slug === slug ? { ...s, pinned: !s.pinned } : s,
      ),
    },
    version: config.version + 1,
  };
}

export function hideSlug(config: PortadaConfig, slug: string): PortadaConfig {
  return moveSlug(config, slug, 'ocultas', false);
}

export function isSlugInSection(
  slug: string,
  section: PortadaSectionId,
  config: PortadaConfig,
): boolean {
  return config.sections[section].some(s => s.slug === slug);
}

function takeUnique(
  items: PortadaItem[],
  used: Set<string>,
  limit: number,
): PortadaItem[] {
  const res: PortadaItem[] = [];
  for (const item of items) {
    if (res.length >= limit) break;
    if (!used.has(item.noticia.slug)) {
      res.push(item);
      used.add(item.noticia.slug);
    }
  }
  return res;
}

export function buildDefaultConfig(items: PortadaItem[]): PortadaConfig {
  const used = new Set<string>();

  const byScore = [...items].sort(
    (a, b) => b.resultado.scoreFinal - a.resultado.scoreFinal,
  );
  const byDate = [...items].sort(
    (a, b) =>
      new Date(b.noticia.fecha).getTime() - new Date(a.noticia.fecha).getTime(),
  );
  const byViews = [...items].sort(
    (a, b) => (b.noticia.vistas ?? 0) - (a.noticia.vistas ?? 0),
  );

  const principalPrefer = byScore.filter(
    i =>
      i.resultado.veredicto === 'portada' ||
      i.resultado.veredicto === 'cobertura_especial',
  );
  const principal = takeUnique(
    principalPrefer,
    used,
    SECTION_META.principal.limit,
  );
  const principalFallback = principal.length
    ? principal
    : takeUnique(byScore, used, SECTION_META.principal.limit);

  const destacadas = takeUnique(byScore, used, SECTION_META.destacadas.limit);
  const recomendadas = takeUnique(
    byScore,
    used,
    SECTION_META.recomendadas_ia.limit,
  );
  const ultimas = takeUnique(byDate, used, SECTION_META.ultimas.limit);
  const masLeidas = takeUnique(byViews, used, SECTION_META.mas_leidas.limit);

  const sections: Record<PortadaSectionId, PortadaSlot[]> = {
    principal: principalFallback.map((it, idx) =>
      newSlot('principal', it.noticia.slug, idx, idx === 0),
    ),
    destacadas: destacadas.map((it, idx) =>
      newSlot('destacadas', it.noticia.slug, idx),
    ),
    ultimas: ultimas.map((it, idx) =>
      newSlot('ultimas', it.noticia.slug, idx),
    ),
    mas_leidas: masLeidas.map((it, idx) =>
      newSlot('mas_leidas', it.noticia.slug, idx),
    ),
    recomendadas_ia: recomendadas.map((it, idx) =>
      newSlot('recomendadas_ia', it.noticia.slug, idx),
    ),
    ocultas: [],
  };

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    scheduledReplacements: [],
    sections,
  };
}

export function getSectionItems(
  section: PortadaSectionId,
  config: PortadaConfig,
  items: PortadaItem[],
): PortadaItem[] {
  const slots = [...(config.sections[section] || [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.position - b.position;
  });
  return slots
    .map(slot => items.find(i => i.noticia.slug === slot.slug))
    .filter((x): x is PortadaItem => !!x);
}
