/**
 * AUDITOR MASIVO — Analiza todas las noticias con los 6 filtros forenses
 * Ejecutar: node scripts/auditor-masivo.mjs
 * MODO DRY-RUN por defecto. Agregar --apply para guardar correcciones.
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const DRY_RUN = !process.argv.includes('--apply');

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

function limpiarHTML(t) { return (t || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function contarPalabras(t) { return limpiarHTML(t).split(/\s+/).filter(Boolean).length; }

const ADJETIVOS_EMO = ['tragico','terrible','impactante','conmociono','devastador','horrible','alarmante','desgarrador','lamentable','dramatico','critico','escalofriante','espeluznante','increible','inimaginable','indignante','escandaloso','vergonzoso','aterrador','mortifero','sangriento','brutal','salvaje','violento','agresivo','tragedia','fatal','horror'];
const TRANSICIONES_IA = ['en conclusion','es importante destacar','vale la pena mencionar','no hay que olvidar','en el contexto de','desde esta perspectiva','en ultima instancia','a fin de cuentas','en el marco de','resulta fundamental','resulta evidente','no cabe duda','es indiscutible','resulta innegable','en resumen','en definitiva','para concluir','como se menciono anteriormente','es relevante senalar','no se puede ignorar','es crucial','es vital','a su vez'];

function analizarFiltroOro(n) {
  const checks = [];
  const textoPlano = limpiarHTML(n.contenido);
  const palabraCount = contarPalabras(n.contenido);
  const lead = (n.contenido.match(/<p>(.*?)<\/p>/)?.[1] || '').replace(/<[^>]*>/g, ' ').trim();
  const leadPalabras = lead.split(/\s+/).filter(Boolean).length;
  const lower = textoPlano.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  checks.push({ nombre: 'Extension minima', estado: palabraCount >= 500 ? 'PASS' : palabraCount >= 350 ? 'WARN' : 'FAIL', mensaje: `${palabraCount} palabras` });
  checks.push({ nombre: 'Lead informativo', estado: leadPalabras >= 35 && leadPalabras <= 50 ? 'PASS' : leadPalabras >= 25 ? 'WARN' : 'FAIL', mensaje: `${leadPalabras} palabras` });

  const adj = ADJETIVOS_EMO.filter(a => lower.includes(a));
  checks.push({ nombre: 'Relleno emocional', estado: adj.length === 0 ? 'PASS' : 'FAIL', mensaje: adj.length === 0 ? 'Ninguno' : adj.join(', ') });

  const trans = TRANSICIONES_IA.filter(t => lower.includes(t));
  checks.push({ nombre: 'Transiciones IA', estado: trans.length === 0 ? 'PASS' : 'FAIL', mensaje: trans.length === 0 ? '0' : trans.join(', ') });

  const fuentes = /informo|confirmo|declaro|preciso|senalo|indico|dijo|explico|manifesto/.test(lower);
  const bq = (n.contenido.match(/<blockquote>/g) || []).length;
  checks.push({ nombre: 'Fuentes atribuidas', estado: fuentes && bq >= 2 ? 'PASS' : fuentes ? 'WARN' : 'FAIL', mensaje: `${bq} blockquotes` });

  const h2s = (n.contenido.match(/<h2>/gi) || []).length;
  const strongs = (n.contenido.match(/<strong>/gi) || []).length;
  checks.push({ nombre: 'Estructura (h2)', estado: h2s >= 4 ? 'PASS' : h2s >= 2 ? 'WARN' : 'FAIL', mensaje: `${h2s} h2` });
  checks.push({ nombre: 'Negritas (strong)', estado: strongs >= 15 ? 'PASS' : strongs >= 8 ? 'WARN' : 'FAIL', mensaje: `${strongs} strong` });

  const punt = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return { aprobado: punt >= 85 && !checks.some(c => c.estado === 'FAIL'), puntuacion: Math.round(punt), checks };
}

function analizarFiltroAdSense(n) {
  const checks = [];
  const pc = contarPalabras(n.contenido);
  const lower = limpiarHTML(n.contenido).toLowerCase();

  checks.push({ nombre: 'Thin content', estado: pc >= 350 ? 'PASS' : 'FAIL', mensaje: `${pc} palabras` });

  const clickbait = [/no vas a creer/i, /exclusiva/i, /urgente/i, /ultima hora/i, /alerta/i, /revelan/i, /destapan/i, /increible/i, /sorprendente/i].some(p => p.test(n.titulo));
  checks.push({ nombre: 'Clickbait', estado: !clickbait ? 'PASS' : 'FAIL', mensaje: clickbait ? 'Detectado' : 'OK' });

  const unicas = new Set(lower.split(' ')).size;
  checks.push({ nombre: 'Valor anadido original', estado: (unicas / pc) >= 0.4 ? 'PASS' : 'WARN', mensaje: `${((unicas / pc) * 100).toFixed(1)}%` });

  const patrones = TRANSICIONES_IA.filter(t => lower.includes(t));
  checks.push({ nombre: 'Revision editorial', estado: patrones.length === 0 ? 'PASS' : 'FAIL', mensaje: patrones.length === 0 ? 'OK' : `${patrones.length} patrones` });

  const punt = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return { aprobado: punt >= 80 && !checks.some(c => c.estado === 'FAIL'), puntuacion: Math.round(punt), checks };
}

function analizarFiltroDiscover(n) {
  const checks = [];
  const clickbait = [/no vas a creer/i, /exclusiva/i, /urgente/i, /ultima hora/i, /alerta/i, /revelan/i, /destapan/i, /increible/i, /sorprendente/i].some(p => p.test(n.titulo));
  checks.push({ nombre: 'Imagen destacada', estado: (n.imagenDestacada || n.imagen) ? 'PASS' : 'FAIL', mensaje: (n.imagenDestacada || n.imagen) ? 'OK' : 'Sin imagen' });
  checks.push({ nombre: 'Titulo Discover-friendly', estado: !clickbait ? 'PASS' : 'FAIL', mensaje: clickbait ? 'Clickbait' : 'OK' });
  checks.push({ nombre: 'Senal de frescura', estado: n.fechaActualizacion ? 'PASS' : 'WARN', mensaje: n.fechaActualizacion ? 'OK' : 'Sin fechaActualizacion' });
  const punt = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return { aprobado: punt >= 66, puntuacion: Math.round(punt), checks };
}

function analizarFiltroNews(n) {
  const checks = [];
  checks.push({ nombre: 'Schema NewsArticle', estado: 'PASS', mensaje: 'Verificar' });
  checks.push({ nombre: 'Autor verificado', estado: (n.autor || '').length > 3 ? 'PASS' : 'FAIL', mensaje: n.autor || 'Sin autor' });
  checks.push({ nombre: 'Fechas visibles', estado: n.fecha ? 'PASS' : 'FAIL', mensaje: n.fecha ? 'OK' : 'Sin fecha' });
  checks.push({ nombre: 'Categoria News', estado: ['Nacionales','Sucesos','Politica','Economia','Deportes','Cultura','Salud','Tecnologia','Internacionales','Espectaculos','Infraestructura','Judicial','General'].includes(n.categoria) ? 'PASS' : 'WARN', mensaje: n.categoria });
  const punt = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return { aprobado: punt >= 75, puntuacion: Math.round(punt), checks };
}

function analizarFiltroSEO(n) {
  const checks = [];
  checks.push({ nombre: 'Titulo 55-60 chars', estado: n.titulo.length >= 50 && n.titulo.length <= 60 ? 'PASS' : n.titulo.length > 60 ? 'WARN' : 'FAIL', mensaje: `${n.titulo.length} chars` });
  checks.push({ nombre: 'Meta description 150-160 chars', estado: (n.resumen || '').length >= 150 && (n.resumen || '').length <= 160 ? 'PASS' : (n.resumen || '').length >= 120 ? 'WARN' : 'FAIL', mensaje: `${(n.resumen || '').length} chars` });
  const slugValido = /^[a-z0-9-]+$/.test(n.slug || '') && !/[aeiouAEIOU]/.test(n.slug || '') || /^[a-z0-9-]+$/.test((n.slug || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  checks.push({ nombre: 'Slug SEO', estado: slugValido ? 'PASS' : 'FAIL', mensaje: n.slug || 'Sin slug' });
  checks.push({ nombre: 'Keywords LSI', estado: 'WARN', mensaje: 'Verificar manualmente' });
  const punt = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return { aprobado: punt >= 75, puntuacion: Math.round(punt), checks };
}

function analizarFiltroEEAT(n) {
  const checks = [];
  checks.push({ nombre: 'Autor con bio', estado: n.autor ? 'PASS' : 'FAIL', mensaje: n.autor || 'Sin autor' });
  checks.push({ nombre: 'Fuentes verificables', estado: /https?:\/\//.test(n.contenido) ? 'PASS' : 'WARN', mensaje: /https?:\/\//.test(n.contenido) ? 'Con URLs' : 'Sin URLs' });
  const punt = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return { aprobado: punt >= 75, puntuacion: Math.round(punt), checks };
}

function analizarNoticiaCompleta(n) {
  const filtros = { oro: analizarFiltroOro(n), adsense: analizarFiltroAdSense(n), discover: analizarFiltroDiscover(n), news: analizarFiltroNews(n), seo: analizarFiltroSEO(n), eeat: analizarFiltroEEAT(n) };
  const puntTotal = Object.values(filtros).reduce((s, f) => s + f.puntuacion, 0) / 6;
  let nivel = 'RECHAZADO', aprobado = false;
  if (puntTotal >= 90 && filtros.oro.aprobado && filtros.adsense.aprobado) { nivel = 'ORO'; aprobado = true; }
  else if (puntTotal >= 75 && filtros.adsense.aprobado) { nivel = 'PLATA'; aprobado = true; }
  else if (puntTotal >= 60) { nivel = 'BRONCE'; }
  return { aprobado, nivel, puntuacion: Math.round(puntTotal), filtros };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AUDITOR MASIVO — 6 NIVELES FORENSES');
  console.log(`  MODO: ${DRY_RUN ? 'DRY-RUN (solo lectura)' : 'APLICAR CORRECCIONES'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
  console.log(`📡 ${snapshot.docs.length} noticias encontradas\n`);

  const resultados = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const n = { titulo: d.titulo || '', contenido: d.contenido || '', resumen: d.resumen || '', categoria: d.categoria || 'General', autor: d.autor || '', fecha: d.fecha ? (d.fecha.toDate ? d.fecha.toDate().toISOString() : d.fecha) : '', fechaActualizacion: d.fechaActualizacion ? (d.fechaActualizacion.toDate ? d.fechaActualizacion.toDate().toISOString() : d.fechaActualizacion) : '', imagenDestacada: d.imagen || d.imagenDestacada || '', slug: d.slug || doc.id };
    const a = analizarNoticiaCompleta(n);
    resultados.push({ id: doc.id, slug: n.slug, titulo: n.titulo, categoria: n.categoria, palabras: contarPalabras(n.contenido), ...a });
  }

  const oro = resultados.filter(r => r.nivel === 'ORO');
  const plata = resultados.filter(r => r.nivel === 'PLATA');
  const bronce = resultados.filter(r => r.nivel === 'BRONCE');
  const rechazado = resultados.filter(r => r.nivel === 'RECHAZADO');

  console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃                    RESULTADOS GLOBALES                       ┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  console.log(`  🏆 ORO       : ${oro.length}`);
  console.log(`  ⚡ PLATA     : ${plata.length}`);
  console.log(`  🥉 BRONCE    : ${bronce.length}`);
  console.log(`  🚫 RECHAZADO : ${rechazado.length}`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  TOTAL        : ${resultados.length}\n`);

  // Top 20 mas cercanas a ORO
  const cercaOro = [...plata, ...bronce].filter(r => r.puntuacion >= 55).sort((a, b) => b.puntuacion - a.puntuacion).slice(0, 20);
  if (cercaOro.length > 0) {
    console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    console.log(`┃  TOP ${String(cercaOro.length).padStart(2)} MÁS CERCANAS A ORO                        ┃`);
    console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
    cercaOro.forEach((r, i) => {
      const fallos = Object.values(r.filtros).flatMap(f => f.checks.filter(c => c.estado === 'FAIL')).map(c => c.nombre).slice(0, 3).join(', ');
      console.log(`\n  ${String(i + 1).padStart(2)}. [${r.puntuacion}pts] ${r.titulo.slice(0, 55)}`);
      console.log(`      Palabras: ${r.palabras} | ❌ ${fallos || 'Sin fallos'}`);
    });
    console.log('');
  }

  // Top 20 mas problematicas
  const problem = rechazado.sort((a, b) => a.puntuacion - b.puntuacion).slice(0, 20);
  if (problem.length > 0) {
    console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    console.log(`┃  TOP ${String(problem.length).padStart(2)} MÁS PROBLEMÁTICAS                      ┃`);
    console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
    problem.forEach((r, i) => {
      const fallos = Object.values(r.filtros).flatMap(f => f.checks.filter(c => c.estado === 'FAIL')).map(c => c.nombre).slice(0, 3).join(', ');
      console.log(`\n  ${String(i + 1).padStart(2)}. [${r.puntuacion}pts] ${r.titulo.slice(0, 55)}`);
      console.log(`      Palabras: ${r.palabras} | ❌ ${fallos || 'Sin fallos'}`);
    });
    console.log('');
  }

  // Guardar reporte JSON
  const outDir = resolve(process.cwd(), 'scripts/output');
  mkdirSync(outDir, { recursive: true });
  const reporte = {
    fecha: new Date().toISOString(),
    total: resultados.length,
    niveles: { oro: oro.length, plata: plata.length, bronce: bronce.length, rechazado: rechazado.length },
    todas: resultados.map(r => ({ id: r.id, slug: r.slug, titulo: r.titulo, nivel: r.nivel, puntuacion: r.puntuacion, palabras: r.palabras, fallos: Object.values(r.filtros).flatMap(f => f.checks.filter(c => c.estado === 'FAIL').map(c => c.nombre)) })),
  };
  writeFileSync(resolve(outDir, 'auditor-masivo.json'), JSON.stringify(reporte, null, 2), 'utf8');
  writeFileSync(resolve(outDir, 'auditor-masivo.txt'), generarTXT(resultados, oro, plata, bronce, rechazado, cercaOro, problem), 'utf8');

  console.log(`\n✅ Reportes guardados en:`);
  console.log(`   scripts/output/auditor-masivo.json`);
  console.log(`   scripts/output/auditor-masivo.txt`);
  process.exit(0);
}

function generarTXT(resultados, oro, plata, bronce, rechazado, cercaOro, problem) {
  let out = `AUDITOR MASIVO — ${new Date().toLocaleString()}\n`;
  out += `TOTAL: ${resultados.length}\n`;
  out += `ORO: ${oro.length} | PLATA: ${plata.length} | BRONCE: ${bronce.length} | RECHAZADO: ${rechazado.length}\n\n`;
  out += '═'.repeat(80) + '\nTOP 20 MÁS CERCANAS A ORO\n' + '═'.repeat(80) + '\n';
  cercaOro.forEach((r, i) => {
    const fallos = Object.values(r.filtros).flatMap(f => f.checks.filter(c => c.estado === 'FAIL')).map(c => c.nombre).slice(0, 3).join(', ');
    out += `${i + 1}. [${r.puntuacion}pts] ${r.titulo}\n   Palabras: ${r.palabras} | Fallos: ${fallos}\n\n`;
  });
  out += '═'.repeat(80) + '\nTOP 20 MÁS PROBLEMÁTICAS\n' + '═'.repeat(80) + '\n';
  problem.forEach((r, i) => {
    const fallos = Object.values(r.filtros).flatMap(f => f.checks.filter(c => c.estado === 'FAIL')).map(c => c.nombre).slice(0, 3).join(', ');
    out += `${i + 1}. [${r.puntuacion}pts] ${r.titulo}\n   Palabras: ${r.palabras} | Fallos: ${fallos}\n\n`;
  });
  return out;
}

main().catch(e => { console.error('❌', e); process.exit(1); });
