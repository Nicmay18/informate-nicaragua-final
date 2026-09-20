/** Reemplazo quirúrgico en ceo-loop.ts: autonomía verificada por evidencia.
 *  Índices calculados sobre el source ORIGINAL; splice de atrás hacia adelante. */
const fs = require('fs');
const p = 'lib/nios/ceo-loop.ts';
const src = fs.readFileSync(p, 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';

const i1 = src.indexOf('interface AutonomyInput {');
const i2 = src.indexOf('export async function runCEOLoop');
const j1 = src.indexOf('  // MEMORY');
const j2 = src.indexOf('  const record: CEOLoopRecord = {');
if (i1 < 0 || i2 < 0 || j1 < 0 || j2 < 0) { console.error('marker missing', { i1, i2, j1, j2 }); process.exit(1); }
if (!(i1 < i2 && i2 < j1 && j1 < j2)) { console.error('bad order', { i1, i2, j1, j2 }); process.exit(1); }

const newAutonomy = `interface AutonomyVerification {
  score: number;
  max: number;
  report: Record<string, AutonomyStageStatus>;
  evidence: Record<string, string>;
}

function cronComponentForTrigger(trigger: string): string | null {
  const map: Record<string, string> = {
    'cron/nios-collect': 'cron/api/cron/nios-collect',
    'cron/nios-ceo-loop': 'cron/api/cron/nios-ceo-loop',
    'cron/supervisor-watch': 'cron/api/cron/supervisor-watch',
  };
  if (map[trigger]) return map[trigger];
  if (trigger.startsWith('/api/cron/')) return \`cron\${trigger}\`;
  return null;
}

/**
 * Verificación independiente de autonomía.
 * Un estado VERIFIED depende de evidencia observable desde fuera del
 * componente evaluado: el registro persistido se relee (read-back), el
 * snapshot lo escribió el pipeline y el heartbeat lo escribe la ruta cron.
 * Si la evidencia no existe, el estado es SIN_EVIDENCIA — nunca se infiere
 * del auto-reporte del propio loop.
 */
async function verifyAutonomyEvidence(
  db: Firestore,
  ctx: { recordId: string | null; observatory: CeoObservatoryResult; trigger: string },
): Promise<AutonomyVerification> {
  const report: Record<string, AutonomyStageStatus> = {};
  const evidence: Record<string, string> = {};
  const set = (stage: string, status: AutonomyStageStatus, why: string) => {
    report[stage] = status;
    evidence[stage] = why;
  };

  // Persistencia: read-back del registro (fuente externa de verdad)
  let persisted: CEOLoopRecord | null = null;
  if (ctx.recordId) {
    try {
      const doc = await db.collection('nios_memory').doc(ctx.recordId).get();
      if (doc.exists) persisted = doc.data() as CEOLoopRecord;
    } catch (err) {
      logger.error('[ceo-loop] verifyAutonomy: read-back de memoria falló:', err);
    }
  }
  set(
    'MEMORY',
    persisted ? 'VERIFIED' : 'SIN_EVIDENCIA',
    persisted
      ? \`registro \${ctx.recordId} legible en nios_memory\`
      : 'registro del ciclo no encontrado al releer nios_memory',
  );

  // OBSERVE: snapshot persistido por el pipeline (no por este loop)
  const snapDate = ctx.observatory.snapshotDate;
  if (!snapDate) {
    set('OBSERVE', 'SIN_EVIDENCIA', 'observatory no produjo snapshotDate');
  } else {
    try {
      const doc = await db.collection('nios_daily_snapshots').doc(snapDate).get();
      set(
        'OBSERVE',
        doc.exists ? 'VERIFIED' : 'SIN_EVIDENCIA',
        doc.exists
          ? \`snapshot \${snapDate} existe en nios_daily_snapshots\`
          : \`snapshot \${snapDate} no existe en nios_daily_snapshots\`,
      );
    } catch (err) {
      logger.error('[ceo-loop] verifyAutonomy: lectura de snapshot falló:', err);
      set('OBSERVE', 'SIN_EVIDENCIA', 'error leyendo nios_daily_snapshots');
    }
  }

  // DIAGNOSE / DECIDE / EXECUTE / VERIFY / LEARN: leídos del documento
  // persistido, no de los arrays en memoria del propio loop.
  if (persisted) {
    set('DIAGNOSE', persisted.diagnoses.length > 0 ? 'VERIFIED' : 'SIN_EVIDENCIA',
      \`\${persisted.diagnoses.length} diagnósticos persistidos\`);
    set('DECIDE', persisted.decisions.length > 0 ? 'VERIFIED' : 'SIN_EVIDENCIA',
      \`\${persisted.decisions.length} decisiones persistidas\`);
    const verifiedExec = persisted.executions.filter((e) => e.status === 'VERIFIED').length;
    set('EXECUTE',
      persisted.executions.length === 0 ? 'SIN_EVIDENCIA' : verifiedExec > 0 ? 'VERIFIED' : 'PARCIAL',
      \`\${persisted.executions.length} ejecuciones persistidas, \${verifiedExec} con estado VERIFIED\`);
    const confirmed = persisted.verifications.filter((v) => v.verified).length;
    set('VERIFY',
      persisted.verifications.length === 0 ? 'SIN_EVIDENCIA' : confirmed > 0 ? 'VERIFIED' : 'PARCIAL',
      \`\${persisted.verifications.length} verificaciones persistidas, \${confirmed} confirmadas\`);
    set('LEARN', persisted.learnings.length > 0 ? 'VERIFIED' : 'SIN_EVIDENCIA',
      \`\${persisted.learnings.length} aprendizajes persistidos\`);
  } else {
    for (const stage of ['DIAGNOSE', 'DECIDE', 'EXECUTE', 'VERIFY', 'LEARN']) {
      set(stage, 'SIN_EVIDENCIA', 'registro del ciclo no persistido');
    }
  }

  // CRON: heartbeat escrito por la ruta cron (artefacto externo al loop)
  const component = cronComponentForTrigger(ctx.trigger);
  if (!component) {
    set('CRON', 'SIN_EVIDENCIA', \`trigger "\${ctx.trigger}" sin heartbeat asociado\`);
  } else {
    try {
      const snap = await db.collection('depto_heartbeat').where('component', '==', component).limit(1).get();
      const hb = snap.empty ? null : (snap.docs[0].data() as { lastRunAt?: string });
      if (!hb?.lastRunAt) {
        set('CRON', 'SIN_EVIDENCIA', \`sin heartbeat para \${component}\`);
      } else {
        const ageH = (Date.now() - Date.parse(hb.lastRunAt)) / 36e5;
        set('CRON', ageH <= 30 ? 'VERIFIED' : 'PARCIAL',
          \`heartbeat \${component} lastRunAt=\${hb.lastRunAt} (~\${Math.round(ageH)}h)\`);
      }
    } catch (err) {
      logger.error('[ceo-loop] verifyAutonomy: lectura de heartbeat falló:', err);
      set('CRON', 'SIN_EVIDENCIA', 'error leyendo depto_heartbeat');
    }
  }

  const score = Object.values(report).filter((v) => v === 'VERIFIED').length;
  return { score, max: 8, report, evidence };
}

`.split('\n').join(EOL);

const newMemory = `  // Persistir → read-back → verificación independiente de autonomía.
  // El score ya no se auto-declara: cada etapa se verifica leyendo
  // evidencia persistida fuera del propio componente.
  let id = '';
  try {
    id = await recordCeoLoopRun({ ...loopRecord, autonomyScore: 0 });
  } catch (err) {
    logger.error('[ceo-loop] recordCeoLoopRun failed:', err);
  }

  const autonomy = await verifyAutonomyEvidence(db, {
    recordId: id || null,
    observatory,
    trigger,
  });

  if (id) {
    try {
      await db.collection('nios_memory').doc(id).update({
        autonomyScore: autonomy.score,
        autonomyReport: autonomy.report,
        autonomyEvidence: autonomy.evidence,
      });
    } catch (err) {
      logger.error('[ceo-loop] persist autonomy evidence failed:', err);
    }
  }

`.split('\n').join(EOL);

// Splice de atrás hacia adelante para preservar índices
let out = src.slice(0, j1) + newMemory + src.slice(j2);
out = out.slice(0, i1) + newAutonomy + out.slice(i2);
fs.writeFileSync(p, out);
console.log('OK: ceo-loop.ts actualizado');
