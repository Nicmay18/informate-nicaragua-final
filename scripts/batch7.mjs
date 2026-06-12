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

await guardar('gkAeVBYY9AQBzAYCmjWk', 'Activistas climáticos ejecutan acciones de protesta en el distrito financiero de Nueva York por políticas de financiamiento energético', 'Activistas del movimiento contra el cambio climático bloquearon el paso vehicular en Wall Street para exigir el cese de financiamiento a proyectos de combustibles fósiles por parte de instituciones bancarias estadounidenses.', `<p>Activistas del movimiento internacional contra el cambio climático ejecutaron acciones de protesta y bloqueo en las principales arterias del distrito financiero de Nueva York, Estados Unidos, como parte de una jornada de movilización global orientada a exigir el cese del financiamiento a proyectos basados en combustibles fósiles.</p>

<h2>Desarrollo de las manifestaciones</h2>

<p>Los manifestantes se concentraron en las primeras horas de la mañana en las inmediaciones de la icónica calle Wall Street, centro neurálgico de las operaciones bursátiles y financieras de Estados Unidos. Los activistas se organizaron en columnas de protesta que bloquearon de forma transitoria el acceso vehicular a la zona, utilizando pancartas, lonas y cuerdas humanas para impedir el paso de unidades de transporte por los corredores viales principales del distrito financiero.</p>

<p>Las consignas de los manifestantes se centraron en la exigencia de que las principales instituciones bancarias y fondos de inversión con sede en Wall Street retiren de forma inmediata el capital financiero asignado a proyectos de exploración, extracción y comercialización de petróleo, gas natural y carbón mineral a escala global. Los activistas argumentan que la continuidad del financiamiento a la industria de hidrocarburos perpetúa el ciclo de emisiones de gases de efecto invernadero que calientan la atmósfera terrestre.</p>

<h2>Intervención policial y detenciones</h2>

<p>El Departamento de Policía de Nueva York desplegó un importante dispositivo de seguridad en el perímetro de las manifestaciones para garantizar el orden público y facilitar la circulación de emergencia en el distrito financiero. Los oficiales policiales emitieron advertencias verbales a los manifestantes solicitando el despeje de las vías de acceso y procedieron al arresto de decenas de activistas que se negaron a abandonar las zonas de bloqueo.</p>

<p>Los detenidos fueron trasladados a las comisarías del sector para la realización de los trámites de identificación y formulación de cargos por infracciones al código de tránsito y obstrucción de la vía pública. Los abogados de la coalición ambiental que representa a los manifestantes anunciaron que impugnarán las detenciones, argumentando que las acciones de protesta constituyen un ejercicio legítimo de libertad de expresión garantizado por la Constitución de Estados Unidos.</p>

<h2>Posicionamiento de organizaciones ambientales</h2>

<p>Los portavoces de las organizaciones ecologistas participantes en la protesta manifestaron que la jornada de manifestaciones forma parte de una estrategia de presión sostenida contra el complejo financiero de Wall Street. Los activistas señalaron que las instituciones bancarias con presencia en el distrito financiero administran carteras de inversión que ascienden a miles de millones de dólares en proyectos de energía no renovable, contribuyendo de forma directa a la expansión de la huella de carbono global.</p>

<p>Los líderes del movimiento climático anunciaron que continuarán con acciones de protesta similares en diferentes ciudades de Estados Unidos y de Europa durante las próximas semanas. La estrategia de movilización busca mantener la presión mediática e institucional sobre los tomadores de decisiones del sector financiero para que aceleren la transición hacia carteras de inversión basadas en energías renovables y tecnologías de bajo impacto ambiental.</p>

<h2>Contexto del debate energético global</h2>

<p>Especialistas en economía ambiental señalaron que la protesta en Wall Street refleja la creciente polarización del debate sobre el financiamiento climático en Estados Unidos. Los analistas financieros reconocen que una proporción creciente de inversores institucionales ha comenzado a reorientar sus carteras hacia activos de energía limpia, aunque la industria de hidrocarburos mantiene una posición dominante en los flujos de capital del sistema financiero internacional.</p>

<p>Los activistas climáticos subrayaron que la transición energética requiere no solo de políticas públicas favorables, sino también de un cambio estructural en la lógica de inversión del capital privado. La presión social sobre las entidades financieras se perfila como uno de los mecanismos más efectivos para acelerar el abandono de los combustibles fósiles y mitigar los impactos del cambio climático en las generaciones futuras.</p>

<p>Fuentes: organizaciones ambientales y reportes policiales de Nueva York.</p>`);

await guardar('6W5tgAUCaM1w9lsSjA6Z', 'Fallece funcionario del MINSA tras colisión frontal en Carretera Norte', 'El funcionario del Ministerio de Salud Kener Efrén Velásquez falleció tras un accidente de tránsito en la Carretera Norte. El percance involucró un vehículo liviano y una unidad de carga.', `<p>Un funcionario del Ministerio de Salud falleció tras sufrir un accidente de tránsito registrado en la Carretera Norte de Managua, hecho que movilizó a las autoridades de tránsito y a los cuerpos de socorro de la capital.</p>

<h2>Detalles del percance vial</h2>

<p>El siniestro ocurrió durante las horas de la mañana en un tramo de la Carretera Norte, una de las principales arterias de circulación que conecta la ciudad de Managua con los departamentos del norte y centro del país. El funcionario del MINSA, identificado como Kener Efrén Velásquez, transitaba a bordo de su vehículo liviano cuando colisionó de forma frontal contra una unidad de carga pesada que circulaba en sentido contrario por el carril correspondiente.</p>

<p>Los impactos mecánicos de la colisión frontal deformaron severamente la estructura del vehículo liviano, quedando el funcionario atrapado en el interior de la cabina. Testigos presenciales del percance señalaron que el vehículo de carga intentó realizar una maniobra de adelantamiento en una zona de la carretera donde la visibilidad resultaba limitada por la presencia de una curva cerrada, invadiendo el carril contrario y provocando el impacto inevitable con el automóvil que transitaba en dirección opuesta.</p>

<h2>Intervención de socorristas y traslado</h2>

<p>Miembros de las brigadas de rescate del Cuerpo de Bomberos de Managua y paramédicos del servicio de emergencias médicas acudieron al lugar del accidente tras recibir la alerta de los testigos del percance. Los socorristas utilizaron equipos de extricación hidráulica para liberar el cuerpo del funcionario de los restos del vehículo, operación que requirió aproximadamente una hora debido a la complejidad de los daños estructurales en la unidad liviana.</p>

<p>El personal médico de emergencia confirmó el fallecimiento de Kener Efrén Velásquez en el sitio del accidente debido a la gravedad de las lesiones traumáticas sufridas durante el impacto. El cuerpo del funcionario fue trasladado hacia las instalaciones del Instituto de Medicina Legal para la realización de los procedimientos de autopsia y la entrega del certificado de defunción correspondiente a sus familiares.</p>

<h2>Reacciones institucionales</h2>

<p>El Ministerio de Salud emitió un comunicado de prensa en el que lamentó el fallecimiento del funcionario y expresó sus condolencias a la familia del occiso. La institución sanitaria señaló que Kener Efrén Velásquez se desempeñaba en funciones administrativas dentro del sistema de salud pública y que su labor contribuía de forma directa a los procesos de atención médica en la región central del país. El MINSA anunció que gestionará la entrega de los beneficios de seguridad social correspondientes a los familiares directos del trabajador fallecido.</p>

<p>Los representantes sindicales del sector salud solicitaron a las autoridades de tránsito la implementación de medidas de mitigación de riesgos en la Carretera Norte, señalando que este corredor vial registra una incidencia elevada de accidentes de tránsito con consecuencias fatales. Los sindicalistas propusieron la instalación de reductores de velocidad, señalización preventiva en curvas cerradas y el refuerzo de los controles de tránsito en las zonas de mayor riesgo de la vía.</p>

<h2>Condiciones de la vía y seguridad vial</h2>

<p>Los habitantes de las comunidades aledañas a la Carretera Norte señalaron que el tramo donde ocurrió el accidente presenta características que elevan el riesgo de colisiones frontales entre vehículos. La carretera cuenta con una sola vía de circulación en cada sentido sin separación física entre los carriles, lo que aumenta la probabilidad de impactos frontales cuando los conductores realizan maniobras de adelantamiento imprudentes en zonas de visibilidad reducida.</p>

<p>Especialistas en seguridad vial recomendaron a los conductores que transitan por la Carretera Norte respetar estrictamente los límites de velocidad establecidos, abstenerse de realizar adelantamientos en curvas cerradas o zonas de visibilidad obstruida, y mantener una distancia de seguridad adecuada con los vehículos que circulan en sentido contrario. El cumplimiento de estas normas de conducción preventiva reduce de forma significativa la incidencia de colisiones frontales en carreteras de doble carril.</p>

<p>Fuentes: Ministerio de Salud y Policía Nacional de Tránsito.</p>`);

console.log('=== Batch 7 completado ===');
