import { describe, it, expect } from 'vitest';
import { normalizeKeywords } from '../lib/editorial/extractor';
import { evaluate } from '../lib/editorial';
import type { NoticiaInput } from '../lib/editorial/core/types';

describe('normalizeKeywords', () => {
  it('devuelve [] para string vacío', () => {
    expect(normalizeKeywords('')).toEqual([]);
  });

  it('devuelve [] para string con solo espacios', () => {
    expect(normalizeKeywords(' ')).toEqual([]);
    expect(normalizeKeywords('   ')).toEqual([]);
  });

  it('devuelve [] para string con solo comas', () => {
    expect(normalizeKeywords(',')).toEqual([]);
    expect(normalizeKeywords(', ,')).toEqual([]);
    expect(normalizeKeywords(',,,')).toEqual([]);
  });

  it('devuelve ["a"] para "a"', () => {
    expect(normalizeKeywords('a')).toEqual(['a']);
  });

  it('devuelve ["a","b"] para "a,b"', () => {
    expect(normalizeKeywords('a,b')).toEqual(['a', 'b']);
  });

  it('devuelve ["a","b"] para "a,,b" (comas vacías)', () => {
    expect(normalizeKeywords('a,,b')).toEqual(['a', 'b']);
  });

  it('devuelve ["a","b","c"] para "a, b , c" (con espacios)', () => {
    expect(normalizeKeywords('a, b , c')).toEqual(['a', 'b', 'c']);
  });

  it('devuelve [] para undefined', () => {
    expect(normalizeKeywords(undefined)).toEqual([]);
  });
});

describe('FALTAN_KEYWORDS se dispara con keywords vacías', () => {
  it('keywords.length === 0 dispara FALTAN_KEYWORDS', () => {
    const noticia: NoticiaInput = {
      titulo: 'Título de prueba para verificar keywords',
      contenido: '<p>Contenido de prueba.</p>',
      resumen: 'Resumen de prueba para la noticia.',
      categoria: 'General',
      autor: 'Redacción',
      slug: 'test-keywords',
      fecha: '2026-07-20',
      palabrasClave: [],
      keywords: '',
    };

    const result = evaluate(noticia);

    // Verificar que seo.keywords está vacío
    expect(result.evidence.seo.keywords).toEqual([]);
    expect(result.evidence.seo.keywords.length).toBe(0);

    // Verificar que FALTAN_KEYWORDS aparece en explainability
    const faltanKeywords = result.explainability.find(e => e.regla === 'FALTAN_KEYWORDS');
    expect(faltanKeywords).toBeDefined();
    expect(faltanKeywords?.modulo).toBe('SEO');
  });
});
