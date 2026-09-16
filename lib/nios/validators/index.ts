// lib/nios/validators/index.ts
// Validators deterministas y reparación segura de NIOS Execution 005 Fase 2.1.
// Ninguna función muta la entrada. Ninguna función inventa información.

import { Noticia, FALLBACK_IMAGE } from '@/lib/types';
import { Issue, RepairRecord, PuntosClaveRepairResult } from './types';
import {
  CONJUNCTIONS,
  FUNCTION_WORDS,
  GENERIC_LEAD_DENYLIST,
  GENERIC_SOURCE_DENYLIST,
  PREPOSITIONS,
} from './consts';
import {
  extractH2s,
  extractInternalLinks,
  extractParagraphs,
  firstParagraph,
  hasContentToken,
  hasCuándo,
  hasDónde,
  hasEmoji,
  hasEntity,
  hasPredicative,
  hasQué,
  isInternalLink,
  isValidUrl,
  jaccardSimilarity,
  normalizeText,
  sentenceCount,
  splitSentences,
  stripHtml,
  tokenize,
  wordCount,
} from './text';

export * from './types';

// ===================== TÍTULO =====================

export function validateTitle(noticia: Noticia): Issue[] {
  const issues: Issue[] = [];
  const title = (noticia.titulo || '').trim();

  if (!title) {
    issues.push({ code: 'T1.1', field: 'titulo', message: 'El título está vacío', blocking: true });
    return issues;
  }

  if (title.length < 10) {
    issues.push({ code: 'T1.2', field: 'titulo', message: `Título muy corto: ${title.length} caracteres`, blocking: true });
  }
  if (title.length > 90) {
    issues.push({ code: 'T1.2', field: 'titulo', message: `Título muy largo: ${title.length} caracteres`, blocking: true });
  }

  if (/^\p{P}/u.test(title) || /\p{P}$/u.test(title)) {
    issues.push({ code: 'T1.3', field: 'titulo', message: 'Título comienza o termina con puntuación aislada', blocking: true });
  }

  const words = title.split(/\s+/).filter(Boolean);
  if (!words.some((w) => w.replace(/[^\p{L}\p{N}]/gu, '').length >= 4)) {
    issues.push({ code: 'T1.4', field: 'titulo', message: 'El título no contiene palabras significativas (>= 4 caracteres)', blocking: true });
  }

  if (normalizeText(title) === normalizeText(noticia.slug || '')) {
    issues.push({ code: 'T1.5', field: 'titulo', message: 'El título es idéntico al slug', blocking: true });
  }

  if (noticia.metaDescription && normalizeText(title) === normalizeText(noticia.metaDescription)) {
    issues.push({ code: 'T1.6', field: 'titulo', message: 'El título es idéntico a la meta descripción', blocking: true });
  }

  const consecutiveCaps = title.match(/(?:\b[A-ZÁÉÍÓÚÑ]{2,}\b\s*){3,}/);
  if (consecutiveCaps) {
    issues.push({ code: 'T1.7', field: 'titulo', message: 'El título contiene tres o más palabras consecutivas en mayúsculas', blocking: true });
  }

  const lastToken = words[words.length - 1]?.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') || '';
  if (lastToken && (PREPOSITIONS.has(lastToken) || CONJUNCTIONS.has(lastToken))) {
    issues.push({ code: 'T1.8', field: 'titulo', message: `El título termina en una preposición/conjunción: ${lastToken}`, blocking: true });
  }

  return issues;
}

// ===================== LEAD / RESUMEN =====================

export function validateLead(noticia: Noticia): Issue[] {
  const issues: Issue[] = [];
  const lead = (noticia.resumen || '').trim();

  if (!lead) {
    issues.push({ code: 'R1.1', field: 'resumen', message: 'El resumen está vacío', blocking: true });
    return issues;
  }

  const words = wordCount(lead);
  if (words < 25) {
    issues.push({ code: 'R1.1', field: 'resumen', message: `Lead demasiado corto: ${words} palabras`, blocking: true });
  } else if (words < 35) {
    issues.push({ code: 'R1.1W', field: 'resumen', message: `Lead corto: ${words} palabras (rango óptimo 35-60)`, blocking: false });
  } else if (words > 75) {
    issues.push({ code: 'R1.1', field: 'resumen', message: `Lead demasiado largo: ${words} palabras`, blocking: true });
  } else if (words > 60) {
    issues.push({ code: 'R1.1W', field: 'resumen', message: `Lead largo: ${words} palabras (rango óptimo 35-60)`, blocking: false });
  }

  const sentences = sentenceCount(lead);
  if (sentences < 1 || sentences > 3) {
    issues.push({ code: 'R1.2', field: 'resumen', message: `Lead con ${sentences} oraciones; debe tener 1-3`, blocking: true });
  }

  if (!hasQué(lead) && !hasPredicative(lead)) {
    issues.push({ code: 'R1.3', field: 'resumen', message: 'El lead no responde qué ocurrió (falta predicado o señal de qué)', blocking: false });
  }

  if (!hasEntity(lead)) {
    issues.push({ code: 'R1.4', field: 'resumen', message: 'El lead no identifica una entidad (quién)', blocking: false });
  }

  if (!hasCuándo(lead)) {
    issues.push({ code: 'R1.5', field: 'resumen', message: 'El lead no contiene información temporal', blocking: false });
  }

  if (!hasDónde(lead)) {
    issues.push({ code: 'R1.6', field: 'resumen', message: 'El lead no contiene ubicación', blocking: false });
  }

  const norm = normalizeText(lead);
  for (const generic of GENERIC_LEAD_DENYLIST) {
    if (norm.includes(generic)) {
      issues.push({ code: 'R1.7', field: 'resumen', message: 'El lead es texto genérico', blocking: true });
      break;
    }
  }

  const leadTokens = lead.split(/\s+/).filter(Boolean);
  const lastLeadToken = leadTokens[leadTokens.length - 1]?.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') || '';
  if (lastLeadToken && (PREPOSITIONS.has(lastLeadToken) || CONJUNCTIONS.has(lastLeadToken))) {
    issues.push({ code: 'R1.8', field: 'resumen', message: `El lead termina en una preposición/conjunción: ${lastLeadToken}`, blocking: true });
  }

  const first = firstParagraph(noticia.contenido || '');
  if (first && jaccardSimilarity(lead, first) >= 0.70) {
    issues.push({ code: 'R1.9', field: 'resumen', message: 'El lead duplica sustancialmente el primer párrafo del contenido', blocking: true });
  }

  const title = normalizeText(noticia.titulo || '');
  if (title && norm.length > title.length && norm.startsWith(title)) {
    issues.push({ code: 'R1.10', field: 'resumen', message: 'El lead es simplemente el título expandido', blocking: true });
  }

  return issues;
}

// ===================== CONTENIDO =====================

export function validateContent(noticia: Noticia): Issue[] {
  const issues: Issue[] = [];
  const content = (noticia.contenido || '').trim();

  if (!content) {
    issues.push({ code: 'C1.1', field: 'contenido', message: 'El contenido está vacío', blocking: true });
    return issues;
  }

  const plain = stripHtml(content);
  const words = wordCount(plain);
  if (words < 350) {
    issues.push({ code: 'C1.2', field: 'contenido', message: `Contenido thin: ${words} palabras (mínimo 350)`, blocking: true });
  }

  const paragraphs = extractParagraphs(content);
  if (paragraphs.length === 0 && !content.includes('<p')) {
    issues.push({ code: 'C1.3', field: 'contenido', message: 'No se detecta estructura de párrafos ni subtítulos suficientes', blocking: false });
  }

  if (hasEmoji(content)) {
    issues.push({ code: 'C1.4', field: 'contenido', message: 'El contenido contiene emojis', blocking: true });
  }

  for (const p of paragraphs) {
    const s = sentenceCount(p);
    if (s < 2 || s > 5) {
      issues.push({ code: 'C1.5', field: 'contenido', message: `Párrafo con ${s} oraciones; preferido 2-5`, blocking: false });
    }
    if (wordCount(p) > 120) {
      issues.push({ code: 'C1.6', field: 'contenido', message: `Párrafo con ${wordCount(p)} palabras; >120 genera warning`, blocking: false });
    }
  }

  if (/<script\b/i.test(content)) {
    issues.push({ code: 'C1.7', field: 'contenido', message: 'Contenido contiene script ejecutable', blocking: true });
  }

  if (/<iframe\b/i.test(content)) {
    issues.push({ code: 'C1.8', field: 'contenido', message: 'Contenido contiene iframe', blocking: true });
  }

  if (/<h1\b/i.test(content)) {
    issues.push({ code: 'C1.9', field: 'contenido', message: 'Contenido contiene <h1> (debe estar fuera del cuerpo)', blocking: true });
  }

  return issues;
}

// ===================== PUNTOS CLAVE =====================

interface PuntoContext {
  titulo?: string;
  resumen?: string;
}

function cleanEnd(text: string): string {
  return text.replace(/[.!?]+$/, '').trim();
}

export function findOriginalSentence(punto: string, sourceText: string): string | null {
  const plain = stripHtml(sourceText);
  const sentences = splitSentences(plain);
  const pTokens = tokenize(normalizeText(punto));

  if (pTokens.length === 0) return null;

  // Sólo aceptamos prefijos (o prefijos tras artículos/sustantivos vacíos omitidos).
  // Nunca usamos un 'includes' genérico: evitamos reparar con una oración
  // donde el punto aparece en medio y fuera de contexto.
  for (const s of sentences) {
    const sClean = cleanEnd(s);
    const sTokens = tokenize(normalizeText(sClean));
    if (sTokens.length <= pTokens.length) continue;

    // 1) prefijo exacto
    let exact = true;
    for (let i = 0; i < pTokens.length; i++) {
      if (sTokens[i] !== pTokens[i]) { exact = false; break; }
    }
    if (exact) return sClean + '.';

    // 2) el punto comienza tras palabras función iniciales (la/el/un/os...)
    let k = 0;
    while (k < sTokens.length && FUNCTION_WORDS.has(sTokens[k] as string)) k++;
    if (k > 0 && k + pTokens.length <= sTokens.length) {
      let match = true;
      for (let i = 0; i < pTokens.length; i++) {
        if (sTokens[k + i] !== pTokens[i]) { match = false; break; }
      }
      if (match) return sClean + '.';
    }
  }

  return null;
}

export function validatePuntoClave(
  punto: string,
  sourceText?: string,
  context?: PuntoContext,
): Issue[] {
  const issues: Issue[] = [];
  const p = (punto || '').trim();

  if (!p) {
    issues.push({ code: 'PK1', field: 'puntosClave', message: 'Punto clave vacío', blocking: true });
    return issues;
  }

  const tokens = tokenize(p);
  const wordCountPunto = tokens.length;

  if (wordCountPunto < 6 || wordCountPunto > 40) {
    issues.push({ code: 'PK2', field: 'puntosClave', message: `Punto clave tiene ${wordCountPunto} palabras (rango 6-40)`, blocking: true });
  }

  const lastChar = p.charAt(p.length - 1);
  if (!['.', '!', '?'].includes(lastChar)) {
    issues.push({ code: 'PK3', field: 'puntosClave', message: 'El punto clave no termina en ., ! o ?', blocking: true });
  }

  if (!/^[A-ZÁÉÍÓÚÑ0-9]/.test(p)) {
    issues.push({ code: 'PK4', field: 'puntosClave', message: 'El punto clave no comienza con mayúscula o dígito', blocking: true });
  }

  const noEnd = cleanEnd(p);
  const rawTokens = noEnd.split(/\s+/).filter(Boolean);
  const lastTokenRaw = rawTokens[rawTokens.length - 1] || '';
  const lastNorm = lastTokenRaw.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

  if (lastNorm && PREPOSITIONS.has(lastNorm)) {
    issues.push({ code: 'PK5', field: 'puntosClave', message: `El punto termina en preposición: ${lastNorm}`, blocking: true });
  }

  if (lastNorm && CONJUNCTIONS.has(lastNorm)) {
    issues.push({ code: 'PK6', field: 'puntosClave', message: `El punto termina en conjunción: ${lastNorm}`, blocking: true });
  }

  if (!hasPredicative(p)) {
    issues.push({ code: 'PK7', field: 'puntosClave', message: 'El punto no contiene un predicado reconocible', blocking: true });
  }

  if (!hasContentToken(p)) {
    issues.push({ code: 'PK8', field: 'puntosClave', message: 'El punto no contiene un token de contenido significativo', blocking: true });
  }

  if (/\.\.|\.\,|\!\!|\?\?|[:;,.!]{2,}/.test(p)) {
    issues.push({ code: 'PK16', field: 'puntosClave', message: 'El punto contiene signos duplicados o inválidos', blocking: true });
  }

  if (/\w[-–—]$/.test(noEnd) || noEnd.endsWith('...')) {
    issues.push({ code: 'PK13', field: 'puntosClave', message: 'El punto contiene una palabra o fragmento truncado', blocking: true });
  }

  const open = (p.match(/\(/g) || []).length;
  const close = (p.match(/\)/g) || []).length;
  if (open !== close) {
    issues.push({ code: 'PK14', field: 'puntosClave', message: 'El punto contiene paréntesis sin cerrar', blocking: true });
  }

  const quotes = (p.match(/"/g) || []).length;
  if (quotes % 2 !== 0) {
    issues.push({ code: 'PK15', field: 'puntosClave', message: 'El punto contiene comillas sin cerrar', blocking: true });
  }

  // Detectar truncamiento con evidencia del contenido original.
  if (sourceText) {
    const original = findOriginalSentence(p, sourceText);
    if (original) {
      const origTokens = tokenize(original);
      const tokenDelta = origTokens.length - wordCountPunto;
      const isPrefixAndLonger = origTokens.length > wordCountPunto &&
        (tokenDelta >= 4 || origTokens.length > wordCountPunto * 1.25);

      if (isPrefixAndLonger) {
        const endsInFunctionWord = PREPOSITIONS.has(lastNorm) || CONJUNCTIONS.has(lastNorm) || FUNCTION_WORDS.has(lastNorm);
        const hasArtificialEnd = !'.,;:!?'.includes(lastChar) || (lastChar === '.' && endsInFunctionWord);
        const hasUnclosed = open !== close || quotes % 2 !== 0;

        if (endsInFunctionWord || hasArtificialEnd || hasUnclosed) {
          issues.push({ code: 'PK_TRUNCATED', field: 'puntosClave', message: 'El punto es un prefijo truncado de una oración del contenido original', blocking: true });
        }
      }
    }
  }

  if (context?.titulo && normalizeText(p) === normalizeText(context.titulo)) {
    issues.push({ code: 'PK11', field: 'puntosClave', message: 'El punto es simplemente el título', blocking: true });
  }

  if (context?.resumen && normalizeText(p) === normalizeText(context.resumen)) {
    issues.push({ code: 'PK12', field: 'puntosClave', message: 'El punto es simplemente el resumen', blocking: true });
  }

  return issues;
}

export function repairPuntosClave(noticia: Noticia): PuntosClaveRepairResult {
  const before = noticia.puntosClave || [];
  const records: RepairRecord[] = [];
  const after: string[] = [];

  const context: PuntoContext = {
    titulo: noticia.titulo,
    resumen: noticia.resumen,
  };

  for (const punto of before) {
    const originalValidation = validatePuntoClave(punto, noticia.contenido, context);

    if (originalValidation.length === 0) {
      records.push({
        field: 'puntosClave',
        before: punto,
        proposedChange: punto,
        after: punto,
        validationResult: { valid: true, issues: [] },
      });
      after.push(punto);
      continue;
    }

    if (!noticia.contenido) {
      records.push({
        field: 'puntosClave',
        before: punto,
        proposedChange: null,
        after: punto,
        validationResult: { valid: false, issues: originalValidation },
      });
      continue;
    }

    const candidate = findOriginalSentence(punto, noticia.contenido);

    if (candidate) {
      const candidateValidation = validatePuntoClave(candidate, noticia.contenido, context);
      if (candidateValidation.length === 0) {
        records.push({
          field: 'puntosClave',
          before: punto,
          proposedChange: candidate,
          after: candidate,
          validationResult: { valid: true, issues: [] },
        });
        after.push(candidate);
        continue;
      } else {
        // ROLLBACK: la oración original tampoco pasa; conservar el punto original (no inventar).
        records.push({
          field: 'puntosClave',
          before: punto,
          proposedChange: candidate,
          after: punto,
          validationResult: { valid: false, issues: candidateValidation },
        });
        continue;
      }
    } else {
      records.push({
        field: 'puntosClave',
        before: punto,
        proposedChange: null,
        after: punto,
        validationResult: { valid: false, issues: originalValidation },
      });
    }
  }

  // Deduplicación idempotente de puntos reparados.
  const seen = new Set<string>();
  const uniqueAfter = after.filter((p) => {
    const n = normalizeText(p);
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });

  return { puntosClave: uniqueAfter.length > 0 ? uniqueAfter : null, records };
}

// ===================== FUENTE =====================

export function validateFuente(noticia: Noticia): Issue[] {
  const issues: Issue[] = [];
  const fuente = (noticia.fuente || '').trim();

  if (!fuente) {
    issues.push({ code: 'F1.1', field: 'fuente', message: 'La fuente está vacía', blocking: true });
    return issues;
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(fuente)) {
    if (!isValidUrl(fuente)) {
      issues.push({ code: 'F1.2', field: 'fuente', message: 'La URL de la fuente no es sintácticamente válida', blocking: true });
    }
    return issues;
  }

  const tokens = tokenize(fuente);
  if (tokens.length < 2) {
    issues.push({ code: 'F1.3', field: 'fuente', message: 'La fuente textual requiere al menos 2 tokens significativos', blocking: true });
  }

  const norm = normalizeText(fuente);
  for (const generic of GENERIC_SOURCE_DENYLIST) {
    if (norm.includes(generic) || norm === generic) {
      issues.push({ code: 'F1.4', field: 'fuente', message: `Fuente genérica o denegada: ${fuente}`, blocking: true });
      break;
    }
  }

  return issues;
}

// ===================== IMAGEN =====================

export function validateImagen(noticia: Noticia): Issue[] {
  const issues: Issue[] = [];
  const img = (noticia.imagen || '').trim();

  if (!img) {
    issues.push({ code: 'I1.1', field: 'imagen', message: 'La imagen está vacía', blocking: true });
    return issues;
  }

  const validPrefix = /^https?:\/\//.test(img) || img.startsWith('/') || img.startsWith('data:');
  if (!validPrefix) {
    issues.push({ code: 'I1.2', field: 'imagen', message: 'La imagen no comienza con http, / o data:', blocking: true });
    return issues;
  }

  if (img === FALLBACK_IMAGE) {
    issues.push({ code: 'I1.3', field: 'imagen', message: 'La imagen es el fallback /logo.webp', blocking: false });
  }

  return issues;
}

// ===================== SUBTÍTULOS =====================

export function validateSubtitulos(noticia: Noticia): Issue[] {
  const issues: Issue[] = [];
  const h2s = extractH2s(noticia.contenido || '');
  const seen = new Set<string>();

  for (let i = 0; i < h2s.length; i++) {
    const h = h2s[i] as string;
    if (!h.trim()) {
      issues.push({ code: 'S1.1', field: 'subtitulos', message: `H2 #${i + 1} está vacío`, blocking: false });
      continue;
    }
    if (wordCount(h) < 3) {
      issues.push({ code: 'S1.2', field: 'subtitulos', message: `H2 #${i + 1} tiene menos de 3 palabras: "${h}"`, blocking: false });
    }
    if (hasEmoji(h)) {
      issues.push({ code: 'S1.3', field: 'subtitulos', message: `H2 #${i + 1} contiene emojis: "${h}"`, blocking: false });
    }
    const norm = normalizeText(h);
    if (seen.has(norm)) {
      issues.push({ code: 'S1.4', field: 'subtitulos', message: `H2 duplicado: "${h}"`, blocking: false });
    }
    seen.add(norm);
  }

  return issues;
}

// ===================== ENLACES INTERNOS =====================

export function validateInternalLinks(noticia: Noticia): Issue[] {
  const issues: Issue[] = [];
  const content = noticia.contenido || '';
  const words = wordCount(stripHtml(content));

  if (words < 450) return issues;

  const related = (noticia.related_links || []).filter((l) => isInternalLink(l.url));
  const links = extractInternalLinks(content);

  if (related.length === 0 && links.length === 0) {
    issues.push({
      code: 'L1.1',
      field: 'enlacesInternos',
      message: 'Artículo largo (>450 palabras) sin enlaces internos',
      blocking: false,
    });
  }

  return issues;
}
