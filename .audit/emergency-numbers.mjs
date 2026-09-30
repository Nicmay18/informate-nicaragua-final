// Auditoría de solo lectura: artículos publicados con números de emergencia
// incorrectos/no verificados para Nicaragua.
// Correctos: Policía 118, Bomberos 115, Cruz Blanca Nicaragüense 128.
// Erróneos: 911 como número general (solo *911 desde celular llega a bomberos),
// teléfonos fijos 505-2228-XXXX sin verificar, "Cruz Roja" como ambulancia.
// Uso: node .audit/emergency-numbers.mjs
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({
  credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))),
}));

const snap = await db.collection('noticias').where('publicado', '==', true).get();
let flagged = 0;
for (const d of snap.docs) {
  const x = d.data();
  const html = x.contenido || '';
  const flags = [];
  if (/\b911\b/.test(html) && !/\*911/.test(html)) flags.push('911');
  if (/505-2228-2000|2228-4848|2228-3883/.test(html)) flags.push('FIJO_NO_VERIFICADO');
  if (flags.length) {
    flagged++;
    console.log(`${x.slug || d.id}  [${flags.join(',')}]`);
  }
}
console.log(`\nTotal publicados: ${snap.size} | Con errores: ${flagged}`);
