/**
 * verificar-urls-nextjs.mjs
 * Verifica integridad de URLs en el sitio Next.js + Firestore.
 * Detecta potenciales 404 antes de que los usuarios los encuentren.
 *
 * Qué revisa:
 * 1. Noticias en Firestore sin campo 'slug' (usan doc.id → URL puede diferir)
 * 2. Slugs duplicados en Firestore (dos docs con mismo slug → comportamiento impredecible)
 * 3. Slugs inválidos (caracteres especiales que rompen URLs)
 * 4. Noticias en backup local que ya no están en Firestore (links rotos si index usa backup)
 * 5. Noticias en Firestore no representadas en el backup (backup desactualizado)
 *
 * Uso: node verificar-urls-nextjs.mjs
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { readFileSync, existsSync, writeFileSync } from 'fs';

config({ path: './.env.local' });

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }
  if (privateKeyRaw && projectId && clientEmail) {
    const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return getFirestore();
  }
  console.error('ERROR: No se encontraron credenciales Firebase');
  process.exit(1);
}

const db = initDb();

const SLUG_RE = /^[a-zA-Z0-9_\-\u00C0-\u017F]+$/;
function isValidSlug(slug) {
  return typeof slug === 'string' && slug.length > 0 && slug.length <= 200 && SLUG_RE.test(slug);
}

// Cargar backup local si existe
function cargarBackupLocal() {
  const archivos = [
    'backup-noticias-2026-06-16.json',
    'backup-noticias-2026-06-14.json',
  ];
  for (const archivo of archivos) {
    if (existsSync(archivo)) {
      try {
        const data = JSON.parse(readFileSync(archivo, 'utf8'));
        return { archivo, data: Array.isArray(data) ? data : [] };
      } catch { continue; }
    }
  }
  return null;
}

async function main() {
  console.log('══════════════════════════════════════════════════════════');
  console.log('  VERIFICAR URLs — Next.js + Firestore');
  console.log('══════════════════════════════════════════════════════════\n');

  // 1. Cargar Firestore
  console.log('Cargando noticias de Firestore...');
  const snap = await db.collection('noticias').limit(2000).get();
  const firestoreDocs = snap.docs.map(doc => ({
    firestoreId: doc.id,
    slug: doc.data().slug,
    titulo: (doc.data().titulo || '').substring(0, 60),
    fecha: doc.data().fecha || '',
  }));
  console.log(`Total en Firestore: ${firestoreDocs.length}\n`);

  const reporte = {
    fecha: new Date().toISOString(),
    total_firestore: firestoreDocs.length,
    problemas: [],
    ok: 0,
  };

  // 2. Slugs faltantes (usan doc.id como fallback en data.ts)
  const sinSlug = firestoreDocs.filter(d => !d.slug);
  if (sinSlug.length > 0) {
    console.log(`PROBLEMA 1 — SIN CAMPO 'slug' (${sinSlug.length} noticias):`);
    console.log('  Estas noticias usan doc.id como slug en data.ts.');
    console.log('  Si el doc.id no tiene formato URL-amigable → 404.\n');
    for (const d of sinSlug.slice(0, 10)) {
      console.log(`  ❌ ID: ${d.firestoreId}`);
      console.log(`     Título: ${d.titulo}`);
      console.log(`     URL que se generará: /noticias/${d.firestoreId}\n`);
    }
    if (sinSlug.length > 10) console.log(`  ...y ${sinSlug.length - 10} más\n`);
    reporte.problemas.push({ tipo: 'sin_slug', cantidad: sinSlug.length, docs: sinSlug.map(d => d.firestoreId) });
  } else {
    console.log('OK — Todas las noticias tienen campo slug\n');
  }

  // 3. Slugs duplicados
  const slugCount = {};
  for (const d of firestoreDocs) {
    const s = d.slug || d.firestoreId;
    slugCount[s] = (slugCount[s] || 0) + 1;
  }
  const duplicados = Object.entries(slugCount).filter(([, count]) => count > 1);
  if (duplicados.length > 0) {
    console.log(`PROBLEMA 2 — SLUGS DUPLICADOS (${duplicados.length} slugs repetidos):`);
    console.log('  getNewsBySlug usa .limit(1) → uno de los docs NUNCA será accesible.\n');
    for (const [slug, count] of duplicados) {
      const docs = firestoreDocs.filter(d => (d.slug || d.firestoreId) === slug);
      console.log(`  ❌ "${slug}" (${count} veces):`);
      docs.forEach(d => console.log(`     - ID: ${d.firestoreId} | ${d.titulo}`));
      console.log('');
    }
    reporte.problemas.push({ tipo: 'duplicados', cantidad: duplicados.length, slugs: duplicados.map(([s]) => s) });
  } else {
    console.log('OK — No hay slugs duplicados\n');
  }

  // 4. Slugs inválidos (fallarían en isValidSlug de data.ts)
  const slugsInvalidos = firestoreDocs.filter(d => d.slug && !isValidSlug(d.slug));
  if (slugsInvalidos.length > 0) {
    console.log(`PROBLEMA 3 — SLUGS INVÁLIDOS (${slugsInvalidos.length} noticias):`);
    console.log('  data.ts rechaza slugs con caracteres especiales → 404 siempre.\n');
    for (const d of slugsInvalidos.slice(0, 10)) {
      console.log(`  ❌ Slug: "${d.slug}"`);
      console.log(`     Título: ${d.titulo}\n`);
    }
    reporte.problemas.push({ tipo: 'slug_invalido', cantidad: slugsInvalidos.length });
  } else {
    console.log('OK — Todos los slugs tienen formato válido\n');
  }

  // 5. Comparar con backup local
  const backup = cargarBackupLocal();
  if (backup) {
    console.log(`Comparando con backup local: ${backup.archivo} (${backup.data.length} noticias)\n`);
    const firestoreSlugs = new Set(firestoreDocs.map(d => d.slug || d.firestoreId));
    const backupSlugs = new Set(backup.data.map(n => n.slug));

    const soloEnBackup = backup.data.filter(n => n.slug && !firestoreSlugs.has(n.slug));
    const soloEnFirestore = firestoreDocs.filter(d => {
      const s = d.slug || d.firestoreId;
      return !backupSlugs.has(s);
    });

    if (soloEnBackup.length > 0) {
      console.log(`PROBLEMA 4 — EN BACKUP PERO NO EN FIRESTORE (${soloEnBackup.length} noticias):`);
      console.log('  Si el index/listing usa el backup → genera links que no existen en Firestore → 404.\n');
      for (const n of soloEnBackup.slice(0, 15)) {
        console.log(`  ❌ "${(n.titulo || '').substring(0, 55)}"`);
        console.log(`     Slug: ${n.slug}`);
        console.log(`     URL: https://nicaraguainformate.com/noticias/${n.slug}\n`);
      }
      if (soloEnBackup.length > 15) console.log(`  ...y ${soloEnBackup.length - 15} más\n`);
      reporte.problemas.push({ tipo: 'solo_en_backup', cantidad: soloEnBackup.length, slugs: soloEnBackup.map(n => n.slug) });
    } else {
      console.log('OK — No hay noticias en backup que falten en Firestore\n');
    }

    if (soloEnFirestore.length > 0) {
      console.log(`INFO — EN FIRESTORE PERO NO EN BACKUP (${soloEnFirestore.length} noticias):`);
      console.log('  El backup está desactualizado. Ejecuta regenerar-backup-firestore.mjs\n');
      if (soloEnFirestore.length <= 20) {
        soloEnFirestore.forEach(d => console.log(`  ℹ️  ${d.titulo} | slug: ${d.slug || d.firestoreId}`));
      }
      reporte.problemas.push({ tipo: 'backup_desactualizado', cantidad: soloEnFirestore.length });
      console.log('');
    }
  } else {
    console.log('INFO — No se encontró backup local para comparar\n');
  }

  // Resumen final
  const totalProblemas = reporte.problemas.reduce((acc, p) => acc + p.cantidad, 0);
  console.log('══════════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('══════════════════════════════════════════════════════════');
  if (totalProblemas === 0) {
    console.log('  ✅ Sin problemas detectados. Todas las URLs deberían funcionar.');
  } else {
    console.log(`  ❌ Total de problemas: ${totalProblemas}`);
    reporte.problemas.forEach(p => {
      console.log(`  - ${p.tipo}: ${p.cantidad}`);
    });
    console.log('');
    console.log('  ACCIONES RECOMENDADAS:');
    if (reporte.problemas.some(p => p.tipo === 'sin_slug')) {
      console.log('  1. Agregar campo slug a noticias sin él en Firestore');
    }
    if (reporte.problemas.some(p => p.tipo === 'duplicados')) {
      console.log('  2. Eliminar o corregir documentos con slugs duplicados');
    }
    if (reporte.problemas.some(p => p.tipo === 'solo_en_backup')) {
      console.log('  3. Las noticias del backup que no están en Firestore causan 404.');
      console.log('     Opciones: reinsertar en Firestore, o agregar redirects en next.config.ts');
    }
    if (reporte.problemas.some(p => p.tipo === 'backup_desactualizado')) {
      console.log('  4. Ejecutar: node regenerar-backup-firestore.mjs');
    }
  }

  // Guardar reporte JSON
  const reporteFile = `reporte-urls-${new Date().toISOString().split('T')[0]}.json`;
  writeFileSync(reporteFile, JSON.stringify(reporte, null, 2), 'utf8');
  console.log(`\nReporte guardado: ${reporteFile}`);

  process.exit(totalProblemas > 0 ? 1 : 0);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
