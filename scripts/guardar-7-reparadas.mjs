#!/usr/bin/env node
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('g:\\\\RESPALDO\\\\informate-nicaragua-final\\\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json', 'utf8'));
initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore();

// Artículo 1: Incautan cocaína
const a1 = {
  id: 'Vd53UqkuV45BIcRs4Miu',
  titulo: 'Policía y Ejército incautan 502 kilos de cocaína en Wiwilí, Jinotega',
  resumen: 'Dos personas fueron capturadas durante el operativo en el norte de Nicaragua. Las autoridades mantienen bajo custodia el cargamento y los vehículos utilizados para el traslado.',
  contenido: `<p>La Policía Nacional de Nicaragua y el Ejército de Nicaragua incautaron 502 kilos de cocaína en Wiwilí, Jinotega, durante un operativo en el que fueron capturadas dos personas vinculadas al traslado del cargamento ilícito en esa zona del norte del país.</p>

<p>Wiwilí, en el departamento de Jinotega, se ubica en el norte de Nicaragua. Este municipio forma parte de un territorio con presencia de rutas terrestres utilizadas para el tránsito hacia zonas fronterizas. Estas áreas suelen ser consideradas estratégicas por las autoridades en operaciones de control y vigilancia relacionadas con actividades de narcotráfico. La región norte del país ha sido históricamente un corredor de movilidad de mercancías y personas hacia Honduras.</p>

<h2>Coordinación institucional en el operativo</h2>

<p>Las instituciones encargadas del operativo trabajan de forma coordinada en diferentes puntos del país en tareas de seguridad, control territorial y combate al crimen organizado. La Policía Nacional de Nicaragua es la entidad responsable de la seguridad ciudadana, investigación de delitos y ejecución de operativos policiales. El Ejército de Nicaragua desarrolla funciones de defensa nacional y apoyo a la seguridad en coordinación con otras instituciones del Estado.</p>

<p>En el hecho reportado, las autoridades informaron la captura de dos personas identificadas como Darwin Alfredo Castellón Rodríguez y Jairo Josué Rodríguez. Los detenidos quedaron bajo resguardo de las autoridades competentes para el proceso judicial correspondiente por presuntos delitos vinculados al narcotráfico.</p>

<h2>Vehículos y cargamento bajo custodia</h2>

<p>También se indicó que los vehículos y el cargamento incautado quedaron bajo custodia policial como parte de los procedimientos establecidos en este tipo de operativos. Las investigaciones continúan con el objetivo de determinar la procedencia y el destino final del cargamento decomisado. Este tipo de decomisos suele requerir análisis de laboratorio para confirmar la pureza y el origen de la sustancia.</p>

<p>Las rutas utilizadas para el tráfico de drogas en la región norte de Nicaragua han sido objeto de vigilancia constante por parte de las autoridades. Estos operativos suelen desarrollarse en coordinación entre instituciones de seguridad, con presencia en zonas rurales y de difícil acceso. La zona montañosa de Jinotega presenta condiciones geográficas que dificultan el monitoreo permanente.</p>

<h2>Vigilancia en zonas fronterizas</h2>

<p>Las acciones de control incluyen patrullajes, retenes y seguimiento de información operativa en distintos puntos del territorio nacional. Las autoridades mantienen labores de monitoreo en áreas fronterizas debido a su condición de paso potencial para actividades ilícitas. La frontera norte de Nicaragua se extiende por varios kilómetros y cuenta con pasos oficiales y no oficiales.</p>

<p>En el caso de Jinotega, la ubicación geográfica y la conectividad con otras zonas del país la convierten en un punto de interés operativo para acciones de seguridad. Las intervenciones buscan reducir el movimiento de sustancias ilícitas y reforzar la presencia institucional en el territorio. Los operativos en zonas rurales suelen planificarse con anticipación y requieren logística específica.</p>

<p>Las investigaciones relacionadas con este caso permanecen en desarrollo. Las autoridades no han detallado información adicional sobre redes vinculadas o estructuras detrás del cargamento incautado. Tampoco se ha informado sobre si existen otras personas buscadas en relación con este decomiso.</p>

<p>Los procedimientos judiciales contra las dos personas capturadas seguirán su curso en los tribunales correspondientes. El Código Penal de Nicaragua contempla penas para delitos relacionados con tráfico de estupefacientes. Las autoridades no han precisado en qué fase procesal se encuentran los detenidos.</p>`
};

// Artículo 2: Hantavirus Canadá
const a2 = {
  id: 'NF9Q4ORwPOcsXKKRHuMa',
  titulo: 'Autoridades de Canadá confirman un caso de hantavirus vinculado a crucero MV Hondius',
  resumen: 'El paciente permanece bajo seguimiento médico en un hospital de Victoria, Columbia Británica. Las autoridades sanitarias no reportan transmisión comunitaria en el país.',
  contenido: `<p>Las autoridades sanitarias de Canadá confirmaron un caso de hantavirus en Columbia Británica. El paciente está relacionado con un brote detectado en el crucero MV Hondius.</p>

<p>El virus Andes es una variante poco común del hantavirus. Podría transmitirse entre personas en casos de contacto cercano y prolongado, aunque los especialistas señalan que esta forma de contagio es poco frecuente.</p>

<h2>Atención médica y seguimiento</h2>

<p>El paciente fue atendido en un hospital de Victoria, en la provincia de Columbia Británica. Permanece bajo seguimiento médico mientras las autoridades sanitarias monitorean su evolución.</p>

<p>Las autoridades no reportan transmisión comunitaria en Canadá. El riesgo para la población general es considerado bajo por los organismos de salud del país.</p>

<h2>Formas de transmisión del hantavirus</h2>

<p>El hantavirus se transmite por contacto con orina, saliva o excrementos de roedores infectados. Los síntomas iniciales incluyen fiebre, fatiga, dificultad respiratoria, mareos y cefalea.</p>

<p>En casos severos, la enfermedad puede causar síndrome pulmonar por hantavirus. Esta condición requiere cuidados intensivos y atención médica especializada. La cefalea y la fatiga muscular suelen aparecer en los primeros días posteriores a la exposición.</p>

<h2>Vigilancia epidemiológica</h2>

<p>Organismos internacionales de salud mantienen vigilancia sobre las personas expuestas durante el crucero MV Hondius. No se han reportado nuevos casos relacionados con este brote.</p>

<p>Las autoridades sanitarias recomiendan evitar el contacto con roedores y sus excretas. También sugieren sellar grietas y agujeros en viviendas para prevenir el ingreso de estos animales.</p>

<p>La ventilación de espacios cerrados antes de limpiar áreas con posible presencia de roedores es otra medida de prevención. El uso de guantes y mascarilla al manipular excrementos o materiales contaminados reduce el riesgo de infección.</p>

<h2>Síntomas y atención temprana</h2>

<p>Los síntomas del hantavirus pueden aparecer entre una y ocho semanas después de la exposición. La fiebre y la fatiga muscular suelen ser los primeros signos de alerta.</p>

<p>La dificultad respiratoria es un síntoma de gravedad que requiere atención médica inmediata. El diagnóstico temprano mejora el pronóstico de los pacientes afectados.</p>

<p>Las autoridades no han precisado el estado de salud actual del paciente hospitalizado en Victoria. Tampoco han informado sobre la duración estimada de su recuperación.</p>

<h2>Medidas de prevención</h2>

<p>El almacenamiento de alimentos en recipientes cerrados reduce la atracción de roedores hacia las viviendas. La eliminación de escombros y vegetación densa alrededor de las casas disminuye los lugares de anidación.</p>

<p>Las campañas de limpieza en áreas rurales y suburbanas suelen incluir recomendaciones sobre manejo seguro de excretas de roedores. Los trabajadores agrícolas y forestales tienen mayor exposición potencial a estos animales.</p>

<p>Las autoridades sanitarias de Canadá mantienen canales de comunicación abiertos para reportar casos sospechosos. La detección temprana permite iniciar tratamientos de soporte respiratorio antes de que la condición se agrave.</p>

<h2>Contexto del brote en el crucero</h2>

<p>El crucero MV Hondius es una embarcación utilizada para expediciones en zonas remotas. Los pasajeros y tripulantes expuestos fueron contactados por las autoridades para seguimiento epidemiológico.</p>

<p>No se han reportado casos adicionales entre las personas que viajaban en la embarcación. Las investigaciones continúan para determinar las circunstancias exactas de la exposición al virus.</p>

<h2>Recomendaciones para viajeros</h2>

<p>Las personas que realizan cruceros en zonas remotas deben informarse sobre brotes activos antes de abordar. Las autoridades recomiendan reportar cualquier síntoma respiratorio después de un viaje en embarcaciones con casos confirmados.</p>

<p>Los pasajeros del MV Hondius que no han desarrollado síntomas continúan bajo observación. El período de incubación del virus define el tiempo de seguimiento establecido por los protocolos sanitarios.</p>`
};

// Artículo 3: Turistas extranjeros
const a3 = {
  id: 'y251TlGDTa5BVIM18QGE',
  titulo: 'Turistas extranjeros comparten experiencias favorables sobre Nicaragua en plataformas digitales',
  resumen: 'Viajeros de diversas nacionalidades destacan las condiciones de seguridad y los precios competitivos del país. Las reseñas orgánicas dinamizan la proyección internacional de los destinos locales.',
  contenido: `<p>Viajeros de diversas nacionalidades promueven el potencial turístico de Nicaragua en plataformas digitales. Los visitantes extranjeros destacan las condiciones de seguridad ciudadana y la competitividad de precios actuales.</p>

<p>El incremento en la producción de reseñas digitales por parte de visitantes extranjeros dinamiza la proyección internacional de los destinos locales. Este flujo constante de datos compartidos de forma orgánica contribuye a actualizar la imagen del país en los mercados emisores de Norteamérica, Suramérica y Europa. Las versiones desactualizadas sobre la situación del entorno social nicaragüense son contrarrestadas por este nuevo cúmulo de información generada por viajeros.</p>

<h2>Contenido digital difundido sobre Nicaragua</h2>

<p>La difusión de material audiovisual en redes sociales permite evaluar la percepción externa sobre el territorio nacional de manera directa. En varios canales digitales se reporta que la seguridad y el bajo costo de vida representan ventajas competitivas reales para el país.</p>

<p>De acuerdo con el material difundido en plataformas de video, existen múltiples testimonios que señalan que hay mitos sobre Nicaragua difundidos en el extranjero. El país es descrito en dichos materiales como un destino seguro con costos accesibles para los viajeros. Los contenidos audiovisuales sobre el territorio nicaragüense acumulan miles de reproducciones por parte de usuarios internacionales interesados en conocer la infraestructura recreativa local.</p>

<p>En bitácoras de viaje digitales se documentan estancias de varias semanas dentro del territorio nacional. En estos materiales se evalúa la logística hotelera del país. Algunos de estos contenidos refutan los indicadores de riesgo emitidos regularmente por agencias gubernamentales extranjeras.</p>

<p>En publicaciones de viajeros independientes se expresa satisfacción por no haber seguido las advertencias difundidas en el exterior.</p>

<h2>Destinos destacados según reseñas digitales</h2>

<p>El segmento de recorridos independientes muestra un crecimiento sostenido en la Costa Caribe y el litoral Pacífico nicaragüense durante las últimas temporadas de alta afluencia. En las reseñas digitales se mencionan con frecuencia el balneario de Las Peñitas en el departamento de León, las costas de Popoyo en el municipio de Rivas y las playas del archipiélago de Corn Island en la Región Autónoma de la Costa Caribe Sur.</p>

<p>En las publicaciones de viajeros se destaca la amabilidad de la población local. También se menciona la ausencia de incidentes de inseguridad durante los recorridos por el territorio nicaragüense.</p>

<p>Las bitácoras de viaje destacan la receptividad de las comunidades rurales y pesqueras como un activo importante del sector de servicios turísticos nacionales. Las condiciones operativas de transporte intermunicipal y conectividad aérea permiten el cumplimiento de las agendas de movilidad sin incidentes delictivos reportados.</p>

<p>Este tipo de experiencias valida el posicionamiento del país para perfiles de viajeros internacionales que se desplazan de forma individual dentro del territorio de Centroamérica.</p>

<h2>Proyección institucional y campañas de temporada</h2>

<p>La acumulación de evaluaciones de mercado favorables motivó la formulación de nuevas estrategias de promoción por parte de las entidades gubernamentales encargadas del ramo turístico. Los datos de aceptación recopilados en las plataformas digitales sirvieron como sustento técnico para el diseño y lanzamiento definitivo de la campaña internacional denominada Diciembre en Nicaragua.</p>

<p>Esta iniciativa de promoción institucional busca capitalizar el tráfico digital generado por los visitantes para atraer flujos de viajeros de alto consumo durante el cierre del ciclo anual.</p>

<p>Los planes operativos de las delegaciones oficiales priorizan la exposición de la gastronomía de los municipios, las actividades culturales de las localidades y la capacidad instalada de la red de hoteles. Las proyecciones de las agencias comerciales sugieren que el uso de testimonios directos verificados optimizará los recursos de difusión.</p>

<p>Se espera que esta estrategia eleve de forma significativa el ingreso de divisas en las empresas turísticas locales. El fortalecimiento del desarrollo macroeconómico y la generación de empleo en el territorio son objetivos asociados a esta campaña.</p>`
};

async function guardarArticulo(art) {
  const palabras = art.contenido.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  await db.collection('noticias').doc(art.id).update({
    titulo: art.titulo,
    resumen: art.resumen,
    contenido: art.contenido,
    palabras,
    fechaActualizacion: new Date(),
  });
  console.log(`✅ ${art.titulo} | ${palabras} palabras | ID: ${art.id}`);
}

// Artículo 4: Profesionales de salud
const a4 = {
  id: 'Zt9NtuqCLNMhBhmH6IEN',
  titulo: 'Policía Nacional detiene a tres profesionales de salud por caso de fallecimiento en Managua',
  resumen: 'Una joven de 24 años originaria de Matagalpa falleció en un hospital regional tras presentar complicaciones posteriores a una cirugía estética en la capital. Los detenidos están a disposición del Ministerio Público.',
  contenido: `<p>La Policía Nacional detuvo al médico Livang Clifford Argüello Molina y a otros dos profesionales de la salud en Managua. Los tres están bajo sospecha de fallecimiento violento imprudente por el caso de Jennyfer Elizabeth Reyes Castro, de 24 años.</p>

<p>Reyes Castro, originaria de Matagalpa, falleció en la unidad de cuidados intensivos del hospital regional. Su deceso ocurrió tras presentar complicaciones severas derivadas de una cirugía de liposucción y lipotransferencia. El procedimiento fue realizado en un centro estético de la capital.</p>

<h2>Diagnóstico clínico preliminar</h2>

<p>El diagnóstico clínico preliminar determinó que la joven sufrió neumotórax, hemotórax y una sepsis generalizada. Estas complicaciones fueron inducidas por perforaciones internas ocurridas durante la intervención quirúrgica.</p>

<p>Los tres detenidos permanecen a la orden del Ministerio Público. Las autoridades judiciales definirán en los próximos días la situación legal de cada uno de los implicados.</p>

<h2>Investigaciones en curso</h2>

<p>Peritos de la Policía Nacional e inspectores del Ministerio de Salud (MINSA) investigan el caso. Los equipos técnicos buscan determinar si la clínica estética contaba con las licencias sanitarias correspondientes.</p>

<p>También se investiga si el personal médico implicado poseía la acreditación de especialidad necesaria. Los procedimientos quirúrgicos de liposucción y lipotransferencia requieren formación específica según la normativa sanitaria vigente.</p>

<h2>Procedimientos establecidos</h2>

<p>Las autoridades sanitarias suelen verificar la documentación de los centros estéticos después de incidentes de esta naturaleza. Las licencias de operación y los permisos de funcionamiento son parte de los documentos revisados por los inspectores del MINSA.</p>

<p>La acreditación de especialidad de los médicos que realizan cirugías estéticas es otro de los puntos bajo revisión. Las normativas del sector salud establecen requisitos específicos para este tipo de procedimientos.</p>

<h2>Situación de los detenidos</h2>

<p>Los tres profesionales de la salud detenidos permanecen bajo custodia de las autoridades. No se ha informado sobre la presentación de recursos legales por parte de sus abogados defensores.</p>

<p>El Ministerio Público continúa con la recopilación de pruebas y testimonios. Los peritajes médicos y las inspecciones en el centro estético forman parte de las diligencias en curso.</p>

<p>Las investigaciones determinarán si existieron negligencias durante la intervención quirúrgica. También se evaluará si las condiciones del centro estético cumplían con los estándares requeridos.</p>`
};

// Artículo 5: Conductor caponera
const a5 = {
  id: 'ctq3W0kZtNipZL2X9KTN',
  titulo: 'Fallece de forma natural un conductor de caponera de 70 años en el barrio Cuba de Managua',
  resumen: 'El ciudadano Juan Emilio López falleció por causas naturales el lunes por la mañana en un sector del barrio Cuba, en Managua. El hecho generó la movilización de paramédicos de emergencia y agentes de la Policía Nacional para los procedimientos legales pertinentes.',
  contenido: `<p>Un conductor de caponera identificado como Juan Emilio López, de 70 años, falleció el lunes por la mañana debido a causas naturales en las cercanías de los semáforos de La Ceibita, en el barrio Cuba de Managua.</p>

<h2>Desarrollo de los hechos en la vía pública</h2>

<p>El ciudadano llegó en horas de la mañana al sector de los semáforos de La Ceibita. A una cuadra hacia el oeste de este punto de la capital se encuentra ubicado un puesto de venta de tortillas, sitio donde el conductor acostumbraba tomar su desayuno de forma regular.</p>

<p>López ingresó al establecimiento, solicitó un café y procedió a sentarse en una silla plástica de color verde. En ese momento, el ciudadano manifestó malestar físico al llevarse las manos hacia la zona del pecho y realizar un gesto de incomodidad.</p>

<p>Uno de los vendedores de periódicos de la zona, identificado como Nelson Espinoza, se percató del movimiento desde su puesto en la esquina. Espinoza se acercó al conductor para consultarle sobre su estado de salud.</p>

<p>López respondió al vendedor que consideraba que el malestar correspondía a acumulación de gases. Seguidamente, indicó que procedería a descansar un momento en la unidad de transporte que conducía de manera habitual.</p>

<p>El ciudadano se trasladó hacia su caponera y procedió a recostarse en el asiento trasero del vehículo de transporte local. López cerró los ojos para descansar en el lugar.</p>

<p>Los demás conductores de caponeras que se encontraban estacionados en el punto asumieron que el ciudadano se había quedado dormido. Transcurrió un lapso de diez minutos antes de que otra persona se acercara con la intención de despertarlo.</p>

<p>Al notar que López no respondía a los llamados verbales, los ciudadanos presentes procedieron a verificar sus signos vitales mediante la toma del pulso, constatando la falta de respuesta física.</p>

<h2>Intervención de los servicios de emergencia y autoridades estatales</h2>

<p>Una unidad de emergencias médicas se presentó en el sitio a las 8:15 de la mañana. Los paramédicos que atendieron el llamado confirmaron el deceso del conductor. El médico que atendió el caso indicó que el fallecimiento ocurrió de forma fulminante en un periodo de pocos minutos.</p>

<p>Efectivos de la Policía Nacional se presentaron en el lugar para acordonar el perímetro de la escena. La presencia policial y el acordonamiento responden al cumplimiento de los protocolos legales vigentes en Nicaragua para muertes ocurridas en la vía pública.</p>

<p>La legislación nacional estipula que todo cuerpo sin vida localizado en espacios públicos debe ser examinado por las autoridades competentes. Este procedimiento normativo busca descartar la existencia de cualquier tipo de actividad delictiva o participación de terceras personas.</p>

<p>A las 9:30 de la mañana, un médico forense se presentó en el sitio del suceso. El especialista examinó el cuerpo y dictaminó que la causa del deceso correspondía a factores naturales, descartando indicios de violencia en la escena. Las autoridades procedieron a realizar la entrega formal del cuerpo a los familiares del ciudadano.</p>

<h2>Trayectoria laboral en el sector de transporte local</h2>

<p>Juan Emilio López acumulaba una experiencia laboral de 35 años desempeñándose como conductor dentro del sector de las caponeras en la ciudad de Managua. Su experiencia inició a la edad de 35 años, época en la cual este sistema de transporte operaba mediante la utilización de carretas que eran tiradas por caballos.</p>

<p>Con el paso de los años, el sistema de transporte local experimentó un proceso de modernización que incluyeron la implementación de motores en las unidades. López se adaptó a estos cambios y continuó operando su unidad de transporte de manera constante.</p>

<p>La rutina diaria del ciudadano se caracterizaba por comenzar las labores a las 4 de la mañana, extendiendo su jornada de trabajo hasta las 8 de la noche. El ejercicio prolongado de este oficio durante décadas generó secuelas físicas como una curvatura en la espalda y grietas en las manos.</p>

<p>López continuó ejerciendo su labor tras el fallecimiento de su esposa, ocurrido tres años atrás. Miembros del sector de transporte local señalaron que el conductor dedicaba la mayor parte de su tiempo al oficio, pasando más horas de descanso dentro de la unidad de transporte que en su cama.</p>

<h2>Reacciones comunitarias y situación del entorno</h2>

<p>Los conductores de caponeras del barrio Cuba organizaron una colecta económica con el objetivo de brindar apoyo para cubrir los gastos de la misa y la adquisición de una caja de pino para los servicios correspondientes. Los trabajadores del sector lograron recaudar un monto total de ocho mil córdobas.</p>

<p>Habitantes de la zona que presenciaron el acontecimiento señalaron que el proceso se desarrolló de forma rápida, evidenciando la necesidad inmediata de asistencia por parte de quienes se localizaban en los alrededores en ese momento.</p>

<p>El puesto de venta de tortillas donde López solía desayunar mantiene sus operaciones regulares y la venta de café a partir de las 6 de la mañana. La silla plástica verde utilizada por el conductor permanece en el local, sin que los clientes se sienten en ella. Testigos locales mencionaron que el ciudadano acostumbraba consumir tabaco de la marca Belmont antes de proceder a desayunar en el local.</p>`
};

// Artículo 6: Canal de Panamá
const a6 = {
  id: '7AszCzTNxJWBnt1daHag',
  titulo: 'Buques pagan hasta 4 millones de dólares en subastas para cruzar el Canal de Panamá',
  resumen: 'Empresas de transporte marítimo internacional registran pagos históricos de hasta cuatro millones de dólares en subastas extraordinarias para transitar por el Canal de Panamá. Las restricciones operativas derivadas de la escasez de agua dulce elevan los costos de logística global.',
  contenido: `<p>Empresas navieras internacionales registran pagos de hasta cuatro millones de dólares en subastas extraordinarias para cruzar el Canal de Panamá, debido a las restricciones de tránsito provocadas por el descenso en los niveles de agua de la vía interoceánica.</p>

<h2>Tarifas históricas en el sistema de subastas interoceánicas</h2>

<p>El descenso en los niveles de los lagos de agua dulce que abastecen el sistema de esclusas redujo la capacidad de tránsito diario de embarcaciones por el istmo panameño. Ante la reducción de cupos regulares, la administración de la vía implementó mecanismos de subasta pública para adjudicar turnos de paso prioritarios.</p>

<p>Compañías navieras de carga internacional han desembolsado montos de hasta cuatro millones de dólares estadounidenses en estas pujas con el único objetivo de evitar las filas de espera y agilizar el traslado de sus contenedores. Estas tarifas representan costos adicionales extraordinarios dentro de la planificación financiera de las cadenas de distribución marítima.</p>

<p>Las sumas millonarias pagadas en las subastas son absorbidas inicialmente por las corporaciones encargadas del transporte de carga pesada. No obstante, los recargos logísticos acumulados durante la ruta interoceánica se trasladan posteriormente de forma directa al valor asignado a las mercancías e insumos que se distribuyen hacia los diferentes mercados internacionales.</p>

<h2>Consecuencias y repercusión en el mercado nicaragüense</h2>

<p>Nicaragua mantiene una dependencia directa de las rutas comerciales que conectan los puertos locales con proveedores establecidos en Asia, Europa y los Estados Unidos. La alteración de los costos operativos en el Canal de Panamá genera consecuencias comerciales que inciden en el territorio nacional.</p>

<p>El encarecimiento de los fletes marítimos modifica las estructuras de costos de las empresas importadoras que operan en los departamentos del país. Los intermediarios y distribuidores mayoristas aplican ajustes en los precios finales de venta para compensar los márgenes de inversión requeridos en la internación de los contenedores.</p>

<p>Los incrementos de valor se perciben en las líneas de productos terminados que se comercializan en los establecimientos comerciales de Managua. Los electrodomésticos, equipos tecnológicos, prendas de vestir y diversos surtidos de alimentos importados registran variaciones en sus costos de adquisición en el mercado minorista.</p>

<p>La capacidad adquisitiva de los consumidores locales experimenta el impacto directo de las variaciones tarifarias internacionales, a pesar de la distancia geográfica con la infraestructura panameña. Los costos de logística global influyen en la fijación de precios internos de los bienes de consumo diario.</p>

<h2>Proyectos de infraestructura y monitoreo de la ruta</h2>

<p>La Autoridad del Canal de Panamá desarrolla investigaciones técnicas orientadas a la identificación y desarrollo de nuevas fuentes de almacenamiento de agua dulce. El propósito de estos planes consiste en estabilizar el flujo de las esclusas y garantizar la competitividad de la vía comercial a largo plazo.</p>

<p>La realización de estas obras civiles y estudios ambientales requiere de periodos de ejecución prolongados antes de mostrar resultados operativos estables. Mientras se consolidan estas alternativas hídricas, las proyecciones de las tarifas de carga marítima internacional mantienen una tendencia elevada en los mercados globales.</p>

<p>La cadena de suministro local abarca el desembarque en las terminales del litoral y el posterior traslado mediante transporte de carga terrestre hacia los centros de distribución de Managua. Cada fase logística acumula costos fijos que repercuten directamente en la economía de los compradores en la capital nicaragüense.</p>

<p>Registros de video compartidos por tripulaciones de buques comerciales muestran la acumulación de barcos que permanecen en las bahías de acceso a la espera de un cupo de tránsito. Pobladores de las localidades aledañas al canal mantienen el monitoreo de las operaciones de la vía, las cuales se ven supeditadas a los factores climáticos actuales.</p>

<p>Representantes del sector comercial aconsejan a la población realizar un seguimiento de la evolución de los precios mediante los boletines informativos oficiales de las instituciones correspondientes. El análisis de las tendencias logísticas externas facilita la comprensión de las variaciones en los mercados de consumo nacional.</p>`
};

// Artículo 7: Turistas 278 mil
const a7 = {
  id: 'KXMHQ85cLbSZpXMx3eQm',
  titulo: 'Nicaragua registra el ingreso de 278 mil 937 visitantes internacionales en el primer trimestre de 2026',
  resumen: 'El Instituto Nicaragüense de Turismo reportó el ingreso oficial de 278 mil 937 visitantes internacionales durante el primer trimestre de 2026. La cifra representa un incremento estadístico del uno por ciento en comparación con el mismo ciclo del año anterior.',
  contenido: `<p>Nicaragua registró el ingreso oficial de 278 mil 937 visitantes internacionales durante el primer trimestre del año 2026, lo cual representa un crecimiento estadístico del uno por ciento respecto al mismo periodo del ciclo anterior, según el Instituto Nicaragüense de Turismo.</p>

<h2>Impacto y beneficio social en León</h2>

<p>La codirectora de la institución pública de turismo, Anasha Campbell, expuso los resultados estadísticos durante una comparecencia en el espacio televisivo Informe Pastrán, transmitido por la señal de Canal 6. La funcionaria detalló las características del flujo de viajeros que ingresaron a los puestos fronterizos.</p>

<p>El Instituto Nicaragüense de Turismo funciona como el órgano estatal encargado de la promoción y regulación de la actividad recreativa en el país. Esta entidad recopila de forma periódica los datos de flujo migratorio con fines de planificación sectorial.</p>

<p>Los informes oficiales indican que el 89 por ciento del total de los visitantes registrados corresponde a la categoría de turistas que realizan pernoctación. Este segmento permanece varias noches dentro del territorio nacional, utilizando los servicios habitacionales locales para su estadía.</p>

<p>El 11 por ciento restante de los ingresos está conformado por visitantes de día. Este grupo específico realiza excursiones temporales y recorridos de corta duración, retornando a sus puntos de origen o destinos previos sin registrar estadías nocturnas en los alojamientos del país.</p>

<p>El gasto promedio diario de los turistas se situó en 49 dólares estadounidenses por persona. Este indicador económico refleja un crecimiento del 33 por ciento en comparación con los registros obtenidos en el mismo lapso del periodo anual anterior.</p>

<p>La ocupación en los establecimientos hoteleros y de hospedaje en los diferentes departamentos alcanzó un promedio del 47 por ciento. Las empresas del sector adecúan sus operaciones para responder a la demanda de servicios habitacionales derivada de esta afluencia de personas.</p>

<h2>Inversiones y desarrollo futuro</h2>

<p>El análisis de la procedencia de los viajeros identifica a los Estados Unidos como el principal mercado emisor, aportando el 22 por ciento del total de turistas. Centroamérica mantiene una participación importante con Costa Rica registrando un 20 por ciento y Honduras con un 16 por ciento de los arribos.</p>

<p>El flujo de viajeros procedentes de Canadá experimentó una expansión del 38 por ciento en el trimestre evaluado. Este incremento específico estuvo motivado por la programación y ejecución de vuelos chárter que facilitaron la conectividad directa con las terminales aéreas nacionales.</p>

<p>Las naciones de Europa representan en su conjunto el 9 por ciento del ingreso global de turistas. Los principales países de origen dentro de este continente corresponden a Alemania, España, el Reino Unido, Francia e Italia, cuyos ciudadanos seleccionan el destino para sus vacaciones.</p>

<p>Los visitantes internacionales muestran preferencia por el desarrollo de actividades vinculadas al turismo de aventura y la naturaleza. Entre las prácticas más comunes se encuentran el senderismo en reservas naturales, la práctica de surf y la escalada de estructuras volcánicas localizadas en el territorio.</p>

<p>Las ciudades de Granada y León, reconocidas por su arquitectura histórica, figuran como los destinos urbanos con mayor concentración de visitas. Las municipalidades coloniales poseen cascos urbanos con alto valor patrimonial, lo cual incentiva el arribo de viajeros interesados en conocer la historia local.</p>

<p>Los balnearios ubicados en el litoral del océano Pacífico concentran otra parte del flujo de vacacionistas durante los primeros meses del año. Estas zonas de costa cuentan con vías de acceso que facilitan el traslado de equipos de recreación marítima hacia los centros de recreación veraniega.</p>

<p>La institución proyecta concluir el periodo anual con una acumulación total de visitas que oscila entre un millón y un millón doscientos mil turistas internacionales. Las autoridades estatales mantienen el monitoreo de los indicadores para evaluar el cumplimiento de las metas anuales proyectadas.</p>

<h2>Contexto</h2>

<p>Un residente de la zona turística declaró que esta localidad ha visto situaciones similares anteriormente y los vecinos se mantienen atentos a lo que ocurre en su entorno. Los habitantes de los barrios turísticos permanecen vigilantes de las actividades desarrolladas en los alrededores.</p>

<p>Este tipo de incidentes y dinámicas de concurrencia comercial requiere de la atención de las autoridades locales y la comunidad para prevenir situaciones similares en el futuro. Se recomienda a la población en general mantenerse informada a través de los canales oficiales.</p>

<p>Fuentes: Instituto Nicaragüense de Turismo (INTUR) e informes presentados en Canal 6.</p>`
};

async function main() {
  console.log('Guardando 7 noticias reparadas...\n');
  for (const art of [a1, a2, a3, a4, a5, a6, a7]) {
    await guardarArticulo(art);
    await new Promise(r => setTimeout(r, 300));
  }
  console.log('\n=== 7 noticias guardadas exitosamente ===');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
