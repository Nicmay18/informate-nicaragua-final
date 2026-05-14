import { Article, FALLBACK_IMAGE } from './types';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'informate-instant-nicaragua';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_QUERY_LIMIT = 1;
const FETCH_TIMEOUT = 10000;
const MAX_ARTICLES = 300;

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } };

function getValue(field: FirestoreValue | undefined): unknown {
  if (!field) return null;
  if ('stringValue' in field) return field.stringValue;
  if ('integerValue' in field) return parseInt(field.integerValue, 10);
  if ('doubleValue' in field) return field.doubleValue;
  if ('booleanValue' in field) return field.booleanValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('nullValue' in field) return null;
  if ('mapValue' in field) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(field.mapValue.fields || {})) {
      result[k] = getValue(v);
    }
    return result;
  }
  if ('arrayValue' in field) {
    return (field.arrayValue.values || []).map(getValue);
  }
  return null;
}

function toString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const parsed = parseFloat(v);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function toBoolean(v: unknown): boolean {
  return typeof v === 'boolean' ? v : false;
}

function normalizeImage(imagen: string): string {
  const fb = FALLBACK_IMAGE;
  if (!imagen || imagen === 'null' || imagen === 'undefined' || imagen === 'NaN') return fb;
  if (imagen.startsWith('data:')) return fb;

  if (imagen.includes('firebasestorage.googleapis.com')) {
    const m = imagen.match(/\/o\/(.+?)(\?|$)/);
    if (m) {
      const fn = decodeURIComponent(m[1]).split('/').pop();
      if (fn && fn.length > 2) return `/images/${fn}`;
    }
  }

  // GitHub/jsDelivr URLs: mantener como URL externa (imágenes en repo separado)
  if (imagen.includes('githubusercontent.com') || imagen.includes('cdn.jsdelivr.net')) {
    return imagen;
  }

  if (imagen.startsWith('http://') || imagen.startsWith('https://')) return imagen;
  if (imagen.startsWith('images/')) return `/${imagen}`;
  if (imagen.startsWith('/')) return imagen;

  const fn = imagen.split('/').pop()?.trim();
  if (!fn || fn.length < 2) return fb;
  return `/images/${fn}`;
}

function docToArticle(doc: { name?: string; fields?: Record<string, FirestoreValue> }): Article | null {
  try {
    const f = doc.fields || {};
    const id = doc.name?.split('/').pop() || '';
    if (!id) return null;

    const titulo = toString(getValue(f['titulo']) ?? getValue(f['title']));
    if (!titulo) return null;

    const categoria = toString(getValue(f['categoria']) ?? getValue(f['category'])) || 'Nacionales';
    const slug = toString(getValue(f['slug']));
    if (!slug) return null;

    const imagen = toString(getValue(f['imagen']) ?? getValue(f['image']));

    return {
      id,
      titulo,
      resumen: toString(getValue(f['resumen']) ?? getValue(f['excerpt'])),
      contenido: toString(getValue(f['contenido']) ?? getValue(f['content'])),
      categoria,
      autor: toString(getValue(f['autor']) ?? getValue(f['author'])) || 'Nicaragua Informate',
      fecha: toString(getValue(f['fecha'])) || new Date().toISOString(),
      imagen: normalizeImage(imagen),
      slug,
      destacada: toBoolean(getValue(f['destacada'])),
      vistas: toNumber(getValue(f['vistas']) ?? getValue(f['views'])),
    };
  } catch (error) {
    console.error('[docToArticle]', error instanceof Error ? error.message : String(error));
    return null;
  }
}

interface FirestoreListResponse {
  documents?: Array<{ name?: string; fields?: Record<string, FirestoreValue> }>;
  nextPageToken?: string;
}

function validateLimitCount(count: number): number {
  if (typeof count !== 'number' || isNaN(count)) return MAX_ARTICLES;
  if (count < 0) return MAX_ARTICLES;
  if (count > MAX_ARTICLES) return MAX_ARTICLES;
  return count || MAX_ARTICLES;
}

export async function getAllArticles(limitCount = 200): Promise<Article[]> {
  try {
    const validatedLimit = validateLimitCount(limitCount);
    const articles: Article[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(`${BASE_URL}/noticias`);
      url.searchParams.set('pageSize', String(DEFAULT_PAGE_SIZE));
      url.searchParams.set('orderBy', 'fecha desc');
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(url.toString(), {
        cache: 'no-store',
        signal: controller.signal,
      } as RequestInit);

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.error('[getAllArticles] HTTP error:', res.status, res.statusText);
        break;
      }

      const data: FirestoreListResponse = await res.json();
      for (const doc of data.documents || []) {
        const article = docToArticle(doc);
        if (article) articles.push(article);
        if (articles.length >= validatedLimit) break;
      }

      pageToken = articles.length < validatedLimit ? data.nextPageToken : undefined;
    } while (pageToken);

    return articles;
  } catch (error) {
    console.error('[getAllArticles]', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    if (!slug) return null;

    const filterUrl = `${BASE_URL}:runQuery`;

    const body = {
      structuredQuery: {
        from: [{ collectionId: 'noticias' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'slug' },
            op: 'EQUAL',
            value: { stringValue: slug },
          },
        },
        limit: DEFAULT_QUERY_LIMIT,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(filterUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: controller.signal,
    } as RequestInit);

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error('[getArticleBySlug] HTTP error:', res.status, res.statusText);
      return null;
    }

    const results: Array<{ document?: { name?: string; fields?: Record<string, FirestoreValue> } }> = await res.json();
    const doc = results?.[0]?.document;
    if (!doc) return null;

    return docToArticle(doc);
  } catch (error) {
    console.error('[getArticleBySlug]', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const articles = await getAllArticles(MAX_ARTICLES);
    return articles.map((a) => a.slug).filter(Boolean);
  } catch (error) {
    console.error('[getAllSlugs]', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function getLatestArticles(count = 50): Promise<Article[]> {
  try {
    const validatedCount = validateLimitCount(count);
    const articles = await getAllArticles(validatedCount);
    return articles.slice(0, validatedCount);
  } catch (error) {
    console.error('[getLatestArticles]', error instanceof Error ? error.message : String(error));
    return [];
  }
}
