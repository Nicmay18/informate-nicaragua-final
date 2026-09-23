import { readFileSync, writeFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const WRITE = process.argv.includes('--write');
const log = [];

function fixContenido(html, titulo) {
  // "motocicleta" + repeticiones de cicleta(s)/ciclista(s) → colapsar a la
  // última variante. "motocicletacicletas"→"motocicletas",
  // "motocicletacicletaciclistas"→"motociclistas".
  let out = html.replace(/motocicleta((?:cicletas?|ciclistas?)+)/gi, (m, tail) => {
    const parts = tail.match(/cicletas?|ciclistas?/gi);
    const last = parts[parts.length - 1].toLowerCase();
    const rep = 'moto' + last;
    if (rep !== m) log.push({ antes: m, despues: rep });
    return rep;
  });
  // "personas personas" — duplicación mecánica demostrable
  out = out.replace(/\bpersonas\s+personas\b/gi, (m) => { log.push({ antes: m, despues: 'personas' }); return 'personas'; });
  return out;
}

const snap = await db.collection('noticias').get();
const changed = [];
for (const doc of snap.docs) {
  const d = doc.data();
  log.length = 0;
  const upd = {};
  for (const field of ['contenido', 'resumen', 'titulo']) {
    const orig = String(d[field] || '');
    const fixed = fixContenido(orig);
    if (fixed !== orig) upd[field] = fixed;
  }
  if (Object.keys(upd).length) {
    changed.push({ id: doc.id, titulo: d.titulo, campos: Object.keys(upd), cambios: [...log] });
    if (WRITE) await doc.ref.update(upd);
  }
}
console.log(`Notas corregibles: ${changed.length} (write=${WRITE})`);
for (const c of changed) console.log(`  ${c.id} | ${c.titulo} | ${c.cambios.length} cambios: ${c.cambios.slice(0,2).map(x=>x.antes+'→'+x.despues).join(', ')}`);
writeFileSync('.audit/typo-fixes.json', JSON.stringify(changed, null, 2));
