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

await guardar('H8jrdHS4iXfFEAE2R0D9', 'Autoridades investigan fallecimientos violentos en Chontales y en la zona de Managua', 'Dos hombres fallecieron en circunstancias de violencia en Chontales y Managua. Las autoridades policiales y forenses investigan los hechos para determinar las causas de los decesos.', `<p>Dos ciudadanos fallecieron en circunstancias que las autoridades investigan como eventos de violencia en los departamentos de Chontales y Managua, activándose los protocolos judiciales y forenses correspondientes en ambas demarcaciones.</p>

<h2>Caso en el departamento de Chontales</h2>

<p>El primer hecho ocurrió en el municipio de Santo Domingo, ubicado en el departamento de Chontales, donde fue hallado sin vida el ciudadano Hernaldo Iván Hernández. El cuerpo del hombre fue localizado en una zona rural de la demarcación por familiares que iniciaron su búsqueda tras notar su ausencia durante las horas previas al hallazgo. Los familiares manifestaron a las autoridades policiales que Hernaldo Iván Hernández se desempeñaba como trabajador agrícola y que se encontraba en aparente buen estado de salud antes de su desaparición.</p>

<p>Los agentes de la Policía Nacional se desplazaron al lugar del hallazgo para realizar el acordonamiento de la escena y recolectar los primeros indicios de interés criminalístico. Los peritos del Instituto de Medicina Legal procedieron al levantamiento del cuerpo y su traslado hacia las instalaciones forenses para la realización de la autopsia correspondiente. Los primeros exámenes visuales determinaron la presencia de lesiones externas compatibles con agresión física, por lo que la investigación se orienta hacia la hipótesis de un homicidio.</p>

<h2>Incidente en la capital</h2>

<p>El segundo caso se registró en la ciudad de Managua, específicamente en el barrio de Sabana Grande, uno de los sectores de alta densidad poblacional del distrito tres de la capital. El ciudadano José Daniel Zelaya fue encontrado sin vida en el interior de una vivienda del sector, generando la movilización de las patrullas policiales del distrito. Vecinos del barrio señalaron que escucharon ruidos de discusión durante la madrugada previa al hallazgo, lo que motivó la presentación de la denuncia ante las autoridades.</p>

<p>Los investigadores de la Policía Nacional realizaron entrevistas a los habitantes de las viviendas colindantes y levantaron indicios materiales en la escena del suceso. El cuerpo de la víctima fue trasladado al Instituto de Medicina Legal de Managua, donde los médicos legistas realizaron los estudios post mortem de rigor. Hasta el momento de la emisión de este informe, las autoridades no han revelado detalles sobre las posibles causas del deceso ni sobre identificación de sospechosos.</p>

<h2>Investigaciones policiales en curso</h2>

<p>La Dirección de Investigación Criminal de la Policía Nacional mantiene abiertos los expedientes de investigación de ambos casos, a la espera de los resultados de los estudios forenses que permitan establecer las causas certificadas de los fallecimientos. Los investigadores señalaron que en eventos de violencia con resultado de muerte es necesario descartar de forma rigurosa todas las hipótesis operativas antes de emitir conclusiones definitivas sobre la naturaleza de los hechos.</p>

<p>Los familiares de ambas víctimas solicitaron celeridad en los procesos de investigación para esclarecer las circunstancias en que ocurrieron los decesos de sus seres queridos. Los investigadores indicaron que la recopilación de testimonios de personas cercanas a las víctimas constituye una de las principales líneas de trabajo para determinar las dinámicas previas a los hechos y establecer posibles móviles que orienten la investigación criminal.</p>

<h2>Contexto de seguridad ciudadana</h2>

<p>Especialistas en criminología señalaron que la incidencia de hechos de violencia con resultado de muerte en zonas rurales y urbanas requiere de una respuesta institucional coordinada entre la Policía Nacional, el Ministerio Público y los organismos de salud forense. Los expertos recomendaron fortalecer los mecanismos de patrullaje preventivo en las comunidades con alta incidencia de denuncias por altercados y conflictos interpersonales que puedan escalar a eventos de violencia extrema.</p>

<p>Las autoridades locales de Chontales y Managua hicieron un llamado a la población para que denuncie de forma inmediata cualquier situación de violencia o amenaza mediante las líneas de emergencia disponibles. La denuncia oportuna permite a las instituciones de seguridad intervenir antes de que los conflictos personales escalen a consecuencias fatales, preservando la vida e integridad de los ciudadanos.</p>

<p>Fuentes: Policía Nacional de Nicaragua y Ministerio Público.</p>`);

await guardar('ect24qCFMfiygezE3j9D', 'Investigan fallecimiento violenta de joven en Santo Domingo, Chontales', 'Un joven fue hallado sin vida en una zona rural del municipio de Santo Domingo, en el departamento de Chontales. Las autoridades forenses realizan los estudios correspondientes para determinar las causas del deceso.', `<p>Un joven fue encontrado sin vida en una zona rural del municipio de Santo Domingo, departamento de Chontales, activándose los protocolos de investigación policial y forense para determinar las causas exactas del deceso.</p>

<h2>Hallazgo en zona rural de Chontales</h2>

<p>El cuerpo del joven fue localizado en horas de la madrugada por pobladores de una finca agrícola ubicada en las cercanías del casco urbano de Santo Domingo. Los campesinos que realizaban labores de madrugada en los terrenos de cultivo detectaron la presencia del cuerpo en un área de difícil acceso del predio y dieron aviso de inmediato a las autoridades policiales del municipio. Los primeros datos recabados en la escena indican que el cuerpo presentaba signos de violencia física externa.</p>

<p>Los agentes de la Policía Nacional acordonaron el perímetro del hallazgo y solicitaron la presencia de los peritos del Instituto de Medicina Legal para realizar el levantamiento del cuerpo y la recolección de indicios materiales en el terreno. Los investigadores señalaron que la ubicación del cuerpo en una zona de propiedad privada agrícola sugiere que el hecho podría estar relacionado con conflictos de linderos, disputas laborales o situaciones personales que deben ser corroboradas durante la etapa de indagación.</p>

<h2>Investigación forense y judicial</h2>

<p>El cuerpo del joven fue trasladado a las instalaciones del Instituto de Medicina Legal de Juigalpa, cabecera del departamento de Chontales, para la realización de los estudios de autopsia y toxicología de rigor. Los médicos legistas determinarán la causa precisa de la muerte mediante el análisis de las lesiones presentes en el cuerpo y los resultados de los exámenes de laboratorio. Hasta el momento de la emisión de este informe, la identidad completa de la víctima se mantiene bajo reserva a solicitud de sus familiares.</p>

<p>La Fiscalía Especializada en Delitos de Violencia del Ministerio Público asumió la dirección de la investigación para establecer si el deceso corresponde a un homicidio doloso, un hecho de violencia interpersonal o un evento de otra índole. Los fiscales señalaron que la investigación se encuentra en su etapa inicial y que se requiere de la recopilación de testimonios, análisis de indicios y evaluación de la escena para formular conclusiones preliminares sobre la naturaleza del hecho.</p>

<h2>Reacciones de la comunidad</h2>

<p>Los pobladores de Santo Domingo y de las comunidades rurales aledañas manifestaron su preocupación por el registro de hechos violentos en la zona, señalando que el municipio se caracteriza tradicionalmente por mantener índices bajos de criminalidad en comparación con otras demarcaciones del país. Los habitantes solicitaron a las autoridades policiales el refuerzo del patrullaje en las zonas rurales y el establecimiento de puestos de vigilancia en las rutas de acceso a las fincas agrícolas del sector.</p>

<p>Los líderes comunitarios de la zona se reunieron con representantes de la Policía Nacional para coordinar acciones de prevención y colaboración ciudadana. Se acordó la implementación de un sistema de alerta temprana entre los pobladores de las fincas colindantes para reportar la presencia de personas extrañas o vehículos sospechosos en horarios inusuales, fortaleciendo la red de vigilancia comunitaria en el área rural del municipio.</p>

<h2>Medidas de prevención en zonas rurales</h2>

<p>Especialistas en seguridad ciudadana recomendaron a los pobladores de zonas rurales implementar medidas básicas de protección patrimonial y personal, como el registro de visitantes en los predios agrícolas, la instalación de cercas perimetrales en zonas de acceso y el mantenimiento de comunicación constante con las patrullas policiales asignadas al sector. La organización comunitaria se perfila como el elemento fundamental para la prevención de hechos de violencia en áreas de baja densidad poblacional.</p>

<p>Las autoridades departamentales de Chontales anunciaron la asignación de recursos adicionales para el fortalecimiento de la presencia policial en las zonas rurales del departamento durante los próximos meses. La iniciativa busca disuadir la presencia de delincuentes en las áreas agrícolas y garantizar la seguridad de los trabajadores del campo que realizan sus labores en horarios extendidos y en predios de difícil acceso para los servicios de emergencia.</p>

<p>Fuentes: Policía Nacional de Chontales y Ministerio Público.</p>`);

console.log('=== Batch 8 completado ===');
