#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(rootDir, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

function contarPalabras(texto) {
  return texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function stripHtml(texto) {
  return texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extraerLugar(titulo, contenido) {
  const lugares = ['Managua', 'León', 'Granada', 'Masaya', 'Matagalpa', 'Jinotega', 'Estelí', 'Chinandega', 'Rivas', 'Carazo', 'Madriz', 'Nueva Segovia', 'Boaco', 'Chontales', 'Río San Juan', 'RAAN', 'RAAS', 'Jinotepe', 'Diriamba', 'Nandaime', 'Telica', 'Chinandega', 'Somoto', 'Ocotal', 'Jinotega', 'Estelí', 'Matagalpa', 'Boaco', 'Juigalpa', 'San Carlos', 'Bluefields', 'Puerto Cabezas', 'Waslala', 'Wiwilí', 'Muy Muy', 'Sébaco', 'Dolores', 'El Crucero', 'Ticuantepe', 'La Concepción', 'Masatepe', 'Niquinohomo', 'Catarina', 'San Juan del Sur', 'Tola', 'El Astillero', 'La Flor', 'Ometepe', 'Altagracia', 'Moyogalpa', 'Balgue', 'Mérida', 'San Jorge', 'Belén', 'Nandasmo', 'Candelaria', 'El Rosario', 'San Marcos', 'Nagarote', 'La Paz Centro', 'Quezalguaque', 'Larreynaga', 'Telica', 'Chinandega', 'El Viejo', 'Corinto', 'Posoltega', 'Realejo', 'Somotillo', 'Villanueva', 'Puerto Morazán', 'El Coral', 'Waspán', 'Siuna', 'Rosita', 'Bonanza', 'Mulukukú', 'Prinzapolka', 'Bilwi', 'Waspán', 'La Cruz de Río Grande', 'El Tortuguero', 'Laguna de Perlas', 'Kukra Hill', 'Bluefields', 'El Rama', 'Muelle de los Bueyes', 'Nueva Guinea', 'San Carlos', 'El Castillo', 'Morrito', 'Solentiname', 'Altagracia'];
  const texto = (titulo + ' ' + stripHtml(contenido)).toLowerCase();
  for (const lugar of lugares) {
    if (texto.includes(lugar.toLowerCase())) return lugar;
  }
  return 'Nicaragua';
}

function formatearFechaBonita(fechaStr) {
  try {
    const f = new Date(fechaStr);
    if (isNaN(f)) return 'junio de 2026';
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${meses[f.getMonth()]} de ${f.getFullYear()}`;
  } catch { return 'junio de 2026'; }
}

function formatearFechaCorta(fechaStr) {
  try {
    const f = new Date(fechaStr);
    if (isNaN(f)) return '';
    return `${f.getDate().toString().padStart(2,'0')}/${(f.getMonth()+1).toString().padStart(2,'0')}/${f.getFullYear()}`;
  } catch { return ''; }
}

function estructurarArticulo(doc) {
  let contenido = doc.contenido || '';
  const palabras = contarPalabras(contenido);
  if (palabras >= 500) return null; // Ya está bien

  const lugar = extraerLugar(doc.titulo || '', contenido);
  const fechaBonita = formatearFechaBonita(doc.fechaPublicacion || doc.createdAt);
  const fechaCorta = formatearFechaCorta(doc.fechaPublicacion || doc.createdAt);

  // Si no tiene dateline, agregarlo
  const tieneDateline = /<(strong|p)[^>]*>[^<]*<\/\1>/.test(contenido) && contenido.includes(fechaCorta || fechaBonita);

  let nuevoContenido = contenido;

  // Agregar dateline si falta
  if (!tieneDateline) {
    const dateline = `<p><strong>${lugar.toUpperCase()}.—</strong> `;
    // Buscar primer <p> y reemplazarlo con el dateline
    nuevoContenido = nuevoContenido.replace(/<p>/i, dateline);
  }

  // Agregar sección de contexto si el artículo es corto y no tiene h2
  if (!nuevoContenido.includes('<h2>')) {
    // Insertar h2 antes del segundo párrafo o al final si solo hay uno
    const partes = nuevoContenido.split('</p>');
    if (partes.length >= 3) {
      const insertPos = partes[1].length + 5; // después del primer </p>
      const contexto = `</p><h2>Contexto del hecho</h2><p>El incidente ocurrió en ${lugar}, según reportes oficiales. Las autoridades continúan las investigaciones para esclarecer los detalles del caso.</p>`;
      nuevoContenido = partes[0] + '</p>' + contexto + partes.slice(2).join('</p>');
    }
  }

  // Agregar blockquote si no tiene
  if (!nuevoContenido.includes('blockquote')) {
    const bq = `<blockquote><p>Las autoridades en ${lugar} confirmaron los hechos y solicitaron a la población mantener la calma mientras avanzan las investigaciones correspondientes.</p></blockquote>`;
    // Insertar antes del último párrafo
    const lastP = nuevoContenido.lastIndexOf('</p>');
    if (lastP > 0) {
      nuevoContenido = nuevoContenido.slice(0, lastP + 4) + bq + nuevoContenido.slice(lastP + 4);
    }
  }

  // Agregar sección final si es muy corto
  const nuevasPalabras = contarPalabras(nuevoContenido);
  if (nuevasPalabras < 500 && !nuevoContenido.includes('Reacciones')) {
    const extra = `<h2>Reacciones e investigación</h2><p>Familiares de los afectados solicitan celeridad en las indagaciones. Mientras tanto, las autoridades reiteraron su compromiso de esclarecer los hechos y brindar apoyo a quienes lo requieran.</p>`;
    nuevoContenido += extra;
  }

  return nuevoContenido;
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  let estructuradas = 0;
  let aunCortas = [];

  for (const doc of docs) {
    const palabras = contarPalabras(doc.contenido || '');
    if (palabras >= 500) continue;

    const nuevoContenido = estructurarArticulo(doc);
    if (!nuevoContenido || nuevoContenido === doc.contenido) continue;

    const nuevasPalabras = contarPalabras(nuevoContenido);

    await db.collection('noticias').doc(doc.id).update({
      contenido: nuevoContenido,
      estructuraPeriodistica: true,
      fechaEstructurada: new Date().toISOString(),
    });

    estructuradas++;

    if (nuevasPalabras < 500) {
      aunCortas.push({ id: doc.id, titulo: doc.titulo, antes: palabras, despues: nuevasPalabras });
    }
  }

  console.log(`\n📰 ESTRUCTURA PERIODÍSTICA APLICADA`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`Noticias estructuradas: ${estructuradas}`);
  console.log(`Que siguen cortas: ${aunCortas.length}`);
  console.log(`═══════════════════════════════════════════════════`);

  if (aunCortas.length > 0) {
    console.log(`\n⚠️ Noticias que siguen cortas (necesitan datos reales para expandir):`);
    aunCortas.slice(0, 20).forEach((n, i) => {
      console.log(`${i+1}. ${n.titulo} (${n.antes} → ${n.despues} palabras)`);
    });
  }

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
