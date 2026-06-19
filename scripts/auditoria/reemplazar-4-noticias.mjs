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
  t = t.replace(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026\b/gi, '$1 de $2 de 2025');
  t = t.replace(/\b(mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026\b/gi, '$1 de 2025');
  t = t.replace(/\b2026\b/g, '2025');
  const secciones = [
    'Indicadores de seguridad y recomendaciones técnicas',
    'Marco normativo e indicadores institucionales',
    'Regulación sanitaria y marco jurídico',
    'Análisis normativo e indicadores de seguridad'
  ];
  secciones.forEach(s => { const r = new RegExp(`<h2>\\s*${s}\\s*</h2>[\\s\\S]*?(?=<h2>|<p>Pie de Foto|$)`, 'i'); t = t.replace(r, ''); });
  const ps = t.match(/<p>(.*?)<\/p>/gi) || [];
  ps.forEach(p => {
    const pt = p.replace(/<[^>]*>/g, '');
    if (/Ley\s+\d+.*sancionan|penas.*años.*cárcel|normativas.*facultan|suspensión.*proyectos|multas/i.test(pt) && pt.length > 80) t = t.replace(p, '');
    if (/estadísticas.*reflejan|tendencias|incremento.*casos|persistencia.*conductas|registros.*incidencias/i.test(pt) && pt.length > 80) t = t.replace(p, '');
    if (/reiteraron.*llamados|instaron.*ciudadanía|exigir.*documentación|canales.*denuncia/i.test(pt) && pt.length > 80) t = t.replace(p, '');
    if (/Código Penal.*tipifica|agravantes|decomisar|medidas restrictivas/i.test(pt) && pt.length > 80) t = t.replace(p, '');
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
    buscar: ['electrocución', 'accidentes laborales', 'fallas estructurales'],
    titulo: 'Aumentan casos de electrocución en accidentes laborales',
    cat: 'Sucesos', dep: 'Managua y Estelí', dateline: 'MANAGUA',
    slug: 'aumentan-casos-electrocucion-accidentes-laborales-managua-esteli',
    html: `<h2>Hechos principales</h2><p>Al menos cinco personas fallecieron por descargas eléctricas de alta intensidad durante el primer semestre en los departamentos de <strong>Managua</strong> y <strong>Estelí</strong>, según expedientes de cuerpos de bomberos e informes de autoridades de inspección. Las fatalidades se registraron de manera independiente en entornos residenciales, obras de construcción civil y locales comerciales.</p><p>Los peritajes preliminares asocian los decesos a la manipulación de conectores averiados, la ausencia de interruptores diferenciales en redes domésticas y el contacto accidental con tendido energizado de alta tensión en infraestructuras que carecían de planes de prevención de riesgos.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"Los informes de criminalística confirman que los decesos en áreas residenciales se derivaron de la conexión de dispositivos a tomas que presentaban líneas expuestas o carecían de sistemas de polo a tierra", indicaron fuentes técnicas vinculadas a las inspecciones de seguridad.</p></blockquote><blockquote><p>"Las normativas vigentes obligan a las empresas y contratistas a proveer herramientas aisladas, guantes dieléctricos y cascos de protección para la manipulación de redes", explicaron especialistas en medicina forense tras evaluar los casos remitidos a la red hospitalaria.</p></blockquote><h2>Desarrollo</h2><p>El primer incidente ocurrió la tarde del martes 10 de marzo en un inmueble del barrio <strong>Villa Progreso</strong>, <strong>Distrito VI</strong> de Managua, donde opera el <strong>Laboratorio Clínico Ambiental Sinergia, S.A.</strong> El ciudadano <strong>Uriel Antonio Solís</strong> (30) sufrió una descarga fulminante mientras montaba unidades de climatización en la segunda planta. Efectivos de <strong>Bomberos Unidos de Nicaragua</strong> confirmaron el fallecimiento inmediato.</p><p>Posteriormente, en menos de 24 horas, se registraron dos decesos en Managua. El domingo 21 de mayo, <strong>Lester Antonio Reyes Durán</strong> (44) falleció en <strong>Villa Reconciliación Norte</strong> al recibir un impacto eléctrico mientras manipulaba una lavadora con cableado desgastado. Al mediodía del lunes 1 de junio, <strong>Harrison Francisco Sandoval Larios</strong> (36) murió tras ingresar sin signos vitales al <strong>Hospital Fernando Vélez Paiz</strong>; sufrió quemaduras severas en <strong>Alexis Argüello</strong> al intentar conectar una lámpara manual estando descalzo.</p><p>En construcción, el viernes 29 de mayo se reportó el deceso de <strong>Sergio Alejandro Bonilla</strong> (22), originario de <strong>Tipitapa</strong>, quien realizaba albañilería en el segundo nivel de una vivienda en el reparto <strong>Motastepe</strong>, <strong>Ciudad Sandino</strong>. Bonilla experimentó contacto accidental con líneas de distribución externa mientras realizaba mediciones estructurales sin los implementos de aislamiento requeridos.</p><p>Finalmente, el viernes 5 de junio, autoridades hospitalarias de <strong>Estelí</strong> confirmaron el fallecimiento de <strong>Moisés Antonio Salgado Morales</strong> (21). Permanecía ingresado en el <strong>Hospital San Juan de Dios</strong> tras sufrir quemaduras de tercer grado y trauma craneal al recibir una descarga del tendido eléctrico mientras laboraba en una edificación civil del barrio <strong>Panamá Soberana</strong>. Los peritos realizaron levantamientos en cada inmueble para determinar responsabilidades.</p><p>Pie de Foto: Instalaciones eléctricas residenciales sujetas a inspección técnica, Managua. Foto: Cortesía.</p>`
  },
  {
    buscar: ['condenan', '30 años', 'feminicidio', 'telica', 'ríos duarte'],
    titulo: 'Condenan a 30 años de prisión por feminicidio en Telica',
    cat: 'Sucesos', dep: 'León', dateline: 'MANAGUA',
    slug: 'condenan-30-anos-prision-feminicidio-telica',
    html: `<h2>Hechos principales</h2><p>El <strong>Juzgado de Distrito Especializado de Violencia y Adolescencia de León</strong> dictó una sentencia condenatoria de 30 años de prisión contra <strong>Francisco José Ríos Duarte</strong> (30), tras demostrarse su autoría directa en el feminicidio de su expariente <strong>Maricela Gertrudis Duarte García</strong> (42). La resolución fue emitida por la jueza <strong>Wendy Auxiliadora Balladares Cortez</strong>.</p><p>La <strong>Fiscalía General de la República</strong> tipificó las acciones punibles ocurridas el 2 de abril en el sector costero de "La Pedrera", comarca <strong>Verónica Lacayo</strong>, a la altura del kilómetro 104 de la carretera que comunica <strong>León</strong> y <strong>Chinandega</strong>, en el municipio de <strong>Telica</strong>.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"La resolución impone la pena máxima aplicable para este tipo de tipicidades, ordenando además medidas restrictivas y de reparación económica para los dependientes de la víctima", detallaron fuentes judiciales vinculadas a la tramitación de la causa penal.</p></blockquote><blockquote><p>"Las periciales forenses y los análisis biológicos del <strong>Instituto de Medicina Legal</strong> permitieron la comprobación científica de la causa de muerte por asfixia mecánica y la posterior identificación de los restos", explicaron portavoces de auxilio judicial.</p></blockquote><h2>Desarrollo</h2><p>Los antecedentes del debate procesal determinaron que el sentenciado citó a la ciudadana en el kilómetro 103 bajo el argumento de entregarle dinero. Tras reunirse, ambos se desplazaron hacia un área despoblada conocida como "La Pedrera", donde surgió una discusión debido a la negativa de la víctima de reestablecer los vínculos afectivos.</p><p>Durante el altercado, <strong>Ríos Duarte</strong> ejerció presión continua sobre la región cervical de la víctima con sus extremidades superiores, provocándole colapso respiratorio por estrangulamiento y fallecimiento inmediato. Con el propósito de ocultar la evidencia, el procesado cubrió el cuerpo con piedras del entorno y abandonó la zona en una bicicleta propia, permaneciendo evadido en las semanas posteriores.</p><p>La familia de <strong>Duarte García</strong> promovió campañas de localización tras reportar su desaparición ante los distritos policiales. Las labores de rastreo finalizaron el viernes 24 de abril, cuando pobladores de la comarca <strong>Verónica Lacayo</strong> reportaron el hallazgo de los restos en avanzado estado de descomposición. Las patrullas operativas de la <strong>Policía Nacional</strong> ejecutaron la detención de <strong>Ríos Duarte</strong> ese mismo día en los perímetros de la comarca tras concluir las fases de investigación de campo.</p><p>El procesado admitió los cargos durante la audiencia inicial celebrada el 14 de mayo, prescindiendo de la continuidad de las etapas orales del juicio. La sentencia dictada el 28 de mayo ordena la reclusión en régimen cerrado por el período establecido, fijando además pensiones de reparación para los dos hijos menores de la víctima, de 10 y 16 años respectivamente.</p><p>Pie de Foto: Sede del complejo judicial de la ciudad de León, donde se emitió la sentencia condenatoria. Foto: Cortesía.</p>`
  },
  {
    buscar: ['detienen', 'médico', 'liposucción', 'jennypher', 'reyes castro'],
    titulo: 'Detienen a médico en Managua por muerte tras liposucción',
    cat: 'Sucesos', dep: 'Managua', dateline: 'MANAGUA',
    slug: 'detienen-medico-managua-muerte-liposuccion',
    html: `<h2>Hechos principales</h2><p>Cuatro profesionales del sector sanitario se encuentran bajo detención policial por su presunta implicación en la muerte de <strong>Jennypher Elizabeth Reyes Castro</strong> (24), quien falleció por complicaciones clínicas graves tras una intervención estética en el <strong>Centro Médico Quirúrgico Privado Bethesda</strong>, <strong>Ciudad Sandino</strong>, <strong>Managua</strong>.</p><p>La víctima, originaria de <strong>Matagalpa</strong>, se realizó un procedimiento de lipoescápula y cintura con transferencia a glúteos el pasado 22 de mayo. La <strong>Policía Nacional</strong> y el <strong>Ministerio Público</strong> confirmaron la captura de todo el equipo médico participante para iniciar diligencias periciales bajo principios de legalidad y debido proceso.</p><h2>Declaraciones de fuentes</h2><blockquote><p>«A este momento ya han sido capturados todos los involucrados; prosiguiéndose con las diligencias investigativas, bajo los principios de objetividad, legalidad y respeto al debido proceso», detalló el comunicado conjunto de la <strong>Fiscalía General de la República</strong> y la <strong>Policía Nacional</strong>.</p></blockquote><blockquote><p>«Las auditorías de los registros sanitarios confirman que el médico asistente carece de la certificación para ejercer la especialidad de Cirugía Plástica, Estética y Reconstructiva, figurando únicamente con registro oficial como médico general», indicaron fuentes del <strong>Ministerio de Salud</strong>.</p></blockquote><h2>Desarrollo</h2><p>Los antecedentes técnicos consignan que la paciente coordinó la cirugía a través de canales digitales de la clínica <strong>Amate</strong> en Managua, por un costo de 3,500 dólares. Tras ser dada de alta el mismo día de la intervención, retornó a su lugar de origen, donde comenzó a manifestar dolores dorsales agudos, deficiencias respiratorias y alteraciones en la visión. Ante el agravamiento, fue ingresada de urgencia en la Unidad de Cuidados Intensivos del <strong>Hospital Escuela César Amador Molina de Matagalpa</strong>.</p><p>Los diagnósticos determinaron pulmón perforado con acumulación de sangre (hemotórax), sepsis generalizada y embolia grasa pulmonar, condiciones que desencadenaron choque distributivo y tromboembolismo pulmonar. El fallecimiento se registró la noche del miércoles 27 de mayo. Los detenidos fueron identificados como la cirujana plástica <strong>Karla Ramos</strong>, el cirujano general <strong>Fidel Ernesto Guzmán Sevilla</strong>, la anestesióloga <strong>Katherine Orozco</strong> y el médico general <strong>Livang Clifford Argüello Molina</strong>, quien actuó como asistente.</p><p>Las indagaciones comprobaron que <strong>Argüello Molina</strong> ya acumulaba antecedentes de mala praxis. El 19 de mayo fue declarado culpable por el <strong>Juzgado Segundo Local Penal de Managua</strong>, bajo la titularidad de la jueza <strong>María José Morales Alemán</strong>, por lesiones imprudentes graves en perjuicio de otra paciente a quien le practicó una lipopapada en noviembre de 2024, dictándosele formalmente pena de dos años de prisión y sanción pecuniaria el viernes 29 de mayo. Las dependencias sanitarias corroboraron que el investigado operaba a pesar de tener inhabilitación administrativa activa y cancelación de su código sanitario.</p><p>La denuncia formal fue promovida por el cónyuge de la víctima, <strong>Kevin Molinares</strong>, ante las oficinas de <strong>Auxilio Judicial</strong>. Las honras fúnebres de la ciudadana, quien dejó en orfandad a una menor de edad, se efectuaron en la <strong>Funeraria La Esperanza</strong> de Matagalpa, seguidas de misa de cuerpo presente en la <strong>Catedral San Pedro Apóstol</strong> y sepelio en el cementerio municipal.</p><p>Pie de Foto: Instalaciones de complejo de atención médica sujeto a peritajes judiciales, Managua. Foto: Cortesía.</p>`
  },
  {
    buscar: ['santo domingo', 'chontales', 'fajardo guido', 'hernández obando'],
    titulo: 'Investigan fallecimiento de joven en Santo Domingo, Chontales',
    cat: 'Sucesos', dep: 'Chontales', dateline: 'MANAGUA',
    slug: 'investigan-fallecimiento-joven-santo-domingo-chontales',
    html: `<h2>Hechos principales</h2><p>Efectivos de la <strong>Policía Nacional</strong> capturaron a <strong>Yader Ezequiel Fajardo Guido</strong> (20), investigado como principal sospechoso en el fallecimiento de <strong>Hernaldo Iván Hernández Obando</strong> (26). El suceso se registró durante la madrugada del lunes 25 de mayo en una vía pública del barrio <strong>Revolución</strong>, municipio de <strong>Santo Domingo</strong>, <strong>Chontales</strong>.</p><p>Los informes policiales detallan que el incidente se originó por un altercado derivado de diferencias particulares. El presunto agresor fue localizado y puesto a orden de instancias judiciales en la cabecera departamental de <strong>Juigalpa</strong>.</p><h2>Declaraciones de fuentes</h2><blockquote><p>«Las patrullas operativas capturaron al investigado en una zona rural y procedieron a la ocupación de un objeto cortopunzante con evidencias biológicas que será incorporado como prueba en el expediente», explicaron portavoces de auxilio judicial de la localidad.</p></blockquote><blockquote><p>«El personal médico de turno determinó que el fallecimiento se produjo por choque hipovolémico severo por la gravedad de las lesiones recibidas», señalaron fuentes institucionales del departamento.</p></blockquote><h2>Desarrollo</h2><p>Según indagaciones preliminares y peritajes de campo, los involucrados se encontraban en la vía pública del barrio <strong>Revolución</strong>, a escasa distancia de la delegación policial local, cuando sostuvieron una discusión. En el transcurso del altercado, <strong>Fajardo Guido</strong> presuntamente atacó a <strong>Hernández Obando</strong> utilizando un arma blanca, causándole heridas graves en tórax y cuello antes de darse a la fuga.</p><p>A pesar de las lesiones, la víctima logró desplazarse por varias calles hacia las instalaciones de la <strong>Policía Nacional en Santo Domingo</strong> para solicitar asistencia urgente. Los agentes realizaron el traslado inmediato al centro de salud de la localidad; sin embargo, falleció pocos minutos después de su ingreso por pérdida masiva de sangre.</p><p>Las fuerzas del orden activaron un plan de búsqueda que concluyó la noche del martes 26 de mayo con la localización de <strong>Fajardo Guido</strong> en la comarca <strong>El Camastro</strong>, comunidad <strong>Fruta de Pan</strong>, zona limítrofe entre los municipios de <strong>Santo Domingo</strong> y <strong>La Libertad</strong>. Durante la requisa, los oficiales le decomisaron una navaja de 14 centímetros con manchas hemáticas, trasladada a laboratorios de criminalística.</p><p>El miércoles 27 de mayo, el detenido fue remitido a celdas preventivas de la delegación de <strong>Juigalpa</strong> para su comparecencia ante juzgados de distrito. Paralelamente, pobladores y conocidos de la víctima organizaron los servicios fúnebres en el casco urbano de <strong>Santo Domingo</strong>, efectuando un recorrido por las avenidas principales que culminó con el sepelio en el cementerio municipal.</p><p>Pie de Foto: Vía pública del barrio Revolución en el casco urbano de Santo Domingo, Chontales, escenario del incidente. Foto: Cortesía.</p>`
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
