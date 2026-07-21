/**
 * Aplicar títulos SEO y meta descripciones optimizadas a Firestore
 * Usa title-matches-preview.json y bulk-titulos-propuesta.json
 * Genera meta descripción desde resumen o contenido de cada noticia
 * Ejecutar: node scripts/apply-titulos-seo.mjs
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

function initDb() {
  if (getApps().length > 0) {
    return getFirestore(getApp());
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }

  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore();
}

const db = initDb();

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generarMeta(titulo, resumen, contenido) {
  let texto = (resumen || '').trim();
  if (texto.length < 30) {
    texto = stripHtml(contenido || '');
  }

  const MAX = 155;
  let meta = texto;

  if (meta.length > MAX) {
    const cut = meta.lastIndexOf(' ', MAX - 3);
    meta = meta.slice(0, cut > 40 ? cut : MAX - 3).trim() + '...';
  }

  if (!meta || meta.length < 20) {
    meta = `${titulo}. Lee los detalles completos en Nicaragua Informate.`;
  }

  return meta;
}

async function main() {
  const previewPath = resolve(process.cwd(), 'scripts', 'title-matches-preview.json');
  const previewRaw = readFileSync(previewPath, 'utf8');
  const preview = (JSON.parse(previewRaw).matches || []);

  const bulkPath = resolve(process.cwd(), 'scripts', 'output', 'bulk-titulos-propuesta.json');
  let bulk = [];
  try {
    const bulkRaw = readFileSync(bulkPath, 'utf8');
    bulk = (JSON.parse(bulkRaw).propuestas || []);
  } catch (_) { /* no bulk */ }

  const porTituloPreview = new Map();
  for (const item of preview) {
    porTituloPreview.set((item.oldTitle || '').toLowerCase().trim(), item.newTitle);
  }

  const porIdBulk = new Map();
  for (const item of bulk) {
    if (item.tituloPropuesto && item.tituloPropuesto !== item.tituloActual) {
      porIdBulk.set(item.id, item.tituloPropuesto);
    }
  }

  const snap = await db.collection('noticias').get();
  const docs = snap.docs.map(doc => ({ ref: doc.ref, data: doc.data() }));

  let actualizados = 0;
  const aplicados = [];

  for (const { ref, data } of docs) {
    const tituloActual = data.titulo || '';
    let nuevoTitulo = tituloActual;

    const newTitleByTitle = porTituloPreview.get(tituloActual.toLowerCase().trim());
    if (newTitleByTitle && newTitleByTitle !== tituloActual) {
      nuevoTitulo = newTitleByTitle;
    }

    const newTitleById = porIdBulk.get(ref.id);
    if (newTitleById && newTitleById !== tituloActual) {
      nuevoTitulo = newTitleById;
    }

    const nuevaMeta = generarMeta(nuevoTitulo, data.resumen, data.contenido);

    const update = {};
    if (nuevoTitulo !== tituloActual) update.titulo = nuevoTitulo;
    if (!data.metaDescription || data.metaDescription !== nuevaMeta) {
      update.metaDescription = nuevaMeta;
      update.metaDescripcion = nuevaMeta;
    }

    if (Object.keys(update).length === 0) continue;

    await ref.update(update);
    actualizados++;
    aplicados.push({ id: ref.id, tituloAnterior: tituloActual, nuevoTitulo, nuevaMeta });
  }

  const outDir = resolve(process.cwd(), 'scripts', 'output');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'titulos-aplicados-reporte.json'), JSON.stringify({
    fecha: new Date().toISOString(),
    total: docs.length,
    actualizados,
    aplicados,
  }, null, 2));

  console.log(`🗂️  Noticias en Firestore: ${docs.length}`);
  console.log(`✅ Actualizadas: ${actualizados}`);
  console.log(`  Reporte guardado en: scripts/output/titulos-aplicados-reporte.json`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
