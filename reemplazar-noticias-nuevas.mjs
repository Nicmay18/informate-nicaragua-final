#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

function limpiarContenido(texto) {
  // Eliminar transiciones IA
  const transiciones = [
    'asimismo', 'en conclusion', 'en resumen', 'es importante destacar',
    'vale la pena mencionar', 'no hay que olvidar', 'en el contexto de',
    'desde esta perspectiva', 'en ultima instancia', 'a fin de cuentas',
    'en el marco de', 'resulta fundamental', 'resulta evidente',
    'no cabe duda', 'es indiscutible', 'resulta innegable',
    'en definitiva', 'para concluir', 'como se menciono anteriormente',
    'es relevante senalar', 'no se puede ignorar', 'es crucial', 'es vital',
    'por otro lado', 'en ese sentido', 'cabe señalar',
    'las autoridades reiteraron', 'por su parte', 'se mantienen operativos',
    'se espera que', 'continúan las investigaciones'
  ];
  let limpio = texto;
  transiciones.forEach(t => {
    const r = new RegExp(`[,;]?\\s*${t}[,;]?\\s*`, 'gi');
    limpio = limpio.replace(r, ' ');
  });
  // Corregir fechas 2026
  limpio = limpio.replace(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026\b/gi, '$1 de $2 de 2025');
  limpio = limpio.replace(/\b(mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026\b/gi, '$1 de 2025');
  limpio = limpio.replace(/\b2026\b/g, '2025');
  // Eliminar secciones de normativa legal genérica
  limpio = limpio.replace(/<h2>\s*(?:Normativa laboral e institucional|Marco legal|Antecedentes o contexto|Contexto|Marco regulatorio|Indagaciones y normativas del sector)\s*<\/h2>[\s\S]*?(?=<h2>|<p>Pie de Foto|$)/gi, '');
  // Eliminar párrafos con leyes y artículos genéricos
  const parrafos = limpio.match(/<p>(.*?)<\/p>/gi) || [];
  parrafos.forEach(p => {
    const pTexto = p.replace(/<[^>]*>/g, '');
    if (/Ley\s+\d+.*art[ií]culo.*\d+.*establece.*(?:penas|a[nñ]os|prisi[oó]n|sanciones|obligatoriedad)/i.test(pTexto) && pTexto.length > 150) {
      limpio = limpio.replace(p, '');
    }
    if (/Instituto Nicaraguense de Seguridad Social.*pensiones.*invalidez/i.test(pTexto) && pTexto.length > 100) {
      limpio = limpio.replace(p, '');
    }
    if (/Banco Central de Nicaragua.*actividades.*espectaculos.*ingresos.*millones.*dolares/i.test(pTexto) && pTexto.length > 100) {
      limpio = limpio.replace(p, '');
    }
  });
  // Asegurar strongs en nombres propios (solo si no están ya)
  const nombres = limpio.match(/\b([A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+){1,3})\b/g);
  if (nombres) {
    [...new Set(nombres)].forEach(n => {
      if (!limpio.includes(`<strong>${n}</strong>`) && n.length > 10 && !/^(El|La|Los|Las|Un|Este|Del|Al|Con|Por|Para|Sin|Sobre|Entre|Hasta|Desde|Durante|Mediante|Segun|Contra|Hacia|Tras|Excepto|Salvo|Incluso|Ademas|Tambien|Sin embargo|No obstante|Por lo tanto|De hecho|En efecto|Es decir|O sea|Mejor dicho|Hechos principales|Declaraciones de fuentes|Desarrollo|Pie de Foto|Instalaciones|Lineas|Unidades|Polideportivo|Estadio|Carretera|Panamericana)$/i.test(n)) {
        limpio = limpio.replace(new RegExp(`\\b${n.replace(/\s+/g, '\\s+')}\\b(?!</strong>)`, 'g'), `<strong>${n}</strong>`);
      }
    });
  }
  return limpio.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/<p>\s*<\/p>/gi, '').trim();
}

function acortarTitulo(t) {
  if (t.length <= 60) return t;
  const c = t.slice(0, 60).lastIndexOf(' ');
  return t.slice(0, c > 30 ? c : 55).replace(/\.{3,}$/, '');
}

function generarMeta(contenido) {
  const texto = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const oraciones = texto.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
  let meta = oraciones.slice(0, 2).join(' ');
  if (meta.length < 150) meta += ' Noticias Nicaragua.';
  if (meta.length > 170) meta = meta.slice(0, 167) + '...';
  return meta;
}

// ============ NOTICIAS A REEMPLAZAR ============

const NOTICIAS = [
  {
    buscarPor: ['arjona', 'aventura', 'conciertos'],
    titulo: 'De Arjona a Aventura: conciertos anunciados para Nicaragua',
    categoria: 'Espectaculos',
    departamento: 'Managua',
    dateline: 'MANAGUA',
    resumen: 'Las empresas promotoras anunciaron una cartelera de diez conciertos internacionales que se realizarán en Managua entre junio y noviembre.',
    contenido: `<h2>Cartelera de conciertos internacionales</h2>
<p>Las firmas promotoras de espectáculos musicales informaron el establecimiento de una cartelera de diez conciertos internacionales programados para desarrollarse en la ciudad de Managua entre los meses de junio y noviembre, según confirmaron los comunicados institucionales divulgados a los medios de comunicación.</p>
<p>El calendario de presentaciones artísticas incorpora a intérpretes de géneros como la balada romántica, la música regional mexicana, el pop latino, la bachata y el rock en español procedentes de Argentina, Guatemala, México, Colombia, España y los Estados Unidos. Las sedes seleccionadas para albergar las jornadas musicales incluyen las instalaciones del Polideportivo Alexis Argüello y el Estadio Nacional Soberanía.</p>
<h2>Declaraciones de fuentes</h2>
<blockquote><p>"La programación establecida representa uno de los ciclos de espectáculos más esperados por los seguidores de los géneros musicales en el área de Centroamérica", indicó el comunicado de prensa de la empresa organizadora <strong>Live Nicaragua</strong>.</p></blockquote>
<blockquote><p>"Hemos traído esta producción a petición del público que durante años solicitó un tributo de esta magnitud en las plataformas digitales", explicó el vocero de la firma <strong>Ecos Producciones</strong> al detallar el montaje de las actividades musicales programadas para el cierre del año.</p></blockquote>
<h2>Desarrollo</h2>
<p>La agenda de presentaciones arrancó de manera oficial con la función de la baladista argentina <strong>Amanda Miguel</strong> en las estructuras del Polideportivo Alexis Argüello. Las proyecciones de las empresas boleteras indican que el circuito de espectáculos continuará durante el mes de agosto con la presentación del cantautor guatemalteco <strong>Ricardo Arjona</strong>, seguida por la intervención conjunta de los intérpretes de bachata <strong>Romeo Santos</strong> y <strong>Prince Royce</strong> en los terrenos del Estadio Nacional Soberanía.</p>
<p>Las programaciones del segundo semestre del año incorporan además las actuaciones de la cantante colombiana <strong>Greeicy</strong> y de la intérprete española <strong>Natalia Jiménez</strong> en los escenarios techados de la capital. Para el mes de septiembre, los catálogos de las promotoras confirman los conciertos de los artistas mexicanos <strong>Ozuna</strong> y <strong>Gloria Trevi</strong>, quien ejecuta su gira internacional denominada <strong>Mi Soundtrack</strong> en diversos países del continente americano.</p>
<p>El segmento final de la cartelera anual contempla la ejecución del espectáculo <strong>Soda Stereo Ecos</strong>, una producción musical diseñada como homenaje al legado de la agrupación argentina <strong>Soda Stereo</strong> y del músico <strong>Gustavo Cerati</strong>, la cual reúne a 20 músicos en escena apoyados por sistemas de proyección audiovisual. Las agendas integran las presentaciones del cantante <strong>Marco Antonio Solís</strong> y de la agrupación de bachata <strong>Aventura</strong>, cuyos eventos se encuentran en fase de reordenamiento de fechas logísticas por parte de los equipos técnicos.</p>
<p>Los reportes de la Cámara de Empresarios del Entretenimiento señalan que los costos de los pases de ingreso a las distintas localidades de los estadios oscilarán entre los 30 y los 150 dólares básicos. La distribución de los boletos digitales se centralizará por medio de las plataformas de <strong>Ticket Nicaragua</strong> con centros de atención física en las ciudades de Managua, León y Granada.</p>
<p>Pie de Foto: Instalaciones del Polideportivo Alexis Argüello preparadas para un evento de concurrencia masiva, Managua, Nicaragua. Foto: Cortesía.</p>`,
    slug: 'promotoras-anuncian-cartelera-diez-conciertos-internacionales-managua'
  },
  {
    buscarPor: ['electrocucion', 'electrocución', 'accidentes laborales'],
    titulo: 'Aumentan casos de electrocución en accidentes laborales',
    categoria: 'Sucesos',
    departamento: 'Managua y Estelí',
    dateline: 'MANAGUA',
    resumen: 'En los últimos días en distintos puntos de Nicaragua se han registrado varios casos de electrocución en accidentes laborales y domésticos, según reportes preliminares.',
    contenido: `<h2>Hechos principales</h2>
<p>En los últimos días en distintos puntos de Nicaragua se han registrado varios casos de electrocución en accidentes laborales y domésticos, según reportes preliminares sobre los incidentes documentados por los servicios de emergencia y las autoridades de inspección en distintas localidades del país.</p>
<p>Los expedientes técnicos indican que las fatalidades afectaron tanto a obreros en el desempeño de sus funciones de construcción y mantenimiento como a ciudadanos en el interior de sus viviendas particulares. Los reportes señalan que la manipulación de redes energizadas sin el aislamiento adecuado y los desperfectos en los sistemas de distribución interna figuran como los factores principales de estos sucesos.</p>
<h2>Declaraciones de fuentes</h2>
<blockquote><p>"Las sanciones administrativas y económicas aplicables a las empresas que incumplan las normas básicas de prevención pueden alcanzar un techo de hasta 50 salarios mínimos del sector de la construcción", advirtió el director de inspección del <strong>Ministerio del Trabajo</strong>, <strong>Marlon Martínez</strong>.</p></blockquote>
<blockquote><p>"Las cuadrillas técnicas detectaron más de 340 viviendas con redes de distribución interna defectuosas o con deficiencias estructurales graves durante los planes de revisión aleatoria", indicó el reporte de supervisión de la <strong>Empresa Nacional de Transmisión Eléctrica</strong>.</p></blockquote>
<h2>Desarrollo</h2>
<p>Los casos individuales registrados en las terminales asistenciales fijan el deceso del ciudadano <strong>Uriel Antonio Solís</strong>, de 30 años, ocurrido en Managua mientras realizaba el montaje de un sistema de climatización en un laboratorio clínico. El segundo hecho correspondió a <strong>Lester Antonio Reyes Durán</strong>, de 44 años, quien perdió la vida en su hogar al manipular una unidad de lavado con cables expuestos.</p>
<p>La lista de fatalidades en la capital incluye también a <strong>Harrison Francisco Sandoval Larios</strong>, de 36 años, electrocutado debido a un cortocircuito en un tomacorriente en mal estado. Durante las primeras semanas de junio se reportaron las muertes de <strong>Gary Paul Corea Medrano</strong>, de 40 años, tras recibir el impacto de una línea de alta tensión, y de <strong>Sergio Alejandro Bonilla</strong>, de 22 años, en una obra de infraestructura civil.</p>
<p>En el área rural del país, se documentó la muerte del joven <strong>Moisés Salgado</strong>, de 21 años, ocurrida en el departamento de <strong>Estelí</strong>. El ciudadano se encontraba laborando en las fases de edificación de una estructura residencial cuando rozó de forma accidental una línea de distribución secundaria que carecía del revestimiento plástico aislante reglamentario.</p>
<p>Los destacamentos de los <strong>Bomberos Unidos</strong> señalan que las brigadas de emergencia brindaron atención prehospitalaria en 47 llamadas de auxilio por incidentes de este tipo en lo que va del año, requiriendo el traslado a centros asistenciales de 24 pacientes. Los técnicos de primeros auxilios recomiendan interrumpir el fluido eléctrico desde los interruptores principales de la acometida antes de proceder a realizar cualquier maniobra de rescate de un lesionado.</p>
<p>Pie de Foto: Líneas de distribución y transformadores en el tendido eléctrico de una zona urbana, Managua, Nicaragua. Foto: Cortesía.</p>`,
    slug: 'aumentan-casos-electrocucion-accidentes-laborales-domesticos-nicaragua'
  },
  {
    buscarPor: ['jalapa', 'cisterna', 'tipitapa'],
    titulo: 'Bus de Jalapa colisiona con cisterna en Tipitapa',
    categoria: 'Sucesos',
    departamento: 'Tipitapa',
    dateline: 'TIPITAPA',
    resumen: 'Un autobús de la ruta Jalapa-Managua impactó contra la parte trasera de un camión cisterna en el kilómetro 28 de la Carretera Panamericana Norte, provocando múltiples lesionados.',
    contenido: `<h2>Hechos principales</h2>
<p>Una aparatosa colisión vehicular se registró en el kilómetro 28 de la Carretera Panamericana Norte, en las cercanías del empalme de San Benito, jurisdicción del municipio de <strong>Tipitapa</strong>, cuando un autobús de transporte colectivo que cubría la ruta Jalapa-Managua impactó contra la parte posterior de un camión cisterna.</p>
<p>El informe preliminar de las especialidades de emergencia indica que el percance vial habría sido provocado por la falta de distancia de seguridad entre ambos automotores en marcha. A causa del fuerte impacto mecánico, una cantidad aún no precisada de pasajeros resultó con lesiones corporales de diversa consideración, requiriendo auxilio médico inmediato en el punto del siniestro.</p>
<h2>Declaraciones de fuentes</h2>
<blockquote><p>"El conductor de la unidad de transporte público perdió la vida en el lugar de los hechos producto del fuerte impacto estructural", señalaron fuentes locales ligadas a las labores de rescate en la zona de la autopista.</p></blockquote>
<blockquote><p>"Los lesionados fueron estabilizados en el sitio y posteriormente trasladados de urgencia en ambulancias hacia el Hospital Primario Yolanda Mayorga de Tipitapa y otros centros asistenciales para una valoración más especializada", detallaron los reportes de los socorristas que atendieron la emergencia.</p></blockquote>
<h2>Desarrollo</h2>
<p>El despliegue de auxilio médico movilizó a miembros de la <strong>Dirección General de Bomberos Unidos</strong> y paramédicos de la <strong>Cruz Blanca</strong>, quienes brindaron la asistencia primaria a los afectados atrapados entre los asientos del automotor. Entre los pacientes ingresados de urgencia a las unidades de salud se logró identificar a <strong>Katherin Janely Muñoz Muñoz</strong>, atendida por una herida avulsiva en el rostro, y a <strong>Jairon Martín Cuadra Velásquez</strong>, de 53 años, diagnosticado con fractura de tibia y trauma de cadera derecha.</p>
<p>La lista de heridos incluye de igual forma a <strong>Jeiden Israel Estrada Izaguirre</strong>, quien sufrió un trauma cerrado de tórax por desaceleración, y a <strong>Jean Kenneth Estrada Izaguirre</strong>, ingresado con un cuadro diagnóstico de policontusiones generalizadas. Las autoridades sanitarias del hospital municipal informaron que, hasta el momento, no se reportan más decesos hospitalarios vinculados con las secuelas médicas del accidente de tránsito.</p>
<p>A través de las plataformas digitales y redes sociales, usuarios locales difundieron grabaciones previas al siniestro captadas por conductores particulares, en las cuales se observa a la misma unidad de transporte público circular a exceso de velocidad y realizar maniobras temerarias de adelantamiento. Los videos muestran al autobús aventajando en zonas prohibidas de la carretera e invadiendo de forma reiterada el carril contrario sobre la línea continua amarilla, una de las infracciones más peligrosas contempladas en las cartillas de seguridad vial.</p>
<p>El impacto mecánico provocó una interrupción temporal en el tráfico vehicular de la Carretera Panamericana Norte, lo que generó prolongadas retenciones de transporte de carga e interurbano mientras las cuadrillas de auxilio operaban en la vía. Las autoridades de tránsito mantuvieron regulaciones especiales para desviar el flujo de automotores hacia rutas alternas mientras las grúas privadas procedían a la remoción de las carrocerías destruidas.</p>
<p>Los oficiales de la especialidad de <strong>Seguridad de Tránsito de la Policía Nacional</strong> se presentaron en el kilómetro 28 para iniciar los levantamientos de los peritajes correspondientes, dibujar el croquis del accidente y recopilar las declaraciones testimoniales de los testigos presenciales. Las indagaciones de criminalística continúan abiertas con el objetivo de determinar con precisión científica los factores mecánicos u humanos que desencadenaron la colisión en el empalme de San Benito.</p>
<p>Pie de Foto: Unidades de los cuerpos de socorro brindando asistencia médica a los pasajeros en el tramo de la Carretera Panamericana Norte, Tipitapa, Nicaragua. Foto: Cortesía.</p>`,
    slug: 'aparatosa-colision-autobus-camion-cisterna-tipitapa-heridos'
  }
];

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  const todosDocs = [];
  snapshot.forEach(d => todosDocs.push(d));

  for (const noticia of NOTICIAS) {
    // Buscar existente
    const existentes = todosDocs.filter(d => {
      const t = (d.data().titulo || '').toLowerCase();
      return noticia.buscarPor.some(k => t.includes(k.toLowerCase()));
    });

    const contenidoLimpio = limpiarContenido(noticia.contenido);
    const tituloLimpio = acortarTitulo(noticia.titulo);
    const meta = generarMeta(contenidoLimpio);

    const data = {
      titulo: tituloLimpio,
      contenido: contenidoLimpio,
      categoria: noticia.categoria,
      departamento: noticia.departamento,
      dateline: noticia.dateline,
      resumen: meta,
      slug: noticia.slug,
      imagenDestacada: true,
      autor: 'Keyling Elieth Rivera Muñoz',
      fechaActualizacion: FieldValue.serverTimestamp(),
      estado: 'publicado',
    };

    if (existentes.length > 0) {
      const doc = existentes[0];
      await doc.ref.update(data);
      console.log(`✅ REEMPLAZADA: ${tituloLimpio} (ID: ${doc.id})`);
    } else {
      const ref = await db.collection('noticias').add({
        ...data,
        fecha: FieldValue.serverTimestamp(),
      });
      console.log(`✅ NUEVA: ${tituloLimpio} (ID: ${ref.id})`);
    }
  }

  console.log('\n=== LISTO ===');
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
