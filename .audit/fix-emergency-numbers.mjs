// Corrección quirúrgica de números de emergencia en noticias publicadas.
// ÚNICO cambio: elimina teléfonos fijos 505-2228-XXXX no verificados.
// Cruz Blanca y Cruz Roja Nicaragüense existen ambas — no se tocan.
// - Backup de cada doc a .audit/emergency-backup-<id>.json antes de escribir.
// Uso: node .audit/fix-emergency-numbers.mjs [--dry-run]
import { readFileSync, writeFileSync } from 'fs';

const DRY = process.argv.includes('--dry-run');

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({
  credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))),
}));

const fix = (html) => html
  .replace(/\s*o\s*505-2228-\d{4}\s*\((?:denuncias|ambulancias|emergencias|información)\)/g, '')
  .replace(/505-2228-\d{4}/g, '')
  .replace(/\(\s*\)/g, '');

const snap = await db.collection('noticias').where('publicado', '==', true).get();
let changed = 0;
for (const d of snap.docs) {
  const html = d.data().contenido || '';
  if (!/505-2228-\d{4}/.test(html)) continue;
  const fixed = fix(html);
  if (fixed === html) continue;
  const backupPath = `.audit/emergency-backup-${d.id}.json`;
  writeFileSync(backupPath, JSON.stringify({ id: d.id, slug: d.data().slug, contenido: html }, null, 2));
  if (!DRY) {
    await d.ref.update({
      contenido: fixed,
      fechaActualizacion: FieldValue.serverTimestamp(),
      'editorialCorrecciones.emergenciaFix': 'FIJOS_NO_VERIFICADOS',
    });
  }
  console.log(`${DRY ? '[dry] ' : ''}corregido: ${d.data().slug || d.id} (backup ${backupPath})`);
  changed++;
}
console.log(`\n${changed} artículos ${DRY ? 'por corregir' : 'corregidos'}`);
