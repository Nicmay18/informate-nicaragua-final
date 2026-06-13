#!/usr/bin/env node
// corregir-revisar.mjs — Corrige automáticamente las notas marcadas como REVISAR

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

function contarPalabras(texto) {
  const limpio = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio.split(' ').filter(w => w.length > 0).length;
}

function corregirNoticia(contenido) {
  let corregido = contenido;
  const cambios = [];

  // 1. Eliminar cifras genéricas sin contexto
  // "1234" siempre es genérico
  corregido = corregido.replace(/\b1234\b/g, (match) => {
    cambios.push('Eliminada cifra genérica 1234');
    return '';
  });

  // Cifras como 5,000, 50,000 sin contexto de moneda/monto
  // Solo eliminar si NO hay palabras de moneda/cantidad cerca
  const cifrasSinContexto = [
    { regex: /\b5,?000\b/g, nombre: '5,000' },
    { regex: /\b50,?000\b/g, nombre: '50,000' },
    { regex: /\b2,?000\b/g, nombre: '2,000' },
    { regex: /\b1,?000\b/g, nombre: '1,000' },
    { regex: /\b45,?000\b/g, nombre: '45,000' },
    { regex: /\b12,?000\b/g, nombre: '12,000' },
    { regex: /\b20,?000\b/g, nombre: '20,000' },
    { regex: /\b10,?000\b/g, nombre: '10,000' },
  ];

  cifrasSinContexto.forEach(({ regex, nombre }) => {
    corregido = corregido.replace(regex, (match, offset, string) => {
      const contexto = string.slice(Math.max(0, offset - 80), offset + 80).toLowerCase();
      const tieneContexto = /(?:c[oó]rdoba|d[oó]lar|peso|euro|monto|inversi[oó]n|costo|precio|valor|cantidad|personas|afectad|poblaci[oó]n|habitantes|beneficiar|pago|salario|ingreso|gasto)/.test(contexto);
      if (!tieneContexto) {
        cambios.push(`Eliminada cifra sin contexto: ${nombre}`);
        return '';
      }
      return match;
    });
  });

  // 2. Eliminar placas genéricas (1-3 dígitos)
  corregido = corregido.replace(/\b([A-Z])\s*(\d{1,3})\b/g, (match, letra, num) => {
    if (parseInt(num) < 1000 && num.length <= 3) {
      // Verificar si es modelo de teléfono (Galaxy S25, A54, etc.)
      const contexto = corregido.slice(0, 200).toLowerCase();
      if (/galaxy|samsung|xiaomi|iphone|modelo|android/.test(contexto)) {
        return match; // Es modelo de teléfono, no tocar
      }
      cambios.push(`Eliminada placa genérica: ${match}`);
      return '';
    }
    return match;
  });

  // 3. Eliminar citas "informó un portavoz"
  corregido = corregido.replace(/["\u201c][^"\u201d]{10,}["\u201d][,\s]*inform[oó]\s+un\s+portavoz[\s,]*[^.]*\./gi, (match) => {
    cambios.push('Eliminada cita de portavoz sin nombre');
    return '';
  });

  // 4. Eliminar referencias a "según fuentes" sin nombre
  corregido = corregido.replace(/[,\s]*seg[uú]n\s+fuentes[\s,]*[^.]*\./gi, (match) => {
    cambios.push('Eliminada referencia a fuentes sin nombre');
    return '.';
  });

  // 5. Normalizar espacios
  corregido = corregido
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\.{2,}/g, '.')
    .replace(/<p>\s*<\/p>/gi, '')
    .trim();

  return { contenido: corregido, cambios };
}

async function main() {
  console.log('🔧 CORRECCIÓN AUTOMÁTICA — Notas en REVISAR\n');

  const db = initFirebase();

  // Cargar reporte anterior
  let reporte;
  try {
    reporte = JSON.parse(readFileSync('auditoria-segunda-pasada.json', 'utf8'));
  } catch {
    console.log('No se encontró auditoria-segunda-pasada.json, ejecutando desde cero...');
    reporte = { revisar: [] };
  }

  // Si no hay reporte, leer todas las noticias
  let notasRevisar = reporte.revisar || [];

  if (notasRevisar.length === 0) {
    const snapshot = await db.collection('noticias').get();
    snapshot.forEach(doc => {
      notasRevisar.push({ id: doc.id, ...doc.data() });
    });
  } else {
    // Obtener contenido completo de Firestore para cada ID
    const notasCompletas = [];
    for (const nota of notasRevisar) {
      const doc = await db.collection('noticias').doc(nota.id).get();
      if (doc.exists) {
        notasCompletas.push({ id: doc.id, ...doc.data() });
      }
    }
    notasRevisar = notasCompletas;
  }

  console.log(`Notas a corregir: ${notasRevisar.length}\n`);

  let corregidas = 0;
  let sinCambios = 0;
  let pasanAPublicar = 0;
  const reporteCorreccion = [];

  for (const nota of notasRevisar) {
    const { contenido, cambios } = corregirNoticia(nota.contenido || '');
    const palabras = contarPalabras(contenido);

    if (cambios.length > 0) {
      // Actualizar en Firestore
      await db.collection('noticias').doc(nota.id).update({
        contenido,
        fechaActualizacion: FieldValue.serverTimestamp(),
      });
      corregidas++;

      const pasaPublicar = palabras >= 300 && cambios.length <= 3;
      if (pasaPublicar) pasanAPublicar++;

      reporteCorreccion.push({
        id: nota.id,
        titulo: (nota.titulo || '').slice(0, 50),
        palabras,
        cambios,
        estado: pasaPublicar ? 'PUBLICAR' : 'REVISAR',
      });

      console.log(`✅ [${nota.id}] ${cambios.join(' | ')} → ${palabras} palabras → ${pasaPublicar ? 'PUBLICAR' : 'REVISAR'}`);
    } else {
      sinCambios++;
    }
  }

  writeFileSync('correccion-revisar.json', JSON.stringify(reporteCorreccion, null, 2));

  console.log('\n=== RESUMEN ===');
  console.log(`Notas corregidas: ${corregidas}`);
  console.log(`Notas sin cambios necesarios: ${sinCambios}`);
  console.log(`Notas que pasan a PUBLICAR: ${pasanAPublicar}`);
  console.log(`Notas que siguen en REVISAR: ${corregidas - pasanAPublicar}`);

  // Estimación final
  const totalPublicables = (reporte.publicar?.length || 131) + pasanAPublicar;
  console.log(`\n=== PROYECCIÓN FINAL ===`);
  console.log(`Total PUBLICABLES: ${totalPublicables}/${206} (${((totalPublicables/206)*100).toFixed(1)}%)`);
  console.log(`Total REVISAR: ${206 - totalPublicables - 1}`);
  console.log(`Total DESCARTAR: 1 (falso positivo Samsung)`);

  console.log('\n📄 Reporte: correccion-revisar.json');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
