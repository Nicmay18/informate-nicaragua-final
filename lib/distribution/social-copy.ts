/**
 * SOCIAL COPY — generadores por canal.
 * =====================================================
 * Una sola fuente de ángulo editorial (editorial-angle.ts), tres
 * presentaciones distintas:
 *
 *   Telegram  → boletín de sala de redacción: informar con contexto.
 *   Facebook  → detener el scroll: ángulo + curiosidad legítima + CTA.
 *   WhatsApp  → mensaje reenviable: directo, corto, auto-contenido.
 *
 * Reglas duras:
 * - Nunca inventa información: todo texto factual sale del artículo.
 * - Si no hay contexto seguro → solo titular.
 * - UTM canónico por canal: ?utm_source=<canal>&utm_medium=social
 * - Tono sobrio automático cuando la noticia es grave.
 */
import { extractEditorialAngle, type AngleInput } from './editorial-angle';
import { z } from 'zod';

const SITE = 'https://nicaraguainformate.com';

export interface SocialArticle extends AngleInput {
  slug: string;
  vistas?: number;
}

/** URL canónica con trazabilidad por canal. */
export function buildArticleUrl(slug: string, canal: 'telegram' | 'facebook' | 'whatsapp' | 'push' | 'twitter' | 'newsletter'): string {
  return `${SITE}/noticias/${encodeURIComponent(slug)}?utm_source=${canal}&utm_medium=social`;
}

// ── CTAs con variación determinista (por slug, no aleatorio) ──

const CTAS_WHATSAPP = [
  'Leer la noticia:',
  'Nota completa aquí:',
  'Todos los detalles:',
];

function pickBySlug<T>(opciones: T[], slug: string): T {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return opciones[h % opciones.length];
}

export interface SocialAnalysis {
  enfoque: string;
  evidencia: string;
  tono: string;
  motivo: string;
}

interface AngleRule {
  enfoque: string;
  pattern: RegExp;
  pregunta: string;
  categoria?: string;
}

const ANGLE_RULES: AngleRule[] = [
  { enfoque: 'Dictamen forense', pattern: /dictamen forense|peritaje forense/i, pregunta: '¿Qué se conoce sobre el dictamen forense de este caso?' },
  { enfoque: 'Evaluación médica', pattern: /medicina legal|causa de muerte|diagnóstico|informe médico/i, pregunta: '¿Qué información médica recoge la nota?' },
  { enfoque: 'Caso judicial', pattern: /fiscalía|ministerio público|proceso penal|acusad[ao]|juzgado/i, pregunta: '¿Qué se conoce del proceso judicial?' },
  { enfoque: 'Repatriación', pattern: /repatriar|repatriación|trasladar sus restos/i, pregunta: '¿Qué se sabe sobre la repatriación?' },
  { enfoque: 'Trámite o servicio', pattern: /requisitos?|trámites?|apostill|récord policial/i, pregunta: '¿Qué información sobre este trámite recoge la nota?' },
  { enfoque: 'Beneficio anunciado', pattern: /convocatoria|becas?|beneficio|gratuit[ao]/i, pregunta: '¿Qué se informa sobre este beneficio?' },
  { enfoque: 'Resultado deportivo', pattern: /venció|ganó|empató|medalla|resultado|campeón|lidera/i, categoria: 'Deportes', pregunta: '¿Cómo fue el resultado deportivo?' },
  { enfoque: 'Fenómeno natural', pattern: /sismo|terremoto|tsunami|depresión tropical|huracán/i, pregunta: '¿Qué se ha informado sobre este fenómeno?' },
  { enfoque: 'Impacto familiar', pattern: /familia(?:res)?|sobreviviente/i, pregunta: '¿Qué se conoce de la situación de la familia?' },
  { enfoque: 'Anuncio público', pattern: /anunció|anuncia|informó|comunicado/i, pregunta: '¿Qué información recoge el anuncio?' },
];

const sentenceSegmenter = new Intl.Segmenter('es', { granularity: 'sentence' });

function plainText(texto: string): string {
  return (texto || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ').trim();
}

function supportedAngles(noticia: SocialArticle) {
  const sentences = [noticia.contenido, noticia.resumen, noticia.metaDescription].flatMap(text =>
    Array.from(sentenceSegmenter.segment(plainText(text || '')), s => s.segment.trim()),
  ).filter(s => s.length <= 500 && /[.!?][”"»')]*$/.test(s) && !/\.{2,}|…|https?:\/\//i.test(s));
  sentences.push(plainText(noticia.titulo));
  const angles = ANGLE_RULES.flatMap(rule => {
    if (rule.categoria && rule.categoria !== noticia.categoria) return [];
    const evidencia = sentences.find(s => rule.pattern.test(s));
    return evidencia ? [{ enfoque: rule.enfoque, evidencia, pregunta: rule.pregunta }] : [];
  });
  return angles.length ? angles : [{ enfoque: 'Titular', evidencia: plainText(noticia.titulo), pregunta: '' }];
}

export function analyzeSocialArticle(noticia: SocialArticle, preferredIndex?: number): SocialAnalysis {
  const a = extractEditorialAngle(noticia);
  const tono = a.grave ? 'Sobrio y respetuoso' : 'Claro e informativo';
  const opciones = supportedAngles(noticia);
  const i = Number.isInteger(preferredIndex) && preferredIndex! >= 0 && preferredIndex! < opciones.length
    ? preferredIndex! : 0;
  const { enfoque, evidencia } = opciones[i];
  const motivo = enfoque === 'Titular'
    ? 'No se detectó un enfoque específico con evidencia suficiente; se conserva el titular.'
    : `La nota menciona este tema en el fragmento citado. La pregunta se limita a esa información.`;
  return { enfoque, evidencia, tono, motivo };
}

// ── Frase de apertura (hook) por tipo — framing, nunca afirmación ──

export function getSocialOptions(noticia: SocialArticle) {
  const context = telegramContext(noticia);
  return {
    angles: supportedAngles(noticia),
    openings: Array.from(new Set([plainText(noticia.titulo), context].filter(Boolean))),
  };
}

const selectionSchema = z.object({
  angleIndex: z.number().int().nonnegative(),
  openingIndex: z.number().int().nonnegative(),
}).strict();

export type SocialSelection = z.infer<typeof selectionSchema>;

export function validateSocialSelection(raw: string, noticia: SocialArticle): SocialSelection | null {
  try {
    const parsed = selectionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const options = getSocialOptions(noticia);
    return parsed.data.angleIndex < options.angles.length && parsed.data.openingIndex < options.openings.length
      ? parsed.data : null;
  } catch {
    return null;
  }
}

// ── FACEBOOK ────────────────────────────────────────────────

export interface FacebookCopy {
  text: string;
  url: string;
  /** Comentario sugerido con el enlace (primer comentario) */
  firstComment: string;
  hashtags: string[];
  analysis: SocialAnalysis;
}

/**
 * Estructura FB: emoji + titular → contexto real → gancho de interés
 * → pregunta natural → CTA al primer comentario. El enlace también
 * viaja como `link` en el post (card clickeable) — el comentario es
 * complemento de alcance.
 */
export function buildFacebookCopy(noticia: SocialArticle, preferredIndex?: number, openingIndex = 0): FacebookCopy {
  const a = extractEditorialAngle(noticia);
  const analysis = analyzeSocialArticle(noticia, preferredIndex);
  const options = getSocialOptions(noticia);
  const opening = options.openings[openingIndex] || options.openings[0];
  const url = buildArticleUrl(noticia.slug, 'facebook');
  const lineas: string[] = [`${a.emoji} ${opening}`, ''];
  const context = telegramContext(noticia);
  if (context && context !== opening && openingIndex === 0) lineas.push(context, '');

  // Segunda capa: ángulo + pregunta (no siempre — grave reduce adorno)
  const question = options.angles.find(option => option.enfoque === analysis.enfoque)?.pregunta;
  if (question) lineas.push(question, '');
  lineas.push('📰 La información completa está publicada en nuestra página web oficial.', '');
  lineas.push('👇 ENLACE DIRECTO A LA NOTA EN EL PRIMER COMENTARIO.', '');
  lineas.push('🔎 Verificá que el enlace te dirija al sitio oficial de Nicaragua Informate.', '');
  lineas.push('Nicaragua Informate | Información responsable y verificable.');

  const hashtags = ['#NicaraguaInformate', `#${(noticia.categoria || 'Noticias').replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g, '')}`];
  lineas.push('', hashtags.join(' '));

  return {
    text: lineas.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    url,
    firstComment: `📰 Nota completa en el sitio oficial de Nicaragua Informate: ${url}`,
    hashtags,
    analysis,
  };
}

// ── WHATSAPP ────────────────────────────────────────────────

/**
 * WhatsApp: formato de reenvío — se entiende sin contexto externo.
 * Negritas con *, contexto corto, enlace visible directo.
 */
export function buildWhatsAppCopy(noticia: SocialArticle): string {
  const a = extractEditorialAngle(noticia);
  const url = buildArticleUrl(noticia.slug, 'whatsapp');
  const cta = pickBySlug(CTAS_WHATSAPP, noticia.slug);

  const lineas: string[] = [`${a.emoji} *${noticia.titulo.trim()}*`, ''];
  const context = telegramContext(noticia);
  if (context) lineas.push(context, '');
  lineas.push(`🔗 ${cta}`, url);
  return lineas.join('\n');
}

// ── TELEGRAM (item individual) ──────────────────────────────

/**
 * Item de Telegram para el boletín: emoji + titular en negrita +
 * contexto breve + enlace. HTML escapado lo hace el caller.
 */
export interface TelegramItem {
  emoji: string;
  categoria: string;
  titulo: string;
  contexto: string;
  url: string;
  slug: string;
}

const telegramSentences = new Intl.Segmenter('es', { granularity: 'sentence' });

function telegramContext(noticia: SocialArticle): string {
  for (const source of [noticia.resumen, noticia.metaDescription, noticia.contenido]) {
    const text = (source || '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ').trim();
    const first = Array.from(telegramSentences.segment(text))[0]?.segment.trim() || '';
    if (first.length <= 260 && /[.!?][”"»')]*$/.test(first) && !/\.{2,}|…/.test(first)) {
      return first === noticia.titulo.trim() ? '' : first;
    }
  }
  return '';
}

export function buildTelegramItem(noticia: SocialArticle): TelegramItem {
  const a = extractEditorialAngle(noticia);
  return {
    emoji: a.emoji,
    categoria: noticia.categoria || 'General',
    titulo: noticia.titulo.trim(),
    contexto: telegramContext(noticia),
    url: buildArticleUrl(noticia.slug, 'telegram'),
    slug: noticia.slug,
  };
}

export function buildSocialCopies(noticia: SocialArticle, selection?: SocialSelection | null) {
  const facebook = buildFacebookCopy(noticia, selection?.angleIndex, selection?.openingIndex);
  const telegram = buildTelegramItem(noticia);
  return {
    copy: facebook.text,
    facebookPost: facebook.text,
    firstComment: facebook.firstComment,
    analysis: facebook.analysis,
    telegramText: [`${telegram.emoji} ${telegram.titulo}`, telegram.contexto, `Leer la noticia:\n${telegram.url}`, '#NicaraguaInformate'].filter(Boolean).join('\n\n'),
    whatsappText: buildWhatsAppCopy(noticia),
    urls: { facebook: facebook.url, telegram: telegram.url, whatsapp: buildArticleUrl(noticia.slug, 'whatsapp') },
  };
}

// ── TELEGRAM (boletín diario) ───────────────────────────────

const ORDEN_CATEGORIAS = ['Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos', 'Tecnología'];

/**
 * Selección editorial para el boletín: diversidad de categorías.
 * Toma la mejor noticia por categoría (ya ordenadas por vistas/recencia
 * por el caller), luego rellena con las siguientes mejores hasta maxItems.
 */
export function selectDigestNews<T extends { categoria?: string }>(candidatas: T[], maxItems = 6): T[] {
  const elegidas: T[] = [];
  const usadas = new Set<T>();

  for (const cat of ORDEN_CATEGORIAS) {
    const primera = candidatas.find((n) => n.categoria === cat && !usadas.has(n));
    if (primera && elegidas.length < maxItems) {
      elegidas.push(primera);
      usadas.add(primera);
    }
  }
  for (const n of candidatas) {
    if (elegidas.length >= maxItems) break;
    if (!usadas.has(n)) {
      elegidas.push(n);
      usadas.add(n);
    }
  }
  return elegidas;
}

/**
 * Construye el HTML del boletín diario (parse_mode: HTML).
 * Agrupa por categoría con encabezado de sección; cada noticia lleva
 * contexto real si existe. Recibe items ya seleccionados y la fecha legible.
 */
export function buildTelegramDigest(items: TelegramItem[], fechaLegible: string): string {
  const esc = (s: string) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const sections = new Map<string, TelegramItem[]>();
  for (const item of items) {
    const category = item.categoria.trim() || 'General';
    sections.set(category, [...(sections.get(category) || []), item]);
  }
  const header = `<b>BUENOS DÍAS, NICARAGUA</b>\n${esc(fechaLegible)}\n` +
    `<i>Resumen de la mañana · Nicaragua Informate</i>\n\n`;
  const footer = `\nMás noticias y actualizaciones en <a href="${SITE}">nicaraguainformate.com</a>\n#NicaraguaInformate`;
  const contexts = new Set(items.filter(item => item.contexto));
  const render = () => header + Array.from(sections, ([category, news]) =>
    `<b>${esc(category.toUpperCase())}</b>\n\n` + news.map(item =>
      `<b>${esc(item.titulo)}</b>\n` +
      (contexts.has(item) ? `${esc(item.contexto)}\n` : '') +
      `<a href="${esc(buildArticleUrl(item.slug, 'telegram'))}">Leer la noticia</a>\n`,
    ).join('\n'),
  ).join('\n') + footer;

  let message = render();
  for (const item of [...contexts].sort((a, b) => esc(b.contexto).length - esc(a.contexto).length)) {
    if (message.length <= 4096) break;
    contexts.delete(item);
    message = render();
  }
  if (message.length > 4096) throw new Error('El boletín supera el límite de Telegram sin resúmenes');
  return message;
}
