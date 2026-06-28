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

function processText(text) {
  let t = text;
  // Fix dates 2026
  t = t.replace(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026\b/gi, '$1 de $2 de 2025');
  t = t.replace(/\b(mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026\b/gi, '$1 de 2025');
  t = t.replace(/\b2026\b/g, '2025');
  // Remove legal/stat filler sections
  const secciones = [
    'Prevención y normativas de seguridad civil',
    'Normativa laboral y prevención de riesgos',
    'Indicadores de turismo y seguridad marítima',
    'Normativa e indicadores de seguridad ocupacional',
    'Normativa de transporte acuático y estadísticas'
  ];
  secciones.forEach(s => { const r = new RegExp(`<h2>\\s*${s}\\s*</h2>[\\s\\S]*?(?=<h2>|<p>Pie de Foto|$)`, 'i'); t = t.replace(r, ''); });
  // Remove generic legal/stat paragraphs
  const ps = t.match(/<p>(.*?)<\/p>/gi) || [];
  ps.forEach(p => {
    const pt = p.replace(/<[^>]*>/g, '');
    if (/Ley\s+\d+.*art[ií]culo.*establece|obligatoriedad|sanciones|prohibición|multas/i.test(pt) && pt.length > 100) t = t.replace(p, '');
    if (/(estadísticas|análisis|registros).*\d+\s+(?:incidentes|naufragios|excursionistas|por ciento)/i.test(pt) && pt.length > 80) t = t.replace(p, '');
    if (/reiteraron.*llamados|instaron.*población|recomendaciones básicas/i.test(pt) && pt.length > 80) t = t.replace(p, '');
    if (/Fuerza Naval|Ejército de Nicaragua|capitanías de puerto/i.test(pt) && pt.length > 80 && !pt.includes('rescat')) t = t.replace(p, '');
  });
  return t.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/<p>\s*<\/p>/gi, '').trim();
}

function acortar(t) { if (t.length <= 60) return t; const c = t.slice(0, 60).lastIndexOf(' '); return t.slice(0, c > 30 ? c : 55).replace(/\.{3,}$/, ''); }
function meta(c, cat) {
  const tx = c.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const or = tx.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
  let m = or.slice(0, 2).join(' '); if (m.length < 150) m += ` Noticias ${cat} Nicaragua.`; if (m.length > 170) m = m.slice(0, 167) + '...';
  return m;
}

const NOTICIAS = [
  {
    buscar: ['descargas eléctricas', 'electrocutados', 'managua', 'alexis argüello'],
    titulo: 'Dos hombres fallecen por descargas eléctricas en Managua',
    cat: 'Sucesos', dep: 'Managua', dateline: 'MANAGUA',
    slug: 'dos-hombres-fallecen-electrocutados-managua',
    html: `<h2>Hechos principales</h2><p>Dos hombres perdieron la vida por descargas eléctricas de alta intensidad en incidentes domésticos independientes ocurridos en sus viviendas de los barrios <strong>Alexis Argüello</strong> y <strong>Villa Reconciliación Norte</strong> de <strong>Managua</strong>, según informes de brigadas de emergencia.</p><p>Las fatalidades ocurrieron cuando manipulaban redes internas y electrodomésticos conectados directamente a tomacorrientes. Los cuerpos de auxilio acudieron para realizar asistencia primaria y coordinar traslados.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"La víctima sufrió el impacto al conectar un equipo de lavado cuya línea carecía de cobertura plástica aislante", indicaron fuentes del <strong>Distrito VII</strong>.</p></blockquote><blockquote><p>"El paciente fue ingresado a urgencias pero ya no presentaba signos vitales por la severidad de las quemaduras internas", detallaron reportes médicos del centro hospitalario.</p></blockquote><h2>Desarrollo</h2><p>El primer suceso ocurrió a las 07:30 horas del domingo 21 de mayo en <strong>Villa Reconciliación Norte</strong>, <strong>Distrito VII</strong>. El fallecido fue <strong>Lester Antonio Reyes Durán</strong> (44), quien realizaba mantenimiento en una lavadora y recibió la descarga directa al no percatarse del deterioro de los conductores eléctricos.</p><p>El segundo caso ocurrió al mediodía del lunes 1 de junio en <strong>Alexis Argüello</strong>, <strong>Distrito III</strong>. La víctima fue <strong>Harrison Francisco Sandoval Larios</strong> (36), quien sufrió quemaduras de segundo y tercer grado al intentar conectar una lámpara. Fue llevado al <strong>Hospital Fernando Vélez Paiz</strong>, donde se confirmó su deceso.</p><p>Peritos de la <strong>Dirección de Auxilio Judicial</strong> y especialistas de bomberos inspeccionaron los tableros de distribución y verificaron las condiciones de los electrodomésticos. Los restos fueron remitidos al <strong>Instituto de Medicina Legal</strong> para las autopsias correspondientes.</p><p>Las hipótesis apuntan a líneas de conexión provisionales, falta de disyuntores magnetotérmicos y deficiencias en el mantenimiento de redes domiciliarias en zonas periféricas de <strong>Managua</strong>.</p><p>Pie de Foto: Redes de distribución eléctrica y conexiones domiciliarias en sector residencial de la capital, Managua. Foto: Cortesía.</p>`
  },
  {
    buscar: ['asfixiados', 'pozo', 'kukra hill', 'flor de pino'],
    titulo: 'Dos jóvenes fallecen asfixiados en pozo en Kukra Hill',
    cat: 'Sucesos', dep: 'Caribe Sur', dateline: 'KUKRA HILL',
    slug: 'dos-jovenes-mueren-asfixiados-dentro-pozo-construccion-kukra-hill',
    html: `<h2>Hechos principales</h2><p>Dos jóvenes obreros fallecieron por asfixia la mañana del sábado tras quedar atrapados en un pozo en construcción en la comunidad <strong>Flor de Pino</strong>, municipio de <strong>Kukra Hill</strong>, <strong>Región Autónoma de la Costa Caribe Sur</strong>.</p><p>El incidente ocurrió a las 08:24 horas en una propiedad privada cerca de una planta de acopio lechero. Según brigadas de salvamento, las causas del deceso se asocian a privación extrema de oxígeno e inhalación de gases concentrados en el fondo de la estructura.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"Los operarios realizaban excavaciones manuales cuando el primero perdió el conocimiento; su compañero descendió para auxiliarlo pero también resultó afectado por las condiciones de la atmósfera interna", explicaron fuentes de rescate comunal.</p></blockquote><blockquote><p>"Las maniobras de extracción requirieron cuerdas y poleas especializadas por el espacio reducido de la fosa", detallaron técnicos de primeros auxilios.</p></blockquote><h2>Desarrollo</h2><p>Las víctimas fueron identificadas como <strong>Santos Eliseo López Obando</strong> (27), de la comarca <strong>La Iguana</strong>, <strong>El Rama</strong>, e <strong>Hilver Ariel Miranda Rivas</strong> (21), de <strong>Laguna de Perlas</strong>. <strong>López Obando</strong> se encontraba profundizando la base del pozo cuando sufrió desvanecimiento por falta de corrientes de aire.</p><p>Al percatarse de la emergencia, <strong>Miranda Rivas</strong> descendió para retirar a su compañero, pero los gases confinados le impidieron retornar. Habitantes de la propiedad intentaron maniobras artesanales con sogas, pero las características estructurales retrasaron el rescate.</p><p>Efectivos de la <strong>Policía Nacional</strong> y <strong>Bomberos Unidos</strong> se desplazaron al cuadrante rural, organizaron perímetro de seguridad y recuperaron los dos cuerpos a las 09:27 horas. Tras confirmar la ausencia de signos vitales, los restos fueron entregados a sus familias para traslado a sus municipios de origen y sepelio.</p><p>Agentes del orden público y peritos de seguridad ocupacional iniciaron el levantamiento de datos para evaluar el diámetro, la profundidad y constatar si la obra disponía de requerimientos técnicos para mitigar riesgos de acumulación de gases.</p><p>Pie de Foto: Entorno rural con labores de perforación de pozos de agua domiciliares, Kukra Hill, Caribe Sur. Foto: Cortesía.</p>`
  },
  {
    buscar: ['playa matilde', 'san juan del sur', 'lira gonzález'],
    titulo: 'Fallece joven por sumersión en playa Matilde, San Juan del Sur',
    cat: 'Sucesos', dep: 'Rivas', dateline: 'SAN JUAN DEL SUR',
    slug: 'fallece-joven-sumersion-playa-matilde-san-juan-del-sur',
    html: `<h2>Hechos principales</h2><p>El ciudadano <strong>David Ezequiel Lira González</strong> (28), originario de <strong>Managua</strong>, falleció por asfixia por sumersión la tarde del sábado tras ser arrastrado por una fuerte corriente de resaca en <strong>Playa Matilde</strong>, municipio de <strong>San Juan del Sur</strong>, <strong>Rivas</strong>.</p><p>El incidente ocurrió aproximadamente a las 15:30 horas en el litoral pacífico sur. Brigadas de emergencia y equipos de salvamento marítimo acudieron para ejecutar maniobras de localización y extracción del cuerpo.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"El muchacho se introdujo al mar y en minutos la corriente lo interceptó y arrastró hacia la zona profunda; intentamos auxiliarlo pero los esfuerzos fueron infructuosos", indicaron testigos del balneario rivense.</p></blockquote><blockquote><p>"Las unidades de socorro coordinaron el bloque de búsqueda apoyados por deportistas locales para agilizar el ingreso a las áreas de rompiente", detallaron reportes del <strong>Cuerpo de Bomberos de San Juan del Sur</strong>.</p></blockquote><h2>Desarrollo</h2><p>La víctima, residente cerca del kilómetro 15 de la <strong>Carretera Vieja a León</strong>, se encontraba en jornada de recreación familiar con su esposa <strong>Hazel Raquel Ayala Arias</strong>. Ingresó a las aguas en un sector que experimentó variación súbita en la dinámica del oleaje, perdiendo flotabilidad por la fuerza del arrastre.</p><p>Ante los llamados de auxilio, cuadrillas de bomberos y surfistas desplegaron botes ligeros y tablas de rescate para peinar el cuadrante marítimo. Tras los peritajes del médico forense, las autoridades autorizaron la entrega de los restos a los familiares para traslado a su ciudad de origen y sepelio.</p><p>La delegación de policía de <strong>Rivas</strong> fijó el suceso como muerte accidental por sumersión. El hecho generó preocupación entre operadores turísticos, ya que <strong>Lira González</strong> es el tercer ciudadano que pierde la vida en <strong>Playa Matilde</strong> en menos de treinta días. Los balances previos muestran el deceso de los menores <strong>Mateo Marcel</strong> y <strong>Ericko Gabriel Jiménez Velásquez</strong> (12 y 10 años), ocurrido el 9 de mayo en el mismo balneario.</p><p>Pie de Foto: Oleaje en zona costera de San Juan del Sur durante período de alta afluencia, Rivas. Foto: Cortesía.</p>`
  },
  {
    buscar: ['obreros', 'fallecen', 'matagalpa', 'sébaco', 'ciudad sandino'],
    titulo: 'Dos obreros fallecen y uno resulta herido en incidentes laborales en Managua y Matagalpa',
    cat: 'Sucesos', dep: 'Managua y Matagalpa', dateline: 'MANAGUA',
    slug: 'dos-obreros-fallecen-herido-accidentes-laborales-managua-matagalpa',
    html: `<h2>Hechos principales</h2><p>Dos obreros de la construcción fallecieron y un tercero resultó gravemente herido en los últimos días de mayo por accidentes laborales independientes por caídas de altura y descargas eléctricas en <strong>Managua</strong> y <strong>Matagalpa</strong>, según informes de autoridades de inspección.</p><p>Las fatalidades afectaron a trabajadores en tareas de mejoras estructurales y albañilería. Las brigadas de primera respuesta acudieron para certificar los decesos y coordinar el traslado de urgencia del herido.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"El obrero realizaba mediciones en la segunda planta cuando ocurrió el contacto accidental con la línea energizada, provocando una reacción mortal inmediata", explicaron familiares de la víctima en el sitio del suceso.</p></blockquote><blockquote><p>"Los informes de inspección reflejan que las actividades en andamios se ejecutaban sin implementos de sujeción ni líneas de vida exigibles", señalaron fuentes de supervisión laboral.</p></blockquote><h2>Desarrollo</h2><p>El primer incidente fatal ocurrió la tarde del viernes 29 de mayo en el reparto <strong>Motastepe</strong>, municipio de <strong>Ciudad Sandino</strong>, <strong>Managua</strong>. La víctima fue <strong>Sergio Alejandro Bonilla</strong> (22), originario de <strong>Tipitapa</strong>, quien recibió impacto eléctrico de alta intensidad mientras ejecutaba albañilería en el segundo nivel de una vivienda. Oficiales del <strong>Distrito X</strong> de la <strong>Policía Nacional</strong> iniciaron el levantamiento de declaraciones.</p><p>El segundo deceso ocurrió el miércoles 27 de mayo en el barrio <strong>Revolución</strong>, <strong>Distrito I</strong> de la capital, cerca de la colonia <strong>Máximo Jerez</strong>. <strong>Alejandro José López Pérez</strong> (48) sufrió traumatismo craneoencefálico severo tras caer desde aproximadamente 8 metros cuando reemplazaba láminas de zinc en el techo de una residencia. Las maniobras de auxilio de sus compañeros resultaron infructuosas.</p><p>El tercer hecho ocurrió el viernes 29 de mayo en el casco urbano de <strong>Sébaco</strong>, <strong>Matagalpa</strong>. Un joven trabajador, cuya identidad permanece bajo reserva médica, sufrió descarga eléctrica mientras laboraba en un establecimiento comercial, provocando su caída desde la segunda planta. Fue movilizado a un centro hospitalario de la zona norte, donde ingresó en estado crítico.</p><p>Peritos de auxilio judicial y especialistas en seguridad ocupacional inspeccionaron las redes de distribución, verificaron las alturas de las plataformas y constataron el inventario de herramientas.</p><p>Pie de Foto: Estructura de edificación civil sujeta a regulaciones de seguridad laboral en altura, Managua. Foto: Cortesía.</p>`
  },
  {
    buscar: ['naufragio', 'krukira', 'caribe norte', 'puerto cabezas'],
    titulo: 'Esposa y madre de capitán fallecen en naufragio en Caribe Norte',
    cat: 'Sucesos', dep: 'Caribe Norte', dateline: 'BILWI',
    slug: 'esposa-madre-capitan-fallecen-naufragio-krukira-caribe-norte',
    html: `<h2>Hechos principales</h2><p>Dos mujeres fallecieron por asfixia por sumersión luego de que la embarcación menor en la que viajaban naufragara el viernes frente a la barra de <strong>Krukira</strong>, municipio de <strong>Puerto Cabezas</strong>, <strong>Región Autónoma de la Costa Caribe Norte</strong>.</p><p>El siniestro de la panga "Capitán Disan D" movilizó a unidades de salvamento de la <strong>Fuerza Naval</strong>, pescadores artesanales y estructuras comunitarias, quienes lograron rescatar con vida al capitán y a un menor de tres años que permanecía aferrado a la vegetación costera.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"Las brigadas y voluntarios civiles localizaron al menor en horas de la tarde-noche sostenido de las ramas de un manglar en el perímetro costero", explicaron autoridades de la <strong>Unidad Municipal de Gestión Integral del Riesgo</strong> de <strong>Puerto Cabezas</strong>.</p></blockquote><blockquote><p>"Los destacamentos militares mantienen activas las coordinaciones y patrullas de exploración para determinar el paradero de un lactante que viajaba a bordo y continúa desaparecido", señalaron fuentes de monitoreo de emergencias.</p></blockquote><h2>Desarrollo</h2><p>La panga zarpó alrededor de las 06:00 horas desde el sector de <strong>Kistawan</strong>, localidad de <strong>Sandy Bay</strong>, con destino a <strong>Bilwi</strong>. Transportaba a cinco miembros de un mismo núcleo familiar cuando enfrentó fuerte oleaje por condiciones climáticas adversas en la zona de la barra, provocando pérdida de estabilidad y vuelco.</p><p>El capitán <strong>Kevin Brayan Thomas</strong> (35) alcanzó los márgenes continentales en estado de desorientación y notificó el accidente a los puestos de control. En las labores de rastreo se confirmó el fallecimiento de su madre <strong>Karlin Brayan Thomas</strong> (43), originaria del barrio <strong>Sandy Bay Sirpi</strong>, y de su cónyuge <strong>Yahoska Wislat Catus</strong> (27).</p><p>El operativo permitió el hallazgo del niño <strong>Aimar Jacobo Brayan</strong> (3), quien recibió asistencia médica primaria tras pasar varias horas expuesto a los elementos en el área de mangle. Los restos de las fallecidas fueron trasladados a sus comunidades de origen para sepelio, mientras la <strong>Policía Nacional</strong> abrió el expediente judicial.</p><p>Peritos de la capitanía de puerto inspeccionan los restos de la carrocería de fibra de vidrio para verificar la capacidad de carga y establecer si las dinámicas del oleaje o fallas de maniobra influyeron en la tragedia.</p><p>Pie de Foto: Embarcaciones artesanales y lanchas de cabotaje amarradas en terminal marítima de la costa atlántica, Bilwi. Foto: Cortesía.</p>`
  }
];

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = []; snap.forEach(d => docs.push(d));

  for (const n of NOTICIAS) {
    const existentes = docs.filter(d => {
      const t = (d.data().titulo || '').toLowerCase();
      return n.buscar.some(k => t.includes(k.toLowerCase()));
    });
    const contenido = processText(n.html);
    const titulo = acortar(n.titulo);
    const resumen = meta(contenido, n.cat);
    const data = { titulo, contenido, categoria: n.cat, departamento: n.dep, dateline: n.dateline, resumen, slug: n.slug, imagenDestacada: true, autor: 'Keyling Elieth Rivera Muñoz', fechaActualizacion: FieldValue.serverTimestamp(), estado: 'publicado' };

    if (existentes.length > 0) {
      await existentes[0].ref.update(data);
      console.log(`✅ REEMPLAZADA: ${titulo}`);
    } else {
      const ref = await db.collection('noticias').add({ ...data, fecha: FieldValue.serverTimestamp() });
      console.log(`✅ NUEVA: ${titulo} (ID: ${ref.id})`);
    }
  }
  console.log('\n=== LISTO ===');
  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
