/**
 * forensic-auto-fixer.mjs
 * 1. Elimina duplicados de Masaya.
 * 2. Repara Meta Descripciones cortas.
 * 3. Inserta H2 automático en artículos planos.
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from 'dotenv';

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
  process.exit(1);
}

const db = initDb();

async function fixForensic() {
  console.log('🚀 INICIANDO AUTO-FIXER FORENSE...\n');

  // 1. Eliminar Duplicados de Masaya
  console.log('1. Revisando duplicados de Masaya...');
  const masayaSlugs = [
    'cae-banda-senalada-de-asesinar-a-guarda-de-seguridad-en-masaya',
    'capturan-a-tres-sospechosos-por-homicidio-de-vigilante-en-masaya'
  ];
  
  const masayaDocs = [];
  for (const slug of masayaSlugs) {
    const snap = await db.collection('noticias').where('slug', '==', slug).get();
    snap.forEach(doc => masayaDocs.push({ id: doc.id, ...doc.data() }));
  }

  if (masayaDocs.length > 1) {
    // Ordenar por longitud de contenido descendente (nos quedamos con el más completo)
    masayaDocs.sort((a, b) => (b.contenido?.length || 0) - (a.contenido?.length || 0));
    const keep = masayaDocs[0];
    const duplicates = masayaDocs.slice(1);
    
    for (const dup of duplicates) {
      console.log(`   🗑️ Borrando duplicado inferior: ${dup.id} (slug: ${dup.slug})`);
      await db.collection('noticias').doc(dup.id).delete();
    }
    console.log(`   ✅ Manteniendo versión principal: ${keep.id} (slug: ${keep.slug})`);
  } else {
    console.log('   ℹ️ No se encontraron duplicados activos de Masaya.');
  }

  // 2 y 3. Meta Descripciones y H2 automáticos
  console.log('\n2 y 3. Analizando resto de noticias para Meta Desc y H2...');
  const snap = await db.collection('noticias').get();
  let metaFixed = 0;
  let h2Fixed = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    const contenido = data.contenido || '';
    const titulo = data.titulo || '';
    
    // Fix Meta Description
    const metaActual = (data.metaDescription || data.metaDescripcion || '').trim();
    if (metaActual.length < 120) {
      let nuevaMeta = (data.resumen || contenido.replace(/<[^>]*>/g, ' ')).trim().substring(0, 160);
      if (nuevaMeta.length > 10) {
        updates.metaDescription = nuevaMeta + (nuevaMeta.length >= 157 ? '...' : '');
        metaFixed++;
      }
    }

    // Fix H2 (Solo si el contenido es largo pero no tiene H2)
    const tieneH2 = /<h2/i.test(contenido);
    const palabras = contenido.replace(/<[^>]*>/g, ' ').split(/\s+/).length;
    
    if (!tieneH2 && palabras > 150) {
      // Insertamos un H2 basado en el título antes del segundo párrafo
      const parrafos = contenido.split('</p>');
      if (parrafos.length >= 2) {
        const indexToInsert = Math.floor(parrafos.length / 2);
        const subtitulo = `<h2>Detalles sobre ${titulo.substring(0, 40)}...</h2>`;
        parrafos.splice(indexToInsert, 0, subtitulo);
        updates.contenido = parrafos.join('</p>');
        h2Fixed++;
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.fechaActualizacion = FieldValue.serverTimestamp();
      await doc.ref.update(updates);
    }
  }

  console.log(`\n✅ REPARACIÓN COMPLETADA:`);
  console.log(`   - Meta Descripciones reparadas: ${metaFixed}`);
  console.log(`   - H2 insertados automáticamente: ${h2Fixed}`);
  console.log(`\nSiguiente paso: node regenerar-backup-firestore.mjs`);
}

fixForensic().catch(console.error);
