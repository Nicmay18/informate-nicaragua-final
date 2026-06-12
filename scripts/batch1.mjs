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

await guardar('BU0PX0EqHO5ewLCH7Coo', 'Un fallecido y un herido de gravedad tras registrarse dos accidentes laborales en Managua y Estelí', 'Un trabajador de 48 años falleció en Managua tras caer del techo de una vivienda, mientras que otro ciudadano de 45 años resultó lesionado al caer del segundo piso de una construcción en el municipio de Estelí.', `<p>Dos accidentes laborales registrados en los departamentos de Managua y Estelí dejaron como saldo una persona fallecida y otra con lesiones de gravedad durante el desarrollo de labores de infraestructura civil.</p>

<h2>Detalles del grave hecho en Managua</h2>

<p>El suceso ocurrió en el barrio El Riguero, ubicado en la capital de la república. El ciudadano Alejandro José López Pérez, de 48 años, se encontraba ejecutando labores de mantenimiento y reparación en la estructura superior del techo de una vivienda en dicha localidad.</p>

<p>Durante el desarrollo de sus actividades, el obrero caminó sobre la superficie de la cubierta y pisó una lámina de material plástico que se encontraba pintada, elemento que impidió la visualización de su fragilidad. La estructura no soportó el peso corporal del trabajador, provocando una caída libre desde una altura de varios metros hacia el suelo.</p>

<p>El impacto contra la superficie sólida le ocasionó múltiples fracturas óseas y un trauma craneoencefálico severo. Los cuerpos de asistencia médica que se presentaron al lugar confirmaron que el ciudadano falleció de forma inmediata en el sitio del percance.</p>

<p>Un habitante del sector manifestó que la víctima se caracterizaba por ser un ciudadano trabajador y ampliamente conocido entre los pobladores del barrio, añadiendo que los acontecimientos se desarrollaron de forma imprevista en el lugar.</p>

<h2>Accidente en Estelí</h2>

<p>El segundo incidente laboral se reportó en el municipio de Estelí, cabecera del departamento homónimo. El obrero de la construcción José Aguilera, de 45 años, sufrió una caída desde el segundo nivel de una edificación civil en proceso de acondicionamiento, sitio donde se proyecta el funcionamiento del establecimiento deportivo Beast Factory Fitness.</p>

<p>El trabajador perdió el equilibrio mecánico mientras realizaba sus asignaciones operativas en la estructura superior, precipitándose desde una altura estimada de seis metros. La fuerza del impacto contra el piso provocó lesiones de consideración en la anatomía del ciudadano.</p>

<p>Miembros de los servicios de socorro locales brindaron las primeras atenciones en la escena del incidente y procedieron al traslado inmediato del paciente hacia las instalaciones del Hospital San Juan de Dios de Estelí. El estado clínico y el pronóstico de salud del paciente se mantienen bajo reserva por parte de las autoridades médicas del centro hospitalario.</p>

<h2>Panorama de la seguridad ocupacional</h2>

<p>Las estadísticas sectoriales indican que los percances originados por caídas desde superficies elevadas constituyen una de las principales causas de accidentalidad laboral con consecuencias graves dentro del territorio nacional. La falta de aseguramiento en las dinámicas de infraestructura eleva los índices de riesgo para los operarios.</p>

<p>Nicaragua experimentó una dinámica de expansión económica constante durante los periodos recientes, factor que impulsó de forma directa la edificación de obras y la demanda de mano de obra en el sector de la construcción civil. Esta aceleración en las actividades productivas incrementó de forma proporcional los riesgos de exposición a condiciones inseguras en los entornos de trabajo cuando no se implementan medidas de control.</p>

<h2>Antecedentes similares</h2>

<p>Los registros históricos documentan eventos de naturaleza similar en diferentes localidades del país en periodos previos. Durante el año 2020, un obrero del sector construcción falleció como consecuencia de un accidente de trabajo en la ciudad de León, tras precipitarse desde una estructura elevada de un edificio que se encontraba en proceso de edificación.</p>

<p>En el año 2019 se reportó una situación de características semejantes en el municipio de Granada. En esa ocasión, un operario sufrió lesiones de gravedad en su organismo al caer desde la estructura del techo de un inmueble mientras realizaba tareas de reparación en la cobertura superior de la propiedad.</p>

<h2>Reacciones de la comunidad</h2>

<p>Los acontecimientos generaron reacciones y muestras de solidaridad por parte de los habitantes de los barrios afectados tanto en la ciudad de Managua como en Estelí. Los pobladores expresaron su respaldo hacia los miembros de las familias de los operarios que resultaron afectados por las caídas.</p>

<p>Un vecino de la víctima de la capital expresó que la situación afecta de manera directa a los habitantes de la localidad, coincidiendo en la necesidad de que las instancias correspondientes ejecuten supervisiones constantes para evitar que este tipo de hechos ocurran en los centros de labores y obras civiles.</p>

<h2>Medidas preventivas recomendadas</h2>

<p>Especialistas en materia de seguridad e higiene ocupacional reiteran la importancia de utilizar de forma obligatoria los equipos de protección individual, tales como el arnés de seguridad anclado a líneas de vida y el casco de protección industrial. Estos implementos reducen la gravedad de las lesiones ante eventuales fallas mecánicas o pérdidas de equilibrio.</p>

<p>Se aconseja realizar inspecciones exhaustivas de los techos, andamios y plataformas de trabajo antes de proceder al ascenso del personal, restringiendo el tránsito peatonal sobre superficies acrílicas o frágiles. Las normativas exigen que las empresas y el personal técnico cumplan con los protocolos de emergencia y las leyes laborales vigentes en el país.</p>

<h2>Disposiciones institucionales</h2>

<p>Se prevé que las autoridades de las municipalidades y las organizaciones comunitarias coordinen esfuerzos orientados al desarrollo de campañas de concienciación y verificación de las condiciones de seguridad en las obras locales. La participación conjunta busca disminuir los factores de riesgo en las actividades de mantenimiento residencial y comercial.</p>

<p>Se sugiere a la ciudadanía en general mantenerse informada respecto de las normativas de seguridad pública por medio de los canales de comunicación oficiales de las instituciones del Estado. El cumplimiento estricto de las recomendaciones técnicas constituye la vía principal para salvaguardar la integridad física de los trabajadores del sector.</p>`);

await guardar('kpr5LCeGtA5X9kRXvWSN', 'La Torre Eiffel se ilumina con los colores del Paris Saint-Germain previo a la final europea contra el Arsenal', 'La alcaldía de París coordinó la iluminación de la Torre Eiffel con los colores del Paris Saint-Germain de cara a la final que disputará contra el Arsenal en Budapest. Los aficionados en Nicaragua se preparan para seguir la transmisión del partido.', `<p>La alcaldía de París ordenó iluminar la estructura de la Torre Eiffel con los colores del club Paris Saint-Germain ante la próxima final europea contra el conjunto del Arsenal.</p>

<h2>Desempeño y estadísticas del encuentro</h2>

<p>La intervención visual aplicada sobre la emblemática estructura de hierro incluyó la proyección explícita del lema tradicional de apoyo "ALLEZ PARIS" en los costados de la torre. Esta iniciativa de las autoridades del ayuntamiento funciona como un estímulo de carácter anímico e institucional para todo el plantel de deportistas antes de afrontar el compromiso más relevante dentro del calendario de las competencias del balompié europeo en la presente temporada.</p>

<p>El conjunto del Paris Saint-Germain disputa su segunda final de forma consecutiva en este certamen de alto rendimiento profesional. La escuadra francesa registra una victoria en el partido definitorio de la edición inmediata anterior, por lo cual los miembros del cuerpo técnico y los jugadores concentrados buscan consolidar un bicampeonato histórico dentro de la trayectoria de la institución. El rendimiento de la plantilla se ha mantenido estable a lo largo de las rondas previas de clasificación, logrando victorias importantes que consolidan su posición como uno de los principales referentes del deporte internacional en la actualidad. Los analistas deportivos destacan el planteamiento táctico utilizado por el entrenador durante los partidos previos, lo que otorga solidez defensiva y efectividad en la línea de ataque de cara a este compromiso en territorio húngaro.</p>

<h2>Próximos compromisos en la tabla</h2>

<p>El partido definitivo contra el conjunto del Arsenal de Inglaterra está programado para este sábado 30 de mayo en las instalaciones de la ciudad de Budapest, Hungría. La administración municipal de la capital francesa coordinó tanto la compleja logística de la iluminación monumental como el montaje de infraestructura urbana orientada al esparcimiento de los ciudadanos que permanecen en las localidades de la capital.</p>

<p>Las autoridades de la alcaldía procedieron a la instalación de pantallas de gran formato en diferentes puntos estratégicos, parques y plazas públicas de la ciudad europea. Esta disposición técnica permite a los seguidores que no realizaron el traslado hacia el territorio húngaro presenciar el desarrollo completo de las acciones del partido en espacios públicos abiertos y debidamente acondicionados, garantizando la participación masiva y el orden de la población local.</p>

<p>Los planes de contingencia, seguridad urbana y festejos oficiales establecen que, en caso de obtener un resultado favorable en la cancha, la delegación completa de futbolistas desarrollará las celebraciones principales en el Campo de Marte, una zona verde ubicada directamente al pie de la estructura monumental. Las proyecciones operativas de transporte público y control de masas se encuentran preparadas a la espera del desenlace definitivo de las acciones en el terreno de juego.</p>

<h2>Panorama de la afición global</h2>

<p>La expectativa generada por este acontecimiento deportivo trasciende las fronteras geográficas del continente europeo y se extiende hacia la región centroamericana. En Nicaragua se registra la presencia de un segmento de seguidores constantes del conjunto parisino que, aunque posee un volumen menor en comparación con las aficiones del Real Madrid o del Fútbol Club Barcelona, mantiene un monitoreo de los resultados del club de Francia.</p>

<p>Los fanáticos ubicados en la ciudad de Managua y en otros departamentos de la república organizan reuniones en establecimientos comerciales y hogares particulares para dar cobertura a la transmisión televisiva del juego, vistiendo las indumentaria deportiva correspondiente a la institución francesa. El fenómeno del fútbol internacional activa dinámicas de integración y recreación que conectan a ciudadanos de áreas geográficas distantes.</p>

<p>Los residentes de los diferentes barrios de la capital nicaragüense que siguen el acontecer de las disciplinas de competencia manifestaron que estos encuentros internacionales logran convocar la atención de las familias. María López, una ciudadana que da seguimiento continuo a las transmisiones y crónicas de los partidos, comentó que los aficionados del entorno local se mantienen atentos a los reportes informativos de los canales oficiales para disfrutar del espectáculo deportivo en condiciones de tranquilidad comunitaria.</p>

<p>Fuentes: reportes de la Alcaldía de París y datos del encuentro deportivo en Budapest.</p>`);

console.log('=== Batch 1 completado ===');
