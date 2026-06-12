#!/usr/bin/env node
/**
 * Guarda noticias reparadas directamente en Firestore usando Admin SDK
 * Lee las noticias de noticias-reparadas.json
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Inicializar Firebase Admin
const serviceAccountPath = 'g:\\\\RESPALDO\\\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore(app);

// Cargar noticias reparadas
const noticias = JSON.parse(readFileSync('g:\\\\RESPALDO\\\\informate-nicaragua-final\\\\scripts\\\\noticias-reparadas.json', 'utf8'));

async function buscarYActualizar(noticia) {
  // Buscar por slug o por título
  let q = db.collection('noticias');
  
  if (noticia.slug) {
    q = q.where('slug', '==', noticia.slug);
  } else {
    // Buscar por título similar
    q = q.where('titulo', '>=', noticia.tituloOriginal.substring(0, 20))
         .where('titulo', '<=', noticia.tituloOriginal.substring(0, 20) + '\uf8ff');
  }
  
  const snap = await q.limit(5).get();
  
  if (snap.empty) {
    console.log(`❌ No encontrada: ${noticia.tituloOriginal}`);
    return false;
  }
  
  // Si hay múltiples, mostrar opciones
  if (snap.size > 1) {
    console.log(`⚠️ Múltiples coincidencias para: ${noticia.tituloOriginal}`);
    snap.docs.forEach((d, i) => console.log(`  ${i}: ${d.data().titulo}`));
    // Usar la primera
  }
  
  const doc = snap.docs[0];
  const id = doc.id;
  const data = doc.data();
  
  const palabras = noticia.contenido.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  
  const updateData = {
    titulo: noticia.titulo,
    resumen: noticia.resumen,
    contenido: noticia.contenido,
    palabras,
    fechaActualizacion: new Date(),
  };
  
  await db.collection('noticias').doc(id).update(updateData);
  
  console.log(`✅ Actualizada: ${noticia.titulo} | ${palabras} palabras | ID: ${id}`);
  return true;
}

async function main() {
  console.log(`Procesando ${noticias.length} noticias...\n`);
  
  let exitosas = 0;
  let fallidas = 0;
  
  for (const noticia of noticias) {
    try {
      const ok = await buscarYActualizar(noticia);
      if (ok) exitosas++;
      else fallidas++;
    } catch (err) {
      console.error(`❌ Error en "${noticia.tituloOriginal}":`, err.message);
      fallidas++;
    }
    // Pequeña pausa entre operaciones
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n=== RESUMEN ===`);
  console.log(`Exitosas: ${exitosas}`);
  console.log(`Fallidas: ${fallidas}`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
