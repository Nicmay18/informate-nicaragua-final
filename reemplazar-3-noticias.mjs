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
    'Indicadores de transporte marítimo y regulaciones',
    'Regulación sanitaria y marco jurídico',
    'Riesgos laborales y trámites consulares'
  ];
  secciones.forEach(s => { const r = new RegExp(`<h2>\\s*${s}\\s*</h2>[\\s\\S]*?(?=<h2>|<p>Pie de Foto|$)`, 'i'); t = t.replace(r, ''); });
  const ps = t.match(/<p>(.*?)<\/p>/gi) || [];
  ps.forEach(p => {
    const pt = p.replace(/<[^>]*>/g, '');
    if (/Ley\s+\d+.*art[ií]culo|obligatoriedad|sanciones|multas|facultan.*suspender|licencias de funcionamiento/i.test(pt) && pt.length > 80) t = t.replace(p, '');
    if (/estadísticas.*indicadores|incremento de denuncias|tendencia|preocupación constante/i.test(pt) && pt.length > 80) t = t.replace(p, '');
    if (/reiteraron.*llamados|instaron.*verificar|campañas de recaudación.*costos|normativas migratorias|certificados de embalsamamiento/i.test(pt) && pt.length > 80) t = t.replace(p, '');
    if (/antecedente inmediato|deceso por intoxicación|Berlindo Samuel Sosa|Cutris/i.test(pt)) t = t.replace(p, '');
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
    buscar: ['volcamiento', 'embarcación', 'krukira', 'caribe norte', 'milagro'],
    titulo: 'Dos mujeres fallecen tras volcamiento de embarcación en Caribe Norte',
    cat: 'Sucesos', dep: 'Caribe Norte', dateline: 'BILWI',
    slug: 'tragedia-milagro-krukira-nino-sobrevive-naufragio-madre-abuela',
    html: `<h2>Hechos principales</h2><p>Una profunda tragedia marítima sacudió la Costa Caribe Norte de Nicaragua cuando la embarcación menor «Cap. Disan D» naufragó frente a la barra de <strong>Krukira</strong>, municipio de <strong>Puerto Cabezas</strong>. El siniestro, que afectó a miembros de una comunidad de <strong>Sandy Bay</strong>, dejó dos mujeres fallecidas, dos sobrevivientes y labores de rastreo activas para localizar a un menor desaparecido.</p><p>Las víctimas fueron identificadas como <strong>Yahoska Wislat Catus</strong> (27) y <strong>Karlin Brayan Thomas</strong> (43), originaria del barrio <strong>Sandy Bay Sirpi</strong> en <strong>Bilwi</strong>, quienes perdieron la vida por sumersión. Entre los sobrevivientes se encuentran el capitán <strong>Kevin Brayan Thomas</strong> (35) y su hijo <strong>Aimar Jacobo Brayan</strong> (3).</p><h2>Declaraciones de fuentes</h2><blockquote><p>«El hallazgo del menor se produjo en horas de la tarde-noche del viernes por parte de ocupantes de una panga comunitaria que divisaron al paciente sostenido de la vegetación en un sector de manglares», explicaron miembros de las brigadas de salvamento.</p></blockquote><blockquote><p>«Las tripulaciones de la Fuerza Naval mantienen las operaciones de exploración y búsqueda en los cuadrantes marítimos colindantes para determinar el paradero de otro menor de edad que viajaba a bordo y que continúa desaparecido», señalaron fuentes locales de monitoreo de emergencias.</p></blockquote><h2>Desarrollo</h2><p>La embarcación zarpó alrededor de las 06:00 horas del viernes desde el sector de <strong>Kistawan</strong>, <strong>Sandy Bay</strong>, con destino a <strong>Bilwi</strong>. Transportaba a cinco integrantes de una misma familia cuando, al aproximarse a la barra de <strong>Krukira</strong> —área de alta complejidad hidrográfica—, la estructura fue desestabilizada por el oleaje y las corrientes, provocando su volcamiento.</p><p>Tras el siniestro, el capitán logró alcanzar la orilla en estado de desorientación y dio la alerta a pobladores y autoridades. De inmediato, destacamentos del <strong>Distrito Naval Caribe</strong> de la <strong>Fuerza Naval del Ejército de Nicaragua</strong>, junto a pescadores artesanales y comunitarios, activaron las tareas de búsqueda y salvamento.</p><p>El menor de tres años fue localizado con vida tras varias horas expuesto a los elementos y fue puesto bajo resguardo de servicios médicos. Las tripulaciones militares recuperaron los restos de las dos fallecidas y los entregaron a sus familias para traslado a sus comunidades de origen y sepelio.</p><p>Peritos de las capitanías de puerto iniciaron indagaciones sobre la estructura de la panga para evaluar factores de carga y determinar si las condiciones meteorológicas adversas o la falta de implementos de flotación influyeron en el desenlace.</p><p>Pie de Foto: Embarcación artesanal amarrada en inmediaciones de comunidad costera de la región autónoma, Puerto Cabezas, Caribe Norte. Foto: Cortesía.</p>`
  },
  {
    buscar: ['detenidos', 'fallecimiento', 'cirugía', 'jennyfer', 'bethesda'],
    titulo: 'Médico y dos personas detenidos por fallecimiento tras cirugía',
    cat: 'Sucesos', dep: 'Managua', dateline: 'MANAGUA',
    slug: 'medico-profesionales-detenidos-muerte-joven-cirugia-estetica-managua',
    html: `<h2>Hechos principales</h2><p>Cuatro profesionales del sector salud fueron detenidos por la <strong>Policía Nacional</strong> debido a su presunta responsabilidad en el deceso de <strong>Jennyfer Elizabeth Reyes Castro</strong> (24), quien falleció por complicaciones clínicas severas tras una intervención quirúrgica estética en un centro privado de <strong>Ciudad Sandino</strong>, <strong>Managua</strong>.</p><p>La víctima, originaria de <strong>Matagalpa</strong>, se realizó un procedimiento de lipoescápula y lipotransferencia glútea el pasado 22 de mayo. Los informes de investigación penal detallan que el equipo médico fue capturado bajo los principios de legalidad para iniciar diligencias judiciales.</p><h2>Declaraciones de fuentes</h2><blockquote><p>«A este momento ya han sido capturados todos los involucrados, prosiguiéndose con las diligencias investigativas bajo los principios de objetividad y respeto al debido proceso», detalló el comunicado conjunto de la <strong>Fiscalía General de la República</strong> y la <strong>Policía Nacional</strong>.</p></blockquote><blockquote><p>«Las auditorías e inspecciones de los registros sanitarios confirman que el médico general a cargo carece de la acreditación de especialidad requerida para ejecutar cirugías plásticas o reconstructivas en el territorio nacional», señalaron fuentes ligadas a la regulación del <strong>Ministerio de Salud</strong>.</p></blockquote><h2>Desarrollo</h2><p>Los reportes médicos consignados en la epicrisis especifican que la paciente fue dada de alta pocas horas después de la cirugía; sin embargo, en su residencia comenzó a manifestar dolores agudos en la zona dorsal, deficiencias respiratorias y alteraciones visuales. Ante el deterioro, fue trasladada de urgencia al <strong>Hospital Regional de Matagalpa</strong>, donde los médicos diagnosticaron neumotórax, hemotórax, sepsis generalizada y embolia grasa pulmonar.</p><p>A pesar de permanecer ingresada bajo ventilación mecánica en la unidad de cuidados intensivos, la ciudadana falleció la noche del miércoles 27 de mayo sin recuperar el estado de conciencia. Los detenidos fueron identificados como el médico general <strong>Livang Clifford Argüello Molina</strong>, asistente; la cirujana plástica <strong>Karla Ramos</strong>; el cirujano general <strong>Fidel Ernesto Guzmán Sevilla</strong>; y la anestesióloga <strong>Katherine Orozco</strong>.</p><p>Las indagaciones adquirieron mayor relevancia al verificarse que <strong>Argüello Molina</strong> había recibido una condena de dos años de prisión el 19 de mayo, dictada por el <strong>Juzgado Segundo Local Penal de Managua</strong>, debido a un caso previo de lesiones graves imprudentes por mala praxis en una operación de lipopapada de 2024. Los informes confirmaron que el galeno poseía una inhabilitación activa para el ejercicio de la profesión al momento de intervenir a <strong>Reyes Castro</strong>.</p><p>El cónyuge de la víctima, <strong>Kevin Molinares</strong>, formalizó la denuncia ante las oficinas de auxilio judicial bajo el expediente <strong>DLP-0185-2026-00337651</strong>. Los restos de la joven fueron trasladados a su ciudad natal, donde se efectuaron las honras fúnebres y el sepelio tras una misa de cuerpo presente en la <strong>Catedral de Matagalpa</strong>.</p><p>Pie de Foto: Instalaciones de complejo de atención médica sujeto a peritajes judiciales y auditorías clínicas, Managua. Foto: Cortesía.</p>`
  },
  {
    buscar: ['fallecen en el extranjero', 'costa rica', 'estados unidos', 'indianápolis'],
    titulo: 'Dos nicaragüenses fallecen en el extranjero: Costa Rica y EE.UU.',
    cat: 'Sucesos', dep: 'Internacional', dateline: 'MANAGUA',
    slug: 'dos-nicaraguenses-fallecen-incidentes-estados-unidos-costa-rica',
    html: `<h2>Hechos principales</h2><p>Dos ciudadanos de nacionalidad nicaragüense perdieron la vida de forma independiente durante mayo en el extranjero: tras el colapso de una mina artesanal en la provincia de <strong>Guanacaste, Costa Rica</strong>, y el hallazgo de un cuerpo en un complejo de apartamentos en <strong>Indianápolis, Estados Unidos</strong>, según fuentes consulares y reportes de prensa internacional.</p><p>Las fatalidades afectaron a migrantes originarios de <strong>Chontales</strong> y <strong>Matagalpa</strong>, quienes se desempeñaban en labores de extracción y construcción. Los núcleos familiares iniciaron coordinaciones para gestionar fondos y trámites de repatriación.</p><h2>Declaraciones de fuentes</h2><blockquote><p>«El operario realizaba labores de extracción en niveles subterráneos cuando una parte de la estructura cedió de forma súbita, dejándolo atrapado bajo los escombros de la galería», indicaron cuerpos de socorro de Costa Rica.</p></blockquote><blockquote><p>«Las autoridades médicas locales aún no han remitido los informes oficiales de la autopsia, pero existen antecedentes clínicos de afecciones crónicas de hipertensión en el paciente», explicaron familiares del ciudadano hallado en Indiana.</p></blockquote><h2>Desarrollo</h2><p>El primer suceso se documentó el 28 de mayo en el sector de <strong>Las Juntas de Abangares</strong>, provincia de <strong>Guanacaste</strong>, Costa Rica. La víctima fue identificada como <strong>Santo Argelio Álvarez Espinoza</strong> (38), originario de la comarca <strong>Suwana Palmira</strong>, municipio de <strong>Santo Domingo</strong>, <strong>Chontales</strong>. Se encontraba ejecutando labores de minería artesanal junto a otros dos obreros cuando la masa de tierra provocó el derrumbe de las paredes internas de la excavación.</p><p>A pesar de que los compañeros fueron rescatados con vida, <strong>Álvarez Espinoza</strong> fue localizado sin signos vitales. Especialistas del <strong>Organismo de Investigación Judicial</strong> de Costa Rica procedieron al levantamiento del cuerpo, enfrentando dificultades operativas por la inestabilidad de los terrenos y el riesgo de emanaciones gaseosas.</p><p>El segundo caso correspondió al hallazgo sin vida de <strong>Lesther José Rivera Mendoza</strong> (38), originario de <strong>Río Blanco</strong>, <strong>Matagalpa</strong>. Su cuerpo fue encontrado el miércoles 20 de mayo en el interior del inmueble que arrendaba en <strong>Indianápolis, Indiana</strong>. Sus parientes sospechan que el deceso ocurrió desde el lunes 18 de mayo debido a la interrupción súbita en las comunicaciones telefónicas.</p><p>La familia de <strong>Rivera Mendoza</strong>, quien laboraba en albañilería, detalló que presentaba antecedentes de salud complejos y había completado una ruta migratoria que incluyó un secuestro en territorio mexicano antes de ingresar a Estados Unidos. Sus allegados promovieron campañas de recaudación civil para cubrir los costos logísticos de traslado, estimados en aproximadamente 11,000 dólares.</p><p>Pie de Foto: Complejo aduanero e instalaciones terminales para recepción de cargas y vuelos de repatriación en territorio nacional, Nicaragua. Foto: Cortesía.</p>`
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
