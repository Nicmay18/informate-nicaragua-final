import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN — LISTAS DE DETECCIÓN
// ═══════════════════════════════════════════════════════════════

const RELLENO_EMOCIONAL = [
  "consternada", "consternado", "conmoción", "conmocionó", "dolor",
  "tragedia", "trágico", "tragico", "último adiós", "ultimo adios",
  "perdió la batalla", "perdio la batalla", "fatal desenlace",
  "cristiana sepultura", "honras fúnebres", "honras funebres",
  "enlutó", "enluta", "consternación", "consternacion",
  "ambiente de dolor", "salir del asombro", "asombro",
  "familiares lamentan", "lamentan la pérdida", "lamentan la perdida",
  "comunidad consternada", "hecho conmocionó", "conmocionó a",
  "profundo dolor", "profunda tristeza", "vida truncada",
  "jóven promesa", "joven promesa", "amado", "querido",
  "incomprensible", "indignante", "irresponsable", "criminal",
  "brindan apoyo", "organizaciones brindan", "darán el último",
  "recibirá cristiana", "perdió la vida"
];

const TRANSICIONES_IA = [
  "además", "por otro lado", "en cuanto a", "en relación a",
  "por su parte", "asimismo", "del mismo modo", "en consecuencia",
  "en conclusión", "finalmente", "para finalizar",
  "es importante destacar", "cabe señalar", "cabe senalar",
  "en este sentido", "al respecto", "por lo tanto",
  "de igual manera", "de la misma forma", "en tanto que",
  "no obstante", "sin embargo", "por el contrario",
  "en primer lugar", "en segundo lugar", "en tercer lugar"
];

const FUENTES_GENERICAS = [
  "autoridades confirmaron", "autoridades investigan",
  "fuentes policiales", "fuentes oficiales",
  "testigos indicaron", "testigos señalaron",
  "se presume que", "se supone que",
  "hasta el cierre", "hasta el momento",
  "se espera que", "se estima que"
];

const LUGARES_NICARAGUA = [
  "managua", "león", "leon", "granada", "masaya", "estelí", "esteli",
  "chinandega", "matagalpa", "jinotega", "rivas", "madriz", "nueva segovia",
  "boaco", "chontales", "raan", "raccs", "carazo", "rivas",
  "san juan del sur", "jinotepe", "diriamba", "tipitapa", "ciudad sandino",
  "el sauce", "la paz centro", "nagarote", "wiwilí", "wiwili",
  "ocotal", "somoto", "sébaco", "sebaco", "juigalpa", "camoapa"
];

// ═══════════════════════════════════════════════════════════════
// FIREBASE
// ═══════════════════════════════════════════════════════════════

function getAdminApp() {
  if (getApps().length > 0) return getApp();
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    return initializeApp({ credential: cert(sa) });
  }

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Faltan variables de entorno de Firebase');
  }

  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  return initializeApp({ credential: cert({ projectId, privateKey, clientEmail }) });
}

const db = getFirestore(getAdminApp());

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE ANÁLISIS
// ═══════════════════════════════════════════════════════════════

function contarPalabras(texto) {
  const palabras = texto.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g) || [];
  return palabras.length;
}

function detectarRellenoEmocional(texto) {
  const encontrados = [];
  const textoLower = texto.toLowerCase();
  for (const frase of RELLENO_EMOCIONAL) {
    if (textoLower.includes(frase)) {
      const idx = textoLower.indexOf(frase);
      const inicio = Math.max(0, idx - 30);
      const fin = Math.min(texto.length, idx + frase.length + 30);
      encontrados.push({ frase, contexto: `...${texto.slice(inicio, fin).replace(/\n/g, ' ')}...` });
    }
  }
  return encontrados;
}

function detectarTransicionesIA(texto) {
  const encontrados = [];
  const textoLower = texto.toLowerCase();
  for (const transicion of TRANSICIONES_IA) {
    const count = textoLower.split(transicion).length - 1;
    if (count > 0) encontrados.push({ transicion, cantidad: count });
  }
  return encontrados;
}

function detectarFuentesGenericas(texto) {
  const encontrados = [];
  const textoLower = texto.toLowerCase();
  for (const fuente of FUENTES_GENERICAS) {
    if (textoLower.includes(fuente)) encontrados.push(fuente);
  }
  return encontrados;
}

function detectarFuentesAtribuidas(texto) {
  const patrones = [
    /[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?,\s*(?:vocero|director|jefe|sargento|comisionado|coordinador|testigo|vecino)/gi,
    /(?:afirmó|indicó|declaró|señaló|dijo)\s+[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+/gi,
    /(?:según|de acuerdo con)\s+(?:la|el)\s+(?:Policía Nacional|Cuerpo de Bomberos|MINSA|INETER|Alcaldía|Fuerza Naval|Ejército)/gi,
    /Estación\s+(?:Policía|de Bomberos)\s+(?:número|numero|#)?\s*\d+/gi
  ];
  const encontrados = [];
  for (const patron of patrones) {
    const matches = texto.match(patron) || [];
    encontrados.push(...matches);
  }
  return [...new Set(encontrados)];
}

function detectarCitasTextuales(texto) {
  const citas = texto.match(/[\"\'\u201c\u201d]([^\"\'\u201c\u201d]{10,})[\"\'\u201c\u201d]/g) || [];
  return citas.map(c => c.slice(1, -1).trim()).filter(c => c.length > 10);
}

function detectarDatosConcretos(texto) {
  return {
    edades: (texto.match(/\b\d{1,2}\s+años\b/g) || []).length,
    horas: (texto.match(/\b\d{1,2}:\d{2}\s*(?:horas|a\.m\.|p\.m\.|am|pm)?\b/g) || []).length,
    fechas: (texto.match(/\b(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/gi) || []).length,
    kilometros: (texto.match(/\b\d+(?:\.\d+)?\s*(?:km|kilómetros|kilometros)\b/gi) || []).length,
    cantidades: (texto.match(/\b\d+(?:\.\d+)?\s*(?:metros|cúbicos|toneladas|personas|heridos|muertos)\b/gi) || []).length,
    lugares: (texto.match(/\b(?:kilómetro|km|carretera|puente|río|rio|comunidad|barrio|municipio)\b/gi) || []).length,
    nombres_completos: (texto.match(/[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?/g) || []).length,
  };
}

function detectarContextoLocal(texto) {
  const textoLower = texto.toLowerCase();
  const encontrados = LUGARES_NICARAGUA.filter(l => textoLower.includes(l));
  return [...new Set(encontrados)];
}

function calcularDensidadValor(texto, datos) {
  const palabras = contarPalabras(texto);
  if (palabras === 0) return 0;
  const totalDatos = Object.values(datos).reduce((a, b) => a + b, 0);
  return Math.round((totalDatos / palabras) * 1000) / 10;
}

function variacionOraciones(texto) {
  const oraciones = texto.split(/[.!?]+/).map(o => o.trim()).filter(o => o.length > 5);
  if (oraciones.length < 3) return { variacion: 'BAJA', detalle: 'Muy pocas oraciones' };
  const longitudes = oraciones.map(o => o.split(/\s+/).length);
  const promedio = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
  const desviacion = Math.max(...longitudes) - Math.min(...longitudes);
  if (desviacion < 5) return { variacion: 'BAJA', detalle: `Todas ~${Math.round(promedio)} palabras. Patrón de IA.` };
  if (desviacion < 10) return { variacion: 'MEDIA', detalle: `Rango: ${Math.min(...longitudes)}-${Math.max(...longitudes)}.` };
  return { variacion: 'ALTA', detalle: `Rango: ${Math.min(...longitudes)}-${Math.max(...longitudes)}.` };
}

// ═══════════════════════════════════════════════════════════════
// AUDITORÍA INDIVIDUAL
// ═══════════════════════════════════════════════════════════════

function auditarNoticia(texto, titulo = 'Sin título') {
  const palabras = contarPalabras(texto);
  const relleno = detectarRellenoEmocional(texto);
  const transiciones = detectarTransicionesIA(texto);
  const totalTransiciones = transiciones.reduce((a, t) => a + t.cantidad, 0);
  const fuentesGenericas = detectarFuentesGenericas(texto);
  const fuentesAtribuidas = detectarFuentesAtribuidas(texto);
  const citas = detectarCitasTextuales(texto);
  const datos = detectarDatosConcretos(texto);
  const densidad = calcularDensidadValor(texto, datos);
  const varOraciones = variacionOraciones(texto);
  const lugares = detectarContextoLocal(texto);

  let score = 0;
  if (palabras >= 500) score += 20;
  else if (palabras >= 350) score += 10;
  if (!relleno.length) score += 15;
  else if (relleno.length <= 2) score += 5;
  if (totalTransiciones === 0) score += 15;
  else if (totalTransiciones <= 2) score += 5;
  if (fuentesAtribuidas.length >= 2) score += 15;
  else if (fuentesAtribuidas.length === 1) score += 8;
  if (citas.length >= 1) score += 10;
  if (densidad >= 5) score += 15;
  else if (densidad >= 3) score += 8;
  if (varOraciones.variacion === 'ALTA') score += 10;
  else if (varOraciones.variacion === 'MEDIA') score += 5;

  let nivel = '🔴 PELIGRO';
  if (score >= 80) nivel = '🟢 ORO';
  else if (score >= 60) nivel = '🟡 BRONCE';

  return {
    titulo,
    palabras,
    score,
    nivel,
    densidad,
    relleno: relleno.length,
    transiciones_ia: totalTransiciones,
    fuentes_atribuidas: fuentesAtribuidas.length,
    citas: citas.length,
    variacion: varOraciones.variacion,
    contexto_local: lugares.length,
    datos_concretos: datos,
    detalle: {
      relleno,
      transiciones,
      fuentesGenericas,
      fuentesAtribuidas,
      citas,
      lugares
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// EJECUCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🔍 Cargando noticias desde Firebase...');
  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  console.log(`📰 Encontradas ${snapshot.size} noticias\n`);

  const resultados = [];
  let oro = 0, bronce = 0, peligro = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const titulo = data.titulo || 'Sin título';
    const texto = data.contenido || '';
    const res = auditarNoticia(texto, titulo);
    resultados.push({ id: doc.id, ...res });
    if (res.nivel.includes('ORO')) oro++;
    else if (res.nivel.includes('BRONCE')) bronce++;
    else peligro++;
    process.stdout.write(`  ${resultados.length}/${snapshot.size} — ${titulo.slice(0, 50)}\r`);
  }

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('📈 RESUMEN EJECUTIVO');
  console.log('═'.repeat(70));
  console.log(`  🟢 ORO (≥80):      ${oro} noticias`);
  console.log(`  🟡 BRONCE (60-79): ${bronce} noticias`);
  console.log(`  🔴 PELIGRO (<60):  ${peligro} noticias`);
  console.log(`  TOTAL:              ${snapshot.size}`);
  console.log('═'.repeat(70));

  // Top 10 peores
  console.log('\n🔴 TOP 10 NOTICIAS CON MAYOR RIESGO:');
  const peores = [...resultados].sort((a, b) => a.score - b.score).slice(0, 10);
  peores.forEach((n, i) => {
    console.log(`  ${i + 1}. [${n.score}] ${n.titulo.slice(0, 60)}${n.titulo.length > 60 ? '...' : ''}`);
  });

  // Top 10 mejores
  console.log('\n🟢 TOP 10 NOTICIAS MEJOR AUDITADAS:');
  const mejores = [...resultados].sort((a, b) => b.score - a.score).slice(0, 10);
  mejores.forEach((n, i) => {
    console.log(`  ${i + 1}. [${n.score}] ${n.titulo.slice(0, 60)}${n.titulo.length > 60 ? '...' : ''}`);
  });

  // Reporte detallado en archivo
  const reportePath = 'auditoria-completa.json';
  writeFileSync(reportePath, JSON.stringify(resultados, null, 2));
  console.log(`\n💾 Reporte completo guardado en: ${reportePath}`);

  // Reporte CSV
  const csv = [
    'ID,Titulo,Palabras,Score,Nivel,Relleno,Transiciones_IA,Fuentes_Atribuidas,Citas,Densidad,Variacion,Contexto_Local',
    ...resultados.map(r => [
      r.id,
      `"${(r.titulo || '').replace(/"/g, '\"\"')}"`,
      r.palabras,
      r.score,
      r.nivel,
      r.relleno,
      r.transiciones_ia,
      r.fuentes_atribuidas,
      r.citas,
      r.densidad,
      r.variacion,
      r.contexto_local
    ].join(','))
  ].join('\n');
  writeFileSync('auditoria-completa.csv', csv);
  console.log('📊 CSV guardado en: auditoria-completa.csv');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
