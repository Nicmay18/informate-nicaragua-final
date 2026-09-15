/**
 * Limpieza editorial determinista aplicada en render.
 * SOLO elimina redundancias exactas y muletillas de apertura.
 * NO reescribe, NO inventa datos, NO cambia hechos.
 */

export const normalizeText = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const norm = normalizeText;

const wordCount = (s: string): number => norm(s).split(' ').filter(Boolean).length;

export const jaccardSimilarity = (a: string, b: string): number => {
  const A = new Set(norm(a).split(' ').filter((w) => w.length > 3));
  const B = new Set(norm(b).split(' ').filter((w) => w.length > 3));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
};

const jaccard = jaccardSimilarity;

/** Artículos clase C autorizados para limpieza estructural aunque sean sensibles. */
export const CLEANUP_ALLOWED_SLUGS = new Set([
  'tres-nicaraguenses-fueron-deportados-de-ee-uu-a-africa',
  'investigaciones-por-fallecimiento-en-barrio-old-bank-bluefields',
  'mundial-2026-rompe-record-de-expulsiones-en-fase-inicial',
  'tres-ataques-de-pitbull-en-nicaragua-dejan-tres-lesionados',
  'tres-motociclistas-mueren-en-accidentes-de-transito-en-nicaragua',
]);

const SENSITIVE_RE =
  /feminicidio|femicidio|asesinad|homicidio|violaci[oó]n|abuso sexual|suicidio|trata de personas|falleci|muer[eo]|muert[oa]|v[ií]ctima mortal|decapit|tortura|desaparecid|deportad|pitbull/i;

/** Detecta si el artículo trata un tema sensible (no tocar salvo lista C). */
export function isSensitiveArticle(titulo: string, resumen?: string, contenido?: string): boolean {
  return SENSITIVE_RE.test(`${titulo} ${resumen || ''} ${(contenido || '').slice(0, 800)}`);
}

/** Muletillas de apertura sin valor informativo (solo al inicio de oración). */
const LEAD_FILLERS =
  /(?:cabe destacar que|cabe mencionar que|es importante señalar que|es importante destacar que|vale la pena destacar que|es fundamental (?:destacar|señalar|mencionar) que|en este contexto,|en definitiva,|sin duda alguna,)\s*/i;

function capitalizeFirstLetter(s: string): string {
  const i = s.search(/[a-záéíóúñ]/i);
  if (i === -1) return s;
  return s.slice(0, i) + s[i].toUpperCase() + s.slice(i + 1);
}

/**
 * Elimina muletillas de apertura al inicio de párrafos o tras ". ".
 * Conserva el resto de la oración intacto.
 */
export function stripLeadFillers(html: string): string {
  if (!html) return html;
  // Inicio de <p> o <li>
  let out = html.replace(
    /(<(?:p|li|blockquote)[^>]*>\s*)([^<]*)/g,
    (_m, tag: string, text: string) => tag + capitalizeFirstLetter(text.replace(LEAD_FILLERS, '')),
  );
  // Tras cierre de oración dentro del mismo párrafo
  out = out.replace(
    /([.!?]\s+)([^<]*)/g,
    (_m, sep: string, text: string) => sep + capitalizeFirstLetter(text.replace(LEAD_FILLERS, '')),
  );
  return out;
}

/**
 * Elimina oraciones duplicadas EXACTAS (normalizadas, >=7 palabras) dentro del artículo.
 * Solo borra la segunda y siguientes apariciones. No toca hechos ni cifras.
 */
export function dedupeRepeatedSentences(html: string): string {
  if (!html) return html;
  const seen = new Set<string>();
  // Procesar cada bloque de texto (<p>, <li>) por separado
  return html.replace(
    /(<(?:p|li)[^>]*>)([\s\S]*?)(<\/(?:p|li)>)/gi,
    (_m, open: string, inner: string, close: string) => {
      // Separar por cierre de oración conservando el delimitador
      const parts = inner.split(/(?<=[.!?])\s+/);
      const kept: string[] = [];
      for (const part of parts) {
        const key = norm(part);
        const words = key.split(' ').filter(Boolean).length;
        if (words >= 7) {
          if (seen.has(key)) continue; // duplicada exacta → fuera
          seen.add(key);
        }
        kept.push(part);
      }
      const rebuilt = kept.join(' ').trim();
      // Si el párrafo quedó vacío, eliminarlo completo
      if (!norm(rebuilt)) return '';
      return open + rebuilt + close;
    },
  );
}

/**
 * Si el primer párrafo del cuerpo repite la bajada (resumen), lo elimina.
 * Solo cuando la similitud es alta (contenido o jaccard >= 0.7) y la entrada
 * tiene sustancia (>=8 palabras). Caso contrario, se conserva intacto.
 */
export function dropDuplicatedEntrada(html: string, resumen: string | undefined): string {
  if (!html || !resumen) return html;
  const m = html.match(/<p[^>]*>[\s\S]*?<\/p>/i);
  if (!m) return html;
  const entrada = m[0];
  const entradaNorm = norm(entrada);
  const resumenNorm = norm(resumen);
  if (wordCount(entrada) < 8 || resumenNorm.length < 40) return html;
  const contained = resumenNorm.includes(entradaNorm.slice(0, 80)) || entradaNorm.includes(resumenNorm.slice(0, 80));
  const similar = jaccard(entrada, resumen) >= 0.7;
  if (contained || similar) {
    return html.slice(0, m.index) + html.slice((m.index || 0) + entrada.length);
  }
  return html;
}

/**
 * Pipeline de limpieza editorial para el cuerpo del artículo.
 * `allowStructural` habilita el drop de entrada duplicada (no aplicar en notas sensibles).
 */
export function editorialCleanup(html: string, resumen: string | undefined, allowStructural: boolean): string {
  // allowStructural=false → solo dedup de oraciones exactas + muletillas (seguro en cualquier nota)
  if (!html) return html;
  let out = dedupeRepeatedSentences(html);
  out = stripLeadFillers(out);
  if (allowStructural) out = dropDuplicatedEntrada(out, resumen);
  return out;
}
