/**
 * Regresión — Auditoría forense de costos Firestore (rama audit/costos-firestore)
 * ============================================================================
 * Fija las decisiones de la optimización de costos para que una reversión
 * accidental (volver a proyectar `contenido` en listados, romper el guard de
 * renderabilidad sin el proxy de `palabras`) se detecte en CI.
 */
import { describe, it, expect } from 'vitest';
import { hasRenderableContent, isRenderableArticle } from '@/lib/editorial/canonical';
import { LIST_FIELDS } from '@/lib/data';

describe('Costos Firestore — proyecciones de listados', () => {
  it('LIST_FIELDS NO incluye contenido (HTML ~10KB/doc)', () => {
    expect(LIST_FIELDS).not.toContain('contenido');
  });

  it('LIST_FIELDS incluye palabras (proxy del guard de renderabilidad)', () => {
    expect(LIST_FIELDS).toContain('palabras');
    expect(LIST_FIELDS).toContain('resumen');
    expect(LIST_FIELDS).toContain('slug');
    expect(LIST_FIELDS).toContain('titulo');
  });
});

describe('hasRenderableContent — proxy palabras sin contenido', () => {
  const base = { slug: 'nota-de-prueba', titulo: 'Titular suficientemente largo' };

  it('contenido > 20 chars sigue siendo renderizable (detalle/sitemap)', () => {
    expect(hasRenderableContent({ ...base, contenido: '<p>Texto largo suficiente</p>' })).toBe(true);
  });

  it('sin contenido pero palabras > 3 → renderizable (listados)', () => {
    expect(hasRenderableContent({ ...base, palabras: 120 })).toBe(true);
    expect(hasRenderableContent({ ...base, palabras: 4 })).toBe(true);
  });

  it('sin contenido y palabras <= 3 → NO renderizable', () => {
    expect(hasRenderableContent({ ...base, palabras: 3 })).toBe(false);
    expect(hasRenderableContent({ ...base, palabras: 0 })).toBe(false);
    expect(hasRenderableContent(base)).toBe(false);
  });

  it('isRenderableArticle usa el proxy en el camino público completo', () => {
    const nota = {
      slug: 'x',
      titulo: 'Titular ok',
      palabras: 200,
      estado: 'publicado',
      publicado: true,
      aprobadoMeni: true,
      archived: false,
    };
    expect(isRenderableArticle(nota)).toBe(true);
  });
});
