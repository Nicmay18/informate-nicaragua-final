/**
 * Analizador de las 14 noticias en peligro
 * Ejecutar: node analizar-14-noticias.mjs
 * 
 * Este script lee las 14 noticias con score <60 de Firestore
 * y genera un reporte detallado con las correcciones específicas necesarias.
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';

// Firebase init
function getAdminApp() {
  if (getApps().length > 0) return getApp();
  const sa = JSON.parse(readFileSync('G:/RESPALDO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json', 'utf8'));
  return initializeApp({ credential: cert(sa) });
}

import { readFileSync } from 'fs';
const db = getFirestore(getAdminApp());

// Listas de detección
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

function contarPalabras(texto) {
  const palabras = texto.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g);
  return palabras ? palabras.length : 0;
}

function detectarRelleno(texto) {
  const encontrados = [];
  const textoLower = texto.toLowerCase();
  RELLENO_EMOCIONAL.forEach(frase => {
    if (textoLower.includes(frase)) encontrados.push(frase);
  });
  return [...new Set(encontrados)];
}

function detectarTransiciones(texto) {
  const encontrados = [];
  const textoLower = texto.toLowerCase();
  TRANSICIONES_IA.forEach(t => {
    if (textoLower.includes(t)) encontrados.push(t);
  });
  return [...new Set(encontrados)];
}

function detectarFuentesAtribuidas(texto) {
  const patrones = [
    /[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?,\s*(?:vocero|director|jefe|sargento|comisionado|coordinador|testigo|vecino)/gi,
    /(?:afirmó|indicó|declaró|señaló|dijo)\s+[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+/gi,
    /(?:según|de acuerdo con)\s+(?:la|el)\s+(?:Policía Nacional|Cuerpo de Bomberos|MINSA|INETER|Alcaldía|Fuerza Naval|Ejército)/gi,
  ];
  let count = 0;
  patrones.forEach(patron => {
    const matches = texto.match(patron);
    if (matches) count += matches.length;
  });
  return count;
}

function detectarCitas(texto) {
  const citas = texto.match(/"[^"]{10,200}"/g);
  return citas ? citas.length : 0;
}

function detectarDatosConcretos(texto) {
  let count = 0;
  const edades = texto.match(/\b\d{1,3}\s*(?:años?|años\s+de\s+edad)\b/gi);
  const horas = texto.match(/\b(?:0?[1-9]|1[0-2]):[0-5][0-9]\s*(?:am|pm|hrs?|horas?)\b/gi);
  const kms = texto.match(/\b\d+\s*(?:km|kilómetros?|metros?|cuadras?)\b/gi);
  const fechas = texto.match(/\b(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo|ayer|hoy)\s*,?\s*\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi);
  
  count += (edades ? edades.length : 0);
  count += (horas ? horas.length : 0);
  count += (kms ? Math.min(kms.length, 3) : 0);
  count += (fechas ? fechas.length : 0);
  return count;
}

function calcularScore(noticia) {
  const texto = noticia.contenido || '';
  const palabras = contarPalabras(texto);
  const relleno = detectarRelleno(texto);
  const transiciones = detectarTransiciones(texto);
  const fuentes = detectarFuentesAtribuidas(texto);
  const citas = detectarCitas(texto);
  const datos = detectarDatosConcretos(texto);

  let score = 0;
  if (palabras >= 500) score += 20;
  else if (palabras >= 350) score += 10;
  else if (palabras >= 300) score += 5;
  
  if (relleno.length === 0) score += 15;
  else if (relleno.length <= 2) score += 5;
  
  if (transiciones.length === 0) score += 15;
  else if (transiciones.length <= 2) score += 5;
  
  if (fuentes >= 2) score += 15;
  else if (fuentes === 1) score += 8;
  
  if (citas >= 1) score += 10;
  
  if (datos >= 3) score += 15;
  else if (datos >= 1) score += 8;
  else score += 2;

  return { score, palabras, relleno, transiciones, fuentes, citas, datos };
}

function generarRecomendaciones(n) {
  const recs = [];
  
  if (n.palabras < 350) {
    recs.push(`➕ Ampliar ${n.palabras} → 350+ palabras (necesitas ${350 - n.palabras} más)`);
  }
  
  if (n.relleno.length > 0) {
    recs.push(`❌ Eliminar relleno emocional: ${n.relleno.slice(0, 3).join(', ')}`);
  }
  
  if (n.transiciones.length > 2) {
    recs.push(`🤖 Reducir transiciones IA (tiene ${n.transiciones.length}, máx 2)`);
  }
  
  if (n.fuentes === 0) {
    recs.push(`👤 Agregar 2 fuentes atribuidas con nombre y cargo`);
  } else if (n.fuentes === 1) {
    recs.push(`👤 Agregar 1 fuente más (tiene 1, necesita 2)`);
  }
  
  if (n.citas === 0) {
    recs.push(`💬 Agregar 1 cita textual entre comillas (15-20 palabras)`);
  }
  
  if (n.datos < 3) {
    recs.push(`📊 Agregar ${3 - n.datos} datos concretos más (edades, horas, direcciones exactas)`);
  }
  
  return recs;
}

async function main() {
  console.log('🔍 Analizando noticias desde Firestore...\n');
  
  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  const noticias = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Analizar todas
  const analizadas = noticias.map(n => {
    const metricas = calcularScore(n);
    return {
      id: n.id,
      slug: n.slug,
      titulo: n.titulo,
      fecha: n.fecha?.toDate?.() || n.fecha,
      ...metricas,
      nivel: metricas.score >= 80 ? 'ORO' : metricas.score >= 60 ? 'BRONCE' : 'PELIGRO'
    };
  });
  
  // Filtrar solo las 14 en peligro
  const peligrosas = analizadas
    .filter(n => n.nivel === 'PELIGRO')
    .sort((a, b) => a.score - b.score);
  
  console.log(`📰 Total noticias: ${noticias.length}`);
  console.log(`🔴 En peligro: ${peligrosas.length}\n`);
  console.log('='.repeat(80));
  
  // Reporte detallado
  const reporte = peligrosas.map((n, i) => {
    const recs = generarRecomendaciones(n);
    
    console.log(`\n${i + 1}. 🔴 ${n.titulo}`);
    console.log(`   ID: ${n.id}`);
    console.log(`   Score: ${n.score}/100 | Palabras: ${n.palabras} | Nivel: ${n.nivel}`);
    console.log(`   Fuentes: ${n.fuentes} | Citas: ${n.citas} | Datos: ${n.datos}`);
    console.log(`   Relleno: ${n.relleno.length > 0 ? n.relleno.slice(0, 5).join(', ') : 'Ninguno'}`);
    console.log(`   Transiciones IA: ${n.transiciones.length > 0 ? n.transiciones.slice(0, 5).join(', ') : 'Ninguna'}`);
    console.log(`\n   🎯 CORRECCIONES:`);
    recs.forEach(r => console.log(`      ${r}`));
    console.log(`\n   🔗 Editar: https://nicaraguainformate.com/admin/nueva?edit=${n.id}`);
    console.log('-'.repeat(80));
    
    return { ...n, recomendaciones: recs };
  });
  
  // Guardar JSON
  writeFileSync('reporte-14-noticias.json', JSON.stringify(reporte, null, 2));
  console.log('\n💾 Reporte guardado en: reporte-14-noticias.json');
  
  // Resumen ejecutivo
  console.log('\n📊 RESUMEN EJECUTIVO');
  console.log('='.repeat(80));
  const porScore = {
    bajo: peligrosas.filter(n => n.score < 50).length,
    medio: peligrosas.filter(n => n.score >= 50 && n.score < 55).length,
    alto: peligrosas.filter(n => n.score >= 55 && n.score < 60).length
  };
  console.log(`Score 40-49 (muy bajo): ${porScore.bajo} noticias — Requieren expansión mayor`);
  console.log(`Score 50-54 (bajo): ${porScore.medio} noticias — Requieren fuentes + datos`);
  console.log(`Score 55-59 (casi BRONCE): ${porScore.alto} noticias — Requieren ajustes menores`);
  
  const tiempoEstimado = (porScore.bajo * 45) + (porScore.medio * 30) + (porScore.alto * 20);
  console.log(`\n⏱️  Tiempo estimado de corrección: ${Math.round(tiempoEstimado / 60 * 10) / 10} horas`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
