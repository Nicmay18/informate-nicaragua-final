#!/usr/bin/env node
// validacion-correcta.mjs — Validación con regex de placas corregida

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

function validarNoticia(contenido) {
  const errores = [];
  const texto = contenido.toLowerCase();
  const textoSinHtml = texto.replace(/<[^>]*>/g, ' ');

  // 1. Frases IA
  const frasesIA = [
    'asimismo', 'por otro lado', 'de igual manera', 'en ese sentido',
    'cabe señalar', 'es importante destacar', 'vale la pena mencionar',
    'resulta fundamental', 'resulta evidente', 'no cabe duda',
    'en conclusión', 'en resumen', 'las autoridades reiteraron',
    'se espera que', 'continúan las investigaciones', 'se mantienen operativos',
    'por su parte', 'en última instancia', 'a fin de cuentas',
    'en el marco de', 'desde esta perspectiva', 'en el contexto de'
  ];
  frasesIA.forEach(f => {
    if (texto.includes(f)) errores.push(`Frase IA: ${f}`);
  });

  // 2. Citas genéricas
  if (/según fuentes(?!\s+oficiales\s+de)/.test(texto)) errores.push('Cita: "según fuentes"');
  if (/informó un portavoz/.test(texto)) errores.push('Cita: "informó un portavoz"');
  if (/según datos oficiales/.test(texto)) errores.push('Cita: "según datos oficiales"');
  if (/según informes/.test(texto)) errores.push('Cita: "según informes"');

  // 3. Números genéricos
  if (/\b1234\b/.test(texto)) errores.push('Número genérico: 1234');

  // 4. Placas genéricas — solo letras de departamento seguidas de 3-6 dígitos
  // Patrones reales de placas nicaragüenses: M 123456, CT 12345, MT 80953, etc.
  const placasSospechosas = [];
  const regexPlacas = /\b(M|CT|MT|GR|LE|CH|JI|RI|CA|BO|NS|RSJ|CN|M|B|A)\s*\d{1,6}\b/gi;
  let match;
  while ((match = regexPlacas.exec(textoSinHtml)) !== null) {
    const numParte = match[0].replace(/\D/g, '');
    const letraParte = match[0].replace(/\d/g, '').trim();
    // Placas con 1-2 dígitos son muy sospechosas
    if (numParte.length <= 2) {
      // Verificar contexto de vehículo
      const ventana = 60;
      const inicio = Math.max(0, match.index - ventana);
      const fin = Math.min(textoSinHtml.length, match.index + ventana);
      const contexto = textoSinHtml.slice(inicio, fin);
      if (/placa|matr[ií]cula|veh[ií]culo|motocicleta|conduc|accident|impact|choc|colisi[oó]n/.test(contexto)) {
        placasSospechosas.push(match[0]);
      }
    }
  }
  if (placasSospechosas.length > 0) {
    errores.push(`Placas genéricas: ${[...new Set(placasSospechosas)].join(', ')}`);
  }

  return errores;
}

function contarPalabras(texto) {
  const limpio = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio.split(' ').filter(w => w.length > 0).length;
}

async function main() {
  console.log('🔍 VALIDACIÓN CORRECTA — Post-limpieza\n');

  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  const noticias = [];
  snapshot.forEach(doc => {
    noticias.push({ id: doc.id, ...doc.data() });
  });

  let publicar = 0;
  let revisar = 0;
  let descartar = 0;
  const reporte = [];

  for (const nota of noticias) {
    const errores = validarNoticia(nota.contenido || '');
    const palabras = contarPalabras(nota.contenido || '');

    let accion, nivel;
    if (errores.length === 0 && palabras >= 300) {
      accion = 'PUBLICAR';
      nivel = 'ALTO';
      publicar++;
    } else if (errores.length <= 2 && palabras >= 250) {
      accion = 'PUBLICAR';
      nivel = 'MEDIO';
      publicar++;
    } else if (palabras < 150) {
      accion = 'DESCARTAR';
      nivel = 'BAJO';
      descartar++;
    } else {
      accion = 'REVISAR';
      nivel = 'MEDIO';
      revisar++;
    }

    reporte.push({
      id: nota.id,
      titulo: (nota.titulo || '').slice(0, 50),
      palabras,
      errores,
      nivel,
      accion,
    });
  }

  writeFileSync('validacion-correcta.json', JSON.stringify(reporte, null, 2));

  console.log(`=== RESULTADOS ===`);
  console.log(`Total: ${noticias.length}`);
  console.log(`✅ PUBLICAR: ${publicar} (${((publicar/noticias.length)*100).toFixed(1)}%)`);
  console.log(`⚠️  REVISAR: ${revisar} (${((revisar/noticias.length)*100).toFixed(1)}%)`);
  console.log(`❌ DESCARTAR: ${descartar} (${((descartar/noticias.length)*100).toFixed(1)}%)`);

  // Mostrar errores más comunes
  const erroresGlobal = {};
  reporte.forEach(r => {
    r.errores.forEach(e => {
      erroresGlobal[e] = (erroresGlobal[e] || 0) + 1;
    });
  });

  console.log('\n=== TOP ERRORES RESTANTES ===');
  Object.entries(erroresGlobal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([e, n], i) => {
      console.log(`${i+1}. ${e}: ${n} notas`);
    });

  // Notas más problemáticas
  console.log('\n=== NOTAS CON MÁS ERRORES (Top 5) ===');
  reporte
    .filter(r => r.errores.length > 0)
    .sort((a, b) => b.errores.length - a.errores.length)
    .slice(0, 5)
    .forEach(r => {
      console.log(`[${r.accion}] ${r.titulo} — ${r.errores.length} errores:`);
      r.errores.forEach(e => console.log(`   - ${e}`));
    });

  console.log('\n📄 Reporte: validacion-correcta.json');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
