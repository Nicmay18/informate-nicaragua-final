import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks antes de importar el módulo bajo prueba.
let allFail = false;
let emptyCorpus = false;

const chainableQuery = (): any => {
  const q: any = {
    where: () => q,
    orderBy: () => q,
    select: () => q,
    limit: () => q,
    get: async () => {
      if (allFail) throw new Error('UNAVAILABLE: Firestore caído (mock)');
      return { docs: emptyCorpus ? [] : [DOC], empty: emptyCorpus };
    },
  };
  return q;
};

const DOC = {
  id: 'n1',
  data: () => ({
    slug: 'noticia-prueba',
    titulo: 'Noticia de prueba',
    estado: 'publicado',
    categoria: 'Nacionales',
    fecha: new Date('2025-01-10T12:00:00Z'),
    contenido: 'Cuerpo suficiente para el filtro de calidad '.repeat(30),
  }),
};

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: { collection: () => chainableQuery() },
}));
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: vi.fn(),
}));

import { buildNewsArticleJsonLdEnhanced } from '@/lib/seo/schema';
import { getNews } from '@/lib/data';

describe('P1-17: safeIsoDate nunca fabrica fechas', () => {
  const baseArticle: any = {
    slug: 'x', titulo: 'T', resumen: 'r', categoria: 'Nacionales',
    imagen: 'https://nicaraguainformate.com/img.png',
  };

  it('fecha válida → datePublished ISO presente', () => {
    const ld = buildNewsArticleJsonLdEnhanced({ ...baseArticle, fecha: '2025-01-10T12:00:00Z' }) as any;
    expect(ld.datePublished).toBe('2025-01-10T12:00:00.000Z');
  });

  it('fecha ausente → datePublished omitido (no "ahora")', () => {
    const ld = buildNewsArticleJsonLdEnhanced({ ...baseArticle }) as any;
    expect('datePublished' in ld).toBe(false);
    expect('dateModified' in ld).toBe(false);
  });

  it('fecha inválida → omitida, nunca fabricada', () => {
    const ld = buildNewsArticleJsonLdEnhanced({ ...baseArticle, fecha: 'no-es-fecha' }) as any;
    expect(ld.datePublished).toBeUndefined();
  });
});

describe('P1-08: ERROR ≠ EMPTY en fetchPublishedDocs', () => {
  beforeEach(() => { allFail = false; emptyCorpus = false; });

  it('todas las queries fallan → lanza ERROR (no devuelve [])', async () => {
    allFail = true;
    await expect(getNews(5)).rejects.toThrow(/queries fallaron|Firestore/);
  });

  it('queries OK con 0 docs → corpus vacío legítimo → []', async () => {
    emptyCorpus = true;
    const r = await getNews(5);
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(0);
  });
});
