// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { runMeni } from '@/lib/meni';
import { contieneVerboNoticioso, runAntiClickbait } from '@/lib/meni/anti-clickbait';
import { clampMeta, ensureH2 } from '@/lib/meni/autocorrect';
import { detectMeniFactuality } from '@/lib/meni/factual-consistency';
import { analyzeTranscriptionByParagraph, detectParagraphTranscription } from '@/lib/meni/quality-gate/transcription-detector';
import { article, contradictorySport, empirical, evaluationDate, police } from './fixtures/meni40';

beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(evaluationDate)); });
afterAll(() => vi.useRealTimers());
const evaluate = (input: Parameters<typeof runMeni>[0]) => runMeni(input, { skipDuplicateCheck: true, skipEditorBrain: true });

describe('MENI 4.0 — contratos editoriales', () => {
  it.each(['comenzarán', 'comenzará', 'conquista', 'eleva', 'llama', 'instaló', 'instala', 'confirma'])('reconoce %s', verbo => {
    expect(contieneVerboNoticioso(`La institución ${verbo} la jornada`)).toBe(true);
  });
  it.each([
    'Preliminar: 12 personas evacuadas por inundaciones en Chinandega',
    'Incendio en mercado de Managua es controlado en la madrugada',
    'Diriangén golea 5-0 a Real Estelí y sigue invicto',
    'Policía captura a cinco sospechosos en Jinotega',
  ])('reconoce verbo en titular real: %s', titulo => {
    expect(contieneVerboNoticioso(titulo)).toBe(true);
  });
  it.each([
    'El futuro de la economía en manos del nuevo gobierno',
    'La verdad sobre lo que nadie te cuenta',
  ])('sigue detectando ausencia de verbo: %s', titulo => {
    expect(contieneVerboNoticioso(titulo)).toBe(false);
  });
  it('mantiene la alerta por promesa vacía aunque haya verbo válido', () => {
    expect(runAntiClickbait({ titulo: 'No creerás lo que conquista este equipo' }).veredicto).toBe('bloqueado');
  });
  it('no bloquea la paráfrasis policial por similitud', () => {
    const r = evaluate(police);
    expect(r.editorialVerdict?.counts.blockers).toBe(0);
    expect(r.blockingIssues?.some(i => /TRANSCRIPCION/.test(i.code))).toBe(false);
  });
  it('la copia literal extensa exige revisión con evidencia, no demuestra plagio', () => {
    const source = 'El equipo trabajó durante toda la jornada para reconstruir los detalles del incidente y ofrecer una explicación precisa a los lectores. Cada paso fue documentado cuidadosamente para permitir que otros profesionales pudieran examinar los resultados y comprender el alcance de las decisiones adoptadas.';
    const r = detectParagraphTranscription(`<p>${source}</p>`, source);
    expect(r.issues.length).toBeGreaterThan(0);
    expect(r.issues.every(i => i.severidad === 'warning' && !!i.evidencia)).toBe(true);
  });
  it('bloquea 5–0 frente a acta 0–2 sin bajar artificialmente el score', () => {
    const r = evaluate(contradictorySport);
    expect(r.scoreFinal).toBeGreaterThanOrEqual(90);
    expect(r.editorialVerdict?.decision).toBe('BLOQUEAR');
    expect(r.aprobado).toBe(false);
    expect(r.publication_decision).toBe('NO_PUBLICAR');
    expect(r.blockingIssues?.some(i => /CONTRADICTION/.test(i.code) && !!i.evidence)).toBe(true);
  });
  it.each([
    ['El equipo vence 2-1 en Managua', 'El equipo venció 2–1. En la jornada anterior ganó 3-0, aunque fue un partido más difícil.'],
    ['La final termina 6-4 y 7-5', 'La final de tenis terminó 6-4 y 7-5.'],
    ['El plan comienza el 15-11-2026', 'El plazo termina el 10-01-2027, aunque las inspecciones continúan.'],
    ['Real Estelí vence 2-1 a Diriangén', 'Real Estelí ganó 2-1 a Diriangén. Walter Ferretti venció 3-0 a Managua, según el acta oficial.'],
  ])('no inventa contradicción en %s', (title, body) => {
    expect(evaluate(article(title, body, 'Deportes')).editorialVerdict?.hallazgos.some(h =>
      h.code === 'FACTUALIDAD_INTERNAL_CONTRADICTION' && h.bloquea)).toBe(false);
  });
  it('no completa una meta corta con fragmentos del cuerpo', () => {
    const meta = 'La causa sigue bajo investigación.';
    expect(clampMeta(meta, 'Texto posterior sin fuente ni atribución.')).toBe(meta);
  });
  it('no inventa secciones en párrafos sin contexto', () => {
    const body = '<p>Primer dato.</p><p>Segundo dato.</p><p>Tercer dato.</p>';
    expect(ensureH2(body, 'Sucesos')).toBe(body);
  });
  it('el relleno no eleva la calidad de la misma nota', () => {
    expect(evaluate(empirical.relleno).scoreFinal!).toBeLessThanOrEqual(evaluate(empirical.contexto_limitado).scoreFinal!);
  });
  it('la categoría manual se conserva', () => {
    expect(evaluate({ ...police, categoria: 'Nacionales' }).editorCategory).toBe('Nacionales');
  });
  it('los estados públicos concuerdan cuando hay revisión factual', () => {
    const r = evaluate(empirical.deportes_resultado);
    if (r.editorialVerdict?.decision === 'REVISAR') {
      expect(r.aprobado).toBe(false);
      expect(r.publication_decision).toBe('NO_PUBLICAR');
      expect(r.editorialDecision?.veredictoEjecutivo?.publicar).not.toBe('SI');
    }
  });
});

describe('MENI 4.0 — atribución: REVISAR, nunca BLOQUEANTE por ausencia', () => {
  const signals = (body: string, title = 'Real Estelí vence 2-1 a Diriangén') =>
    detectMeniFactuality({ titulo: title, contenido: body });
  const codes = (body: string) => signals(body).map(s => `${s.code}:${s.severity}`);

  it('a) fuente identificada → sin señales de atribución', () => {
    const body = 'Real Estelí derrotó 2-1 a Diriangén la noche de este domingo, según el reporte oficial de la Liga Primera. Los goles fueron de Pérez al 34 y Gómez al 78, informó el organismo rector del fútbol nicaragüense. Con la victoria suma 27 puntos en el torneo.';
    const sig = signals(body);
    expect(sig.some(s => s.code === 'NO_ATTRIBUTION' || s.code === 'VAGUE_ATTRIBUTION' || s.code === 'UNSOURCED_MATERIAL_FIGURES')).toBe(false);
  });

  it('b) atribución indirecta (rol + entidad) → sin NO_ATTRIBUTION', () => {
    const body = 'Real Estelí derrotó 2-1 a Diriangén en el Estadio Independencia. "Sabíamos que iba a ser un partido difícil", declaró el entrenador de Real Estelí al finalizar el compromiso. Los goles fueron de Pérez al 34 y Gómez al 78.';
    expect(codes(body).some(c => c.startsWith('NO_ATTRIBUTION'))).toBe(false);
  });

  it('b3) rol sin entidad identificable → atribución vaga (REVISAR)', () => {
    const body = 'Un equipo derrotó 2-1 a su rival anoche. "Fue difícil", declaró el entrenador al terminar. Los goles fueron al minuto 34 y al 78. Con la victoria suma 27 unidades y lleva 15 años invicto en casa durante el torneo local.';
    const sig = signals(body);
    expect(sig.some(s => s.code === 'VAGUE_ATTRIBUTION' || s.code === 'NO_ATTRIBUTION' || s.code === 'UNSOURCED_MATERIAL_FIGURES')).toBe(true);
    expect(sig.every(s => s.severity !== 'CRITICAL')).toBe(true);
  });

  it('b4) cargo + institución sin verbo previo → fuente concreta', () => {
    const body = 'La directora del INETER informó que el sismo de 4.2 grados se registró con 3 réplicas a 120 kilómetros de la costa, tras 15 años de monitoreo continuo en la zona pacífica del país centroamericano.';
    const sig = signals(body, 'INETER reporta sismo de 4.2 grados en el Pacífico');
    expect(sig.some(s => s.code === 'NO_ATTRIBUTION' || s.code === 'VAGUE_ATTRIBUTION')).toBe(false);
  });

  it('b5) «fuentes cercanas» → atribución vaga (REVISAR, nunca BLOQUEANTE)', () => {
    const body = 'Fuentes cercanas afirmaron que el equipo ganó 2-1 anoche. Los goles fueron al minuto 34 y al 78. Con la victoria suma 27 unidades y lleva 15 años invicto en casa durante el torneo local de primera división.';
    const sig = signals(body);
    expect(sig.some(s => s.code === 'VAGUE_ATTRIBUTION' || s.code === 'NO_ATTRIBUTION' || s.code === 'UNSOURCED_MATERIAL_FIGURES')).toBe(true);
    expect(sig.every(s => s.severity !== 'CRITICAL')).toBe(true);
  });

  it('b6) «según el acta oficial» → fuente documental, sin señal', () => {
    const body = 'El equipo ganó 2-1 anoche, según el acta oficial del partido. Los goles fueron al minuto 34 y al 78. Con la victoria suma 27 unidades y lleva 15 años invicto en casa durante el torneo local de primera división.';
    const sig = signals(body);
    expect(sig.some(s => s.code === 'NO_ATTRIBUTION' || s.code === 'VAGUE_ATTRIBUTION' || s.code === 'UNSOURCED_MATERIAL_FIGURES')).toBe(false);
  });

  it('b2) formas lingüísticas variadas de atribución son reconocidas', () => {
    for (const forma of [
      'informó la Liga Primera',
      'de acuerdo con la Liga Primera',
      'mediante un comunicado de la federación',
      'en declaraciones a la prensa',
      'precisó el organismo',
      'según el parte oficial',
    ]) {
      const body = `${forma}, Real Estelí derrotó 2-1 a Diriangén en el Estadio Independencia. Los goles fueron de Pérez al 34 y Gómez al 78 durante la jornada 12 del torneo.`;
      const sig = signals(body);
      expect(sig.some(s => s.code === 'NO_ATTRIBUTION'), `forma no reconocida: ${forma}`).toBe(false);
    }
  });

  it('c) resultado sin atribución → REVISAR, no BLOQUEANTE', () => {
    const body = 'Real Estelí derrotó 2-1 a Diriangén la noche de este domingo en el Estadio Independencia por la jornada 12. Los goles fueron de Pérez al 34, Gómez al 78 y Rodríguez descontó al 85. Con la victoria suma 27 unidades y se mantiene líder del campeonato nacional de apertura.';
    const sig = signals(body);
    // Si dispara, debe ser IMPORTANT (REVISAR) — nunca CRITICAL (BLOQUEANTE)
    // por mera ausencia de atribución.
    for (const s of sig) {
      expect(s.severity, `señal demasiado severa: ${s.code}`).not.toBe('CRITICAL');
    }
  });

  it('d) resultado contradictorio con el acta → CRITICAL (BLOQUEANTE)', () => {
    const sig = signals(contradictorySport.contenido, contradictorySport.titulo);
    expect(sig.some(s => s.code === 'INTERNAL_CONTRADICTION' && s.severity === 'CRITICAL')).toBe(true);
  });

  it('e) afirmación central sin evidencia → REVISAR (IMPORTANT)', () => {
    const body = 'La empresa TecnoNicaragua presenta su nuevo satélite de comunicaciones que revolucionará la conectividad rural. El dispositivo promete cobertura total del territorio con velocidades de 500 Mbps y funcionará durante 15 años en órbita baja sin mantenimiento ni revisión técnica adicional alguna.';
    const sig = signals(body, 'TecnoNicaragua presenta su primer satélite de comunicaciones');
    expect(sig.length).toBeGreaterThan(0);
    // La ausencia de respaldo exige revisión; no demuestra falsedad.
    expect(sig.some(s => s.severity === 'CRITICAL' && s.code === 'INTERNAL_CONTRADICTION')).toBe(false);
  });
});

describe('MENI 4.0 — transcripción: distinción por naturaleza de la coincidencia', () => {
  const fuente = 'La Policía Nacional informó que un hombre de 34 años murió la madrugada de hoy tras un accidente de tránsito en el kilómetro 14 de la Carretera Norte, en Managua. La víctima conducía una motocicleta que colisionó contra un vehículo pesado. El conductor del camión permanece en el lugar. Las investigaciones continúan.';

  it('coincidencias inevitables de datos → no genera copia sustancial', () => {
    const contenido = '<p>Un motociclista de 34 años falleció la madrugada de este lunes en un siniestro vial ocurrido en el kilómetro 14 de la Carretera Norte, confirmó la Policía Nacional. El conductor del camión quedó en la escena mientras avanza la pesquisa oficial del caso.</p>';
    const r = analyzeTranscriptionByParagraph(contenido, fuente);
    expect(r.parrafos.every(p => p.veredicto !== 'REESCRIBIR')).toBe(true);
    expect(r.similitudSustancialPromedio).toBeLessThan(40);
  });

  it('cita textual atribuida → no cuenta como copia', () => {
    const contenido = '<p>Las autoridades explicaron el momento del impacto. "La víctima conducía una motocicleta que colisionó contra un vehículo pesado", señaló el comisionado encargado del informe policial de la jornada.</p>';
    const r = analyzeTranscriptionByParagraph(contenido, fuente);
    expect(r.parrafos.every(p => p.veredicto !== 'REESCRIBIR')).toBe(true);
  });

  it('atribución antes de la cita en la misma oración → no cuenta como copia', () => {
    const contenido = '<p>El comisionado señaló en su informe: "La víctima conducía una motocicleta que colisionó contra un vehículo pesado durante la madrugada de hoy lunes."</p>';
    const r = analyzeTranscriptionByParagraph(contenido, fuente);
    expect(r.parrafos[0]?.similitudSustancial ?? 100).toBeLessThan(15);
  });

  it('cita + verbo de atribución en ORACIÓN DISTINTA → sigue contando', () => {
    // «expresó» está en otra oración sin relación con la cita: no basta
    // la proximidad de caracteres, se exige relación lingüística.
    const contenido = '<p>"La víctima conducía una motocicleta que colisionó contra un vehículo pesado en la Carretera Norte." El comisionado expresó su plena satisfacción institucional.</p>';
    const r = analyzeTranscriptionByParagraph(contenido, fuente);
    expect(r.parrafos[0]?.similitudSustancial ?? 0).toBeGreaterThan(15);
  });

  it('cita sin atribución → conservada en el análisis', () => {
    const contenido = '<p>"La víctima conducía una motocicleta que colisionó contra un vehículo pesado durante la madrugada de hoy." El tránsito quedó interrumpido por horas.</p>';
    const r = analyzeTranscriptionByParagraph(contenido, fuente);
    expect(r.parrafos[0]?.similitudSustancial ?? 0).toBeGreaterThan(15);
  });

  it('fórmulas institucionales cortas → no cuentan como copia sustancial', () => {
    const contenido = '<p>Tras el hecho, las investigaciones continúan para esclarecer lo sucedido esta madrugada en el sector norte de la capital según el informe preliminar.</p>';
    const r = analyzeTranscriptionByParagraph(contenido, fuente);
    expect(r.parrafos.every(p => p.veredicto === 'OK')).toBe(true);
  });

  it('párrafo copiado sustancialmente → REESCRIBIR con evidencia', () => {
    const contenido = '<p>Un hombre de 34 años murió la madrugada de hoy tras un accidente de tránsito en el kilómetro 14 de la Carretera Norte, en Managua. La víctima conducía una motocicleta que colisionó contra un vehículo pesado.</p>';
    const r = analyzeTranscriptionByParagraph(contenido, fuente);
    expect(r.parrafosParaReescribir).toBeGreaterThan(0);
    expect(r.parrafos.find(p => p.veredicto === 'REESCRIBIR')?.extracto).toBeTruthy();
  });

  it('reescritura periodística fiel → OK sin alerta de copia', () => {
    const contenido = '<p>Un motociclista perdió la vida este lunes cuando su vehículo impactó contra un camión pesado en el kilómetro 14 de la Carretera Norte, en Managua, según el parte emitido por la Policía Nacional.</p>';
    const r = analyzeTranscriptionByParagraph(contenido, fuente);
    expect(r.parrafos.every(p => p.veredicto === 'OK')).toBe(true);
  });

  it('la coincidencia con fuente oficial jamás emite severidad blocking', () => {
    const literal = `<p>${fuente}</p>`;
    const r = detectParagraphTranscription(literal, fuente);
    expect(r.issues.every(i => i.severidad !== 'blocking')).toBe(true);
  });
});
