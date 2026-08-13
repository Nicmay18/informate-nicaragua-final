/**
 * Inspecciona el schema real de los documentos en Firestore para identificar
 * el campo canónico de provenance, perfil, categoría, etc.
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
let sa;
let pk = process.env.FIREBASE_PRIVATE_KEY;
sa = { projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk };
if (sa.privateKey && sa.privateKey.includes('\\n')) sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  const snap = await db.collection('noticias').limit(3).get();
  for (const doc of snap.docs) {
    const d = doc.data();
    console.log(`\n=== ${doc.id} ===`);
    console.log('Keys:', Object.keys(d).sort().join(', '));
    // Buscar campos relacionados con provenance, meni, profile
    const interesting = {};
    for (const k of Object.keys(d)) {
      if (/meni|provenance|profile|perfil|tier|score|aprob|nivel|calidad|cambios|categori/i.test(k)) {
        interesting[k] = typeof d[k] === 'object' ? `[obj: ${Array.isArray(d[k]) ? 'array('+d[k].length+')' : Object.keys(d[k]||{}).join('/')} ]` : d[k];
      }
    }
    console.log('Interesting fields:', JSON.stringify(interesting, null, 2));
  }

  // Contar campos de provenance en toda la colección
  const allSnap = await db.collection('noticias').get();
  const fieldCounts = {};
  for (const doc of allSnap.docs) {
    for (const k of Object.keys(doc.data())) {
      fieldCounts[k] = (fieldCounts[k] || 0) + 1;
    }
  }
  console.log('\n=== FIELD COUNTS (todos los docs) ===');
  const sorted = Object.entries(fieldCounts).sort((a,b) => b[1] - a[1]);
  for (const [k, c] of sorted) {
    if (/meni|provenance|profile|perfil|tier|score|aprob|nivel|calidad|cambios|categori/i.test(k)) {
      console.log(`  ${k}: ${c}/${allSnap.size}`);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
