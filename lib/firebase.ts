import { Article, FALLBACK_IMAGE } from './types';

const PROJECT_ID = 'informate-instant-nicaragua';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

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
  if ('integerValue' in field) return parseInt(field.integerValue);
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

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : (typeof v === 'string' ? parseFloat(v) || 0 : 0);
}

function bool(v: unknown): boolean {
  return typeof v === 'boolean' ? v : false;
}

function normalizeImage(imagen: string, categoria: string): string {
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

  if (imagen.includes('githubusercontent.com') || imagen.includes('cdn.jsdelivr.net')) {
    const m = imagen.match(/images\/([^/?#]+)/);
    if (m?.[1]) return `/images/${m[1]}`;
  }

  if (imagen.startsWith('http://') || imagen.startsWith('https://')) return imagen;
  if (imagen.startsWith('images/')) return `/${imagen}`;
  if (imagen.startsWith('/')) return imagen;

  const fn = imagen.split('/').pop()?.trim();
  if (!fn || fn.length < 2) return fb;
  return `/images/${fn}`;
}

function docToArticle(doc: { name?: string; fields?: Record<string, FirestoreValue> }): Article | null {
  const f = doc.fields || {};
  const id = doc.name?.split('/').pop() || '';
  if (!id) return null;

  const titulo = str(getValue(f['titulo']) ?? getValue(f['title'])) || 'Sin título';
  const categoria = str(getValue(f['categoria']) ?? getValue(f['category'])) || 'Nacionales';
  const slug = str(getValue(f['slug']));
  if (!slug) return null;

  const imagen = str(getValue(f['imagen']) ?? getValue(f['image']));

  return {
    id,
    title: titulo,
    excerpt: str(getValue(f['resumen']) ?? getValue(f['excerpt'])),
    content: str(getValue(f['contenido']) ?? getValue(f['content'])),
    category: categoria,
    author: str(getValue(f['autor']) ?? getValue(f['author'])) || 'Nicaragua Informate',
    date: str(getValue(f['fecha'])) || new Date().toISOString(),
    image: normalizeImage(imagen, categoria),
    readTime: num(getValue(f['tiempoLectura'])) || 3,
    slug,
    destacada: bool(getValue(f['destacada'])),
    vistas: num(getValue(f['vistas']) ?? getValue(f['views'])),
  };
}

interface FirestoreListResponse {
  documents?: Array<{ name?: string; fields?: Record<string, FirestoreValue> }>;
  nextPageToken?: string;
}

export async function getAllArticles(limitCount = 200): Promise<Article[]> {
  const articles: Article[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${BASE_URL}/noticias`);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('orderBy', 'fecha desc');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), { cache: 'force-cache' } as RequestInit);
    if (!res.ok) break;

    const data: FirestoreListResponse = await res.json();
    for (const doc of data.documents || []) {
      const article = docToArticle(doc);
      if (article) articles.push(article);
      if (articles.length >= limitCount) break;
    }

    pageToken = articles.length < limitCount ? data.nextPageToken : undefined;
  } while (pageToken);

  return articles;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const url = `${BASE_URL}/noticias?pageSize=5`;
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
      limit: 1,
    },
  };

  const res = await fetch(filterUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'force-cache',
  } as RequestInit);

  if (!res.ok) return null;
  const results: Array<{ document?: { name?: string; fields?: Record<string, FirestoreValue> } }> = await res.json();
  const doc = results?.[0]?.document;
  if (!doc) return null;

  return docToArticle(doc);
}

export async function getAllSlugs(): Promise<string[]> {
  const articles = await getAllArticles(300);
  return articles.map((a) => a.slug).filter(Boolean);
}

export async function getLatestArticles(count = 50): Promise<Article[]> {
  const articles = await getAllArticles(count);
  return articles.slice(0, count);
}

