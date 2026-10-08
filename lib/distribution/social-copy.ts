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
import { extractEditorialAngle, type AngleInput, type EditorialAngle } from './editorial-angle';

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

const CTAS_FACEBOOK = [
  'Todos los detalles en el primer comentario.',
  'La información completa está en el primer comentario.',
  'Conocé qué ocurrió y todos los detalles en el primer comentario.',
  'La nota completa, con todos los datos, en el primer comentario.',
];

const CTAS_FACEBOOK_GRAVE = [
  'Todos los detalles del caso en el primer comentario.',
  'La información completa está en el primer comentario.',
];

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

// ── Frase de apertura (hook) por tipo — framing, nunca afirmación ──

function hookFacebook(a: EditorialAngle, titulo: string): string {
  const lugar = a.lugar ? ` en ${a.lugar}` : '';
  switch (a.kind) {
    case 'suceso':
      return a.grave
        ? `Una noticia que conmociona${lugar}.`
        : `Un hecho que mantiene la atención${lugar}.`;
    case 'historia_humana':
      return `Una historia que está tocando a muchas familias${lugar}.`;
    case 'nacional':
      return `Hay novedad en Nicaragua${lugar}: esto es lo que se sabe.`;
    case 'deporte':
      return `Nicaragua tiene nuevo resultado deportivo.`;
    case 'internacional':
      return `Ocurrió${lugar || ' a nivel internacional'} y puede tener efectos más allá de sus fronteras.`;
    case 'utilidad':
      return `Información útil para los nicaragüenses${lugar}.`;
    default:
      return titulo;
  }
}

// ── FACEBOOK ────────────────────────────────────────────────

export interface FacebookCopy {
  text: string;
  url: string;
  /** Comentario sugerido con el enlace (primer comentario) */
  firstComment: string;
  hashtags: string[];
}

/**
 * Estructura FB: emoji + titular → contexto real → gancho de interés
 * → pregunta natural → CTA al primer comentario. El enlace también
 * viaja como `link` en el post (card clickeable) — el comentario es
 * complemento de alcance.
 */
export function buildFacebookCopy(noticia: SocialArticle): FacebookCopy {
  const a = extractEditorialAngle(noticia);
  const titulo = noticia.titulo.trim();
  const url = buildArticleUrl(noticia.slug, 'facebook');

  const lineas: string[] = [`${a.emoji} ${titulo}`, ''];

  if (a.contexto) lineas.push(a.contexto, '');

  // Segunda capa: ángulo + pregunta (no siempre — grave reduce adorno)
  if (!a.grave) {
    lineas.push(hookFacebook(a, titulo), a.pregunta, '');
  } else {
    lineas.push('Esto es lo que se conoce hasta el momento.', '');
  }

  const cta = pickBySlug(a.grave ? CTAS_FACEBOOK_GRAVE : CTAS_FACEBOOK, noticia.slug);
  lineas.push(`👉 ${cta}`);

  const hashtags = ['#NicaraguaInformate', `#${(noticia.categoria || 'Noticias').replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g, '')}`];
  lineas.push('', hashtags.join(' '));

  return {
    text: lineas.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    url,
    firstComment: `📰 ${url}`,
    hashtags,
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
  if (a.contexto) {
    const ctx = a.contexto.length > 160 ? a.contexto.substring(0, 157).trimEnd() + '…' : a.contexto;
    lineas.push(ctx, '');
  }
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

export function buildTelegramItem(noticia: SocialArticle): TelegramItem {
  const a = extractEditorialAngle(noticia);
  return {
    emoji: a.emoji,
    categoria: noticia.categoria || 'General',
    titulo: noticia.titulo.trim(),
    contexto: a.contexto.length > 170 ? a.contexto.substring(0, 167).trimEnd() + '…' : a.contexto,
    url: buildArticleUrl(noticia.slug, 'telegram'),
    slug: noticia.slug,
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

  let cuerpo = '';
  let categoriaActual = '';

  for (const item of items) {
    if (item.categoria !== categoriaActual) {
      categoriaActual = item.categoria;
      cuerpo += `\n${item.emoji} <b>${esc(categoriaActual.toUpperCase())}</b>\n\n`;
    }
    cuerpo += `<b>${esc(item.titulo.substring(0, 120))}</b>\n`;
    if (item.contexto) cuerpo += `${esc(item.contexto)}\n`;
    cuerpo += `🔗 <a href="${item.url.replace(/&/g, '&amp;')}">Leer la noticia</a>\n\n`;
  }

  return (
    `🌅 <b>BUENOS DÍAS, NICARAGUA</b>\n` +
    `🗓️ ${esc(fechaLegible)}\n\n` +
    `Estas son las noticias que marcan la jornada:\n` +
    cuerpo +
    `━━━━━━━━━━━━━━\n\n` +
    `📰 Más información en <a href="${SITE}">nicaraguainformate.com</a>\n` +
    `#NicaraguaInformate`
  );
}
