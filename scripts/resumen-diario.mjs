/**
 * RESUMEN DIARIO — Lista de tareas SEO/AdSense pendientes
 * Ejecutar: node scripts/resumen-diario.mjs
 * Salida: Consola formateada + scripts/output/resumen-diario.txt
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

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
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore();
}

const db = initDb();

function contarPalabras(texto) {
  if (!texto) return 0;
  const plain = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.split(/\s+/).filter(Boolean).length;
}

function extraerLead(contenido) {
  if (!contenido) return '';
  const plain = contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const first = plain.match(/[^.!?]+[.!?]+/)?.[0] || plain.slice(0, 200);
  return first.trim();
}

const SENSACIONALISTAS = ['increible', 'impactante', 'escandalo', 'revelan', 'destapan',
  'no vas a creer', 'sorprendente', 'impacto', 'shocking', 'exclusivo',
  'urgente', 'alerta', 'alarmante', 'devastador', 'tragico', 'dramatico',
  'escandaloso', 'increiblemente', 'inimaginable'];

const IA_TRANSITIONS = ['en conclusion', 'es importante destacar', 'en resumen', 'a modo de cierre',
  'en definitiva', 'es crucial', 'no cabe duda', 'resulta evidente',
  'es fundamental', 'vale la pena mencionar', 'como se puede observar',
  'en ultima instancia', 'en este contexto', 'a partir de lo anterior'];

function detectarSensacionalistas(texto) {
  const lower = texto.toLowerCase();
  return SENSACIONALISTAS.filter(w => lower.includes(w));
}

function detectarTransicionesIA(texto) {
  const lower = texto.toLowerCase().replace(/[\n\r]/g, ' ');
  return IA_TRANSITIONS.filter(w => lower.includes(w));
}

async function generarResumen() {
  console.log('📋 GENERANDO RESUMEN DIARIO DE TAREAS...\n');

  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  const noticias = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const titulo = d.titulo || '';
    const contenido = d.contenido || '';
    const palabras = contarPalabras(contenido);
    const lead = extraerLead(contenido);
    const leadPalabras = contarPalabras(lead);
    const sensacionalistas = detectarSensacionalistas(titulo + ' ' + contenido);
    const transicionesIA = detectarTransicionesIA(contenido);

    noticias.push({
      id: doc.id,
      slug: d.slug || 'sin-slug',
      titulo,
      tituloLength: titulo.length,
      palabras,
      leadPalabras,
      sensacionalistas,
      transicionesIA,
      categoria: d.categoria || 'General',
      fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString().slice(0, 10) : 'unknown',
    });
  }

  // ─── Clasificación ────────────────────────────────────────────
  const titulosLargos = noticias.filter(n => n.tituloLength > 65);
  const titulosCortos = noticias.filter(n => n.tituloLength < 30);
  const thinContent = noticias.filter(n => n.palabras < 500);
  const leadCorto = noticias.filter(n => n.leadPalabras < 20);
  const conSensacionalistas = noticias.filter(n => n.sensacionalistas.length > 0);
  const conTransicionesIA = noticias.filter(n => n.transicionesIA.length > 0);

  // ─── Output a consola ─────────────────────────────────────────
  let output = '';
  const line = (text) => { console.log(text); output += text + '\n'; };

  line('╔════════════════════════════════════════════════════════════════════════════╗');
  line('║           RESUMEN DIARIO — TAREAS SEO/ADSENSE PENDIENTES                 ║');
  line('╚════════════════════════════════════════════════════════════════════════════╝');
  line('');
  line(`📊 TOTAL NOTICIAS: ${noticias.length}`);
  line('');

  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 1: TÍTULOS LARGOS (>65) — PRIORIDAD ALTA
  // ═══════════════════════════════════════════════════════════════
  line('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  line(`┃ 🔴 PRIORIDAD 1: TÍTULOS LARGOS (>65 caracteres) — ${titulosLargos.length} noticias     ┃`);
  line('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  line('');
  line('Estos títulos se truncarán en Google con "...". Corregir primero.');
  line('');
  if (titulosLargos.length === 0) {
    line('✅ Ninguno. ¡Perfecto!');
  } else {
    titulosLargos.forEach((n, i) => {
      line(`${String(i + 1).padStart(2, '0')}. [${n.slug}]`);
      line(`    Título (${n.tituloLength}): "${n.titulo}"`);
      line('');
    });
  }
  line('');

  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 2: THIN CONTENT (<500 palabras)
  // ═══════════════════════════════════════════════════════════════
  line('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  line(`┃ 🔴 PRIORIDAD 2: THIN CONTENT (<500 palabras) — ${thinContent.length} noticias          ┃`);
  line('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  line('');
  line('Opciones: A) Expandir a 500+ palabras  B) Aplicar noindex  C) Eliminar');
  line('');
  if (thinContent.length === 0) {
    line('✅ Ninguna. ¡Perfecto!');
  } else {
    thinContent.forEach((n, i) => {
      line(`${String(i + 1).padStart(2, '0')}. [${n.slug}] (${n.palabras} palabras)`);
      line(`    "${n.titulo.slice(0, 60)}..."`);
      line('');
    });
  }
  line('');

  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 3: SENSACIONALISTAS
  // ═══════════════════════════════════════════════════════════════
  line('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  line(`┃ 🟡 PRIORIDAD 3: ADJETIVOS SENSACIONALISTAS — ${conSensacionalistas.length} noticias     ┃`);
  line('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  line('');
  line('Reemplazar palabras como: impacto, alerta, devastador, dramático, etc.');
  line('');
  if (conSensacionalistas.length === 0) {
    line('✅ Ninguna. ¡Perfecto!');
  } else {
    conSensacionalistas.slice(0, 30).forEach((n, i) => {
      line(`${String(i + 1).padStart(2, '0')}. [${n.slug}]`);
      line(`    Palabras: ${n.sensacionalistas.join(', ')}`);
      line(`    "${n.titulo.slice(0, 60)}..."`);
      line('');
    });
    if (conSensacionalistas.length > 30) {
      line(`    ... y ${conSensacionalistas.length - 30} más.`);
    }
  }
  line('');

  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 4: LEAD CORTO (<20 palabras)
  // ═══════════════════════════════════════════════════════════════
  line('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  line(`┃ 🟡 PRIORIDAD 4: LEAD CORTO (<20 palabras) — ${leadCorto.length} noticias           ┃`);
  line('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  line('');
  if (leadCorto.length === 0) {
    line('✅ Ninguno. ¡Perfecto!');
  } else {
    leadCorto.forEach((n, i) => {
      line(`${String(i + 1).padStart(2, '0')}. [${n.slug}] (${n.leadPalabras} palabras)`);
      line(`    "${n.titulo.slice(0, 60)}..."`);
      line('');
    });
  }
  line('');

  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 5: TRANSICIONES DE IA
  // ═══════════════════════════════════════════════════════════════
  line('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  line(`┃ 🟢 PRIORIDAD 5: TRANSICIONES DE IA — ${conTransicionesIA.length} noticias               ┃`);
  line('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  line('');
  if (conTransicionesIA.length === 0) {
    line('✅ Ninguna. ¡Perfecto!');
  } else {
    conTransicionesIA.forEach((n, i) => {
      line(`${String(i + 1).padStart(2, '0')}. [${n.slug}]`);
      line(`    Frases: ${n.transicionesIA.join(', ')}`);
      line(`    "${n.titulo.slice(0, 60)}..."`);
      line('');
    });
  }
  line('');

  // ═══════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ═══════════════════════════════════════════════════════════════
  line('╔════════════════════════════════════════════════════════════════════════════╗');
  line('║                         RESUMEN EJECUTIVO                                ║');
  line('╚════════════════════════════════════════════════════════════════════════════╝');
  line('');
  line(`🔴 Títulos largos (>65)     : ${titulosLargos.length}`);
  line(`🔴 Thin content (<500)      : ${thinContent.length}`);
  line(`🟡 Sensacionalistas         : ${conSensacionalistas.length}`);
  line(`🟡 Lead corto (<20)         : ${leadCorto.length}`);
  line(`🟢 Transiciones IA          : ${conTransicionesIA.length}`);
  line(`🔵 Títulos cortos (<30)     : ${titulosCortos.length} (baja prioridad)`);
  line('');
  line('━'.repeat(80));
  line('ORDEN DE TRABAJO RECOMENDADO:');
  line('  1. Corregir títulos largos (panel de admin)');
  line('  2. Expandir o aplicar noindex a thin content');
  line('  3. Revisar sensacionalistas en nuevas noticias');
  line('━'.repeat(80));

  // ─── Guardar archivo txt ──────────────────────────────────────
  const outDir = resolve(process.cwd(), 'scripts/output');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'resumen-diario.txt');
  writeFileSync(outPath, output, 'utf8');

  console.log(`\n✅ Resumen guardado en: ${outPath}`);
  console.log('   Puedes abrirlo con: cat scripts/output/resumen-diario.txt');
  process.exit(0);
}

generarResumen().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
