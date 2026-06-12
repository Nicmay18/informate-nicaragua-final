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

await guardar('gXTkMry6uueR9BxXcTdF', 'Dos mujeres fallecen tras el volcamiento de una embarcación en la barra de Krukira en el Caribe Norte', 'Una panga con cuatro tripulantes naufragó en la barra de Krukira, en el Caribe Norte de Nicaragua. El accidente dejó como saldo el deceso de dos mujeres, mientras que el capitán de la embarcación y un menor de tres años fueron rescatados con vida.', `<p>Cuatro personas naufragaron a bordo de una embarcación menor en la barra de Krukira, Región Autónoma de la Costa Caribe Norte, resultando en el deceso de dos ciudadanas.</p>

<h2>Detalles del grave hecho en Nicaragua</h2>

<p>El percance marítimo ocurrió la mañana del viernes 29 de mayo, cuando la panga bautizada con el nombre de "Cap. Disan D" inició su itinerario programado de navegación. Los tripulantes de la embarcación zarparon desde la comunidad de Kistawan, ubicada en el sector de Sandy Bay, con el propósito de trasladarse hacia los puntos de desembarque de tierra firme en la zona urbana de Bilwi.</p>

<p>Las evaluaciones iniciales del suceso indican que la tripulación enfrentó condiciones de fuerte oleaje al aproximarse a la barra de Krukira, un área geográfica ampliamente reconocida por su complejidad hidrográfica. Los pescadores y navegantes de la costa Caribe Norte señalan que este punto específico del litoral presenta variaciones imprevistas en la dirección y fuerza de las corrientes marinas, lo que incrementa la inestabilidad de las estructuras artesanales. Las ráfagas de viento registradas en la zona y el movimiento de las masas de agua desestabilizaron la panga, provocando el volcamiento completo de la estructura de madera en el agua profunda.</p>

<p>El ciudadano Kevin Brayan Thomas, de 35 años de edad, ejercía las funciones de capitán y responsable de la navegación de la embarcación menor durante el trayecto. Al registrarse el vuelco de la unidad, el operador logró maniobrar para mantenerse a flote sobre la superficie marina y asegurar la integridad de su hijo, el menor Aimar Jacobo, de tres años de edad, quien se encontraba dentro de la lista de pasajeros del viaje.</p>

<p>La fuerza de las corrientes submarinas arrastró a los otros dos miembros del núcleo familiar que viajaban en la misma panga. Las masas de agua alejaron de la zona de seguridad a la ciudadana Yahoska Wislat Catus, de 27 años, esposa del capitán, y a la señora Karlin Brayan Thomas, madre del conductor de la unidad de transporte acuático.</p>

<h2>Investigaciones en curso y estado judicial</h2>

<p>Tras estabilizarse en una zona segura, el capitán de la panga solicitó auxilio inmediato a los pobladores y pescadores que se encontraban en las cercanías del percance. La alerta fue comunicada con prontitud a las bases operativas de la Fuerza Naval del Ejército de Nicaragua, institución estatal que dispuso el despliegue inmediato de dos lanchas rápidas de intercepción con personal de rescate y buzos especializados hacia las coordenadas del naufragio.</p>

<p>Los miembros del cuerpo de rescate militar desarrollaron labores de búsqueda submarina y superficial durante varias horas continuas en el perímetro afectado de la barra de Krukira. Tras intensas maniobras de exploración en condiciones complejas por la baja visibilidad, los buzos navales localizaron y recuperaron los cuerpos sin vida de Yahoska Wislat Catus y Karlin Brayan Thomas, los cuales fueron trasladados de inmediato hacia la costa firme para iniciar los procedimientos forenses obligatorios determinados por la ley de la república.</p>

<p>El infante de tres años fue rescatado con vida y recibió asistencia médica de emergencia por parte de los servicios de salud pública asignados a la zona del Caribe Norte. Los habitantes de la comunidad de Sandy Bay Sirpi, lugar de residencia y origen de los tripulantes de la panga afectada, manifestaron su profunda sorpresa ante las dimensiones del acontecimiento, señalando que la supervivencia del menor bajo esas condiciones climáticas representa un suceso extraordinario. El padre del menor permanece recibiendo acompañamiento civil mientras se gestionan los trámites de sepelio de sus familiares.</p>

<h2>Regulaciones de navegación en el Caribe</h2>

<p>Especialistas en seguridad acuática y las autoridades de las capitanías de puerto reiteraron las advertencias respecto a los peligros que conlleva el tránsito por la barra de Krukira durante periodos de inestabilidad climática. Las autoridades recuerdan que este canal de comunicación marítima requiere de un conocimiento técnico avanzado y del monitoreo constante de los informes meteorológicos oficiales antes de proceder con el zarpe de lanchas o pangas de uso comercial o residencial.</p>

<p>El personal técnico del distrito naval recomienda a todos los operarios civiles evitar la sobrecarga de pasajeros o mercancías en las embarcaciones de menor calado para preservar los niveles óptimos de flotabilidad. Se enfatiza la obligatoriedad del uso individual de chalecos salvavidas para todos los pasajeros, una medida de protección indispensable para prevenir muertes por sumersión ante eventuales volcamientos en alta mar.</p>

<p>Las autoridades correspondientes iniciaron el levantamiento del informe técnico del accidente para determinar si la panga contaba con los permisos de navegación vigentes y los implementos mínimos exigidos por la ley de transporte marítimo nacional. Los testimonios de los comunitarios y de personas que presenciaron el inicio del trayecto mediante registros de video forman parte de los elementos bajo análisis para esclarecer el suceso en la Región Autónoma de la Costa Caribe Norte.</p>

<p>Fuentes: Fuerza Naval del Ejército de Nicaragua y reportes comunitarios de Sandy Bay.</p>`);

await guardar('yXELqcLI6Xh3Mcfe4cSp', 'Policía Nacional investiga el hallazgo de un cuerpo sin vida en una localidad de Telica', 'Las autoridades policiales de León iniciaron las investigaciones correspondientes tras registrarse el hallazgo del cuerpo sin vida de una persona no identificada en el municipio de Telica.', `<p>Fuerzas policiales iniciaron las investigaciones pertinentes tras el hallazgo del cuerpo sin vida de una persona en una zona rural del municipio de Telica, departamento de León.</p>

<p>El hallazgo ocurrió luego de que habitantes de las comunidades aledañas notificaran la presencia del cuerpo a las delegaciones policiales del sector. Los oficiales de la Policía Nacional se movilizaron de manera inmediata hacia el punto indicado por los ciudadanos para asegurar la escena del suceso, acordonar el perímetro y comenzar con el levantamiento de los primeros datos de interés criminalístico que permitan esclarecer el origen del acontecimiento.</p>

<h2>Detalles del grave hecho en León</h2>

<p>Al llegar al sitio del reporte, los agentes de seguridad pública confirmaron de forma oficial el hallazgo del cuerpo de la persona. Ante la naturaleza de la situación, las delegaciones municipales coordinaron el arribo de un equipo especializado integrado por peritos en criminalística y técnicos de investigación de campo, quienes se encargaron de realizar la inspección minuciosa del terreno, la recolección de indicios y la búsqueda de elementos materiales que aporten datos sobre la secuencia de acontecimientos en la localidad leonesa.</p>

<p>La presencia de las patrullas y del personal civil en el área llamó la atención de las familias del entorno, convirtiéndose el suceso en el centro de las conversaciones de la población local. Telica se caracteriza por ser una demarcación geográfica con baja incidencia de hechos delictivos complejos, razón por la cual la movilización institucional y el resguardo de la escena provocaron un incremento en el flujo de versiones vecinales sobre lo acontecido en esta área del occidente nicaragüense.</p>

<h2>Investigaciones en curso y estado judicial</h2>

<p>El cuerpo fue levantado por especialistas del Instituto de Medicina Legal, quienes procedieron con su traslado hacia las instalaciones forenses para la realización de la autopsia correspondiente según lo dictaminan los protocolos judiciales del país. Hasta el momento de emitir este informe, las autoridades de la Policía Nacional no han revelado la identidad de la persona ni han brindado detalles públicos sobre las causas exactas que provocaron el deceso del ciudadano.</p>

<p>La institución mantiene abiertas todas las líneas de investigación posibles para determinar si en el suceso existió la intervención de terceras personas o si las causas corresponden a factores de otra índole. Los investigadores del departamento de León se encuentran entrevistando a los habitantes de las propiedades cercanas al sitio del hallazgo con la finalidad de establecer un registro del movimiento de personas o vehículos durante las horas previas al reporte ciudadano.</p>

<p>Debido a que las características geográficas del municipio facilitan la rápida difusión de información entre los pobladores, las autoridades han instado a mantener la prudencia respecto a las especulaciones. La jefatura policial de la zona hizo un llamado formal a la población en general para que cualquier ciudadano que posea datos verídicos, rasgos de identificación o información relevante sobre el caso se comunique mediante las líneas de atención oficiales para colaborar con el esclarecimiento definitivo del hecho.</p>

<h2>Cooperación ciudadana y seguridad comunitaria</h2>

<p>Los residentes de las zonas cercanas al hallazgo indicaron que la documentación del suceso se realizó de manera inicial por las mismas personas de la comunidad utilizando los dispositivos tecnológicos de comunicación disponibles a su alcance. Un poblador de la localidad manifestó a la redacción que el evento causó atención entre las familias, quienes se mantuvieron atentas al desarrollo de las actividades operativas de los oficiales y registraron de forma visual la presencia institucional en el terreno.</p>

<p>Las organizaciones de seguridad civil y las autoridades locales recuerdan la importancia de canalizar las incidencias a través de las vías institucionales formales para asegurar el manejo correcto de la información de interés público. Se recomienda a la ciudadanía seguir atentamente las actualizaciones emitidas por las fuentes gubernamentales oficiales y abstenerse de difundir rumores no confirmados que puedan alterar el orden y la tranquilidad de las comunidades del municipio de Telica.</p>`);

console.log('=== Batch 2 completado ===');
