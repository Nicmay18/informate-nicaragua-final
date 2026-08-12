/**
 * FASE 0 — Snapshot/backup inmutable de los 281 articulos.
 * Genera FORENSIC_281_BEFORE.json y FORENSIC_281_BEFORE.csv
 * NO modifica Firestore.
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
  console.log('\n=== FASE 0: BACKUP INMUTABLE ===\n');
  const snap = await db.collection('noticias').get();
  console.log('Total:', snap.size);
  const records = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    const c = typeof d.contenido === 'string' ? d.contenido : String(d.contenido || '');
    const tp = stripHtml(c);
    const pr = cw(tp);
    const ps = d.palabras || 0;
    const artifacts = [];
    if (/<[^>]*\bid\s*=/i.test(c)) artifacts.push('id');
    if (/<[^>]*\bstyle\s*=/i.test(c)) artifacts.push('style');
    if (/<[^>]*\bclass\s*=/i.test(c)) artifacts.push('class');
    if (/<[^>]*\bdata-/i.test(c)) artifacts.push('data');
    if (/```/.test(c)) artifacts.push('codefence');
    if (/<script/i.test(c)) artifacts.push('script');
    if (/<iframe/i.test(c)) artifacts.push('iframe');
    const hm = d.scoreMeni !== undefined && d.scoreMeni !== null;
    records.push({
      id: doc.id, slug: d.slug || doc.id, titulo: d.titulo || '', resumen: d.resumen || '',
      categoria: d.categoria || 'General', autor: d.autor || '',
      fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : (typeof d.fecha === 'string' ? d.fecha : ''),
      publicado: d.publicado !== false, destacada: !!d.destacada, departamento: d.departamento || '',
      keywords: d.keywords || '', tags: d.tags || [], imagen: d.imagen || '', vistas: d.vistas || 0,
      palabrasStored: ps, palabrasReales: pr, contenidoLength: c.length,
      scoreMeni: d.scoreMeni ?? null, aprobadoMeni: d.aprobadoMeni ?? null,
      calificacionMeni: d.calificacionMeni ?? null, diagnosticoMeni: d.diagnosticoMeni ?? null,
      nivel: d.nivel ?? null, nivelScore: d.nivelScore ?? null, nivelFecha: d.nivelFecha || null,
      editorialTier: d.editorialTier ?? null, editorialReason: d.editorialReason ?? null,
      recomendacionesMeni: d.recomendacionesMeni || [],
      profile_used: d.profile_used || null, profile_confidence: d.profile_confidence ?? null,
      articleHash: d.articleHash || null, evaluationTimestamp: d.evaluationTimestamp || null,
      puntosClave: d.puntosClave || [], fuente: d.fuente || '',
      fuentesComplementarias: d.fuentesComplementarias || [], related_links: d.related_links || [],
      autorFoto: d.autorFoto || '', autorRol: d.autorRol ?? null, premium: d.premium ?? null,
      noindex: d.noindex ?? false, distribuida: d.distribuida ?? false,
      hasMeni: hm, htmlArtifacts: artifacts, thinContent: pr < 400, contenido: c,
    });
  }
  const jsonPath = path.join(process.cwd(), 'FORENSIC_281_BEFORE.json');
  fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf8');
  console.log('JSON:', jsonPath, '(' + records.length + ' registros)');
  const hdr = ['id','slug','titulo','categoria','autor','fecha','palabrasReales','palabrasStored','scoreMeni','aprobadoMeni','calificacionMeni','nivel','nivelScore','editorialTier','thinContent','hasMeni','htmlArtifacts','publicado','vistas'];
  const lines = [hdr.join('|')];
  for (const r of records) {
    lines.push([r.id, r.slug, '"' + (r.titulo || '').replace(/"/g, '""') + '"', r.categoria, r.autor, r.fecha, r.palabrasReales, r.palabrasStored, r.scoreMeni ?? '', r.aprobadoMeni ?? '', r.calificacionMeni ?? '', r.nivel ?? '', r.nivelScore ?? '', r.editorialTier ?? '', r.thinContent, r.hasMeni, r.htmlArtifacts.join(';'), r.publicado, r.vistas].join('|'));
  }
  const csvPath = path.join(process.cwd(), 'FORENSIC_281_BEFORE.csv');
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
  console.log('CSV:', csvPath);
  // Summary
  const conMeni = records.filter(r => r.hasMeni).length;
  const sinMeni = records.length - conMeni;
  const thin = records.filter(r => r.thinContent).length;
  const withArtifacts = records.filter(r => r.htmlArtifacts.length > 0).length;
  console.log('\n--- RESUMEN BACKUP ---');
  console.log('Total:', records.length);
  console.log('CON MENI:', conMeni, '| SIN MENI:', sinMeni);
  console.log('Thin (<400 palabras):', thin);
  console.log('Con artefactos HTML:', withArtifacts);
  const artTypes = {};
  for (const r of records) for (const a of r.htmlArtifacts) artTypes[a] = (artTypes[a] || 0) + 1;
  console.log('Tipos de artefactos:', JSON.stringify(artTypes));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
