#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

const TRANSICIONES_IA = [
  'en conclusion', 'en resumen', 'es importante destacar',
  'vale la pena mencionar', 'no hay que olvidar', 'en el contexto de',
  'desde esta perspectiva', 'en ultima instancia', 'a fin de cuentas',
  'en el marco de', 'resulta fundamental', 'resulta evidente',
  'no cabe duda', 'es indiscutible', 'resulta innegable',
  'en conclusion', 'en resumen', 'en definitiva', 'para concluir',
  'como se menciono anteriormente', 'es relevante senalar',
  'no se puede ignorar', 'es crucial', 'es vital',
  'asimismo', 'por otro lado', 'en ese sentido', 'cabe señalar',
  'las autoridades reiteraron', 'por su parte',
  'a fin de cuentas', 'en el marco de', 'desde esta perspectiva',
  'en el contexto de', 'de igual manera', 'vale la pena mencionar',
  'es importante destacar', 'no cabe duda', 'en conclusión',
  'en resumen', 'se mantienen operativos', 'se espera que',
  'continúan las investigaciones'
];

async function main() {
  const db = initFirebase();
  const docRef = db.collection('noticias').doc('vDqwQW7VvkSeu8xbi5O3');
  const doc = await docRef.get();

  if (!doc.exists) {
    console.log('❌ No encontrada');
    process.exit(1);
  }

  const data = doc.data();
  let contenido = data.contenido || '';
  let titulo = data.titulo || '';

  console.log('=== ANTES ===');
  console.log(`Título: "${titulo}"`);
  console.log(`Título termina en ...: ${/\.\.\.$/.test(titulo)}`);

  // 1. Quitar "..." del final del título (clickbait)
  const tituloLimpio = titulo.replace(/\.{3,}$/, '').trim();
  if (tituloLimpio !== titulo) {
    console.log(`✅ Título corregido: "${tituloLimpio}"`);
  }

  // 2. Buscar TODAS las transiciones IA en el contenido
  const textoLower = contenido.toLowerCase();
  const encontradas = [];
  TRANSICIONES_IA.forEach(t => {
    if (textoLower.includes(t.toLowerCase())) {
      // Encontrar posición para mostrar contexto
      const idx = textoLower.indexOf(t.toLowerCase());
      const contexto = contenido.slice(Math.max(0, idx - 30), idx + t.length + 30);
      encontradas.push({ frase: t, contexto });
    }
  });

  console.log(`\nTransiciones IA encontradas: ${encontradas.length}`);
  encontradas.forEach(e => {
    console.log(`  ❌ "${e.frase}"`);
    console.log(`     Contexto: ...${e.contexto}...`);
  });

  // 3. Eliminar transiciones IA
  let contenidoLimpio = contenido;
  TRANSICIONES_IA.forEach(frase => {
    const regex = new RegExp(`[,;]?\\s*${frase.replace(/\s/g, '\\s+')}[,;]?\\s*`, 'gi');
    contenidoLimpio = contenidoLimpio.replace(regex, ' ');
  });

  // 4. Limpiar espacios
  contenidoLimpio = contenidoLimpio.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();

  // 5. Verificar si quedan
  const textoLower2 = contenidoLimpio.toLowerCase();
  const quedan = TRANSICIONES_IA.filter(t => textoLower2.includes(t.toLowerCase()));
  console.log(`\nTransiciones IA restantes: ${quedan.length}`);
  if (quedan.length > 0) {
    quedan.forEach(t => console.log(`  ⚠️ "${t}"`));
  } else {
    console.log('  ✅ NINGUNA');
  }

  // 6. Actualizar
  await docRef.update({
    titulo: tituloLimpio,
    contenido: contenidoLimpio,
    fechaActualizacion: FieldValue.serverTimestamp(),
  });

  console.log('\n=== ACTUALIZADO ===');
  console.log(`Nuevo título: "${tituloLimpio}"`);
  console.log('Clickbait eliminado ✅');
  console.log('Transiciones IA eliminadas ✅');

  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
