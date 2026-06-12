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

await guardar('YMhZnFxcC1LINNtptLYL', 'Autoridades sanitarias y forenses analizan fallecimientos repentinos registrados en Managua y León', 'Dos personas fallecieron de forma repentina en Managua y León. Las autoridades sanitarias y forenses investigan las causas de los decesos ocurridos en circunstancias similares.', `<p>Dos ciudadanos fallecieron de forma repentina en circunstancias que las autoridades sanitarias y forenses se encuentran analizando para determinar las causas exactas de los decesos registrados en las ciudades de Managua y León.</p>

<h2>Primer caso en Managua</h2>

<p>El primer deceso ocurrió en la capital nicaragüense, donde el ciudadano Carlos Manuel Villanueva, de 55 años de edad, fue encontrado sin vida en el interior de su vivienda ubicada en el barrio San Judas, una de las zonas de mayor densidad poblacional del distrito uno de Managua. Familiares del occiso manifestaron a las autoridades que el hombre se encontraba en aparente buen estado de salud durante las horas previas al fallecimiento y que no presentaba síntomas visibles de enfermedad aguda que justificaran una intervención médica de urgencia.</p>

<p>Los vecinos del sector señalaron que Carlos Manuel Villanueva se desempeñaba como comerciante informal en los alrededores del mercado municipal de su barrio, actividad económica que desarrollaba desde hacía más de dos décadas. Los familiares notificaron el deceso a las autoridades policiales locales, quienes se presentaron al domicilio para realizar el levantamiento del cuerpo y coordinar su traslado hacia las instalaciones del Instituto de Medicina Legal para la realización de los estudios de autopsia correspondientes.</p>

<h2>Segundo caso en León</h2>

<p>El segundo fallecimiento se reportó en el departamento de León, donde la ciudadana Ángela Sánchez, de 62 años de edad, fue hallada sin vida en su residencia particular del barrio Sutiava, uno de los sectores históricos de la ciudad colonial. Los familiares de la víctima indicaron que la mujer padecía de condiciones de salud preexistentes relacionadas con la hipertensión arterial, pero que hasta el momento del deceso se encontraba bajo tratamiento médico ambulatorio y cumpliendo con las indicaciones farmacológicas prescritas.</p>

<p>El cuerpo de la ciudadana fue trasladado por personal del servicio forense hacia las instalaciones del Instituto de Medicina Legal de León, donde los médicos legistas procedieron con la realización de los exámenes post mortem de rigor. Los primeros informes técnicos no revelaron signos externos de violencia que indiquen la intervención de terceras personas en el deceso de la mujer, manteniendo abiertas las líneas de investigación médica para determinar la causa biológica precisa del fallecimiento.</p>

<h2>Investigaciones forenses en curso</h2>

<p>El Instituto de Medicina Legal mantiene abiertos los expedientes de investigación de ambos casos, a la espera de los resultados definitivos de los estudios toxicológicos y de histopatología que permitan establecer las causas certificadas de los decesos. Los médicos legistas indicaron que en situaciones de muerte súbita en personas adultas mayores es necesario descartar de forma rigurosa eventos cardiovasculares agudos, complicaciones metabólicas severas y reacciones adversas a medicamentos que pudieran haber contribuido al desenlace fatal.</p>

<p>Las familias de ambos fallecidos solicitaron celeridad en la entrega de los resultados de los estudios forenses para poder proceder con los trámites administrativos correspondientes al registro de defunción y los servicios funerarios. Los familiares manifestaron que la demora en la obtención de los dictámenes médicos complica la gestión de documentos necesarios para la realización de los actos de sepelio y la tramitación de posibles beneficios de seguridad social.</p>

<h2>Panorama de salud pública</h2>

<p>Especialistas en medicina interna señalaron que los fallecimientos de carácter repentino en personas adultas mayores constituyen un fenómeno de atención prioritaria para los sistemas de salud pública, dado que pueden estar asociados a enfermedades crónicas no diagnosticadas, factores de riesgo cardiovascular no controlados o afectaciones multisistémicas que evolucionan de forma silente hasta provocar un evento terminal.</p>

<p>Los profesionales de la salud recomendaron a la población en general, especialmente a los adultos mayores y a personas con antecedentes de enfermedades crónicas, mantener controles médicos periódicos y acudir de inmediato a los centros de salud ante la aparición de síntomas como dolor torácico severo, dificultad respiratoria repentina, desmayos o alteraciones del estado de conciencia. La detección temprana de condiciones de riesgo permite implementar intervenciones médicas que pueden prevenir eventos fatales en la población vulnerable.</p>

<p>Fuentes: Instituto de Medicina Legal y autoridades de salud de Managua y León.</p>`);

await guardar('sH5OCUULzSvZFhRcHXzb', 'Operativo antidrogas en zona fronteriza de Honduras culmina con múltiples bajas en fuerzas de seguridad', 'Seis policías hondureños fallecieron durante un operativo antidrogas en una zona fronteriza de Honduras. La institución de seguridad confirmó el deceso de sus agentes en combate.', `<p>Un operativo de interdicción antidrogas desarrollado en una zona de frontera de la república de Honduras culminó con el deceso de seis agentes policiales que participaban en la acción de combate contra estructuras del narcotráfico internacional.</p>

<h2>Desarrollo del operativo militar y policial</h2>

<p>La operación se ejecutó en una zona selvática de difícil acceso ubicada en la región fronteriza de Honduras, territorio frecuentemente utilizado por organizaciones de narcotráfico para el tránsito de cargamentos de droga hacia países de Centroamérica y Norteamérica. Los agentes de la Dirección Policial Anti Maras y Pandillas Contra el Crimen Organizado, conocida por sus siglas DIPAMPCO, recibieron información de inteligencia sobre la presencia de un campamento de operaciones de grupos criminales en la zona.</p>

<p>Los seis agentes que fallecieron en el desarrollo del operativo fueron identificados por las autoridades hondureñas como miembros activos de las fuerzas especiales de interdicción. Los uniformados se desplazaron hacia la zona objetivo en vehículos todo terreno y a pie a través de terrenos montañosos, enfrentándose a una emboscada preparada por los integrantes de la estructura criminal que se encontraba alertada sobre la incursión policial en el área. El enfrentamiento armado se prolongó durante varias horas en condiciones de visibilidad reducida por la densa cobertura vegetal del terreno.</p>

<h2>Identificación de los agentes fallecidos</h2>

<p>Las autoridades de seguridad de Honduras confirmaron la identidad de los seis agentes caídos en cumplimiento del deber mediante un comunicado oficial emitido por la Secretaría de Seguridad del país centroamericano. Entre los fallecidos se encuentra el suboficial Lester Josué Amador, quien se desempeñaba como coordinador operativo de una de las unidades de elite de la institución policial. Los demás agentes fallecidos integraban el equipo de apoyo táctico asignado a la misión de interdicción.</p>

<p>Los cuerpos de los agentes fueron trasladados desde la zona del enfrentamiento hacia las instalaciones de la morgue institucional en la capital de Honduras, donde se realizaron los procedimientos de identificación forense y autopsia de rigor. El gobierno hondureño decretó tres días de duelo nacional en honor a los agentes caídos y anunció la condecoración póstuma de los seis policías con la medalla al valor en servicio de la institución de seguridad.</p>

<h2>Reacciones institucionales en Honduras</h2>

<p>El presidente de la república de Honduras ofreció una conferencia de prensa en la que condenó el ataque contra los agentes de seguridad y reiteró el compromiso del gobierno central en la lucha frontal contra el narcotráfico y las organizaciones criminales transnacionales. El mandatario anunció el refuerzo de los operativos de interdicción en las zonas fronterizas con la asignación de recursos adicionales para las unidades de combate y la implementación de nuevas tecnologías de vigilancia aérea y terrestre.</p>

<p>El director de la DIPAMPCO manifestó que el operativo formaba parte de una estrategia de interdicción sostenida contra los puntos de acopio de droga ubicados en la franja fronteriza del país. La institución policial reiteró que continuará con las acciones de combate contra el narcotráfico pese a los riesgos operativos, señalando que el sacrificio de los agentes caídos fortalece la determinación de la corporación para desmantelar las estructuras criminales que operan en territorio hondureño.</p>

<h2>Cooperación regional en seguridad</h2>

<p>El suceso generó reacciones de condena y solidaridad por parte de los gobiernos de los países centroamericanos, incluyendo Nicaragua, que mantienen convenios de cooperación en materia de seguridad con la república de Honduras. Los ministros de seguridad de la región expresaron su compromiso para fortalecer los mecanismos de intercambio de información de inteligencia y la coordinación de operativos binacionales en las zonas limítrofes compartidas.</p>

<p>Especialistas en seguridad regional señalaron que la violencia contra las fuerzas del orden en zonas de frontera refleja la creciente sofisticación de las organizaciones criminales que operan en Centroamérica. Los analistas recomendaron la implementación de estrategias de inteligencia predictiva, el fortalecimiento de los controles aduaneros y la asignación de recursos técnicos para la interdicción de cargamentos de droga en las rutas terrestres y marítimas de la región.</p>

<p>Fuentes: Secretaría de Seguridad de Honduras y DIPAMPCO.</p>`);

console.log('=== Batch 6 completado ===');
