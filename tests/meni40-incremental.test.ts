// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { runMeni } from '@/lib/meni';
import { contieneVerboNoticioso, runAntiClickbait } from '@/lib/meni/anti-clickbait';
import { clampMeta, ensureH2 } from '@/lib/meni/autocorrect';
import { detectParagraphTranscription } from '@/lib/meni/quality-gate/transcription-detector';
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
