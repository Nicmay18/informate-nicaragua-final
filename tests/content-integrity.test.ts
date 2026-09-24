/**
 * Content Integrity — VALIDATE→REJECT→LOG de defectos mecánicos conocidos
 * del pipeline de generación (detectados en el saneamiento de 474 notas).
 * Solo patrones imposibles/verbatim — texto legítimo nunca debe bloquearse.
 */
import { describe, it, expect } from 'vitest';
import { findGenerationDefects } from '@/lib/editorial/content-integrity';

describe('findGenerationDefects', () => {
  it('detecta concatenación imposible motocicleta*', () => {
    expect(findGenerationDefects('<p>Las motocicletacicletas estuvieron involucradas.</p>').map(d => d.code)).toContain('CONCAT_MOTOCICLETA');
    expect(findGenerationDefects('<p>El motocicletaciclista fue trasladado.</p>').map(d => d.code)).toContain('CONCAT_MOTOCICLETA');
  });

  it('detecta duplicación mecánica "personas personas"', () => {
    expect(findGenerationDefects('<p>varias personas personas resultaron afectadas</p>').map(d => d.code)).toContain('DUP_PERSONAS');
  });

  it('detecta concordancia rota en "afectación"', () => {
    expect(findGenerationDefects('<p>enfrentan el afectación del caso</p>').map(d => d.code)).toContain('CONCORDANCIA_AFECTACION');
    expect(findGenerationDefects('<p>un hombre afectado afectada</p>').map(d => d.code)).toContain('CONCORDANCIA_AFECTACION');
  });

  it('detecta las 6 plantillas de cita fabricada verbatim', () => {
    const plantillas = [
      'un testigo ocular manifestó que todo ocurrió rápido',
      'Un vecino que presenció los hechos comentó: "..."',
      'Declaración de residente local: "Esta zona ha visto..."',
      'María López, vecina del barrio que presenció los hechos',
      'Testimonio recabado por la redacción: "Fue algo que vimos..."',
      'Según testimonio de un transeúte que captó el momento en video',
    ];
    for (const p of plantillas) {
      expect(findGenerationDefects(`<p>${p}</p>`).map(d => d.code), p).toContain('CITA_FABRICADA');
    }
  });

  it('detecta anchor roto en enlaces relacionados', () => {
    expect(findGenerationDefects('<li>managua-y-caribe-norte-mplrwih2">Cinco afectados</li>').map(d => d.code)).toContain('LI_ROTO');
  });

  it('no bloquea texto editorial legítimo', () => {
    const legit = [
      '<p>El motociclista presuntamente circulaba a exceso de velocidad, relataron testigos.</p>',
      '<p>Cáceres Cáceres y Guzmán Guzmán figuran en el registro.</p>',
      '<p>La afectación de la vivienda fue total, según la familia.</p>',
      '<p>Varias personas resultaron afectadas por el incidente.</p>',
      '<ul><li><a href="/noticias/otra-nota">Nota relacionada</a></li><li>Requisito del trámite.</li></ul>',
      '<p>Un residente del barrio explicó la situación a la redacción.</p>',
    ];
    for (const t of legit) {
      expect(findGenerationDefects(t), t).toEqual([]);
    }
  });
});
