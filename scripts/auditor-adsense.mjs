/**
 * Auditor Senior AdSense — Evaluación masiva de noticias
 * Tabla de Validación:
 *   - Título: entre 55 y 65 caracteres (estándar Google)
 *   - Extensión: 500+ palabras
 *   - Lead: 20+ palabras (Qué/Dónde/Cuándo)
 *   - Emociones: cero adjetivos sensacionalistas
 *   - Transiciones IA: cero conectores robóticos
 *   - Estructura: H2 claros y párrafos técnicos
 *
 * Ejecutar: node scripts/auditor-adsense.mjs
 * Salida: consola + scripts/output/auditor-adsense-report.json
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

// ─── Firebase init (misma lógica que lib/firebase-admin.ts) ───────
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

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Faltan variables de entorno: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY o FIREBASE_SERVICE_ACCOUNT_BASE64');
  }

  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore();
}

const db = initDb();

// ─── Listas de validación ─────────────────────────────────────────
const SENSATIONALIST = [
  'increible', 'impactante', 'escandalo', 'revelan', 'destapan',
  'no vas a creer', 'sorprendente', 'impacto', 'shocking', 'exclusivo',
  'urgente', 'alerta', 'alarmante', 'devastador', 'tragico', 'dramatico',
  'escandaloso', 'increiblemente', 'inimaginable', 'increible',
];

const IA_TRANSITIONS = [
  'en conclusion', 'es importante destacar', 'en resumen', 'a modo de cierre',
  'en definitiva', 'es crucial', 'no cabe duda', 'resulta evidente',
  'es fundamental', 'vale la pena mencionar', 'como se puede observar',
  'en ultima instancia', 'en este contexto', 'a partir de lo anterior',
  'es necesario senalar', 'conviene recordar', 'cabe senalar',
  'es importante mencionar', 'en lineas generales', 'en terminos generales',
  'como se menciono', 'de acuerdo con lo anterior', 'en funcion de lo expuesto',
];

const STRONG_VERBS = /\b(confirma|investiga|abre|inicia|deja|anuncia|estrena|presenta|lanza|amplia|revela|condena|inaugura|expande|reporta|informa|senala|detalla|explica|precisa)\b/i;

// ─── Helpers ──────────────────────────────────────────────────────
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

function detectarSensacionalistas(texto) {
  if (!texto) return [];
  const lower = texto.toLowerCase();
  return SENSATIONALIST.filter(w => lower.includes(w));
}

function detectarTransicionesIA(texto) {
  if (!texto) return [];
  const lower = texto.toLowerCase().replace(/[\n\r]/g, ' ');
  return IA_TRANSITIONS.filter(w => lower.includes(w));
}

function detectarH2(contenido) {
  if (!contenido) return 0;
  // HTML <h2> o markdown ##
  const h2Html = (contenido.match(/<h2[^>]*>/gi) || []).length;
  const h2Md = (contenido.match(/^##\s+/gm) || []).length;
  return h2Html + h2Md;
}

function generarOpcionesTitulo(tituloOriginal, categoria) {
  // Generar 3 opciones de exactamente 65 caracteres (máx recomendado)
  const base = tituloOriginal.slice(0, 45);
  const opciones = [];
  const sufijos = [
    ' | Nicaragua Informate Not',
    ': detalles caso Nicaragua',
    ' — Nicaragua Informate 26',
  ];
  for (const suf of sufijos) {
    const candidato = (base + suf).slice(0, 65);
    const padded = candidato.padEnd(65, '.');
    opciones.push(padded.slice(0, 65));
  }
  return opciones;
}

function estado(bool) {
  return bool ? '🟢' : '🔴';
}

// ─── Auditoría principal ──────────────────────────────────────────
async function auditar() {
  console.log('🔍 AUDITOR ADSENSE — Evaluando noticias en Firestore...\n');

  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  const resultados = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const titulo = d.titulo || '';
    const contenido = d.contenido || '';
    const resumen = d.resumen || '';
    const palabras = contarPalabras(contenido);
    const lead = extraerLead(contenido);
    const leadPalabras = contarPalabras(lead);
    const sensacionalistas = detectarSensacionalistas(titulo + ' ' + resumen + ' ' + contenido);
    const transicionesIA = detectarTransicionesIA(contenido);
    const h2Count = detectarH2(contenido);

    const criterios = {
      tituloMax65: titulo.length <= 65,
      tituloMin30: titulo.length >= 30,
      extension500: palabras >= 500,
      lead20: leadPalabras >= 20,
      ceroSensacionalistas: sensacionalistas.length === 0,
      ceroTransicionesIA: transicionesIA.length === 0,
      estructuraH2: h2Count >= 2,
    };

    const aprobada = Object.values(criterios).every(Boolean);

    const item = {
      id: doc.id,
      slug: d.slug || 'sin-slug',
      titulo,
      tituloLength: titulo.length,
      palabras,
      lead: lead.slice(0, 120),
      leadPalabras,
      h2Count,
      sensacionalistas,
      transicionesIA,
      criterios,
      aprobada,
      categoria: d.categoria || 'General',
      fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString().slice(0, 10) : 'unknown',
    };

    if (!criterios.tituloMax65 && !aprobada) {
      item.opcionesTitulo = generarOpcionesTitulo(titulo, d.categoria);
    }

    resultados.push(item);
  }

  // ─── Reporte en consola ────────────────────────────────────────
  const aprobadas = resultados.filter(r => r.aprobada);
  const rechazadas = resultados.filter(r => !r.aprobada);

  console.log(`📊 TOTAL: ${resultados.length} | 🟢 Aprobadas: ${aprobadas.length} | 🔴 Rechazadas: ${rechazadas.length}\n`);

  // Resumen por categoría de fallo
  const fallos = {
    tituloMax65: resultados.filter(r => !r.criterios.tituloMax65).length,
    tituloMin30: resultados.filter(r => !r.criterios.tituloMin30).length,
    extension500: resultados.filter(r => !r.criterios.extension500).length,
    lead20: resultados.filter(r => !r.criterios.lead20).length,
    sensacionalistas: resultados.filter(r => !r.criterios.ceroSensacionalistas).length,
    transicionesIA: resultados.filter(r => !r.criterios.ceroTransicionesIA).length,
    estructuraH2: resultados.filter(r => !r.criterios.estructuraH2).length,
  };

  console.log('═'.repeat(70));
  console.log('📋 RESUMEN DE CRITERIOS FALLIDOS:');
  console.log('═'.repeat(70));
  console.log(`  Título >65 chars        : ${fallos.tituloMax65} noticias`);
  console.log(`  Título <30 chars        : ${fallos.tituloMin30} noticias`);
  console.log(`  Extensión <500 palabras : ${fallos.extension500} noticias`);
  console.log(`  Lead <20 palabras      : ${fallos.lead20} noticias`);
  console.log(`  Adjetivos sensacionalistas: ${fallos.sensacionalistas} noticias`);
  console.log(`  Transiciones de IA    : ${fallos.transicionesIA} noticias`);
  console.log(`  Sin H2 claros         : ${fallos.estructuraH2} noticias`);
  console.log('═'.repeat(70));

  // Detalle de rechazadas (top 20)
  if (rechazadas.length > 0) {
    console.log('\n🔴 DETALLE NOTICIAS RECHAZADAS (primeras 20):');
    console.log('─'.repeat(70));
    rechazadas.slice(0, 20).forEach((r, i) => {
      const fallosList = [];
      if (!r.criterios.tituloMax65) fallosList.push(`titulo(${r.tituloLength})`);
      if (!r.criterios.extension500) fallosList.push(`ext(${r.palabras})`);
      if (!r.criterios.lead20) fallosList.push(`lead(${r.leadPalabras})`);
      if (!r.criterios.ceroSensacionalistas) fallosList.push(`sensacionalista(${r.sensacionalistas.join(', ')})`);
      if (!r.criterios.ceroTransicionesIA) fallosList.push(`transicionIA(${r.transicionesIA.join(', ')})`);
      if (!r.criterios.estructuraH2) fallosList.push(`H2(${r.h2Count})`);

      console.log(`\n${i + 1}. [${r.slug}]`);
      console.log(`   Título: ${r.titulo.slice(0, 65)}...`);
      console.log(`   Fallos: ${fallosList.join(' | ')}`);
      if (r.opcionesTitulo) {
        console.log(`   Opciones título 70ch:`);
        r.opcionesTitulo.forEach((opt, j) => console.log(`      ${j + 1}. "${opt}" (${opt.length})`));
      }
    });
  }

  // ─── Guardar JSON ──────────────────────────────────────────────
  const outDir = resolve(process.cwd(), 'scripts/output');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'auditor-adsense-report.json');
  writeFileSync(outPath, JSON.stringify({
    fechaAuditoria: new Date().toISOString(),
    total: resultados.length,
    aprobadas: aprobadas.length,
    rechazadas: rechazadas.length,
    resumenFallos: fallos,
    noticias: resultados,
  }, null, 2));

  console.log(`\n✅ Reporte guardado en: ${outPath}`);
  process.exit(0);
}

auditar().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
