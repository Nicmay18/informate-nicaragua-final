import { describe, it, expect } from 'vitest';
import { extractPuntosClave, extractoSeguro, buildDek, isTextoRotoPorCorte } from '../lib/eeat-helpers';
import { cleanArticleBody } from '../lib/sanitize';
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

describe('Cortes lingüísticos — nunca a media palabra ni tras abreviatura', () => {
  // Caso A: oración corta permanece completa
  it('A: oración corta no se toca', () => {
    expect(extractoSeguro('El proyecto avanza en Managua.')).toBe('El proyecto avanza en Managua.');
  });

  // Caso B: nombre con abreviatura — nunca cortar después de "Dr."
  it('B: "Dr. Carlos Vanzetti" nunca queda cortado en "Dr."', () => {
    const contenido = '<p>La construcción del Centro Nacional de Neurocirugía “Dr. Carlos Vanzetti”, en Managua, alcanzó un 10 % de avance y tiene prevista su finalización para el 5 de abril de 2027, informó el Ministerio de Salud.</p>';
    const pts = extractPuntosClave(contenido);
    for (const p of pts) {
      expect(p).not.toMatch(/“Dr\.$/);
      expect(p).not.toMatch(/\b(Dr|Ing|Lic|Sr|Sra)\.$/);
    }
    // El dek reconstruido tampoco corta la abreviatura
    const dek = buildDek(contenido, 80);
    expect(dek).not.toMatch(/“Dr\.$/);
  });

  // Caso C: oración larga corta solo en límite válido
  it('C: oración larga → límite de cláusula u oración anterior, no media palabra', () => {
    const larga = 'La construcción del Centro Nacional de Neurocirugía, ubicado en el norte de Managua, alcanzó un avance significativo durante el último trimestre según los reportes oficiales del Ministerio de Salud.';
    const out = extractoSeguro(larga, 120);
    expect(/[.…]$/.test(out)).toBe(true);
    expect(/\b\w{1,2}$/.test(out.replace(/[.…]$/, ''))).toBe(false);
  });

  // Caso D: varias oraciones → prefiere completas
  it('D: varias oraciones → devuelve las que caben completas', () => {
    const t = 'Primera oración corta. Segunda oración también completa y un poco más extensa para la prueba. Tercera.';
    expect(extractoSeguro(t, 90)).toMatch(/^[A-ZÁÉÍÓÚ].*\.$/);
  });

  // Caso E: porcentaje intacto
  it('E: "10 % de avance" no se rompe', () => {
    const out = extractoSeguro('El centro alcanzó un 10 % de avance en Managua.', 200);
    expect(out).toContain('10 %');
  });

  // Caso F: fecha intacta
  it('F: "5 de abril de 2027" no se rompe', () => {
    const out = extractoSeguro('Finalización prevista para el 5 de abril de 2027.', 200);
    expect(out).toContain('5 de abril de 2027');
  });

  // Caso G: puntuación limpia — "neurológicas ," → "neurológicas,"
  it('G: espacio antes de puntuación se elimina', () => {
    expect(cleanArticleBody('enfermedades neurológicas , procedimientos')).toContain('neurológicas,');
    expect(cleanArticleBody('doble  espacio')).toBe('doble espacio');
    // nbsp antes de puntuación (defecto real en producción)
    expect(cleanArticleBody('neurológicas , presentado')).toContain('neurológicas,');
    // cierre de etiqueta + espacio + puntuación
    expect(cleanArticleBody('<strong>neurológicas</strong> , presentado')).toContain('</strong>,');
  });

  it('extractPuntosClave no fusiona heading con oración', () => {
    const conH2 = '<h2>La construcción avanza en Managua</h2><p>El Centro Nacional de Neurocirugía “Dr. Carlos Vanzetti” se construye en el sector de Las Colinas, Managua, como parte de la infraestructura.</p><p>Por ahora, la construcción mantiene un avance del 10 % y tiene como fecha prevista de conclusión el 5 de abril de 2027.</p>';
    const pts = extractPuntosClave(conH2);
    for (const p of pts) {
      expect(p).not.toMatch(/Managua El Centro/);
      expect(p).not.toMatch(/“Dr\.$/);
    }
    expect(pts.length).toBeGreaterThanOrEqual(1);
  });

  // Caso H: detección de texto roto
  it('H: isTextoRotoPorCorte detecta fragmentos y respeta completos', () => {
    expect(isTextoRotoPorCorte('tiene prevista su finalización para e...')).toBe(true);
    expect(isTextoRotoPorCorte('Neurocirugía “Dr.')).toBe(true);
    expect(isTextoRotoPorCorte('El proyecto avanza en Managua.')).toBe(false);
    expect(isTextoRotoPorCorte('El centro tiene 75 camas y cuatro quirófanos.')).toBe(false);
  });

  it('buildDek genera dek completo desde contenido', () => {
    const dek = buildDek('<p>El proyecto avanza en Managua. La obra contempla 75 camas y cuatro quirófanos para atención especializada.</p>');
    expect(dek.length).toBeGreaterThan(20);
    expect(dek.endsWith('.')).toBe(true);
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
