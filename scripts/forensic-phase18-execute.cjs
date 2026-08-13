/**
 * FASE 18 — EJECUCIÓN P0+P1 (autorizada por usuario).
 *
 * 1. BACKUP: snapshot completo pre-escritura → FORENSIC_PHASE18_BEFORE.json
 * 2. P0: Bloquear 39 rechazados (estado: "publicado" → "borrador")
 * 3. P1a: Eliminar campo `score` residual en 45 docs
 * 4. P1b: Unificar `publicado` = (estado==='publicado' && aprobadoMeni===true), eliminar `aprobado`
 * 5. VERIFICACIÓN: releer y confirmar
 * 6. LOG: FORENSIC_PHASE18_EXECUTION.json con provenance por escrito
 *
 * Cada escritura registra: fase, timestamp, acción, antes, después, motivo, actor.
 */
const fs = require('fs');
const path = require('path');
try {
  const e = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(e)) {
    for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
      const l2 = l.replace(/\r$/, '');
      const m = l2.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    }
  }
} catch {}
const admin = require('firebase-admin');
const sa = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const FASE = 'PHASE18';
const ACTOR = 'forensic-phase18-script';
const MOTIVO_P0 = 'Bloqueo de artículos rechazados por MENI (aprobadoMeni=false) que estaban visibles en producción';
const MOTIVO_P1A = 'Eliminación de campo residual `score` (valor 95 fijo) distinto de scoreMeni';
const MOTIVO_P1B = 'Unificación de campos redundantes: publicado derivado de estado+aprobadoMeni, eliminación de aprobado';

async function main() {
  console.log('=== FASE 18 — EJECUCIÓN P0+P1 ===\n');
  const ts0 = new Date().toISOString();

  // 1. BACKUP completo
  console.log('1. Backup completo pre-escritura...');
  const snap = await db.collection('noticias').get();
  const backup = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    backup.push({
      id: doc.id,
      estado: d.estado ?? null,
      publicado: d.publicado ?? null,
      aprobado: d.aprobado ?? null,
      aprobadoMeni: d.aprobadoMeni ?? null,
      scoreMeni: d.scoreMeni ?? null,
      score: d.score ?? null,
      nivel: d.nivel ?? null,
      nivelScore: d.nivelScore ?? null,
      titulo: d.titulo ?? null,
    });
  }
  fs.writeFileSync('FORENSIC_PHASE18_BEFORE.json', JSON.stringify({ timestamp: ts0, total: backup.length, articles: backup }, null, 2));
  console.log(`   ✓ ${backup.length} artículos respaldados`);

  // Identificar objetivos
  const bloquearIds = backup.filter(a => a.aprobadoMeni === false && a.estado === 'publicado').map(a => a.id);
  const scoreIds = backup.filter(a => a.score !== undefined && a.score !== null).map(a => a.id);
  const unificarIds = backup.map(a => a.id); // todos
  console.log(`   - Bloquear (P0): ${bloquearIds.length} artículos`);
  console.log(`   - Eliminar score (P1a): ${scoreIds.length} artículos`);
  console.log(`   - Unificar publicado/aprobado (P1b): ${unificarIds.length} artículos`);

  const executionLog = [];
  let writesP0 = 0, writesP1a = 0, writesP1b = 0, errors = 0;

  // 2. P0: Bloquear 39
  console.log('\n2. P0: Bloqueando 39 rechazados...');
  let batch = db.batch();
  let batchCount = 0;
  const BATCH_LIMIT = 400;
  for (const id of bloquearIds) {
    const ref = db.collection('noticias').doc(id);
    batch.update(ref, {
      estado: 'borrador',
      cambiosRealizados: FieldValue.arrayUnion({
        fase: FASE,
        fecha: ts0,
        accion: 'BLOQUEO_P0',
        campo: 'estado',
        antes: 'publicado',
        despues: 'borrador',
        motivo: MOTIVO_P0,
        actor: ACTOR,
      }),
    });
    writesP0++;
    batchCount++;
    executionLog.push({ id, fase: FASE, accion: 'BLOQUEO_P0', campo: 'estado', antes: 'publicado', despues: 'borrador', motivo: MOTIVO_P0 });
    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
      console.log(`   commit @ ${writesP0}`);
    }
  }
  if (batchCount > 0) { await batch.commit(); console.log(`   commit final P0 @ ${writesP0}`); }

  // 3. P1a: Eliminar campo score
  console.log('\n3. P1a: Eliminando campo `score` residual...');
  batch = db.batch();
  batchCount = 0;
  for (const id of scoreIds) {
    const ref = db.collection('noticias').doc(id);
    batch.update(ref, {
      score: FieldValue.delete(),
      cambiosRealizados: FieldValue.arrayUnion({
        fase: FASE,
        fecha: ts0,
        accion: 'LIMPIEZA_P1A',
        campo: 'score',
        antes: 95,
        despues: null,
        motivo: MOTIVO_P1A,
        actor: ACTOR,
      }),
    });
    writesP1a++;
    batchCount++;
    executionLog.push({ id, fase: FASE, accion: 'LIMPIEZA_P1A', campo: 'score', antes: 95, despues: null, motivo: MOTIVO_P1A });
    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
      console.log(`   commit @ ${writesP1a}`);
    }
  }
  if (batchCount > 0) { await batch.commit(); console.log(`   commit final P1a @ ${writesP1a}`); }

  // 4. P1b: Unificar publicado + eliminar aprobado
  console.log('\n4. P1b: Unificando publicado/aprobado en 286 docs...');
  batch = db.batch();
  batchCount = 0;
  for (const a of backup) {
    const ref = db.collection('noticias').doc(a.id);
    // publicado = true solo si estado era publicado Y aprobadoMeni true
    // PERO los 39 ya fueron cambiados a borrador en P0. Para los demás, estado sigue 'publicado'.
    // Necesitamos el estado ANTES del P0 para calcular correctamente.
    const estadoOriginal = a.estado;
    const aprobadoMeniOriginal = a.aprobadoMeni;
    const nuevoPublicado = (estadoOriginal === 'publicado' && aprobadoMeniOriginal === true);
    batch.update(ref, {
      publicado: nuevoPublicado,
      aprobado: FieldValue.delete(),
      cambiosRealizados: FieldValue.arrayUnion({
        fase: FASE,
        fecha: ts0,
        accion: 'UNIFICACION_P1B',
        campo: 'publicado+aprobado',
        antes: { publicado: a.publicado, aprobado: a.aprobado },
        despues: { publicado: nuevoPublicado, aprobado: null },
        motivo: MOTIVO_P1B,
        actor: ACTOR,
      }),
    });
    writesP1b++;
    batchCount++;
    executionLog.push({ id: a.id, fase: FASE, accion: 'UNIFICACION_P1B', campo: 'publicado+aprobado', antes: { publicado: a.publicado, aprobado: a.aprobado }, despues: { publicado: nuevoPublicado, aprobado: null }, motivo: MOTIVO_P1B });
    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
      console.log(`   commit @ ${writesP1b}`);
    }
  }
  if (batchCount > 0) { await batch.commit(); console.log(`   commit final P1b @ ${writesP1b}`); }

  // 5. VERIFICACIÓN
  console.log('\n5. Verificación post-escritura...');
  const snap2 = await db.collection('noticias').get();
  let estadoBorrador = 0, estadoPublicado = 0, conScore = 0, conAprobado = 0, publicadoTrue = 0, publicadoFalse = 0;
  for (const doc of snap2.docs) {
    const d = doc.data();
    if (d.estado === 'borrador') estadoBorrador++;
    if (d.estado === 'publicado') estadoPublicado++;
    if (d.score !== undefined && d.score !== null) conScore++;
    if (d.aprobado !== undefined && d.aprobado !== null) conAprobado++;
    if (d.publicado === true) publicadoTrue++;
    if (d.publicado === false) publicadoFalse++;
  }
  console.log(`   estado=publicado: ${estadoPublicado} (antes: 286)`);
  console.log(`   estado=borrador: ${estadoBorrador} (antes: 0)`);
  console.log(`   con campo score: ${conScore} (antes: 45)`);
  console.log(`   con campo aprobado: ${conAprobado} (antes: 167)`);
  console.log(`   publicado=true: ${publicadoTrue} (antes: 133)`);
  console.log(`   publicado=false: ${publicadoFalse} (antes: 41)`);

  // 6. LOG
  const logPath = 'FORENSIC_PHASE18_EXECUTION.json';
  fs.writeFileSync(logPath, JSON.stringify({
    fase: FASE,
    timestamp: ts0,
    actor: ACTOR,
    operaciones: [
      { nombre: 'P0_BLOQUEO', objetivo: bloquearIds.length, writes: writesP0, motivo: MOTIVO_P0 },
      { nombre: 'P1A_LIMPIEZA_SCORE', objetivo: scoreIds.length, writes: writesP1a, motivo: MOTIVO_P1A },
      { nombre: 'P1B_UNIFICACION', objetivo: unificarIds.length, writes: writesP1b, motivo: MOTIVO_P1B },
    ],
    verificacion: {
      estadoPublicado, estadoBorrador, conScore, conAprobado, publicadoTrue, publicadoFalse,
    },
    bloquearIds, scoreIds,
    executionLog,
  }, null, 2));
  console.log(`\n✓ Log: ${logPath}`);
  console.log(`\n=== RESUMEN ===`);
  console.log(`P0: ${writesP0} writes (bloqueo)`);
  console.log(`P1a: ${writesP1a} writes (score delete)`);
  console.log(`P1b: ${writesP1b} writes (unificación)`);
  console.log(`Total writes: ${writesP0 + writesP1a + writesP1b}`);
  console.log(`Errores: ${errors}`);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
