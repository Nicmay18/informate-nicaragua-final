/**
 * Script de diagnóstico: Verifica qué noticias devuelve la query de la homepage
 * y por qué algunas no aparecen en el carrusel.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar credenciales
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'firebase-admin-key.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  console.log('\n=== DIAGNÓSTICO HOMEPAGE ===\n');

  // 1. Top 10 por fecha desc (igual que la homepage)
  console.log('--- Top 10 noticias por fecha DESC (query homepage) ---');
  const snap = await db
    .collection('noticias')
    .orderBy('fecha', 'desc')
    .limit(10)
    .get();

  if (snap.empty) {
    console.log('NO HAY NOTICIAS');
    return;
  }

  snap.docs.forEach((d, i) => {
    const data = d.data();
    const fechaVal = data.fecha;
    let fechaStr = 'null/undefined';
    let fechaType = typeof fechaVal;

    if (fechaVal instanceof Timestamp) {
      fechaStr = fechaVal.toDate().toISOString();
      fechaType = 'Timestamp (Admin SDK)';
    } else if (fechaVal && typeof fechaVal === 'object') {
      if (fechaVal._seconds !== undefined) {
        fechaStr = new Date(fechaVal._seconds * 1000).toISOString();
        fechaType = 'object {_seconds}';
      } else if (fechaVal.seconds !== undefined) {
        fechaStr = new Date(fechaVal.seconds * 1000).toISOString();
        fechaType = 'object {seconds} (client Timestamp)';
      } else {
        fechaStr = JSON.stringify(fechaVal);
        fechaType = 'object (unknown)';
      }
    } else if (typeof fechaVal === 'string') {
      fechaStr = fechaVal;
      fechaType = 'string';
    }

    console.log(`\n#${i + 1} [${d.id}]`);
    console.log(`  titulo: ${(data.titulo || '').slice(0, 60)}...`);
    console.log(`  estado: ${data.estado ?? '(no tiene)'}`);
    console.log(`  fecha tipo: ${fechaType}`);
    console.log(`  fecha valor: ${fechaStr}`);
    console.log(`  slug: ${data.slug || '(sin slug)'}`);
    console.log(`  imagen: ${data.imagen ? 'SÍ' : 'NO'}`);
  });

  // 2. Contar noticias SIN fecha (field missing o null)
  console.log('\n\n--- Noticias sin campo fecha ---');
  const allSnap = await db.collection('noticias').limit(500).get();
  let sinFecha = 0;
  let sinFechaActualizacion = 0;
  let borradores = 0;
  let publicadas = 0;

  allSnap.docs.forEach(d => {
    const data = d.data();
    if (!data.fecha) sinFecha++;
    if (!data.fechaActualizacion) sinFechaActualizacion++;
    if (data.estado === 'borrador') borradores++;
    if (data.estado === 'publicado' || !data.estado) publicadas++;
  });

  console.log(`Total docs leídos: ${allSnap.docs.length}`);
  console.log(`Sin campo 'fecha': ${sinFecha}`);
  console.log(`Sin campo 'fechaActualizacion': ${sinFechaActualizacion}`);
  console.log(`Con estado 'borrador': ${borradores}`);
  console.log(`Publicadas (o sin estado): ${publicadas}`);

  // 3. Verificar si el tipo de fecha es inconsistente
  console.log('\n\n--- Tipos de campo fecha ---');
  const types = new Map();
  allSnap.docs.forEach(d => {
    const val = d.data().fecha;
    let type = typeof val;
    if (val instanceof Timestamp) type = 'Timestamp';
    if (val === null) type = 'null';
    if (val === undefined) type = 'undefined';
    types.set(type, (types.get(type) || 0) + 1);
  });
  for (const [type, count] of types) {
    console.log(`  ${type}: ${count}`);
  }

  console.log('\n=== FIN DIAGNÓSTICO ===\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
