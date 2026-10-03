// @vitest-environment node
/**
 * CONTRATOS DEL PIPELINE MENI — regresión de causa raíz.
 * =====================================================
 * Cubre los 3 defectos sistémicos reparados:
 *
 *   1. 'transcripcion' del ADN = similitud REAL vs fuente — nunca la
 *      diferencia editorial como proxy (el "67%" congelado).
 *   2. 'originalidad' del Quality Gate = originalidad REAL — nunca
 *      editorialDifference del sello NI.
 *   3. SOURCE_MISSING respeta fuentes explícitas no catalogadas
 *      ('según el Colegio Teresiano Managua'), igual que Forense.
 */
import { describe, it, expect } from 'vitest';
import { computeEditorialDNA } from '../lib/meni/editorial-dna/engine';
import { analyzeTrust } from '../lib/editorial/trust';
import { runMeni } from '../lib/meni/core';
import type { NoticiaInput } from '../lib/editorial/core/types';

const REPLICA_DECISION = (diff: number) => ({
  editorialDifference: { score: diff, reasons: [] },
  nicaraguaInformate: { score: 80, reasons: [] },
  publicValue: { score: 80, reasons: [] },
  explanation: { score: 80, reasons: [] },
  storyCompleteness: { score: 80, reasons: [] },
  readerQuestions: { score: 80, reasons: [] },
  competition: { score: 80, reasons: [] },
  newsValue: { score: 80, utilidad: 8, reasons: [] },
  bloquear: false,
  score: 80,
  publicar: true,
  editorialDna: { selloNI: { originalidad: diff, servicio: 80, explica: 80, contextualiza: 80 } },
} as any);

describe('A — contenido original sin fuente: transcripción no bloquea', () => {
  it('dna.transcripcion = 100 (no medible sin fuente) — NO proxy de diferencia', () => {
    const dna = computeEditorialDNA({ decision: REPLICA_DECISION(45) as any });
    // editorialDifference=45 → ANTES: transcripcion=45 (<70 → BLOQUEABA).
    // AHORA: sin fuenteOriginal la métrica no es medible → 100, sin bloqueo.
    expect(dna.transcripcion.score).toBe(100);
    expect(dna.transcripcion.bloquear).toBe(false);
  });
});

describe('B — copia casi literal: el mecanismo sí activa', () => {
  it('transcriptionPercent alto → transcripcion bloquea', () => {
    const dna = computeEditorialDNA({ decision: REPLICA_DECISION(80) as any, transcriptionPercent: 80 });
    expect(dna.transcripcion.score).toBe(20);
    expect(dna.transcripcion.bloquear).toBe(true);
  });
});

describe('C — paráfrasis legítima no bloquea', () => {
  it('transcriptionPercent bajo → transcripcion no bloquea', () => {
    const dna = computeEditorialDNA({ decision: REPLICA_DECISION(50) as any, transcriptionPercent: 12 });
    expect(dna.transcripcion.score).toBe(88);
    expect(dna.transcripcion.bloquear).toBe(false);
  });
});

describe('D — fuente explícita no catalogada → no SOURCE_MISSING', () => {
  it('"según el Colegio Teresiano Managua" cuenta como fuente nombrada', () => {
    const r = analyzeTrust({
      titulo: 'Ximena y Matías ganan oratoria nacional 2026',
      cuerpo: '<p>Según el Colegio Teresiano Managua, los estudiantes representaron al centro en la final nacional. De acuerdo con la institución, el evento reunió a participantes de todo el país. Las autoridades educativas destacaron el nivel de la competencia este año.</p>',
      categoria: 'Nacionales',
    });
    expect(r.factores).not.toContain('SOURCE_MISSING');
    expect(r.fuentes.some(f => /Teresiano/i.test(f))).toBe(true);
  });
});

describe('E — sin fuente → SOURCE_MISSING sigue activo', () => {
  it('nota sin atribución ni fuente nombrada → SOURCE_MISSING', () => {
    const r = analyzeTrust({
      titulo: 'Algo pasó en algún lugar',
      cuerpo: '<p>Ocurrió un hecho importante. Hay cosas que pasaron. La situación continúa así.</p>',
      categoria: 'Nacionales',
    });
    expect(r.factores).toContain('SOURCE_MISSING');
  });
});

describe('F — sin contaminación: A→B→A usa su propio body', () => {
  const make = (titulo: string, body: string): NoticiaInput => ({
    titulo, contenido: body, resumen: 'Resumen.',
    categoria: 'Nacionales', autor: 'Editorial',
    fecha: '2026-10-03T10:00:00Z', slug: 'test', palabrasClave: ['Nicaragua'],
    imagenDestacada: 'https://x.com/i.jpg',
  }) as NoticiaInput;

  it('la transcripción responde al body propio — no valor congelado', () => {
    const fuente = '<p>Según el Ministerio de Seguridad Pública de Costa Rica, el país acumula 623 homicidios en el año. La evolución constituye un dato de interés para Centroamérica, incluida Nicaragua, debido a la cercanía geográfica y a las dinámicas regionales relacionadas con seguridad y crimen organizado. Las autoridades detallan que el 64,4 % de las víctimas son jóvenes entre 18 y 35 años.</p>';
    // Body que copia la fuente → transcripción REAL alta
    const copia = runMeni({ ...make('Costa Rica registra 623 homicidios', fuente), fuenteOriginal: fuente });
    // Body propio sin fuente → transcripción no medible (no congelada)
    const propia = runMeni(make('MINSA inaugura hospital en Matagalpa', '<p>El Ministerio de Salud inauguró este martes un nuevo hospital regional en Matagalpa con capacidad para 200 camas y 6 quirófanos modernos. Según autoridades de la cartera, la obra beneficiará a 250 mil habitantes de la zona norte del país y contará con equipos de última generación para diagnóstico por imágenes.</p>'));
    expect(copia.qualityGate?.explanationIndex?.porcentajeTranscripcion ?? 0).toBeGreaterThan(50);
    expect(propia.qualityGate?.explanationIndex?.porcentajeTranscripcion ?? 0).toBe(0);
  });

  it('mismo body → mismas métricas (determinista)', () => {
    const a1 = runMeni(make('A', '<p>Según MINED, los bachilleres reciben un bono de C$4,000 este año escolar.</p>'));
    const a2 = runMeni(make('A', '<p>Según MINED, los bachilleres reciben un bono de C$4,000 este año escolar.</p>'));
    expect(a1.qualityGate?.originalidadPorcentaje).toBe(a2.qualityGate?.originalidadPorcentaje);
  });
});

describe('G — caso Ximena/Matías: nota redactada sin fuente no bloquea por "transcripción"', () => {
  it('runMeni completo: no EDITORIAL_DNA_TRANSCRIPCION sin fuenteOriginal', () => {
    const r = runMeni({
      titulo: 'Ximena y Matías ganan primer lugar nacional en oratoria 2026',
      contenido: '<p>Los estudiantes Ximena y Matías, del Colegio Teresiano de Managua, obtuvieron el primer lugar en el concurso nacional de oratoria 2026, según confirmó este martes la institución educativa. De acuerdo con el centro, ambos representaron al colegio en la final disputada en la capital, donde participaron delegaciones de escuelas de todo el país. La dirección del plantel destacó la preparación y el desempeño de los alumnos durante las etapas clasificatorias.</p><p>El concurso de oratoria es una actividad anual que promueve las habilidades comunicativas en estudiantes de secundaria. Según el Ministerio de Educación, la edición 2026 contó con la participación de centros educativos públicos y privados de los principales departamentos de Nicaragua.</p>',
      resumen: 'Ximena y Matías, del Colegio Teresiano, ganan el concurso nacional de oratoria.',
      categoria: 'Nacionales',
      autor: 'Editorial', fecha: '2026-10-03T10:00:00Z',
      slug: 'ximena-matias-oratoria', palabrasClave: ['oratoria'],
      imagenDestacada: 'https://x.com/i.jpg',
    } as any);
    const blockers = (r.blockingIssues ?? []).map(i => i.code);
    expect(blockers).not.toContain('EDITORIAL_DNA_TRANSCRIPCION');
    // La dimensión transcripción no debe mostrar el valor de la diferencia editorial
    const dna = (r as any).diagnosticoEditorial?.editorialDna ?? (r as any).editorialDna;
    if (dna?.transcripcion) {
      expect(dna.transcripcion.score).toBe(100);
    }
  });
});
