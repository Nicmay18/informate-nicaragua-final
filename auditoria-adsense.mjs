#!/usr/bin/env node
/**
 * AUDITORÍA COMPLETA PARA ADSENSE
 * Verifica todos los factores que Google evalúa para aprobar un sitio
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  try {
    const sa = JSON.parse(readFileSync('./scripts/firebase-admin-key.json', 'utf8'));
    return getFirestore(initializeApp({ credential: cert(sa) }));
  } catch {}
  const { FIREBASE_PROJECT_ID: p, FIREBASE_CLIENT_EMAIL: e, FIREBASE_PRIVATE_KEY: k } = process.env;
  if (p && e && k) return getFirestore(initializeApp({ credential: cert({ projectId: p, clientEmail: e, privateKey: k.replace(/\\n/g, '\n') }) }));
  throw new Error('Sin credenciales');
}

function countWords(text) {
  if (!text) return 0;
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 1).length;
}

function detectarIA(texto) {
  if (!texto) return false;
  const frases = [
    'en el dinámico mundo', 'en el vertiginoso mundo', 'en un mundo cada vez más',
    'es fundamental destacar', 'es importante señalar', 'cabe destacar que',
    'en este contexto', 'en definitiva', 'en conclusión', 'en resumen',
    'es crucial', 'es esencial', 'es vital recordar',
    'a medida que avanzamos', 'en el panorama actual',
    'sin lugar a dudas', 'no cabe duda', 'está claro que',
    'en el ámbito de', 'en el marco de',
  ];
  const t = texto.toLowerCase();
  return frases.filter(f => t.includes(f)).length >= 2;
}

const db = initFirebase();
const snap = await db.collection('noticias').where('estado', '==', 'publicado').get();
const noticias = [];
snap.forEach(d => noticias.push({ id: d.id, ...d.data() }));

// ── ANÁLISIS ──────────────────────────────────────────────────────────────────

const problemas = {
  noindex: [],
  sinImagen: [],
  cortas: [],        // < 300 palabras
  muyCortas: [],     // < 150 palabras
  sinResumen: [],
  sinSlug: [],
  posibleIA: [],
  sinAutor: [],
  tituloCorto: [],   // < 20 chars
  sinCategoria: [],
  fechaFutura: [],
};

const ahora = new Date();

for (const n of noticias) {
  const palabras = countWords((n.contenido || '') + ' ' + (n.resumen || ''));
  const titulo = n.titulo || '';
  const slug = n.slug || '';
  const fecha = new Date(typeof n.fecha === 'string' ? n.fecha : n.fecha?.toDate?.()?.toISOString() ?? '');

  if (n.noindex === true)                    problemas.noindex.push({ slug, titulo });
  if (!n.imagen || n.imagen.length < 5)      problemas.sinImagen.push({ slug, titulo });
  if (!n.resumen || n.resumen.length < 10)   problemas.sinResumen.push({ slug, titulo });
  if (!slug || slug.length < 3)              problemas.sinSlug.push({ id: n.id, titulo });
  if (!n.autor)                              problemas.sinAutor.push({ slug, titulo });
  if (titulo.length < 20)                    problemas.tituloCorto.push({ slug, titulo });
  if (!n.categoria)                          problemas.sinCategoria.push({ slug, titulo });
  if (fecha > ahora)                         problemas.fechaFutura.push({ slug, titulo, fecha: fecha.toISOString().substring(0,10) });
  if (palabras < 150)                        problemas.muyCortas.push({ slug, titulo, palabras });
  else if (palabras < 300)                   problemas.cortas.push({ slug, titulo, palabras });
  if (detectarIA(n.contenido || n.resumen || '')) problemas.posibleIA.push({ slug, titulo });
}

// ── ESTADÍSTICAS ──────────────────────────────────────────────────────────────
const palabrasTodas = noticias.map(n => countWords((n.contenido || '') + ' ' + (n.resumen || '')));
const promedio = Math.round(palabrasTodas.reduce((a, b) => a + b, 0) / palabrasTodas.length);
const porCategoria = {};
for (const n of noticias) porCategoria[n.categoria || 'sin_categoria'] = (porCategoria[n.categoria || 'sin_categoria'] || 0) + 1;

// ── ARCHIVOS LOCALES ──────────────────────────────────────────────────────────
const archivos = {
  adstxt: existsSync('./public/ads.txt'),
  robots: existsSync('./public/robots.txt'),
  sitemap: existsSync('./public/sitemap.xml') || existsSync('./app/sitemap.ts') || existsSync('./app/sitemap.xml'),
  newsSitemap: existsSync('./app/news-sitemap.xml') || existsSync('./app/news-sitemap.ts'),
  privacidad: existsSync('./app/privacidad/page.tsx'),
  terminos: existsSync('./app/terminos/page.tsx'),
  nosotros: existsSync('./app/nosotros/page.tsx'),
  contacto: existsSync('./app/contacto/page.tsx'),
  politicaEditorial: existsSync('./app/politica-editorial/page.tsx'),
};

// ── CONTENIDO ADS.TXT ─────────────────────────────────────────────────────────
let adsTxtContenido = '';
try { adsTxtContenido = readFileSync('./public/ads.txt', 'utf8'); } catch {}
const adsTxtOk = adsTxtContenido.includes('google.com') && adsTxtContenido.includes('pub-') && adsTxtContenido.includes('DIRECT');

// ── ROBOTS.TXT ────────────────────────────────────────────────────────────────
let robotsTxt = '';
try { robotsTxt = readFileSync('./public/robots.txt', 'utf8'); } catch {}
const robotsBloquea = robotsTxt.includes('Disallow: /') && !robotsTxt.includes('Disallow: /api');

// ── IMPRIMIR REPORTE ──────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║         AUDITORÍA ADSENSE — NICARAGUA INFORMATE             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ARCHIVOS TÉCNICOS
console.log('── ARCHIVOS TÉCNICOS ──────────────────────────────────────────');
console.log(`  ${archivos.adstxt && adsTxtOk ? '✅' : '❌'} ads.txt: ${adsTxtContenido.trim().split('\n').filter(l => !l.startsWith('#') && l.trim()).join(' | ')}`);
console.log(`  ${archivos.robots ? '✅' : '⚠️'} robots.txt: ${archivos.robots ? (robotsBloquea ? '⚠️  BLOQUEA algo - revisar' : 'OK') : 'no existe'}`);
console.log(`  ${archivos.sitemap ? '✅' : '❌'} sitemap.xml`);
console.log(`  ${archivos.newsSitemap ? '✅' : '⚠️'} news-sitemap.xml`);

// PÁGINAS LEGALES
console.log('\n── PÁGINAS LEGALES (requeridas por AdSense) ───────────────────');
console.log(`  ${archivos.nosotros ? '✅' : '❌'} /nosotros`);
console.log(`  ${archivos.privacidad ? '✅' : '❌'} /privacidad`);
console.log(`  ${archivos.terminos ? '✅' : '❌'} /terminos`);
console.log(`  ${archivos.contacto ? '✅' : '❌'} /contacto`);
console.log(`  ${archivos.politicaEditorial ? '✅' : '❌'} /politica-editorial`);

// CONTENIDO
console.log('\n── CONTENIDO ──────────────────────────────────────────────────');
console.log(`  Total publicadas : ${noticias.length}`);
console.log(`  Promedio palabras: ${promedio}`);
console.log(`  Por categoría:`);
for (const [cat, cnt] of Object.entries(porCategoria).sort((a,b) => b[1]-a[1])) {
  console.log(`    ${cat.padEnd(20)} ${cnt} noticias`);
}

// PROBLEMAS
console.log('\n── PROBLEMAS DETECTADOS ───────────────────────────────────────');
const hayProblemas = Object.values(problemas).some(arr => arr.length > 0);

if (!hayProblemas) {
  console.log('  ✅ No se detectaron problemas\n');
} else {
  if (problemas.noindex.length > 0) {
    console.log(`\n  ❌ NOINDEX (${problemas.noindex.length}) — Google NO las indexa:`);
    problemas.noindex.slice(0, 10).forEach(n => console.log(`     - ${n.titulo?.substring(0,60)}... [${n.slug}]`));
    if (problemas.noindex.length > 10) console.log(`     ... y ${problemas.noindex.length - 10} más`);
  }

  if (problemas.muyCortas.length > 0) {
    console.log(`\n  ❌ MUY CORTAS < 150 palabras (${problemas.muyCortas.length}) — RIESGO ALTO AdSense:`);
    problemas.muyCortas.slice(0, 10).forEach(n => console.log(`     [${n.palabras} pal] ${n.titulo?.substring(0,60)}...`));
    if (problemas.muyCortas.length > 10) console.log(`     ... y ${problemas.muyCortas.length - 10} más`);
  }

  if (problemas.cortas.length > 0) {
    console.log(`\n  ⚠️  CORTAS 150-300 palabras (${problemas.cortas.length}) — RIESGO MEDIO:`);
    problemas.cortas.slice(0, 10).forEach(n => console.log(`     [${n.palabras} pal] ${n.titulo?.substring(0,60)}...`));
    if (problemas.cortas.length > 10) console.log(`     ... y ${problemas.cortas.length - 10} más`);
  }

  if (problemas.sinImagen.length > 0) {
    console.log(`\n  ⚠️  SIN IMAGEN (${problemas.sinImagen.length}):`);
    problemas.sinImagen.slice(0, 5).forEach(n => console.log(`     - ${n.titulo?.substring(0,60)}...`));
    if (problemas.sinImagen.length > 5) console.log(`     ... y ${problemas.sinImagen.length - 5} más`);
  }

  if (problemas.sinAutor.length > 0) {
    console.log(`\n  ⚠️  SIN AUTOR (${problemas.sinAutor.length}) — E-E-A-T débil:`);
    problemas.sinAutor.slice(0, 5).forEach(n => console.log(`     - ${n.titulo?.substring(0,60)}...`));
    if (problemas.sinAutor.length > 5) console.log(`     ... y ${problemas.sinAutor.length - 5} más`);
  }

  if (problemas.sinResumen.length > 0) {
    console.log(`\n  ⚠️  SIN RESUMEN/META DESCRIPCIÓN (${problemas.sinResumen.length}):`);
    problemas.sinResumen.slice(0, 5).forEach(n => console.log(`     - ${n.titulo?.substring(0,60)}...`));
  }

  if (problemas.posibleIA.length > 0) {
    console.log(`\n  ⚠️  POSIBLE TEXTO IA (${problemas.posibleIA.length}) — frases genéricas detectadas:`);
    problemas.posibleIA.slice(0, 5).forEach(n => console.log(`     - ${n.titulo?.substring(0,60)}...`));
    if (problemas.posibleIA.length > 5) console.log(`     ... y ${problemas.posibleIA.length - 5} más`);
  }

  if (problemas.fechaFutura.length > 0) {
    console.log(`\n  ⚠️  FECHA FUTURA (${problemas.fechaFutura.length}) — Google las ve como no publicadas:`);
    problemas.fechaFutura.slice(0, 5).forEach(n => console.log(`     - ${n.fecha} | ${n.titulo?.substring(0,50)}...`));
  }

  if (problemas.sinSlug.length > 0) {
    console.log(`\n  ❌ SIN SLUG (${problemas.sinSlug.length}) — URLs rotas:`);
    problemas.sinSlug.slice(0, 5).forEach(n => console.log(`     - id:${n.id} | ${n.titulo?.substring(0,50)}...`));
  }
}

// VEREDICTO FINAL
console.log('\n╔══════════════════════════════════════════════════════════════╗');
const criticos = problemas.noindex.length + problemas.muyCortas.length + problemas.sinSlug.length;
const advertencias = problemas.cortas.length + problemas.sinImagen.length + problemas.sinAutor.length + problemas.posibleIA.length + problemas.sinResumen.length + problemas.fechaFutura.length;

if (criticos === 0 && advertencias === 0) {
  console.log('║  ✅ LISTO PARA SOLICITAR REVISIÓN EN ADSENSE                ║');
} else if (criticos === 0) {
  console.log(`║  ⚠️  ${advertencias} advertencias — Podés solicitar revisión          ║`);
  console.log('║     pero conviene resolver las advertencias primero         ║');
} else {
  console.log(`║  ❌ ${criticos} PROBLEMAS CRÍTICOS — Resolvelos antes de pedir revisión ║`);
}
console.log('╚══════════════════════════════════════════════════════════════╝\n');

process.exit(0);
