#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  try {
    const sa = JSON.parse(readFileSync('./scripts/firebase-admin-key.json', 'utf8'));
    return getFirestore(initializeApp({ credential: cert(sa) }));
  } catch {}
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKeyRaw) {
    const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    return getFirestore(initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }));
  }
  throw new Error('Sin credenciales Firebase');
}

function contarPalabras(texto) {
  if (!texto) return 0;
  return texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
}

const MINIMO = 300;

const db = initFirebase();
const snap = await db.collection('noticias').where('estado', '==', 'publicado').get();
const todas = [];
snap.forEach(d => todas.push({ id: d.id, ...d.data() }));

const resultados = todas.map(n => {
  const palabrasContenido = contarPalabras(n.contenido || '');
  const palabrasResumen = contarPalabras(n.resumen || '');
  const total = palabrasContenido + palabrasResumen;
  return {
    titulo: n.titulo?.substring(0, 60),
    slug: n.slug,
    palabras: total,
    palabrasContenido,
    palabrasResumen,
    fecha: (typeof n.fecha === 'string' ? n.fecha : n.fecha?.toDate?.()?.toISOString() ?? '')?.substring(0, 10),
    categoria: n.categoria,
    ok: total >= MINIMO,
  };
}).sort((a, b) => a.palabras - b.palabras);

const cortas = resultados.filter(r => !r.ok);
const ok = resultados.filter(r => r.ok);

console.log('\n══════════════════════════════════════════════════════════');
console.log(`  AUDITORÍA DE LONGITUD — ${todas.length} noticias publicadas`);
console.log('══════════════════════════════════════════════════════════\n');

if (cortas.length > 0) {
  console.log(`❌ NOTICIAS CORTAS (< ${MINIMO} palabras): ${cortas.length}\n`);
  for (const r of cortas) {
    const bar = '█'.repeat(Math.floor(r.palabras / 15)) + '░'.repeat(Math.max(0, 20 - Math.floor(r.palabras / 15)));
    console.log(`  [${r.palabras.toString().padStart(3)} pal] ${bar} ${r.titulo}...`);
    console.log(`         Slug: ${r.slug} | ${r.fecha} | ${r.categoria}`);
  }
} else {
  console.log(`✅ No hay noticias cortas. Todas tienen ${MINIMO}+ palabras.\n`);
}

console.log(`\n✅ NOTICIAS OK (≥ ${MINIMO} palabras): ${ok.length}`);

const p = resultados.map(r => r.palabras);
const promedio = Math.round(p.reduce((a, b) => a + b, 0) / p.length);
const mediana = p[Math.floor(p.length / 2)];
const minimo = p[0];
const maximo = p[p.length - 1];

console.log('\n══ ESTADÍSTICAS ══');
console.log(`  Total publicadas : ${todas.length}`);
console.log(`  Promedio palabras: ${promedio}`);
console.log(`  Mediana          : ${mediana}`);
console.log(`  Mínimo           : ${minimo}`);
console.log(`  Máximo           : ${maximo}`);
console.log(`  Cortas (< ${MINIMO})  : ${cortas.length} (${Math.round(cortas.length / todas.length * 100)}%)`);
console.log(`  OK (≥ ${MINIMO})      : ${ok.length} (${Math.round(ok.length / todas.length * 100)}%)\n`);

process.exit(0);
