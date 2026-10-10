/**
 * AUDITORÍA FORENSE MENI — regresiones de los defectos reportados.
 * Cubre TEST 1-8 del informe: verbos noticiosos, loop de título,
 * PROVISIONAL_CLAIM judicial, contexto de Sucesos y veredicto final.
 */
import { describe, it, expect } from 'vitest';
import { runAntiClickbait, contieneVerboNoticioso } from '../lib/meni/anti-clickbait';
import { evaluateRawTitle, makeEditorialDecision } from '../lib/supervisor/editorial-supervisor';
import { analyzeTrust } from '../lib/editorial/trust';
import { isSubstantiallySameTitle } from '../lib/editorial/normalize';
import { getCategoryProfileFields } from '../lib/editorial/core/category-intelligence';
import { decideFromFindings } from '../lib/meni/editorial-verdict';
import type { EditorialFinding } from '../lib/meni/editorial-verdict';

// ── TEST 1/2: verbos noticiosos conjugados ──────────────────────
const VERB_CASES = [
  'Fiscalía acusa a cinco trabajadores de Nuevo Carnic por robo',
  'Fiscalía acusó a cinco trabajadores por robo',
  'Punta Huete completa su pista de 3,600 metros',
  'MINED amplía programa de ajedrez escolar en Nicaragua',
  'MINSA reporta 5,600 niños atendidos en Madriz',
  'Jueza fija audiencia inicial para el jueves',
  'Policía detiene a tres sospechosos en Managua',
  'Centro Nacional de Neurocirugía alcanza 10 % de avance',
  'Tribunal dicta auto de apertura a juicio',
  'Gobierno envía ayuda a comunidades afectadas',
  'Selección clasifica al mundial tras ganar',
  'Hospital finaliza jornada de cirugías pediátricas',
  'La construcción avanza y supera el 60 %',
  'Investigan robo en empresa de seguridad',
];

describe('TEST 1/2 — verbos noticiosos detectados', () => {
  for (const t of VERB_CASES) {
    it(`verbo: "${t.slice(0, 55)}"`, () => {
      expect(contieneVerboNoticioso(t)).toBe(true);
      const r = runAntiClickbait({ titulo: t, contenido: '' });
      expect(r.signals.some(s => s.patron === 'sin_verbo_noticioso')).toBe(false);
    });
  }
});

// ── TEST 2b: el evaluador de título no persigue títulos específicos ──
describe('TEST 2 — evaluateRawTitle', () => {
  it('"Fiscalía acusa…" no necesita investigación', () => {
    const r = evaluateRawTitle('Fiscalía acusa a cinco trabajadores de Nuevo Carnic por robo');
    expect(r.needsInvestigation).toBe(false);
    expect(r.hasNewsVerb).toBe(true);
  });
  it('"Punta Huete completa…" no necesita investigación post-gate', () => {
    const r = evaluateRawTitle('Punta Huete completa su pista de 3,600 metros');
    expect(r.hasNewsVerb).toBe(true);
  });
});

// ── TEST 3: convergencia — título == recomendado → no re-recomendar ──
describe('TEST 3 — sin bucle title_more_specific', () => {
  it('título sustantivo no genera WARNING de especificidad', () => {
    // Título con verbo + marcador (cifra) + longitud: la recomendación ya fue aplicada.
    const d = makeEditorialDecision({
      titulo: 'Punta Huete completa su pista de 3,600 metros',
      contenido: '<p>' + 'Contenido suficientemente largo para post-draft. '.repeat(6) + '</p>',
      categoria: 'Nacionales',
      scoreMeni: 95,
      aprobadoMeni: true,
    });
    expect(d.issues.some(i => i.domain === 'TITULO')).toBe(false);
  });
  it('título idéntico al recomendado se reconoce como el mismo', () => {
    expect(isSubstantiallySameTitle(
      'Fiscalía acusa a cinco trabajadores de Nuevo Carnic por robo',
      'fiscalía acusa a cinco trabajadores de nuevo carnic por robo.',
    )).toBe(true);
  });
  it('título realmente genérico sí advierte', () => {
    const d = makeEditorialDecision({
      titulo: 'Hallan cuerpo en Managua',
      contenido: '<p>' + 'Contenido suficientemente largo para post-draft. '.repeat(6) + '</p>',
      categoria: 'Sucesos',
      scoreMeni: 70,
      aprobadoMeni: false,
    });
    // Genérico: debe mantener la señal (aunque sea WARNING/no bloqueante).
    expect(d.issues.some(i => i.domain === 'TITULO' || d.verdict !== 'PUBLICAR')).toBe(true);
  });
});

// ── TEST 4/5/6: PROVISIONAL_CLAIM y atribución judicial ─────────
const NUEVO_CARNIC_BODY =
  '<p>La Fiscalía acusó a cinco trabajadores de la empresa Nuevo Carnic por el presunto robo ' +
  'de materiales valorados en más de C$1.2 millones, según la acusación fiscal presentada en ' +
  'el Juzgado Noveno de Distrito Penal de Audiencias de Managua.</p>' +
  '<p>De acuerdo con el expediente judicial, los trabajadores habrían retirado los materiales ' +
  'durante varios meses. La empresa detectó las pérdidas tras llamadas anónimas.</p>' +
  '<p>La jueza determinó enviar el caso a juicio y fijó la audiencia para el próximo mes. ' +
  'Los imputados habrían actuado en coordinación.</p>';

describe('TEST 4/6 — atribución judicial válida', () => {
  it('acusación fiscal atribuida → sin PROVISIONAL_CLAIM', () => {
    const r = analyzeTrust({
      titulo: 'Fiscalía acusa a cinco trabajadores de Nuevo Carnic por robo',
      cuerpo: NUEVO_CARNIC_BODY,
      categoria: 'Sucesos',
    });
    expect(r.factores).not.toContain('PROVISIONAL_CLAIM');
    expect(r.factores).not.toContain('ATTRIBUTION_MISSING');
    expect(r.factores).not.toContain('SOURCE_MISSING');
    expect(r.requiereRevisionHumana).toBe(false);
  });
  it('"la jueza determinó" cuenta como atribución', () => {
    const r = analyzeTrust({
      titulo: 'Juzgado envía a juicio caso de robo',
      cuerpo: '<p>La jueza determinó que el caso seguirá a juicio oral y público en la ' +
        'audiencia fijada para el próximo mes, según consta en el expediente judicial.</p>',
      categoria: 'Sucesos',
    });
    expect(r.atribuciones.length + r.fuentes.length).toBeGreaterThan(0);
    expect(r.factores).not.toContain('ATTRIBUTION_MISSING');
  });
});

describe('TEST 5 — delito afirmado SIN atribución sigue marcando', () => {
  it('"Los trabajadores robaron C$1.2 millones" → riesgo', () => {
    const r = analyzeTrust({
      titulo: 'Cinco trabajadores robaron materiales en Managua',
      cuerpo: '<p>Los trabajadores robaron materiales valorados en C$1.2 millones de la ' +
        'empresa durante varios meses sin que nadie reportara las pérdidas a tiempo.</p>',
      categoria: 'Sucesos',
    });
    expect(r.riesgos.length).toBeGreaterThan(0);
    expect(r.requiereRevisionHumana).toBe(true);
  });
  it('provisional sin fuente → PROVISIONAL_CLAIM (habrían, plural)', () => {
    const r = analyzeTrust({
      titulo: 'Robo en empresa de Managua',
      cuerpo: '<p>Los trabajadores habrían retirado materiales de la bodega durante meses ' +
        'sin que nadie reportara nada a las autoridades ni a la empresa.</p>',
      categoria: 'Sucesos',
    });
    expect(r.factores).toContain('PROVISIONAL_CLAIM');
  });
});

// ── TEST 7: Sucesos sin "prevención" no exige inventar contexto ──
describe('TEST 7 — contexto Sucesos acepta evolución del caso', () => {
  it('la cadena procesal (acusación→audiencia→juicio) cuenta como contexto', () => {
    const ctx = getCategoryProfileFields('Sucesos')!.requiredContext;
    const texto = 'La Fiscalía acusó a los trabajadores. La jueza fijó la audiencia ' +
      'inicial y envió el caso a juicio con base en el expediente.';
    expect(ctx.patrones.some(p => p.test(texto))).toBe(true);
  });
});

// ── TEST 8: nota verde puede llegar a PUBLICAR ──────────────────
describe('TEST 8 — decisión final', () => {
  it('0 hallazgos + aprobado → PUBLICAR', () => {
    const v = decideFromFindings([], { scoreFinal: 92, aprobado: true });
    expect(v.decision).toBe('PUBLICAR');
  });
  it('solo recomendaciones + aprobado → PUBLICAR (sugerencias visibles, no degradan)', () => {
    const rec: EditorialFinding = {
      code: 'RECOMENDACION_EDITORIAL',
      severity: 'RECOMMENDATION',
      module: 'editorial',
      title: 'Podría agregar antecedentes',
      description: '',
      howToFix: '',
      bloquea: false,
      field: 'contenido',
    };
    const v = decideFromFindings([rec], { scoreFinal: 92, aprobado: true });
    expect(v.decision).toBe('PUBLICAR');
    // La sugerencia no se oculta — permanece en hallazgos.
    expect(v.counts.recommendations).toBe(1);
  });
  it('WARNING real + aprobado → REVISAR (el gate sigue firme)', () => {
    const w: EditorialFinding = {
      code: 'FACTUALIDAD_TEST',
      severity: 'WARNING',
      module: 'factualidad',
      title: 'Cifra sin atribución',
      description: '',
      howToFix: '',
      bloquea: false,
      field: 'contenido',
    };
    const v = decideFromFindings([w], { scoreFinal: 92, aprobado: true });
    expect(v.decision).toBe('REVISAR');
  });
});
