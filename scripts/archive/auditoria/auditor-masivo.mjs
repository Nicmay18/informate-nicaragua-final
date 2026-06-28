#!/usr/bin/env node
// auditor-masivo.mjs — Auditoría forense editorial de lote masivo
// Analiza todas las noticias de Firestore y detecta patrones de errores de IA

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Inicializar Firebase Admin ───
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);

  // Intentar archivo de credenciales local primero
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {
    // Fallback a variables de entorno
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
    throw new Error('Faltan credenciales: crear scripts/firebase-admin-key.json o definir variables FIREBASE_*');
  }

  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

// ─── DICCIONARIOS DE DETECCIÓN ───
const FECHAS_INCORRECTAS = /\b202[0-5]\b/g; // años 2020-2025
const AÑO_CORRECTO = 2026;

const FRASES_IA = [
  'asimismo', 'por otro lado', 'de igual manera', 'en ese sentido',
  'cabe señalar', 'es importante destacar', 'vale la pena mencionar',
  'resulta fundamental', 'resulta evidente', 'no cabe duda',
  'en conclusión', 'en resumen', 'las autoridades reiteraron',
  'se espera que', 'continúan las investigaciones', 'se mantienen operativos',
  'por su parte', 'en última instancia', 'a fin de cuentas',
  'en el marco de', 'desde esta perspectiva', 'en el contexto de'
];

const CITAS_SOSPECHOSAS = [
  'informó un portavoz', 'según fuentes', 'según informes',
  'fuentes señalaron', 'testigos dijeron', 'vecinos comentaron',
  'la población indicó', 'según datos oficiales', 'de acuerdo a informes'
];

const DATOS_SOSPECHOSOS = [
  '45,000', '12,000', '8%', '3.2%', '1234', '555',
  '1,000', '2,000', '5,000', '10,000', '20,000', '50,000'
];

const PLACA_PATRON = /\b[A-Z]{1,2}\s*\d{3,6}\b/g;
const ESTADISTICA_PATRON = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?%?\b/g;
const LEY_PATRON = /\b(Ley\s+\d+|Código\s+\w+|Decreto\s+\d+)\b/gi;

// ─── FUNCIONES DE ANÁLISIS ───

function contarPalabras(texto) {
  const limpio = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio.split(' ').filter(w => w.length > 0).length;
}

function extraerLead(texto) {
  const parrafos = texto.match(/<p>(.*?)<\/p>/g) || [];
  for (const p of parrafos) {
    const textoP = p.replace(/<[^>]*>/g, '').trim();
    const palabras = textoP.split(' ').filter(w => w.length > 0).length;
    if (palabras > 5) return { texto: textoP, palabras };
  }
  return { texto: '', palabras: 0 };
}

function detectarFechasIncorrectas(texto) {
  const matches = texto.match(FECHAS_INCORRECTAS) || [];
  return [...new Set(matches)];
}

function detectarFrasesIA(texto) {
  const encontradas = [];
  const lower = texto.toLowerCase();
  FRASES_IA.forEach(frase => {
    if (lower.includes(frase)) encontradas.push(frase);
  });
  return encontradas;
}

function detectarCitasSospechosas(texto) {
  const encontradas = [];
  const lower = texto.toLowerCase();
  CITAS_SOSPECHOSAS.forEach(cita => {
    if (lower.includes(cita)) encontradas.push(cita);
  });
  return encontradas;
}

function detectarDatosSospechosos(texto) {
  const encontrados = [];
  DATOS_SOSPECHOSOS.forEach(dato => {
    if (texto.includes(dato)) encontrados.push(dato);
  });
  return encontrados;
}

function extraerPlacas(texto) {
  return texto.match(PLACA_PATRON) || [];
}

function extraerEstadisticas(texto) {
  return texto.match(ESTADISTICA_PATRON) || [];
}

function extraerLeyes(texto) {
  return texto.match(LEY_PATRON) || [];
}

function calcularNivel(palabras, h2s, blockquotes, frasesIA, citasSos, fechasMal) {
  let erroresCriticos = fechasMal.length;
  let erroresAltos = 0;
  let erroresMedios = frasesIA.length + citasSos.length;
  let erroresBajos = 0;

  if (palabras < 500) erroresAltos++;
  if (h2s < 2) erroresAltos++;
  if (blockquotes < 1) erroresAltos++;

  if (erroresCriticos > 0) return { nivel: 'CRITICO', erroresCriticos, erroresAltos, erroresMedios, erroresBajos };
  if (erroresAltos > 2) return { nivel: 'ALTO', erroresCriticos, erroresAltos, erroresMedios, erroresBajos };
  if (erroresMedios > 3) return { nivel: 'MEDIO', erroresCriticos, erroresAltos, erroresMedios, erroresBajos };
  if (erroresBajos > 0) return { nivel: 'BAJO', erroresCriticos, erroresAltos, erroresMedios, erroresBajos };
  return { nivel: 'APROBADO', erroresCriticos, erroresAltos, erroresMedios, erroresBajos };
}

// ─── MAIN ───
async function main() {
  console.log('🔍 AUDITORÍA FORENSE MASIVA — Nicaragua Infórmate');
  console.log('Conectando a Firestore...\n');

  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  const noticias = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    noticias.push({ id: doc.id, ...data });
  });

  console.log(`Total de noticias analizadas: ${noticias.length}\n`);

  // ─── ACUMULADORES ───
  const resultados = {
    aprobadas: 0,
    critico: 0,
    alto: 0,
    medio: 0,
    bajo: 0,
    fechasIncorrectas: {}, // año -> { count, notas: [] }
    frasesIATotal: {},
    citasSospechosasTotal: {},
    datosSospechososTotal: {},
    placasTotal: {},
    leyesSinFuente: [],
    notasProblematicas: [],
    grupoA: [], // listas
    grupoB: [], // correcciones simples
    grupoC: [], // revisión editorial
    grupoD: [], // contaminadas por IA
  };

  // ─── ANÁLISIS POR NOTICIA ───
  for (const nota of noticias) {
    const contenido = nota.contenido || '';
    const titulo = nota.titulo || '';
    const id = nota.id || nota.slug || titulo.slice(0, 30);

    const palabras = contarPalabras(contenido);
    const lead = extraerLead(contenido);
    const h2s = (contenido.match(/<h2>/gi) || []).length;
    const blockquotes = (contenido.match(/<blockquote>/gi) || []).length;
    const fechasMal = detectarFechasIncorrectas(contenido);
    const frasesIA = detectarFrasesIA(contenido);
    const citasSos = detectarCitasSospechosas(contenido);
    const datosSos = detectarDatosSospechosos(contenido);
    const placas = extraerPlacas(contenido);
    const leyes = extraerLeyes(contenido);

    const { nivel, erroresCriticos, erroresAltos, erroresMedios, erroresBajos } = calcularNivel(
      palabras, h2s, blockquotes, frasesIA, citasSos, fechasMal
    );

    // Clasificar
    if (nivel === 'APROBADO') {
      resultados.aprobadas++;
      resultados.grupoA.push({ id, titulo });
    } else if (nivel === 'CRITICO') {
      resultados.critico++;
      resultados.grupoD.push({ id, titulo, errores: `Fechas incorrectas: ${fechasMal.join(', ')}` });
    } else if (nivel === 'ALTO') {
      resultados.alto++;
      resultados.grupoC.push({ id, titulo, errores: `Palabras: ${palabras}, H2: ${h2s}, BQ: ${blockquotes}` });
    } else if (nivel === 'MEDIO') {
      resultados.medio++;
      resultados.grupoB.push({ id, titulo, errores: `Frases IA: ${frasesIA.length}, Citas sos: ${citasSos.length}` });
    } else {
      resultados.bajo++;
      resultados.grupoB.push({ id, titulo });
    }

    // Acumular fechas incorrectas
    fechasMal.forEach(año => {
      if (!resultados.fechasIncorrectas[año]) resultados.fechasIncorrectas[año] = { count: 0, notas: [] };
      resultados.fechasIncorrectas[año].count++;
      resultados.fechasIncorrectas[año].notas.push(id);
    });

    // Acumular frases de IA
    frasesIA.forEach(f => {
      resultados.frasesIATotal[f] = (resultados.frasesIATotal[f] || 0) + 1;
    });

    // Acumular citas sospechosas
    citasSos.forEach(c => {
      resultados.citasSospechosasTotal[c] = (resultados.citasSospechosasTotal[c] || 0) + 1;
    });

    // Acumular datos sospechosos
    datosSos.forEach(d => {
      resultados.datosSospechososTotal[d] = (resultados.datosSospechososTotal[d] || 0) + 1;
    });

    // Acumular placas
    placas.forEach(p => {
      resultados.placasTotal[p] = (resultados.placasTotal[p] || 0) + 1;
    });

    // Leyes sin contexto
    if (leyes.length > 0 && !/según|de acuerdo con|establece la/i.test(contenido)) {
      resultados.leyesSinFuente.push({ id, titulo, leyes });
    }

    // Notas más problemáticas
    const scoreProblemas = erroresCriticos * 10 + erroresAltos * 5 + erroresMedios * 2 + erroresBajos;
    if (scoreProblemas > 5) {
      resultados.notasProblematicas.push({ id, titulo, score: scoreProblemas, nivel });
    }
  }

  // ─── REPORTE ───
  console.log('=== RESUMEN EJECUTIVO ===');
  console.log(`Total de noticias analizadas: ${noticias.length}`);
  console.log(`Noticias aprobadas: ${resultados.aprobadas}`);
  console.log(`Noticias con errores CRÍTICOS: ${resultados.critico}`);
  console.log(`Noticias con errores ALTOS: ${resultados.alto}`);
  console.log(`Noticias con errores MEDIOS: ${resultados.medio}`);
  console.log(`Noticias con errores BAJOS: ${resultados.bajo}`);
  console.log('');

  console.log('=== FECHAS INCORRECTAS ===');
  Object.entries(resultados.fechasIncorrectas).forEach(([año, data]) => {
    console.log(`Año ${año}: ${data.count} notas afectadas`);
    console.log(`  IDs: ${data.notas.slice(0, 5).join(', ')}${data.notas.length > 5 ? '...' : ''}`);
  });
  console.log('');

  console.log('=== FRASES DE IA MÁS REPETIDAS ===');
  const frasesRanking = Object.entries(resultados.frasesIATotal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  frasesRanking.forEach(([frase, count]) => {
    console.log(`  "${frase}": ${count} veces`);
  });
  console.log('');

  console.log('=== CITAS SOSPECHOSAS ===');
  const citasRanking = Object.entries(resultados.citasSospechosasTotal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  citasRanking.forEach(([cita, count]) => {
    console.log(`  "${cita}": ${count} veces`);
  });
  console.log('');

  console.log('=== DATOS SOSPECHOSOS ===');
  const datosRanking = Object.entries(resultados.datosSospechososTotal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  datosRanking.forEach(([dato, count]) => {
    console.log(`  "${dato}": ${count} veces`);
  });
  console.log('');

  console.log('=== PLACAS DETECTADAS ===');
  const placasRanking = Object.entries(resultados.placasTotal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  placasRanking.forEach(([placa, count]) => {
    console.log(`  "${placa}": ${count} veces`);
  });
  console.log('');

  console.log('=== CLASIFICACIÓN ===');
  console.log(`GRUPO A (Listas para publicar): ${resultados.grupoA.length} notas`);
  console.log(`GRUPO B (Correcciones simples): ${resultados.grupoB.length} notas`);
  console.log(`GRUPO C (Revisión editorial): ${resultados.grupoC.length} notas`);
  console.log(`GRUPO D (Contaminadas por IA): ${resultados.grupoD.length} notas`);
  console.log('');

  console.log('=== NOTICIAS MÁS PROBLEMÁTICAS (Top 10) ===');
  resultados.notasProblematicas
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .forEach((n, i) => {
      console.log(`${i+1}. [${n.nivel}] ${n.id} — Score: ${n.score}`);
    });
  console.log('');

  console.log('=== ESTIMACIÓN DE CONTAMINACIÓN IA ===');
  const contaminacion = Math.round(((resultados.critico + resultados.alto + resultados.medio) / noticias.length) * 100);
  console.log(`Porcentaje estimado de noticias con errores IA: ${contaminacion}%`);
  console.log('');

  console.log('=== RIESGOS ===');
  console.log(`Google News: ${resultados.critico > 10 ? 'ALTO' : resultados.critico > 0 ? 'MEDIO' : 'BAJO'}`);
  console.log(`Google Discover: ${resultados.alto > 20 ? 'ALTO' : resultados.alto > 5 ? 'MEDIO' : 'BAJO'}`);
  console.log(`AdSense: ${resultados.critico + resultados.alto > 30 ? 'ALTO' : 'MEDIO'}`);
  console.log('');

  // Guardar reporte detallado en JSON
  const fs = await import('fs');
  fs.writeFileSync('auditoria-reporte.json', JSON.stringify(resultados, null, 2));
  console.log('📄 Reporte detallado guardado en: auditoria-reporte.json');

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
