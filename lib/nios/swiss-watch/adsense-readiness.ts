/**
 * NIOS — AdSense Readiness Engine (nivel sitio).
 *
 * Contexto: Nicaragua Informate ha sido rechazado varias veces. Google revisa
 * el SITIO COMPLETO, no solo la URL enviada. Este motor evalua el sitio entero
 * y produce un veredicto objetivo.
 *
 * LIMITE ABSOLUTO (seccion 45 del protocolo):
 *   Este motor puede afirmar "listo para solicitar revision".
 *   NUNCA puede afirmar "Google aprobara".
 *
 * El motor no consulta la API de AdSense ni el Policy Center: evalua los
 * bloqueadores INTERNOS que si estan bajo control del repositorio.
 */

import type { Noticia } from '@/lib/types';
import type {
  AdSenseBlocker,
  AdSenseCheck,
  AdSenseReadinessVerdict,
} from './types';

const DISCLAIMER =
  'Este veredicto mide unicamente la preparacion interna del sitio. La decision de aprobacion pertenece exclusivamente a Google.';

/** Umbral minimo de palabras para no considerarse contenido "thin". */
const THIN_CONTENT_WORDS = 300;

/** Numero minimo de articulos publicados para una revision con posibilidades. */
const MIN_PUBLISHED_ARTICLES = 25;

/** Paginas legales exigidas por las politicas de AdSense. */
export const REQUIRED_LEGAL_PAGES = [
  '/privacidad',
  '/terminos',
  '/contacto',
  '/nosotros',
];

export interface AdSenseReadinessInput {
  /** Corpus completo de noticias conocido. */
  noticias: Noticia[];
  /** Rutas legales que existen realmente en el sitio. */
  existingLegalPages: string[];
  /** true si ads.txt es accesible publicamente. */
  adsTxtAccessible: boolean;
  /** Contenido de ads.txt si se pudo leer, para validar el publisher id. */
  adsTxtContent: string | null;
  /** true si robots.txt permite el rastreo del sitio. */
  robotsAllowsCrawling: boolean;
  /** true si sitemap.xml responde correctamente. */
  sitemapAccessible: boolean;
  /** Publisher id configurado, si existe. No se registra el valor completo. */
  adsenseClientIdConfigured: boolean;
}

/** Cuenta palabras reales del contenido, ignorando etiquetas HTML. */
function countWords(html: string | undefined): number {
  if (!html) return 0;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(' ').filter(Boolean).length;
}

/** Normaliza un titulo para detectar duplicados aproximados. */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Evalua la preparacion del sitio completo para solicitar revision de AdSense.
 * Funcion pura y determinista: apta para test.
 */
export function evaluateAdSenseReadiness(
  input: AdSenseReadinessInput,
  now = new Date(),
): AdSenseReadinessVerdict {
  const checks: AdSenseCheck[] = [];
  const blockers: AdSenseBlocker[] = [];
  const problemPages: { slug: string; issue: string }[] = [];

  const published = input.noticias.filter(
    (n) => n.estado === 'publicado' && !n.noindex,
  );

  // ── Check 1: volumen de contenido publicado ───────────────────────────
  const enoughContent = published.length >= MIN_PUBLISHED_ARTICLES;
  checks.push({
    id: 'content-volume',
    label: 'Volumen de contenido publicado',
    policy: 'Contenido insuficiente / sitio incompleto',
    passed: enoughContent,
    detail: `${published.length} articulos publicados e indexables (minimo ${MIN_PUBLISHED_ARTICLES}).`,
    weight: 15,
  });
  if (!enoughContent) {
    blockers.push({
      id: 'content-volume',
      severity: 'critical',
      problem: `Solo hay ${published.length} articulos publicados indexables.`,
      policy: 'Contenido insuficiente',
      correctiveAction: `Publicar hasta alcanzar al menos ${MIN_PUBLISHED_ARTICLES} articulos originales e indexables.`,
      fixableInternally: false,
    });
  }

  // ── Check 2: contenido thin ───────────────────────────────────────────
  const thin = published.filter((n) => {
    const words = n.palabras ?? countWords(n.contenido);
    return words < THIN_CONTENT_WORDS;
  });
  const thinRatio = published.length ? thin.length / published.length : 0;
  const thinOk = thinRatio <= 0.2;
  checks.push({
    id: 'thin-content',
    label: 'Proporcion de contenido thin',
    policy: 'Contenido de poco valor',
    passed: thinOk,
    detail: `${thin.length}/${published.length} articulos por debajo de ${THIN_CONTENT_WORDS} palabras (${(thinRatio * 100).toFixed(1)}%).`,
    weight: 20,
  });
  if (!thinOk) {
    blockers.push({
      id: 'thin-content',
      severity: 'critical',
      problem: `${thin.length} articulos (${(thinRatio * 100).toFixed(1)}%) tienen menos de ${THIN_CONTENT_WORDS} palabras.`,
      policy: 'Contenido de poco valor',
      correctiveAction:
        'Ampliar con contexto verificable, o marcar noindex los que no puedan ampliarse. No rellenar con texto vacio.',
      fixableInternally: true,
    });
    thin.slice(0, 25).forEach((n) => {
      problemPages.push({
        slug: n.slug,
        issue: `Contenido thin: ${n.palabras ?? countWords(n.contenido)} palabras.`,
      });
    });
  }

  // ── Check 3: titulos duplicados / contenido repetitivo ────────────────
  const titleCounts = new Map<string, string[]>();
  published.forEach((n) => {
    const key = normalizeTitle(n.titulo);
    if (!key) return;
    const list = titleCounts.get(key) ?? [];
    list.push(n.slug);
    titleCounts.set(key, list);
  });
  const duplicates = [...titleCounts.values()].filter((slugs) => slugs.length > 1);
  const duplicatesOk = duplicates.length === 0;
  checks.push({
    id: 'duplicate-titles',
    label: 'Titulos duplicados',
    policy: 'Contenido duplicado / originalidad',
    passed: duplicatesOk,
    detail: duplicatesOk
      ? 'No se detectaron titulos duplicados.'
      : `${duplicates.length} grupo(s) de titulos duplicados.`,
    weight: 10,
  });
  if (!duplicatesOk) {
    blockers.push({
      id: 'duplicate-titles',
      severity: 'high',
      problem: `${duplicates.length} grupo(s) de articulos comparten el mismo titulo normalizado.`,
      policy: 'Contenido duplicado',
      correctiveAction:
        'Consolidar o diferenciar los articulos duplicados y aplicar canonical al principal.',
      fixableInternally: true,
    });
    duplicates.slice(0, 15).forEach((slugs) => {
      problemPages.push({
        slug: slugs.join(' | '),
        issue: 'Titulo duplicado entre varios articulos.',
      });
    });
  }

  // ── Check 4: paginas legales ──────────────────────────────────────────
  const missingLegal = REQUIRED_LEGAL_PAGES.filter(
    (page) => !input.existingLegalPages.includes(page),
  );
  const legalOk = missingLegal.length === 0;
  checks.push({
    id: 'legal-pages',
    label: 'Paginas legales obligatorias',
    policy: 'Requisitos de privacidad y transparencia',
    passed: legalOk,
    detail: legalOk
      ? 'Privacidad, terminos, contacto y quienes somos existen.'
      : `Faltan: ${missingLegal.join(', ')}.`,
    weight: 15,
  });
  if (!legalOk) {
    blockers.push({
      id: 'legal-pages',
      severity: 'critical',
      problem: `Faltan paginas legales: ${missingLegal.join(', ')}.`,
      policy: 'Requisitos de privacidad y transparencia',
      correctiveAction: 'Crear las paginas legales faltantes con contenido real y enlazarlas en el footer.',
      fixableInternally: true,
    });
  }

  // ── Check 5: rastreabilidad ───────────────────────────────────────────
  const crawlOk = input.robotsAllowsCrawling && input.sitemapAccessible;
  checks.push({
    id: 'crawlability',
    label: 'Rastreabilidad e indexabilidad',
    policy: 'El sitio debe poder ser rastreado por Google',
    passed: crawlOk,
    detail: `robots.txt permite rastreo: ${input.robotsAllowsCrawling}; sitemap.xml accesible: ${input.sitemapAccessible}.`,
    weight: 15,
  });
  if (!crawlOk) {
    blockers.push({
      id: 'crawlability',
      severity: 'critical',
      problem: 'El sitio no es completamente rastreable (robots.txt o sitemap.xml).',
      policy: 'Rastreabilidad',
      correctiveAction: 'Corregir robots.txt y garantizar que sitemap.xml responda 200 con URLs validas.',
      fixableInternally: true,
    });
  }

  // ── Check 6: ads.txt ──────────────────────────────────────────────────
  const adsTxtOk = input.adsTxtAccessible && Boolean(input.adsTxtContent?.includes('google.com'));
  checks.push({
    id: 'ads-txt',
    label: 'ads.txt accesible y valido',
    policy: 'Implementacion de AdSense',
    passed: adsTxtOk,
    detail: input.adsTxtAccessible
      ? `ads.txt accesible; contiene entrada de google.com: ${Boolean(
          input.adsTxtContent?.includes('google.com'),
        )}.`
      : 'ads.txt no accesible.',
    weight: 10,
  });
  if (!adsTxtOk) {
    blockers.push({
      id: 'ads-txt',
      severity: 'high',
      problem: 'ads.txt no es accesible o no contiene una entrada valida de google.com.',
      policy: 'Implementacion de AdSense',
      correctiveAction: 'Publicar ads.txt en la raiz con la linea del publisher autorizado.',
      fixableInternally: true,
    });
  }

  // ── Check 7: autoria y E-E-A-T basico ─────────────────────────────────
  const withoutAuthor = published.filter((n) => !n.autor?.trim());
  const authorRatio = published.length ? withoutAuthor.length / published.length : 1;
  const authorOk = authorRatio <= 0.1;
  checks.push({
    id: 'authorship',
    label: 'Autoria declarada',
    policy: 'E-E-A-T / transparencia',
    passed: authorOk,
    detail: `${withoutAuthor.length}/${published.length} articulos sin autor declarado (${(authorRatio * 100).toFixed(1)}%).`,
    weight: 10,
  });
  if (!authorOk) {
    blockers.push({
      id: 'authorship',
      severity: 'medium',
      problem: `${withoutAuthor.length} articulos publicados no declaran autor.`,
      policy: 'E-E-A-T / transparencia',
      correctiveAction: 'Asignar autor real a cada articulo publicado.',
      fixableInternally: true,
    });
    withoutAuthor.slice(0, 25).forEach((n) => {
      problemPages.push({ slug: n.slug, issue: 'Sin autor declarado.' });
    });
  }

  // ── Check 8: configuracion del publisher ──────────────────────────────
  checks.push({
    id: 'publisher-config',
    label: 'Publisher id de AdSense configurado',
    policy: 'Implementacion de AdSense',
    passed: input.adsenseClientIdConfigured,
    detail: input.adsenseClientIdConfigured
      ? 'GOOGLE_ADSENSE_CLIENT_ID esta presente en el runtime.'
      : 'GOOGLE_ADSENSE_CLIENT_ID no esta configurado.',
    weight: 5,
  });
  if (!input.adsenseClientIdConfigured) {
    blockers.push({
      id: 'publisher-config',
      severity: 'medium',
      problem: 'No hay publisher id de AdSense configurado en el runtime.',
      policy: 'Implementacion de AdSense',
      correctiveAction:
        'Configurar GOOGLE_ADSENSE_CLIENT_ID en Vercel cuando exista una cuenta de publisher activa.',
      fixableInternally: false,
    });
  }

  // ── Score interno ─────────────────────────────────────────────────────
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  const score = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;

  const criticalBlockers = blockers.filter((b) => b.severity === 'critical');

  let status: AdSenseReadinessVerdict['status'];
  if (criticalBlockers.length > 0) {
    status = 'RED';
  } else if (blockers.length > 0) {
    status = 'YELLOW';
  } else {
    status = 'GREEN';
  }

  return {
    status,
    score,
    // READY_FOR_REVIEW exige cero bloqueadores internos (seccion 44).
    verdict: blockers.length === 0 ? 'READY_FOR_REVIEW' : 'NOT_READY',
    internalBlockers: blockers,
    checks,
    problemPages,
    lastReviewedAt: now.toISOString(),
    disclaimer: DISCLAIMER,
  };
}
