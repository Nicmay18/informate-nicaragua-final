/**
 * Bulk Update — Generador de títulos optimizados para noticias fuera de rango
 * Lee Firestore, genera títulos corregidos (55-65 chars), guarda propuesta JSON.
 *
 * NO modifica Firestore directamente. Genera un archivo de propuestas para
 * que el editor revise y aplique manualmente o vía admin panel.
 *
 * Ejecutar: node scripts/bulk-update-titulos.mjs
 * Salida: scripts/output/bulk-titulos-propuesta.json
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

function initDb() {
  if (getApps().length > 0) {
    return getFirestore(getApp());
  }

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

// Tipos de noticia → categoría
const TIPO_MAP = {
  'Tecnología': 'tecnologia',
  'Sucesos': 'sucesos',
  'Economía': 'nacionales',
  'Salud': 'nacionales',
  'Infraestructura': 'nacionales',
  'Judicial': 'nacionales',
  'Nacionales': 'nacionales',
  'Deportes': 'deportes',
  'Internacionales': 'internacionales',
  'Espectáculos': 'espectaculos',
  'General': 'nacionales',
};

function contarPalabras(texto) {
  if (!texto) return 0;
  const plain = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.split(/\s+/).filter(Boolean).length;
}

function extraerLead(contenido) {
  if (!contenido) return '';
  const plain = contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const firstSentence = plain.match(/[^.!?]+[.!?]+/)?.[0] || plain.slice(0, 200);
  return firstSentence.trim();
}

function generarTituloOptimizado(tituloOriginal, categoria, lead) {
  // Reglas de generación de título SEO (simplificado de lib/seo/title.ts)
  const MAX = 65;
  const MIN = 55;

  // Limpiar
  let t = tituloOriginal
    .replace(/[¡!]/g, '')
    .replace(/\.\.\./g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Si ya está en rango, devolverlo
  if (t.length >= MIN && t.length <= MAX) return t;

  // Extraer entidades del lead para contexto
  const lugarMatch = lead.match(/\b(Managua|León|Granada|Masaya|Estelí|Jinotega|Matagalpa|Rivas|Chinandega|Carazo|Madriz|Nueva Segovia|Río San Juan|Boaco|Chontales|Costa Rica|Nicaragua)\b/);
  const lugar = lugarMatch ? lugarMatch[1] : 'Nicaragua';

  // Detectar verbo fuerte en título original
  const verbosFuertes = ['anuncia', 'confirma', 'investiga', 'reporta', 'detalla', 'abre', 'inicia', 'presenta', 'lanza', 'condena'];
  const verboEncontrado = verbosFuertes.find(v => t.toLowerCase().includes(v));

  // Si el título es muy largo, truncar inteligentemente
  if (t.length > MAX) {
    // Cortar en último espacio antes de MAX
    const cutAt = t.lastIndexOf(' ', MAX - 3);
    if (cutAt > MIN) {
      return t.slice(0, cutAt).trim();
    }
  }

  // Si el título es muy corto, expandir con contexto
  if (t.length < MIN) {
    const expansions = [
      `${t} en ${lugar}: detalles del caso`,
      `${t}: autoridades confirman en ${lugar}`,
      `${t} — Nicaragua Informate`,
      `${t} en ${lugar} según reporte oficial`,
    ];
    for (const exp of expansions) {
      if (exp.length >= MIN && exp.length <= MAX) return exp;
    }
  }

  // Fallback: devolver truncado a MAX
  return t.slice(0, MAX).trim();
}

async function generarPropuestas() {
  console.log('🔧 Generando propuestas de títulos optimizados...\n');

  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  const propuestas = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const titulo = d.titulo || '';
    const contenido = d.contenido || '';
    const categoria = d.categoria || 'General';
    const palabras = contarPalabras(contenido);
    const lead = extraerLead(contenido);

    // Solo procesar si título está fuera de rango 55-65
    if (titulo.length >= 55 && titulo.length <= 65) continue;

    const nuevoTitulo = generarTituloOptimizado(titulo, categoria, lead);

    propuestas.push({
      id: doc.id,
      slug: d.slug || 'sin-slug',
      tituloActual: titulo,
      tituloLength: titulo.length,
      tituloPropuesto: nuevoTitulo,
      propuestaLength: nuevoTitulo.length,
      categoria,
      palabras,
      fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString().slice(0, 10) : 'unknown',
      lead: lead.slice(0, 100),
    });
  }

  // Guardar JSON
  const outDir = resolve(process.cwd(), 'scripts/output');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'bulk-titulos-propuesta.json');
  writeFileSync(outPath, JSON.stringify({
    fechaGeneracion: new Date().toISOString(),
    totalPropuestas: propuestas.length,
    propuestas,
  }, null, 2));

  console.log(`📊 TOTAL NOTICIAS: ${snapshot.docs.length}`);
  console.log(`🔴 Títulos fuera de rango (55-65): ${propuestas.length}`);
  console.log(`\n✅ Propuestas guardadas en: ${outPath}`);

  // Mostrar primeras 10
  if (propuestas.length > 0) {
    console.log('\n📋 PRIMERAS 10 PROPUESTAS:');
    console.log('─'.repeat(80));
    propuestas.slice(0, 10).forEach((p, i) => {
      console.log(`\n${i + 1}. [${p.slug}]`);
      console.log(`   Actual:  "${p.tituloActual}" (${p.tituloLength})`);
      console.log(`   Propuesta: "${p.tituloPropuesto}" (${p.propuestaLength})`);
    });
  }

  process.exit(0);
}

generarPropuestas().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
