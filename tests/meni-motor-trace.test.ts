/**
 * AUDITORÍA DEL MOTOR MENI — trace end-to-end real sobre Nuevo Carnic.
 * Ejecuta guardarConMeni (el pipeline real: MENI + factuality + trust +
 * supervisor + decideFromFindings) con un Firestore stub y vuelca cada
 * etapa de decisión. NO es un motor paralelo: son los componentes reales.
 */
import { describe, it } from 'vitest';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import { analyzeTrust } from '@/lib/editorial/trust';
import { detectFactualitySignals } from '@/lib/editorial/factuality-signals';
import { evaluateRawTitle, makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';

// Stub mínimo de Firestore: el pipeline solo escribe meni_decision_log
// (doc().set) y con skipDuplicateCheck no lee `noticias`. La query es
// un objeto encadenable que siempre devuelve un snapshot vacío.
const emptySnap = { empty: true, docs: [] as any[] };
const chainable: any = {
  where: () => chainable,
  orderBy: () => chainable,
  limit: () => chainable,
  select: () => chainable,
  get: async () => emptySnap,
};
const fakeDb: any = {
  collection: () => ({
    doc: () => ({ set: async () => undefined, get: async () => ({ exists: false }) }),
    add: async () => ({ id: 'stub' }),
    where: () => chainable,
    orderBy: () => chainable,
    limit: () => chainable,
    get: async () => emptySnap,
  }),
};

const TITULO = 'Fiscalía acusa a cinco trabajadores de Nuevo Carnic por robo';
const BODY =
  '<p>La Fiscalía acusó a cinco trabajadores de la empresa Nuevo Carnic por el presunto robo ' +
  'de materiales valorados en más de C$1.2 millones, según la acusación fiscal presentada en ' +
  'el Juzgado Noveno de Distrito Penal de Audiencias de Managua.</p>' +
  '<p>De acuerdo con el expediente judicial, los trabajadores habrían retirado los materiales ' +
  'durante varios meses. La empresa detectó las pérdidas tras llamadas anónimas.</p>' +
  '<p>La jueza determinó enviar el caso a juicio y fijó la audiencia para el próximo mes. ' +
  'Los imputados habrían actuado en coordinación. La defensa podrá presentar descargos en la ' +
  'audiencia inicial, donde el Ministerio Público sostendrá los cargos formalmente.</p>';

const INPUT = {
  titulo: TITULO,
  resumen: 'La Fiscalía acusó a cinco trabajadores de Nuevo Carnic por el presunto robo de materiales valorados en C$1.2 millones.',
  contenido: BODY,
  categoria: 'Sucesos',
};

describe('TRACE — motor real MENI sobre Nuevo Carnic', () => {
  it('volcado completo de la decisión', async () => {
    const r = await guardarConMeni(INPUT as any, fakeDb, {
      skipEditorBrain: true,
      skipDuplicateCheck: true,
    });

    const trust = analyzeTrust({ titulo: TITULO, cuerpo: BODY, categoria: 'Sucesos' });
    const fs_ = detectFactualitySignals({ titulo: TITULO, resumen: INPUT.resumen, contenido: BODY, fuentesComplementarias: [] });
    const titleEval = evaluateRawTitle(TITULO);

    console.log('\n══════════ TRACE MENI — NUEVO CARNIC ══════════');
    console.log('TÍTULO:', JSON.stringify({
      needsInvestigation: titleEval.needsInvestigation,
      hasNewsVerb: titleEval.hasNewsVerb,
      missingData: titleEval.missingData,
      verdict: titleEval.verdict,
    }));
    console.log('\nTRUST:', JSON.stringify({
      factores: trust.factores,
      nivel: trust.nivel,
      riesgos: trust.riesgos.map(r => r.text ?? r.detail),
      provisionales: trust.provisionalesPresentadasComoHecho?.length ?? 0,
      atribuciones: trust.atribuciones.length,
      fuentes: trust.fuentes.length,
      requiereRevisionHumana: trust.requiereRevisionHumana,
    }, null, 1));
    console.log('\nFACTUALITY SIGNALS:', JSON.stringify(fs_.map(s => `${s.severity}:${s.code}`)));
    console.log('\nMENI:', JSON.stringify({
      scoreFinal: r.meni.scoreFinal,
      aprobado: r.meni.aprobado,
      recomendacion: r.meni.recomendacionEditorial,
      calificacion: r.meni.calificacion,
      blockingIssues: (r.meni.blockingIssues || []).map((i: any) => i.code || i.mensaje),
      warnings: (r.meni.warnings || []).map((w: any) => w.code || w.mensaje || w),
    }, null, 1));
    console.log('\nSUPERVISOR:', JSON.stringify({
      verdict: r.supervisor.verdict,
      resultingState: r.supervisor.resultingState,
      reason: r.supervisor.reason,
      issues: r.supervisor.issues.map(i => `${i.severity}[${i.domain}] ${i.problem}`),
    }, null, 1));
    console.log('\nVEREDICTO FINAL:', JSON.stringify({
      decision: r.meni.editorialVerdict?.decision,
      counts: r.meni.editorialVerdict?.counts,
      resumen: r.meni.editorialVerdict?.resumen,
      hallazgos: r.meni.editorialVerdict?.hallazgos.map(h => `${h.severity}[${h.code}] ${h.title}`),
    }, null, 1));
    console.log('═══════════════════════════════════════════════\n');
  });
});
