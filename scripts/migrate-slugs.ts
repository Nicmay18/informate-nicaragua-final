#!/usr/bin/env node
/**
 * Script de migración: agrega campo "slug" a todos los documentos de Firestore
 * que no lo tengan, generándolo desde el título.
 *
 * Uso:
 *   npx tsx scripts/migrate-slugs.ts
 *
 * Requiere variables de entorno (mismas que la app):
 *   FIREBASE_SERVICE_ACCOUNT_BASE64  (preferido)
 *   o
 *   FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { generateSlug } from '../lib/slug';

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    return initializeApp({ credential: cert(sa) });
  }

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Faltan variables de entorno. Necesitás:\n' +
        '  FIREBASE_SERVICE_ACCOUNT_BASE64 (preferido)\n' +
        '  o FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY'
    );
  }

  const privateKey = privateKeyRaw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');

  return initializeApp({ credential: cert({ projectId, privateKey, clientEmail }) });
}

async function main() {
  const app = getAdminApp();
  const db = getFirestore(app);
  const coll = db.collection('noticias');

  console.log('📥 Obteniendo noticias sin slug...');
  const snap = await coll.limit(500).get();

  const withoutSlug = snap.docs.filter((d) => !d.data().slug);
  console.log(`🔍 Encontradas ${withoutSlug.length} noticias sin slug (de ${snap.docs.length} total)`);

  if (withoutSlug.length === 0) {
    console.log('✅ Todos los documentos ya tienen slug. Nada que hacer.');
    process.exit(0);
  }

  // Coleccionar todos los slugs existentes para evitar duplicados
  const existingSlugs = new Set<string>();
  snap.docs.forEach((d) => {
    const s = d.data().slug;
    if (s) existingSlugs.add(s);
  });

  let updated = 0;
  let errors = 0;

  for (const doc of withoutSlug) {
    const data = doc.data();
    const titulo = data.titulo || '';
    if (!titulo) {
      console.warn(`⚠️  Documento ${doc.id} no tiene título. Saltando...`);
      errors++;
      continue;
    }

    const baseSlug = generateSlug(titulo);
    let slug = baseSlug;
    let counter = 1;

    while (existingSlugs.has(slug)) {
      const suffix = `-${counter}`;
      slug = baseSlug.substring(0, 100 - suffix.length) + suffix;
      counter++;
      if (counter > 999) {
        slug = `${baseSlug.substring(0, 85)}-${Date.now()}`;
        break;
      }
    }

    existingSlugs.add(slug);

    try {
      await doc.ref.update({ slug });
      updated++;
      console.log(`✅ ${doc.id} → ${slug}`);
    } catch (err) {
      console.error(`❌ Error actualizando ${doc.id}:`, err);
      errors++;
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   Actualizados: ${updated}`);
  console.log(`   Errores:      ${errors}`);
  console.log(`   Sin slug:     ${withoutSlug.length - updated - errors}`);

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
