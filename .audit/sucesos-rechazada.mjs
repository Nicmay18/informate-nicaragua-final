// Solo lectura: notas de Sucesos recientes NO publicadas + rastro de decisión.
import { readFileSync, writeFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))) }));

const toDate = (v) => v?.toDate?.() || (v ? new Date(v) : null);
const since = Date.now() - 4 * 864e5;
const snap = await db.collection('noticias').get();
const rows = [];
for (const d of snap.docs) {
  const x = d.data();
  const created = toDate(x.createdAt) || toDate(x.fechaCreacion) || toDate(x.fecha) || toDate(x.publishedAt);
  const upd = toDate(x.fechaActualizacion) || toDate(x.updatedAt);
  const recent = (created && created.getTime() > since) || (upd && upd.getTime() > since);
  if (!recent) continue;
  rows.push({
    id: d.id, slug: x.slug, categoria: x.categoria, estado: x.estado, publicado: x.publicado,
    aprobadoMeni: x.aprobadoMeni, scoreMeni: x.scoreMeni ?? x.meniScore ?? x.score,
    veredicto: x.veredictoMeni ?? x.veredicto ?? x.meni?.veredicto,
    supervisorDecision: x.supervisorDecision, supervisorApproved: x.supervisorApproved,
    qualityGate: x.qualityGate?.status ?? x.qualityGate?.decision ?? x.qualityGateStatus,
    confianza: x.confianza?.nivel ?? x.confianza, requiereRevisionHumana: x.requiereRevisionHumana,
    factualitySignals: (x.factualitySignals || x.senalesFactuales || []).map(s => s.code || s.tipo || s),
    contentIntegrity: x.contentIntegrity?.defects?.map(d => d.code) || x.defectosMecanicos,
    mutationLog: (x.mutationLog || []).slice(-3).map(m => `${m.kind || m.type}:${m.result || m.decision || ''}@${m.at || m.timestamp || ''}`),
    created: created?.toISOString(), updated: upd?.toISOString(),
    titulo: (x.titulo || '').slice(0, 90),
  });
}
rows.sort((a, b) => (b.updated || b.created || '').localeCompare(a.updated || a.created || ''));
console.log(`Recientes (4d): ${rows.length}`);
for (const r of rows) {
  const flag = r.publicado ? '   ' : '>>>';
  console.log(`${flag} ${r.categoria} | ${r.estado} pub=${r.publicado} meni=${r.aprobadoMeni} score=${r.scoreMeni} ver=${r.veredicto} sup=${r.supervisorDecision}/${r.supervisorApproved} qg=${r.qualityGate} conf=${r.confianza} rev=${r.requiereRevisionHumana}`);
  console.log(`      ${r.slug}  [${r.created}]`);
  if (r.factualitySignals?.length) console.log(`      factual: ${r.factualitySignals.join(',')}`);
  if (r.contentIntegrity?.length) console.log(`      integrity: ${r.contentIntegrity.join(',')}`);
  if (r.mutationLog?.length) console.log(`      mutations: ${r.mutationLog.join(' | ')}`);
}
writeFileSync('.audit/recientes-4d.json', JSON.stringify(rows, null, 2));

// rastro en audit trail / telemetría de rechazos
for (const col of ['nios_audit_trail', 'meni_decisions', 'editorial_decisions', 'publish_attempts', 'meni_predictions']) {
  try {
    const s = await db.collection(col).orderBy('createdAt', 'desc').limit(5).get().catch(() => db.collection(col).limit(5).get());
    console.log(`\n[${col}] docs muestra: ${s.size}`);
    for (const d of s.docs) { const x = d.data(); console.log('   ', d.id, JSON.stringify(x).slice(0, 220)); }
  } catch (e) { console.log(`[${col}] n/a: ${e.message.slice(0, 80)}`); }
}
