// Reversión selectiva de la fase 2: restaura SOLO titulo/resumen/contenido de los
// docs registrados en .audit/repair-afectado-p2-backup.json, y únicamente si el
// documento sigue igual que justo después del apply (shaDespues). Si el doc
// cambió después de la reparación, se omite para no borrar trabajo posterior.
// Uso: node scripts/rollback-afectado-p2.mjs          → simulación
//      node scripts/rollback-afectado-p2.mjs --apply  → restaurar
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const sha = (o) => createHash('sha256').update(JSON.stringify(o)).digest('hex');
const backup = JSON.parse(readFileSync('.audit/repair-afectado-p2-backup.json', 'utf8'));

const envText = (() => { try { return readFileSync('.env.local', 'utf8'); } catch { return readFileSync('.env.vercel-prod', 'utf8'); } })();
const env = Object.fromEntries(envText.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))) });
const db = getFirestore();

for (const b of backup.docs) {
  const snap = await db.collection('noticias').doc(b.id).get();
  if (!snap.exists) { console.log('NO-EXISTE', b.slug); continue; }
  const cur = snap.data();
  const now = sha({ t: cur.titulo, r: cur.resumen, c: cur.contenido });
  if (now !== b.shaDespues) { console.log('CONFLICTO (doc cambió post-reparación, rollback manual):', b.slug); continue; }
  console.log(`${APPLY ? 'restaurando' : 'restauraría'}: ${b.slug}`);
  if (APPLY) {
    const update = { titulo: b.valores.titulo, resumen: b.valores.resumen, contenido: b.valores.contenido };
    if (b.reparacionForenseAntes) update.reparacionForense = b.reparacionForenseAntes;
    else update['reparacionForense.fase2'] = null;
    update.requiresReevaluation = b.requiresReevaluationAntes;
    await db.collection('noticias').doc(b.id).update(update);
  }
}
console.log(APPLY ? 'Rollback aplicado.' : 'Simulación de rollback — nada escrito.');
process.exit(0);
