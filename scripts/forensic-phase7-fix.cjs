/**
 * FASE 7 — Reparación editorial justificada y trazable.
 * Corrige títulos que terminan con punto (estándar SEO: títulos no llevan punto final).
 * NO modifica contenido editorial. NO modifica thresholds.
 * Registra cada cambio con trazabilidad completa.
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

async function main() {
  console.log('\n=== FASE 7: REPARACIÓN EDITORIAL JUSTIFICADA ===\n');
  const snap = await db.collection('noticias').get();
  
  const changes = [];
  let fixed = 0;

  for (const doc of snap.docs) {
    const d = doc.data();
    const id = doc.id;
    const titulo = d.titulo || '';
    
    // Fix: titles ending with period
    if (/\.$/.test(titulo.trim())) {
      const newTitulo = titulo.trim().replace(/\.$/, '');
      await db.collection('noticias').doc(id).update({ titulo: newTitulo });
      fixed++;
      changes.push({
        id,
        campo: 'titulo',
        valorAnterior: titulo,
        valorNuevo: newTitulo,
        motivo: 'titulo_termina_con_punto — estándar SEO: títulos no llevan punto final',
        editor: 'forensic-audit-fase7',
        meniAntes: d.scoreMeni,
        meniDespues: 'PENDIENTE_REEVALUACION',
        timestamp: new Date().toISOString(),
      });
      console.log(`  FIX: ${id} | "${titulo}" → "${newTitulo}"`);
    }
  }

  console.log('\nTotal títulos corregidos:', fixed);
  
  const logPath = path.join(process.cwd(), 'FORENSIC_PHASE7_FIXES.json');
  fs.writeFileSync(logPath, JSON.stringify(changes, null, 2), 'utf8');
  console.log('Log:', logPath);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
