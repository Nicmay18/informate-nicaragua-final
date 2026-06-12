/**
 * AUDITORÍA FORENSE — PALABRAS PROHIBIDAS EN 204 NOTICIAS
 * Nivel: Google News Quality Rater + AdSense Policy Enforcement
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
  // 🔴 CRÍTICO — Google News penaliza directamente
  critico: [
    { palabra: /tragedia/i, severidad: 'CRÍTICO', razon: 'Sensacionalismo emocional — Google News marca como clickbait' },
    { palabra: /fatal/i, severidad: 'CRÍTICO', razon: 'AdSense Policy: contenido de violencia gráfica' },
    { palabra: /horror/i, severidad: 'CRÍTICO', razon: 'Google News penaliza por sensacionalismo excesivo' },
    { palabra: /desgarrador/i, severidad: 'CRÍTICO', razon: 'Clickbait emocional — no aporta información factual' },
    { palabra: /espeluznante/i, severidad: 'CRÍTICO', razon: 'Sensacionalismo penalizable por Discover' },
    { palabra: /impactante/i, severidad: 'CRÍTICO', razon: 'Detectado como clickbait por Core Algorithm' },
  ],

  // 🟠 ALTO — Clickbait y engagement farming
  alto: [
    { palabra: /incre[ií]ble/i, severidad: 'ALTO', razon: 'Clickbait genérico — Google Discover lo ignora' },
    { palabra: /sorprendente/i, severidad: 'ALTO', razon: 'Falta de especificidad factual' },
    { palabra: /exclusivo/i, severidad: 'ALTO', razon: 'Engagement farming — penalizado en Discover' },
    { palabra: /urgente/i, severidad: 'ALTO', razon: 'Falso sentido de urgencia (abusado por spam)' },
    { palabra: /[uú]ltima hora/i, severidad: 'ALTO', razon: 'Solo válido si <2h del evento real' },
    { palabra: /alerta/i, severidad: 'ALTO', razon: 'Falso sentido de peligro — abusado por spam' },
    { palabra: /no vas a creer/i, severidad: 'ALTO', razon: 'Estructura clickbait penalizada' },
    { palabra: /lo que (nadie|no) te (dice|cuenta)/i, severidad: 'ALTO', razon: 'Estructura clickbait estándar' },
    { palabra: /esto es lo que/i, severidad: 'ALTO', razon: 'Clickbait de revelación — Google lo ignora' },
    { palabra: /revelan/i, severidad: 'ALTO', razon: 'Engagement farming — falta de autoridad' },
    { palabra: /destapan/i, severidad: 'ALTO', razon: 'Conspiración implícita — penalizado' },
  ],

  // 🟡 MEDIO — Error de calidad o estilo
  medio: [
    { palabra: /apesar(?=\s)/i, severidad: 'MEDIO', razon: 'Error ortográfico: debe ser "a pesar" (2 palabras)' },
    { palabra: /\.{3,}/i, severidad: 'MEDIO', razon: 'Puntos suspensivos en título — truncado o incompleto' },
    { palabra: /\?{2,}/i, severidad: 'MEDIO', razon: 'Signos de interrogación múltiples — spam' },
    { palabra: /!{2,}/i, severidad: 'MEDIO', razon: 'Signos de exclamación múltiples — spam' },
    { palabra: /[A-ZÁÉÍÓÚÑ]{3,}/, severidad: 'MEDIO', razon: 'Mayúsculas excesivas — Google News descarta' },
  ],
};

function analizarTexto(texto, campo, doc) {
  const hallazgos = [];
  if (!texto) return hallazgos;

  for (const nivel of ['critico', 'alto', 'medio']) {
    for (const regla of DICCIONARIO[nivel]) {
      const matches = texto.match(new RegExp(regla.palabra.source, 'gi'));
      if (matches) {
        matches.forEach((match) => {
          hallazgos.push({
            docId: doc.id,
            slug: doc.slug,
            titulo: doc.titulo,
            campo, // 'titulo' | 'contenido' | 'metaDescription'
            palabra: match,
            severidad: regla.severidad,
            razon: regla.razon,
            contexto: texto.substring(Math.max(0, texto.indexOf(match) - 30), texto.indexOf(match) + match.length + 30).replace(/\n/g, ' '),
          });
        });
      }
    }
  }

  // Verificación extra: título con puntos suspensivos
  if (campo === 'titulo' && texto.includes('...')) {
    hallazgos.push({
      docId: doc.id,
      slug: doc.slug,
      titulo: doc.titulo,
      campo: 'titulo',
      palabra: '...',
      severidad: 'MEDIO',
      razon: 'Título truncado con puntos suspensivos — incompleto',
      contexto: texto.substring(0, 60),
    });
  }

  return hallazgos;
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('  AUDITORÍA FORENSE — PALABRAS PROHIBIDAS');
  console.log('  Google News Policy Enforcement + AdSense Compliance');
  console.log('══════════════════════════════════════════════════════════════════\n');

  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  console.log(`📊 Total noticias en Firestore: ${snapshot.size}\n`);

  let totalHallazgos = [];
  let docsAfectados = new Set();
  let porSeveridad = { CRÍTICO: 0, ALTO: 0, MEDIO: 0 };

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const docInfo = { id: docSnap.id, slug: data.slug, titulo: data.titulo };

    const hallazgosTitulo = analizarTexto(data.titulo || '', 'titulo', docInfo);
    const hallazgosContenido = analizarTexto(data.contenido || '', 'contenido', docInfo);
    const hallazgosMeta = analizarTexto(data.metaDescription || '', 'metaDescription', docInfo);

    const todos = [...hallazgosTitulo, ...hallazgosContenido, ...hallazgosMeta];
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
  // TABLA FORENSE POR NOTICIA
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('══════════════════════════════════════════════════════════════════');
  console.log('  TABLA FORENSE: NOTICIAS CON HALLAZGOS (ordenadas por severidad)');
  console.log('══════════════════════════════════════════════════════════════════\n');

  const ordenSeveridad = { 'CRÍTICO': 3, 'ALTO': 2, 'MEDIO': 1 };
  const ordenados = totalHallazgos.sort((a, b) => ordenSeveridad[b.severidad] - ordenSeveridad[a.severidad]);

  // Agrupar por documento para mostrar resumen limpio
  const porDoc = {};
  ordenados.forEach((h) => {
    if (!porDoc[h.docId]) porDoc[h.docId] = { titulo: h.titulo, slug: h.slug, hallazgos: [] };
    porDoc[h.docId].hallazgos.push(h);
  });

  let contador = 0;
  for (const [docId, info] of Object.entries(porDoc)) {
    const maxSeveridad = info.hallazgos.reduce((max, h) => Math.max(max, ordenSeveridad[h.severidad]), 0);
    const severidadLabel = maxSeveridad === 3 ? '🔴 CRÍTICO' : maxSeveridad === 2 ? '🟠 ALTO' : '🟡 MEDIO';
    contador++;

    console.log(`┌── ${contador}. ${severidadLabel} ───────────────────────────────────────────────┐`);
    console.log(`│ Título: ${info.titulo.substring(0, 55).padEnd(55)}│`);
    console.log(`│ Slug:   ${(info.slug || '').substring(0, 55).padEnd(55)}│`);
    console.log(`│ ID:     ${docId.substring(0, 55).padEnd(55)}│`);
    console.log('├──────────────────────────────────────────────────────────────────┤');

    info.hallazgos.forEach((h) => {
      const icono = h.severidad === 'CRÍTICO' ? '🔴' : h.severidad === 'ALTO' ? '🟠' : '🟡';
      console.log(`│ ${icono} [${h.campo.toUpperCase().substring(0, 12).padEnd(12)}] "${h.palabra.substring(0, 25).padEnd(25)}" │`);
      console.log(`│    ${h.razon.substring(0, 58).padEnd(58)}│`);
      console.log('│                                                                  │');
    });
    console.log('└──────────────────────────────────────────────────────────────────┘\n');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTAR JSON PARA CORRECCIÓN AUTOMÁTICA
  // ═══════════════════════════════════════════════════════════════════════════

  const outputPath = path.join(projectRoot, 'auditoria-palabras-prohibidas.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    fechaAuditoria: new Date().toISOString(),
    totalNoticias: snapshot.size,
    docsAfectados: docsAfectados.size,
    totalHallazgos: totalHallazgos.length,
    porSeveridad,
    hallazgos: ordenados,
    resumenPorDoc: porDoc,
  }, null, 2));

  console.log(`✅ Reporte completo guardado en: ${outputPath}`);
}

main().catch(console.error);
