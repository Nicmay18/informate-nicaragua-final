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

await guardar('aFK0buUKVMKOICj3gVvA', 'Condenan a 30 años de prisión al autor de feminicidio registrado en el municipio de Telica', 'El Juzgado de Violencia de León dictó sentencia condenatoria de 30 años de cárcel contra Francisco Javier Ríos Duarte por el delito de feminicidio contra la ciudadana Romelia González, ocurrido en Telica.', `<p>El Juzgado de Violencia del departamento de León dictó sentencia condenatoria de 30 años de prisión contra el ciudadano Francisco Javier Ríos Duarte tras declararlo culpable del delito de feminicidio en perjuicio de la víctima Romelia González, hecho ocurrido en el municipio de Telica.</p>

<h2>Desarrollo del proceso judicial</h2>

<p>El proceso penal se inició tras la presentación formal de la denuncia por parte de los familiares de la víctima ante las delegaciones de la Policía Nacional del departamento de León. Las investigaciones preliminares permitieron establecer que el suceso ocurrió en una vivienda particular del municipio de Telica, donde la víctima y el agresor mantenían una relación de pareja. Los peritos del Instituto de Medicina Legal determinaron que la causa de muerte fue estrangulación mecánica, confirmando la existencia de violencia física previa al deceso.</p>

<p>Durante la etapa de instrucción judicial, el Ministerio Público presentó pruebas testimoniales, peritajes de criminalística y documentación médica que sustentaron la tesis de la acusación. El tribunal valoró como elementos de convicción los informes forenses que determinaron la presencia de signos de estrangulación en el cuerpo de la víctima, así como las declaraciones de testigos que presenciaron episodios de violencia previos en la relación de pareja. La defensa del imputado no logró desvirtuar los cargos presentados por la fiscalía durante el desarrollo del juicio oral.</p>

<h2>Sentencia y reparación del daño</h2>

<p>El Juzgado de Violencia dictó la pena máxima establecida en la legislación nicaragüense para el delito de feminicidio, consistente en 30 años de privación de libertad. La sentencia incluye además la prohibición de acercamiento a los familiares de la víctima por el tiempo que dure la condena. El tribunal ordenó al condenado la realización de pagos económicos por concepto de reparación del daño material y moral a favor de los hijos menores de edad que la víctima dejó al momento de su deceso.</p>

<p>Los jueces establecieron en la parte resolutiva de la sentencia que el agresor deberá cumplir la pena en un centro penitenciario de máxima seguridad del sistema carcelario nacional. La defensa técnica del condenado anunció que evaluará la posibilidad de interponer los recursos de apelación correspondientes ante la instancia superior de la Corte de Apelaciones del distrito judicial de León, aunque los analistas jurídicos señalan que las pruebas presentadas durante el juicio son sólidas y difíciles de revertir.</p>

<h2>Reacciones de organizaciones civiles</h2>

<p>Organizaciones de mujeres y colectivos de derechos humanos celebraron la emisión de la sentencia condenatoria, señalando que la resolución judicial establece un precedente relevante en la lucha contra la impunidad en casos de violencia de género en el territorio nacional. Las activistas manifestaron que la condena de 30 años de prisión refleja el compromiso del sistema de justicia para sancionar con la máxima severidad los delitos cometidos contra la vida e integridad de las mujeres.</p>

<p>Las representantes de las organizaciones civiles solicitaron a las autoridades judiciales mantener la transparencia en la ejecución de la pena y garantizar que el condenado cumpla íntegramente la condena impuesta. Asimismo, exhortaron al Ministerio de la Familia a fortalecer los programas de prevención de la violencia de género en las comunidades rurales del departamento de León, donde se registra una incidencia significativa de hechos de violencia intrafamiliar.</p>

<h2>Contexto estadístico de violencia de género</h2>

<p>Los datos estadísticos de la Policía Nacional y del Ministerio de la Familia indican que el departamento de León se encuentra entre las demarcaciones con mayor incidencia de denuncias por violencia intrafamiliar en el país. Especialistas en derechos humanos señalan que la condena dictada en este caso específico podría funcionar como un mecanismo disuasorio para potenciales agresores, siempre y cuando se mantenga la celeridad procesal en la investigación y sanción de casos similares.</p>

<p>Las autoridades locales de Telica instaron a la población a denunciar de forma inmediata cualquier indicio de violencia de género mediante las líneas de atención de emergencia disponibles las 24 horas del día. La comunicación oportuna de las agresiones permite a las instituciones del Estado activar los protocolos de protección para las víctimas y prevenir situaciones que puedan derivar en consecuencias fatales como la registrada en este proceso judicial.</p>

<p>Fuentes: Juzgado de Violencia de León y Ministerio Público.</p>`);

await guardar('ZTVWiR99Nppa5L2P4wT1', 'Siniestro estructural afecta tramo comercial en el sector central del Mercado Oriental', 'Un incendio de magnitud afectó un puesto de venta de ropa ubicado en el sector central del Mercado Oriental de Managua. El siniestro fue controlado por los bomberos tras una intensa labor de combate.', `<p>Un siniestro estructural de origen incendiario afectó de manera severa un puesto comercial dedicado a la venta de indumentaria ubicado en el sector central del Mercado Oriental de la ciudad de Managua, generando movilización de los cuerpos de socorro y preocupación entre los comerciantes del principal centro de abasto del país.</p>

<h2>Desarrollo del incidente y combate del fuego</h2>

<p>El fuego se inició durante las horas de la madrugada en el interior del puesto de venta de ropa, situado en uno de los pasillos comerciales de alta concurrencia del Mercado Oriental. Los primeros indicios del siniestro fueron detectados por comerciantes vecinos que se encontraban en sus puestos preparando la mercadería para la jornada de ventas del día. La rápida propagación de las llamas entre los materiales combustibles almacenados en el interior del puesto elevó la magnitud del incidente en cuestión de minutos.</p>

<p>Miembros del Cuerpo de Bomberos de Managua y de brigadas de socorro de diferentes estaciones recibieron la alerta ciudadana y se movilizaron de inmediato hacia el lugar del siniestro con unidades de combate de incendio y equipos especializados. Los bomberos desarrollaron maniobras de extinción durante varias horas continuas para controlar la expansión del fuego hacia los puestos comerciales colindantes, logrando finalmente sofocar las llamas antes de que afectaran una zona mayor del complejo mercantil.</p>

<h2>Evaluación de daños materiales</h2>

<p>Las autoridades de los bomberos realizaron una inspección técnica del puesto afectado una vez controlado el incendio para determinar el grado de daño estructural y las posibles causas que originaron el inicio del fuego. Los peritos observaron que el local comercial presentaba daños totales en su inventario de mercancía, compuesto principalmente por prendas de vestir, calzado y accesorios de moda que fueron consumidos por las llamas o resultaron inservibles por el contacto con el agua y el humo de combate.</p>

<p>La estructura metálica y de madera del puesto sufrió deformaciones y debilitamiento en sus puntos de apoyo como consecuencia de la alta temperatura alcanzada durante el desarrollo del incendio. Los técnicos determinaron que el local debe ser sometido a una evaluación estructural integral antes de autorizar cualquier intento de reutilización o reconstrucción del espacio comercial. Los comerciantes afectados estiman que las pérdidas económicas ascienden a cifras significativas considerando el valor del inventario destruido y los daños a la infraestructura del puesto.</p>

<h2>Posibles causas del siniestro</h2>

<p>El Cuerpo de Bomberos mantiene abiertas diferentes líneas de investigación para determinar la causa precisa que originó el inicio del fuego en el interior del puesto de venta de ropa. Las hipótesis preliminares consideran la posibilidad de un cortocircuito eléctrico en el sistema de cableado interno del local, la combustión accidental de materiales inflamables por contacto con fuentes de calor o la manipulación imprudente de elementos pirotécnicos en las cercanías del inventario textil.</p>

<p>Los comerciantes del Mercado Oriental señalaron que la densidad de puestos en el sector central del mercado y la presencia de materiales altamente combustibles almacenados en los locales elevan el riesgo de propagación rápida de incendios en el área. Los representantes de la asociación de comerciantes solicitaron a las autoridades municipales la realización de inspecciones periódicas de seguridad y la verificación del cumplimiento de las normativas de prevención de incendios en todos los puestos del complejo mercantil.</p>

<h2>Medidas de prevención y respuesta institucional</h2>

<p>La Alcaldía de Managua y el Cuerpo de Bomberos emitieron un comunicado conjunto en el que reiteraron la importancia del cumplimiento de las normas de seguridad en los espacios comerciales con alta concentración de personas y materiales. Se recomendó a los comerciantes mantener despejadas las rutas de evacuación, instalar extintores de incendios en puntos visibles de sus puestos y abstenerse de realizar conexiones eléctricas provisionales que puedan generar sobrecargas en el sistema de distribución energética del mercado.</p>

<p>Los organismos de socorro instaron a la ciudadanía a reportar de inmediato cualquier indicio de humo o fuego en las instalaciones comerciales mediante las líneas de emergencia disponibles. La respuesta rápida de los primeros minutos de un incendio constituye el factor determinante para evitar la expansión del fuego y minimizar los daños materiales y humanos en instalaciones con alta densidad de ocupación como el Mercado Oriental de Managua.</p>

<p>Fuentes: Cuerpo de Bomberos de Managua y Alcaldía de Managua.</p>`);

console.log('=== Batch 5 completado ===');
