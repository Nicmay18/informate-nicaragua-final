/**
 * PULIR MASIVO — Limpia IA/relleno + agrega <strong> y <blockquote>
 * Ejecutar: node scripts/pulir-masivo.mjs         (dry-run, preview)
 * Ejecutar: node scripts/pulir-masivo.mjs --apply  (aplica en Firestore)
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const DRY_RUN = !process.argv.includes('--apply');
const BATCH_SIZE = 500;

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

// ─── LISTAS DE LIMPIEZA ─────────────────────────────────────────

const TRANSICIONES_IA = [
  { regex: /en\s+conclusion[,.]?\s*/gi, repl: '' },
  { regex: /es\s+importante\s+destacar\s+(que\s+)?/gi, repl: '' },
  { regex: /vale\s+la\s+pena\s+mencionar\s+(que\s+)?/gi, repl: '' },
  { regex: /no\s+hay\s+que\s+olvidar\s+(que\s+)?/gi, repl: '' },
  { regex: /en\s+el\s+contexto\s+de[\s,]*/gi, repl: '' },
  { regex: /desde\s+esta\s+perspectiva[,.]?\s*/gi, repl: '' },
  { regex: /en\s+ultima\s+instancia[,.]?\s*/gi, repl: '' },
  { regex: /a\s+fin\s+de\s+cuentas[,.]?\s*/gi, repl: '' },
  { regex: /en\s+el\s+marco\s+de[\s,]*/gi, repl: '' },
  { regex: /resulta\s+fundamental\s+(que\s+)?/gi, repl: '' },
  { regex: /resulta\s+evidente\s+(que\s+)?/gi, repl: '' },
  { regex: /no\s+cabe\s+duda\s+(de\s+que\s+)?/gi, repl: '' },
  { regex: /es\s+indiscutible\s+(que\s+)?/gi, repl: '' },
  { regex: /resulta\s+innegable\s+(que\s+)?/gi, repl: '' },
  { regex: /en\s+resumen[,.]?\s*/gi, repl: '' },
  { regex: /en\s+definitiva[,.]?\s*/gi, repl: '' },
  { regex: /para\s+concluir[,.]?\s*/gi, repl: '' },
  { regex: /como\s+se\s+menciono\s+anteriormente[,.]?\s*/gi, repl: '' },
  { regex: /es\s+relevante\s+senalar\s+(que\s+)?/gi, repl: '' },
  { regex: /no\s+se\s+puede\s+ignorar\s+(que\s+)?/gi, repl: '' },
  { regex: /es\s+crucial\s+(que\s+)?/gi, repl: '' },
  { regex: /es\s+vital\s+(que\s+)?/gi, repl: '' },
  { regex: /a\s+su\s+vez[,.]?\s*/gi, repl: '' },
];

const RELLENO_EMO = [
  { regex: /tragedia\s+vial/gi, repl: 'accidente con saldo mortal' },
  { regex: /tr[áa]gic[oa]/gi, repl: '' },
  { regex: /dolorosa\s+situaci[óo]n/gi, repl: 'situaci\u00f3n' },
  { regex: /lamentablemente[\s,]*/gi, repl: '' },
  { regex: /lamentable[\s,]*/gi, repl: '' },
  { regex: /impactante[\s,]*/gi, repl: 'relevante ' },
  { regex: /devastador[\s,]*/gi, repl: 'grave ' },
  { regex: /desgarrador[\s,]*/gi, repl: '' },
  { regex: /horrible[\s,]*/gi, repl: '' },
  { regex: /alarmante[\s,]*/gi, repl: 'preocupante ' },
  { regex: /dram[áa]tic[oa][\s,]*/gi, repl: '' },
  { regex: /cr[íi]tic[oa][\s,]*/gi, repl: 'grave ' },
  { regex: /escalofriante[\s,]*/gi, repl: '' },
  { regex: /incre[íi]ble[\s,]*/gi, repl: '' },
  { regex: /inimaginable[\s,]*/gi, repl: '' },
  { regex: /indignante[\s,]*/gi, repl: '' },
  { regex: /escandaloso[\s,]*/gi, repl: '' },
  { regex: /vergonzoso[\s,]*/gi, repl: '' },
  { regex: /aterrador[\s,]*/gi, repl: '' },
  { regex: /mort[íi]fero[\s,]*/gi, repl: 'letal ' },
  { regex: /sangriento[\s,]*/gi, repl: '' },
  { regex: /brutal[\s,]*/gi, repl: 'grave ' },
  { regex: /salvaje[\s,]*/gi, repl: '' },
  { regex: /violento[\s,]*/gi, repl: '' },
  { regex: /agresivo[\s,]*/gi, repl: '' },
  { regex: /fatal[\s,]*/gi, repl: 'con resultado mortal ' },
  { regex: /horror[\s,]*/gi, repl: '' },
  { regex: /terrible[\s,]*/gi, repl: 'grave ' },
  { regex: /conmocion[óo][\s,]*/gi, repl: '' },
];

// ─── FUNCIONES DE LIMPIEZA ──────────────────────────────────────

function limpiarHTML(texto) {
  if (!texto) return '';
  return texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function limpiarTransicionesIA(contenido) {
  let limpio = contenido;
  let total = 0;
  for (const { regex, repl } of TRANSICIONES_IA) {
    const m = limpio.match(regex);
    if (m) total += m.length;
    limpio = limpio.replace(regex, repl);
  }
  return { contenido: limpio, quitadas: total };
}

function limpiarRellenoEmocional(contenido) {
  let limpio = contenido;
  let total = 0;
  for (const { regex, repl } of RELLENO_EMO) {
    const m = limpio.match(regex);
    if (m) total += m.length;
    limpio = limpio.replace(regex, repl);
  }
  return { contenido: limpio, quitadas: total };
}

// ─── AGREGAR <strong> AUTOMÁTICAMENTE ──────────────────────────

function agregarStrong(contenido) {
  let modificado = contenido;

  // 1. Nombres propios de instituciones nicaragüenses
  const instituciones = [
    'Polic[íi]a Nacional', 'Ministerio de Salud', 'Minsa', 'Ineter',
    'Ministerio de Gobernaci[óo]n', 'Ministerio de Transporte', 'Mti',
    'Ej[ée]rcito de Nicaragua', 'Polic[íi]a', 'Bomberos',
    'Cruz Roja', 'C[ée]sar Salinas', 'CSE', 'Consejo Supremo Electoral',
    'Asamblea Nacional', 'Corte Suprema', 'Ministerio P[úu]blico',
  ];

  for (const inst of instituciones) {
    const regex = new RegExp(`(?<!<strong[^>]*>)(\\b${inst}\\b)(?!</strong>)`, 'gi');
    modificado = modificado.replace(regex, '<strong>$1</strong>');
  }

  // 2. Nombres de lugares comunes en Nicaragua (solo si aparecen como palabra completa)
  const lugares = [
    'Managua', 'Le[óo]n', 'Granada', 'Masaya', 'Rivas', 'Estel[ií]',
    'Chinandega', 'Matagalpa', 'Jinotega', 'Boaco', 'Chontales',
    'Madriz', 'Nueva Segovia', 'R[íi]o San Juan', 'RAAN', 'RAAS',
    'Caribe', 'Corn Island', 'Ometepe', 'Mombacho', 'Xilo[áa]',
    'Laguna de Apoyo', 'San Juan del Sur', 'El J[íi]caro',
    'Somotillo', 'Jinotepe', 'Diriamba', 'Nandaime', 'Rama',
  ];

  for (const lugar of lugares) {
    const regex = new RegExp(`(?<!<strong[^>]*>)(\\b${lugar}\\b)(?!</strong>)`, 'gi');
    modificado = modificado.replace(regex, '<strong>$1</strong>');
  }

  // 3. Cifras y números importantes (años, cantidades, porcentajes)
  // Solo si están solos, no dentro de fechas ya formateadas
  modificado = modificado.replace(
    /(?<!<[^>]*>)(\b\d{1,3}(?:,\d{3})+(?:\.\d+)?|\b\d+\.\d+|\b\d{2,4}\b)\s*(?:libras|kilos|metros|kil[óo]metros|d[óo]lares|c[óo]rdobas|personas|heridos|fallecidos|muertos|afectados|viviendas|a[nñ]os|por ciento|%)\b/gi,
    '<strong>$1</strong> $&'
  );

  // Limpiar dobles <strong>
  modificado = modificado.replace(/<strong>([^<]*)<\/strong>([\s,]*)<strong>([^<]*)<\/strong>/gi, '<strong>$1$2$3</strong>');

  return modificado;
}

// ─── AGREGAR <blockquote> AUTOMÁTICAMENTE ──────────────────────

function agregarBlockquotes(contenido) {
  // Detecta frases como: "informó el Comisionado Salinas." o "dijo la policía en comunicado."
  // Y las envuelve en <blockquote> si no están ya en uno
  let modificado = contenido;

  // Patrón: frase que termina con "dijo/informó/precisó/confirmó/declaró [Nombre] [apellido]."
  const patronesCita = [
    /(?<!<blockquote>\s*)<p>([^<]*(?:dijo|inform[óo]|precis[óo]|confirm[óo]|declar[óo]|explic[óo]|manifest[óo]|se[ñn]al[óo]|indic[óo])\s+(?:el|la|los|las)?\s*[^<]{3,80}\.)<\/p>/gi,
  ];

  for (const regex of patronesCita) {
    modificado = modificado.replace(regex, '<blockquote><p>$1</p></blockquote>');
  }

  return modificado;
}

// ─── MAIN ──────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PULIR MASIVO — Limpieza + Agregar <strong> y <blockquote>');
  console.log(`  MODO: ${DRY_RUN ? 'DRY-RUN (preview)' : 'APLICAR CAMBIOS'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
  console.log(`📡 ${snapshot.docs.length} noticias encontradas\n`);

  const cambios = [];
  const reporte = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const contenidoOriginal = d.contenido || '';

    // Paso 1: Limpiar
    const r1 = limpiarTransicionesIA(contenidoOriginal);
    const r2 = limpiarRellenoEmocional(r1.contenido);

    // Paso 2: Agregar strong
    const conStrong = agregarStrong(r2.contenido);

    // Paso 3: Agregar blockquotes
    const contenidoFinal = agregarBlockquotes(conStrong);

    // Contar cambios
    const strongsAntes = (contenidoOriginal.match(/<strong>/gi) || []).length;
    const strongsDespues = (contenidoFinal.match(/<strong>/gi) || []).length;
    const bqAntes = (contenidoOriginal.match(/<blockquote>/gi) || []).length;
    const bqDespues = (contenidoFinal.match(/<blockquote>/gi) || []).length;

    const huboCambio = contenidoFinal !== contenidoOriginal;

    if (huboCambio) {
      cambios.push({ id: doc.id, slug: d.slug || doc.id, titulo: d.titulo || '', contenidoFinal });

      reporte.push({
        id: doc.id,
        titulo: d.titulo || '',
        slug: d.slug || doc.id,
        iaQuitadas: r1.quitadas,
        rellenoQuitado: r2.quitadas,
        strongsAntes,
        strongsDespues,
        bqAntes,
        bqDespues,
      });
    }
  }

  // ─── RESUMEN ─────────────────────────────────────────────────
  console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log(`┃  RESUMEN DE CAMBIOS (${cambios.length} noticias afectadas)          ┃`);
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');

  const totalIA = reporte.reduce((s, r) => s + r.iaQuitadas, 0);
  const totalRelleno = reporte.reduce((s, r) => s + r.rellenoQuitado, 0);
  const totalStrongNuevos = reporte.reduce((s, r) => s + Math.max(0, r.strongsDespues - r.strongsAntes), 0);
  const totalBqNuevos = reporte.reduce((s, r) => s + Math.max(0, r.bqDespues - r.bqAntes), 0);

  console.log(`  🧹 Frases IA eliminadas:     ${totalIA}`);
  console.log(`  🧹 Palabras relleno quitadas: ${totalRelleno}`);
  console.log(`  💪 <strong> agregados:        ${totalStrongNuevos}`);
  console.log(`  💬 <blockquote> agregados:    ${totalBqNuevos}`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Noticias modificadas:        ${cambios.length}\n`);

  // ─── PREVIEW DE LAS 5 PRIMERAS ─────────────────────────────────
  if (cambios.length > 0) {
    console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    console.log('┃  PREVIEW (primeras 5 noticias)                              ┃');
    console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
    reporte.slice(0, 5).forEach((r, i) => {
      console.log(`\n  ${i + 1}. ${r.titulo.slice(0, 60)}`);
      console.log(`     IA quitadas: ${r.iaQuitadas} | Relleno: ${r.rellenoQuitado}`);
      console.log(`     Strong: ${r.strongsAntes} → ${r.strongsDespues} | Blockquotes: ${r.bqAntes} → ${r.bqDespues}`);
    });
    console.log('');
  }

  // ─── APLICAR ───────────────────────────────────────────────────
  if (!DRY_RUN && cambios.length > 0) {
    console.log(`📝 Aplicando ${cambios.length} correcciones en Firestore...`);

    // Firestore batch max 500
    for (let i = 0; i < cambios.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = cambios.slice(i, i + BATCH_SIZE);
      for (const c of chunk) {
        const ref = db.collection('noticias').doc(c.id);
        batch.update(ref, { contenido: c.contenidoFinal, fechaActualizacion: new Date() });
      }
      await batch.commit();
      console.log(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(cambios.length / BATCH_SIZE)} aplicado`);
    }
    console.log('\n✅ TODAS LAS CORRECCIONES APLICADAS\n');
  } else if (DRY_RUN && cambios.length > 0) {
    console.log('\n⚠️  Para aplicar estos cambios, ejecutar:');
    console.log('   node scripts/pulir-masivo.mjs --apply\n');
  }

  // Guardar reporte
  const outDir = resolve(process.cwd(), 'scripts/output');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'pulir-masivo.json'), JSON.stringify(reporte, null, 2), 'utf8');
  console.log(`📄 Reporte guardado: scripts/output/pulir-masivo.json`);

  process.exit(0);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
