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

const AHORA = new Date();
const PATRONES_IA = [
  /en conclusi[oó]n/i, /en resumen/i, /es importante destacar/i, /vale la pena mencionar/i,
  /es vital/i, /resulta fundamental/i, /es indiscutible/i, /no cabe duda/i,
  /resulta evidente/i, /resulta innegable/i, /cabe señalar/i, /conviene destacar/i,
  /no hay duda/i, /es innegable/i, /resulta claro/i, /es fundamental/i,
  /es crucial/i, /es esencial/i, /es pertinente/i, /es oportuno/i,
  /en el contexto de/i, /en el marco de/i, /en términos de/i, /desde el punto de vista/i,
  /en este sentido/i, /en ese sentido/i, /en dicho sentido/i, /a este respecto/i,
  /por su parte/i, /por otro lado/i, /por otra parte/i, /de igual manera/i,
  /de manera similar/i, /de forma similar/i, /asimismo/i, /del mismo modo/i,
  /igualmente/i, /también/i, /además/i, /por lo tanto/i, /en consecuencia/i,
  /por consiguiente/i, /en consecuencia/i, /de ahí que/i, /por ende/i,
  /es por ello que/i, /por esta razón/i, /debido a esto/i, /a causa de lo anterior/i,
  /no obstante/i, /sin embargo/i, /a pesar de/i, /aun cuando/i, /aunque/i,
  /por el contrario/i, /en contraste/i, /por otro lado/i, /por el otro lado/i,
  /es de destacar/i, /es de resaltar/i, /es de señalar/i, /conviene resaltar/i,
  /conviene destacar/i, /conviene señalar/i, /es relevante/i, /es significativo/i,
  /es notorio/i, /es manifiesto/i, /es patente/i, /es ostensible/i, /es palmario/i,
  /LLM/i, /modelo de lenguaje/i, /inteligencia artificial generativa/i, /ChatGPT/i,
  /esto demuestra que/i, /esto prueba que/i, /esto confirma que/i, /esto evidencia que/i,
  /lo anterior/i, /lo mencionado/i, /lo expuesto/i, /lo señalado/i, /lo dicho/i,
  /en definitiva/i, /en última instancia/i, /al final del día/i, /en el fondo/i,
  /lo cierto es que/i, /la realidad es que/i, /el hecho es que/i, /la verdad es que/i,
  /podemos concluir/i, /se puede concluir/i, /se concluye que/i, /concluimos que/i,
  /en síntesis/i, /para concluir/i, /como conclusión/i, /a modo de conclusión/i,
  /a modo de cierre/i, /como cierre/i, /para cerrar/i, /para finalizar/i,
  /para terminar/i, /para concluir/i, /en resumen final/i, /resumiendo/i,
  /esperamos que/i, /se espera que/i, /se confía en que/i, /se tiene la esperanza/i,
  /es de esperar que/i, /cabe esperar que/i, /resulta esperable que/i,
];

const LEYES_GENERICAS = /\b(?:Ley\s+\d{1,4}|Decreto\s+\d{1,4}|Artículo\s+\d{1,3}|Código\s+(?:Penal|Civil|Laboral|Procesal))\b.*?(?:protege|garantiza|establece|regula|contempla|dispone|señala|indica|estipula|determina|obliga|prohíbe|permite|faculta)/i;

function contarPalabras(texto) {
  return texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function extraerFechasFuturas(texto) {
  const matches = [];
  const patrones = [
    /\b(202[7-9]|203\d)\b/g,
    /\b(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(202[7-9]|203\d)/gi,
  ];
  for (const p of patrones) {
    const m = texto.match(p);
    if (m) matches.push(...m);
  }
  return [...new Set(matches)];
}

function detectarPatronesIA(texto) {
  const hallados = [];
  for (const patron of PATRONES_IA) {
    if (patron.test(texto)) {
      hallados.push(patron.source.substring(0, 40));
    }
  }
  return hallados;
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  const reporte = {
    total: docs.length,
    fechasFuturas: [],
    contenidoCorto: [],
    sinImagen: [],
    sinAutor: [],
    sinResumen: [],
    sinMeta: [],
    patronesIA: [],
    leyesGenericas: [],
    nombresInventados: [],
    buenas: [],
  };

  for (const doc of docs) {
    const contenido = doc.contenido || '';
    const textoLimpio = contenido.replace(/<[^>]*>/g, ' ');
    const palabras = contarPalabras(contenido);
    const problemas = [];

    // Fechas futuras en contenido
    const fechasFuturas = extraerFechasFuturas(contenido);
    if (fechasFuturas.length > 0) {
      problemas.push(`fechas futuras: ${fechasFuturas.join(', ')}`);
    }

    // Contenido corto
    if (palabras < 500) {
      problemas.push(`contenido corto: ${palabras} palabras`);
    }

    // Sin imagen
    if (!doc.imagen || doc.imagen === '' || doc.imagen === 'null' || doc.imagen === 'undefined') {
      problemas.push('sin imagen');
    }

    // Sin autor
    if (!doc.autor || doc.autor === '') {
      problemas.push('sin autor');
    }

    // Sin resumen
    if (!doc.resumen || doc.resumen === '') {
      problemas.push('sin resumen');
    }

    // Sin meta description
    if (!doc.metaDescription && !doc.metaDescripcion) {
      problemas.push('sin meta description');
    }

    // Patrones IA
    const patrones = detectarPatronesIA(contenido);
    if (patrones.length > 0) {
      problemas.push(`patrones IA (${patrones.length})`);
    }

    // Leyes genéricas
    if (LEYES_GENERICAS.test(contenido)) {
      problemas.push('leyes genéricas sin fuente');
    }

    // Nombres inventados (si ya fueron limpiados, no debería haber)
    if (doc.verificadoNombres) {
      // Ya limpiada
    }

    if (problemas.length > 0) {
      const item = { id: doc.id, titulo: doc.titulo || '(sin título)', palabras, problemas: problemas.join(' | ') };
      if (fechasFuturas.length > 0) reporte.fechasFuturas.push(item);
      if (palabras < 500) reporte.contenidoCorto.push(item);
      if (!doc.imagen || doc.imagen === '' || doc.imagen === 'null') reporte.sinImagen.push(item);
      if (!doc.autor) reporte.sinAutor.push(item);
      if (!doc.resumen) reporte.sinResumen.push(item);
      if (!doc.metaDescription && !doc.metaDescripcion) reporte.sinMeta.push(item);
      if (patrones.length > 0) reporte.patronesIA.push({ ...item, patronesHallados: patrones.length });
      if (LEYES_GENERICAS.test(contenido)) reporte.leyesGenericas.push(item);
    } else {
      reporte.buenas.push({ id: doc.id, titulo: doc.titulo, palabras });
    }
  }

  console.log(`\n📊 AUDITORÍA COMPLETA DE NOTICIAS`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`Total noticias: ${reporte.total}`);
  console.log(`Noticias limpias (sin problemas): ${reporte.buenas.length}`);
  console.log(`Noticias con problemas: ${reporte.total - reporte.buenas.length}`);
  console.log(`═══════════════════════════════════════════════════`);

  console.log(`\n📅 Fechas futuras detectadas: ${reporte.fechasFuturas.length}`);
  reporte.fechasFuturas.slice(0, 10).forEach((n, i) => console.log(`  ${i+1}. ${n.titulo} (${n.problemas})`));

  console.log(`\n📝 Contenido corto (<500 palabras): ${reporte.contenidoCorto.length}`);
  reporte.contenidoCorto.slice(0, 10).forEach((n, i) => console.log(`  ${i+1}. ${n.titulo} (${n.palabras} palabras)`));

  console.log(`\n🖼️  Sin imagen: ${reporte.sinImagen.length}`);
  reporte.sinImagen.slice(0, 10).forEach((n, i) => console.log(`  ${i+1}. ${n.titulo}`));

  console.log(`\n✍️  Sin autor: ${reporte.sinAutor.length}`);
  reporte.sinAutor.slice(0, 10).forEach((n, i) => console.log(`  ${i+1}. ${n.titulo}`));

  console.log(`\n📄 Sin resumen: ${reporte.sinResumen.length}`);
  reporte.sinResumen.slice(0, 10).forEach((n, i) => console.log(`  ${i+1}. ${n.titulo}`));

  console.log(`\n🏷️  Sin meta description: ${reporte.sinMeta.length}`);

  console.log(`\n🤖 Patrones IA detectados: ${reporte.patronesIA.length}`);
  reporte.patronesIA.slice(0, 10).forEach((n, i) => console.log(`  ${i+1}. ${n.titulo} (${n.patronesHallados} patrones)`));

  console.log(`\n⚖️  Leyes genéricas sin fuente: ${reporte.leyesGenericas.length}`);
  reporte.leyesGenericas.slice(0, 10).forEach((n, i) => console.log(`  ${i+1}. ${n.titulo}`));

  console.log(`\n✅ NOTICIAS LIMPIAS (${reporte.buenas.length}):`);
  reporte.buenas.slice(0, 10).forEach((n, i) => console.log(`  ${i+1}. ${n.titulo} (${n.palabras} palabras)`));

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
