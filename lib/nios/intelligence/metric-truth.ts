export type MetricScope = 'article' | 'site' | 'google' | 'ga4' | 'gsc' | 'nios' | 'meni' | 'social';

export interface MetricDefinition {
  key: string;
  name: string;
  scope: MetricScope;
  source: string;
  collection?: string;
  field?: string;
  definition: string;
  unit?: string;
  /** Periodo de agregación de la métrica. Ej: lifetime, 24h, 7d, 28d. */
  period?: string;
  freshness: 'realtime' | 'daily' | 'batch' | 'static';
  confidence: 'high' | 'medium' | 'low';
  caveats?: string[];
}

export interface MetricValue<T = unknown> {
  key: string;
  value: T;
  formatted?: string;
  collectedAt?: string;
  definition: MetricDefinition;
}

const CATALOG: MetricDefinition[] = [
  {
    key: 'article.views.canonical',
    name: 'Vistas canónicas del artículo',
    scope: 'article',
    source: 'Firestore',
    collection: 'noticias',
    field: 'vistas',
    definition: 'Contador oficial de lecturas acumuladas de una noticia. Se incrementa por el API de views y se lee directamente del documento.',
    unit: 'vistas',
    period: 'lifetime',
    freshness: 'realtime',
    confidence: 'high',
    caveats: ['Puede haber un buffer de hasta 30s antes de flush.'],
  },
  {
    key: 'article.meni.score',
    name: 'Score MENI',
    scope: 'article',
    source: 'MENI',
    field: 'scoreMeni',
    definition: 'Puntuación editorial de 0 a 100 calculada por el motor MENI. Combina impacto, verificabilidad, estilo y valor ciudadano.',
    unit: 'puntos',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'article.gsc.impressions',
    name: 'Impresiones Google',
    scope: 'gsc',
    source: 'Google Search Console',
    field: 'gscImpressions',
    definition: 'Número de veces que la URL apareció en resultados de búsqueda de Google.',
    unit: 'impresiones',
    freshness: 'daily',
    confidence: 'high',
    caveats: ['Requiere propiedad de GSC configurada.'],
  },
  {
    key: 'article.gsc.clicks',
    name: 'Clicks Google',
    scope: 'gsc',
    source: 'Google Search Console',
    field: 'gscClicks',
    definition: 'Clics orgánicos provenientes de resultados de búsqueda de Google.',
    unit: 'clics',
    freshness: 'daily',
    confidence: 'high',
  },
  {
    key: 'article.ga4.pageviews',
    name: 'Vistas de página GA4',
    scope: 'ga4',
    source: 'Google Analytics 4',
    field: 'ga4Pageviews',
    definition: 'Vistas de página medidas por GA4, incluyendo todo tráfico.',
    unit: 'vistas',
    freshness: 'daily',
    confidence: 'high',
    caveats: ['Puede diferir del contador canónico por adblockers y muestreo.'],
  },
  {
    key: 'article.words',
    name: 'Palabras del artículo',
    scope: 'article',
    source: 'Firestore',
    field: 'palabras',
    definition: 'Conteo de palabras del cuerpo de la noticia después de limpieza.',
    unit: 'palabras',
    freshness: 'static',
    confidence: 'high',
  },
  {
    key: 'site.google.trust',
    name: 'Google Trust Score promedio',
    scope: 'site',
    source: 'NIOS',
    definition: 'Promedio de puntuaciones de confianza Google calculadas por el trust engine.',
    unit: 'puntos',
    freshness: 'daily',
    confidence: 'medium',
  },
  {
    key: 'nios.health',
    name: 'Health Score NIOS',
    scope: 'nios',
    source: 'NIOS Telemetry',
    definition: 'Puntuación de salud del pipeline basada en éxito, latencia y cobertura.',
    unit: 'puntos',
    freshness: 'daily',
    confidence: 'high',
  },
  {
    key: 'site.articles.total',
    name: 'Total de artículos activos',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'slug',
    definition: 'Cantidad de documentos en la colección de noticias consultados para el resumen.',
    unit: 'artículos',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.articles.withViews',
    name: 'Artículos con vistas canónicas',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'vistas',
    definition: 'Artículos que tienen el campo vistas canónico como número.',
    unit: 'artículos',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.articles.withoutViews',
    name: 'Artículos sin vistas canónicas',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'vistas',
    definition: 'Artículos cuyo campo vistas no está presente o no es numérico.',
    unit: 'artículos',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.articles.averageViews',
    name: 'Promedio de vistas canónicas',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'vistas',
    definition: 'Promedio del contador canónico de vistas entre artículos con dato numérico.',
    unit: 'vistas',
    period: 'lifetime',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.articles.totalCanonicalViews',
    name: 'Total de vistas canónicas',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'vistas',
    definition: 'Suma del contador canónico de vistas (noticias.vistas) de todos los artículos. No mezclar con tráfico reciente ni GA4.',
    unit: 'vistas',
    period: 'lifetime',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'article.rank.lifetime.top',
    name: 'Ranking top por vistas canónicas de vida',
    scope: 'article',
    source: 'Firestore',
    collection: 'noticias',
    field: 'vistas',
    definition: 'Ranking de artículos ordenado por el contador canónico de vistas acumuladas (lifetime). No mezclar con tráfico reciente.',
    unit: 'vistas',
    period: 'lifetime',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.traffic.recent24h',
    name: 'Visitas recientes 24h',
    scope: 'site',
    source: 'Firestore',
    collection: 'traffic_log',
    field: 'timestamp',
    definition: 'Conteo de registros en traffic_log cuyo timestamp está dentro de las últimas 24 horas. Métrica RAW, no es vida de artículo.',
    unit: 'visitas',
    period: '24h',
    freshness: 'realtime',
    confidence: 'medium',
    caveats: ['Una visita puede corresponder a un lector, robot o prensa.'],
  },
  {
    key: 'site.traffic.sources',
    name: 'Fuentes de tráfico 24h',
    scope: 'site',
    source: 'Firestore',
    collection: 'traffic_log',
    field: 'source',
    definition: 'Agregación de visitas por parámetro de fuente (UTM/referrer) durante el día consultado.',
    unit: 'visitas',
    freshness: 'daily',
    confidence: 'medium',
  },
  {
    key: 'site.distribution.recent24h',
    name: 'Distribuciones recientes 24h',
    scope: 'site',
    source: 'Firestore',
    collection: 'distribuciones',
    field: 'fecha',
    definition: 'Cantidad de distribuciones realizadas dentro de las últimas 24 horas.',
    unit: 'distribuciones',
    freshness: 'realtime',
    confidence: 'high',
  },
  {
    key: 'site.articles.recent30d',
    name: 'Artículos publicados últimos 30 días',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'fecha',
    definition: 'Artículos cuya fecha de publicación cae dentro de los últimos 30 días.',
    unit: 'artículos',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.quality.distributionRate',
    name: 'Tasa de artículos distribuidos',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'distribuida',
    definition: 'Porcentaje de artículos recientes que tienen marca oficial de distribución o tráfico real canónico.',
    unit: '%',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.articles.published',
    name: 'Artículos publicados',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'estado',
    definition:
      'Inventario editorial activo: publicado===true && estado==="publicado" && archived!==true. Autoridad: classifyArticleUniverse.',
    unit: 'artículos',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.articles.documents',
    name: 'Documentos totales',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    definition:
      'Todos los documentos de la colección noticias, sin filtro. NO equivale a artículos publicados: incluye archivados, borradores, pendientes e inconsistentes.',
    unit: 'documentos',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.articles.archived',
    name: 'Artículos archivados',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'archived',
    definition:
      'Retirados deliberadamente (soft-delete): archived===true o estado==="archivado". No forman parte del inventario publicado.',
    unit: 'artículos',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.articles.drafts',
    name: 'Borradores',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'estado',
    definition:
      'No publicados y no archivados: estado==="borrador" o publicado===false sin marca de archivo.',
    unit: 'artículos',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.articles.pending',
    name: 'Pendientes',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    field: 'estado',
    definition:
      'Documentos sin señal de ciclo de vida publicado/borrador/archivado. Universo de revisión, no del inventario publicado.',
    unit: 'artículos',
    freshness: 'batch',
    confidence: 'high',
  },
  {
    key: 'site.articles.inconsistent',
    name: 'Documentos con ciclo de vida contradictorio',
    scope: 'site',
    source: 'Firestore',
    collection: 'noticias',
    definition:
      'Campos publicado/estado/archived en combinaciones imposibles (p.ej. archivado y publicado a la vez). Se reportan para corrección manual; NO se corrigen automáticamente.',
    unit: 'documentos',
    freshness: 'batch',
    confidence: 'high',
  },
];

const SOCIAL_METRICS: MetricDefinition[] = [
  {
    key: 'social.facebook.reach',
    name: 'Alcance de publicaciones Facebook',
    scope: 'social',
    source: 'Meta',
    definition: 'Número estimado de cuentas únicas que vieron al menos una publicación de la página. No es tráfico web.',
    unit: 'cuentas',
    period: '28d',
    freshness: 'daily',
    confidence: 'medium',
    caveats: ['No sumar con visitas web. No implica lectura.'],
  },
  {
    key: 'social.facebook.impressions',
    name: 'Impresiones de publicaciones Facebook',
    scope: 'social',
    source: 'Meta',
    definition: 'Total de veces que las publicaciones aparecieron en pantalla. Incluye repeticiones para la misma cuenta.',
    unit: 'impresiones',
    period: '28d',
    freshness: 'daily',
    confidence: 'medium',
    caveats: ['No sumar con visitas web.'],
  },
  {
    key: 'social.facebook.reproductions',
    name: 'Reproducciones de videos Facebook',
    scope: 'social',
    source: 'Meta',
    definition: 'Número de reproducciones de video de la página. Métrica de consumo social, no tráfico web.',
    unit: 'reproducciones',
    period: '28d',
    freshness: 'daily',
    confidence: 'medium',
    caveats: ['Una reproducción no es una sesión web ni una lectura.'],
  },
  {
    key: 'social.facebook.reactions',
    name: 'Reacciones en Facebook',
    scope: 'social',
    source: 'Meta',
    definition: 'Total de reacciones (like, love, etc.) en publicaciones. Métrica de interacción, no tráfico.',
    unit: 'reacciones',
    period: '28d',
    freshness: 'daily',
    confidence: 'medium',
    caveats: ['Una reacción no es una visita web.'],
  },
  {
    key: 'social.facebook.comments',
    name: 'Comentarios en Facebook',
    scope: 'social',
    source: 'Meta',
    definition: 'Total de comentarios en publicaciones de la página.',
    unit: 'comentarios',
    period: '28d',
    freshness: 'daily',
    confidence: 'medium',
    caveats: ['No confundir con tráfico web.'],
  },
  {
    key: 'social.facebook.shares',
    name: 'Compartidos en Facebook',
    scope: 'social',
    source: 'Meta',
    definition: 'Número de veces que se compartieron publicaciones. Incrementa alcance secundario.',
    unit: 'compartidos',
    period: '28d',
    freshness: 'daily',
    confidence: 'medium',
  },
  {
    key: 'social.facebook.linkClicks',
    name: 'Clics en enlaces Facebook',
    scope: 'social',
    source: 'Meta',
    definition: 'Clics en el enlace de la publicación que salen del entorno de Facebook hacia el sitio. No son sesiones web.',
    unit: 'clics',
    period: '28d',
    freshness: 'daily',
    confidence: 'medium',
    caveats: ['Un clic social no equivale a una sesión web.'],
  },
  {
    key: 'social.facebook.outboundClicks',
    name: 'Clics salientes Facebook',
    scope: 'social',
    source: 'Meta',
    definition: 'Clics que salen de Facebook a cualquier destino externo.',
    unit: 'clics',
    period: '28d',
    freshness: 'daily',
    confidence: 'medium',
    caveats: ['No confundir con sesiones web atribuibles.'],
  },
  {
    key: 'social.facebook.ctr',
    name: 'CTR social de Facebook',
    scope: 'social',
    source: 'Meta',
    definition: 'Tasa de clics en enlace dividida por impresiones (link_clicks / impressions).',
    unit: '%',
    period: '28d',
    freshness: 'daily',
    confidence: 'medium',
    caveats: ['CTR social no es tasa de conversión a web.'],
  },
  {
    key: 'social.facebook.webSessions',
    name: 'Sesiones web atribuibles a Facebook',
    scope: 'site',
    source: 'GA4 / traffic_log',
    definition: 'Sesiones web cuya fuente es Facebook según GA4 o traffic_log. No sumar con clics sociales.',
    unit: 'sesiones',
    period: '28d',
    freshness: 'daily',
    confidence: 'medium',
    caveats: ['Atribución limitada si no hay UTM ni post_id.'],
  },
  {
    key: 'social.facebook.articleViews',
    name: 'Vistas canónicas atribuibles a Facebook',
    scope: 'article',
    source: 'Firestore',
    collection: 'noticias',
    field: 'vistas',
    definition: 'Vistas canónicas de artículos con UTM source=facebook o referente social. Atribución parcial.',
    unit: 'vistas',
    period: '28d',
    freshness: 'daily',
    confidence: 'low',
    caveats: ['Atribución por UTM o referrer. No es vista orgánica.'],
  },
];

CATALOG.push(...SOCIAL_METRICS);

export function getMetricDefinition(key: string): MetricDefinition | undefined {
  return CATALOG.find((m) => m.key === key);
}

export function getMetricDefinitionByField(
  source: string,
  field: string,
): MetricDefinition | undefined {
  return CATALOG.find((m) => m.source === source && m.field === field);
}

export function wrapMetric<T>(key: string, value: T, collectedAt?: string): MetricValue<T> | null {
  const definition = getMetricDefinition(key);
  if (!definition) return null;
  return { key, value, collectedAt, definition };
}

// ═══════════════════════════════════════════════════════════════════
// UNIVERSO CANÓNICO DE ARTÍCULOS (P0.2)
// Autoridad única para "¿qué significa artículo publicado/archivado/etc.?".
//
// Distinción deliberada con lib/editorial/canonical.ts:
//   canonical.ts → "¿puede MOSTRARSE este artículo?" (lifecycle + MENI + noindex)
//   aquí         → "¿cuántos artículos TIENE el medio?" (lifecycle puro)
// Un artículo publicado que pierde aprobación sigue siendo publicado:
// publicar es un hecho de ciclo de vida, no un veredicto de calidad.
// ═══════════════════════════════════════════════════════════════════

export type ArticleUniverse =
  /** Forma parte del inventario editorial publicado/activo del medio. */
  | 'publicado'
  /** Retirado deliberadamente del inventario (soft-delete). */
  | 'archivado'
  /** No publicado; en preparación o rechazado sin archivar. */
  | 'borrador'
  /** Sin señal de ciclo de vida clara; universo de revisión. */
  | 'pendiente'
  /** Campos contradictorios. Se reporta; no se cuenta ni se corrige solo. */
  | 'inconsistente';

/** Campos mínimos que determinan el ciclo de vida de un artículo. */
export interface ArticleLifecycleFields {
  publicado?: boolean;
  estado?: string;
  archived?: boolean;
}

/**
 * Clasificación canónica del ciclo de vida de un documento de `noticias`.
 * ÚNICA fuente de verdad para el universo de un artículo. No muta datos.
 */
export function classifyArticleUniverse(data: ArticleLifecycleFields): ArticleUniverse {
  const publicado = data.publicado === true;
  const estadoPublicado = data.estado === 'publicado';
  const archivado = data.archived === true || data.estado === 'archivado';
  const borrador = data.estado === 'borrador' || data.publicado === false;

  // Combinaciones imposibles primero: se reportan, no se interpretan.
  if (archivado && (publicado || estadoPublicado)) return 'inconsistente';
  if (borrador && (publicado || estadoPublicado)) return 'inconsistente';
  if (archivado) return 'archivado';
  if (publicado && estadoPublicado) return 'publicado';
  if (publicado || estadoPublicado) return 'inconsistente'; // las flags discrepan
  if (borrador) return 'borrador';
  return 'pendiente';
}

/** "¿Es este documento un artículo publicado del inventario activo?" */
export function isPublishedArticle(data: ArticleLifecycleFields): boolean {
  return classifyArticleUniverse(data) === 'publicado';
}

/** "¿Fue este documento retirado del inventario (soft-delete)?" */
export function isArchivedArticle(data: ArticleLifecycleFields): boolean {
  return classifyArticleUniverse(data) === 'archivado';
}

export interface ArticleUniverseCounts {
  documentos: number;
  publicados: number;
  archivados: number;
  borradores: number;
  pendientes: number;
  inconsistentes: number;
}

/** Conteo canónico por universo sobre una lista de documentos ya cargada. */
export function countArticleUniverse(docs: ArticleLifecycleFields[]): ArticleUniverseCounts {
  const counts: ArticleUniverseCounts = {
    documentos: docs.length,
    publicados: 0,
    archivados: 0,
    borradores: 0,
    pendientes: 0,
    inconsistentes: 0,
  };
  for (const d of docs) {
    const u = classifyArticleUniverse(d);
    if (u === 'publicado') counts.publicados++;
    else if (u === 'archivado') counts.archivados++;
    else if (u === 'borrador') counts.borradores++;
    else if (u === 'pendiente') counts.pendientes++;
    else counts.inconsistentes++;
  }
  return counts;
}

/**
 * Query canónica del universo PUBLICADO para Firestore.
 * `publicado===true && estado==='publicado'` — en datos normalizados implica
 * archived!==true (los archivados llevan publicado===false).
 * NO usar `archived != true`: Firestore `!=` exige que el campo exista y
 * excluiría todos los docs sin el campo `archived`.
 */
export function publishedArticlesQuery(
  collection: FirebaseFirestore.CollectionReference,
): FirebaseFirestore.Query {
  return collection.where('publicado', '==', true).where('estado', '==', 'publicado');
}
