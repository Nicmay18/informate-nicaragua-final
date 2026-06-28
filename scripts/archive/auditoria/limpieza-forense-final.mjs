#!/usr/bin/env node
// limpieza-forense-final.mjs — Limpieza masiva tipo "parche editorial" Reuters/AP
// Lee TODAS las noticias de Firestore, aplica limpieza forense, actualiza

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

// ─── DETECTORES ───

function tieneContextoNumerico(texto, offset) {
  const ventana = 60;
  const inicio = Math.max(0, offset - ventana);
  const fin = Math.min(texto.length, offset + ventana);
  const contexto = texto.slice(inicio, fin).toLowerCase();
  const palabrasContexto = [
    'c[oó]rdoba', 'd[oó]lar', 'peso', 'euro', 'monto', 'inversi[oó]n',
    'costo', 'precio', 'valor', 'cantidad', 'personas', 'afectad',
    'poblaci[oó]n', 'habitantes', 'beneficiar', 'pago', 'salario',
    'ingreso', 'gasto', 'recaud', 'inversi[oó]n', 'presupuesto',
    'año', 'edad', 'años', 'kil[oó]metro', 'km', 'hora', 'horas',
    'minuto', 'metro', 'litro', 'gal[oó]n', 'tonelada', 'kg', 'kilo',
    'por ciento', 'porcentaje', '%', 'mill[oó]n', 'mil'
  ];
  return palabrasContexto.some(p => new RegExp(p).test(contexto));
}

function tieneContextoPlaca(texto, offset) {
  const ventana = 80;
  const inicio = Math.max(0, offset - ventana);
  const fin = Math.min(texto.length, offset + ventana);
  const contexto = texto.slice(inicio, fin).toLowerCase();
  return /(?:placa|matr[ií]cula|veh[ií]culo|motocicleta|auto|carro|camion|conduc|conductor|impact|choc|colisi[oó]n|accident)/.test(contexto);
}

function esModeloTelefono(texto, offset) {
  const ventana = 100;
  const inicio = Math.max(0, offset - ventana);
  const fin = Math.min(texto.length, offset + ventana);
  const contexto = texto.slice(inicio, fin).toLowerCase();
  return /(?:galaxy|samsung|xiaomi|iphone|modelo|android|smartphone|tel[eé]fono|m[oó]vil|celular|dispositivo)/.test(contexto);
}

// ─── LIMPIEZA ───

function limpiarNoticia(contenidoOriginal) {
  let texto = contenidoOriginal;
  const cambios = [];

  // 1. ELIMINAR FRASES DE IA COMPLETAMENTE
  const frasesIA = [
    /[,;]?\s*asimismo[,;]?\s*/gi,
    /[,;]?\s*por otro lado[,;]?\s*/gi,
    /[,;]?\s*de igual manera[,;]?\s*/gi,
    /[,;]?\s*en ese sentido[,;]?\s*/gi,
    /[,;]?\s*cabe señalar[,;]?\s*/gi,
    /[,;]?\s*es importante destacar[,;]?\s*/gi,
    /[,;]?\s*vale la pena mencionar[,;]?\s*/gi,
    /[,;]?\s*resulta fundamental[,;]?\s*/gi,
    /[,;]?\s*resulta evidente[,;]?\s*/gi,
    /[,;]?\s*no cabe duda[,;]?\s*/gi,
    /[,;]?\s*en conclusi[oó]n[,;]?\s*[^.]*\./gi,
    /[,;]?\s*en resumen[,;]?\s*[^.]*\./gi,
    /[,;]?\s*las autoridades reiteraron[,;]?\s*[^.]*\./gi,
    /[,;]?\s*se espera que[,;]?\s*[^.]*\./gi,
    /[,;]?\s*contin[uú]an las investigaciones[,;]?\s*[^.]*\./gi,
    /[,;]?\s*se mantienen operativos[,;]?\s*[^.]*\./gi,
    /[,;]?\s*por su parte[,;]?\s*/gi,
    /[,;]?\s*en [uú]ltima instancia[,;]?\s*/gi,
    /[,;]?\s*a fin de cuentas[,;]?\s*/gi,
    /[,;]?\s*en el marco de[,;]?\s*/gi,
    /[,;]?\s*desde esta perspectiva[,;]?\s*/gi,
    /[,;]?\s*en el contexto de[,;]?\s*/gi,
  ];

  frasesIA.forEach(regex => {
    const antes = texto;
    texto = texto.replace(regex, match => {
      if (match !== antes) {
        // Solo contar si realmente hubo reemplazo
      }
      return ' ';
    });
  });

  // 2. CORREGIR CITAS DUDOSAS
  const citasDudosas = [
    { regex: /"([^"]*)"[,\s]*seg[uú]n fuentes/gi, reemplazo: 'seg[uú]n informaci[oó]n de la Polic[ií]a Nacional' },
    { regex: /seg[uú]n fuentes[,;]?\s*[^.]*\./gi, reemplazo: '.' },
    { regex: /seg[uú]n datos oficiales[,;]?\s*[^.]*\./gi, reemplazo: '.' },
    { regex: /seg[uú]n informes[,;]?\s*[^.]*\./gi, reemplazo: '.' },
    { regex: /"([^"]*)"[,\s]*inform[oó] un portavoz/gi, reemplazo: 'inform[oó] la Polic[ií]a Nacional' },
    { regex: /inform[oó] un portavoz[,;]?\s*[^.]*\./gi, reemplazo: '.' },
  ];

  citasDudosas.forEach(({ regex }) => {
    texto = texto.replace(regex, match => {
      cambios.push(`Cita dudosa eliminada/corregida`);
      return '.';
    });
  });

  // 3. NÚMEROS SIN CONTEXTO → eliminar o marcar
  // Primero pasada: números genéricos como 1234
  texto = texto.replace(/\b1234\b/g, (match, offset) => {
    cambios.push(`Número genérico "1234" eliminado`);
    return '';
  });

  // Segunda pasada: cifras grandes sin contexto
  const cifrasGrandes = /\b\d{1,2}(?:,\d{3})+\b/g;
  texto = texto.replace(cifrasGrandes, (match, offset) => {
    if (tieneContextoNumerico(texto, offset)) return match;
    cambios.push(`Cifra sin contexto eliminada: ${match}`);
    return '';
  });

  // Tercera pasada: porcentajes sin contexto
  texto = texto.replace(/\b\d{1,2}(?:\.\d+)?%\b/g, (match, offset) => {
    if (tieneContextoNumerico(texto, offset)) return match;
    cambios.push(`Porcentaje sin contexto eliminado: ${match}`);
    return '';
  });

  // 4. PLACAS Y CÓDIGOS GENÉRICOS
  // Patrones: M 123, M 12, A 17, M4, S25 (si no es modelo de teléfono)
  texto = texto.replace(/\b([A-Z])\s*(\d{1,3})\b/g, (match, letra, num, offset) => {
    if (esModeloTelefono(texto, offset)) return match;
    if (!tieneContextoPlaca(texto, offset)) return match;
    if (parseInt(num) >= 100 && num.length >= 3) return match; // Placas más largas pueden ser reales
    cambios.push(`Placa genérica reemplazada: ${match}`);
    return '[placa no especificada en informe oficial]';
  });

  // 5. ADJETIVOS EMOCIONALES
  const adjetivos = [
    'tr[áa]gico', 'tr[áa]gica', 'terrible', 'impactante', 'conmocion[oó]',
    'devastador', 'horrible', 'alarmante', 'desgarrador', 'lamentable',
    'dram[áa]tico', 'escalofriante', 'espeluznante', 'incre[ií]ble',
    'inimaginable', 'indignante', 'escandaloso', 'vergonzoso', 'aterrador',
    'mort[ií]fero', 'sangriento', 'brutal', 'salvaje', 'violento',
    'agresivo', 'desastroso', 'funesto', 'siniestro', 'macabro',
    'espantoso', 'atr[óo]z', 'cr[ií]tico', 'cr[ií]tica'
  ];

  adjetivos.forEach(adj => {
    const regex = new RegExp(`\\b${adj}[a-z]*\\b`, 'gi');
    texto = texto.replace(regex, match => {
      cambios.push(`Adjetivo emocional eliminado: ${match}`);
      return '';
    });
  });

  // 6. NORMALIZAR ESPACIOS
  texto = texto
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\.{2,}/g, '.')
    .replace(/<p>\s*<\/p>/gi, '')
    .trim();

  // 7. CORREGIR FECHAS A 2026 (solo años en contexto de evento actual, no histórico)
  const textoConFechas = texto.replace(/\b202[0-5]\b/g, (match, offset) => {
    const contexto = texto.slice(Math.max(0, offset - 40), offset + 40).toLowerCase();
    // No tocar si es contexto histórico explícito
    if (/ley\s+\d+|desde\s+\d{4}|hasta\s+\d{4}|antecedente|hist[oó]rico|en\s+\d{4}/.test(contexto)) {
      return match;
    }
    cambios.push(`Año ${match} corregido a 2026`);
    return '2026';
  });
  texto = textoConFechas;

  return { contenido: texto, cambios: [...new Set(cambios)] };
}

function contarPalabras(texto) {
  const limpio = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio.split(' ').filter(w => w.length > 0).length;
}

function validarFinal(contenido) {
  const errores = [];
  const texto = contenido.toLowerCase();

  // Verificar que no queden frases IA
  const frasesIA = ['asimismo', 'por otro lado', 'en ese sentido', 'cabe señalar', 'resulta fundamental', 'se espera que', 'continúan las investigaciones'];
  frasesIA.forEach(f => { if (texto.includes(f)) errores.push(`Frase IA residual: ${f}`); });

  // Verificar citas genéricas
  if (/según fuentes|informó un portavoz|según datos oficiales/.test(texto)) {
    errores.push('Citas genéricas sin atribución');
  }

  // Verificar números genéricos
  if (/\b1234\b/.test(texto)) errores.push('Número genérico 1234');

  // Verificar placas genéricas
  const placasGen = texto.match(/\b[a-z]\s*\d{1,3}\b/g);
  if (placasGen) errores.push(`Placas genéricas: ${placasGen.join(', ')}`);

  return errores;
}

function determinarNivel(cambios, palabras, erroresValidacion) {
  if (erroresValidacion.length > 0) return { nivel: 'REVISAR', accion: 'REVISAR' };
  if (cambios.length === 0 && palabras >= 350) return { nivel: 'ALTO', accion: 'PUBLICAR' };
  if (cambios.length <= 3 && palabras >= 300) return { nivel: 'ALTO', accion: 'PUBLICAR' };
  if (cambios.length <= 5 && palabras >= 250) return { nivel: 'MEDIO', accion: 'PUBLICAR' };
  if (palabras < 200) return { nivel: 'BAJO', accion: 'DESCARTAR' };
  return { nivel: 'MEDIO', accion: 'REVISAR' };
}

// ─── MAIN ───
async function main() {
  console.log('🧹 LIMPIEZA FORENSE FINAL — Protocolo Reuters/AP\n');

  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  const noticias = [];
  snapshot.forEach(doc => {
    noticias.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Total noticias: ${noticias.length}\n`);

  let publicar = 0;
  let revisar = 0;
  let descartar = 0;
  const reporte = [];
  let procesadas = 0;

  for (const nota of noticias) {
    procesadas++;
    const { contenido, cambios } = limpiarNoticia(nota.contenido || '');
    const palabras = contarPalabras(contenido);
    const erroresVal = validarFinal(contenido);
    const { nivel, accion } = determinarNivel(cambios, palabras, erroresVal);

    // Actualizar en Firestore
    await db.collection('noticias').doc(nota.id).update({
      contenido,
      fechaActualizacion: FieldValue.serverTimestamp(),
    });

    if (accion === 'PUBLICAR') publicar++;
    else if (accion === 'REVISAR') revisar++;
    else descartar++;

    reporte.push({
      id: nota.id,
      titulo: (nota.titulo || '').slice(0, 60),
      palabras,
      cambios: cambios.length,
      detalleCambios: cambios,
      erroresRestantes: erroresVal,
      nivel,
      accion,
    });

    if (procesadas % 50 === 0) {
      console.log(`Procesadas ${procesadas}/${noticias.length}...`);
    }
  }

  writeFileSync('limpieza-forense-final.json', JSON.stringify(reporte, null, 2));

  console.log('\n=== RESULTADO FINAL ===');
  console.log(`Total procesadas: ${noticias.length}`);
  console.log(`✅ PUBLICAR: ${publicar} (${((publicar/noticias.length)*100).toFixed(1)}%)`);
  console.log(`⚠️  REVISAR: ${revisar} (${((revisar/noticias.length)*100).toFixed(1)}%)`);
  console.log(`❌ DESCARTAR: ${descartar} (${((descartar/noticias.length)*100).toFixed(1)}%)`);

  // Top cambios aplicados
  const cambiosGlobal = {};
  reporte.forEach(r => {
    r.detalleCambios.forEach(c => {
      cambiosGlobal[c] = (cambiosGlobal[c] || 0) + 1;
    });
  });

  console.log('\n=== TOP 15 CAMBIOS APLICADOS ===');
  Object.entries(cambiosGlobal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([c, n], i) => {
      console.log(`${i+1}. ${c}: ${n} notas`);
    });

  // Riesgo
  console.log('\n=== RIESGO ===');
  console.log(`Google News: ${descartar > 10 ? 'ALTO' : descartar > 0 ? 'MEDIO' : 'BAJO'}`);
  console.log(`Discover: ${revisar > 50 ? 'ALTO' : revisar > 20 ? 'MEDIO' : 'BAJO'}`);
  console.log(`AdSense: ${descartar > 5 ? 'ALTO' : revisar > 30 ? 'MEDIO' : 'BAJO'}`);

  console.log('\n📄 Reporte: limpieza-forense-final.json');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
