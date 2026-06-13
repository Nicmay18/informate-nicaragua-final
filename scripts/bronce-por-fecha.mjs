/**
 * Analiza las 116 noticias en BRONCE por fecha
 * Separa: recientes (no tocar) vs viejas (sí reparar)
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }
  const pk = process.env.FIREBASE_PRIVATE_KEY.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk }) });
  return getFirestore();
}

const db = initDb();

function limpiarHTML(t) { return (t || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function contarPalabras(t) { return limpiarHTML(t).split(/\s+/).filter(Boolean).length; }

const ADJETIVOS_EMO = ['tragico','terrible','impactante','conmociono','devastador','horrible','alarmante','desgarrador','lamentable','dramatico','critico','escalofriante','espeluznante','increible','inimaginable','indignante','escandaloso','vergonzoso','aterrador','mortifero','sangriento','brutal','salvaje','violento','agresivo','tragedia','fatal','horror'];
const TRANSICIONES_IA = ['en conclusion','es importante destacar','vale la pena mencionar','no hay que olvidar','en el contexto de','desde esta perspectiva','en ultima instancia','a fin de cuentas','en el marco de','resulta fundamental','resulta evidente','no cabe duda','es indiscutible','resulta innegable','en resumen','en definitiva','para concluir','como se menciono anteriormente','es relevante senalar','no se puede ignorar','es crucial','es vital','a su vez'];

function analizarNoticia(d) {
  const textoPlano = limpiarHTML(d.contenido || '');
  const lower = textoPlano.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const pc = contarPalabras(d.contenido || '');
  const lead = ((d.contenido || '').match(/<p>(.*?)<\/p>/)?.[1] || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const adj = ADJETIVOS_EMO.filter(a => lower.includes(a));
  const trans = TRANSICIONES_IA.filter(t => lower.includes(t));
  const fuentes = /informo|confirmo|declaro|preciso|senalo|indico|dijo|explico|manifesto/.test(lower);
  const bq = ((d.contenido || '').match(/<blockquote>/g) || []).length;
  const h2s = ((d.contenido || '').match(/<h2>/gi) || []).length;
  const strongs = ((d.contenido || '').match(/<strong>/gi) || []).length;

  const checks = [];
  checks.push({ nombre: 'Extension', estado: pc >= 500 ? 'PASS' : pc >= 350 ? 'WARN' : 'FAIL', mensaje: pc });
  checks.push({ nombre: 'Lead', estado: lead >= 35 && lead <= 50 ? 'PASS' : lead >= 25 ? 'WARN' : 'FAIL', mensaje: lead });
  checks.push({ nombre: 'Relleno emocional', estado: adj.length === 0 ? 'PASS' : 'FAIL', mensaje: adj.join(', ') || 'Ninguno' });
  checks.push({ nombre: 'Transiciones IA', estado: trans.length === 0 ? 'PASS' : 'FAIL', mensaje: trans.join(', ') || 'Ninguno' });
  checks.push({ nombre: 'Fuentes', estado: fuentes && bq >= 2 ? 'PASS' : fuentes ? 'WARN' : 'FAIL', mensaje: bq });
  checks.push({ nombre: 'Estructura h2', estado: h2s >= 4 ? 'PASS' : h2s >= 2 ? 'WARN' : 'FAIL', mensaje: h2s });
  checks.push({ nombre: 'Negritas', estado: strongs >= 15 ? 'PASS' : strongs >= 8 ? 'WARN' : 'FAIL', mensaje: strongs });

  const punt = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;

  const clickbait = [/no vas a creer/i, /exclusiva/i, /urgente/i, /ultima hora/i, /alerta/i, /revelan/i, /destapan/i, /increible/i, /sorprendente/i].some(p => p.test(d.titulo || ''));
  const adsenseChecks = [
    pc >= 350 ? 'PASS' : 'FAIL',
    !clickbait ? 'PASS' : 'FAIL',
    trans.length === 0 ? 'PASS' : 'FAIL',
  ];
  const adsensePunt = adsenseChecks.filter(c => c === 'PASS').length / adsenseChecks.length * 100;

  const totalPunt = (Math.round(punt) + Math.round(adsensePunt)) / 2;
  let nivel = 'BRONCE';
  if (totalPunt >= 75 && punt >= 85 && !checks.some(c => c.estado === 'FAIL') && adsensePunt >= 80) nivel = 'ORO';
  else if (totalPunt >= 75 && adsensePunt >= 80) nivel = 'PLATA';
  else if (totalPunt >= 60) nivel = 'BRONCE';
  else nivel = 'RECHAZADO';

  return { nivel, puntuacion: Math.round(totalPunt), checks, adsensePunt: Math.round(adsensePunt) };
}

async function main() {
  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();

  // Fechas límite
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  const antier = new Date(hoy); antier.setDate(antier.getDate() - 2);

  const recientes = []; // hoy, ayer, antier
  const viejas = [];    // más viejas

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const analisis = analizarNoticia(d);
    if (analisis.nivel !== 'BRONCE') continue;

    let fecha;
    try {
      fecha = d.fecha?.toDate ? d.fecha.toDate() : (d.fecha ? new Date(d.fecha) : new Date(0));
      if (isNaN(fecha.getTime())) fecha = new Date(0);
    } catch { fecha = new Date(0); }
    fecha.setHours(0,0,0,0);

    const item = {
      id: doc.id,
      slug: d.slug || doc.id,
      titulo: d.titulo || '',
      fecha: fecha.toISOString().slice(0, 10),
      palabras: contarPalabras(d.contenido || ''),
      puntuacion: analisis.puntuacion,
      fallos: analisis.checks.filter(c => c.estado === 'FAIL').map(c => c.nombre),
      adsensePunt: analisis.adsensePunt,
    };

    if (fecha.getTime() === hoy.getTime() || fecha.getTime() === ayer.getTime() || fecha.getTime() === antier.getTime()) {
      recientes.push(item);
    } else {
      viejas.push(item);
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  NOTICIAS EN BRONCE POR FECHA');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`📅 HOY (${hoy.toISOString().slice(0,10)}):     ${recientes.filter(r => r.fecha === hoy.toISOString().slice(0,10)).length} noticias`);
  console.log(`📅 AYER (${ayer.toISOString().slice(0,10)}):    ${recientes.filter(r => r.fecha === ayer.toISOString().slice(0,10)).length} noticias`);
  console.log(`📅 ANTER (${antier.toISOString().slice(0,10)}):   ${recientes.filter(r => r.fecha === antier.toISOString().slice(0,10)).length} noticias`);
  console.log(`   ─────────────────────────────────`);
  console.log(`   NO TOCAR (recientes): ${recientes.length}`);
  console.log(`   SI REPARAR (viejas):  ${viejas.length}\n`);

  if (viejas.length > 0) {
    console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    console.log(`┃  TOP 20 VIEJAS EN BRONCE PARA REPARAR (${viejas.length} total)  ┃`);
    console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
    viejas.sort((a, b) => b.puntuacion - a.puntuacion).slice(0, 20).forEach((r, i) => {
      console.log(`\n  ${String(i + 1).padStart(2)}. [${r.puntuacion}pts | ${r.fecha}] ${r.titulo.slice(0, 55)}`);
      console.log(`      Palabras: ${r.palabras} | Fallos: ${r.fallos.join(', ')} | AdSense: ${r.adsensePunt}%`);
    });
  }

  // Guardar
  writeFileSync(resolve(process.cwd(), 'scripts/output/bronce-por-fecha.json'), JSON.stringify({ recientes, viejas }, null, 2));
  console.log(`\n📄 Guardado: scripts/output/bronce-por-fecha.json`);
  process.exit(0);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
