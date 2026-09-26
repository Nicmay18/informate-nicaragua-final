import { describe, it, expect, beforeAll, vi } from 'vitest';

/**
 * Regresiones de la fase de consolidación.
 * 1) Autoridad editorial: categoría del editor gana sobre detección MENI,
 *    y el conflicto queda REGISTRADO (nunca sustitución silenciosa).
 *    — El detector se mockea para aislar la precedencia (el falso positivo
 *      real de 'selección' → deportes ya fue verificado sobre el artículo real).
 * 2) Auth: isAdminRequest acepta la cookie admin_session además de headers.
 */

vi.mock('@/lib/meni/profile-detector', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/meni/profile-detector')>();
  return {
    ...mod,
    detectContentProfile: vi.fn(() => ({
      profile_detected: 'deportes',
      profile_confidence: 0.72,
      matched_keywords: ['seleccion'],
      matched_entities: ['seleccion'],
      scores: { deportes: 21 },
    })),
  };
});

import { resolveEditorialClassification } from '@/lib/editorial/canonical';
import { isAdminRequest, verifyAdminToken } from '@/lib/auth';

const HOTEL_MICHELIN = {
  titulo: 'Morgan’s Rock recibe una MICHELIN Key en Nicaragua.',
  resumen: 'Morgan’s Rock Reserve & Ecolodge mantiene en 2026 una MICHELIN Key, distinción de la Guía MICHELIN.',
  contenido: 'La permanencia de Morgan’s Rock en la selección MICHELIN por segundo año consecutivo.',
};

describe('Autoridad editorial — categoría', () => {
  it('editor=Nacionales + detector=deportes ("selección" MICHELIN) → gana Nacionales y el conflicto se registra', () => {
    const r = resolveEditorialClassification({ ...HOTEL_MICHELIN, categoria: 'Nacionales' });
    expect(r.finalCategory).toBe('Nacionales');
    expect(r.classificationSource).toBe('editor');
    // La detección interna sigue viendo deportes, pero NO sustituye — se registra.
    expect(r.suggestedCategory).toBe('Deportes');
    expect(r.classificationConflict).toBe(true);
    expect(r.classificationStatus).toBe('CATEGORY_CONFLICT');
    expect(r.classificationReason).toContain('editor');
  });

  it('sin categoría del editor → la sugerencia automática aplica (flujo AI)', () => {
    const r = resolveEditorialClassification({ ...HOTEL_MICHELIN });
    expect(r.finalCategory).toBe('Deportes');
    expect(r.classificationSource).toBe('AI');
    expect(r.classificationConflict).toBe(false);
  });

  it('editor proporciona categoría pública legacy → mapea a categoría canónica', () => {
    const r = resolveEditorialClassification({ ...HOTEL_MICHELIN, categoria: 'Turismo' });
    expect(r.finalCategory).toBe('Nacionales');
    expect(r.classificationSource).toBe('editor');
  });
});

describe('Auth — isAdminRequest cookie-aware', () => {
  beforeAll(() => {
    process.env.ADMIN_API_KEY = 'test-admin-secret-0123456789';
  });

  const req = (init: { headers?: Record<string, string> }) =>
    new Request('https://x.test/api/admin/config', init);

  it('acepta x-admin-token válido', () => {
    expect(isAdminRequest(req({ headers: { 'x-admin-token': 'test-admin-secret-0123456789' } }))).toBe(true);
  });

  it('acepta cookie admin_session válida sin header', () => {
    expect(isAdminRequest(req({ headers: { cookie: 'admin_session=test-admin-secret-0123456789' } }))).toBe(true);
  });

  it('header marcador inválido + cookie válida → acepta (cookie no es enmascarada)', () => {
    expect(isAdminRequest(req({ headers: { 'x-admin-token': 'session-cookie', cookie: 'admin_session=test-admin-secret-0123456789' } }))).toBe(true);
  });

  it('sin credenciales → 401 (fail-closed)', () => {
    expect(isAdminRequest(req({}))).toBe(false);
  });

  it('cookie inválida → rechaza', () => {
    expect(isAdminRequest(req({ headers: { cookie: 'admin_session=wrong' } }))).toBe(false);
  });

  it('verifyAdminToken: vacío nunca pasa', () => {
    expect(verifyAdminToken('')).toBe(false);
    expect(verifyAdminToken(null)).toBe(false);
    expect(verifyAdminToken(undefined)).toBe(false);
  });
});
