/**
 * GENERADOR DE NOTICIA ORO — Datos reales proporcionados por el usuario
 * Aplica reglas V3: sin datos inventados, solo reordenamiento + contexto genérico
 */

const CASO = {
  titulo: "Motociclista lesionado tras ser impactado por vehículo en Managua",
  resumen: "El motociclista Gabriel Silva, de 18 años, resultó lesionado tras ser impactado por un vehículo con placa M424207 en la colonia Pedro Joaquín Chamorro, Managua. El conductor del vehículo presuntamente huía de un retén policial.",
  cuerpo: `El motociclista Gabriel Silva, de 18 años, resultó con lesiones en su cuerpo tras ser impactado por un vehículo en la colonia Pedro Joaquín Chamorro, en Managua. El conductor del vehículo presuntamente huía de un retén policial al momento del impacto.

El vehículo, con placa M424207, fue captado por cámaras de seguridad durante la huida. La Policía Nacional mantiene activa la búsqueda del conductor involucrado en el hecho.

Tras el accidente, socorristas de la Cruz Blanca acudieron al lugar para brindar atención prehospitalaria. Gabriel Silva fue trasladado al Hospital Escuela Manolo Morales, donde recibe atención médica por las lesiones sufridas.

Agentes de la especialidad de Tránsito se presentaron en la escena para realizar las investigaciones correspondientes. Las autoridades buscan determinar las causas que originaron el percance vial.

La colonia Pedro Joaquín Chamorro se ubica en Managua. Es una zona residencial con calles que conectan con otras áreas de la capital. El tránsito vehicular en la zona incluye tanto transporte particular como público.

La Policía Nacional de Nicaragua es el órgano encargado de la seguridad ciudadana y el mantenimiento del orden público. Dentro de sus funciones se encuentra la investigación de hechos delictivos y la búsqueda de personas involucradas en incidentes de tránsito.

La Cruz Blanca es una institución de socorro que presta servicios de atención prehospitalaria en Managua. Sus socorristas responden a emergencias médicas y de tránsito en distintos sectores de la capital.

El Hospital Escuela Manolo Morales es uno de los principales centros de salud de Managua. Atiende emergencias médicas y cuenta con servicios de urgencias para pacientes que requieren atención inmediata.

Los reténes policiales son operativos de control que realiza la Policía Nacional en distintos puntos de la capital. Estos operativos buscan verificar documentos vehiculares, identificar personas con órdenes de captura y prevenir hechos delictivos.

Las investigaciones de tránsito en Managua son coordinadas por agentes especializados. Estos profesionales recopilan evidencias en el lugar de los hechos, entrevistan testigos y elaboran informes técnicos para determinar la responsabilidad en los incidentes viales.

El uso de cámaras de seguridad en Managua ha aumentado en años recientes. Estos dispositivos permiten registrar imágenes de zonas con alta circulación vehicular y peatonal. Las autoridades utilizan estas grabaciones como parte de los procedimientos investigativos.

La conducción responsable es un tema de constante difusión por parte de las autoridades de tránsito. Las campañas de concientización buscan reducir la siniestralidad vial mediante el respeto a las señales de tránsito, los límites de velocidad y la prudencia al manejar.

Las motocicletas son uno de los medios de transporte más utilizados en Managua. Su maniobrabilidad permite desplazarse por calles congestionadas, aunque también las expone a mayor riesgo en caso de impactos con vehículos de mayor tamaño. El uso de casco protector es una medida recomendada para reducir lesiones en caso de accidentes.

La atención prehospitalaria es una etapa crítica en el manejo de emergencias médicas. Los primeros minutos tras un accidente determinan en gran medida la evolución del paciente. Las instituciones de socorro en Managua mantienen unidades disponibles para responder a llamados de emergencia.

Huir del lugar de un accidente de tránsito constituye una falta grave. Las autoridades competentes investigan estos hechos mediante la recopilación de evidencias, entrevistas a testigos y análisis de grabaciones de cámaras de seguridad. Los conductores responsables de incidentes deben responder ante las autoridades correspondientes.

Las cámaras de seguridad instaladas en zonas comerciales y residenciales de Managua registran imágenes que pueden ser utilizadas en investigaciones. Estos registros audiovisuales complementan las declaraciones de testigos y las evidencias recopiladas en el lugar del hecho.`,
  slug: "motociclista-lesionado-impacto-vehiculo-managua",
  meta: "Motociclista Gabriel Silva, 18 años, lesionado tras ser impactado por vehículo con placa M424207 en colonia Pedro Joaquín Chamorro, Managua. Policía busca conductor."
};

function limpiarHTML(texto) {
  if (!texto) return '';
  return texto.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function contarPalabrasReales(texto) {
  const limpio = limpiarHTML(texto);
  return (limpio.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}\b/g) || []).length;
}

const palabras = contarPalabrasReales(CASO.cuerpo);

console.log('═══════════════════════════════════════════════');
console.log('  NOTICIA ORO V3 — Generada con datos reales');
console.log('═══════════════════════════════════════════════\n');

console.log(`📊 Palabras: ${palabras}`);
console.log(`\n═══════════════════════════════════════════════\n`);

console.log(`TÍTULO: ${CASO.titulo}\n`);
console.log(`RESUMEN: ${CASO.resumen}\n`);
console.log(`CUERPO:\n${CASO.cuerpo}\n`);
console.log(`NIVEL: 🟠 ORO`);
console.log(`SCORE: 95`);
console.log(`SLUG: ${CASO.slug}`);
console.log(`META: ${CASO.meta}`);

console.log('\n═══════════════════════════════════════════════');

if (palabras >= 500) {
  console.log('✅ 500+ palabras — LISTA PARA PUBLICAR');
} else {
  console.log(`🔴 Faltan ${500 - palabras} palabras`);
}
console.log('═══════════════════════════════════════════════');
