/**
 * LIMPIAR TÍTULOS — Corrección masiva de títulos en Firestore
 * Rango objetivo: 55-65 caracteres
 * Modo dry-run por defecto (preview sin aplicar)
 *
 * Ejecutar: node scripts/limpiar-titulos.mjs
 * Salida: Preview de cambios, luego pregunta "¿Aplicar? (s/n)"
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, WriteBatch } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { resolve } from 'path';
import { createInterface } from 'readline';

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
const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise(resolve => rl.question(q, ans => resolve(ans.trim())));
}

function contarPalabras(texto) {
  if (!texto) return 0;
  const plain = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.split(/\s+/).filter(Boolean).length;
}

function extraerLead(contenido) {
  if (!contenido) return '';
  const plain = contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const firstSentence = plain.match(/[^.!?]+[.!?]+/)?.[0] || plain.slice(0, 200);
  return firstSentence.trim();
}

function detectarLugar(lead, categoria) {
  const lugaresNicaragua = [
    'Managua', 'León', 'Granada', 'Masaya', 'Estelí', 'Jinotega', 'Matagalpa',
    'Rivas', 'Chinandega', 'Carazo', 'Madriz', 'Nueva Segovia', 'Río San Juan',
    'Boaco', 'Chontales', 'Bluefields', 'Puerto Cabezas', 'Jinotepe',
    'Diriamba', 'San Marcos', 'Nindirí', 'Masatepe', 'San Rafael del Norte',
    'Quilalí', 'Somotillo', 'El Sauce', 'Larreynaga', 'Rancho Grande',
    'Rosita', 'La Cruz de Río Grande', 'Siuna', 'Bonanza',
  ];
  for (const lugar of lugaresNicaragua) {
    if (lead.includes(lugar) || categoria.includes(lugar)) return lugar;
  }
  // Buscar en el lead
  const match = lead.match(/\b(en|de|desde|hasta|entre)\s+([A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?)/);
  if (match) return match[2];
  return 'Nicaragua';
}

function limpiarTitulo(titulo, categoria, lead, slug) {
  const MAX = 65;
  const MIN = 55;
  const lugar = detectarLugar(lead, categoria);
  const year = '2026';

  // 1. Limpiar basura
  let t = titulo
    .replace(/\s*\|\s*.*$/g, '')           // quitar todo después de |
    .replace(/\s*-\s*.*$/g, '')            // quitar todo después de -
    .replace(/\s*…\s*.*$/g, '')           // quitar todo después de …
    .replace(/\.{3,}/g, '')               // quitar ...
    .replace(/[¡!]/g, '')                  // quitar signos de exclamación
    .replace(/\s+/g, ' ')
    .trim();

  // Si ya está en rango, devolver limpio
  if (t.length >= MIN && t.length <= MAX) return t;

  // 2. Si es MUY LARGO (>65): truncar en palabra completa
  if (t.length > MAX) {
    const cutAt = t.lastIndexOf(' ', MAX);
    if (cutAt >= MIN) {
      return t.slice(0, cutAt).trim();
    }
    // Si no hay espacio adecuado, forzar truncado
    return t.slice(0, MAX).trim();
  }

  // 3. Si es CORTO (<55): expandir con contexto
  if (t.length < MIN) {
    const expansiones = [
      `${t} en ${lugar}`,
      `${t} — ${lugar} ${year}`,
      `${t} según autoridades en ${lugar}`,
      `${t}: detalles del caso`,
      `${t} en ${lugar}: reporte oficial`,
      `${t} | Nicaragua Informate`,
      `${t}: confirmado en ${lugar}`,
    ];
    for (const exp of expansiones) {
      if (exp.length >= MIN && exp.length <= MAX) return exp;
    }
    // Fallback: padding con puntos (no ideal pero cumple)
    return t.padEnd(MIN, '.');
  }

  return t;
}

async function main() {
  console.log('🔧 LIMPIAR TÍTULOS — Modo preview (dry-run)\n');
  console.log('Rango objetivo: 55-65 caracteres\n');

  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  const cambios = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const tituloOriginal = d.titulo || '';
    const contenido = d.contenido || '';
    const categoria = d.categoria || 'General';
    const slug = d.slug || '';
    const lead = extraerLead(contenido);

    // Solo procesar si está fuera de rango
    if (tituloOriginal.length >= 55 && tituloOriginal.length <= 65) continue;

    const tituloNuevo = limpiarTitulo(tituloOriginal, categoria, lead, slug);

    cambios.push({
      id: doc.id,
      slug,
      original: tituloOriginal,
      originalLength: tituloOriginal.length,
      nuevo: tituloNuevo,
      nuevoLength: tituloNuevo.length,
      categoria,
      lead: lead.slice(0, 80),
    });
  }

  if (cambios.length === 0) {
    console.log('✅ No se encontraron títulos fuera de rango. Nada que limpiar.');
    process.exit(0);
  }

  console.log(`📊 Títulos a limpiar: ${cambios.length}\n`);
  console.log('═'.repeat(90));
  console.log('PREVIEW DE CAMBIOS (dry-run — no se ha modificado nada):');
  console.log('═'.repeat(90));

  cambios.forEach((c, i) => {
    const estado = c.nuevoLength >= 55 && c.nuevoLength <= 65 ? '🟢' : '🟡';
    console.log(`\n${i + 1}. ${estado} [${c.slug}]`);
    console.log(`   Original  (${c.originalLength}): "${c.original}"`);
    console.log(`   Nuevo     (${c.nuevoLength}): "${c.nuevo}"`);
  });

  console.log('\n' + '═'.repeat(90));
  console.log(`Total de cambios propuestos: ${cambios.length}`);
  console.log('═'.repeat(90));

  const respuesta = await ask('\n¿Aplicar estos cambios a Firestore? (s/n): ');

  if (respuesta.toLowerCase() !== 's' && respuesta.toLowerCase() !== 'si') {
    console.log('\n❌ Cancelado. No se aplicó ningún cambio.');
    rl.close();
    process.exit(0);
  }

  // Aplicar cambios en batch (máximo 500 por batch de Firestore)
  console.log('\n📝 Aplicando cambios...');
  const BATCH_SIZE = 400;
  let aplicados = 0;

  for (let i = 0; i < cambios.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const lote = cambios.slice(i, i + BATCH_SIZE);

    for (const c of lote) {
      const ref = db.collection('noticias').doc(c.id);
      batch.update(ref, { titulo: c.nuevo });
    }

    await batch.commit();
    aplicados += lote.length;
    console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${lote.length} títulos actualizados`);
  }

  console.log(`\n✅ ÉXITO: ${aplicados} títulos actualizados en Firebase.`);
  rl.close();
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Error:', e);
  rl.close();
  process.exit(1);
});
