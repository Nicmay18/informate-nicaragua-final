import { describe, it, expect } from 'vitest';
import { EVERGREEN_ARTICLES, evergreenSeoTitle, getEvergreenBySlug } from '@/lib/evergreen';
import { sanitizeArticleHtml } from '@/lib/sanitize';

describe('Guías — SEO title absoluto', () => {
  it('todas las guías producen un título SERP de máximo 60 caracteres', () => {
    for (const g of EVERGREEN_ARTICLES) {
      const t = evergreenSeoTitle(g);
      expect(t.length, `${g.slug}: "${t}"`).toBeLessThanOrEqual(60);
      expect(t.trim().length).toBeGreaterThan(10);
    }
  });

  it('seoTitle editorial tiene prioridad sobre el title largo', () => {
    const g = getEvergreenBySlug('apostillar-documentos-nicaragua-2026')!;
    expect(evergreenSeoTitle(g)).toBe('Cómo apostillar documentos en Nicaragua: citas 2026');
  });

  it('sin seoTitle, el title largo se recorta en límite de palabra', () => {
    const t = evergreenSeoTitle({ title: 'Turismo en Nicaragua 2026: destinos imperdibles, costos y consejos prácticos' });
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t.endsWith('…')).toBe(true);
    // No corta a media palabra: el carácter previo al corte es un espacio.
    expect(t.slice(0, -1).trimEnd()).not.toMatch(/\s\S{0,3}$/);
  });

  it('title corto pasa intacto', () => {
    expect(evergreenSeoTitle({ title: 'Salario mínimo 2026' })).toBe('Salario mínimo 2026');
  });
});

describe('Guías — enlaces oficiales en contenido sanitizado', () => {
  it('la guía de apostilla conserva el enlace clicable a citas.cancilleria.gob.ni', () => {
    const g = getEvergreenBySlug('apostillar-documentos-nicaragua-2026')!;
    const html = sanitizeArticleHtml(g.content);
    expect(html).toContain('href="https://citas.cancilleria.gob.ni"');
  });

  it('la guía de anulación conserva el enlace a tramitesenlinea.policia.gob.ni', () => {
    const g = getEvergreenBySlug('anular-recurso-policial-nicaragua-2026')!;
    const html = sanitizeArticleHtml(g.content);
    expect(html).toContain('href="https://tramitesenlinea.policia.gob.ni/"');
  });

  it('ninguna guía contiene javascript: ni data: en href', () => {
    for (const g of EVERGREEN_ARTICLES) {
      const html = sanitizeArticleHtml(g.content);
      expect(html, g.slug).not.toMatch(/href="(?:javascript|data|vbscript):/i);
    }
  });
});
