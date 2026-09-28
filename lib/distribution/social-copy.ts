/**
 * Copy social determinista — Nicaragua Informate.
 * =====================================================
 * Genera el contenido de distribución (Facebook/WhatsApp) a partir
 * EXCLUSIVAMENTE de los datos del artículo: título, resumen, categoría,
 * contenido, slug. Nunca inventa hechos, cifras ni atribuciones.
 *
 * La distribución normal NO depende de ChatGPT/Groq ni de ninguna IA.
 * La IA ("Regenerar con IA") es opcional y nunca requisito.
 *
 * Selección de plantilla: hash estable del slug → mismo artículo produce
 * siempre la misma variante (determinista, sin Math.random).
 */
import { stripHtml, resolveTelegramSummary, extraerContexto } from './telegram';

export interface SocialCopyArticle {
  slug: string;
  titulo: string;
  resumen?: string;
  metaDescription?: string;
  contenido?: string;
  categoria?: string;
  departamento?: string;
}

export interface SocialCopyResult {
  facebook: { text: string; link: string; hashtags: string[] };
  whatsapp: { text: string; link: string };
}

export function buildArticleUrl(slug: string, channel: 'facebook' | 'whatsapp' | 'telegram' | 'push' | string): string {
  const base = `https://nicaraguainformate.com/noticias/${slug}`;
  return `${base}?utm_source=${encodeURIComponent(channel)}&utm_medium=social`;
}

// ── Selección estable de plantilla ──────────────────────────
function stableHash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

// ── Extractos verificables del artículo ─────────────────────
function extractFacts(a: SocialCopyArticle): { summary: string; sentences: string[]; lugar: string | null } {
  const summary = resolveTelegramSummary({
    resumen: a.resumen,
    metaDescription: a.metaDescription,
    contenido: a.contenido,
    titulo: a.titulo,
  });
  const textoPlano = summary || stripHtml(a.contenido || '');
  const sentences = (textoPlano.match(/[^.!?]+[.!?]+/g) || [])
    .map(s => s.trim())
    .filter(s => s.length >= 20 && s.length <= 160)
    .slice(0, 4);
  const lugar = a.departamento && a.departamento.trim() ? a.departamento.trim() : null;
  return { summary: textoPlano, sentences, lugar };
}

// ── Plantillas por categoría (familias A–G) ─────────────────
// Cada función recibe {titulo, contexto, lugar, url} y devuelve líneas.
// Regla: nunca agregar datos que no estén en el artículo.

interface TplCtx { titulo: string; contexto: string; lugar: string | null; url: string }

type Tpl = (c: TplCtx) => string;

const CTA = [
  'Lee la información completa en Nicaragua Informate.',
  'Todos los detalles están en la nota completa.',
  'Conocé la información completa aquí.',
  'La información completa está disponible en el enlace.',
];

const PREGUNTA = [
  '¿Qué opinás de esta situación?',
  '¿Ya conocías este dato?',
  '¿Qué te parece esta información?',
];

const GENERAL: Tpl[] = [
  c => `${c.titulo}\n\n${c.contexto}\n\n${CTA[0]}`,
  c => `${c.contexto}\n\n${c.titulo}\n\n${CTA[1]}`,
  c => `${c.titulo}\n\n${c.contexto}\n\n${CTA[2]}`,
  c => `${c.contexto}\n\n${CTA[3]}`,
];

const SUCESOS: Tpl[] = [
  // qué ocurrió + dónde + consecuencia — sin morbo ni exageración
  c => `${c.titulo}${c.lugar ? `\n\n📍 ${c.lugar}` : ''}\n\n${c.contexto}\n\n${CTA[0]}`,
  c => `${c.contexto}${c.lugar ? `\n📍 ${c.lugar}` : ''}\n\n${CTA[1]}`,
  c => `${c.titulo}\n\n${c.contexto}\n\n${CTA[3]}`,
];

const NACIONALES: Tpl[] = [
  c => `${c.titulo}\n\n${c.contexto}\n\n${CTA[0]}`,
  c => `🇳🇮 ${c.contexto}\n\n${c.titulo}\n\n${CTA[2]}`,
  c => `${c.contexto}\n\n${CTA[1]}`,
];

const DEPORTES: Tpl[] = [
  c => `⚽ ${c.titulo}\n\n${c.contexto}\n\n${CTA[1]}`,
  c => `${c.contexto}\n\n${CTA[0]}`,
  c => `${c.titulo}\n\n${c.contexto}\n\n${CTA[3]}`,
];

const ESPECTACULOS: Tpl[] = [
  c => `🎬 ${c.titulo}\n\n${c.contexto}\n\n${CTA[2]}`,
  c => `${c.contexto}\n\n${CTA[1]}`,
];

const TECNOLOGIA: Tpl[] = [
  c => `💻 ${c.titulo}\n\n${c.contexto}\n\n${CTA[0]}`,
  c => `${c.contexto}\n\n${CTA[3]}`,
];

const INTERNACIONALES: Tpl[] = [
  c => `🌍 ${c.titulo}\n\n${c.contexto}\n\n${CTA[0]}`,
  c => `${c.contexto}\n\n${CTA[2]}`,
];

const TPL_BY_CAT: Record<string, Tpl[]> = {
  Sucesos: SUCESOS,
  Nacionales: NACIONALES,
  Deportes: DEPORTES,
  Internacionales: INTERNACIONALES,
  Espectáculos: ESPECTACULOS,
  Tecnología: TECNOLOGIA,
  Política: NACIONALES,
  Economía: NACIONALES,
  Salud: NACIONALES,
  Cultura: ESPECTACULOS,
};

/**
 * Genera copy de Facebook + WhatsApp de forma 100% determinista.
 * Misma entrada → misma salida. Sin IA, sin aleatoriedad.
 */
export function generateSocialCopy(article: SocialCopyArticle, opts?: { includeQuestion?: boolean }): SocialCopyResult {
  const { sentences, lugar } = extractFacts(article);
  const contexto = extraerContexto(sentences.join(' '), 200) || article.titulo;

  const cat = article.categoria || 'General';
  const templates = TPL_BY_CAT[cat] || GENERAL;
  const tpl = templates[stableHash(article.slug || article.titulo) % templates.length];
  const urlFb = buildArticleUrl(article.slug, 'facebook');
  const urlWa = buildArticleUrl(article.slug, 'whatsapp');

  // Pregunta de engagement opcional (no en sucesos por defecto: riesgo de
  // banalizar tragedias — solo si el caller lo pide explícitamente).
  let pregunta = '';
  if (opts?.includeQuestion && cat !== 'Sucesos') {
    pregunta = `\n\n${PREGUNTA[stableHash(article.slug + 'q') % PREGUNTA.length]}`;
  }

  const hashtags = [`#${cat.replace(/\s+/g, '')}`, '#Nicaragua'];
  const fbText = `${tpl({ titulo: article.titulo, contexto, lugar, url: urlFb })}${pregunta}\n\n👉 ${urlFb}\n\n${hashtags.join(' ')}`;

  const waResumen = extraerContexto(extractFacts(article).summary, 160) || article.titulo;
  const waText = `*${article.titulo}*\n\n${waResumen}\n\n🔗 ${urlWa}`;

  return {
    facebook: { text: fbText, link: urlFb, hashtags },
    whatsapp: { text: waText, link: urlWa },
  };
}
