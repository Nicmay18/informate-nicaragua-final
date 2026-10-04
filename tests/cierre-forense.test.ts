import { describe, it, expect } from 'vitest';
import { extractPuntosClave } from '../lib/eeat-helpers';
import { parseFechaReal } from '../app/sitemap';

// Regresión del cierre forense: defectos reales encontrados en producción.

describe('extractPuntosClave — no corta oraciones a media frase', () => {
  const contenido = [
    '<p>Ezequiel, originario de Mateare, Managua, era conocido como "Ezequiel Chaparro" y se dedicaba al préstamo de dinero en Costa Rica durante varios años.</p>',
    '<p>Su cuerpo fue localizado el martes 29 de septiembre en una plantación de piña de Calle Calvito, sector La Trinchera, en Pital de San Carlos, provincia de Alajuela.</p>',
    '<p>El Organismo de Investigación Judicial continúa trabajando para determinar las circunstancias del homicidio.</p>',
    '<p>Mientras tanto, los familiares de Ezequiel de Jesús Ruiz Rodríguez recibieron sus restos en Nicaragua para realizar las honras fúnebres y darle sepultura en su tierra natal.</p>',
  ].join('');

  it('produce puntos completos o con clausura honesta, nunca punto falso a media frase', () => {
    const pts = extractPuntosClave(contenido);
    expect(pts.length).toBeGreaterThanOrEqual(1);
    for (const p of pts) {
      // Cada punto termina en '.' real u '…' honesto — nunca una cola suelta
      expect(/[.…]$/.test(p)).toBe(true);
      // No debe terminar en artículo/preposición colgada + punto falso ("...las.")
      expect(/\b(el|la|los|las|un|una|de|del|en|y|o|a|con|por|para)\.$/i.test(p)).toBe(false);
    }
  });

  it('oraciones ≤30 palabras se conservan completas', () => {
    const pts = extractPuntosClave(contenido);
    const corta = pts.find((p) => p.includes('Organismo de Investigación Judicial'));
    if (corta) expect(corta).toMatch(/determinar las circunstancias del homicidio\./);
  });

  it('contenido vacío → array vacío (no inventa)', () => {
    expect(extractPuntosClave('')).toEqual([]);
    expect(extractPuntosClave('<p></p>')).toEqual([]);
  });
});

describe('parseFechaReal — lastmod honesto, sin fabricar now()', () => {
  it('fecha ISO válida → Date', () => {
    const d = parseFechaReal('2026-10-04T09:21:46-06:00');
    expect(d).toBeInstanceOf(Date);
    expect(d!.getTime()).toBeGreaterThan(0);
  });

  it('Firestore {_seconds,_nanoseconds} → Date', () => {
    const d = parseFechaReal({ _seconds: 1759600000, _nanoseconds: 0 });
    expect(d).toBeInstanceOf(Date);
  });

  it('fecha inválida → null (NO fabrica now())', () => {
    expect(parseFechaReal('no-es-fecha')).toBeNull();
    expect(parseFechaReal('')).toBeNull();
    expect(parseFechaReal(null)).toBeNull();
    expect(parseFechaReal(undefined)).toBeNull();
    expect(parseFechaReal({})).toBeNull();
    expect(parseFechaReal(12345)).toBeNull();
  });

  it('objeto con toDate() → Date real', () => {
    const now = new Date('2026-10-04T12:00:00Z');
    const d = parseFechaReal({ toDate: () => now });
    expect(d).toBe(now);
  });
});
