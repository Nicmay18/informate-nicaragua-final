#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').where('estado', '==', 'publicado').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  const problemas = [];
  const palabrasIA = ['es importante destacar', 'en conclusión', 'en resumen', 'es vital', 'resulta fundamental', 'en el contexto de', 'es indiscutible', 'no cabe duda'];
  const seccionesIA = ['Prevención', 'normativa', 'estadísticas', 'indicadores', 'recomendaciones', 'marco jurídico', 'regulaciones', 'análisis normativo'];
  const fechasFuturas = /2026|2027|2028/;

  for (const n of docs) {
    const issues = [];
    const contenido = (n.contenido || '').toLowerCase();
    const titulo = (n.titulo || '').toLowerCase();

    if (fechasFuturas.test(n.contenido || '')) issues.push('FECHA_FUTURA');
    if (palabrasIA.some(p => contenido.includes(p))) issues.push('FRASE_IA');
    if (seccionesIA.some(s => contenido.includes(s.toLowerCase()))) issues.push('SECCION_IA');
    if ((n.contenido || '').length < 500) issues.push('CONTENIDO_CORTO');
    if (!n.autor) issues.push('SIN_AUTOR');

    if (issues.length > 0) {
      problemas.push({
        id: n.id,
        titulo: n.titulo || '(sin título)',
        fecha: n.fecha?.toDate ? n.fecha.toDate().toISOString().slice(0,10) : n.fecha,
        issues: issues.join(', '),
        slug: n.slug || ''
      });
    }
  }

  console.log(`\n=== NOTICIAS CON PROBLEMAS (${problemas.length} de ${docs.length}) ===\n`);
  if (problemas.length === 0) {
    console.log('TODAS LAS NOTICIAS ESTAN LIMPIAS');
  } else {
    problemas.forEach((p, i) => {
      console.log(`${i+1}. ${p.titulo}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Problemas: ${p.issues}`);
      console.log(`   Slug: ${p.slug}`);
      console.log('');
    });
  }

  // También mostrar TODAS las noticias para que el usuario vea qué hay
  console.log(`\n=== LISTA COMPLETA DE ${docs.length} NOTICIAS PUBLICADAS ===\n`);
  docs.forEach((n, i) => {
    console.log(`${i+1}. ${n.titulo || '(sin título)'} [${n.categoria || '?'}]`);
  });

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
