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

await guardar('vvWJAwyV8adECw3IGqdy', 'Netflix, Max y Disney+ lideran el mercado de streaming en Nicaragua impulsados por el consumo juvenil', 'Netflix, Max y Disney+ dominan el mercado de streaming en Nicaragua. El consumo se concentra en jóvenes de 18 a 35 años que prefieren plataformas internacionales por su variedad de contenido.', `<p>Las plataformas digitales de entretenimiento por suscripción Netflix, Max y Disney+ consolidan su posición como las principales opciones de consumo audiovisual en el mercado nicaragüense, impulsadas por la dinámica de preferencias de los usuarios jóvenes.</p>

<h2>Preferencias de consumo y perfiles de usuarios</h2>

<p>Un análisis de las estadísticas de suscripción activa y consumo de horas de reproducción revela que el segmento demográfico de 18 a 35 años constituye el núcleo principal de usuarios de estas plataformas internacionales dentro del territorio nacional. Los jóvenes nicaragüenses priorizan la flexibilidad horaria de consumo y el acceso a bibliotecas de contenido que abarcan desde producciones cinematográficas de estreno hasta series documentales de alta factura técnica.</p>

<p>Los datos de tráfico de internet confirman que los horarios de mayor actividad en las plataformas se concentran entre las 7:00 de la noche y las 12:00 de la medianoche, periodo en el que los usuarios acceden al contenido desde dispositivos móviles, televisores inteligentes y equipos de computación personal. El modelo de negocio basado en suscripción mensual ha logrado adaptarse a la realidad económica de diferentes estratos sociales mediante la oferta de planes de costos diferenciados que permiten compartir las credenciales de acceso entre miembros de un mismo núcleo familiar.</p>

<h2>Competencia y posicionamiento de mercado</h2>

<p>Netflix mantiene la posición de liderazgo absoluto dentro del mercado local de streaming, beneficiándose de una estrategia de producción de contenido propio en múltiples idiomas y de la consolidación de franquicias audiovisuales de reconocimiento internacional. La plataforma de origen estadounidense reporta la mayor cantidad de suscripciones activas en Nicaragua y la tasa de retención de usuarios más alta entre las tres compañías evaluadas.</p>

<p>La plataforma Max, producto de la fusión corporativa de contenidos de entretenimiento y cinematográficos, ha logrado posicionarse en el segundo lugar de preferencias mediante el aprovechamiento de su extensa biblioteca de producciones de Hollywood y de series de televisión de alto impacto cultural. Los usuarios nicaragüenses valoran de forma particular el acceso al catálogo de películas recientes y a los documentales de producción premium que integran el portafolio de la empresa.</p>

<p>Disney+ ocupa el tercer escalón del ranking de consumo, sustentado en el poder de atracción de sus universos de franquicia como Marvel, Star Wars y Pixar, además de contenido familiar orientado a públicos infantiles y adolescentes. La plataforma ha experimentado un crecimiento sostenido en suscripciones desde su lanzamiento en el mercado centroamericano, logrando captar audiencias multigeneracionales que buscan alternativas de entretenimiento seguro para el consumo en familia.</p>

<h2>Infraestructura de conectividad y acceso</h2>

<p>El desarrollo del mercado de streaming en Nicaragua se sustenta en la expansión de la infraestructura de telecomunicaciones y del acceso a internet de banda ancha en las principales ciudades del país. Los proveedores de servicios de conectividad han ampliado la cobertura de sus redes hacia departamentos que anteriormente registraban limitaciones técnicas para el consumo de contenido en alta definición, permitiendo la democratización del acceso a las plataformas digitales.</p>

<p>Las empresas de telecomunicaciones han desarrollado paquetes comerciales específicos que integran el acceso a plataformas de streaming como beneficio adicional dentro de sus planes de servicio de internet residencial. Esta estrategia comercial ha facilitado la adopción de servicios de entretenimiento digital entre familias que anteriormente dependían exclusivamente de la televisión tradicional por señal abierta o por suscripción de cable.</p>

<h2>Tendencias y proyecciones del sector</h2>

<p>Especialistas del sector de telecomunicaciones proyectan que el mercado de streaming continuará su expansión en el territorio nicaragüense durante los próximos años, impulsado por la digitalización de los hábitos de consumo cultural y el acceso creciente a dispositivos tecnológicos de última generación. La competencia entre plataformas se intensificará con la probable llegada de nuevos servicios de suscripción que buscarán posicionarse en el mercado centroamericano.</p>

<p>Los analistas de mercado señalan que el éxito de las plataformas dependerá de su capacidad para generar contenido localizado que resuene con las identidades culturales latinoamericanas. La inversión en producciones originales en español y la adquisición de derechos de transmisión de eventos deportivos de alto interés para la población nicaragüense se perfilan como las estrategias clave para la retención de usuarios en el mediano plazo.</p>

<p>Fuentes: reportes de consumo digital y análisis de mercado de telecomunicaciones.</p>`);

await guardar('DuaMg4XI8aPmAHw8otN1', 'Accidente de tránsito en Puente Muco deja un fallecido y un herido grave en Boaco', 'Un accidente de tránsito registrado en el puente de la comunidad Muco, en el departamento de Boaco, dejó como saldo una persona fallecida y otra con lesiones graves. Las autoridades investigan las causas del percance.', `<p>Un accidente de tránsito registrado en la estructura vial de la comunidad conocida como Puente Muco, ubicada en el departamento de Boaco, dejó como saldo una persona fallecida y otra con lesiones de gravedad que requieren atención médica especializada.</p>

<h2>Detalles del siniestro vial</h2>

<p>El percance ocurrió durante la mañana del viernes 30 de mayo, cuando una motocicleta que transitaba en dirección hacia el casco urbano del municipio de Boaco perdió el control sobre la superficie de la estructura del puente. La unidad de dos ruedas se deslizó de forma imprevista sobre la carpeta asfáltica, provocando que el conductor y el pasajero que lo acompañaba fueran eyectados del vehículo motorizado hacia la zona de rodamiento.</p>

<p>El impacto contra el pavimento y la posible colisión con los elementos estructurales de contención del puente ocasionaron traumatismos severos en ambos ocupantes de la motocicleta. Los cuerpos de socorro que arribaron al lugar del siniestro confirmaron el deceso de uno de los tripulantes en el sitio del accidente debido a la gravedad de las lesiones internas y craneoencefálicas sufridas durante el evento. El segundo ocupante fue estabilizado en la escena y trasladado de urgencia hacia el hospital regional de Boaco para su valoración médica integral.</p>

<h2>Condiciones de la vía y factores de riesgo</h2>

<p>Habitantes de la zona y usuarios frecuentes del corredor vial señalaron que la estructura del puente de la comunidad Muco presenta características que incrementan el riesgo de accidentalidad para los conductores de vehículos de dos ruedas. La superficie de rodamiento de la estructura acumula residuos de polvo, grasa y materiales de desgaste que reducen la adherencia de los neumáticos, especialmente durante las primeras horas de la mañana cuando se registran condiciones de humedad ambiental.</p>

<p>La falta de señalización preventiva en los accesos al puente y la ausencia de reductores de velocidad en las cercanías de la estructura vial fueron identificadas por los pobladores como elementos que contribuyen a la elevada velocidad de tránsito de las unidades motorizadas. Los conductores que no conocen las características específicas del tramo abordan la estructura a velocidades que dificultan la reacción de frenado ante cualquier imprevisto mecánico o de superficie.</p>

<h2>Intervención de autoridades</h2>

<p>Los efectivos de la Policía Nacional de Tránsito se presentaron al lugar del accidente para asegurar la escena, desviar el flujo vehicular hacia rutas alternas y realizar el levantamiento de los datos preliminares del percance. Los agentes tomaron declaraciones a los testigos presenciales del hecho y registraron las condiciones mecánicas de la motocicleta involucrada para determinar si existió alguna falla técnica que contribuyera a la pérdida de control de la unidad.</p>

<p>El cuerpo del fallecido fue trasladado hacia las instalaciones del Instituto de Medicina Legal para la realización de los procedimientos de autopsia y determinación de la causa precisa del deceso. Los familiares del occiso iniciaron los trámites correspondientes para la gestión del certificado de defunción y los documentos requeridos para los servicios de sepelio en el departamento de Boaco.</p>

<h2>Medidas preventivas recomendadas</h2>

<p>Especialistas en seguridad vial y representantes de la comunidad de Puente Muco solicitaron a las autoridades municipales y departamentales la implementación de medidas de mitigación de riesgos en la infraestructura del puente. Entre las propuestas se encuentra la instalación de señalización horizontal y vertical de advertencia, la colocación de reductores de velocidad en los accesos a la estructura y la ejecución de campañas de sensibilización para los conductores de motocicletas sobre los riesgos específicos de este tramo vial.</p>

<p>La Dirección de Tránsito Nacional recordó a los ciudadanos la obligatoriedad del uso de casco de protección certificado tanto para el conductor como para el pasajero de las unidades de dos ruedas. El cumplimiento de esta normativa de seguridad reduce de forma significativa la gravedad de las lesiones craneoencefálicas en caso de accidentes de tránsito, constituyendo una medida de protección individual indispensable para la preservación de la vida.</p>

<p>Fuentes: Policía Nacional de Tránsito y reportes médicos del Hospital de Boaco.</p>`);

console.log('=== Batch 4 completado ===');
