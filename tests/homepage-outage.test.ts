import { describe, it, expect, vi } from 'vitest';

/**
 * P1 — Homepage: un apagón de Firestore NO debe renderizarse como portada vacía.
 * - FirestoreOutageError → la página re-lanza (ISR sirve la última versión buena).
 * - Corpus vacío legítimo → renderiza normal (sin error).
 * - Datos normales → renderiza normal.
 */

const n = (id: string) => ({ id, slug: id, titulo: `t-${id}`, contenido: 'x', resumen: '', categoria: 'Nacionales', fecha: '2026-09-01', publicado: true });

const dataMock = vi.fn();
vi.mock('@/lib/db/homepage', () => ({ getHomePageData: () => dataMock() }));
vi.mock('@/components/HomePagePro', () => ({ default: () => null }));
vi.mock('@/app/home-redesign.css', () => ({}));
vi.mock('@/lib/home-balance', () => ({ checkHomeDiversity: () => ({ balanced: true, alerts: [] }) }));
vi.mock('@/lib/brand-health', () => ({ checkBrandHealth: () => [] }));
vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: () => null }));
vi.mock('@/lib/supervisor', () => ({ auditHomepage: vi.fn(async () => ({ issues: [] })) }));
vi.mock('@/lib/seo/schema', () => ({ buildNewsArticleJsonLdEnhanced: () => ({}) }));
vi.mock('@/lib/jsonld', () => ({ escapeJsonLd: (x: unknown) => JSON.stringify(x) }));
vi.mock('@/lib/nonce', () => ({ getCspNonce: () => Promise.resolve('n') }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import HomePage from '@/app/page';
import { FirestoreOutageError } from '@/lib/data';

describe('P1 — homepage error ≠ empty', () => {
  it('Firestore funciona → renderiza con datos', async () => {
    dataMock.mockResolvedValue({ hero: n('a'), ultimas: [n('b')], enPortada: [], breaking: [], porCategoria: {}, masLeidas: [] });
    await expect(HomePage()).resolves.toBeTruthy();
  });

  it('corpus legítimamente vacío → renderiza shell vacía (no error)', async () => {
    dataMock.mockResolvedValue({ hero: null, ultimas: [], enPortada: [], breaking: [], porCategoria: {}, masLeidas: [] });
    await expect(HomePage()).resolves.toBeTruthy();
  });

  it('FirestoreOutageError → re-lanza (nunca renderiza como corpus vacío)', async () => {
    dataMock.mockRejectedValue(new FirestoreOutageError('firestore caido'));
    await expect(HomePage()).rejects.toThrow(FirestoreOutageError);
  });

  it('error inesperado NO-outage → log + render (resiliencia existente)', async () => {
    dataMock.mockRejectedValue(new Error('bug transitorio'));
    await expect(HomePage()).resolves.toBeTruthy();
  });
});
