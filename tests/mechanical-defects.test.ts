import { describe, it, expect } from 'vitest';
import { findGenerationDefects, findBlockingDefects } from '@/lib/editorial/content-integrity';
import { runQualityGate } from '@/lib/meni/quality-gate';

describe('barrera defectos mecánicos genéricos', () => {
  it('bloquea mojibake (caracteres corruptos)', () => {
    const d = findBlockingDefects('El reporte indicÃ³ que Ã©l llegó ayer');
    expect(d.map(x => x.code)).toContain('MOJIBAKE');
  });

  it('bloquea palabra duplicada mecánica de 6+ letras', () => {
    const d = findBlockingDefects('Las autoridades confirmaron confirmaron el dato');
    expect(d.map(x => x.code)).toContain('DUP_WORD_GENERIC');
  });

  it('bloquea puntuación duplicada imposible', () => {
    const d = findBlockingDefects('El gobierno anunció;; medidas nuevas');
    expect(d.map(x => x.code)).toContain('DUP_PUNCT');
  });

  it('bloquea encabezado duplicado consecutivo idéntico', () => {
    const d = findBlockingDefects('<h2>Contexto</h2><h2>Contexto</h2><p>Texto normal.</p>');
    expect(d.map(x => x.code)).toContain('DUP_HEADER');
  });

  it('REVIEW (no bloquea) token largo sospechoso', () => {
    const d = findGenerationDefects('La palabra supercalifragilisticoespialidosoooo apareció');
    const lt = d.find(x => x.code === 'LONG_TOKEN');
    expect(lt?.action).toBe('REVIEW');
  });

  it('no bloquea texto limpio', () => {
    const d = findBlockingDefects('La Policía Nacional informó que el operativo concluyó sin incidentes en Managua.');
    expect(d).toHaveLength(0);
  });
});

describe('quality gate POST_LLM con sourceOfTruth — defecto mecánico sí bloquea', () => {
  const base = {
    titulo: 'Autoridades confirman confirmaron operativo en Managua',
    contenido: '<p>La Policía Nacional informó que el operativo concluyó en Managua. ' +
      'Según el parte oficial, no hubo heridos. Las autoridades confirmaron confirmaron el hecho. ' +
      'La nota continúa con contexto suficiente para el lector y desarrollo del evento reportado.</p>'.repeat(1),
    categoria: 'Sucesos',
    stage: 'POST_LLM' as const,
    sourceOfTruth: {
      score: 90,
      originalidad: 80,
      servicio: 70,
      bloqueado: false, // la decisión editorial aprobó
    },
  };

  it('un defecto BLOCK bloquea aunque la decisión editorial haya aprobado', () => {
    const r = runQualityGate(base);
    expect(r.bloqueado).toBe(true);
    expect(r.motivosBloqueo.join(' ')).toMatch(/Defecto mecánico/);
  });

  it('texto limpio + decisión aprobada no se bloquea', () => {
    const r = runQualityGate({
      ...base,
      titulo: 'Operativo policial concluye sin incidentes en Managua',
      contenido: '<p>La Policía Nacional informó que el operativo concluyó en Managua sin incidentes. Según el parte oficial, no hubo heridos ni daños materiales relevantes durante la intervención realizada en horas de la mañana.</p>',
    });
    expect(r.bloqueado).toBe(false);
  });
});
