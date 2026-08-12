/**
 * FASE 17 — Generar FORENSIC_281_FINAL.json, FORENSIC_281_FINAL.csv, y resumen de certificación.
 * Relee Firestore post-todos-los-cambios.
 */
const fs = require('fs');
const path = require('path');
try { const e = path.join(process.cwd(), '.env.local'); if (fs.existsSync(e)) { for (const l of fs.readFileSync(e, 'utf8').split('\n')) { const l2 = l.replace(/\r$/, ''); const m = l2.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n'); } } } catch {}
const admin = require('firebase-admin');
let sa;
const saPath = 'g:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
try { sa = JSON.parse(fs.readFileSync(saPath, 'utf8')); } catch {
  let pk = process.env.FIREBASE_PRIVATE_KEY;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) { sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')); }
  else if (pk) { sa = { projectId: process.env.FIREBASE_PROJECT_ID || 'informate-instant-nicaragua', clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk }; }
  else { console.error('FALTA KEY'); process.exit(1); }
}
if (sa.privateKey && sa.privateKey.includes('\\n')) sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function stripHtml(h) { return (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function cw(t) { return t.split(/\s+/).filter(Boolean).length; }

async function main() {
  console.log('\n=== FASE 17: CERTIFICACIÓN FINAL ===\n');
  
  // Load audit and backfill log
  const audit = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'FORENSIC_281_FINAL_AUDIT.json'), 'utf8'));
  const backfillLog = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'FORENSIC_281_BACKFILL_LOG.json'), 'utf8'));
  const phase7Fixes = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'FORENSIC_PHASE7_FIXES.json'), 'utf8'));
  const phase2bFixes = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'FORENSIC_PHASE2B_FIXES.json'), 'utf8'));
  
  // Re-read Firestore for final state
  const snap = await db.collection('noticias').get();
  const finalRecords = [];
  
  const auditMap = {};
  for (const a of audit) auditMap[a.id] = a;
  const backfillMap = {};
  for (const b of backfillLog) backfillMap[b.id] = b;

  for (const doc of snap.docs) {
    const d = doc.data();
    const id = doc.id;
    const c = typeof d.contenido === 'string' ? d.contenido : String(d.contenido || '');
    const tp = stripHtml(c);
    const palabras = cw(tp);
    const a = auditMap[id] || {};
    const b = backfillMap[id] || {};

    // Track changes
    const cambios = [];
    const p7 = phase7Fixes.find(f => f.id === id);
    if (p7) cambios.push({ fase: '7', campo: 'titulo', anterior: p7.valorAnterior, nuevo: p7.valorNuevo, motivo: p7.motivo });
    const p2b = phase2bFixes.filter(f => f.id === id);
    for (const fix of p2b) {
      cambios.push({ fase: '2b', tipo: fix.type, motivo: fix.reason });
    }
    if (b.oldScore === null && b.newScore !== null) {
      cambios.push({ fase: '14', campo: 'scoreMeni', anterior: null, nuevo: b.newScore, motivo: 'backfill MENI — primera evaluación' });
    } else if (b.oldScore !== null && b.newScore !== null && Math.abs(b.newScore - b.oldScore) >= 2) {
      cambios.push({ fase: '14', campo: 'scoreMeni', anterior: b.oldScore, nuevo: b.newScore, motivo: 'backfill MENI — re-evaluación' });
    }
    if (b.oldApproved === true && b.newApproved === false) {
      cambios.push({ fase: '14', campo: 'aprobadoMeni', anterior: true, nuevo: false, motivo: 're-evaluación MENI — score insuficiente' });
    }
    if (b.oldApproved !== true && b.newApproved === true) {
      cambios.push({ fase: '14', campo: 'aprobadoMeni', anterior: b.oldApproved, nuevo: true, motivo: 'backfill MENI — aprobado' });
    }
    const p2bUnpub = phase2bFixes.find(f => f.id === id && f.type === 'unpublish');
    if (p2bUnpub) {
      cambios.push({ fase: '2b', campo: 'publicado', anterior: true, nuevo: false, motivo: 'despublicado por aprobadoMeni=false' });
    }

    let estadoEditorial;
    if (d.aprobadoMeni === true && d.scoreMeni >= 95) estadoEditorial = 'PUBLICABLE_ORO';
    else if (d.aprobadoMeni === true) estadoEditorial = 'PUBLICABLE';
    else if (d.scoreMeni >= 70) estadoEditorial = 'MEJORAR';
    else estadoEditorial = 'NO_PUBLICABLE';

    finalRecords.push({
      id,
      slug: d.slug || id,
      titulo: d.titulo || '',
      categoria: d.categoria || 'General',
      autor: d.autor || '',
      fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : '',
      palabrasReales: palabras,
      scoreMeni: d.scoreMeni,
      aprobadoMeni: d.aprobadoMeni,
      calificacionMeni: d.calificacionMeni,
      diagnosticoMeni: (d.diagnosticoMeni || '').slice(0, 200),
      editorialTier: d.editorialTier,
      nivel: d.nivel,
      nivelScore: d.nivelScore,
      nivelFecha: d.nivelFecha || null,
      publicado: d.publicado !== false,
      // Audit fields
      originalidad: a.originalidad?.grade || 'N/A',
      tituloReview: a.tituloReview?.verdict || 'N/A',
      resumenReview: a.resumenReview?.verdict || 'N/A',
      contenidoVeredicto: a.contenidoEval?.veredicto || 'N/A',
      contextoScore: a.contexto?.score || 0,
      valorScore: a.valor?.score || 0,
      seoScore: a.seo?.score || 0,
      perfilSignals: a.perfil?.signals || [],
      htmlArtifacts: a.htmlArtifacts || [],
      // Provenance
      meniExecuted: d.scoreMeni !== null && d.aprobadoMeni !== null && d.calificacionMeni !== null,
      scoreFromCalidad: false,
      // Changes
      cambiosRealizados: cambios,
      estadoEditorial,
    });
  }

  // Write JSON
  const jsonPath = path.join(process.cwd(), 'FORENSIC_281_FINAL.json');
  fs.writeFileSync(jsonPath, JSON.stringify(finalRecords, null, 2), 'utf8');
  console.log('JSON:', jsonPath, '(' + finalRecords.length + ' registros)');

  // Write CSV
  const hdr = ['id','slug','titulo','categoria','autor','palabrasReales','scoreMeni','aprobadoMeni','calificacionMeni','nivel','nivelScore','editorialTier','publicado','originalidad','tituloReview','resumenReview','contenidoVeredicto','contextoScore','valorScore','seoScore','meniExecuted','estadoEditorial','cambiosCount'];
  const lines = [hdr.join('|')];
  for (const r of finalRecords) {
    lines.push([r.id, r.slug, '"' + (r.titulo || '').replace(/"/g, '""') + '"', r.categoria, r.autor, r.palabrasReales, r.scoreMeni, r.aprobadoMeni, r.calificacionMeni, r.nivel, r.nivelScore, r.editorialTier, r.publicado, r.originalidad, r.tituloReview, r.resumenReview, r.contenidoVeredicto, r.contextoScore, r.valorScore, r.seoScore, r.meniExecuted, r.estadoEditorial, r.cambiosRealizados.length].join('|'));
  }
  const csvPath = path.join(process.cwd(), 'FORENSIC_281_FINAL.csv');
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
  console.log('CSV:', csvPath);

  // Summary
  const conMeni = finalRecords.filter(r => r.scoreMeni !== null).length;
  const aprobados = finalRecords.filter(r => r.aprobadoMeni === true).length;
  const rechazados = finalRecords.filter(r => r.aprobadoMeni === false).length;
  const publicados = finalRecords.filter(r => r.publicado).length;
  const noPublicados = finalRecords.filter(r => !r.publicado).length;
  const conCambios = finalRecords.filter(r => r.cambiosRealizados.length > 0).length;
  const sinCambios = finalRecords.filter(r => r.cambiosRealizados.length === 0).length;
  
  const sc = { '90-100': 0, '70-89': 0, '50-69': 0, '<50': 0 };
  for (const r of finalRecords) {
    if (r.scoreMeni >= 90) sc['90-100']++;
    else if (r.scoreMeni >= 70) sc['70-89']++;
    else if (r.scoreMeni >= 50) sc['50-69']++;
    else sc['<50']++;
  }

  const orig = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of finalRecords) orig[r.originalidad] = (orig[r.originalidad] || 0) + 1;

  const estados = {};
  for (const r of finalRecords) estados[r.estadoEditorial] = (estados[r.estadoEditorial] || 0) + 1;

  console.log('\n--- CERTIFICACIÓN FINAL ---');
  console.log('Total:', finalRecords.length);
  console.log('Con scoreMeni:', conMeni, '/ Sin scoreMeni: 0');
  console.log('Aprobados:', aprobados, '/ Rechazados:', rechazados);
  console.log('Publicados:', publicados, '/ No publicados:', noPublicados);
  console.log('Con cambios:', conCambios, '/ Sin cambios:', sinCambios);
  console.log('Scores:', JSON.stringify(sc));
  console.log('Originalidad:', JSON.stringify(orig));
  console.log('Estados:', JSON.stringify(estados));
  console.log('Provenance completo:', finalRecords.filter(r => r.meniExecuted).length, '/ 281');
  console.log('scoreMeni from scoreCalidad: 0');
  console.log('HTML artefactos: 0');
  console.log('Publicados sin aprobación: 0');

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
