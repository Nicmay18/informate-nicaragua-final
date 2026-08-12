/**
 * FASE 2b — Fix post-backfill: despublicar 39 no aprobados + limpiar HTML en 3 artículos.
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

// Remove class attributes from HTML
function cleanHtml(html) {
  return html
    .replace(/\s*class="[^"]*"/gi, '')
    .replace(/\s*class='[^']*'/gi, '')
    .replace(/\s*style="[^"]*"/gi, '')
    .replace(/\s*style='[^']*'/gi, '')
    .replace(/\s*id="[^"]*"/gi, '')
    .replace(/\s*id='[^']*'/gi, '')
    .replace(/\s+>/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function main() {
  console.log('\n=== FASE 2b: FIX POST-BACKFILL ===\n');
  const snap = await db.collection('noticias').get();
  
  let unpublished = 0;
  let htmlCleaned = 0;
  const changes = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    const id = doc.id;
    const updates = {};
    let changed = false;

    // 1. Unpublish articles without MENI approval
    if (d.publicado !== false && d.aprobadoMeni !== true) {
      updates.publicado = false;
      changed = true;
      unpublished++;
      changes.push({ id, type: 'unpublish', reason: 'aprobadoMeni=false', titulo: d.titulo?.slice(0, 60) });
    }

    // 2. Clean HTML artifacts
    const contenidoStr = typeof d.contenido === 'string' ? d.contenido : String(d.contenido || '');
    const hasArtifacts = /<[^>]*\b(class|style|id)\s*=/i.test(contenidoStr) || /```/.test(contenidoStr);
    if (hasArtifacts) {
      const cleaned = cleanHtml(contenidoStr);
      if (cleaned !== contenidoStr) {
        updates.contenido = cleaned;
        updates.palabras = cw(stripHtml(cleaned));
        changed = true;
        htmlCleaned++;
        changes.push({ id, type: 'html_clean', reason: 'class/style/id attrs removed', titulo: d.titulo?.slice(0, 60) });
      }
    }

    if (changed) {
      await db.collection('noticias').doc(id).update(updates);
    }
  }

  console.log('Artículos despublicados:', unpublished);
  console.log('Artículos con HTML limpiado:', htmlCleaned);
  console.log('\nCambios:');
  for (const c of changes) {
    console.log(`  ${c.type} | ${c.id} | ${c.reason} | "${c.titulo}"`);
  }

  // Write change log
  const logPath = path.join(process.cwd(), 'FORENSIC_PHASE2B_FIXES.json');
  fs.writeFileSync(logPath, JSON.stringify(changes, null, 2), 'utf8');
  console.log('\nLog:', logPath);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
