/**
 * Auditoria Completa de Noticias — 4 Ejes
 * Eje 1: Cumplimiento AdSense (contenido seguro)
 * Eje 2: E-E-A-T / Discover (estructura, longitud, SEO)
 * Eje 3: Simulación Móvil (legibilidad, densidad)
 * Eje 4: Datos Estructurados (FAQ potential, variantes imagen)
 *
 * Uso: node auditoria-noticias.mjs
 * Requiere: variables de entorno FIREBASE_* configuradas
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
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

// ─── Motor de Scoring Editorial (inline para script standalone) ───
function calcularScoreEditorial(noticia) {
  let score = 0;
  if (!noticia) return 0;

  const textoPlano = (noticia.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;

  // 1. Longitud (500+ = 30pts, 250+ = 15pts)
  if (palabras >= 500) score += 30;
  else if (palabras >= 250) score += 15;

  // 2. Titular SEO (30-70 chars = 20pts)
  const lt = (noticia.titulo || '').length;
  if (lt >= 30 && lt <= 70) score += 20;
  else if (lt > 0) score += 5;

  // 3. Meta descripcion (120-160 chars = 20pts)
  const lr = (noticia.resumen || '').length;
  if (lr >= 120 && lr <= 160) score += 20;
  else if (lr > 0) score += 5;

  // 4. Imagen destacada (15pts)
  if (noticia.imagen && noticia.imagen.trim() !== '' && noticia.imagen.trim() !== '/logo.webp') {
    score += 15;
  }

  // 5. Estructura HTML
  const tieneH2H3 = /<h[23][^>]*>/i.test(noticia.contenido || '');
  const tieneStrong = /<strong[^>]*>|<b>/i.test(noticia.contenido || '');
  if (tieneH2H3) score += 10;
  if (tieneStrong) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ─── Análisis AdSense (palabras sensibles) ───
const PALABRAS_SENSIBLES = [
  'muere', 'muerto', 'muerta', 'asesinad', 'homicidio',
  'accidente fatal', 'trágico', 'tragedia', 'masacre', 'violación', 'secuestro',
  'suicidio', 'asesinato', 'crimen', 'criminal', 'muert', 'víctima mortal',
  'descanse en paz', 'luto', 'sepelio', 'funeral', 'd.e.p', 'dep.',
];

function analizarAdSense(noticia) {
  const texto = `${noticia.titulo || ''} ${noticia.resumen || ''} ${noticia.contenido || ''}`.toLowerCase();
  const hallazgos = [];
  for (const palabra of PALABRAS_SENSIBLES) {
    if (texto.includes(palabra.toLowerCase())) {
      hallazgos.push(palabra);
    }
  }
  return {
    esSegura: hallazgos.length === 0,
    hallazgos: [...new Set(hallazgos)],
    nivelRiesgo: hallazgos.length === 0 ? 'bajo' : hallazgos.length <= 2 ? 'medio' : 'alto',
  };
}

// ─── Análisis SEO On-Page ───
function analizarSEO(noticia) {
  const tituloLen = (noticia.titulo || '').length;
  const resumenLen = (noticia.resumen || '').length;
  const contenido = noticia.contenido || '';
  const textoPlano = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;
  const h2Count = (contenido.match(/<h2/gi) || []).length;
  const h3Count = (contenido.match(/<h3/gi) || []).length;
  const strongCount = (contenido.match(/<strong/gi) || []).length;
  const parrafos = contenido.split(/<\/p>/i).filter(p => p.trim().length > 20).length;

  return {
    tituloLength: tituloLen,
    tituloOptimo: tituloLen >= 30 && tituloLen <= 70,
    resumenLength: resumenLen,
    resumenOptimo: resumenLen >= 120 && resumenLen <= 160,
    palabras,
    h2Count,
    h3Count,
    strongCount,
    parrafos,
    estructuraOK: h2Count >= 1 || h3Count >= 1,
  };
}

// ─── Simulación Móvil ───
function simularMovil(noticia) {
  const html = noticia.contenido || '';
  // Extraer texto de cada bloque <p> o <div> para simular parrafos reales
  const bloques = html
    .split(/<\/?(?:p|div|h[23]|section|article)[^>]*>/i)
    .map(b => b.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(b => b.length > 20);

  const parrafos = bloques.length > 0 ? bloques : [html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()];

  const palabrasPorBloque = parrafos.map(p => p.split(/\s+/).filter(Boolean).length);
  const parrafosLargos = palabrasPorBloque.filter(c => c > 90).length;
  const densidad = palabrasPorBloque.length > 0
    ? Math.round(palabrasPorBloque.reduce((a, b) => a + b, 0) / palabrasPorBloque.length)
    : 0;

  return {
    parrafosTotales: parrafos.length,
    parrafosLargos,
    palabrasPorParrafo: densidad,
    legibleEnMovil: parrafosLargos <= Math.max(1, Math.floor(parrafos.length * 0.3)) && densidad < 100,
  };
}

// ─── Potencial FAQPage ───
function detectarFAQ(noticia) {
  const textoPlano = (noticia.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const matches = textoPlano.match(/¿[^?]+\?/g);
  return {
    tienePreguntas: !!(matches && matches.length > 0),
    cantidadPreguntas: matches ? matches.length : 0,
    preguntas: matches ? matches.slice(0, 3) : [],
  };
}

// ─── Veredicto Global ───
function veredicto(score, adSense, seo, movil) {
  if (!adSense.esSegura) return { estado: 'RECHAZADO', emoji: '🔴', razon: 'Contenido sensible detectado' };
  if (score >= 80 && seo.tituloOptimo && seo.resumenOptimo && seo.estructuraOK && movil.legibleEnMovil) {
    return { estado: 'APROBADO PARA REVISION', emoji: '🟢', razon: 'Cumple todos los criterios' };
  }
  if (score >= 60) {
    return { estado: 'REQUIERE PULIDO', emoji: '🟡', razon: 'Cumple parcialmente, necesita ajustes menores' };
  }
  return { estado: 'REQUIERE PULIDO', emoji: '🟡', razon: 'Score bajo, necesita mejoras significativas' };
}

// ─── MAIN ───
async function main() {
  console.log('🔍 Iniciando auditoría completa de noticias...\n');

  const db = initFirebase();
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();

  const resultados = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const noticia = {
      id: doc.id,
      slug: data.slug || doc.id,
      titulo: data.titulo || '',
      resumen: data.resumen || '',
      contenido: data.contenido || '',
      categoria: data.categoria || 'Actualidad',
      imagen: data.imagen || '',
      fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
      autor: data.autor || '',
    };

    const score = calcularScoreEditorial(noticia);
    const adSense = analizarAdSense(noticia);
    const seo = analizarSEO(noticia);
    const movil = simularMovil(noticia);
    const faq = detectarFAQ(noticia);
    const verdict = veredicto(score, adSense, seo, movil);

    resultados.push({
      id: noticia.id,
      slug: noticia.slug,
      titulo: noticia.titulo,
      categoria: noticia.categoria,
      fecha: noticia.fecha,
      scoreCalidad: score,
      veredicto: verdict,
      adSense,
      seo,
      movil,
      faq,
    });
  }

  // Ordenar por score descendente
  resultados.sort((a, b) => b.scoreCalidad - a.scoreCalidad);

  // Estadísticas globales
  const total = resultados.length;
  const aprobados = resultados.filter(r => r.veredicto.emoji === '🟢').length;
  const pulido = resultados.filter(r => r.veredicto.emoji === '🟡').length;
  const rechazados = resultados.filter(r => r.veredicto.emoji === '🔴').length;
  const avgScore = Math.round(resultados.reduce((s, r) => s + r.scoreCalidad, 0) / total);

  const reporte = {
    fechaAuditoria: new Date().toISOString(),
    totalNoticias: total,
    promedioScore: avgScore,
    resumen: { aprobados, pulido, rechazados },
    top10: resultados.slice(0, 10),
    bottom10: resultados.slice(-10),
    criticasAdSense: resultados.filter(r => r.adSense.esSegura === false),
    todas: resultados,
  };

  const outPath = join(__dirname, 'reporte-auditoria-completa.json');
  writeFileSync(outPath, JSON.stringify(reporte, null, 2));

  console.log(`\n✅ Auditoría completa: ${total} noticias analizadas`);
  console.log(`📊 Promedio de score: ${avgScore}/100`);
  console.log(`🟢 Aprobadas: ${aprobados} | 🟡 Pulido: ${pulido} | 🔴 Rechazadas: ${rechazados}`);
  console.log(`\n📁 Reporte guardado en: ${outPath}`);

  // Mostrar top 5 problemas
  console.log(`\n🔴 NOTICIAS CON CONTENIDO SENSIBLE (${rechazados}):`);
  reporte.criticasAdSense.forEach(n => {
    console.log(`   - [${n.categoria}] ${n.titulo.slice(0, 60)}... (${n.adSense.hallazgos.join(', ')})`);
  });

  console.log(`\n📉 BOTTOM 5 (peor score):`);
  reporte.bottom10.slice(0, 5).forEach(n => {
    console.log(`   - Score ${n.scoreCalidad}: ${n.titulo.slice(0, 60)}...`);
  });
}

main().catch(err => {
  console.error('❌ Error en auditoría:', err.message);
  process.exit(1);
});
