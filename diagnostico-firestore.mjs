/**
 * Diagnóstico completo de Firestore:
 * 1. Lista TODAS las noticias con conteo de palabras real
 * 2. Identifica notas cortas (100-200 palabras) que escaparon al auditor
 * 3. Verifica qué notas NO tienen campo scoreCalidad
 * 4. Reporta estado de guardado posible
 *
 * Ejecutar: node diagnostico-firestore.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Cargar service account desde archivo o env
let serviceAccount;
try {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString());
  } else {
    const path = resolve(process.cwd(), 'serviceAccount.json');
    serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
  }
} catch (e) {
  console.error('❌ No se pudo cargar service account. Setea FIREBASE_SERVICE_ACCOUNT_BASE64 o crea serviceAccount.json');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function contarPalabras(texto) {
  if (!texto) return 0;
  const plain = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.split(/\s+/).filter(Boolean).length;
}

async function diagnosticar() {
  console.log('🔍 Escaneando noticias en Firestore...\n');

  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  const noticias = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const palabras = contarPalabras(d.contenido || '');
    noticias.push({
      id: doc.id,
      slug: d.slug || 'sin-slug',
      titulo: (d.titulo || 'Sin título').slice(0, 70),
      palabras,
      scoreCalidad: d.scoreCalidad ?? null,
      categoria: d.categoria || 'General',
      fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString().slice(0, 10) : 'unknown',
      publicado: d.publicado !== false,
    });
  }

  // Clasificación
  const cortas = noticias.filter(n => n.palabras >= 100 && n.palabras <= 200);
  const muyCortas = noticias.filter(n => n.palabras < 100);
  const sinScore = noticias.filter(n => n.scoreCalidad === null);
  const buenas = noticias.filter(n => n.palabras >= 500);
  const regulares = noticias.filter(n => n.palabras >= 250 && n.palabras < 500);

  console.log(`📊 TOTAL DE NOTICIAS: ${noticias.length}\n`);

  console.log(`🟢 Buenas (500+ palabras): ${buenas.length}`);
  console.log(`🟡 Regulares (250-499 palabras): ${regulares.length}`);
  console.log(`🟠 Cortas (100-200 palabras): ${cortas.length} ← TU RECLAMO`);
  console.log(`🔴 Muy cortas (<100 palabras): ${muyCortas.length}`);
  console.log(`❓ Sin scoreCalidad: ${sinScore.length}\n`);

  if (cortas.length > 0) {
    console.log('═'.repeat(80));
    console.log('📋 DETALLE NOTICIAS CORTAS (100-200 palabras):');
    console.log('═'.repeat(80));
    cortas.forEach((n, i) => {
      console.log(`${i + 1}. [${n.palabras} palabras] ${n.titulo}`);
      console.log(`   Slug: ${n.slug} | Categoría: ${n.categoria} | Score: ${n.scoreCalidad ?? 'N/A'}`);
    });
  }

  if (muyCortas.length > 0) {
    console.log('\n' + '═'.repeat(80));
    console.log('📋 DETALLE NOTICIAS MUY CORTAS (<100 palabras):');
    console.log('═'.repeat(80));
    muyCortas.forEach((n, i) => {
      console.log(`${i + 1}. [${n.palabras} palabras] ${n.titulo}`);
      console.log(`   Slug: ${n.slug} | Categoría: ${n.categoria}`);
    });
  }

  console.log('\n✅ Diagnóstico completado.');
  process.exit(0);
}

diagnosticar().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
