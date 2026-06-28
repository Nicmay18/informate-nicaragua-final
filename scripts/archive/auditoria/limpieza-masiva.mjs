#!/usr/bin/env node
// limpieza-masiva.mjs — Limpieza forense masiva de noticias contaminadas por IA
// Lee noticias de Firestore, aplica reglas de limpieza, actualiza

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Inicializar Firebase Admin ───
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);

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

// ─── REGLAS DE LIMPIEZA ───

// 1. FRASES PROHIBIDAS DE IA → eliminar oración completa si es posible, o solo la frase
const FRASES_PROHIBIDAS = [
  { patron: /\s*asimismo[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*por otro lado[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*de igual manera[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*en ese sentido[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*cabe señalar[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*es importante destacar[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*vale la pena mencionar[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*resulta fundamental[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*resulta evidente[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*no cabe duda[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*en conclusión[,;]?\s*[^.]*\./gi, reemplazo: '.' },
  { patron: /\s*en resumen[,;]?\s*[^.]*\./gi, reemplazo: '.' },
  { patron: /\s*las autoridades reiteraron[,;]?\s*[^.]*\./gi, reemplazo: '.' },
  { patron: /\s*se espera que[,;]?\s*[^.]*\./gi, reemplazo: '.' },
  { patron: /\s*continúan las investigaciones[,;]?\s*[^.]*\./gi, reemplazo: 'Las autoridades continúan con las diligencias correspondientes.' },
  { patron: /\s*se mantienen operativos[,;]?\s*[^.]*\./gi, reemplazo: '.' },
  { patron: /\s*por su parte[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*en última instancia[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*a fin de cuentas[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*en el marco de[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*desde esta perspectiva[,;]?\s*/gi, reemplazo: ' ' },
  { patron: /\s*en el contexto de[,;]?\s*/gi, reemplazo: ' ' },
];

// 2. CITAS GENÉRICAS SIN ATRIBUCIÓN → eliminar oración completa
const CITAS_GENERICAS = [
  /"[^"]*",?\s*según fuentes\./gi,
  /"[^"]*",?\s*según datos oficiales\./gi,
  /"[^"]*",?\s*según informes\./gi,
  /"[^"]*",?\s*informó un portavoz\./gi,
  /Según fuentes[,;]?\s*[^.]*\./gi,
  /Según datos oficiales[,;]?\s*[^.]*\./gi,
  /Según informes[,;]?\s*[^.]*\./gi,
  /De acuerdo a informes[,;]?\s*[^.]*\./gi,
];

// 3. DATOS SOSPECHOSOS REPETIDOS → eliminar si no tienen fuente clara
const DATOS_SOSPECHOSOS = [
  /\b8%\b/gi,
  /\b5,?000\b/gi,
  /\b50,?000\b/gi,
  /\b1234\b/gi,
  /\b2,?000\b/gi,
  /\b45,?000\b/gi,
];

// 4. AÑOS PASADOS → verificar contexto antes de reemplazar
function corregirFechas(texto) {
  // Solo reemplazar años que NO estén en contexto histórico (ej: "Ley 431 de 2016")
  return texto.replace(/\b202[0-5]\b/g, (match, offset, string) => {
    // Verificar si hay contexto histórico antes (ej: "de 2020")
    const antes = string.slice(Math.max(0, offset - 30), offset).toLowerCase();
    if (/ley\s+\d+\s+de\s+$/.test(antes)) return match; // Ley de 2020 → no tocar
    if (/en\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+$/.test(antes)) return match; // Mes de 2020
    if (/desde\s+$/.test(antes)) return match; // Desde 2020
    if (/hasta\s+$/.test(antes)) return match; // Hasta 2020
    return '2026';
  });
}

// 5. ADJETIVOS EMOCIONALES PROHIBIDOS → eliminar
const ADJETIVOS_PROHIBIDOS = [
  'trágico', 'trágica', 'terrible', 'impactante', 'conmocionó', 'devastador',
  'horrible', 'alarmante', 'desgarrador', 'lamentable', 'dramático', 'escalofriante',
  'espeluznante', 'increíble', 'inimaginable', 'indignante', 'escandaloso',
  'vergonzoso', 'aterrador', 'mortífero', 'sangriento', 'brutal', 'salvaje',
  'violento', 'agresivo', 'desastroso', 'funesto', 'siniestro', 'macabro',
  'espantoso', 'atroz', 'crítico', 'crítica'
];

// ─── FUNCIONES DE LIMPIEZA ───

function limpiarFrasesIA(texto) {
  let resultado = texto;
  for (const { patron, reemplazo } of FRASES_PROHIBIDAS) {
    resultado = resultado.replace(patron, reemplazo);
  }
  return resultado;
}

function limpiarCitasGenericas(texto) {
  let resultado = texto;
  for (const patron of CITAS_GENERICAS) {
    resultado = resultado.replace(patron, '');
  }
  return resultado;
}

function limpiarAdjetivos(texto) {
  let resultado = texto;
  for (const adj of ADJETIVOS_PROHIBIDOS) {
    const regex = new RegExp(`\\b${adj}[a-z]*\\b`, 'gi');
    resultado = resultado.replace(regex, '');
  }
  return resultado;
}

function normalizarEspacios(texto) {
  return texto
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\.{2,}/g, '.')
    .trim();
}

function contarPalabras(texto) {
  const limpio = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio.split(' ').filter(w => w.length > 0).length;
}

function generarResumen(texto, maxChars = 157) {
  const limpio = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const oraciones = limpio.match(/[^.!?]+[.!?]+/g) || [limpio];
  let resumen = '';
  for (const oracion of oraciones) {
    if ((resumen + oracion).length <= maxChars) {
      resumen += oracion.trim() + ' ';
    } else {
      break;
    }
  }
  resumen = resumen.trim();
  if (resumen.length > maxChars) {
    resumen = resumen.slice(0, maxChars);
    const ultimoEspacio = resumen.lastIndexOf(' ');
    if (ultimoEspacio > 50) resumen = resumen.slice(0, ultimoEspacio);
  }
  return resumen + (resumen.endsWith('.') ? '' : '...');
}

// ─── PROCESAR UNA NOTICIA ───

function procesarNoticia(noticia) {
  let contenido = noticia.contenido || '';
  const cambios = [];

  // 1. Corregir fechas
  const contenidoConFechas = corregirFechas(contenido);
  if (contenidoConFechas !== contenido) {
    const fechasReemplazadas = (contenido.match(/\b202[0-5]\b/g) || []).length;
    cambios.push(`Fechas corregidas: ${fechasReemplazadas} años pasados → 2026`);
    contenido = contenidoConFechas;
  }

  // 2. Limpiar frases de IA
  const contenidoSinIA = limpiarFrasesIA(contenido);
  if (contenidoSinIA !== contenido) {
    cambios.push('Frases de IA eliminadas');
    contenido = contenidoSinIA;
  }

  // 3. Limpiar citas genéricas
  const contenidoSinCitas = limpiarCitasGenericas(contenido);
  if (contenidoSinCitas !== contenido) {
    cambios.push('Citas genéricas sin atribución eliminadas');
    contenido = contenidoSinCitas;
  }

  // 4. Limpiar adjetivos emocionales
  const contenidoSinAdjetivos = limpiarAdjetivos(contenido);
  if (contenidoSinAdjetivos !== contenido) {
    cambios.push('Adjetivos emocionales eliminados');
    contenido = contenidoSinAdjetivos;
  }

  // 5. Normalizar espacios
  contenido = normalizarEspacios(contenido);

  // 6. Generar/actualizar resumen si está fuera de rango
  let resumen = noticia.resumen || '';
  if (!resumen || resumen.length < 120 || resumen.length > 160) {
    resumen = generarResumen(contenido, 157);
    cambios.push(`Resumen regenerado: ${resumen.length} chars`);
  }

  // 7. Verificar estructura h2
  const h2s = (contenido.match(/<h2>/gi) || []).length;
  const pConSubtitulo = contenido.match(/<p>\s*(Hechos principales|Declaraciones de fuentes|Desarrollo|Antecedentes|Contexto|Detalles del incidente|Respuesta institucional|Reacciones|Impacto|Consecuencias|Medidas adoptadas|Investigación|Estadísticas|Cifras|Datos oficiales|Historial|Antecedentes similares|Marco legal|Sanciones|Penas|Contexto regional|Reacciones oficiales)\s*<\/p>/gi);
  if (pConSubtitulo) {
    contenido = contenido.replace(/<p>\s*(Hechos principales|Declaraciones de fuentes|Desarrollo|Antecedentes|Contexto|Detalles del incidente|Respuesta institucional|Reacciones|Impacto|Consecuencias|Medidas adoptadas|Investigación|Estadísticas|Cifras|Datos oficiales|Historial|Antecedentes similares|Marco legal|Sanciones|Penas|Contexto regional|Reacciones oficiales)\s*<\/p>/gi, '<h2>$1</h2>');
    cambios.push('Subtítulos <p> convertidos a <h2>');
  }

  const palabras = contarPalabras(contenido);

  return {
    ...noticia,
    contenido,
    resumen,
    cambios,
    palabras,
    h2s: (contenido.match(/<h2>/gi) || []).length,
    strongs: (contenido.match(/<strong>/gi) || []).length,
    blockquotes: (contenido.match(/<blockquote>/gi) || []).length,
  };
}

// ─── MAIN ───
async function main() {
  console.log('🧹 LIMPIEZA MASIVA — Nicaragua Infórmate');
  console.log('Conectando a Firestore...\n');

  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  const noticias = [];
  snapshot.forEach(doc => {
    noticias.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Total de noticias: ${noticias.length}`);
  console.log('Iniciando limpieza...\n');

  let modificadas = 0;
  let sinCambios = 0;
  let errores = 0;
  const reporte = [];

  for (const noticia of noticias) {
    try {
      const procesada = procesarNoticia(noticia);

      if (procesada.cambios.length > 0) {
        // Actualizar en Firestore
        await db.collection('noticias').doc(noticia.id).update({
          contenido: procesada.contenido,
          resumen: procesada.resumen,
          fechaActualizacion: FieldValue.serverTimestamp(),
        });

        modificadas++;
        reporte.push({
          id: noticia.id,
          titulo: noticia.titulo?.slice(0, 50),
          cambios: procesada.cambios,
          palabras: procesada.palabras,
          h2s: procesada.h2s,
        });

        console.log(`✅ [${noticia.id}] ${procesada.cambios.join(' | ')}`);
      } else {
        sinCambios++;
      }
    } catch (err) {
      errores++;
      console.error(`❌ [${noticia.id}] Error: ${err.message}`);
    }
  }

  // Guardar reporte
  writeFileSync('limpieza-reporte.json', JSON.stringify(reporte, null, 2));

  console.log('\n=== RESUMEN ===');
  console.log(`Noticias modificadas: ${modificadas}`);
  console.log(`Noticias sin cambios: ${sinCambios}`);
  console.log(`Errores: ${errores}`);
  console.log(`\n📄 Reporte guardado en: limpieza-reporte.json`);

  // Estadísticas post-limpieza
  console.log('\n=== ESTADÍSTICAS POST-LIMPIEZA ===');
  const postSnapshot = await db.collection('noticias').get();
  let conFechasMal = 0;
  let conFrasesIA = 0;
  let conCitasGen = 0;
  postSnapshot.forEach(doc => {
    const data = doc.data();
    const contenido = data.contenido || '';
    if (/\b202[0-5]\b/.test(contenido)) conFechasMal++;
    if (/se espera que|por su parte|en el contexto de|las autoridades reiteraron|asimismo|por otro lado/.test(contenido.toLowerCase())) conFrasesIA++;
    if (/según fuentes|según datos oficiales|según informes|informó un portavoz/.test(contenido.toLowerCase())) conCitasGen++;
  });
  console.log(`Fechas incorrectas restantes: ${conFechasMal}`);
  console.log(`Frases IA restantes: ${conFrasesIA}`);
  console.log(`Citas genéricas restantes: ${conCitasGen}`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
