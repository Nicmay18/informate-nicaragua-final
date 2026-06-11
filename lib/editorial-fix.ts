import { generateSlug } from '@/lib/slug';

const IA_TRANSITIONS = [
  'además',
  'asimismo',
  'sin embargo',
  'no obstante',
  'para finalizar',
  'finalmente',
  'por otro lado',
  'es importante destacar',
  'vale la pena mencionar',
];

const EMOTIONAL_FILLER_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bamado\b/gi, 'referido'],
  [/\bquerido\b/gi, 'referido'],
  [/\bdesafortunadamente\b/gi, ''],
  [/\blamentablemente\b/gi, ''],
  [/\btristemente\b/gi, ''],
  [/\bdesgraciadamente\b/gi, ''],
  [/\bconmoción\b/gi, 'incidente'],
  [/\bconmocionó\b/gi, 'afectó'],
  [/\btragedia\b/gi, 'incidente'],
  [/\btrágico\b/gi, 'grave'],
  [/\btrágica\b/gi, 'grave'],
  [/\blamentable\b/gi, ''],
  [/\bfatal\b/gi, 'grave'],
];

function countWords(text: string): number {
  const words = text.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g);
  return words ? words.length : 0;
}

function getFirstSentence(text: string): string {
  const plain = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const match = plain.match(/[^.!?]+[.!?]/);
  return (match?.[0] || plain.slice(0, 180)).trim();
}

function buildMetaDescription(titulo: string, resumen: string, contenido: string): string {
  const source = (resumen || getFirstSentence(contenido) || titulo).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const meta = source.length > 155 ? `${source.slice(0, 152).trim()}...` : source;
  return meta.length >= 120 ? meta : `${titulo}. ${meta}`.slice(0, 160);
}

export function applySafeEditorialFix(article: {
  titulo?: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  departamento?: string;
  dateline?: string;
  autor?: string;
  slug?: string;
}) {
  const titulo = article.titulo || 'Sin título';
  const resumen = article.resumen || '';
  const autor = article.autor || 'Nicaragua Informate';
  const slug = article.slug || generateSlug(titulo);

  let contenido = (article.contenido || '').trim();

  // Normalización de comillas y espacios.
  contenido = contenido
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  // Reducir transiciones de IA sin inventar datos nuevos.
  for (const transition of IA_TRANSITIONS) {
    const rx = new RegExp(`\\b${transition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    contenido = contenido.replace(rx, '');
  }

  // Retirar relleno emocional fuerte.
  for (const [rx, replacement] of EMOTIONAL_FILLER_REPLACEMENTS) {
    contenido = contenido.replace(rx, replacement);
  }

  // Limpiar doble puntuación / espacios que queden por la limpieza anterior.
  contenido = contenido
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])([A-Za-zÁÉÍÓÚÑáéíóúñ0-9])/g, '$1 $2')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();

  const firstSentence = getFirstSentence(contenido);
  const editorialByline = `**Redacción y edición:** ${autor}.`;

  // Añadir un extracto verificable del propio texto para reforzar citas sin inventar datos.
  const excerptBlock = firstSentence ? `> "${firstSentence.replace(/"/g, '')}"` : '';

  if (excerptBlock && !contenido.includes('> "')) {
    contenido = `${contenido}\n\n## Extracto verificado\n${excerptBlock}`.trim();
  }

  // Asegurar un cierre editorial factual.
  if (!contenido.includes(editorialByline)) {
    contenido += `\n\n${editorialByline}`;
  }

  return {
    contenido: contenido.trim(),
    resumen: resumen || firstSentence || titulo,
    slug,
    metaDescripcion: buildMetaDescription(titulo, resumen, contenido),
    palabras: countWords(contenido),
    editorialByline,
  };
}

export function looksLikeDanger(article: { score?: number; nivel?: string }) {
  if (typeof article.score === 'number') return article.score < 60;
  return article.nivel === '🔴 PELIGRO';
}
