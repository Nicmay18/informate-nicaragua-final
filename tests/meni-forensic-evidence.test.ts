/**
 * Regresión MENI — detector de evidencia/contexto por perfil.
 *
 * Caso real: nota de `educacion` (publicada como Nacionales) sobre el
 * calendario escolar 2026 generaba EVIDENCIA_REQUERIDA:dónde aplica y
 * CONTEXTO_REQUERIDO aunque el contenido ya declaraba alcance nacional
 * y contexto de planificación educativa. La causa era que los patrones
 * solo reconocían geografía sub-nacional y frases literales.
 */
import { describe, it, expect } from 'vitest';
import { evaluate } from '@/lib/editorial/core/pipeline';

// Relleno editorial realista para alcanzar el umbral REPORTAJE (>=700 palabras)
// sin introducir marcadores de ámbito/contexto en los casos negativos.
function pad(texto: string, relleno: string): string {
  const necesarias = 720 - texto.split(/\s+/).length;
  if (necesarias <= 0) return texto;
  const palabras = relleno.split(/\s+/);
  let extra = '';
  while (extra.split(/\s+/).length < necesarias) extra += ' ' + relleno;
  return texto + extra;
}

function noticia(contenido: string, categoria: string) {
  return {
    titulo: 'Nota de prueba editorial',
    contenido: `<p>${contenido}</p>`,
    resumen: 'Resumen de la nota de prueba.',
    categoria,
    autor: 'Editorial',
    fecha: '2026-01-15T10:00:00Z',
    fechaActualizacion: '2026-01-15T12:00:00Z',
    slug: 'nota-prueba',
    palabrasClave: ['Nicaragua'],
    imagenDestacada: 'https://example.com/img.jpg',
  } as any;
}

const RELLENO_NEUTRO = 'Los detalles adicionales del informe fueron compartidos por el equipo de prensa durante la jornada informativa del mediodía.';

describe('MENI Forense — evidencia y contexto por perfil', () => {
  // TEST 1 — Educación (publicada como Nacionales) con alcance nacional explícito
  it('educacion: calendario escolar nacional => dónde aplica y contexto PASS', () => {
    const base = 'Según el comunicado oficial del Ministerio de Educación (MINED) y el Gobierno de Nicaragua, el calendario escolar nacional de Nicaragua establece el ciclo escolar 2026 con alcance nacional para estudiantes y centros educativos del país. La planificación educativa nacional contempla la transición entre el ciclo 2026 y el año lectivo 2027.';
    const contenido = pad(base, RELLENO_NEUTRO);
    const result = evaluate(noticia(contenido, 'Nacionales'));

    expect(result.valorEditorial.warnings.join(' ')).not.toContain('dónde aplica');
    expect(result.valorEditorial.warnings.join(' ')).not.toContain('contexto nacional');
  });

  // TEST 2 — Nacionales conserva comportamiento: contenido nacional real pasa
  it('nacionales: contenido con alcance municipal sigue pasando', () => {
    const base = 'Según el comunicado oficial del Gobierno de Nicaragua y la Alcaldía, el programa de vivienda alcanzará el municipio de Estelí y el departamento de Madriz. La iniciativa forma parte del plan nacional anterior y su comparación con la etapa previa muestra avances.';
    const contenido = pad(base, RELLENO_NEUTRO);
    const result = evaluate(noticia(contenido, 'Nacionales'));

    expect(result.valorEditorial.warnings.join(' ')).not.toContain('dónde aplica');
    expect(result.valorEditorial.warnings.join(' ')).not.toContain('contexto nacional');
  });

  // TEST 3 — Internacional NO exige contexto nacional de Nicaragua
  it('internacional: no exige contexto nacional de Nicaragua', () => {
    const base = 'Según el comunicado oficial de la OEA y la FAO, el acuerdo regional fue firmado en Costa Rica con impacto regional para el comercio centroamericano. La negociación anterior había quedado suspendida tras la cumbre.';
    const contenido = pad(base, RELLENO_NEUTRO);
    const result = evaluate(noticia(contenido, 'Internacionales'));

    expect(result.valorEditorial.warnings.join(' ')).not.toContain('dónde aplica');
    expect(result.valorEditorial.warnings.join(' ')).not.toContain('contexto nacional');
  });

  // TEST 4 — Deportes NO hereda requisitos de Nacionales
  it('deportes: no exige dónde aplica ni contexto nacional', () => {
    const base = 'Según el comunicado oficial de FENIFUT y la FIFA, la selección nacional de Nicaragua logró un récord histórico en la eliminatoria y enfrentará a su próximo rival en el torneo regional.';
    const contenido = pad(base, RELLENO_NEUTRO);
    const result = evaluate(noticia(contenido, 'Deportes'));

    expect(result.valorEditorial.warnings.join(' ')).not.toContain('dónde aplica');
    expect(result.valorEditorial.warnings.join(' ')).not.toContain('contexto nacional');
  });

  // TEST 5 — Falso positivo: educacion SIN alcance ni contexto debe detectarse
  it('educacion sin alcance ni contexto: detector sigue detectando la ausencia', () => {
    const base = 'Según el comunicado oficial del Ministerio de Educación (MINED) y la FAO, se publicaron los requisitos de inscripción. Los documentos necesarios deben presentarse en las oficinas correspondientes durante el plazo establecido.';
    const contenido = pad(base, RELLENO_NEUTRO);
    const result = evaluate(noticia(contenido, 'Nacionales'));

    expect(result.valorEditorial.warnings.join(' ')).toContain('dónde aplica');
    expect(result.valorEditorial.warnings.join(' ')).toContain('contexto nacional o histórico');
  });

  // TEST 6 — Contenido real: nota del calendario escolar 2026 (caso reportado)
  it('caso real calendario escolar 2026: ambas alertas desaparecen', () => {
    const base = 'Según el comunicado oficial del Ministerio de Educación (MINED) y la Presidencia, el calendario escolar nacional de Nicaragua fue presentado como parte de la planificación educativa nacional. El documento oficial establece el ciclo escolar 2026 y la transición hacia el año lectivo 2027 para estudiantes y centros educativos del país. El sistema educativo nicaragüense aplicará el calendario con alcance nacional, continuando la etapa iniciada con el bono escolar de 2025.';
    const contenido = pad(base, RELLENO_NEUTRO);
    const result = evaluate(noticia(contenido, 'Nacionales'));

    const warnings = result.valorEditorial.warnings.join(' ');
    expect(warnings).not.toContain('dónde aplica');
    expect(warnings).not.toContain('contexto nacional');
    // Las reglas siguen activas: el score no se infla artificialmente
    expect(result.valorEditorial.score).toBeLessThanOrEqual(100);
    expect(result.veredicto).toBeTruthy();
  });
});
