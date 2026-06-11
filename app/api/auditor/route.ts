import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

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

function contarPalabras(texto: string) {
  const palabras = texto.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g);
  return palabras ? palabras.length : 0;
}

function detectarRellenoEmocional(texto: string) {
  const encontrados: { frase: string; contexto: string }[] = [];
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

function detectarTransicionesIA(texto: string) {
  const encontrados: { transicion: string; cantidad: number }[] = [];
  const textoLower = texto.toLowerCase();
  for (const transicion of TRANSICIONES_IA) {
    const count = textoLower.split(transicion).length - 1;
    if (count > 0) encontrados.push({ transicion, cantidad: count });
  }
  return encontrados;
}

function detectarFuentesGenericas(texto: string) {
  const encontrados: string[] = [];
  const textoLower = texto.toLowerCase();
  for (const fuente of FUENTES_GENERICAS) {
    if (textoLower.includes(fuente)) encontrados.push(fuente);
  }
  return encontrados;
}

function detectarFuentesAtribuidas(texto: string) {
  const patrones = [
    // Nombre + cargo (estricto)
    /[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?,\s*(?:vocero|director|jefe|sargento|comisionado|coordinador|testigo|vecino|residente)/gi,
    // Verbo de atribución + nombre (más flexible)
    /(?:afirmó|indicó|declaró|señaló|dijo|relató|manifestó|comentó)\s+[A-Z][a-záéíóúñ]+/gi,
    // Fuentes institucionales genéricas (como TN8 usa)
    /(?:según|de acuerdo con|informaron|reportaron|indicaron)\s+(?:las|los)?\s*(?:autoridades|cuerpo de bomberos|bomberos|policía|testigos|vecinos|fuentes)/gi,
    // Referencias a testigos/vecinos sin nombre específico (aceptable para medios pequeños)
    /(?:testigos|vecinos|residentes|personas)\s+(?:que\s+presenciaron|en\s+la\s+zona|del\s+lugar)/gi,
    // Estaciones/instituciones específicas
    /(?:ambulancia|estación)\s+(?:de\s+)?(?:bomberos|policía)/gi
  ];
  const encontrados: string[] = [];
  for (const patron of patrones) {
    const matches = texto.match(patron);
    if (matches) encontrados.push(...matches);
  }
  return [...new Set(encontrados)];
}

function detectarCitasTextuales(texto: string) {
  const citas = texto.match(/[\"\'\u201c\u201d]([^\"\'\u201c\u201d]{10,})[\"\'\u201c\u201d]/g);
  return citas ? citas.map(c => c.slice(1, -1).trim()).filter(c => c.length > 10) : [];
}

function detectarDatosConcretos(texto: string) {
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

function detectarContextoLocal(texto: string) {
  const textoLower = texto.toLowerCase();
  const encontrados = LUGARES_NICARAGUA.filter(l => textoLower.includes(l));
  return [...new Set(encontrados)];
}

function calcularDensidadValor(texto: string, datos: Record<string, number>) {
  const palabras = contarPalabras(texto);
  if (palabras === 0) return 0;
  const totalDatos = Object.values(datos).reduce((a, b) => a + b, 0);
  return Math.round((totalDatos / palabras) * 1000) / 10;
}

function variacionOraciones(texto: string) {
  const oraciones = texto.split(/[.!?]+/).map(o => o.trim()).filter(o => o.length > 5);
  if (oraciones.length < 3) return { variacion: 'BAJA' as const, detalle: 'Muy pocas oraciones' };
  const longitudes = oraciones.map(o => o.split(/\s+/).length);
  const promedio = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
  const desviacion = Math.max(...longitudes) - Math.min(...longitudes);
  if (desviacion < 5) return { variacion: 'BAJA' as const, detalle: `Todas ~${Math.round(promedio)} palabras. Patrón de IA.` };
  if (desviacion < 10) return { variacion: 'MEDIA' as const, detalle: `Rango: ${Math.min(...longitudes)}-${Math.max(...longitudes)}.` };
  return { variacion: 'ALTA' as const, detalle: `Rango: ${Math.min(...longitudes)}-${Math.max(...longitudes)}.` };
}

function auditarNoticia(texto: string, titulo = 'Sin título') {
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
  // Fuentes atribuidas (más flexibles ahora - incluye testigos/genéricos como TN8)
  if (fuentesAtribuidas.length >= 2) score += 20;
  else if (fuentesAtribuidas.length === 1) score += 12;
  // Citas textuales (opcional pero valioso)
  if (citas.length >= 1) score += 8;
  if (densidad >= 5) score += 15;
  else if (densidad >= 3) score += 8;
  if (varOraciones.variacion === 'ALTA') score += 10;
  else if (varOraciones.variacion === 'MEDIA') score += 5;

  let nivel = '🔴 PELIGRO';
  if (score >= 90) nivel = '🟢 ORO';
  else if (score >= 80) nivel = '🟡 BRONCE';

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

export async function GET() {
  const db = getAdminDb();
  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();

  const resultados = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const res = auditarNoticia(data.contenido || '', data.titulo || 'Sin título');
    resultados.push({ id: doc.id, slug: data.slug || '', ...res });
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Content-Disposition', 'attachment; filename="auditoria-noticias.json"');

  return new NextResponse(JSON.stringify(resultados, null, 2), { headers });
}
