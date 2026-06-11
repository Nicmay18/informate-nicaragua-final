import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  return getFirestore(app);
}

function calcularScoreEditorial(noticia) {
  let score = 0;
  if (!noticia) return 0;
  const textoPlano = (noticia.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;

  if (palabras >= 500) score += 30;
  else if (palabras >= 250) score += 15;

  const largoTitulo = noticia.titulo ? noticia.titulo.length : 0;
  if (largoTitulo >= 30 && largoTitulo <= 70) score += 20;
  else if (largoTitulo > 0) score += 5;

  const largoResumen = noticia.resumen ? noticia.resumen.length : 0;
  if (largoResumen >= 120 && largoResumen <= 160) score += 20;
  else if (largoResumen > 0) score += 5;

  if (noticia.imagen && noticia.imagen.trim() !== '' && noticia.imagen.trim() !== '/logo.webp') score += 15;

  const tieneSubtitulos = /<h[23][^>]*>/i.test(noticia.contenido || '');
  const tieneNegritas = /<strong[^>]*>|<b>/i.test(noticia.contenido || '');
  if (tieneSubtitulos) score += 10;
  if (tieneNegritas) score += 5;

  return Math.max(0, Math.min(100, score));
}

// Expansiones proporcionadas por el usuario
const EXPANSIONES = {
  '0gGqzH1RBUeVTGHWkuvl': `
<h2>Análisis de la seguridad vial y datos estadísticos</h2>
<p>El comportamiento de los incidentes viales en las principales carreteras de Nicaragua ha mantenido bajo alerta a las autoridades de tránsito en los últimos meses. De acuerdo con reportes institucionales, factores como el exceso de velocidad, la conducción bajo los efectos del alcohol y la falta de precaución al aventajar siguen ocupando los primeros lugares entre las causas de estos siniestros fatales en los distintos departamentos.</p>

<h2>Marco normativo y procesos de investigación</h2>
<p>Ante este panorama, la Dirección de Seguridad de Tránsito Nacional mantiene la ejecución de planes preventivos y de ordenamiento vial en puntos críticos del país. Las investigaciones de estos hechos se desarrollan bajo el marco del Código Procesal Penal vigente en Nicaragua, el cual establece los procedimientos pertinentes para determinar las responsabilidades civiles o penales de los conductores involucrados en eventos con pérdidas humanas.</p>`,

  '0tmiH8fXJTVXNmiM0W5U': `
<h2>Procesos de asistencia consular y repatriación</h2>
<p>El deceso de ciudadanos en el extranjero activa de forma inmediata los protocolos de asistencia consular y acompañamiento para las familias afectadas. Los trámites de repatriación suelen requerir una coordinación estrecha entre las representaciones diplomáticas locales y las cancillerías de los países de acogida, con el fin de agilizar los permisos legales y sanitarios obligatorios en estos contextos.</p>

<h2>Contexto de la comunidad de migrantes</h2>
<p>Este tipo de sucesos refleja las complejas condiciones a las que se enfrentan los ciudadanos durante sus trayectos internacionales o en su proceso de establecimiento en el exterior. Organismos de derechos humanos e instituciones de apoyo al migrante insisten continuamente en la importancia de fortalecer los mecanismos de protección y brindar información oportuna sobre los canales de ayuda legal disponibles en las naciones aliadas.</p>`,

  '1HmobwfngxeXoUofqosD': `
<h2>Atención médica y cobertura de salud materno-infantil</h2>
<p>La llegada de los primeros infantes en fechas conmemorativas como el Día de las Madres resalta la capacidad operativa de las salas de labor y parto en el sistema de salud pública nicaragüense. En centros de referencia nacional como el Hospital Bertha Calderón en Managua y el Hospital Gaspar García Laviana en Rivas, el personal médico mantiene turnos reforzados para garantizar una atención oportuna, humana y segura a las familias.</p>

<h2>Programas de apoyo a la primera infancia</h2>
<p>El seguimiento del desarrollo infantil temprano forma parte de las estrategias de atención integral implementadas en las unidades de salud del país. Estas iniciativas de bienestar social incluyen la promoción activa de la lactancia materna exclusiva durante los primeros meses de vida, esquemas de vacunación completos y asesoría nutricional periódica para asegurar un crecimiento óptimo desde el nacimiento.</p>`,

  '1PRR0VQRF8oXLfzFDhm5': `
<h2>Monitoreo de fenómenos climáticos extremos</h2>
<p>Las regiones del centro de los Estados Unidos, conocidas históricamente por su vulnerabilidad ante tormentas severas, enfrentan temporadas de tornados cada vez más impredecibles debido a las variaciones climáticas globales. Los servicios meteorológicos locales enfatizan constantemente la importancia de los sistemas de alerta temprana para permitir que las comunidades se resguarden a tiempo en refugios diseñados para mitigar el impacto de ráfagas destructivas.</p>

<h2>Protocolos de respuesta ante desastres y asistencia</h2>
<p>Tras el paso de este tipo de fenómenos, los equipos de primera respuesta y las organizaciones de emergencia coordinan esfuerzos para evaluar daños, restablecer servicios básicos y brindar asistencia a las familias afectadas. Los planes de contingencia incluyen la distribución de alimentos, agua potable y materiales de construcción provisional para quienes perdieron sus viviendas.</p>`,

  '2EQFdVtgjMWe3SN4A9yM': `
<h2>Requisitos de hardware y desafíos de la migración técnica</h2>
<p>La adopción del sistema operativo de Microsoft en el entorno local ha estado estrechamente ligada a la actualización del parque tecnológico de empresas y usuarios particulares. La exigencia de componentes de seguridad específicos, como el chip TPM 2.0 y procesadores compatibles, obligó inicialmente a una transición gradual, impulsando la demanda de mantenimiento de hardware y renovación de equipos de escritorio y portátiles.</p>

<h2>Impacto en el rendimiento y ciclo de vida de los equipos</h2>
<p>Especialistas en soporte de tecnologías de la información señalan que la transición hacia esta plataforma optimiza de manera significativa la gestión de discos de estado sólido (SSD) y la seguridad de los datos frente a vulnerabilidades modernas. Con el fin programado del soporte para versiones anteriores, la migración se ha convertido en una prioridad técnica para garantizar la estabilidad operativa de los sistemas locales.</p>`,

  '36WzKkoqnN6ITtamp2BY': `
<h2>Importancia del trámite en el ámbito laboral y legal</h2>
<p>La vigencia y correcta actualización de los antecedentes laborales y de conducta representan un requisito fundamental para acceder a diversas oportunidades de empleo en el país. Este documento administrativo certifica el estado del ciudadano ante las instancias normativas, siendo un paso indispensable para la formalización de contratos en empresas privadas e instituciones del sector público.</p>

<h2>Modernización de servicios administrativos públicos</h2>
<p>Los procesos de solicitud y tramitación de documentos oficiales han experimentado mejoras significativas mediante el uso de plataformas digitales y kioscos tecnológicos de autoservicio. Estas innovaciones reducen los tiempos de espera y simplifican el acceso a gestiones esenciales, permitiendo a la población agilizar sus requerimientos sin intermediarios y con mayor transparencia en los costos estipulados.</p>`,

  '3Dlu4tCQZedztrompEgV': `
<h2>Vulnerabilidad de los usuarios de motocicletas en zonas rurales</h2>
<p>Los incidentes viales que involucran vehículos de dos ruedas en los municipios del departamento de Matagalpa representan una de las mayores preocupaciones para los planes de seguridad ciudadana. La topografía de las carreteras intermunicipales y las condiciones de visibilidad nocturna exigen una conducción a la defensiva y el respeto estricto a los límites de velocidad establecidos por la ley de tránsito.</p>

<h2>Campañas preventivas y uso de dispositivos de seguridad</h2>
<p>Autoridades locales y brigadas de prevención vial insisten continuamente en la obligatoriedad del uso correcto del casco homologado, tanto para el conductor como para el acompañante. La implementación de dispositivos reflectantes en la vestimenta y la revisión mecánica periódica de los sistemas de frenos y luces son medidas esenciales para reducir los decesos en las rutas del país.</p>`,

  '9YSrsEdWBiO9Uu1CV8u6': `
<h2>El desafío global de la verificación de edad digital</h2>
<p>La efectividad de las normativas gubernamentales frente a las plataformas tecnológicas globales se encuentra bajo debate internacional debido a la facilidad con la que los usuarios eluden los filtros básicos de registro. Los mecanismos de autenticación actuales enfrentan el reto de equilibrar la protección estricta de la privacidad de los datos personales con la necesidad de validar la identidad real de los menores en la red.</p>

<h2>El rol de las herramientas de control parental</h2>
<p>Analistas en ciberseguridad y entornos digitales destacan que las leyes restrictivas requieren el complemento activo de soluciones tecnológicas gestionadas desde el hogar. Las herramientas de control parental integradas en los sistemas operativos modernos permiten a los tutores monitorear los tiempos de pantalla y restringir de manera directa el acceso a contenidos no aptos para el desarrollo de los jóvenes.</p>`,

  'Bd0FR40BQL9MYKXutpSr': `
<h2>Evolución de la inteligencia artificial en el ecosistema móvil</h2>
<p>La integración directa de modelos de lenguaje avanzados en los sistemas operativos nativos marca un hito en el desarrollo de la informática de consumo. Esta colaboración estratégica busca transformar la interacción cotidiana con los dispositivos móviles, permitiendo que las tareas de asistencia, redacción y automatización se ejecuten de forma más fluida y contextualizada para millones de usuarios a nivel mundial.</p>

<h2>Privacidad de datos y procesamiento en el dispositivo</h2>
<p>Uno de los puntos críticos en estas negociaciones tecnológicas se centra en el manejo seguro de la información del usuario. Las arquitecturas híbridas actuales priorizan el procesamiento de datos directamente en el chip del teléfono, recurriendo a servidores en la nube blindados únicamente cuando la complejidad del requerimiento informático supera las capacidades físicas del hardware local.</p>`,

  'Bo0hQ4L0astO6INh9QZS': `
<h2>Medidas de seguridad y prevención en destinos turísticos</h2>
<p>Las zonas costeras del departamento de Rivas, de gran afluencia turística nacional e internacional, demandan un monitoreo constante debido al comportamiento de las corrientes de resaca y las variaciones en las mareas. Los equipos de rescate recomiendan a los visitantes informarse sobre las condiciones del mar antes de ingresar al agua y evitar zonas aisladas que carezcan de vigilancia activa.</p>

<h2>Coordinación de primeros auxilios y respuesta comunitaria</h2>
<p>La respuesta inmediata de las brigadas de socorro comunitarias y las instituciones de primera respuesta resulta vital para incrementar las posibilidades de supervivencia en emergencias acuáticas. El fortalecimiento de las capacitaciones en reanimación cardiopulmonar (RCP) para el personal de hoteles y negocios locales forma parte de las estrategias implementadas para resguardar la vida de los veraneantes.</p>`
};

async function main() {
  const db = initFirebase();

  for (const [id, expansionHtml] of Object.entries(EXPANSIONES)) {
    const doc = await db.collection('noticias').doc(id).get();
    if (!doc.exists) {
      console.log(`⚠️ ${id}: no existe`);
      continue;
    }

    const data = doc.data();
    const contenidoOriginal = data.contenido || '';
    
    // Verificar que la expansión no esté ya aplicada
    if (contenidoOriginal.includes(expansionHtml.substring(0, 50))) {
      console.log(`⏭️  ${id}: ya tiene la expansión`);
      continue;
    }

    const nuevoContenido = contenidoOriginal.trim() + '\n\n' + expansionHtml.trim();
    
    const scoreNuevo = calcularScoreEditorial({
      titulo: data.titulo || '',
      resumen: data.resumen || '',
      contenido: nuevoContenido,
      imagen: data.imagen,
    });

    await db.collection('noticias').doc(id).update({
      contenido: nuevoContenido,
      scoreCalidad: scoreNuevo,
      expandidoManualmente: true,
      fechaExpansion: new Date(),
    });

    console.log(`✅ ${id}: score ${data.scoreCalidad}→${scoreNuevo} | expansión aplicada`);
  }

  console.log('\n🏁 Expansiones aplicadas');
}

main().catch(err => { console.error(err); process.exit(1); });
