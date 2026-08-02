import { describe, it, expect } from 'vitest';
import { resolveEffectiveSeo, hasWeakMetaDescription, hasWeakKeywords } from '@/lib/seo/effective';
import type { Noticia } from '@/lib/types';

function noticia(overrides: Partial<Noticia> = {}): Noticia {
  return {
    id: 'n1',
    slug: 'nicaragua-conecto-por-tierra-el-caribe-con-el-pacifico',
    titulo: 'Así Nicaragua conectó por tierra el Caribe con el Pacífico',
    resumen: '',
    contenido: '<p>El puente Wawa Boom une por primera vez la Costa Caribe con el Pacífico nicaragüense.</p>',
    categoria: 'Nacionales',
    fecha: '2026-08-01T10:00:00.000Z',
    imagen: '/images/puente.webp',
    autor: 'Redacción Nicaragua Informate',
    estado: 'publicado',
    ...overrides,
  } as Noticia;
}

describe('SEO efectivo — paridad entre la página pública y las auditorías', () => {
  it('usa el resumen cuando existe', () => {
    const n = noticia({ resumen: 'A'.repeat(120) });
    const seo = resolveEffectiveSeo(n);
    expect(seo.descriptionSource).toBe('stored');
    expect(seo.description).toBe('A'.repeat(120));
  });

  it('cae a metaDescription cuando no hay resumen', () => {
    const n = noticia({ metaDescription: 'B'.repeat(120) });
    const seo = resolveEffectiveSeo(n);
    expect(seo.descriptionSource).toBe('stored');
    expect(seo.description).toBe('B'.repeat(120));
  });

  it('genera una descripción cuando no hay resumen ni metaDescription', () => {
    const seo = resolveEffectiveSeo(noticia());
    expect(seo.descriptionSource).toBe('generated');
    expect(seo.description.length).toBeGreaterThan(0);
  });

  it('nunca excede 160 caracteres', () => {
    const seo = resolveEffectiveSeo(noticia({ resumen: 'C'.repeat(400) }));
    expect(seo.description.length).toBeLessThanOrEqual(160);
  });

  it('genera keywords cuando el campo está vacío', () => {
    const seo = resolveEffectiveSeo(noticia());
    expect(seo.keywordsSource).toBe('generated');
    expect(seo.keywords.length).toBeGreaterThan(10);
  });

  it('usa tags como keywords si no hay campo keywords', () => {
    const seo = resolveEffectiveSeo(noticia({ tags: ['puente', 'caribe', 'infraestructura'] }));
    expect(seo.keywordsSource).toBe('stored');
    expect(seo.keywords).toBe('puente, caribe, infraestructura');
  });

  it('genera alt cuando no hay pieFoto', () => {
    const seo = resolveEffectiveSeo(noticia());
    expect(seo.imageAltSource).toBe('generated');
    expect(seo.imageAlt).toContain('Nicaragua Informate');
  });

  it('una noticia sin metaDescription almacenada NO se reporta como meta faltante', () => {
    expect(hasWeakMetaDescription(noticia())).toBe(false);
  });

  it('una noticia sin keywords almacenadas NO se reporta como keywords faltantes', () => {
    expect(hasWeakKeywords(noticia())).toBe(false);
  });

  it('sí marca como débil una meta demasiado corta', () => {
    expect(hasWeakMetaDescription(noticia({ resumen: 'Muy corta.' }))).toBe(true);
  });
});
