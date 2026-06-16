#!/usr/bin/env node
/**
 * GENERAR PUNTOS CLAVE — Script de automatización editorial
 * Extrae 3 puntos clave de cada noticia en Firestore que no los tenga.
 *
 * Uso:
 *   node generar-puntos-clave.mjs           # Procesa TODAS las noticias sin puntosClave
 *   node generar-puntos-clave.mjs --dry-run # Solo muestra, no guarda
 *   node generar-puntos-clave.mjs --limit=5  # Procesa máximo 5 noticias
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ─── CONFIGURACIÓN FIREBASE ───
async function initApp() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);

  // 1. scripts/firebase-admin-key.json (patrón usado por otros scripts del proyecto)
  try {
    const sa = JSON.parse(readFileSync('./scripts/firebase-admin-key.json', 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {}

  // 2. serviceAccount.json en raíz
  try {
    const sa = JSON.parse(readFileSync('./serviceAccount.json', 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {}

  // 3. Variable de entorno BASE64
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }

  // 4. Variables de entorno individuales
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKeyRaw) {
    const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return getFirestore(app);
  }

  console.error('ERROR: No se encontraron credenciales de Firebase.');
  console.error('Buscados: scripts/firebase-admin-key.json, serviceAccount.json, .env.local, env vars');
  process.exit(1);
}

const db = await initApp();
const noticiasRef = db.collection('noticias');

// ─── ARGUMENTOS CLI ───
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || Infinity;

// ─── EXTRACTOR DE ORACIONES ───
function splitSentences(text) {
  if (!text) return [];
  // Normalizar HTML
  const plain = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Separar por delimitadores de oración
  return plain
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300);
}

// ─── SCORING DE IMPORTANCIA ───
function scoreSentence(sentence, index, total, titulo, categoria) {
  let score = 0;
  const s = sentence.toLowerCase();

  // 1. Posición: primeras oraciones valen más (pirámide invertida)
  if (index === 0) score += 15;
  else if (index === 1) score += 10;
  else if (index === 2) score += 5;
  else score += Math.max(0, 10 - index);

  // 2. Contiene números/datos → más importante
  if (/\d+%|\d+ millones|\d+ mil|\$\d|\d+ personas|\d+ heridos|\d+ fallecidos|\d+ años/i.test(sentence)) {
    score += 20;
  }
  if (/\d+/.test(sentence)) score += 8;

  // 3. Nombres propios (Nicaragua, ciudades, personas)
  const lugares = /managua|estelí|leon|granada|masaya|chinandega|tipitapa|sebaco|bluefields|puerto cabezas|jinotega|matagalpa|boaco|chontales|rió san juan|carazo|madriz|nueva segovia|raan|raas|rivas/;
  const paises = /nicaragua|ee\.?uu|estados unidos|méxico|guatemala|honduras|el salvador|costa rica|panamá|colombia|venezuela|españa|cuba|rusia|china|brasil|argentina|chile|perú|ecuador/;
  if (lugares.test(s)) score += 12;
  if (paises.test(s)) score += 10;

  // 4. Palabras de impacto
  const impacto = /alerta|emergencia|tragedia|accidente|crimen|violencia|protesta|manifestación|huelga|paro|crisis|escándalo|detención|arresto|condena|sentencia|fallece|muere|explosión|incendio|inundación|terremoto|huracán/;
  if (impacto.test(s)) score += 15;

  // 5. Verbos de acción fuertes
  const accion = /anuncia|declara|confirma|revela|denuncia|prohíbe|autoriza|aprueba|rechaza|gana|pierde|logra|obtiene|descubre|investiga|sanciona|suspender|cancela/;
  if (accion.test(s)) score += 10;

  // 6. Cita o atribución
  if (/".*"/.test(sentence) || /según|dijo|afirmó|indicó|señaló|manifestó/.test(s)) {
    score += 8;
  }

  // 7. Palabras del título presentes en la oración
  const tituloWords = titulo.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const matches = tituloWords.filter(w => s.includes(w)).length;
  score += matches * 5;

  // 8. Penalización por "ruido"
  if (/leer más|continúa|haga clic|suscríbase|publicidad|redes sociales|comparta|comente/i.test(s)) {
    score -= 30;
  }
  if (s.startsWith('foto:') || s.startsWith('imagen:')) score -= 20;

  // 9. Longitud ideal: entre 60 y 180 caracteres
  const len = sentence.length;
  if (len >= 60 && len <= 150) score += 5;
  else if (len > 200) score -= 5;

  return score;
}

// ─── ETIQUETADO PERIODÍSTICO ───
function etiquetarPunto(sentence, index) {
  const s = sentence.toLowerCase();
  let etiqueta = '';

  if (index === 0) {
    // Primer punto: Qué / Dónde / Cuándo
    if (/managua|estelí|leon|granada|masaya|nicaragua|puerto|departamento|municipio|comarca|barrio/.test(s)) {
      etiqueta = 'Dónde';
    } else if (/ayer|hoy|este|pasado|lunes|martes|miércoles|jueves|viernes|sábado|domingo|morning|tarde|noche|\d+ de \w+/.test(s)) {
      etiqueta = 'Cuándo';
    } else {
      etiqueta = 'Qué pasó';
    }
  } else if (index === 1) {
    // Segundo punto: Por qué / Cómo
    if (/porque|debido a|a causa de|tras|después de|como consecuencia|motivado|provocado|originado/.test(s)) {
      etiqueta = 'Por qué';
    } else if (/mediante|a través de|usando|con la ayuda|por medio de|vía|forma|manera/.test(s)) {
      etiqueta = 'Cómo';
    } else {
      etiqueta = 'Contexto';
    }
  } else {
    // Tercer punto: Consecuencia / Dato de impacto
    if (/condena|sentencia|prisión|multa|sanción|prohibición|aprobación|autorización|resultado|consecuencia|provocó|generó|ocasionó|dejó|causó|afectó/.test(s)) {
      etiqueta = 'Consecuencia';
    } else if (/\d+%|\d+ millones|\d+ mil|\$\d|\d+ personas|\d+ heridos|\d+ fallecidos/.test(s)) {
      etiqueta = 'Dato clave';
    } else {
      etiqueta = 'Repercusión';
    }
  }

  return { etiqueta, texto: sentence.trim() };
}

// ─── GENERAR 3 PUNTOS ───
function generarPuntosClave(noticia) {
  const texto = `${noticia.titulo}. ${noticia.resumen || ''} ${noticia.contenido || ''}`;
  const oraciones = splitSentences(texto);

  if (oraciones.length < 3) {
    return null; // No hay suficiente contenido
  }

  // Scorear todas las oraciones
  const scored = oraciones.map((sent, i) => ({
    sent,
    score: scoreSentence(sent, i, oraciones.length, noticia.titulo, noticia.categoria),
  }));

  // Ordenar por score descendente y tomar top 6
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 6).map(x => x.sent);

  // Seleccionar 3 que sean diversas (no muy similares entre sí)
  const seleccionados = [top[0]];
  for (const cand of top.slice(1)) {
    if (seleccionados.length >= 3) break;
    const cLow = cand.toLowerCase();
    const isSimilar = seleccionados.some(s => {
      const sLow = s.toLowerCase();
      // Comparación simple: si comparten >60% de palabras de 5+ chars
      const wordsS = sLow.split(/\s+/).filter(w => w.length >= 5);
      const wordsC = cLow.split(/\s+/).filter(w => w.length >= 5);
      const common = wordsS.filter(w => wordsC.includes(w));
      return common.length / Math.max(wordsS.length, 1) > 0.5;
    });
    if (!isSimilar) seleccionados.push(cand);
  }

  // Si no alcanzamos 3, rellenar con los que queden
  if (seleccionados.length < 3) {
    for (const cand of top) {
      if (seleccionados.length >= 3) break;
      if (!seleccionados.includes(cand)) seleccionados.push(cand);
    }
  }

  // Etiquetar y formatear
  return seleccionados.slice(0, 3).map((sent, i) => etiquetarPunto(sent, i));
}

// ─── MAIN ───
async function main() {
  console.log('══════════════════════════════════════════════════════════');
  console.log('  GENERADOR DE PUNTOS CLAVE — Nicaragua Informate');
  console.log('══════════════════════════════════════════════════════════\n');

  if (DRY_RUN) {
    console.log('🔍 MODO DRY-RUN: Solo muestra, NO guarda en Firestore\n');
  }

  // Obtener noticias sin puntosClave
  let query = noticiasRef.where('estado', '==', 'publicado')
    .where('puntosClave', '==', null);

  // También buscar noticias donde puntosClave no existe (array vacío no cuenta)
  // Firestore no permite OR en campos simples, hacemos dos queries
  const [snapMissing, snapEmpty] = await Promise.all([
    noticiasRef.where('estado', '==', 'publicado').where('puntosClave', '==', null).limit(LIMIT).get(),
    noticiasRef.where('estado', '==', 'publicado').where('puntosClave', '==', []).limit(LIMIT).get(),
  ]);

  const docs = [];
  const seen = new Set();
  for (const d of [...snapMissing.docs, ...snapEmpty.docs]) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      docs.push(d);
    }
    if (docs.length >= LIMIT) break;
  }

  if (docs.length === 0) {
    console.log('✅ Todas las noticias publicadas ya tienen puntos clave.');
    process.exit(0);
  }

  console.log(`📰 Noticias a procesar: ${docs.length}\n`);

  let actualizadas = 0;
  let fallidas = 0;

  for (const doc of docs) {
    const noticia = { id: doc.id, ...doc.data() };
    const puntos = generarPuntosClave(noticia);

    if (!puntos) {
      console.log(`  ⚠️  "${noticia.titulo?.substring(0, 50)}..." — Contenido insuficiente`);
      fallidas++;
      continue;
    }

    console.log(`\n📝 ${noticia.titulo?.substring(0, 60)}${noticia.titulo?.length > 60 ? '...' : ''}`);
    puntos.forEach((p, i) => {
      console.log(`   ${i + 1}. [${p.etiqueta}] ${p.texto.substring(0, 120)}${p.texto.length > 120 ? '...' : ''}`);
    });

    if (!DRY_RUN) {
      try {
        await doc.ref.update({ puntosClave: puntos });
        actualizadas++;
        console.log('   ✅ Guardado en Firestore');
      } catch (err) {
        console.error('   ❌ Error al guardar:', err.message);
        fallidas++;
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Total procesadas: ${docs.length}`);
  if (!DRY_RUN) {
    console.log(`  ✅ Actualizadas: ${actualizadas}`);
    console.log(`  ❌ Fallidas: ${fallidas}`);
  } else {
    console.log('  (MODO DRY-RUN: No se guardó nada)');
    console.log(`  Para guardar, ejecutá sin --dry-run`);
  }
  console.log('');

  process.exit(0);
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
