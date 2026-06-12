/**
 * AUDITORÍA FORENSE V2 — PALABRAS PROHIBIDAS EN 204 NOTICIAS
 * Nivel: Google News Quality Rater + AdSense Policy Enforcement
 * Mejorado: solo títulos para mayúsculas, contexto en contenido
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const serviceAccountPath = path.join(projectRoot, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount), projectId: 'informate-instant-nicaragua' });
const db = getFirestore();

// ═══════════════════════════════════════════════════════════════════════════
// DICCIONARIO FORENSE DE PALABRAS PROHIBIDAS
// ═══════════════════════════════════════════════════════════════════════════

const DICCIONARIO = {
  // 🔴 CRÍTICO — Google News penaliza directamente (SOLO TÍTULOS)
  criticoTitulo: [
    { palabra: /\btragedia\b/i, severidad: 'CRÍTICO', razon: 'Sensacionalismo emocional — Google News marca como clickbait' },
    { palabra: /\bfatal\b/i, severidad: 'CRÍTICO', razon: 'AdSense Policy: contenido de violencia gráfica' },
    { palabra: /\bhorror\b/i, severidad: 'CRÍTICO', razon: 'Google News penaliza por sensacionalismo excesivo' },
    { palabra: /\bdesgarrador\b/i, severidad: 'CRÍTICO', razon: 'Clickbait emocional — no aporta información factual' },
    { palabra: /\bespeluznante\b/i, severidad: 'CRÍTICO', razon: 'Sensacionalismo penalizable por Discover' },
    { palabra: /\bimpactante\b/i, severidad: 'CRÍTICO', razon: 'Detectado como clickbait por Core Algorithm' },
    { palabra: /\bterr[íi]ble\b/i, severidad: 'CRÍTICO', razon: 'Sensacionalismo penalizable' },
  ],

  // 🟠 ALTO — Clickbait en títulos
  altoTitulo: [
    { palabra: /\bincre[ií]ble\b/i, severidad: 'ALTO', razon: 'Clickbait genérico — Google Discover lo ignora' },
    { palabra: /\bsorprendente\b/i, severidad: 'ALTO', razon: 'Falta de especificidad factual' },
    { palabra: /\bexclusivo\b/i, severidad: 'ALTO', razon: 'Engagement farming — penalizado en Discover' },
    { palabra: /\burgente\b/i, severidad: 'ALTO', razon: 'Falso sentido de urgencia (abusado por spam)' },
    { palabra: /\b[uú]ltima hora\b/i, severidad: 'ALTO', razon: 'Solo válido si <2h del evento real' },
    { palabra: /\balerta\b/i, severidad: 'ALTO', razon: 'Falso sentido de peligro — abusado por spam' },
    { palabra: /no vas a creer/i, severidad: 'ALTO', razon: 'Estructura clickbait penalizada' },
    { palabra: /lo que (nadie|no) te (dice|cuenta)/i, severidad: 'ALTO', razon: 'Estructura clickbait estándar' },
    { palabra: /esto es lo que/i, severidad: 'ALTO', razon: 'Clickbait de revelación — Google lo ignora' },
    { palabra: /\brevelan\b/i, severidad: 'ALTO', razon: 'Engagement farming — falta de autoridad' },
    { palabra: /\bdestapan\b/i, severidad: 'ALTO', razon: 'Conspiración implícita — penalizado' },
  ],

  // 🟡 MEDIO — Error de calidad o estilo en TÍTULOS
  medioTitulo: [
    { palabra: /\.{2,}/, severidad: 'MEDIO', razon: 'Puntos suspensivos en título — truncado o incompleto' },
    { palabra: /\?{2,}/, severidad: 'MEDIO', razon: 'Signos de interrogación múltiples — spam' },
    { palabra: /!{2,}/, severidad: 'MEDIO', razon: 'Signos de exclamación múltiples — spam' },
  ],

  // 🟠 ALTO — En contenido (solo primer párrafo y metaDescription)
  altoContenido: [
    { palabra: /apesar(?=\s)/i, severidad: 'MEDIO', razon: 'Error ortográfico: debe ser "a pesar" (2 palabras)' },
  ],
};

const SIGLAS_VALIDAS = new Set([
  'MINSA','INETER','KFC','PSG','FIFA','OMS','ONU','EEUU','EE.UU.','ULTRAVAL',
  'NASA','FBI','CIA','ONU','UNICEF','USAID','COVID','SARS','HIV','NBA','NFL',
  'UEFA','CNN','BBC','ABC','CBS','NBC','FOX','HBO','MAX','MTV','ESPN',
  'USB','SSD','HDD','RAM','CPU','GPU','LCD','LED','PDF','URL','HTML','CSS',
  'JS','PHP','SQL','API','SDK','VPN','DNS','FTP','SSH','HTTP','HTTPS',
  'XML','JSON','CSV','TXT','ZIP','RAR','MP3','MP4','AVI','JPG','PNG','GIF','WEBP',
  'CEO','CFO','COO','CTO','CMO','HR','IT','PR','R&D','QA','ROI','KPI','OKR',
  'VAT','GST','IVA','IRPF','ISR','SAT','SRI','DGI','BCH','BAC','FICOHSA',
]);

function detectarMayusculasExcesivas(titulo) {
  const hallazgos = [];
  const words = titulo.split(/\s+/);
  const upperWords = [];

  for (const word of words) {
    const clean = word.replace(/[^A-ZÁÉÍÓÚÑa-záéíóúñ]/g, '');
    if (clean.length >= 3 && clean === clean.toUpperCase() && !SIGLAS_VALIDAS.has(clean)) {
      upperWords.push(word);
    }
  }

  if (upperWords.length >= 1) {
    upperWords.forEach((w) => {
      hallazgos.push({
        palabra: w,
        severidad: 'MEDIO',
        razon: `Palabra completa en mayúsculas "${w}" no es sigla reconocida`,
      });
    });
  }
  return hallazgos;
}

function analizarTitulo(titulo, docInfo) {
  const hallazgos = [];
  if (!titulo) return hallazgos;

  for (const nivel of ['criticoTitulo', 'altoTitulo', 'medioTitulo']) {
    for (const regla of DICCIONARIO[nivel]) {
      const matches = titulo.match(new RegExp(regla.palabra.source, 'gi'));
      if (matches) {
        matches.forEach((match) => {
          hallazgos.push({
            docId: docInfo.id,
            slug: docInfo.slug,
            titulo: docInfo.titulo,
            campo: 'titulo',
            palabra: match,
            severidad: regla.severidad,
            razon: regla.razon,
            contexto: titulo.substring(Math.max(0, titulo.indexOf(match) - 15), titulo.indexOf(match) + match.length + 15),
          });
        });
      }
    }
  }

  // Detección de mayúsculas excesivas (programática, no por regex)
  const mayusHallazgos = detectarMayusculasExcesivas(titulo);
  mayusHallazgos.forEach((h) => {
    hallazgos.push({
      docId: docInfo.id,
      slug: docInfo.slug,
      titulo: docInfo.titulo,
      campo: 'titulo',
      palabra: h.palabra,
      severidad: h.severidad,
      razon: h.razon,
      contexto: titulo,
    });
  });

  return hallazgos;
}

function analizarContenido(contenido, docInfo) {
  const hallazgos = [];
  if (!contenido) return hallazgos;
  // Solo primer 500 chars (lead/intro)
  const lead = contenido.substring(0, 500);

  for (const regla of DICCIONARIO.altoContenido) {
    const matches = lead.match(new RegExp(regla.palabra.source, 'gi'));
    if (matches) {
      matches.forEach((match) => {
        hallazgos.push({
          docId: docInfo.id,
          slug: docInfo.slug,
          titulo: docInfo.titulo,
          campo: 'contenido',
          palabra: match,
          severidad: regla.severidad,
          razon: regla.razon,
          contexto: lead.substring(Math.max(0, lead.indexOf(match) - 20), lead.indexOf(match) + match.length + 20),
        });
      });
    }
  }
  return hallazgos;
}

function analizarMeta(meta, docInfo) {
  const hallazgos = [];
  if (!meta) return hallazgos;

  // Buscar palabras críticas y altas en metaDescription
  const reglas = [...DICCIONARIO.criticoTitulo, ...DICCIONARIO.altoTitulo];
  for (const regla of reglas) {
    const matches = meta.match(new RegExp(regla.palabra.source, 'gi'));
    if (matches) {
      matches.forEach((match) => {
        hallazgos.push({
          docId: docInfo.id,
          slug: docInfo.slug,
          titulo: docInfo.titulo,
          campo: 'metaDescription',
          palabra: match,
          severidad: regla.severidad,
          razon: regla.razon,
          contexto: meta.substring(Math.max(0, meta.indexOf(match) - 20), meta.indexOf(match) + match.length + 20),
        });
      });
    }
  }
  return hallazgos;
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('  AUDITORÍA FORENSE V2 — PALABRAS PROHIBIDAS');
  console.log('  Google News Policy + AdSense Compliance');
  console.log('  Foco: TÍTULOS + metaDescription + lead del contenido');
  console.log('══════════════════════════════════════════════════════════════════\n');

  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  console.log(`📊 Total noticias en Firestore: ${snapshot.size}\n`);

  let totalHallazgos = [];
  let docsAfectados = new Set();
  let porSeveridad = { CRÍTICO: 0, ALTO: 0, MEDIO: 0 };

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const docInfo = { id: docSnap.id, slug: data.slug, titulo: data.titulo };

    const hTitulo = analizarTitulo(data.titulo || '', docInfo);
    const hContenido = analizarContenido(data.contenido || '', docInfo);
    const hMeta = analizarMeta(data.metaDescription || '', docInfo);

    const todos = [...hTitulo, ...hContenido, ...hMeta];
    totalHallazgos.push(...todos);

    if (todos.length > 0) {
      docsAfectados.add(docSnap.id);
      todos.forEach((h) => porSeveridad[h.severidad]++);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTE EJECUTIVO
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│  RESULTADO DE LA AUDITORÍA                                      │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log(`│  Total noticias analizadas:  ${String(snapshot.size).padEnd(34)}│`);
  console.log(`│  Documentos afectados:       ${String(docsAfectados.size).padEnd(34)}│`);
  console.log(`│  Total hallazgos:            ${String(totalHallazgos.length).padEnd(34)}│`);
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log(`│  🔴 CRÍTICO:  ${String(porSeveridad.CRÍTICO).padEnd(49)}│`);
  console.log(`│  🟠 ALTO:     ${String(porSeveridad.ALTO).padEnd(49)}│`);
  console.log(`│  🟡 MEDIO:    ${String(porSeveridad.MEDIO).padEnd(49)}│`);
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLA FORENSE
  // ═══════════════════════════════════════════════════════════════════════════

  if (totalHallazgos.length === 0) {
    console.log('✅ NINGÚN HALLAZGO. Todos los títulos cumplen las políticas de Google News.');
    return;
  }

  const ordenSeveridad = { 'CRÍTICO': 3, 'ALTO': 2, 'MEDIO': 1 };
  totalHallazgos.sort((a, b) => ordenSeveridad[b.severidad] - ordenSeveridad[a.severidad]);

  // Agrupar por doc
  const porDoc = {};
  totalHallazgos.forEach((h) => {
    if (!porDoc[h.docId]) porDoc[h.docId] = { titulo: h.titulo, slug: h.slug, hallazgos: [] };
    porDoc[h.docId].hallazgos.push(h);
  });

  let contador = 0;
  for (const [docId, info] of Object.entries(porDoc)) {
    const maxSeveridad = info.hallazgos.reduce((max, h) => Math.max(max, ordenSeveridad[h.severidad]), 0);
    const label = maxSeveridad === 3 ? '🔴 CRÍTICO' : maxSeveridad === 2 ? '🟠 ALTO' : '🟡 MEDIO';
    contador++;

    console.log(`┌── ${contador}. ${label} ───────────────────────────────────────────────┐`);
    console.log(`│ Título: ${info.titulo.substring(0, 55).padEnd(55)}│`);
    console.log(`│ Slug:   ${(info.slug || '').substring(0, 55).padEnd(55)}│`);
    console.log(`│ ID:     ${docId.substring(0, 55).padEnd(55)}│`);
    console.log('├──────────────────────────────────────────────────────────────────┤');

    info.hallazgos.forEach((h) => {
      const icono = h.severidad === 'CRÍTICO' ? '🔴' : h.severidad === 'ALTO' ? '🟠' : '🟡';
      console.log(`│ ${icono} [${h.campo.toUpperCase().substring(0, 12).padEnd(12)}] "${h.palabra.substring(0, 25).padEnd(25)}" │`);
      console.log(`│    ${h.razon.substring(0, 58).padEnd(58)}│`);
    });
    console.log('└──────────────────────────────────────────────────────────────────┘\n');
  }

  // Exportar
  const outputPath = path.join(projectRoot, 'auditoria-palabras-prohibidas-v2.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    fechaAuditoria: new Date().toISOString(),
    totalNoticias: snapshot.size,
    docsAfectados: docsAfectados.size,
    totalHallazgos: totalHallazgos.length,
    porSeveridad,
    hallazgos: totalHallazgos,
    resumenPorDoc: porDoc,
  }, null, 2));

  console.log(`✅ Reporte completo: ${outputPath}`);
  console.log(`📁 También disponible como markdown: auditoria-palabras-prohibidas.md`);
}

main().catch(console.error);
