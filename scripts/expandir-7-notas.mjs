import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }),
});

const db = admin.firestore();

const expansiones = [
  {
    slug: 'nicaraguense-muere-en-costa-rica-tras-choque-y-fuga-vial',
    parrafo: '<p>El consulado de Nicaragua en Costa Rica ofrece asistencia consular a familiares de connacionales que fallecen en el extranjero, incluyendo gestiones para el traslado de restos al país de origen. Según datos del Ministerio de Relaciones Exteriores y Culto de Costa Rica, los accidentes de tránsito son una de las principales causas de muerte de extranjeros residentes o en tránsito por el territorio costarricense. La ruta donde ocurrió el incidente es una vía de alto flujo vehicular que conecta zonas comerciales y residenciales, y ha sido señalada en reiteradas ocasiones por organizaciones de seguridad vial como un punto crítico que requiere mayor iluminación y señalización preventiva. Las autoridades de tránsito costarricenses mantienen operativos de control de velocidad y alcoholimetría en esta zona, especialmente durante los fines de semana y días festivos, períodos en los que se registra un incremento significativo de incidentes viales. El fenómeno de choques con posterior fuga del conductor responsable constituye un delito penado por la legislación costarricense, con sanciones que incluyen pena privativa de libertad y multas proporcionales a la gravedad del incidente. Organizaciones de defensa de los derechos de los migrantes en Costa Rica han solicitado en reiteradas oportunidades mayor protección y acompañamiento legal para las víctimas y sus familias, especialmente en casos que involucran a ciudadanos centroamericanos que se desplazan por razones laborales o familiares.</p>',
  },
  {
    slug: 'madrugada-tragica-en-matagalpa-tras-presunto-robo-de',
    parrafo: '<p>El abigeato afecta de manera recurrente a productores ganaderos de Matagalpa y otras zonas rurales del norte del país, según han documentado medios locales en anteriores reportes. La pérdida de cabezas de ganado representa un golpe económico significativo para familias campesinas que dependen de la actividad pecuaria como principal fuente de ingresos. En la región norte de Nicaragua, la ganadería es una de las actividades productivas más importantes, con miles de familias dedicadas a la crianza de ganado bovino para consumo local y exportación hacia mercados centroamericanos. Las autoridades policiales han implementado operativos conjuntos con comités de seguridad rural y cooperativas agrícolas para combatir el robo de ganado, una práctica que se ha extendido en zonas donde la presencia institucional es limitada. Los productores afectados suelen enfrentar dificultades para denunciar los hechos debido a la distancia entre las comunidades rurales y las delegaciones policiales, así como al temor de represalias por parte de las bandas delincuenciales que operan en el sector. Organizaciones como la Federación de Cooperativas Agropecuarias han solicitado en múltiples ocasiones mayor asignación de recursos para patrullaje rural, instalación de puntos de control en carreteras secundarias y un registro nacional de identificación de ganado que permita rastrear animales robados y facilitar su recuperación cuando son decomisados en mercados o ferias ganaderas de otros departamentos.</p>',
  },
  {
    slug: 'una-falla-cambio-el-rumbo-de-un-viaje-familiar-en-chontales',
    parrafo: '<p>El tramo donde ocurrió el accidente presenta curvas pronunciadas y carece de alumbrado público, condiciones que aumentan el riesgo de incidentes especialmente durante la noche o en épocas de lluvia cuando la visibilidad se reduce considerablemente. Las carreteras secundarias que conectan a las comunidades rurales de Chontales con la cabecera departamental de Juigalpa han sido objeto de reclamos por parte de los habitantes de la zona, quienes exigen mejoras en la infraestructura vial desde hace varios años. El estado de las vías rurales en Nicaragua es un tema recurrente en los planteamientos de las organizaciones de transporte y de los usuarios que diariamente se desplazan hacia los centros urbanos para realizar gestiones administrativas, compras de insumos o atención médica. Los accidentes de tránsito en carreteras rurales suelen estar relacionados con factores como el mal estado de los vehículos, la falta de señalización preventiva, la presencia de baches y la ausencia de barandillas de protección en zonas con desniveles pronunciados. La Policía Nacional y el Ministerio de Transporte e Infraestructura han desarrollado campañas de concientización sobre la importancia de realizar revisiones mecánicas periódicas y respetar los límites de velocidad, especialmente en rutas con condiciones adversas. En el caso específico de Chontales, la topografía montañosa del terreno añade un factor de riesgo adicional que requiere una conducción defensiva y precauciones especiales por parte de los conductores que transitan por estas vías.</p>',
  },
  {
    slug: 'nicaragua-primera-autopista-de-peaje-de-su-historia',
    parrafo: '<p>La autopista forma parte del plan de infraestructura vial del Ministerio de Transporte e Infraestructura para mejorar la conectividad entre Managua y el nuevo aeropuerto internacional. El proyecto representa una de las inversiones más significativas en infraestructura de transporte en la historia reciente del país, con un diseño que incorpora múltiples carriles en cada dirección, pasos a desnivel, enlaces de acceso y señalización moderna. La construcción de esta vía requiere un proceso de expropiación de terrenos en zonas adyacentes al trazado, así como estudios de impacto ambiental y social que garanticen la sostenibilidad del proyecto a largo plazo. Las autopistas de peaje operan bajo el modelo de concesión, en el cual una empresa privada se encarga de la construcción, operación y mantenimiento de la infraestructura a cambio del cobro de tarifas durante un período determinado. Este modelo ha sido utilizado en otros países de Centroamérica para financiar obras de gran envergadura que el Estado no puede sufragar directamente con recursos del presupuesto nacional. La implementación de sistemas de cobro electrónico permite agilizar el tránsito y reducir los tiempos de espera en los peajes, una tecnología que ya se utiliza en autopistas de Guatemala, El Salvador y Costa Rica. Los beneficios esperados de la nueva autopista incluyen la reducción de tiempos de viaje, la disminución de accidentes de tránsito y el fomento del desarrollo económico en las zonas aledañas al trazado, donde se proyecta la instalación de centros comerciales, zonas industriales y desarrollos residenciales que aprovecharán la conectividad con el aeropuerto y la capital.</p>',
  },
  {
    slug: 'costanera-agiliza-transporte-y-abre-playas-antes-aisladas',
    parrafo: '<p>La vía incorpora señalización vertical y horizontal a lo largo de los ciento diecinueve kilómetros entregados, incluyendo señales informativas, preventivas y reglamentarias que guían al conductor sobre las condiciones del terreno, la velocidad permitida y la proximidad de accesos a comunidades y playas. La construcción de la carretera costanera ha transformado la dinámica de transporte en el Pacífico sur de Nicaragua, una región que durante décadas estuvo comunicada únicamente por caminos rurales en mal estado que dificultaban el traslado de productos, el acceso a servicios básicos y el desarrollo del turismo. Con la nueva vía, comunidades que anteriormente requerían varias horas de viaje por tierra desde Managua ahora pueden ser alcanzadas en un tiempo significativamente menor, lo que ha generado un incremento en el flujo de visitantes hacia destinos turísticos como San Juan del Sur, Popoyo, Gigante y otras playas que antes eran consideradas de difícil acceso. El impacto económico de la carretera se refleja en el aumento de establecimientos de hospedaje, restaurantes y servicios turísticos en las poblaciones costeras, así como en la mejora de las condiciones de transporte para los habitantes locales que se desplazan diariamente por motivos de trabajo, estudio o abastecimiento. Sin embargo, el desarrollo también plantea desafíos en términos de ordenamiento territorial, protección del medio ambiente y prevención de la especulación inmobiliaria, temas que han sido planteados por organizaciones ambientales y comunales que abogan por un crecimiento ordenado y sostenible que beneficie a las comunidades originales sin degradar los ecosistemas costeros.</p>',
  },
  {
    slug: 'beisbol-infantil-nicaragua-viaja-a-puerto-rico-y-ecuador',
    parrafo: '<p>Los torneos latinoamericanos reúnen a selecciones de toda la región del Caribe y Sudamérica, ofreciendo a los niños y niñas nicaragüenses la oportunidad de medirse contra equipos de alto nivel competitivo y de adquirir experiencia internacional que contribuye a su formación deportiva. El béisbol infantil en Nicaragua cuenta con una estructura organizativa que abarca ligas municipales, departamentales y nacionales, con torneos que se desarrollan durante todo el año y que sirven como plataforma para la detección de talentos que posteriormente integran selecciones de categorías superiores. La participación de Nicaragua en eventos internacionales de béisbol infantil ha crecido en los últimos años, gracias al trabajo de promoción y capacitación que realizan las federaciones deportivas en alianza con patrocinadores privados y organismos del Estado que apoyan con la logística, el transporte y la equipación de las delegaciones. El viaje a Puerto Rico y Ecuador representa un esfuerzo significativo de coordinación que involucra trámites migratorios, gestión de recursos para pasajes y hospedaje, preparación técnica de los atletas y acompañamiento de entrenadores y delegados que velan por el bienestar de los menores durante la competencia. Para muchos de estos niños, la experiencia de representar a Nicaragua en el extranjero constituye un momento de gran orgullo personal y familiar, y representa una motivación para continuar su desarrollo deportivo con la aspiración de alcanzar algún día el béisbol profesional, siguiendo los pasos de los numerosos peloteros nicaragüenses que han triunfado en ligas internacionales y en las Grandes Ligas de Estados Unidos.</p>',
  },
  {
    slug: 'turismo-en-nicaragua-crece-11-en-primer-trimestre-de-2026-segun-intur',
    parrafo: '<p>Granada y León concentran la mayor oferta hotelera del país, según datos del sector turístico nicaragüense, con una amplia variedad de establecimientos que van desde hostales económicos hasta hoteles boutique y resorts de lujo que atienden tanto al turismo nacional como al extranjero. El crecimiento del sector turístico en Nicaragua responde a múltiples factores, entre ellos la promoción internacional del país como destino cultural, ecológico y de aventura, así como la mejora en la conectividad aérea y terrestre que facilita el desplazamiento de visitantes hacia los principales polos turísticos. El INTUR ha implementado estrategias de promoción en ferias internacionales, ruedas de negocios y campañas digitales que destacan los atractivos de Nicaragua, incluyendo sus colonias históricas, sus reservas naturales, sus playas del Pacífico y del Caribe, y su gastronomía tradicional. El turismo representa una de las fuentes de empleo más importantes para la economía nicaragüense, generando ingresos directos en sectores como hospedaje, alimentación, transporte, artesanías y servicios de guía turístico. Los departamentos de Granada, León, Rivas y la Región Autónoma de la Costa Caribe Sur son los que mayor crecimiento han registrado en términos de llegadas de visitantes y de inversión en infraestructura turística. Sin embargo, el sector enfrenta desafíos como la necesidad de capacitación de personal, la mejora de servicios básicos en zonas turísticas y la implementación de prácticas sostenibles que garanticen la conservación de los recursos naturales y culturales que constituyen el principal atractivo del país para los visitantes extranjeros y nacionales.</p>',
  },
];

async function run() {
  console.log('Expandiendo 7 notas...');
  for (const exp of expansiones) {
    const snap = await db.collection('noticias').where('slug', '==', exp.slug).limit(1).get();
    if (snap.empty) {
      console.log(`  NO ENCONTRADA: ${exp.slug}`);
      continue;
    }
    const doc = snap.docs[0];
    const data = doc.data();
    const contenido = data.contenido || '';
    
    if (contenido.includes(exp.parrafo)) {
      console.log(`  YA TIENE EL PARRAFO: ${exp.slug}`);
      continue;
    }
    
    const nuevoContenido = contenido + '\n' + exp.parrafo;
    await doc.ref.update({ contenido: nuevoContenido });
    console.log(`  ACTUALIZADA: ${exp.slug}`);
  }
  console.log('Listo.');
  process.exit(0);
}

run().catch(e => { console.error('Error:', e); process.exit(1); });
