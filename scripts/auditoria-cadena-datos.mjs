import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'informate-instant-nicaragua-c7bc9eb4f553.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  console.log('==========================================');
  console.log('AUDITORÍA FORENSE — Cadena de datos');
  console.log('==========================================\n');

  const snapshot = await db.collection('noticias').get();

  // ── FUENTE DE VERDAD ──
  let conMetaDescription = 0;
  let conResumen = 0;
  let conRelatedLinks = 0;
  let conAmbos = 0;
  let conSoloMetaDescription = 0;
  let conSoloResumen = 0;
  let resumenLargoBien = 0;
  let resumenCortoOMalo = 0;
  let metaDescriptionLargaBien = 0;
  let metaDescriptionCortaOMala = 0;
  let desfasados = 0; // resumen !== metaDescription

  const muestras = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const meta = (data.metaDescription || '').trim();
    const res = (data.resumen || '').trim();
    const links = data.related_links;

    if (meta) conMetaDescription++;
    if (res) conResumen++;
    if (links && Array.isArray(links) && links.length > 0) conRelatedLinks++;
    if (meta && res) conAmbos++;
    if (meta && !res) conSoloMetaDescription++;
    if (res && !meta) conSoloResumen++;

    if (res.length >= 120 && res.length <= 160) resumenLargoBien++;
    else if (res.length > 0) resumenCortoOMalo++;

    if (meta.length >= 120 && meta.length <= 160) metaDescriptionLargaBien++;
    else if (meta.length > 0) metaDescriptionCortaOMala++;

    if (meta && res && meta !== res) desfasados++;

    // Guardar primeras 5 muestras
    if (muestras.length < 5) {
      muestras.push({
        slug: data.slug || doc.id,
        metaLength: meta.length,
        resumenLength: res.length,
        metaPreview: meta.slice(0, 60),
        resumenPreview: res.slice(0, 60),
        relatedLinksCount: links?.length || 0,
      });
    }
  }

  console.log('─── FUENTE DE VERDAD ───');
  console.log(`Total noticias: ${snapshot.size}`);
  console.log(`Con campo 'metaDescription': ${conMetaDescription}`);
  console.log(`Con campo 'resumen': ${conResumen}`);
  console.log(`Con ambos campos: ${conAmbos}`);
  console.log(`Con solo metaDescription (sin resumen): ${conSoloMetaDescription}`);
  console.log(`Con solo resumen (sin metaDescription): ${conSoloResumen}`);
  console.log(`Con related_links: ${conRelatedLinks}`);
  console.log(`Desfasados (meta ≠ resumen): ${desfasados}\n`);

  console.log('─── CALIDAD META DESCRIPTIONS ───');
  console.log(`resumen con longitud 120-160: ${resumenLargoBien}/${conResumen}`);
  console.log(`resumen corto o malo: ${resumenCortoOMalo}`);
  console.log(`metaDescription con longitud 120-160: ${metaDescriptionLargaBien}/${conMetaDescription}`);
  console.log(`metaDescription corto o malo: ${metaDescriptionCortaOMala}\n`);

  console.log('─── MUESTRA DE 5 DOCUMENTOS ───');
  muestras.forEach(m => {
    console.log(`\n  Slug: ${m.slug}`);
    console.log(`    metaDescription: ${m.metaLength} chars | "${m.metaPreview}"`);
    console.log(`    resumen:         ${m.resumenLength} chars | "${m.resumenPreview}"`);
    console.log(`    related_links:   ${m.relatedLinksCount} items`);
  });

  console.log('\n─── ANÁLISIS DEL DESFASE ───');
  if (conSoloMetaDescription > 0) {
    console.log(`BUG CONFIRMADO: ${conSoloMetaDescription} noticias tienen metaDescription pero NO resumen.`);
    console.log('El script fix-meta-apply.mjs escribió en "metaDescription", pero el frontend y el panel leen "resumen".');
    console.log('→ Las meta descriptions nuevas NO se ven en el sitio ni en el panel.');
  }

  if (desfasados > 0) {
    console.log(`\nADVERTENCIA: ${desfasados} noticias tienen valores diferentes en metaDescription vs resumen.`);
    console.log('→ El frontend usará resumen (prioridad), ignorando metaDescription.');
  }

  console.log('\n─── RECOMENDACIÓN ───');
  console.log('Ejecutar: node scripts/sync-meta-to-resumen.mjs');
  console.log('Copiar metaDescription → resumen para todas las noticias desfasadas.');
}

main().catch(console.error);
