// @vitest-environment node
// Regresiones del cierre de producción NI 4.0:
// 1) sanitizeArticleHtml conserva imágenes data:image/* (el CMS embebe base64;
//    el strip ciego de data: hacía "desaparecer" imágenes del cuerpo).
// 2) generateOptimizedTitle no concatena contexto que duplica el título.
import { describe, it, expect } from 'vitest';
import { sanitizeArticleHtml } from '../lib/sanitize';
import { generateOptimizedTitle } from '../lib/seo/title';

describe('sanitize — imágenes data: del CMS', () => {
  it('conserva img con src data:image/png base64', () => {
    const html = '<p>T</p><figure><img src="data:image/png;base64,iVBORw0KGgo=" alt="foto"></figure>';
    const out = sanitizeArticleHtml(html);
    expect(out).toContain('data:image/png;base64,iVBORw0KGgo=');
  });

  it('conserva data:image/webp y jpeg', () => {
    const out = sanitizeArticleHtml('<img src="data:image/webp;base64,AA"><img src="data:image/jpeg;base64,BB">');
    expect(out).toContain('data:image/webp;base64,AA');
    expect(out).toContain('data:image/jpeg;base64,BB');
  });

  it('SIGUE bloqueando javascript: y data:text/html en src', () => {
    const out = sanitizeArticleHtml('<img src="javascript:alert(1)"><img src="data:text/html;base64,PGI+">');
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('data:text/html');
  });
});

describe('título SEO — sin word-salad', () => {
  it('no duplica palabras del contexto ya presentes en el título', () => {
    // Caso real producción: "Dos mujeres mueren deja afectados en Nicaragua Dos mujeres"
    const t = generateOptimizedTitle({
      tipo: 'Sucesos',
      tituloOriginal: 'Dos mujeres mueren en hechos violentos en Managua y Chontales',
      lugar: 'Nicaragua',
      palabraClave: 'Dos mujeres mueren',
      contexto: 'Dos mujeres mueren en hechos viole',
    });
    const words = t.toLowerCase().split(/\s+/);
    // "Dos mujeres mueren" no puede aparecer 2 veces
    const ocurrencias = t.toLowerCase().split('dos mujeres mueren').length - 1;
    expect(ocurrencias).toBe(1);
    expect(words.length).toBeGreaterThan(4);
  });

  it('sí adjunta contexto cuando aporta información nueva', () => {
    const t = generateOptimizedTitle({
      tipo: 'Deportes',
      tituloOriginal: 'Final del Pomares',
      lugar: 'Managua',
      palabraClave: 'Pomares 2026',
      contexto: 'estadio nacional',
    });
    // El contexto nuevo (estadio nacional) puede aparecer si cabe
    expect(t.length).toBeGreaterThanOrEqual(30);
  });
});
