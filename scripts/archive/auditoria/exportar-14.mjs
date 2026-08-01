/**
 * Exporta las 14 noticias en peligro para corrección
 * Ejecutar: node exportar-14.mjs > noticias-a-corregir.json
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getCachedNoticias } from '../../../lib/db/cached-firestore.mjs';
import { readFileSync } from 'fs';

function getAdminApp() {
  if (getApps().length > 0) return getApp();
  const sa = JSON.parse(readFileSync('G:/RESPALDO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json', 'utf8'));
  return initializeApp({ credential: cert(sa) });
}

const db = getFirestore(getAdminApp());

// Listas de detección
const RELLENO_EMOCIONAL = ["consternada","consternado","conmoción","conmocionó","dolor","tragedia","trágico","tragico","último adiós","ultimo adios","perdió la batalla","perdio la batalla","fatal desenlace","cristiana sepultura","honras fúnebres","honras funebres","enlutó","enluta","consternación","consternacion","ambiente de dolor","salir del asombro","asombro","familiares lamentan","lamentan la pérdida","lamentan la perdida","comunidad consternada","hecho conmocionó","conmocionó a","profundo dolor","profunda tristeza","vida truncada","jóven promesa","joven promesa","amado","querido","incomprensible","indignante","irresponsable","criminal","brindan apoyo","organizaciones brindan","darán el último","recibirá cristiana","perdió la vida"];

const TRANSICIONES_IA = ["además","por otro lado","en cuanto a","en relación a","por su parte","asimismo","del mismo modo","en consecuencia","en conclusión","finalmente","para finalizar","es importante destacar","cabe señalar","cabe senalar","en este sentido","al respecto","por lo tanto","de igual manera","de la misma forma","en tanto que","no obstante","sin embargo","por el contrario","en primer lugar","en segundo lugar","en tercer lugar"];

function contarPalabras(texto) {
  const palabras = texto.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g);
  return palabras ? palabras.length : 0;
}

function detectarRelleno(texto) {
  const encontrados = [];
  const textoLower = texto.toLowerCase();
  RELLENO_EMOCIONAL.forEach(frase => { if (textoLower.includes(frase)) encontrados.push(frase); });
  return [...new Set(encontrados)];
}

function detectarTransiciones(texto) {
  const encontrados = [];
  const textoLower = texto.toLowerCase();
  TRANSICIONES_IA.forEach(t => { if (textoLower.includes(t)) encontrados.push(t); });
  return [...new Set(encontrados)];
}

function detectarFuentesAtribuidas(texto) {
  const patrones = [/[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?,\s*(?:vocero|director|jefe|sargento|comisionado|coordinador|testigo|vecino)/gi, /(?:afirmó|indicó|declaró|señaló|dijo)\s+[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+/gi, /(?:según|de acuerdo con)\s+(?:la|el)\s+(?:Policía Nacional|Cuerpo de Bomberos|MINSA|INETER|Alcaldía|Fuerza Naval|Ejército)/gi];
  let count = 0;
  patrones.forEach(patron => { const matches = texto.match(patron); if (matches) count += matches.length; });
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

  return { score, palabras, relleno, transiciones, fuentes, citas, datos, nivel: score >= 80 ? 'ORO' : score >= 60 ? 'BRONCE' : 'PELIGRO' };
}

async function main() {
  console.log('🔍 Buscando noticias en peligro...\n');
  
  const snapshot = await getCachedNoticias(db);
  const noticias = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const analizadas = noticias.map(n => {
    const metricas = calcularScore(n);
    return { id: n.id, slug: n.slug, titulo: n.titulo, categoria: n.categoria, resumen: n.resumen || '', contenido: n.contenido || '', imagen: n.imagen || '', fecha: n.fecha?.toDate?.() || n.fecha, ...metricas };
  });
  
  const peligrosas = analizadas.filter(n => n.nivel === 'PELIGRO').sort((a, b) => a.score - b.score);
  
  // Exportar para corrección
  const exportacion = peligrosas.map(n => ({
    id: n.id,
    slug: n.slug,
    titulo: n.titulo,
    categoria: n.categoria,
    resumen: n.resumen,
    contenido_original: n.contenido,
    imagen: n.imagen,
    score_actual: n.score,
    problemas: {
      palabras: n.palabras,
      relleno: n.relleno,
      transiciones: n.transiciones,
      fuentes: n.fuentes,
      citas: n.citas,
      datos: n.datos
    }
  }));
  
  console.log(JSON.stringify(exportacion, null, 2));
  console.error(`\n✅ Exportadas ${peligrosas.length} noticias para corrección`);
  console.error('Copia el JSON de arriba y envíamelo para corregir las noticias.');
  
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
