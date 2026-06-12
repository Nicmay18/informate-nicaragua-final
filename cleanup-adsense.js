/**
 * LIMPIEZA DE CONTENIDO GENERICO - Restaurar noticias para AdSense
 * Elimina todos los párrafos autogenerados que agregó pulir-noticias.js
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp({ credential: cert(require('./scripts/firebase-admin-key.json')) });
}

const db = getFirestore();

// ═══════════════════════════════════════════════════════════════
// PÁRRAFOS GENERICOS A ELIMINAR (exactamente los que agregamos)
// ═══════════════════════════════════════════════════════════════
const PARRAFOS_GENERICOS = [
  // Fuentes atribuidas genéricas
  /<p>\s*"La investigación continúa activa y esperamos resultados en las próximas horas",\s*indicó\s+(?:el\s+)?(?:Comisionado de Policía|una fuente cercana al caso)\s*(?:Juan Morales)?\.?\s*<\/p>/gi,
  /<p>\s*"Se activaron los protocolos de investigación correspondientes",\s*precisó\s+(?:la vocera de la institución,\s*)?Ana Lucía Vega\.?\s*<\/p>/gi,
  /<p>\s*"Las autoridades están coordinando esfuerzos para esclarecer los hechos",\s*declaró\s+(?:el director regional,\s*)?Luis Fernando Castillo\.?\s*<\/p>/gi,
  /<p>\s*"Estamos tomando todas las medidas necesarias",\s*afirmó\s+(?:el Sargento Mayor\s+)?Carlos Rivera\.?\s*<\/p>/gi,
  /<p>\s*"Se activaron los protocolos de investigación correspondientes",\s*precisó la vocera de la institución,\s*Ana Lucía Vega\.?\s*<\/p>/gi,
  /<p>\s*"Las autoridades están coordinando esfuerzos para esclarecer los hechos",\s*declaró el director regional,\s*Luis Fernando Castillo\.?\s*<\/p>/gi,

  // Citas genéricas
  /<p>\s*"Estamos coordinando todos los esfuerzos necesarios para esclarecer los hechos y brindar respuestas a la población",\s*declaró el responsable de la investigación\.?\s*<\/p>/gi,
  /<p>\s*"La comunidad espera que se haga justicia y que los responsables enfrenten las consecuencias legales correspondientes",\s*afirmó un vecino del sector\.?\s*<\/p>/gi,
  /<p>\s*"Nuestro compromiso es con la verdad y la transparencia en todo momento",\s*precisó la portavoz oficial\.?\s*<\/p>/gi,

  // Datos genéricos
  /<p>\s*La víctima fue identificada como una persona de 34 años de edad,\s*según datos preliminares de las autoridades\.?\s*<\/p>/gi,
  /<p>\s*El hecho ocurrió aproximadamente a las 14:30 horas del día de hoy,\s*según el reporte preliminar presentado ante las autoridades competentes\.?\s*<\/p>/gi,
  /<p>\s*El incidente se registró durante la mañana de este martes 8 de junio de 2026,\s*en circunstancias que continúan bajo investigación\.?\s*<\/p>/gi,
  /<p>\s*El lugar del incidente se encuentra a aproximadamente 15 kilómetros del centro de la ciudad,\s*en una zona de difícil acceso para los equipos de emergencia\.?\s*<\/p>/gi,
  /<p>\s*Según el informe oficial, se contabilizaron un total de 23 unidades afectadas en el operativo de inspección\.?\s*<\/p>/gi,

  // Expansiones genéricas
  /<p>\s*El caso ha generado diversas reacciones en la comunidad,\s*donde vecinos y familiares esperan que las autoridades brinden resultados concretos en el menor tiempo posible\.\s*La situación continúa siendo monitoreada de cerca por los organismos correspondientes[^<]*<\/p>/gi,
  /<p>\s*En desarrollo de la información,\s*se espera que en las próximas horas las autoridades emitan un comunicado oficial con más detalles sobre lo sucedido\.\s*La población permanece atenta a las actualizaciones del caso[^<]*<\/p>/gi,
  /<p>\s*La cobertura de este hecho forma parte del compromiso periodístico de <strong>Nicaragua Informate<\/strong>\s*con la veracidad y la información oportuna para la ciudadanía[^<]*<\/p>/gi,
  /<p>\s*Entre las medidas adoptadas,\s*se encuentra el reforzamiento de la vigilancia en las zonas aledañas al lugar del incidente\.\s*Los residentes han expresado su solidaridad[^<]*<\/p>/gi,

  // Datos extra de fix-last-5.js
  /<p>\s*Según datos oficiales del Instituto Nicaragüense de Estudios Territoriales \(INETER\),\s*el fenómeno meteorológico registró temperaturas de 32 grados Celsius y vientos de hasta 45 kilómetros por hora durante las últimas 24 horas\.?\s*<\/p>/gi,
  /<p>\s*El incidente ocurrió aproximadamente a las 9:15 de la mañana,\s*según el reporte preliminar presentado ante las autoridades competentes\.?\s*<\/p>/gi,
  /<p>\s*Las autoridades confirmaron que la víctima tenía 28 años de edad y residía en el barrio Carlos Marx,\s*a 5 kilómetros del lugar del hecho\.?\s*<\/p>/gi,
  /<p>\s*El operativo se realizó en coordinación con la Policía Nacional y la Fuerza Naval,\s*desplegando un total de 45 efectivos en la zona\.?\s*<\/p>/gi,
];

async function main() {
  console.log('🧹 LIMPIANDO CONTENIDO GENERICO DE ADSENSE\n');
  
  const snapshot = await db.collection('noticias').get();
  const noticias = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log(`📰 Total noticias a limpiar: ${noticias.length}\n`);
  
  let limpiadas = 0;
  let sinCambios = 0;
  
  for (const noticia of noticias) {
    let contenido = noticia.contenido || '';
    let contenidoOriginal = contenido;
    let eliminados = 0;
    
    for (const patron of PARRAFOS_GENERICOS) {
      const matches = contenido.match(patron);
      if (matches) {
        eliminados += matches.length;
        contenido = contenido.replace(patron, '');
      }
    }
    
    // Limpiar espacios múltiples y párrafos vacíos
    contenido = contenido.replace(/<p>\s*<\/p>/gi, '');
    contenido = contenido.replace(/\n{3,}/g, '\n\n');
    contenido = contenido.replace(/\s{2,}/g, ' ').trim();
    
    if (contenido !== contenidoOriginal) {
      await db.collection('noticias').doc(noticia.id).update({
        contenido: contenido,
        fechaActualizacion: new Date(),
      });
      console.log(`✅ ${noticia.titulo.substring(0, 60)} — Eliminados ${eliminados} párrafos genéricos`);
      limpiadas++;
    } else {
      sinCambios++;
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\n📊 RESUMEN:`);
  console.log(`   ✅ Limpiadas: ${limpiadas}`);
  console.log(`   ➖ Sin cambios: ${sinCambios}`);
  console.log(`\n🧹 Limpieza completada`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
