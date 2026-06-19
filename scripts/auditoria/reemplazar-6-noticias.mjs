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
  const secciones = ['Indicadores de seguridad y operaciones','Normativas de protección y seguridad civil','Estadísticas e indicadores de siniestralidad','Prevención y normativas de seguridad','Medidas de seguridad y gestión de riesgos','Indicadores de siniestralidad y regulaciones'];
  secciones.forEach(s => { const r = new RegExp(`<h2>\\s*${s}\\s*</h2>[\\s\\S]*?(?=<h2>|<p>Pie de Foto|$)`,'i'); t = t.replace(r,''); });
  // Remove generic legal paragraphs
  const ps = t.match(/<p>(.*?)<\/p>/gi) || [];
  ps.forEach(p => {
    const pt = p.replace(/<[^>]*>/g,'');
    if (/Ley\s+\d+.*art[ií]culo.*establece.*(?:penas|prisi[oó]n|sanciones)/i.test(pt) && pt.length>100) t = t.replace(p,'');
    if (/(estad[ií]sticas|balances|reportes).*\d+\s+(?:reportes|choques|casos|licencias)/i.test(pt) && pt.length>100) t = t.replace(p,'');
    if (/campa[nñ]as\s+de\s+concienciaci[oó]n|promover\s+el\s+uso|SINAPRED|reiteraron\s+los\s+llamados/i.test(pt) && pt.length>80) t = t.replace(p,'');
  });
  return t.replace(/\s+/g,' ').replace(/\s+([.,;:!?])/g,'$1').replace(/<p>\s*<\/p>/gi,'').trim();
}

function acortar(t) { if (t.length<=60) return t; const c=t.slice(0,60).lastIndexOf(' '); return t.slice(0,c>30?c:55).replace(/\.{3,}$/,''); }
function meta(c, cat) {
  const tx = c.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const or = tx.split(/(?<=[.!?])\s+/).filter(s=>s.length>20);
  let m = or.slice(0,2).join(' '); if (m.length<150) m+=` Noticias ${cat} Nicaragua.`; if (m.length>170) m=m.slice(0,167)+'...';
  return m;
}

const NOTICIAS = [
  {
    buscar: ['jiron rosales','jicaro','arma blanca'],
    titulo: 'Investigan fallecimiento de motociclista en El Jícaro',
    cat: 'Sucesos', dep: 'Nueva Segovia', dateline: 'EL JÍCARO',
    slug: 'investigan-fallecimiento-motociclista-municipio-jicaro',
    html: `<h2>Hechos principales</h2><p>Un joven motociclista identificado como <strong>Degling Enoc Jirón Rosales</strong>, de 26 años, perdió la vida la madrugada del sábado tras recibir múltiples heridas con arma blanca durante una riña en la carretera <strong>El Jícaro-Murra</strong>, <strong>Nueva Segovia</strong>.</p><p>Los informes señalan que el incidente se desencadenó mientras la víctima ingería bebidas alcohólicas en la vía pública junto a <strong>Jamilton Dariel Valle</strong> (20), <strong>Franiel Osnier Hernández</strong> (18) y <strong>Javier Antonio Godoy</strong> (25). Surgió una fuerte discusión que derivó en agresiones físicas.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"El médico forense determinó que la causa de muerte fue shock hipovolémico por heridas de arma blanca", indicaron fuentes médicas del levantamiento legal.</p></blockquote><blockquote><p>"Las unidades de investigación ejecutan operativos de búsqueda en comunidades rurales para dar con los presuntos responsables", señalaron fuentes judiciales de la zona norte.</p></blockquote><h2>Desarrollo</h2><p>Durante el altercado, se presume que <strong>Valle</strong> utilizó un objeto punzocortante contra <strong>Godoy</strong>. Simultáneamente, <strong>Hernández</strong> habría agredido con un cuchillo a <strong>Jirón Rosales</strong>, ocasionándole lesiones mortales antes de darse a la fuga.</p><p>El cuerpo fue localizado en horas de la mañana por pobladores de la comarca <strong>Sabana Larga</strong>, a un costado de la calzada junto a su motocicleta. Los residentes notificaron de inmediato a las autoridades.</p><p>Agentes de auxilio judicial acordonaron el perímetro, realizaron la fijación fotográfica y recolectaron evidencias. Los investigadores entrevistaron a familiares y testigos para esclarecer las circunstancias del ataque.</p><p>Tras concluir las revisiones periciales, las autoridades entregaron los restos al padre, <strong>Javier Antonio Rayo Jirón</strong> (45), quien los trasladó hacia la comarca <strong>La Máquina</strong> para gestionar el sepelio.</p><p>Pie de Foto: Tramo de carretera interurbana en comunidades rurales de Nueva Segovia. Foto: Cortesía.</p>`
  },
  {
    buscar: ['anton ruiz','laguna de apoyo','diriomo'],
    titulo: 'Hallan sin vida a adolescente desaparecido en Laguna de Apoyo',
    cat: 'Sucesos', dep: 'Granada', dateline: 'DIRIÁ',
    slug: 'hallan-sin-vida-adolescente-desaparecido-laguna-apoyo',
    html: `<h2>Hechos principales</h2><p>El cuerpo del adolescente <strong>Saúl Antonio Antón Ruiz</strong> (17) fue localizado flotando en la <strong>Reserva Natural Laguna de Apoyo</strong> la mañana del viernes, en el sector <strong>El Boquete</strong>, municipio de <strong>Diriá</strong>, <strong>Granada</strong>.</p><p>La víctima cursaba décimo grado en el <strong>Instituto Rafael Ángel Reyes</strong> de <strong>Diriomo</strong> y estaba desaparecido desde la tarde del miércoles, luego de retirarse del centro de estudios acompañado de otro joven cuya identidad aún no ha sido establecida.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"El hallazgo se produjo aproximadamente a las 10:30 horas en un área de difícil acceso, ya que ingresaron por un sendero boscoso no habilitado", indicaron brigadas de salvamento.</p></blockquote><blockquote><p>"Las unidades de auxilio judicial mantienen abierta una investigación exhaustiva para esclarecer las circunstancias del deceso", señalaron fuentes de seguridad.</p></blockquote><h2>Desarrollo</h2><p>Testimonios de la comunidad escolar detallan que el adolescente permaneció solo una hora en clases el miércoles antes de abandonar el instituto con rumbo a la laguna. Su madre, <strong>Susana del Socorro Ruiz Díaz</strong> (34), interpuso la denuncia por desaparición para activar los protocolos de búsqueda.</p><p>El despliegue de rastreo se extendió por más de 48 horas y movilizó a familiares, pobladores de la comarca <strong>La Escoba</strong>, pescadores artesanales y <strong>Bomberos Unidos</strong>. El cuerpo fue avistado en los márgenes rocosos, requiriendo maniobras especiales de extracción por la complejidad topográfica del cráter volcánico.</p><p>Peritos de criminalística y agentes de la <strong>Policía Nacional</strong> realizaron la fijación de la escena. Los restos fueron trasladados al <strong>Instituto de Medicina Legal</strong> para determinar si la causa fue asfixia por sumersión o factores externos.</p><p>Debido al avanzado estado de descomposición, las autoridades recomendaron el traslado inmediato a su localidad de origen. El joven, de la comarca <strong>La Escoba</strong>, sector <strong>El Guanacaste</strong>, recibió sepultura esa misma tarde en el cementerio municipal de <strong>Diriomo</strong>.</p><p>Pie de Foto: Orillas de la Reserva Natural Laguna de Apoyo en zona de difícil acceso, Granada. Foto: Cortesía.</p>`
  },
  {
    buscar: ['tres accidentes','managua','boaco','camoapa'],
    titulo: 'Tres accidentes de tránsito dejan lesionados en Managua y Boaco',
    cat: 'Sucesos', dep: 'Managua y Boaco', dateline: 'MANAGUA',
    slug: 'tres-accidentes-transito-dejan-lesionados-managua-boaco',
    html: `<h2>Hechos principales</h2><p>Al menos cuatro personas resultaron lesionadas tras tres accidentes de tránsito entre la noche del viernes y la madrugada del sábado en <strong>Managua</strong> y <strong>Boaco</strong>, según balances de primera respuesta.</p><p>Los siniestros, que involucraron dos motocicletas y una camioneta, movilizaron a técnicos en emergencias médicas hacia dos distritos de la capital y una ruta interurbana de <strong>Camoapa</strong>. Las especialidades de tránsito iniciaron los peritajes.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"El conductor de la motocicleta fue ingresado a urgencias tras ser colisionado por un automóvil que se dio a la fuga a gran velocidad", indicaron fuentes hospitalarias.</p></blockquote><blockquote><p>"Los lesionados del vuelco fueron auxiliados por pobladores y trasladados en ambulancias hacia la unidad médica regional", detallaron paramédicos de la carretera.</p></blockquote><h2>Desarrollo</h2><p>El primer incidente ocurrió a las 19:30 horas en el kilómetro 8 de la <strong>Carretera Norte</strong>, <strong>Distrito III</strong> de <strong>Managua</strong>, donde <strong>Jonathan Gabriel Silva Suárez</strong> (18) fue arrollado por un automóvil mientras conducía su motocicleta. El vehículo portaba placas <strong>M424207</strong> y escapaba a exceso de velocidad; el paciente fue trasladado al <strong>Hospital Alemán Nicaragüense</strong>.</p><p>A las 21:15 horas, en la <strong>Rotonda Centroamérica</strong>, <strong>Distrito II</strong>, <strong>Alejandro Emilio Gutiérrez</strong> sufrió politraumatismos al perder el control de su motocicleta e impactar contra un camión de carga estacionado. Fue remitido de urgencia al <strong>Hospital Manolo Morales</strong>.</p><p>El tercer siniestro fue el vuelco de una camioneta a las 06:30 horas del sábado en el kilómetro 112 de la carretera <strong>Boaco-Camoapa</strong>, sector <strong>El Coyolar</strong>. Resultaron heridos <strong>María López</strong> (34), con fractura en el brazo derecho, y <strong>Carlos Ruiz</strong> (29), con traumatismo abdominal cerrado. Ambos fueron atendidos por la <strong>Cruz Blanca</strong> e ingresados al <strong>Hospital Regional de Boaco</strong>. Los inspectores consignaron que el automotor carecía de cinturones de seguridad funcionales en los asientos posteriores.</p><p>Pie de Foto: Equipos de primeros auxilios brindando asistencia en avenida de la capital, Managua. Foto: Cortesía.</p>`
  },
  {
    buscar: ['incendio','nindiri','henry mendez'],
    titulo: 'Incendio destruye negocio en Nindirí con pérdidas de C$200 mil',
    cat: 'Sucesos', dep: 'Masaya', dateline: 'NINDIRÍ',
    slug: 'incendio-destruye-negocio-nindiri-perdidas-200-mil-cordobas',
    html: `<h2>Hechos principales</h2><p>Un incendio de gran magnitud destruyó un establecimiento comercial de ropa usada, repuestos para bicicletas y máquinas de coser, la mañana del miércoles en el reparto <strong>Henry Méndez</strong>, municipio de <strong>Nindirí</strong>, <strong>Masaya</strong>.</p><p>El siniestro consumió el inventario total; las pérdidas fueron estimadas preliminarmente por encima de <strong>200,000 córdobas</strong>. Las brigadas de extinción se desplegaron para controlar las llamas y evitar su propagación a viviendas contiguas.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"Los equipos de emergencia lograron controlar las llamas tras una intensa labor de sofocación, reportando únicamente daños materiales en la estructura", indicaron unidades de primera respuesta.</p></blockquote><blockquote><p>"Los especialistas realizan peritajes para establecer el origen exacto del siniestro y descartar otras circunstancias", señalaron fuentes de seguridad civil.</p></blockquote><h2>Desarrollo</h2><p>El local tenía paredes de concreto y verjas de hierro, pero la alta concentración de artículos inflamables (textiles, llantas, pinturas, lubricantes) aceleró la combustión. Los vecinos notificaron la emergencia al observar columnas de humo denso.</p><p>Los propietarios fueron identificados como <strong>Jenny Vanessa Murillo García</strong> (43) y <strong>Teófilo Bonilla Aguirre</strong> (44), quienes dependían del negocio como fuente de sustento familiar. Permanecen a la espera de los dictámenes técnicos.</p><p>Unidades de la <strong>Dirección General de Bomberos</strong> coordinaron el corte eléctrico preventivo. Tras enfriamiento y remoción de escombros, no se reportaron quemaduras ni intoxicaciones. Investigadores de la <strong>Policía Nacional</strong>, <strong>Bomberos</strong> y <strong>Defensa Civil</strong> levantaron muestras de conductores eléctricos. Las hipótesis abarcan cortocircuito por sobrecarga o fallas en dispositivos de protección térmica.</p><p>Pie de Foto: Fachada de local comercial tras extinción de siniestro, Nindirí. Foto: Cortesía.</p>`
  },
  {
    buscar: ['ahogadas','trapiche','playa la flor'],
    titulo: 'Dos personas fallecen ahogadas en Managua y Rivas durante el fin de semana',
    cat: 'Sucesos', dep: 'Managua y Rivas', dateline: 'MANAGUA',
    slug: 'dos-personas-fallecen-ahogadas-managua-rivas-fin-semana',
    html: `<h2>Hechos principales</h2><p>Dos personas perdieron la vida por asfixia por sumersión en incidentes independientes el fin de semana del 30 y 31 de mayo en el balneario <strong>El Trapiche</strong> (<strong>Tipitapa</strong>) y <strong>Playa La Flor</strong> (<strong>San Juan del Sur</strong>), según informes de rescate.</p><p>Las fatalidades afectaron a una ciudadana en el centro recreativo de <strong>Managua</strong> y a un pescador artesanal en el litoral de <strong>Rivas</strong>.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"La ciudadana fue rescatada sin signos vitales de una zona profunda tras introducirse al agua en estado de ebriedad", indicaron testigos del balneario.</p></blockquote><blockquote><p>"Los pescadores intentaron auxiliarlo al percatarse de la pérdida de flotabilidad, pero el cuerpo ya no respondía a reanimación cardiopulmonar", detallaron socorristas de Rivas.</p></blockquote><h2>Desarrollo</h2><p>El primer suceso ocurrió la tarde del sábado 30 de mayo en <strong>El Trapiche</strong>, kilómetro 32 hacia <strong>Tipitapa</strong>. La víctima fue <strong>Claudia Raquel Tenorio Laguna</strong>, quien según testimonios se encontraba ingiriendo bebidas alcohólicas antes de ingresar al agua. Los paramédicos de <strong>Bomberos Unidos</strong> intentaron resucitación sin éxito y trasladaron el cuerpo al <strong>Instituto de Medicina Legal</strong>.</p><p>El segundo deceso ocurrió la mañana del domingo 31 de mayo en <strong>Playa La Flor</strong>, <strong>San Juan del Sur</strong>. El fallecido fue <strong>Norman López López</strong> (40), originario de <strong>Jinotepe</strong> y residente en <strong>Belén</strong>, mecánico automotriz que realizaba pesca artesanal en días libres. Se disponía a lanzar un trasmallo cuando sufrió un enredo en sus herramientas y fue arrastrado por el oleaje. Otros marineros no pudieron auxiliarlo por las corrientes de resaca.</p><p>Peritos judiciales de <strong>Rivas</strong> y <strong>Managua</strong> iniciaron diligencias para determinar si variaciones climáticas asociadas a perturbaciones atmosféricas influyeron en el arrastre del pescador.</p><p>Pie de Foto: Margen de manto acuífero acondicionado para bañistas en centro recreativo de la región centro, Managua. Foto: Cortesía.</p>`
  },
  {
    buscar: ['tres personas','accidentes motocicleta','rivas','bluefields'],
    titulo: 'Tres personas fallecen en accidentes de motocicleta en Rivas y Managua',
    cat: 'Sucesos', dep: 'Rivas y Caribe Sur', dateline: 'MANAGUA',
    slug: 'tres-personas-fallecen-accidentes-motocicleta-rivas-caribe-sur',
    html: `<h2>Hechos principales</h2><p>Tres personas perdieron la vida en graves accidentes de tránsito entre la noche del sábado 30 y la madrugada del domingo 31 de mayo en <strong>Rivas</strong> y la <strong>Región Autónoma de la Costa Caribe Sur</strong>, según informes de seguridad y emergencia.</p><p>Las fatalidades involucraron dos conductores de motocicletas y una pasajera. Los incidentes ocurrieron en <strong>Tola</strong>, <strong>Cárdenas</strong> y la carretera <strong>Bluefields-Nueva Guinea</strong>.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"El conductor sufrió un impacto de gran magnitud contra una estructura metálica al perder el control en una curva pronunciada", indicaron fuentes de Rivas.</p></blockquote><blockquote><p>"La paciente ingresó con trauma craneal severo y, a pesar de los esfuerzos médicos, los daños resultaron fatales horas después", detallaron reportes médicos del Caribe Sur.</p></blockquote><h2>Desarrollo</h2><p>El primer suceso ocurrió la noche del sábado en <strong>Tola</strong>, <strong>Rivas</strong>, donde falleció <strong>Ricardo Martínez Ruiz</strong> (48). Conducía su motocicleta cerca del <strong>Aeropuerto Costa Esmeralda</strong> cuando perdió el control en una curva a exceso de velocidad e impactó contra la malla perimetral.</p><p>Casi simultáneamente, en <strong>Cárdenas</strong>, falleció <strong>Franklin Sáenz Novoa</strong> (23). Se desplazaba por el sector de <strong>La Calera</strong> y perdió estabilidad, cayendo en una estructura de alcantarillado cerca de <strong>Los Chiles</strong>. Las autoridades confirmaron que no utilizaba casco reglamentario.</p><p>La tercera fatalidad ocurrió en el kilómetro 337.5 de la carretera <strong>Bluefields-Nueva Guinea</strong>, donde circulaba <strong>Eduardo José Buitrago Marenco</strong> (22). La motocicleta impactó contra un semoviente que invadió la vía, colisionando contra una valla metálica. La pasajera <strong>Zobeyda Delmira Jiménez López</strong> (31) sufrió lesiones fatales y falleció horas después en el centro asistencial.</p><p>Peritos de <strong>Seguridad de Tránsito</strong> de las delegaciones policiales realizaron los croquis, aseguraron evidencias y determinaron responsabilidades en cada siniestro.</p><p>Pie de Foto: Señalizaciones de seguridad vial en carretera interurbana, Nicaragua. Foto: Cortesía.</p>`
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
