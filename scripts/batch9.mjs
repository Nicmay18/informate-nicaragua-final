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

await guardar('dgjsES2KHZ3AFaGHIoLt', 'Investigan hallazgo de cuerpo sin vida en sector rural de Muy Muy, Matagalpa', 'Las autoridades policiales de Matagalpa investigan el hallazgo de un cuerpo sin vida en una zona rural del municipio de Muy Muy. Se desconocen las causas del deceso.', `<p>Las autoridades policiales del departamento de Matagalpa iniciaron una investigación tras el hallazgo del cuerpo sin vida de una persona en una zona rural del municipio de Muy Muy, ubicado en la región central de Nicaragua.</p>

<h2>Hallazgo en zona rural</h2>

<p>El cuerpo fue localizado por agricultores que transitaban por un sendero rural en las cercanías de una finca de cultivo de la zona, quienes dieron aviso de inmediato a las delegaciones policiales del municipio. Los campesinos señalaron que la presencia del cuerpo en el lugar resultaba inusual, dado que la zona se caracteriza por su baja densidad de población y la ausencia histórica de hechos de violencia similar.</p>

<p>Los agentes de la Policía Nacional de Muy Muy se desplazaron al lugar del hallazgo para realizar el acordonamiento del perímetro y preservar los indicios materiales que pudieran aportar datos sobre la identidad de la persona y las circunstancias de su deceso. Los oficiales señalaron que la escena presentaba condiciones complejas para el levantamiento de evidencias debido a la exposición del cuerpo a las condiciones climáticas del entorno rural.</p>

<h2>Investigación forense</h2>

<p>Los peritos del Instituto de Medicina Legal de Matagalpa procedieron con el traslado del cuerpo hacia las instalaciones forenses de la ciudad de Matagalpa para la realización de los estudios de autopsia correspondientes. Los primeros exámenes visuales no revelaron de forma concluyente signos externos de violencia que determinen la naturaleza del deceso, por lo que los médicos legistas solicitaron la realización de estudios toxicológicos y de histopatología para establecer la causa biológica precisa del fallecimiento.</p>

<p>La Policía Nacional mantiene abiertas las líneas de investigación que consideran diferentes hipótesis sobre el origen del deceso, incluyendo la posibilidad de muerte por causas naturales en una persona que se encontraba en tránsito por la zona rural, un evento de violencia interpersonal o un accidente no detectado. Los investigadores señalaron que la identificación de la víctima es un paso fundamental para orientar las pesquisas hacia el esclarecimiento del caso.</p>

<h2>Búsqueda de identidad</h2>

<p>Las autoridades forenses iniciaron los trámites de identificación del cuerpo mediante el registro de características físicas, huellas dactilares y la revisión de reportes de personas desaparecidas en los departamentos de Matagalpa y zonas aledañas. Los familiares de personas reportadas como desaparecidas en las últimas semanas fueron convocados a las instalaciones del Instituto de Medicina Legal para colaborar en los procesos de identificación forense.</p>

<p>La Policía Nacional solicitó a la población de Muy Muy y de los municipios vecinos que cualquier persona con información sobre la identidad de la víctima o sobre circunstancias relacionadas con el hallazgo se comunique con las delegaciones policiales del departamento. La cooperación ciudadana se perfila como un elemento esencial para avanzar en la investigación de casos de personas fallecidas en circunstancias no determinadas en zonas rurales del país.</p>

<h2>Seguridad en zonas rurales de Matagalpa</h2>

<p>Especialistas en seguridad ciudadana señalaron que los hallazgos de cuerpos en zonas rurales presentan desafíos técnicos adicionales para las investigaciones debido a la dispersión geográfica de las comunidades, las limitaciones de comunicación en terrenos montañosos y la exposición de las evidencias a los elementos naturales. Los expertos recomendaron fortalecer los puestos policiales en las zonas rurales de Matagalpa para garantizar tiempos de respuesta más breves ante reportes ciudadanos.</p>

<p>Los líderes comunitarios de Muy Muy expresaron su preocupación por el registro del hecho y solicitaron a las autoridades departamentales el refuerzo del patrullaje en las fincas y senderos rurales del municipio. Se acordó la implementación de un sistema de vigilancia vecinal entre los agricultores de la zona para reportar actividades sospechosas y fortalecer la coordinación con las instancias de seguridad pública del departamento de Matagalpa.</p>

<p>Fuentes: Policía Nacional de Matagalpa y Instituto de Medicina Legal.</p>`);

console.log('=== Batch 9 completado ===');
