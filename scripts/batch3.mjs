import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('g:\\\\RESPALDO\\\\informate-nicaragua-final\\\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json', 'utf8'));
initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore();

async function guardar(id, titulo, resumen, contenido) {
  const palabras = contenido.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  await db.collection('noticias').doc(id).update({ titulo, resumen, contenido, palabras, fechaActualizacion: new Date() });
  console.log(`✅ ${titulo.substring(0, 50)}... | ${palabras} palabras`);
}

await guardar('e7FFhasFNh3pd7o4xBMo', 'Tres accidentes de motocicleta dejan dos fallecidos y una menor lesionada en Managua y Estelí', 'Tres percances viales registrados en Managua y Estelí dejaron como saldo dos personas fallecidas y una niña de siete años con lesiones graves tras colisiones y despistes de motocicletas.', `<p>Tres accidentes de tránsito ocurridos en los departamentos de Managua y Estelí dejaron como saldo dos personas fallecidas y una menor de edad con lesiones de gravedad.</p>

<p>El primer incidente se registró en el sector conocido como Bosques de Xiloá, ubicado en el municipio de Managua. En este punto del área metropolitana, dos motocicletas colisionaron de forma transversal mientras circulaban por la vía principal de acceso. A bordo de uno de los vehículos de dos ruedas viajaba como pasajera una niña de siete años de edad, quien sufrió el impacto directo del choque mecánico entre las unidades.</p>

<p>Debido a la gravedad de los golpes recibidos en diferentes partes de su anatomía, la menor fue trasladada de urgencia hacia las instalaciones del Hospital Infantil Manuel de Jesús Rivera "La Mascota", donde el personal médico especializado procedió a brindarle la atención correspondiente y estabilizar sus signos vitales. Los informes policiales preliminares indicaron que los conductores de las motocicletas involucradas en el percance son dos jóvenes de 25 y 16 años de edad, respectivamente, quienes permanecen bajo investigación civil para deslindar las responsabilidades técnicas del choque.</p>

<h2>Siniestro con víctimas mortales en Rubenia</h2>

<p>El segundo hecho vial ocurrió durante las horas de la noche en las inmediaciones de la rotonda de Rubenia, un nodo vial de alta circulación en la capital de la república. En este sitio, una motocicleta perdió la estabilidad mecánica sobre la carpeta asfáltica, provocando que el conductor perdiera el control operativo de la unidad e impactara de forma directa contra una estructura fija de concreto ubicada a la orilla de la calzada.</p>

<p>Las dos personas que viajaban en el vehículo motorizado fallecieron de forma inmediata en el lugar del suceso como consecuencia del violento impacto. Testigos presenciales de los hechos manifestaron a las autoridades de seguridad pública que la motocicleta circulaba a alta velocidad momentos antes de aproximarse a la estructura vial, factor que limitó la capacidad de maniobra y frenado del conductor ante la pérdida de control en la vía pública.</p>

<h2>Incidente vial en la comunidad Las Pintadas</h2>

<p>El tercer accidente vial se documentó en la zona norte del país, específicamente en la comunidad Las Pintadas, perteneciente al municipio de Estelí. Un joven que laboraba activamente en el sector industrial tabacalero falleció tras sufrir un despiste y posterior deslizamiento con su motocicleta cuando transitaba en las cercanías de una estructura de puente local.</p>

<p>Habitantes de la zona señalaron que este tramo vial específico de la comunidad posee irregularidades en la superficie de rodamiento y una escasa señalización de carácter preventivo, circunstancias que elevan el índice de riesgo de despiste para los conductores de unidades de dos ruedas que no se encuentran familiarizados con las condiciones de la ruta alterna del sector. Los efectivos de la Policía Nacional de Tránsito aseguraron la zona del suceso y tomaron declaración a las personas que presenciaron el desarrollo del percance.</p>

<h2>Análisis de la accidentalidad en motocicletas</h2>

<p>Los datos estadísticos de seguridad vial indican que los percances con motocicletas representan una proporción significativa dentro del registro de accidentes de tránsito con consecuencias graves a nivel nacional. El perfil demográfico de los afectados se concentra principalmente en jóvenes entre las franjas de 18 y 35 años de edad, quienes conforman el sector más activo en la utilización de este medio de transporte para sus desplazamientos cotidianos.</p>

<p>Especialistas en prevención de accidentes viales recomiendan a los conductores de motocicletas utilizar de forma obligatoria el casco de protección certificado, respetar los límites de velocidad establecidos para cada corredor vial y abstenerse de transportar pasajeros menores de edad en condiciones que incrementen su vulnerabilidad ante un posible impacto. La conducción responsable y el cumplimiento de la normativa de tránsito son factores determinantes para la reducción de hechos similares.</p>

<p>Las autoridades de tránsito del país continúan con las inspecciones y monitoreos operativos en las zonas de alta accidentalidad. Se recomienda a la población en general verificar el estado mecánico de sus unidades antes de circular y respetar en todo momento las señales de tránsito y advertencia dispuestas en las carreteras nacionales.</p>`);

await guardar('ksmI7JomnHgJB6NKcA71', 'Más de 30 mil personas asisten al concierto del artista urbano Yadel en Managua', 'El cantante de reguetón Yadel reunió a más de 30 mil personas en el Parque de la Paz durante la celebración de la fiesta del retorno de Camerata Bach y el artista nicaragüense. El evento contó con un ambiente festivo de carácter familiar.', `<p>El artista de música urbana Yadel reunió a más de 30 mil espectadores en la ciudad de Managua durante el marco de una presentación musical de gran magnitud organizada como parte de las festividades del retorno de Camerata Bach.</p>

<h2>Ambiente del evento cultural</h2>

<p>La actividad se desarrolló en el Parque de la Paz, espacio público localizado en el centro neurálgico de la capital nicaragüense. La planificación operativa del evento generó una dinámica de conexión entre las manifestaciones musicales de distintos géneros, ofreciendo al público asistente una propuesta de esparcimiento que integró la música orquestal con la música urbana contemporánea.</p>

<p>Los asistentes llegaron desde horas tempranas de la tarde al punto de concentración para asegurar una ubicación estratégica frente al escenario principal. La concurrencia masiva transformó el parque en un escenario de celebración comunitaria en el que familias completas, jóvenes y adultos compartieron el ambiente festivo de la velada. Los stands de comidas y bebidas dispuestos en los alrededores del área principal atendieron a los miles de visitantes durante el desarrollo de las actividades.</p>

<h2>Presentaciones artísticas en el escenario</h2>

<p>El espectáculo inició con las interpretaciones de las agrupaciones sinfónicas correspondientes a la Camerata Bach, quienes ejecutaron composiciones clásicas ante la multitud congregada. El director de orquesta explicó durante la velada que la iniciativa de integrar formatos musicales aparentemente distantes responde a un objetivo institucional de ampliar el alcance de la cultura orquestal hacia nuevos públicos y generaciones de nicaragüenses.</p>

<p>El turno del artista Yadel sobre el escenario principal generó una intensa respuesta por parte de los espectadores. El intérprete, quien se ha posicionado como uno de los principales referentes del reguetón en el territorio nacional, interpretó los temas musicales que lo han caracterizado a lo largo de su trayectoria profesional. Los asistentes entonaron en coro las letras de las canciones y utilizaron los teléfonos inteligentes para capturar el desarrollo de la presentación mediante aplicaciones de video y fotografía.</p>

<h2>Logística y seguridad del evento</h2>

<p>El operativo de seguridad integró a efectivos de la Policía Nacional, brigadas de socorro y personal de emergencia médica distribuidos en los diferentes accesos y zonas del parque. Los organizadores manifestaron que la logística de concurrencia masiva requirió semanas de planificación en coordinación con las instituciones de orden público para garantizar el desarrollo del evento en condiciones de seguridad integral para los miles de participantes.</p>

<p>Los accesos vehiculares al perímetro del parque fueron cerrados de forma temporal durante las horas de mayor afluencia para facilitar el desplazamiento peatonal de los asistentes. Los servicios de transporte público extendieron sus rutas hacia el sector para garantizar la movilidad de los ciudadanos que llegaron desde diferentes barrios de Managua y de los municipios aledaños a la capital. Al finalizar el espectáculo, se implementó un plan de desalojo progresivo que permitió la salida ordenada de la masa de público hacia los puntos de transporte disponibles.</p>

<h2>Balance cultural del encuentro</h2>

<p>La celebración consolidó el propósito de la Camerata Bach de acercar la música académica y la cultura sinfónica a segmentos de la población que tradicionalmente no asisten a recitales de carácter formal. La combinación de estilos musicales funcionó como un puente comunicativo entre públicos diversos, generando un espacio de encuentro cultural que trascendió las barreras generacionales y de preferencias artísticas.</p>

<p>Los organizadores del evento manifestaron su satisfacción con la convocatoria alcanzada y evalúan la posibilidad de replicar la fórmula de espectáculos integrados en futuras ediciones de las festividades culturales de la capital. La masiva asistencia de público demuestra el interés de la población nicaragüense por participar en actividades de recreación colectiva que fortalezcan los lazos comunitarios y promuevan la expresión artística en espacios públicos abiertos.</p>

<p>Fuentes: organizadores del evento en el Parque de la Paz.</p>`);

console.log('=== Batch 3 completado ===');
