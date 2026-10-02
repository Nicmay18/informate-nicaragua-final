/**
 * Content Integrity — VALIDATE→REJECT→LOG de defectos mecánicos conocidos
 * del pipeline de generación (detectados en el saneamiento de 474 notas).
 * Solo patrones imposibles/verbatim — texto legítimo nunca debe bloquearse.
 */
import { describe, it, expect } from 'vitest';
import { findGenerationDefects } from '@/lib/editorial/content-integrity';
import { detectTerminologyVariants } from '@/lib/meni/quality-gate/validator';
import { applyAutoFix } from '@/lib/meni/quality-gate/autoFix';

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

// Regresión CONCAT_MOTOCICLETA: el falso positivo no venía del detector sino
// de unifyTerminology — la variante 'moto' se reemplazaba sin \b y fabricaba
// "motocicletacicleta" dentro del propio texto corregido. La cadena evaluada
// aquí es la misma que corre runQualityGate: detect → autoFix → defects.
describe('CONCAT_MOTOCICLETA — pipeline quality-gate', () => {
  function pipelineDefects(contenido: string) {
    const textoPlano = contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const issues = detectTerminologyVariants(textoPlano);
    const { textoCorregido } = applyAutoFix(contenido, issues);
    return { defects: findGenerationDefects(`Título\n${textoCorregido}`), textoCorregido };
  }

  it('la palabra "motocicleta" correcta nunca produce CONCAT_MOTOCICLETA', () => {
    const casosLimpios = [
      'motocicleta',
      'una motocicleta',
      'La motocicleta era una Pulsar negra',
      'motocicleta,',
      'motocicleta.',
      '<p>La motocicleta era una Pulsar negra.</p>',
      '<p>La motocicleta se accidentó.</p><p>La motocicleta quedó destrozada.</p>',
      '<p>El motociclista fue trasladado.</p>',
      '<p>Las motocicletas invadieron el carril.</p>',
      '<p>Pilotos de motocross entrenan en Managua.</p>',
    ];
    for (const c of casosLimpios) {
      const { defects, textoCorregido } = pipelineDefects(c);
      expect(defects.map(d => d.code), `${c} → ${textoCorregido}`).not.toContain('CONCAT_MOTOCICLETA');
    }
  });

  it('una concatenación real sigue siendo detectada', () => {
    const { defects } = pipelineDefects('<p>Las motocicletacicletas invadieron</p>');
    expect(defects.map(d => d.code)).toContain('CONCAT_MOTOCICLETA');
    const { defects: d2 } = pipelineDefects('<p>El motocicletaciclista fue trasladado.</p>');
    expect(d2.map(d => d.code)).toContain('CONCAT_MOTOCICLETA');
  });

  it('la unificación legítima "moto" → "motocicleta" sigue funcionando', () => {
    const { textoCorregido } = pipelineDefects('<p>La moto era roja y la motocicleta negra.</p>');
    expect(textoCorregido).toContain('La motocicleta era roja');
    expect(textoCorregido).not.toContain('motocicletacicleta');
  });

  it('texto con solo la forma canónica no dispara issue de terminología', () => {
    expect(detectTerminologyVariants('La motocicleta era una Pulsar negra')).toHaveLength(0);
    expect(detectTerminologyVariants('Las motocicletas y los motociclistas')).toHaveLength(0);
  });
});
