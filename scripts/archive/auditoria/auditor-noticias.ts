/**
 * Auditor de Noticias - Evalúa las 192 noticias contra estándares AdSense y E-E-A-T
 * Ejecutar: npx ts-node auditor-noticias.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Inicializar Firebase Admin
const serviceAccount = require('./informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json');

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

// ============ CRITERIOS DE AUDITORÍA ============
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

// ============ FUNCIONES DE ANÁLISIS ============
function contarPalabras(texto: string): number {
  const palabras = texto.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g);
  return palabras ? palabras.length : 0;
}

function detectarRellenoEmocional(texto: string) {
  const encontrados: string[] = [];
  const textoLower = texto.toLowerCase();
  for (const frase of RELLENO_EMOCIONAL) {
    if (textoLower.includes(frase)) encontrados.push(frase);
  }
  return encontrados;
}

function detectarTransicionesIA(texto: string): number {
  const textoLower = texto.toLowerCase();
  let count = 0;
  for (const transicion of TRANSICIONES_IA) {
    count += (textoLower.split(transicion).length - 1);
  }
  return count;
}

function detectarFuentesGenericas(texto: string): number {
  const textoLower = texto.toLowerCase();
  let count = 0;
  for (const fuente of FUENTES_GENERICAS) {
    if (textoLower.includes(fuente)) count++;
  }
  return count;
}

function detectarFuentesAtribuidas(texto: string): string[] {
  const patrones = [
    /[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?,\s*(?:vocero|director|jefe|sargento|comisionado|coordinador|testigo|vecino)/gi,
    /(?:afirmó|indicó|declaró|señaló|dijo)\s+[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+/gi,
    /(?:según|de acuerdo con)\s+(?:la|el)\s+(?:Policía Nacional|Cuerpo de Bomberos|MINSA|INETER|Alcaldía|Fuerza Naval|Ejército)/gi,
  ];
  const encontrados: string[] = [];
  for (const patron of patrones) {
    const matches = texto.match(patron);
    if (matches) encontrados.push(...matches.slice(0, 3));
  }
  return [...new Set(encontrados)];
}

function detectarCitasTextuales(texto: string): number {
  const citas = texto.match(/"[^"]{10,200}"/g);
  return citas ? citas.length : 0;
}

function detectarDatosConcretos(texto: string): string[] {
  const datos: string[] = [];
  // Edad
  const edades = texto.match(/\b\d{1,3}\s*(?:años?|años\s+de\s+edad)\b/gi);
  if (edades) datos.push(...edades);
  // Horas
  const horas = texto.match(/\b(?:0?[1-9]|1[0-2]):[0-5][0-9]\s*(?:am|pm|AM|PM|hrs?|horas?)\b/g);
  if (horas) datos.push(...horas);
  // Fechas específicas
  const fechas = texto.match(/\b(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo|ayer|hoy)\s*,?\s*\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi);
  if (fechas) datos.push(...fechas);
  // Kilómetros/lugares
  const kms = texto.match(/\b\d+\s*(?:km|kilómetros?|metros?|m\b|cuadras?|avenida|calle)\b/gi);
  if (kms) datos.push(...kms.slice(0, 3));
  return [...new Set(datos)];
}

function detectarContextoLocal(texto: string): number {
  const textoLower = texto.toLowerCase();
  let count = 0;
  for (const lugar of LUGARES_NICARAGUA) {
    if (textoLower.includes(lugar)) count++;
  }
  return Math.min(count, 5);
}

function variacionOraciones(texto: string): { variacion: 'ALTA' | 'MEDIA' | 'BAJA'; detalle: string } {
  const oraciones = texto.split(/[.!?]+/).filter(o => o.trim().length > 10);
  if (oraciones.length < 3) return { variacion: 'BAJA', detalle: 'Muy pocas oraciones' };
  const longitudes = oraciones.map(o => o.split(/\s+/).length);
  const desviacion = Math.max(...longitudes) - Math.min(...longitudes);
  if (desviacion < 5) return { variacion: 'BAJA', detalle: `Patrón IA: oraciones ~${Math.round(longitudes.reduce((a,b)=>a+b,0)/longitudes.length)} palabras` };
  if (desviacion < 10) return { variacion: 'MEDIA', detalle: `Variación moderada` };
  return { variacion: 'ALTA', detalle: `Excelente variación` };
}

function auditarNoticia(noticia: any) {
  const texto = noticia.contenido || '';
  const titulo = noticia.titulo || 'Sin título';
  const palabras = contarPalabras(texto);
  const relleno = detectarRellenoEmocional(texto);
  const transiciones = detectarTransicionesIA(texto);
  const fuentesGenericas = detectarFuentesGenericas(texto);
  const fuentesAtribuidas = detectarFuentesAtribuidas(texto);
  const citas = detectarCitasTextuales(texto);
  const datos = detectarDatosConcretos(texto);
  const varOraciones = variacionOraciones(texto);
  const contextoLocal = detectarContextoLocal(texto);

  // Scoring
  let score = 0;
  if (palabras >= 500) score += 20;
  else if (palabras >= 350) score += 10;
  else if (palabras >= 300) score += 5;
  
  if (relleno.length === 0) score += 15;
  else if (relleno.length <= 2) score += 5;
  
  if (transiciones === 0) score += 15;
  else if (transiciones <= 2) score += 5;
  
  if (fuentesAtribuidas.length >= 2) score += 15;
  else if (fuentesAtribuidas.length === 1) score += 8;
  
  if (citas >= 1) score += 10;
  if (datos.length >= 3) score += 15;
  else if (datos.length >= 1) score += 8;
  
  if (varOraciones.variacion === 'ALTA') score += 10;
  else if (varOraciones.variacion === 'MEDIA') score += 5;
  
  if (contextoLocal >= 2) score += 5;

  // Nivel
  let nivel: 'ORO' | 'BRONCE' | 'PELIGRO';
  if (score >= 80) nivel = 'ORO';
  else if (score >= 60) nivel = 'BRONCE';
  else nivel = 'PELIGRO';

  return {
    id: noticia.id,
    slug: noticia.slug || 'sin-slug',
    titulo: titulo.slice(0, 80),
    palabras,
    score,
    nivel,
    relleno: relleno.length,
    transiciones,
    fuentesAtribuidas: fuentesAtribuidas.length,
    citas,
    datos: datos.length,
    variacion: varOraciones.variacion,
    contextoLocal,
    detalleRelleno: relleno.slice(0, 3),
    tieneImagen: !!noticia.imagen,
    fecha: noticia.fecha?.toDate?.() || noticia.fecha,
    categoria: noticia.categoria
  };
}

// ============ EJECUCIÓN PRINCIPAL ============
async function main() {
  console.log('🔍 Iniciando auditoría de noticias...\n');
  
  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  const noticias = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log(`📰 Total de noticias encontradas: ${noticias.length}\n`);
  
  const resultados = noticias.map(auditarNoticia);
  
  // Estadísticas
  const oro = resultados.filter(r => r.nivel === 'ORO');
  const bronce = resultados.filter(r => r.nivel === 'BRONCE');
  const peligro = resultados.filter(r => r.nivel === 'PELIGRO');
  
  console.log('📊 RESUMEN DE CALIDAD\n' + '='.repeat(50));
  console.log(`🟢 ORO (80+ puntos):     ${oro.length} noticias (${Math.round(oro.length/noticias.length*100)}%)`);
  console.log(`🟡 BRONCE (60-79):       ${bronce.length} noticias (${Math.round(bronce.length/noticias.length*100)}%)`);
  console.log(`🔴 PELIGRO (<60):        ${peligro.length} noticias (${Math.round(peligro.length/noticias.length*100)}%)`);
  console.log('='.repeat(50));
  
  console.log('\n🟢 NOTICIAS ORO (Listas para AdSense):');
  oro.slice(0, 10).forEach(n => console.log(`   ✓ ${n.titulo} (${n.palabras} palabras, ${n.score} pts)`));
  
  if (oro.length > 10) console.log(`   ... y ${oro.length - 10} más`);
  
  console.log('\n🔴 NOTICIAS EN PELIGRO (Requieren revisión):');
  peligro.slice(0, 15).forEach(n => {
    const problemas = [];
    if (n.palabras < 350) problemas.push(`pocas palabras (${n.palabras})`);
    if (n.relleno > 0) problemas.push(`relleno emocional (${n.relleno})`);
    if (n.transiciones > 3) problemas.push(`transiciones IA (${n.transiciones})`);
    if (n.fuentesAtribuidas === 0) problemas.push('sin fuentes');
    console.log(`   ✗ ${n.titulo}`);
    console.log(`     └─ ${problemas.join(', ')}`);
  });
  
  if (peligro.length > 15) console.log(`   ... y ${peligro.length - 15} más en peligro`);
  
  // Guardar JSON detallado
  fs.writeFileSync('auditoria-resultado.json', JSON.stringify(resultados, null, 2));
  console.log('\n💾 Resultado completo guardado en: auditoria-resultado.json');
  
  // Análisis por categoría
  const porCategoria: Record<string, { total: number; oro: number; peligro: number }> = {};
  resultados.forEach(r => {
    const cat = r.categoria || 'Sin categoría';
    if (!porCategoria[cat]) porCategoria[cat] = { total: 0, oro: 0, peligro: 0 };
    porCategoria[cat].total++;
    if (r.nivel === 'ORO') porCategoria[cat].oro++;
    if (r.nivel === 'PELIGRO') porCategoria[cat].peligro++;
  });
  
  console.log('\n📈 CALIDAD POR CATEGORÍA:');
  Object.entries(porCategoria)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, stats]) => {
      const oroPct = Math.round(stats.oro / stats.total * 100);
      const peligroPct = Math.round(stats.peligro / stats.total * 100);
      console.log(`   ${cat.padEnd(15)}: ${stats.total.toString().padStart(3)} noticias | 🟢 ${oroPct}% | 🔴 ${peligroPct}%`);
    });
  
  // Recomendaciones
  console.log('\n🎯 RECOMENDACIONES PARA ADSENSE:');
  if (peligro.length > 50) {
    console.log('   ⚠️  Más del 25% de noticias están en PELIGRO. Prioriza:');
    console.log('      1. Ampliar noticias <350 palabras a 500+');
    console.log('      2. Eliminar relleno emocional ("tragedia", "consternación")');
    console.log('      3. Agregar fuentes atribuidas ("afirmó el Sargento García")');
  } else if (oro.length > 100) {
    console.log('   ✅ Excelente base. Más del 50% son ORO.');
    console.log('   📌 Acción: Mejora las BRONCE a ORO para maximizar ingresos.');
  }
  
  console.log('\n✅ Auditoría completada');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
