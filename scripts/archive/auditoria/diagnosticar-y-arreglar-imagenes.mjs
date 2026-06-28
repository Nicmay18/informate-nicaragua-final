/**
 * diagnosticar-y-arreglar-imagenes.mjs
 * Escanea noticias sin imagen y las arregla automáticamente
 * buscando en contenido, galeria, imagenes, foto, image.
 *
 * Uso: node diagnosticar-y-arreglar-imagenes.mjs
 * Modo simulación: node diagnosticar-y-arreglar-imagenes.mjs --dry-run
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: './.env.local' });

const DRY_RUN = process.argv.includes('--dry-run');

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
  console.error('ERROR: No hay credenciales Firebase en .env.local');
  process.exit(1);
}

const db = initDb();

// Campos de imagen que usa data.ts (campo 'imagen' es el canónico)
const CAMPO_IMAGEN = 'imagen';

function extraerImagenDeContenido(contenido) {
  if (!contenido) return null;
  const matchHtml = contenido.match(/<img[^>]+src=["']([^"']+)["'][^>]*/i);
  if (matchHtml) return matchHtml[1];
  const matchMd = contenido.match(/!\[.*?\]\(([^)]+)\)/);
  if (matchMd) return matchMd[1];
  return null;
}

function estaVacia(valor) {
  return !valor || String(valor).trim() === '' || valor === 'null' || valor === 'undefined';
}

async function main() {
  console.log('══════════════════════════════════════════════════════════');
  console.log('  DIAGNÓSTICO Y ARREGLO DE IMÁGENES' + (DRY_RUN ? ' [DRY-RUN]' : ''));
  console.log('══════════════════════════════════════════════════════════\n');

  const snap = await db.collection('noticias').limit(2000).get();
  console.log(`Total noticias: ${snap.size}\n`);

  let conImagen = 0;
  let sinImagen = 0;
  let arregladas = 0;
  let sinSolucion = 0;

  const conteoPorFuente = {};
  const problemas = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    const imagenActual = d.imagen || d.imagenDestacada || d.imagen_principal || '';

    if (!estaVacia(imagenActual)) {
      conImagen++;
      continue;
    }

    sinImagen++;
    let imagenEncontrada = null;
    let fuente = '';

    // 1. Buscar en contenido HTML
    const desdeContenido = extraerImagenDeContenido(d.contenido);
    if (desdeContenido) {
      imagenEncontrada = desdeContenido;
      fuente = 'contenido_html';
    }

    // 2. Campo imagenDestacada (nombre alternativo)
    if (!imagenEncontrada && !estaVacia(d.imagenDestacada)) {
      imagenEncontrada = d.imagenDestacada;
      fuente = 'imagenDestacada';
    }

    // 3. Campo imagen_principal (formato antiguo)
    if (!imagenEncontrada && !estaVacia(d.imagen_principal)) {
      imagenEncontrada = d.imagen_principal;
      fuente = 'imagen_principal';
    }

    // 4. Campo galeria
    if (!imagenEncontrada && Array.isArray(d.galeria) && d.galeria.length > 0) {
      imagenEncontrada = d.galeria[0];
      fuente = 'galeria[0]';
    }

    // 5. Campo imagenes
    if (!imagenEncontrada && Array.isArray(d.imagenes) && d.imagenes.length > 0) {
      imagenEncontrada = d.imagenes[0];
      fuente = 'imagenes[0]';
    }

    // 6. Campo media
    if (!imagenEncontrada && Array.isArray(d.media) && d.media.length > 0) {
      const m = d.media[0];
      imagenEncontrada = typeof m === 'string' ? m : (m?.url || null);
      if (imagenEncontrada) fuente = 'media[0]';
    }

    // 7. Campos foto / image
    if (!imagenEncontrada && !estaVacia(d.foto)) {
      imagenEncontrada = d.foto;
      fuente = 'foto';
    }
    if (!imagenEncontrada && !estaVacia(d.image)) {
      imagenEncontrada = d.image;
      fuente = 'image';
    }

    if (imagenEncontrada && !estaVacia(imagenEncontrada)) {
      conteoPorFuente[fuente] = (conteoPorFuente[fuente] || 0) + 1;
      console.log(`✅ ${(d.titulo || doc.id).substring(0, 55)}`);
      console.log(`   Imagen desde: ${fuente}`);
      console.log(`   URL: ${imagenEncontrada.substring(0, 70)}\n`);

      if (!DRY_RUN) {
        await doc.ref.update({
          [CAMPO_IMAGEN]: imagenEncontrada,
          _imagen_corregida_desde: fuente,
          fechaActualizacion: FieldValue.serverTimestamp(),
        });
      }
      arregladas++;
    } else {
      sinSolucion++;
      problemas.push({
        id: doc.id,
        slug: d.slug || doc.id,
        titulo: (d.titulo || '').substring(0, 60),
        campos_imagen_disponibles: Object.keys(d).filter(k =>
          k.includes('img') || k.includes('foto') ||
          k.includes('media') || k.includes('galer') || k.includes('image')
        ),
      });
    }
  }

  // Reporte
  console.log('══════════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`Total:               ${snap.size}`);
  console.log(`Con imagen:          ${conImagen} ✅`);
  console.log(`Sin imagen:          ${sinImagen}`);
  console.log(`  Arregladas auto:   ${arregladas} 🎉${DRY_RUN ? ' (simulación)' : ''}`);
  console.log(`  Sin solución:      ${sinSolucion} ⚠️`);
  if (Object.keys(conteoPorFuente).length > 0) {
    console.log(`\nImágenes recuperadas por fuente:`);
    for (const [fuente, count] of Object.entries(conteoPorFuente)) {
      console.log(`  ${fuente}: ${count}`);
    }
  }

  if (problemas.length > 0) {
    console.log(`\n⚠️  NECESITAN IMAGEN MANUAL (${problemas.length}):`);
    for (const p of problemas) {
      console.log(`  - ${p.titulo || p.id}`);
      console.log(`    URL: https://nicaraguainformate.com/noticias/${p.slug}`);
    }
    writeFileSync('noticias-sin-imagen.json', JSON.stringify(problemas, null, 2));
    console.log(`\nListado guardado en: noticias-sin-imagen.json`);
  }

  if (!DRY_RUN && arregladas > 0) {
    console.log('\n✅ Firestore actualizado. Next.js ISR regenerará las páginas');
    console.log('   automáticamente en el próximo acceso (revalidate: 60s).');
  }

  process.exit(0);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
