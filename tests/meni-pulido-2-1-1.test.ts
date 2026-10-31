/**
 * MENI 2.1.1 — Regresiones de la auditoría consolidada.
 * Convierte los casos históricos (S&P, GRUN, TrackMan V3, longitud de
 * titular, transiciones, contexto, originalidad, severidad) en tests.
 */
import { describe, it, expect } from 'vitest';
import { runAntiClickbait, contieneVerboNoticioso } from '@/lib/meni/anti-clickbait';
import { classifySports, selectSportsQuestions } from '@/lib/meni/sports-classifier';
import { runReaderQuestionsEngine, detectarActoComunicativo } from '@/lib/meni/editorial-brain/reader-questions-engine';
import { runEditorialBrain } from '@/lib/meni/editorial-brain';
import { deportesProfile } from '@/lib/meni/editorial-brain/profiles/deportes';
import { analyzeForensic } from '@/lib/meni/forensic';
import { analyzeTranscriptionByParagraph } from '@/lib/meni/quality-gate/transcription-detector';
import type { EvaluacionEditorial } from '@/lib/editorial';

const TITULO_SP = 'S&P eleva la calificación crediticia de Nicaragua';
const TITULO_GRUN = 'GRUN llama a padres a supervisar Internet de menores';
const TITULO_TRACKMAN = 'Instalan TrackMan V3 en los estadios de beisbol de Nicaragua';

const CUERPO_SP = `
<p>La agencia calificadora S&P Global Ratings elevó la calificación crediticia
de Nicaragua, según informó la institución en un comunicado oficial. La nota
pasó de B a B+, explicó el organismo, y citó la mejora de las finanzas
públicas y la acumulación de reservas internacionales como factores que
respalda la decisión técnica de la calificadora. El Banco Central de
Nicaragua confirmó la información oficial difundida por la agencia y
destacó que la calificación refleja la estabilidad macroeconómica del
país centroamericano. La decisión de S&P también consideró el perfil de
la deuda pública y las proyecciones de crecimiento económico para los
próximos años, indicó la fuente consultada por la redacción.</p>`;

const CUERPO_GRUN = `
<p>La Gran Universidad Nacional (GRUN) llamó a los padres de familia a
supervisar el uso de Internet por parte de menores de edad, informó la
institución a través de sus canales oficiales. La recomendación forma
parte de una campaña de orientación dirigida a hogares nicaragüenses.
Sin embargo, el comunicado no anuncia medidas regulatorias ni sanciones;
se trata de un llamado institucional a la corresponsabilidad familiar.
Según el documento difundido, los padres deben conocer las plataformas
que usan sus hijos y conversar sobre seguridad digital en el hogar.</p>`;

const FUENTE_GRUN = `La GRUN hace un llamado a los padres de familia para que
supervisen el uso que los menores de edad dan a Internet y las redes
sociales en el hogar.`;

const CUERPO_TRACKMAN = `
<p>La Liga de Beisbol Profesional anunció la instalación permanente del
sistema TrackMan V3 en los estadios donde se disputa el torneo nacional.
La tecnología, que utiliza radar y cámaras de alta velocidad, medirá la
velocidad de los lanzamientos, la trayectoria de la bola y métricas de
bateo durante los juegos de la temporada. La instalación se realizará en
los principales parques del país, explicó la liga en su comunicado, y
permitirá disponer de datos biomecánicos para equipos y transmisiones.</p>`;

// ═══════════════════════════════════════════════════════════════
// CASO 1 — S&P: verbo "eleva" reconocido; atribución y análisis económico
// ═══════════════════════════════════════════════════════════════
describe('MENI 2.1.1 — Caso S&P (verbos y evidencia económica)', () => {
  it('reconoce "eleva" como verbo noticioso (sin falso positivo)', () => {
    expect(contieneVerboNoticioso(TITULO_SP)).toBe(true);
    const r = runAntiClickbait({ titulo: TITULO_SP, contenido: CUERPO_SP });
    expect(r.signals.some(s => s.patron === 'sin_verbo_noticioso')).toBe(false);
    expect(r.veredicto).not.toBe('bloqueado');
  });

  it('clasifica S&P como acto de "cambio" (eleva = cambio real)', () => {
    expect(detectarActoComunicativo(`${TITULO_SP} ${CUERPO_SP}`)).toBe('cambio');
  });

  it('economia: preguntas pertinentes, cita textual opcional', () => {
    const rq = runReaderQuestionsEngine({ titulo: TITULO_SP, contenido: CUERPO_SP, categoria: 'Economia' } as never);
    expect(rq.preguntasNoAplicables ?? []).not.toContain('Que cambia?');
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 2 — GRUN: "llama" es verbo; llamado ≠ decisión; fuente limitada OK
// ═══════════════════════════════════════════════════════════════
describe('MENI 2.1.1 — Caso GRUN (llamado institucional)', () => {
  it('reconoce "llama" como verbo noticioso', () => {
    expect(contieneVerboNoticioso(TITULO_GRUN)).toBe(true);
    const r = runAntiClickbait({ titulo: TITULO_GRUN, contenido: CUERPO_GRUN });
    expect(r.signals.some(s => s.patron === 'sin_verbo_noticioso')).toBe(false);
  });

  it('clasifica el acto como "llamado" (sin señales de cambio normativo)', () => {
    expect(detectarActoComunicativo(`${TITULO_GRUN} ${CUERPO_GRUN}`)).toBe('llamado');
  });

  it('no exige preguntas de cambio normativo para un llamado', () => {
    const rq = runReaderQuestionsEngine({ titulo: TITULO_GRUN, contenido: CUERPO_GRUN, categoria: 'Nacionales' } as never);
    expect(rq.preguntasObligatorias).not.toContain('Que cambia?');
    expect(rq.preguntasObligatorias).not.toContain('A quien beneficia?');
    expect(rq.preguntasObligatorias).not.toContain('Que sigue ahora?');
    expect(rq.preguntasNoAplicables ?? []).toContain('Que cambia?');
  });

  it('contexto ausente en la fuente = limitación válida, no fallo editorial', () => {
    const d = runEditorialBrain({
      titulo: TITULO_GRUN,
      contenido: CUERPO_GRUN,
      categoria: 'Nacionales',
      fuente: FUENTE_GRUN,
    });
    // "La fuente no especifica este elemento" es respuesta válida: las
    // limitaciones del origen aparecen como dudas informativas, no como
    // respuestas faltantes penalizadas.
    expect(d.storyCompleteness.dudasPendientes.some(x => x.includes('La fuente no especifica este elemento'))).toBe(true);
    expect(d.storyCompleteness.respuestasFaltantes).not.toContain('Que cambia?');
    // "sin embargo" contextual correcto no genera acción de transición.
    expect(d.acciones.some(a => a.startsWith('CHECK TRANSICIONES') && !a.includes('OK'))).toBe(false);
  });

  it('lenguaje oficial citado no cuenta como relleno emocional del medio', () => {
    const d = runEditorialBrain({
      titulo: 'GRUN declara de "Suprema Urgencia" la supervision digital',
      contenido: `<p>La Gran Universidad Nacional declaró de "Suprema Urgencia" la supervisión del uso de Internet por menores, informó la institución. El documento oficial señala que la escala corresponde a su clasificación interna. "La terrible tragedia digital que estremece a la niñez", reza textualmente el comunicado institucional difundido hoy.</p>`,
      categoria: 'Nacionales',
    });
    expect(d.acciones.some(a => a.includes('RELLENO EMOCIONAL') && !a.includes('OK'))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 3 — TrackMan V3: instalación tecnológica, no partido
// ═══════════════════════════════════════════════════════════════
describe('MENI 2.1.1 — Caso TrackMan V3 (instalación tecnológica)', () => {
  it('clasifica tipoEvento = instalacion', () => {
    const c = classifySports(TITULO_TRACKMAN, CUERPO_TRACKMAN, '');
    expect(c.tipoEvento).toBe('instalacion');
  });

  it('reconoce instalación narrada en pasado/presente (instaló / instala)', () => {
    // Redacción real: el cuerpo suele decir "la liga instaló el sistema"
    // o "el estadio instala radar" — no solo "instalación/instalan".
    for (const cuerpo of [
      'La liga instaló el sistema TrackMan V3 en los estadios para medir lanzamientos y batazos con tecnología de radar.',
      'El estadio instala cámaras y sensores TrackMan como parte del programa de tecnología deportiva.',
    ]) {
      const c = classifySports('TrackMan en estadios de beisbol', cuerpo, '');
      expect(c.tipoEvento).toBe('instalacion');
    }
  });

  it('preguntas de tecnología/alcance/instituciones, no de partido', () => {
    const c = classifySports(TITULO_TRACKMAN, CUERPO_TRACKMAN, '');
    const sel = selectSportsQuestions(c, deportesProfile.preguntasEditor);
    expect(sel.aplicables.some(q => /tecnologia|sistema/.test(q))).toBe(true);
    expect(sel.aplicables.some(q => /donde|alcance/.test(q))).toBe(true);
    expect(sel.aplicables.some(q => /instituciones|ligas/.test(q))).toBe(true);
    for (const prohibida of ['resultado', 'jugaron', 'enfrentan', 'partido', 'pitcher', 'lanza', 'tabla']) {
      expect(sel.aplicables.some(q => q.toLowerCase().includes(prohibida))).toBe(false);
    }
    // Las preguntas de partido quedan registradas como NO APLICABLES.
    expect(sel.noAplicables.length).toBeGreaterThan(0);
  });

  it('reader-questions para Deportes propaga la clasificación', () => {
    const rq = runReaderQuestionsEngine({
      titulo: TITULO_TRACKMAN,
      contenido: CUERPO_TRACKMAN,
      categoria: 'Deportes',
    } as never);
    expect(rq.clasificacionDeporte?.tipoEvento).toBe('instalacion');
    expect(rq.preguntasObligatorias.some(q => /tecnologia/.test(q))).toBe(true);
    expect(rq.preguntasObligatorias.some(q => /resultado|jugaron/.test(q))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 4 — Longitud de titular: 38 caracteres = aceptable, sin -10
// ═══════════════════════════════════════════════════════════════
describe('MENI 2.1.1 — Longitud de titular gradual', () => {
  const T38 = 'S&P eleva la calificación de Nicaragua'; // 38 caracteres
  it('el titular de prueba mide 38 caracteres', () => {
    expect(T38.length).toBe(38);
  });

  it('38 caracteres no produce penalización MEJORAR', () => {
    const d = runEditorialBrain({ titulo: T38, contenido: CUERPO_SP, categoria: 'Economia' });
    expect(d.acciones.some(a => a.includes('CHECK TITULAR: MEJORAR'))).toBe(false);
    expect(d.acciones.some(a => a.includes('CHECK TITULAR: SUGERENCIA'))).toBe(false);
  });

  it('30–34 produce solo SUGERENCIA (nunca acción editorial)', () => {
    const d = runEditorialBrain({ titulo: 'S&P eleva nota de Nicaragua hoy.', contenido: CUERPO_SP, categoria: 'Economia' });
    expect(d.acciones.every(a => !a.includes('CHECK TITULAR: MEJORAR'))).toBe(true);
    expect(d.bloquear).toBe(false);
  });

  it('<30 es el único nivel problema real', () => {
    const d = runEditorialBrain({ titulo: 'S&P sube nota del pais.', contenido: CUERPO_SP, categoria: 'Economia' });
    expect(d.acciones.some(a => a.includes('CHECK TITULAR: MEJORAR'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 5 — Originalidad: paráfrasis fiel ≠ transcripción
// ═══════════════════════════════════════════════════════════════
describe('MENI 2.1.1 — Originalidad (paráfrasis vs transcripción)', () => {
  it('paráfrasis propia de un comunicado tiene baja similitud', () => {
    const r = analyzeTranscriptionByParagraph(CUERPO_GRUN, FUENTE_GRUN);
    expect(r.similitudPromedio).toBeLessThan(50);
  });

  it('transcripción literal sí se detecta como similitud alta', () => {
    const literal = `<p>${FUENTE_GRUN}</p>`;
    const r = analyzeTranscriptionByParagraph(literal, FUENTE_GRUN);
    expect(r.similitudPromedio).toBeGreaterThan(50);
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 6 — Evidencia: atribución válida sin cita textual (§5)
// ═══════════════════════════════════════════════════════════════
describe('MENI 2.1.1 — Evidencia y citas', () => {
  const evaluacionStub = {
    evidence: { forense: { nivelRiesgo: 'Bajo', adjetivosEmocionales: [], riesgosLegales: [] } },
    forense: { score: 80 },
  } as unknown as EvaluacionEditorial;

  it('nota nacional con atribución y sin cita: cita = opcional ("La fuente no especifica este elemento.")', () => {
    const f = analyzeForensic(evaluacionStub, { titulo: TITULO_GRUN, contenido: CUERPO_GRUN } as never, 'nacionales');
    const cita = f.evidencias.find(e => e.tipo === 'Cita textual de una fuente');
    expect(cita?.estado).not.toBe('FALTANTE');
    expect(cita?.mensaje).toBe('La fuente no especifica este elemento.');
    // La atribución periodística sí se detecta y se valida.
    const atribucion = f.evidencias.find(e => e.tipo === 'Atribución periodística de fuentes');
    expect(atribucion?.estado).toBe('OK');
  });

  it('nota sin atribución alguna sí marca la evidencia como faltante', () => {
    const sinAtribucion = '<p>Las familias deben revisar Internet. Es importante cuidar a los menores en línea y hablar de seguridad digital.</p>';
    const f = analyzeForensic(evaluacionStub, { titulo: 'Supervisión digital en hogares', contenido: sinAtribucion } as never, 'nacionales');
    const atribucion = f.evidencias.find(e => e.tipo === 'Atribución periodística de fuentes');
    expect(atribucion?.estado).toBe('FALTANTE');
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 7 — Verbos conjugados comunes del periodismo
// ═══════════════════════════════════════════════════════════════
describe('MENI 2.1.1 — Verbos periodísticos conjugados', () => {
  const titulares = [
    'Ministerio insta a la poblacion a vacunarse',
    'Asamblea reconoce labor de brigadistas',
    'BCN proyecta crecimiento economico para 2026',
    'Alcaldia exhorta a respetar senalizacion vial',
    'MINSA solicita extremar medidas de higiene',
    'Corte sanciona a empresa por incumplimiento',
    'FANR instala camaras de monitoreo en parques',
    'Banco Central ratifica politica cambiaria',
    'Ministerio pospone feria nacional por lluvias',
    'Empresarios demandan estabilidad juridica',
  ];
  for (const t of titulares) {
    it(`reconoce verbo en "${t}"`, () => {
      expect(contieneVerboNoticioso(t)).toBe(true);
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// CASO 8 — Valor: score causal y explicable (§11/§17)
// ═══════════════════════════════════════════════════════════════
describe('MENI 2.1.1 — Score explicable', () => {
  it('los puntos perdidos nombran su causa y su peso', () => {
    const d = runEditorialBrain({
      titulo: 'Vecinos se reunen en el barrio',
      contenido: '<p>Vecinos se reunieron ayer.</p>',
      categoria: 'Nacionales',
    });
    for (const p of d.puntosPerdidos) {
      expect(p.concepto.length).toBeGreaterThan(3);
      expect(p.puntos).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 9 — Severidad: sugerencias no bloquean (§13/§19)
// ═══════════════════════════════════════════════════════════════
describe('MENI 2.1.1 — Severidad: sugerencia ≠ bloqueante', () => {
  it('una nota sólida con un titular en banda advertencia no se bloquea', () => {
    const d = runEditorialBrain({
      titulo: 'S&P eleva nota de Nicaragua.',
      contenido: CUERPO_SP,
      categoria: 'Economia',
      fuente: CUERPO_SP,
    });
    expect(d.bloquear).toBe(false);
    expect(d.recomendacionEditorial).not.toBe('revisar');
  });
});
