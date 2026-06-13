#!/usr/bin/env node
// auditoria-segunda-pasada.mjs — Segunda pasada exhaustiva con clasificación PUBLICAR/REVISAR/DESCARTAR

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
  } catch {
    // Fallback variables entorno
  }
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Faltan credenciales');
  }
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

// ─── DETECTORES ───

function detectarDatosInseguros(texto) {
  const hallazgos = [];
  const textoPlano = texto.replace(/<[^>]*>/g, ' ').toLowerCase();

  // Datos repetidos sin contexto claro
  const cifrasSospechosas = [
    { patron: /\b8%\b/g, nombre: '8%', contexto: /(?:aumento|incremento|subio|bajo|disminuy[oó]|creci[oó]|descendi[oó]|por ciento).{0,30}\b8\b/ },
    { patron: /\b5,?000\b/g, nombre: '5,000', contexto: /(?:pago|inversi[oó]n|monto|valor|costo|precio|cantidad).{0,30}\b5,?000\b/ },
    { patron: /\b50,?000\b/g, nombre: '50,000', contexto: /(?:pago|inversi[oó]n|monto|valor|costo|precio|cantidad).{0,30}\b50,?000\b/ },
    { patron: /\b1234\b/g, nombre: '1234', contexto: null }, // Siempre sospechoso
    { patron: /\b2,?000\b/g, nombre: '2,000', contexto: /(?:pago|inversi[oó]n|monto|valor|costo|precio|cantidad).{0,30}\b2,?000\b/ },
    { patron: /\b45,?000\b/g, nombre: '45,000', contexto: /(?:pago|inversi[oó]n|monto|valor|costo|precio|cantidad).{0,30}\b45,?000\b/ },
    { patron: /\b1,?000\b/g, nombre: '1,000', contexto: /(?:pago|inversi[oó]n|monto|valor|costo|precio|cantidad).{0,30}\b1,?000\b/ },
    { patron: /\b20,?000\b/g, nombre: '20,000', contexto: /(?:pago|inversi[oó]n|monto|valor|costo|precio|cantidad).{0,30}\b20,?000\b/ },
    { patron: /\b12,?000\b/g, nombre: '12,000', contexto: /(?:pago|inversi[oó]n|monto|valor|costo|precio|cantidad).{0,30}\b12,?000\b/ },
    { patron: /\b10,?000\b/g, nombre: '10,000', contexto: /(?:pago|inversi[oó]n|monto|valor|costo|precio|cantidad).{0,30}\b10,?000\b/ },
  ];

  cifrasSospechosas.forEach(({ patron, nombre, contexto }) => {
    const matches = texto.match(patron);
    if (matches && matches.length > 0) {
      // Verificar si tiene contexto que lo valide
      if (contexto) {
        const tieneContexto = contexto.test(texto.toLowerCase());
        if (!tieneContexto) {
          hallazgos.push(`Cifra sospechosa sin contexto: ${nombre}`);
        }
      } else {
        hallazgos.push(`Cifra genérica: ${nombre}`);
      }
    }
  });

  return hallazgos;
}

function detectarPlacasSospechosas(texto) {
  const hallazgos = [];
  const placas = texto.match(/\b[A-Z]\s*\d{1,3}\b/g) || [];
  // Placas de 1-3 dígitos son muy genéricas (M 123, M 789)
  placas.forEach(p => {
    const numParte = p.replace(/\D/g, '');
    if (numParte.length <= 3 && parseInt(numParte) < 1000) {
      hallazgos.push(`Placa genérica: ${p}`);
    }
  });
  return [...new Set(hallazgos)];
}

function detectarFechasHistoricas(texto) {
  const hallazgos = [];
  const textoPlano = texto.replace(/<[^>]*>/g, ' ');

  // Buscar años 2020-2025 y verificar si son históricos o de evento actual
  const matches = textoPlano.match(/\b202[0-5]\b/g) || [];
  matches.forEach(año => {
    const idx = textoPlano.indexOf(año);
    const contexto = textoPlano.slice(Math.max(0, idx - 50), idx + 50);
    const lowerContexto = contexto.toLowerCase();

    // Verificar si es contexto histórico válido
    const esHistorico =
      /ley\s+\d+/.test(lowerContexto) || // Ley 431 de 2020
      /desde\s+\d{4}/.test(lowerContexto) || // desde 2020
      /hasta\s+\d{4}/.test(lowerContexto) || // hasta 2023
      /en\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de/.test(lowerContexto) ||
      /en\s+\d{4}/.test(lowerContexto) || // evento ocurrido en 2024
      /antecedente/.test(lowerContexto) ||
      /hist[oó]rico/.test(lowerContexto) ||
      /registr[oó]/.test(lowerContexto) ||
      /ocurri[oó]/.test(lowerContexto);

    if (!esHistorico) {
      hallazgos.push(`Año ${año} sin contexto histórico verificable`);
    }
  });

  return [...new Set(hallazgos)];
}

function detectarCitasRestantes(texto) {
  const hallazgos = [];
  const textoPlano = texto.replace(/<[^>]*>/g, ' ').toLowerCase();

  const citas = [
    'informó un portavoz',
    'según fuentes',
    'según datos oficiales',
    'según informes',
    'según fuentes oficiales',
    'de acuerdo a fuentes',
    'fuentes señalaron',
    'testigos comentaron',
  ];

  citas.forEach(cita => {
    if (textoPlano.includes(cita)) {
      hallazgos.push(`Cita sin atribución: "${cita}"`);
    }
  });

  return hallazgos;
}

function detectarHospitalesSinFuente(texto) {
  const hallazgos = [];
  const hospitales = ['Hospital Alemán Nicaragüense', 'Hospital Bautista', 'Hospital Vélez Paiz', 'Instituto de Medicina Legal'];
  hospitales.forEach(h => {
    const regex = new RegExp(h.replace(/[áéíóú]/gi, '[aáeéiíoóuú]'), 'gi');
    if (regex.test(texto)) {
      // Verificar si hay contexto que valide el traslato ("fueron trasladados", "recibió atención")
      const idx = texto.toLowerCase().indexOf(h.toLowerCase());
      const contexto = texto.slice(Math.max(0, idx - 100), idx + 100).toLowerCase();
      const tieneContextoValido = /traslad|atenci[oó]n|m[eé]dic|herid|fallec/i.test(contexto);
      if (!tieneContextoValido) {
        hallazgos.push(`Hospital sin contexto médico: ${h}`);
      }
    }
  });
  return hallazgos;
}

function calcularConfiabilidad(hallazgos, palabras) {
  const peso = hallazgos.length;
  if (peso === 0 && palabras >= 350) return { nivel: 'ALTO', accion: 'PUBLICAR' };
  if (peso <= 2 && palabras >= 300) return { nivel: 'MEDIO', accion: 'REVISAR' };
  if (peso <= 5 && palabras >= 200) return { nivel: 'BAJO', accion: 'REVISAR' };
  return { nivel: 'BAJO', accion: 'DESCARTAR' };
}

function contarPalabras(texto) {
  const limpio = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio.split(' ').filter(w => w.length > 0).length;
}

// ─── MAIN ───
async function main() {
  console.log('🧹 SEGUNDA PASADA — Auditoría exhaustiva 206 noticias\n');

  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  const noticias = [];
  snapshot.forEach(doc => {
    noticias.push({ id: doc.id, ...doc.data() });
  });

  const reporte = {
    total: noticias.length,
    publicar: [],
    revisar: [],
    descartar: [],
    hallazgosGlobales: {},
    topErrores: [],
  };

  let count = 0;

  for (const nota of noticias) {
    count++;
    const contenido = nota.contenido || '';
    const palabras = contarPalabras(contenido);

    const hallazgos = [
      ...detectarDatosInseguros(contenido),
      ...detectarPlacasSospechosas(contenido),
      ...detectarFechasHistoricas(contenido),
      ...detectarCitasRestantes(contenido),
      ...detectarHospitalesSinFuente(contenido),
    ];

    const { nivel, accion } = calcularConfiabilidad(hallazgos, palabras);

    const resultado = {
      id: nota.id,
      titulo: (nota.titulo || '').slice(0, 60),
      palabras,
      confiabilidad: nivel,
      accion,
      hallazgos,
    };

    if (accion === 'PUBLICAR') reporte.publicar.push(resultado);
    else if (accion === 'REVISAR') reporte.revisar.push(resultado);
    else reporte.descartar.push(resultado);

    // Acumular hallazgos globales
    hallazgos.forEach(h => {
      reporte.hallazgosGlobales[h] = (reporte.hallazgosGlobales[h] || 0) + 1;
    });

    if (count % 50 === 0) {
      console.log(`Procesadas ${count}/${noticias.length}...`);
    }
  }

  // Top 20 errores más frecuentes
  reporte.topErrores = Object.entries(reporte.hallazgosGlobales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // Guardar reporte
  writeFileSync('auditoria-segunda-pasada.json', JSON.stringify(reporte, null, 2));

  // ─── SALIDA CONSOLA ───
  console.log('\n=== REPORTE GLOBAL ===');
  console.log(`Total procesadas: ${reporte.total}`);
  console.log(`✅ PUBLICAR: ${reporte.publicar.length} (${((reporte.publicar.length/reporte.total)*100).toFixed(1)}%)`);
  console.log(`⚠️  REVISAR: ${reporte.revisar.length} (${((reporte.revisar.length/reporte.total)*100).toFixed(1)}%)`);
  console.log(`❌ DESCARTAR: ${reporte.descartar.length} (${((reporte.descartar.length/reporte.total)*100).toFixed(1)}%)`);

  console.log('\n=== TOP 20 ERRORES MÁS FRECUENTES ===');
  reporte.topErrores.forEach(([error, count], i) => {
    console.log(`${i+1}. ${error}: ${count} notas`);
  });

  console.log('\n=== ESTIMACIÓN DE RIESGO ===');
  const riesgoGN = reporte.descartar.length > 20 ? 'ALTO' : reporte.descartar.length > 5 ? 'MEDIO' : 'BAJO';
  const riesgoDiscover = reporte.revisar.length > 50 ? 'ALTO' : reporte.revisar.length > 20 ? 'MEDIO' : 'BAJO';
  const riesgoAdSense = (reporte.descartar.length + reporte.revisar.length) > 100 ? 'ALTO' : 'MEDIO';
  console.log(`Google News: ${riesgoGN}`);
  console.log(`Google Discover: ${riesgoDiscover}`);
  console.log(`AdSense: ${riesgoAdSense}`);

  console.log('\n=== NOTAS A DESCARTAR (Top 10) ===');
  reporte.descartar.slice(0, 10).forEach(n => {
    console.log(`❌ [${n.id}] ${n.titulo} (${n.palabras} palabras)`);
    console.log(`   Errores: ${n.hallazgos.join('; ')}`);
  });

  console.log('\n📄 Reporte detallado: auditoria-segunda-pasada.json');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
