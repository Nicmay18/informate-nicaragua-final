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

function meta(c) {
  const tx = c.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const or = tx.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
  let m = or.slice(0, 2).join(' '); if (m.length < 150) m += ` Noticias Nicaragua.`; if (m.length > 170) m = m.slice(0, 167) + '...';
  return m;
}

const ACTUALIZAR = [
  {
    id: 'HkJY4CFD6FMDxksE4Zxf',
    titulo: 'Repatrían cuerpo de nicaragüense fallecido en Estados Unidos',
    cat: 'Sucesos', dep: 'Internacional', dateline: 'MANAGUA',
    slug: 'repatrian-cuerpo-nicaraguense-fallecido-estados-unidos',
    html: `<h2>Hechos principales</h2><p>La familia del joven <strong>Nelson Enrique Hernández</strong> (27), originario de <strong>Nueva Guinea</strong>, <strong>Caribe Sur de Nicaragua</strong>, gestiona la repatriación de sus restos desde <strong>Milwaukee, Wisconsin</strong>, Estados Unidos, donde falleció el pasado 8 de marzo. El cuerpo permanece en la morgue de un hospital local a la espera de trámites.</p><p>La <strong>ONG Texas Nicaraguan Community (TNC)</strong> brinda asistencia a familiares de migrantes fallecidos en el exterior. La organización cifra en más de <strong>1,000</strong> los nicaragüenses fallecidos en Estados Unidos entre 2019 e inicios de este año.</p><h2>Desarrollo</h2><p><strong>Hernández</strong> fue encontrado sin vida en el apartamento que compartía en <strong>Milwaukee</strong>. Las causas del deceso están bajo investigación por las autoridades locales. Su familia inició campañas de recaudación para cubrir los costos de repatriación, estimados en miles de dólares.</p><p>El proceso de repatriación involucra trámites entre funerarias de ambos países, certificados de defunción, embalsamamiento y autorizaciones aduaneras. Muchas familias recurren a plataformas digitales para financiar estos gastos.</p><p>La directora ejecutiva de <strong>TNC</strong> sugirió a las familias valorar la opción de repatriar cenizas cuando el cuerpo no amerite traslado completo por costos. Las autoridades consulares de Nicaragua coordinan la documentación requerida.</p><p>Pie de Foto: Terminal aérea con operaciones de carga internacional, Managua. Foto: Cortesía.</p>`
  },
  {
    id: 'ZTVWiR99Nppa5L2P4wT1',
    titulo: 'Incendio destruye negocio en Mercado Oriental de Managua',
    cat: 'Sucesos', dep: 'Managua', dateline: 'MANAGUA',
    slug: 'incendio-destuye-negocio-mercado-oriental-managua',
    html: `<h2>Hechos principales</h2><p>Un incendio de gran magnitud consumió la tienda <strong>"Emanuel"</strong>, ubicada en el sector de <strong>Ropa-Usame</strong> del <strong>Mercado Oriental</strong> de <strong>Managua</strong>. El siniestro se desató alrededor de las 14:30 horas del jueves, reduciendo a escombros el establecimiento y su mercadería.</p><p>El fuego se propagó rápidamente por la alta concentración de materiales inflamables y fue controlado tras más de cuatro horas de trabajo conjunto entre <strong>Bomberos Unidos</strong>, <strong>Policía Nacional</strong> y personal de la <strong>Alcaldía de Managua</strong>.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"Nos quedamos sin nada. El fuego avanzó muy rápido por la tela y el plástico. No pudimos salvar la mercadería", relató el propietario del negocio afectado.</p></blockquote><blockquote><p>"Las unidades de bomberos trabajaron en coordinación con la Policía para evacuar a los comerciantes vecinos y evitar que el fuego se extendiera a otros tramos", detallaron fuentes oficiales.</p></blockquote><h2>Desarrollo</h2><p>El incendio afectó al menos seis tramos del sector de los mariscos del mercado, ubicado de la iglesia <strong>El Calvario</strong> tres cuadras al sur. Comerciantes aledaños reportaron pérdidas parciales por humo y agua.</p><p>Este fuego fue descrito como uno de los más devastadores del año en el mercado. Las autoridades evalúan las estructuras dañadas y coordinan el despeje de escombros para evitar riesgos adicionales.</p><p>El <strong>Mercado Oriental</strong> es uno de los centros de comercio más importantes de Centroamérica, pero históricamente ha enfrentado problemas de deterioro estructural y precariedad que lo convierten en un núcleo de vulnerabilidad. El gobierno anunció la construcción del <strong>Nuevo Mercado Oriental</strong> a 300 metros del actual.</p><p>Pie de Foto: Efectos del incendio en el sector Ropa-Usame del Mercado Oriental, Managua. Foto: Cortesía.</p>`
  },
  {
    id: 'c95BYHepil5Vdf9bOUGZ',
    titulo: 'Carlos Vives y Maluma destacan en gala de música latina',
    cat: 'Entretenimiento', dep: 'Internacional', dateline: 'MIAMI',
    slug: 'carlos-vives-maluma-destacan-gala-musica-latina',
    html: `<h2>Hechos principales</h2><p>El cantautor colombiano <strong>Carlos Vives</strong> fue honrado como <strong>Persona del Año 2024</strong> por la <strong>Academia Latina de la Grabación</strong> en reconocimiento a su trayectoria y contribución a la música latina. La gala se realizó en <strong>Miami, Florida</strong>, en el marco de la semana de los <strong>Latin Grammy</strong>.</p><p>Por su parte, el artista paisa <strong>Maluma</strong> participó como presentador en la ceremonia principal de premiación, compartiendo escenario con <strong>Roselyn Sánchez</strong> y consolidando su presencia como uno de los referentes de la música urbana latina.</p><h2>Desarrollo</h2><p>El reconocimiento a <strong>Vives</strong> incluyó un concierto homenaje en el que participaron colegas y amigos de la industria. El colombiano, conocido por fusionar vallenato con pop rock, ha vendido millones de discos a lo largo de más de tres décadas de carrera.</p><p><strong>Maluma</strong>, nominado en categorías de interpretación urbana, presentó los premios a Mejor Álbum de Música Urbana y Mejor Canción Urbana. El artista de Medellín destacó la importancia de la unión entre generaciones en la música latina.</p><p>La ceremonia de los <strong>Latin Grammy 2024</strong> celebró su 25 aniversario con presentaciones de <strong>Karol G, Shakira, Fonseca, Morat y Monsieur Periné</strong>, entre otros. Colombia tuvo una fuerte presencia en las nominaciones y galardones.</p><p>Pie de Foto: Carlos Vives y Maluma en ceremonia de los Latin Grammy, Miami. Foto: EFE.</p>`
  },
  {
    id: 'cW59E7JhZd9PT6Epx2aJ',
    titulo: 'Shakira reúne a más de dos millones de fans en concierto en Brasil',
    cat: 'Entretenimiento', dep: 'Internacional', dateline: 'RÍO DE JANEIRO',
    slug: 'shakira-reune-dos-millones-fans-concierto-brasil',
    html: `<h2>Hechos principales</h2><p>La colombiana <strong>Shakira</strong> reunió a más de dos millones de personas en la playa de <strong>Copacabana, Río de Janeiro</strong>, durante un concierto gratuito que marcó un hito en su gira <strong>"Las mujeres ya no lloran"</strong>. El espectáculo formó parte del proyecto <strong>Todo Mundo no Rio</strong>, que anteriormente promovió shows de <strong>Madonna</strong> y <strong>Lady Gaga</strong>.</p><p>La presentación inició con un espectáculo de drones que dibujaron una loba en el cielo carioca, animal símbolo de la artista. La mega producción incluyó pirotecnia, bailarines y artistas invitados.</p><h2>Desarrollo</h2><p>En el escenario, <strong>Shakira</strong> compartió micrófono con <strong>Anitta</strong> para interpretar <em>"Choka choka"</em>, y con <strong>Ivete Sangalo</strong> para <em>"Um país tropical"</em>. También se unieron <strong>Caetano Veloso</strong> y <strong>Maria Bethânia</strong>, figuras emblemáticas de la música popular brasileña.</p><p>El concierto generó un impacto económico estimado en <strong>777 millones de reales</strong> (aproximadamente 155 millones de dólares) para la ciudad, según estudio de la alcaldía y <strong>Riotur</strong>, gracias al flujo de turistas y consumo en hoteles, restaurantes y comercios.</p><p>La gira <strong>"Las mujeres ya no lloran"</strong>, inaugurada en febrero anterior, ya se había coronado como la de mayor facturación de un artista latino según <strong>Guinness</strong>. Este recital en <strong>Copacabana</strong> consolidó el récord como uno de los conciertos más multitudinarios de la historia de Brasil.</p><p>Pie de Foto: Shakira en concierto masivo en playa Copacabana, Río de Janeiro. Foto: EFE.</p>`
  },
  {
    id: 'd9DsarvHBnNcRzfXiwAy',
    titulo: 'Berman Espinoza rompe récord histórico de ponches en béisbol nicaragüense',
    cat: 'Deportes', dep: 'Matagalpa', dateline: 'MATAGALPA',
    slug: 'berman-espinoza-rompe-record-historico-ponches-beisbol-nicaragua',
    html: `<h2>Hechos principales</h2><p>El lanzador <strong>Berman Espinoza</strong> se convirtió en el máximo ponchador de la historia del béisbol nicaragüense al registrar su ponche número <strong>1,450</strong> con el equipo de <strong>Matagalpa</strong>, superando la marca de <strong>1,449</strong> que <strong>Julio Espinoza</strong> mantenía desde 1989.</p><p>El histórico out se produjo en el <strong>Estadio Chale Solís</strong> de <strong>Matagalpa</strong> durante un encuentro ante <strong>Zelaya Central</strong>. El pitcher había estado a cinco triunfos de los 100 en su carrera previo a esta hazaña.</p><h2>Desarrollo</h2><p>Con 33 años de edad y 18 temporadas desde su debut en 2005, <strong>Berman Espinoza</strong> acumuló un total de <strong>1,383</strong> ponches antes de esta temporada, ocupando el segundo lugar histórico detrás de <strong>Julio Espinoza</strong>. El matagalpino debutó en primera división con el equipo de su ciudad natal.</p><p>La afición matagalpina celebró el logro con ovaciones y fuegos artificiales al concluir el encuentro. Directivos de la <strong>Liga Nicaragüense de Béisbol Profesional</strong> le entregaron una placa conmemorativa en ceremonia previa al juego siguiente.</p><p>El récord de <strong>Julio Espinoza</strong>, establecido en 1989, perduró durante más de tres décadas como uno de los registros más difíciles de alcanzar en el béisbol local. <strong>Berman</strong> lo superó en su temporada número 18, consolidándose como el nuevo <strong>"Rey del Ponche"</strong> del país.</p><p>Pie de Foto: Berman Espinoza en el montículo del Estadio Chale Solís, Matagalpa. Foto: Cortesía.</p>`
  },
  {
    id: 'erUOMi1fsv5GmP1bfFwu',
    titulo: 'Motociclista fallece tras colisión en carretera Jinotega',
    cat: 'Sucesos', dep: 'Jinotega', dateline: 'JINOTEGA',
    slug: 'motociclista-fallece-collision-carretera-jinotega',
    html: `<h2>Hechos principales</h2><p>El ciudadano <strong>Luis Enrique Pérez Hernández</strong> (48) perdió la vida de manera instantánea al impactar su motocicleta contra una camioneta marca <strong>Toyota Hilux</strong> color roja, con placas <strong>JI-13210</strong>, conducida por <strong>Denis Ramón Siles Altamirano</strong>. El accidente ocurrió la mañana del sábado en la comunidad de <strong>El S</strong>, carretera de <strong>Jinotega</strong>.</p><p>Brigadas de emergencia acudieron al lugar para certificar el deceso y coordinar las diligencias correspondientes. La zona presentaba condiciones de alta circulación en el momento del impacto.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"El motociclista circulaba a excesiva velocidad cuando perdió el control en una curva y colisionó de frente contra la camioneta que venía en sentido contrario", indicaron testigos del suceso.</p></blockquote><blockquote><p>"Las unidades de socorro confirmaron el fallecimiento en el acto. Se realizó el levantamiento del cuerpo y se remitió al Instituto de Medicina Legal para la autopsia de rigor", detallaron fuentes policiales.</p></blockquote><h2>Desarrollo</h2><p>Los informes preliminares de la <strong>Policía Nacional</strong> señalan que <strong>Pérez Hernández</strong> no portaba casco de protección en el momento del impacto. La camioneta presentó daños en la parte frontal derecha, mientras que la motocicleta quedó destrozada a un costado de la vía.</p><p>Agentes de tránsito realizaron las pruebas correspondientes al conductor de la camioneta para descartar presencia de alcohol. Se ordenó el traslado del cuerpo a las instalaciones del <strong>Instituto de Medicina Legal</strong> de <strong>Jinotega</strong> para determinar las causas exactas del deceso.</p><p>Familiares de la víctima llegaron al lugar minutos después de ocurrido el hecho y fueron canalizados hacia las oficinas de auxilio judicial para iniciar los trámites correspondientes. El vehículo involucrado fue remitido al depósito municipal mientras concluyen las investigaciones.</p><p>Pie de Foto: Sector de la carretera Jinotega donde se registró el accidente fatal. Foto: Cortesía.</p>`
  },
  {
    id: 'lJv8InQKCuFu1Iu0oNRJ',
    titulo: 'Joven desaparece en laguna de Xiloá mientras nadaba con amigos',
    cat: 'Sucesos', dep: 'Managua', dateline: 'MANAGUA',
    slug: 'joven-desaparece-laguna-xiloa-nadando-amigos',
    html: `<h2>Hechos principales</h2><p>Un joven albañil desapareció en las profundas aguas de la <strong>laguna de Xiloá</strong> mientras realizaba un entrenamiento de natación en compañía de amigos. El suceso ocurrió en horas de la tarde del sábado, movilizando a brigadas de buzos y socorristas de la <strong>Cruz Blanca</strong>.</p><p>La víctima, mayor de sus hermanos, reside junto a su familia en la parte trasera de los antiguos juzgados de <strong>Managua</strong>. Sus compañeros fueron interrogados en la estación policial número 1 para establecer las circunstancias exactas del hecho.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"El joven se adentró en la laguna para cruzar de orilla a orilla como parte de su entrenamiento. Sus amigos lo perdieron de vista cuando faltaba aproximadamente un tercio del recorrido", explicaron familiares en el sitio de búsqueda.</p></blockquote><blockquote><p>"Los buzos de la Cruz Blanca han ampliado el perímetro de búsqueda debido a la profundidad del cuerpo de agua y las corrientes subacuáticas. Mantenemos la esperanza de localizarlo en las próximas horas", señalaron técnicos de rescate.</p></blockquote><h2>Desarrollo</h2><p>Efectivos de la <strong>Policía Nacional</strong> y rescatistas de la <strong>Cruz Blanca</strong> desplegaron un operativo de búsqueda en la laguna desde el momento en que se reportó la desaparición. Se utilizaron embarcaciones ligeras y equipos de sonar para rastrear la zona.</p><p>La <strong>laguna de Xiloá</strong>, ubicada en el <strong>Volcán de Managua</strong>, tiene una profundidad considerable y corrientes que dificultan las labores de rescate. En años anteriores se han registrado decesos similares en este mismo cuerpo de agua.</p><p>Los familiares aguardan en las orillas de la laguna a la espera de resultados. Las autoridades han dispuesto el cierre temporal de la zona para bañistas mientras continúan las maniobras de búsqueda.</p><p>Pie de Foto: Vista panorámica de la laguna de Xiloá, Managua. Foto: Cortesía.</p>`
  }
];

async function main() {
  const db = initFirebase();
  for (const n of ACTUALIZAR) {
    const ref = db.collection('noticias').doc(n.id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`⚠️ NO EXISTE: ${n.id}`);
      continue;
    }
    const contenido = n.html.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
    const resumen = meta(contenido);
    await ref.update({
      titulo: n.titulo,
      contenido,
      categoria: n.cat,
      departamento: n.dep,
      dateline: n.dateline,
      resumen,
      slug: n.slug,
      autor: 'Keyling Elieth Rivera Muñoz',
      fechaActualizacion: FieldValue.serverTimestamp(),
      estado: 'publicado'
    });
    console.log(`✅ ACTUALIZADA POR ID: ${n.titulo}`);
  }
  console.log('\n=== LISTO ===');
  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
