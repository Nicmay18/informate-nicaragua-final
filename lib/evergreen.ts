export interface EvergreenArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  authorSlug: string;
  publishedDate: string;
  updatedDate: string;
  content: string;
  faqs: { question: string; answer: string }[];
}

export const EVERGREEN_ARTICLES: EvergreenArticle[] = [
  {
    slug: 'apostillar-documentos-nicaragua-2026',
    title: 'Guía completa para apostillar documentos desde Nicaragua en 2026',
    description: 'Requisitos, pasos, costos, tiempos y dónde apostillar documentos nicaragüenses para usarlos en el extranjero. Guía actualizada 2026.',
    category: 'Trámites',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-01-15',
    updatedDate: '2026-07-30',
    content: `
      <blockquote><h3>Qué cambió desde la última actualización (24 de mayo de 2026)</h3><ul><li>El trámite ahora se agenda por una <strong>plataforma de citas en línea</strong> (citas.cancilleria.gob.ni), no de forma presencial sin cita.</li><li>Las citas disponibles se están agotando con <strong>hasta 4 meses de espera</strong>, según un reporte de mayo de 2026.</li><li>Surgió un <strong>mercado negro de citas</strong>, con precios de USD 100 a 400 por un cupo, según denuncias ciudadanas.</li><li>Los tiempos de "3 a 5 días hábiles" que indicábamos antes <strong>ya no reflejan la realidad del trámite</strong> para la mayoría de solicitantes.</li></ul></blockquote>
      <p>La apostilla es un sello que certifica la autenticidad de documentos públicos nicaragüenses para que sean válidos en países que forman parte de la Convención de La Haya. Nicaragua es miembro desde 2013, por lo que los documentos apostillados en el país son reconocidos en más de 120 naciones sin necesidad de legalización consular adicional. Sin embargo, en 2026 el trámite enfrenta demoras importantes que todo solicitante debe conocer antes de planificar un viaje o trámite migratorio.</p>
      <h2>Documentos que se pueden apostillar en Nicaragua</h2>
      <ul><li>Certificados de nacimiento, matrimonio y defunción</li><li>Diplomas, títulos académicos y certificados de estudio</li><li>Certificados de antecedentes penales</li><li>Poderes notariales y actas notariales</li><li>Documentos de la Corte Suprema de Justicia y tribunales</li><li>Documentos de registros públicos y municipales</li></ul>
      <p>Los documentos deben estar vigentes y en buen estado físico. Algunos países de destino exigen que el documento sea reciente, generalmente emitido en los últimos 3 a 6 meses. Los documentos académicos (diplomas, títulos, certificados de notas) requieren autenticación previa por instituciones como el INATEC antes de poder apostillarse; ese paso previo tiene un costo de C$ 30, pagadero en cuenta de INATEC en Banpro.</p>
      <h2>Cómo agendar la cita en línea (actualizado)</h2>
      <p>Desde abril de 2025, la Cancillería digitalizó el proceso de citas para apostillado. Los pasos son:</p>
      <ol><li>Ingresar a <strong>https://citas.cancilleria.gob.ni</strong></li><li>Seleccionar la institución, el departamento y la sede donde se desea ser atendido</li><li>Completar el formulario con datos personales: tipo y número de documento, nombre completo, fecha de nacimiento, sexo, nacionalidad, teléfono y correo electrónico</li><li>Verificar el correo con el código enviado</li><li>Descargar o guardar el comprobante de cita (también llega por correo)</li></ol>
      <p>Para más información se puede llamar al 2244-8008.</p>
      <h2>La demora real del trámite en 2026</h2>
      <p>Aunque el sistema virtual eliminó las filas físicas frente a la Cancillería, no resolvió el cuello de botella de fondo: la demanda de citas supera la capacidad de atención. Un reporte de Despacho 505 verificó que, hasta el 13 de mayo de 2026, la cita más próxima disponible en la plataforma era para el 5 de julio, es decir, casi dos meses de espera solo para conseguir turno. Otros usuarios han reportado esperas de hasta 4 meses.</p>
      <p>Esta escasez de citas generó un mercado paralelo: intermediarios que revenden cupos de la plataforma por montos de entre <strong>USD 100 y USD 400</strong>, según denuncias ciudadanas recogidas por Despacho 505. Si usted necesita el documento con urgencia (por ejemplo, para una entrevista de visa o un trámite migratorio con fecha límite), planifique con al menos 2 a 4 meses de anticipación y evite intermediarios no oficiales.</p>
      <h2>Requisitos para apostillar documentos en 2026</h2>
      <ul><li>Documento original o copia certificada por la institución emisora</li><li>Cédula de identidad vigente del solicitante</li><li>Comprobante de cita generado en la plataforma en línea</li><li>Pago de la tasa correspondiente según tipo de documento y servicio</li></ul>
      <p>Los documentos extranjeros no se apostillan en Nicaragua. Deben ser apostillados en el país de origen antes de ser presentados en el país.</p>
      <h2>Dónde realizar el trámite</h2>
      <p>La apostilla se realiza en la Dirección General de Asuntos Consulares y Migratorios del Ministerio de Relaciones Exteriores (MINREX), en Managua. También existen oficinas delegadas en principales ciudades del país. Se recomienda verificar los horarios de atención y disponibilidad del servicio antes de acudir, incluso teniendo cita confirmada.</p>
      <h2>Costos actualizados 2026</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Servicio</th><th style="padding:10px;text-align:left;">Costo aproximado</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Apostilla estándar</td><td style="padding:10px;text-align:left;">C$ 150 - 300 por documento</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Autenticación previa de documentos académicos (INATEC)</td><td style="padding:10px;text-align:left;">C$ 30</td></tr><tr style=""><td style="padding:10px;text-align:left;">Cupos de cita revendidos en el mercado informal (no oficial, no recomendado)</td><td style="padding:10px;text-align:left;">USD 100 - 400</td></tr></tbody></table>
      <p>Los costos oficiales pueden variar según el tipo de documento; confirme el monto exacto al momento del trámite. Evite pagar por cupos de cita fuera de la plataforma oficial: es un servicio no autorizado y no hay garantía de que la cita sea válida.</p>
    `,
    faqs: [
      { question: '¿Se puede apostillar en línea en Nicaragua?', answer: 'Solo la cita se agenda en línea. El trámite de apostillado en sí sigue siendo presencial, en la Cancillería o sus oficinas delegadas.' },
      { question: '¿Cuánto tiempo real toma conseguir cita para apostillar?', answer: 'A mediados de 2026, las esperas reportadas van de 2 a 4 meses, dependiendo de la demanda y la sede elegida.' },
      { question: '¿Es seguro comprar una cita a un intermediario?', answer: 'No es un canal oficial. La Cancillería no ha validado ni autorizado la reventa de citas, y pagar por un cupo no garantiza que el trámite se complete sin problemas.' },
      { question: '¿Qué países aceptan la apostilla nicaragüense?', answer: 'Los países miembros de la Convención de La Haya, incluyendo España, México, Costa Rica, Chile, Estados Unidos y la mayoría de países de Europa y América Latina.' },
      { question: '¿Qué pasa si mi documento está en inglés?', answer: 'Dependiendo del país de destino, podría requerirse una traducción oficial realizada por un traductor jurado. Verifique los requisitos específicos en la embajada o entidad receptora.' }
    ],
  },
  {
    slug: 'anular-recurso-policial-nicaragua-2026',
    title: 'Cómo anular el récord policial en Nicaragua: requisitos y pasos 2026',
    description: 'Guía paso a paso para solicitar la anulación de antecedentes penales en Nicaragua. Requisitos, documentos necesarios y tiempos de espera.',
    category: 'Trámites',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-02-10',
    updatedDate: '2026-07-30',
    content: `
      <blockquote><h3>Qué cambió desde la última actualización (24 de mayo de 2026)</h3><ul><li>El costo del récord de policía (certificado de conducta) <strong>subió de C$30 a C$80</strong> (aumento del 166.7%), sin previo aviso.</li><li>La <strong>autenticación</strong> del récord ahora cuesta <strong>C$100</strong> y ya no está centralizada solo en Plaza El Sol: desde el 30 de marzo de 2026 se puede hacer en <strong>cualquier delegación regional o departamental</strong>, y en Managua en los distritos 8, 9 y 10.</li><li>La Constancia de Antecedentes Judiciales (Carta Judicial) <strong>subió de C$150 a C$300</strong>.</li><li>Ahora existe un <strong>portal en línea</strong> (tramitesenlinea.policia.gob.ni) y <strong>78 kioscos tecnológicos</strong> en todo el país para solicitar el certificado de conducta, incluso desde el extranjero.</li><li>Abogados penalistas advierten que, en la práctica, muchos récords <strong>siguen saliendo "manchados" incluso después de una anulación aprobada</strong>, por fallas en la actualización del sistema.</li></ul></blockquote>
      <p>El récord policial, también conocido como certificado de conducta o antecedentes penales, es el documento que certifica si una persona tiene registros de procesos penales en Nicaragua. Es requerido para trámites de empleo, visas, residencias, homologación de licencias y otros procedimientos legales. Esta guía cubre tres cosas distintas pero relacionadas: cómo obtener el récord, cómo autenticarlo para uso en el extranjero, y cómo solicitar la anulación de antecedentes cuando la ley lo permite.</p>
      <h2>1. Cómo obtener el récord de policía en 2026</h2>
      <h3>Costo</h3>
      <p>El récord de policía cuesta <strong>C$80</strong> (antes C$30). El pago se hace de forma previa en una sucursal del Banco de la Producción (Banpro) o en un agente Banpro autorizado, que es la única entidad autorizada para recibir este pago.</p>
      <h3>Opción A: solicitud en línea</h3>
      <p>En <strong>https://tramitesenlinea.policia.gob.ni/</strong>:</p>
      <ol><li>Crear un usuario con nombre completo, correo electrónico y número de cédula</li><li>Crear una nueva solicitud en la pestaña "Trámites", indicando el motivo (laboral, académico, migratorio)</li><li>Elegir el trámite "Certificado de conducta" y la forma de entrega: Correos de Nicaragua, en la delegación policial, o impresión directa</li><li>Si se elige entrega a domicilio por Correos de Nicaragua: C$10 adicionales para entrega en papel, C$30 para material PVC</li><li>Procesar el pago e ingresar los datos del vaucher</li></ol>
      <h3>Opción B: kioscos tecnológicos</h3>
      <p>Existen <strong>78 kioscos tecnológicos</strong> distribuidos en todos los municipios del país, disponibles las 24 horas, todos los días de la semana:</p>
      <ol><li>Seleccionar "Trámites en línea" en el kiosco</li><li>Colocar la cédula de identidad vigente en el lector</li><li>Verificar los datos personales mostrados</li><li>Ir a la pestaña "Certificados" → "Certificado de Conducta", elegir el motivo y generar el trámite</li><li>Pagar en el kiosco (vaucher de banco o agente Banpro) e ingresar el número SIF</li><li>Imprimir el documento</li></ol>
      <p><strong>Importante:</strong> si usted tiene antecedentes penales, el sistema no le permitirá generar el documento de forma automática en el kiosco.</p>
      <h3>Si usted vive en el extranjero</h3>
      <p>Puede hacer la solicitud en línea desde fuera de Nicaragua y luego autenticar el documento (ver siguiente sección) para que tenga validez legal en el país donde lo necesite.</p>
      <h2>2. Autenticación del récord de policía</h2>
      <p>La autenticación es un trámite adicional, indispensable para gestiones migratorias, laborales y académicas en el extranjero.</p>
      <ul><li><strong>Costo: C$100</strong> por cada autenticación</li><li><strong>Requisitos:</strong> certificado de conducta vigente y cédula de identidad vigente de quien realiza el trámite</li><li><strong>Dónde:</strong> desde el 30 de marzo de 2026, en cualquier delegación policial regional o departamental del país, y en Managua en los Distritos Policiales 8, 9 y 10. Antes solo se podía hacer en las oficinas centrales de Plaza El Sol.</li></ul>
      <h2>3. Anulación de antecedentes penales</h2>
      <p>Este es un trámite distinto al certificado de conducta: aplica cuando una persona ya cumplió una condena y quiere que sus antecedentes dejen de aparecer en el récord policial.</p>
      <h3>Cuándo se puede solicitar la anulación</h3>
      <ul><li>Han transcurrido más de 5 años desde el cumplimiento de la pena principal y accesorias</li><li>El proceso penal fue archivado, sobreseído o terminado de forma definitiva</li><li>Se obtuvo una sentencia absolutoria firme</li><li>El delito fue de menor gravedad y no existe reincidencia</li></ul>
      <p>La solicitud no procede si existe un proceso penal en curso o si la condena fue por delitos graves con restricciones legales específicas.</p>
      <h3>Requisitos</h3>
      <ul><li>Solicitud escrita dirigida al Director General de la Policía Nacional</li><li>Cédula de identidad vigente</li><li>Certificación de la sentencia judicial o resolución que acredite la situación legal</li><li>Constancia de residencia actualizada</li><li>Comprobante de pago de la tasa administrativa</li></ul>
      <h3>Paso a paso</h3>
      <ol><li>Reúna todos los documentos requeridos y verifique que estén vigentes</li><li>Presente la solicitud en la delegación de la Policía Nacional más cercana a su domicilio</li><li>Pague la tasa correspondiente</li><li>Espere el período de revisión administrativa (30-45 días hábiles, según normativa vigente)</li><li>Recoja la resolución en la misma delegación</li></ol>
      <h3>⚠️ Advertencia importante sobre la práctica real</h3>
      <p>Abogados penalistas nicaragüenses han advertido públicamente que, aunque la anulación sea aprobada formalmente, en la práctica <strong>el récord policial puede seguir apareciendo "manchado"</strong> con el antecedente ya anulado, debido a fallas en la actualización de los registros del sistema. Si esto le ocurre, la recomendación es acudir con la resolución de anulación en mano a la delegación donde tramitó el récord y, de ser necesario, buscar asesoría de un abogado especializado en derecho penal para exigir la corrección del registro.</p>
      <h2>Tabla de costos actualizados 2026</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Trámite</th><th style="padding:10px;text-align:left;">Costo</th><th style="padding:10px;text-align:left;">Nota</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Récord de policía / certificado de conducta</td><td style="padding:10px;text-align:left;">C$ 80</td><td style="padding:10px;text-align:left;">Antes C$ 30</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Autenticación del récord de policía</td><td style="padding:10px;text-align:left;">C$ 100</td><td style="padding:10px;text-align:left;">Disponible en todo el país desde marzo 2026</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Constancia de Antecedentes Judiciales (Carta Judicial)</td><td style="padding:10px;text-align:left;">C$ 300</td><td style="padding:10px;text-align:left;">Antes C$ 150</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Entrega a domicilio (Correos de Nicaragua, papel)</td><td style="padding:10px;text-align:left;">C$ 10</td><td style="padding:10px;text-align:left;">Adicional</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Entrega a domicilio (Correos de Nicaragua, PVC)</td><td style="padding:10px;text-align:left;">C$ 30</td><td style="padding:10px;text-align:left;">Adicional</td></tr><tr style="background:#f9fafb;"><td style="padding:10px;text-align:left;">Tasa de solicitud de anulación de antecedentes</td><td style="padding:10px;text-align:left;">C$ 500 (referencial)</td><td style="padding:10px;text-align:left;">Confirmar monto vigente en la delegación, no se identificó un ajuste específico reciente</td></tr></tbody></table>
    `,
    faqs: [
      { question: '¿Cuánto cuesta el récord de policía en 2026?', answer: 'C$80, un aumento frente a los C$30 que costaba antes de marzo de 2026.' },
      { question: '¿Puedo tramitar el récord de policía desde el extranjero?', answer: 'Sí, a través de tramitesenlinea.policia.gob.ni. Después deberá autenticarlo para que tenga validez legal fuera de Nicaragua.' },
      { question: '¿Dónde autentico mi récord de policía ahora?', answer: 'En cualquier delegación policial regional o departamental, o en los Distritos 8, 9 y 10 de Managua. Ya no es necesario ir únicamente a Plaza El Sol.' },
      { question: '¿La anulación de antecedentes elimina el registro de forma permanente?', answer: 'Según la normativa, sí, pero existen reportes de que el sistema no siempre refleja la anulación de inmediato. Conserve su resolución de anulación como respaldo ante cualquier inconsistencia.' },
      { question: '¿Puedo solicitar la anulación si tengo un proceso penal en curso?', answer: 'No. La anulación solo procede cuando el proceso ha concluido con sentencia firme, archivo o sobreseimiento definitivo.' }
    ],
  },
  {
    slug: 'turismo-nicaragua-2026-destinos-imperdibles',
    title: 'Turismo en Nicaragua 2026: destinos imperdibles, costos y consejos prácticos',
    description: 'Descubre los mejores destinos turísticos de Nicaragua en 2026. Guía completa con costos, temporadas recomendadas y consejos de seguridad para viajeros.',
    category: 'Turismo',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-03-05',
    updatedDate: '2026-05-24',
    content: `
      <p>Nicaragua ofrece una variedad de destinos turísticos que incluyen volcanes activos, lagos, playas del Pacífico y el Caribe, ciudades coloniales y sitios arqueológicos. Esta guía recoge los destinos imperdibles para 2026, con costos aproximados, épocas recomendadas y consejos prácticos para viajeros nacionales e internacionales.</p>
      
      <h2>Destinos imperdibles en Nicaragua</h2>
      <h3>Isla de Ometepe</h3>
      <p>Formada por los volcanes Concepción y Maderas en el lago Cocibolca, Ometepe es uno de los destinos de ecoturismo más importantes del país. Se accede por ferry desde San Jorge, Rivas. Ideal para senderismo, observación de aves y ciclismo.</p>
      <p><strong>Costo promedio:</strong> $30-50 USD por día en alojamiento y comida. La entrada a senderos y reservas varía entre $3 y $10 USD.</p>
      
      <h3>León Viejo</h3>
      <p>Sitio arqueológico declarado Patrimonio de la Humanidad por la UNESCO en 2000. Las ruinas de la antigua ciudad de León ofrecen un recorrido por la historia colonial de Nicaragua. Se ubica cerca de la base del volcán Momotombo.</p>
      <p><strong>Entrada:</strong> $5 USD para extranjeros y residentes. Se recomienda visitar con guía local.</p>
      
      <h3>Corn Island</h3>
      <p>Ubicadas en el mar Caribe nicaragüense, las Islas del Maíz cuentan con playas de arena blanca, arrecifes de coral y cultura afrocaribeña. Se accede por vuelo desde Managua o lancha desde Bluefields.</p>
      <p><strong>Costo promedio:</strong> $60-80 USD por día. Temporada recomendada: febrero a mayo.</p>
      
      <h3>Volcán Masaya</h3>
      <p>El Volcán Masaya es uno de los volcanes activos más accesibles de Centroamérica. El Parque Nacional Volcán Masaya ofrece visitas diurnas y nocturnas para observar el cráter. Se recomienda verificar la actividad volcánica antes de visitar.</p>
      <p><strong>Entrada:</strong> $7 USD para extranjeros. La visita nocturna requiere reserva previa.</p>
      
      <h3>San Juan del Sur</h3>
      <p>La bahía de San Juan del Sur es el principal destino de playa del Pacífico nicaragüense. Ofrece surf para todos los niveles, pesca deportiva, restaurantes y vida nocturna. Se ubica a 140 km de Managua.</p>
      <p><strong>Costo promedio:</strong> $40-70 USD por día. Temporada alta: diciembre a abril.</p>
      
      <h2>Mejor época para visitar Nicaragua</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Temporada</th><th style="padding:10px;text-align:left;">Meses</th><th style="padding:10px;text-align:left;">Recomendación</th></tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Seca</td><td style="padding:10px;">Noviembre - abril</td><td style="padding:10px;">Ideal para playas, volcanes y senderismo</td></tr>
          <tr><td style="padding:10px;">Lluviosa</td><td style="padding:10px;">Mayo - octubre</td><td style="padding:10px;">Paisajes verdes, menos turistas, precios más bajos</td></tr>
        </tbody>
      </table>
      
      <h2>Consejos de seguridad para viajeros</h2>
      <ul>
        <li>Use transporte oficial, taxis autorizados o servicios de transporte recomendados</li>
        <li>Evite portar objetos de valor visibles y grandes cantidades de efectivo</li>
        <li>Mantenga copias digitales y físicas de pasaporte, visa y seguro médico</li>
        <li>Consulte alertas de actividad volcánica y climática antes de visitar parques naturales</li>
        <li>Contrate guías locales certificados en áreas protegidas y zonas rurales</li>
      </ul>
      
      <h2>Preguntas frecuentes</h2>
      <h3>¿Necesito visa para visitar Nicaragua?</h3>
      <p>Los nacionales de Centroamérica no requieren visa en la mayoría de los casos. Ciudadanos de otros países pueden obtener visa a la llegada o deben solicitarla previamente en un consulado nicaragüense.</p>
      <h3>¿Es seguro viajar a Nicaragua?</h3>
      <p>Nicaragua recibe turistas de manera regular. Se recomienda adoptar precauciones estándar de seguridad personal, especialmente en zonas turísticas concurridas y durante el transporte nocturno.</p>
      <h3>¿Cuál es la moneda local?</h3>
      <p>La moneda oficial es el córdoba nicaragüense (C$). El dólar estadounidense es aceptado en hoteles, restaurantes turísticos y comercios grandes.</p>
      
      <h2>Fuentes consultadas</h2>
      <p>Información basada en datos del Instituto Nicaragüense de Turismo (INTUR), guías de destinos y reportes de conservación de áreas protegidas. Los costos son referenciales y pueden variar según temporada y proveedor.</p>
    `,
    faqs: [
      { question: '¿Necesito visa para visitar Nicaragua?', answer: 'La mayoría de nacionales de Centroamérica no requieren visa. Otros países pueden obtener visa a la llegada o solicitarla previamente en consulados.' },
      { question: '¿Es seguro viajar a Nicaragua?', answer: 'Nicaragua es generalmente seguro para turistas. Se recomienda precaución estándar como en cualquier destino internacional.' },
      { question: '¿Cuál es la moneda local?', answer: 'El córdoba nicaragüense (C$). El dólar estadounidense es ampliamente aceptado en establecimientos turísticos.' },
    ],
  },
  {
    slug: 'beisbol-nicaragua-2026-historia-equipos-estadios',
    title: 'Béisbol nicaragüense: historia, equipos, estadios y cómo seguir la temporada 2026',
    description: 'Todo sobre el béisbol en Nicaragua: historia del deporte, equipos principales, estadios, calendario 2026 y cómo seguir los partidos en vivo.',
    category: 'Deportes',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-04-01',
    updatedDate: '2026-06-18',
    content: `
      <h2>Historia del béisbol en Nicaragua</h2>
      <p>El béisbol llegó a Nicaragua a finales del siglo XIX y rápidamente se convirtió en el deporte nacional. Desde entonces, ha formado parte de la identidad cultural del país, produciendo jugadores de clase mundial que han destacado en las Grandes Ligas de Estados Unidos.</p>
      
      <h2>Equipos principales</h2>
      
      <h3>Liga de Béisbol Profesional Nacional (LBPN)</h3>
      <ul>
        <li><strong>Indios del Bóer</strong> - Managua</li>
        <li><strong>Tigres de Chinandega</strong> - Chinandega</li>
        <li><strong>Leones de León</strong> - León</li>
        <li><strong>Fieras del San Fernando</strong> - Masaya</li>
        <li><strong>Gigantes de Rivas</strong> - Rivas</li>
      </ul>

      <h2>Estadios de Nicaragua</h2>
      
      <h3>Estadios principales (LBPN)</h3>
      <ul>
        <li><strong>Estadio Nacional Soberanía</strong> - Managua. Sede principal de la selección nacional y de la Liga de Béisbol Profesional Nacional (LBPN).</li>
        <li><strong>Estadio Rigoberto López Pérez</strong> - León. Nuevo y moderno estadio inaugurado recientemente para albergar al equipo metropolitano.</li>
        <li><strong>Estadio Roberto Clemente</strong> - Masaya. Moderna infraestructura deportiva inaugurada a finales de 2023.</li>
      </ul>
      
      <h3>Estadios departamentales (Campeonato Pomares — Primera División)</h3>
      <ul>
        <li><strong>Estadio Stanley Cayasso</strong> - Managua. Histórico coloso conocido anteriormente como el "Estadio Nacional".</li>
        <li><strong>Estadio Roque Tadeo Zavala</strong> - Granada. Casa de los Tiburones de Granada.</li>
        <li><strong>Estadio Yamil Ríos Ugarte</strong> - Rivas</li>
        <li><strong>Estadio Rufo Marín</strong> - Estelí</li>
        <li><strong>Estadio Chale Solís</strong> - Matagalpa</li>
        <li><strong>Estadio Efraín Tijerino Mazariego</strong> - Chinandega</li>
        <li><strong>Estadio Carlos Guerra Colindres</strong> - Juigalpa, Chontales</li>
        <li><strong>Estadio Pedro Selva</strong> - Jinotepe, Carazo</li>
        <li><strong>Estadio Ernesto Incer</strong> - Boaco</li>
        <li><strong>Estadio Glorias del Béisbol Segoviano</strong> - Ocotal, Nueva Segovia</li>
      </ul>
      
      <h3>Estadios de las Regiones Autónomas (Costa Caribe)</h3>
      <ul>
        <li><strong>Estadio Karen Tucker</strong> - Corn Island, RACCS</li>
        <li><strong>Estadio Ernesto Hooker</strong> - Bluefields, RACCS</li>
        <li><strong>Estadio Oncelo Martin Jackson</strong> - Puerto Cabezas / Bilwi, RACCN</li>
        <li><strong>Estadio Duncan Campbell</strong> - Bonanza, RACCN (municipio minero)</li>
      </ul>
      
      <h2>Campeonato Nacional de Béisbol Superior Germán Pomares Ordóñez (GPO)</h2>
      <p>El torneo nacional de Primera División cuenta con la participación de <strong>20 equipos</strong> que representan a los departamentos y regiones autónomas de Nicaragua.</p>
      
      <h3>Pacífico e Interior (Históricos)</h3>
      <ul>
        <li><strong>Indios del Bóer</strong> - Managua</li>
        <li><strong>Dantos de Managua</strong> - El equipo del Ejército de Nicaragua</li>
        <li><strong>Leones de León</strong> - Escuadra metropolitana del occidente</li>
        <li><strong>Tigres de Chinandega</strong> - Franquicia del occidente</li>
        <li><strong>Fieras del San Fernando</strong> - Masaya</li>
        <li><strong>Tiburones de Granada</strong> - Equipo de la Gran Sultana</li>
        <li><strong>Frente Sur Rivas</strong> - Tradicional equipo sureño</li>
        <li><strong>Cafeteros de Carazo</strong> - Zona central-sur</li>
      </ul>
      
      <h3>Zona Norte y Central</h3>
      <ul>
        <li><strong>Indígenas de Matagalpa</strong> - Fuertes competidores del norte</li>
        <li><strong>Brumas de Jinotega</strong> - El equipo de la ciudad de las brumas</li>
        <li><strong>Estelí</strong> - Representantes del diamante de las Segovias</li>
        <li><strong>Guerreros de Nueva Segovia</strong> - Basados en Ocotal</li>
        <li><strong>Cañoneros de Madriz</strong> - Franquicia con sede en Somoto</li>
      </ul>
      
      <h3>Zona Central y Las Minas</h3>
      <ul>
        <li><strong>Toros de Chontales</strong> - Tradicional equipo ganadero (Juigalpa)</li>
        <li><strong>Productores de Boaco</strong> - Representantes del departamento boaqueño</li>
        <li><strong>Defensores de Río San Juan</strong> - Basados en San Carlos</li>
        <li><strong>Gigantes de Zelaya Central</strong> - Zona del centro del país</li>
        <li><strong>Mineros del Caribe</strong> - Zona del Triángulo Minero (Siuna, Bonanza, Rosita)</li>
      </ul>
      
      <h3>Regiones Autónomas de la Costa Caribe</h3>
      <ul>
        <li><strong>Pescadores del Caribe Norte</strong> - RACCN, basados en Puerto Cabezas / Bilwi</li>
        <li><strong>Caribe Sur</strong> - RACCS, jugando principalmente en Bluefields</li>
      </ul>
      
      <h2>Temporada 2026</h2>
      <p>La temporada regular de la LBPN 2026 inicia en octubre y concluye en diciembre, seguida por los playoffs en enero de 2027. El campeonato de serie nacional se disputa entre los campeones de cada zona.</p>
      
      <h2>Cómo seguir los partidos</h2>
      <ul>
        <li>Transmisión en vivo por televisión nacional (Canal 6, Canal 10)</li>
        <li>Streaming en plataformas digitales</li>
        <li>Actualizaciones en tiempo real en redes sociales oficiales</li>
        <li>Radio: La Buenísima, Radio Corporación</li>
      </ul>
      
      <h2>Jugadores nicaragüenses en Grandes Ligas</h2>
      <p>Nicaragua ha producido destacados jugadores como:</p>
      <ul>
        <li>Dennis Martínez (primer nicaragüense en MLB)</li>
        <li>Vicente Padilla</li>
        <li>Marlín Salazar</li>
        <li>Jonathan Loáisiga</li>
      </ul>
    
      <h2>Preguntas frecuentes</h2>
      <h3>¿Cuándo inicia la temporada de béisbol profesional en Nicaragua?</h3>
      <p>La temporada regular de la LBPN generalmente inicia en octubre y concluye en diciembre, con los playoffs en enero del año siguiente.</p>
      <h3>¿Dónde puedo comprar boletos para los partidos?</h3>
      <p>Los boletos se adquieren en las taquillas de los estadios el día del partido o, si están disponibles, a través de plataformas de venta en línea.</p>
      <h3>¿Cuál es el equipo más ganador en la historia del béisbol nicaragüense?</h3>
      <p>En la LBPN, los Tigres de Chinandega y los Leones de León suelen estar entre los más ganadores. En el Pomares, los Dantos y el Bóer tienen un historial destacado.</p>
      
      <h2>Fuentes consultadas</h2>
      <p>Información basada en datos históricos de la Federación Nicaragüense de Béisbol Asociado (FENIBA), la Liga de Béisbol Profesional Nacional (LBPN) y archivos periodísticos deportivos nacionales.</p>
    `,
    faqs: [
      { question: '¿Cuándo inicia la temporada de béisbol 2026?', answer: 'La temporada regular inicia en octubre de 2026 y concluye en diciembre, con playoffs en enero de 2027.' },
      { question: '¿Dónde puedo ver los partidos en vivo?', answer: 'Los partidos se transmiten por Canal 6 y Canal 10, además de streaming en plataformas digitales.' },
      { question: '¿Cuál es el estadio más grande de Nicaragua?', answer: 'El Estadio Denis Martínez en Managua es el más grande, con capacidad para 15,000 espectadores.' },
    ],
  },
  {
    slug: 'tramites-migratorios-nicaraguenses-costa-rica-eeuu-espana-2026',
    title: 'Trámites migratorios para nicaragüenses en Costa Rica, EE.UU. y España: guía 2026',
    description: 'Guía completa de trámites migratorios para nicaragüenses que desean viajar o residir en Costa Rica, Estados Unidos y España. Requisitos, visas y permisos 2026.',
    category: 'Trámites',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-04-15',
    updatedDate: '2026-07-30',
    content: `
      <blockquote><h3>Qué cambió desde la última actualización (24 de mayo de 2026)</h3><ul><li><strong>Costa Rica</strong> redujo la vigencia mínima de pasaporte exigida a nicaragüenses de 6 a 3 meses y fijó la estancia máxima en 90 días.</li><li><strong>Costa Rica</strong> exime de visa a nicaragüenses que tengan visa o residencia vigente de EE.UU. o Canadá (incluido refugio) con al menos 3 meses de validez.</li><li><strong>Estados Unidos</strong> exige, desde el 2 de abril de 2026, una <strong>fianza de USD 5,000 a 15,000</strong> para nuevas visas de turismo/negocios (B1/B2) de nicaragüenses, que además ahora son de una sola entrada, 3 meses de validez y máximo 30 días de estadía.</li><li>El <strong>TPS para nicaragüenses</strong> fue revocado; un tribunal de apelaciones confirmó su finalización el 10 de febrero de 2026.</li><li><strong>España</strong> reestructuró el arraigo en 5 categorías y flexibilizó el arraigo sociolaboral (ya no exige contrato de 12 meses a tiempo completo).</li><li>La <strong>visa Schengen</strong> subió de €80 a €90 para adultos.</li><li>Una regularización extraordinaria en España (RD 316/2026) tuvo un plazo de solicitud del 16 de abril al 30 de junio de 2026, <strong>ya cerrado</strong>.</li></ul></blockquote>
      <p>Los nicaragüenses que desean viajar o residir en Costa Rica, Estados Unidos o España deben cumplir requisitos migratorios específicos de cada país, y varios de esos requisitos cambiaron de forma significativa en los primeros meses de 2026. Esta guía resume los trámites más solicitados, con documentos, costos y tiempos vigentes a julio de 2026. Se recomienda verificar siempre la información directamente en los consulados y entidades oficiales, ya que las normas siguen cambiando con frecuencia.</p>
      <h2>Costa Rica</h2>
      <h3>Requisitos de entrada (actualizados)</h3>
      <p>Las nuevas directrices generales de visas de ingreso y permanencia para extranjeros que rigen a Costa Rica redujeron la vigencia mínima de pasaporte exigida a nicaragüenses de 6 a 3 meses, y fijaron el plazo máximo de permanencia en 90 días. Antes la directriz pedía 6 meses de vigencia de pasaporte.</p>
      <ul><li>Pasaporte vigente con mínimo <strong>3 meses</strong> de validez (aunque conviene viajar con 6 meses para evitar rechazos, ya que algunos puestos fronterizos todavía aplican el criterio anterior)</li><li>Récord de policía original y vigente, emitido por la Policía Nacional de Nicaragua</li><li>Boleto de salida del país o comprobante de continuación de viaje</li><li>Comprobación de solvencia económica: mínimo USD 100 por mes o fracción de mes de permanencia autorizada</li><li>Seguro médico con cobertura internacional</li></ul>
      <h3>Exención de visa para quienes ya tienen visa de EE.UU. o Canadá</h3>
      <p>Un cambio relevante: los nicaragüenses que posean visa o residencia de cualquier categoría —incluido el refugio— de Estados Unidos o Canadá, con vigencia mínima de 3 meses al momento de ingresar, <strong>no necesitan tramitar visa costarricense</strong>. También es válido viajar con el documento de viaje ("laissez-passer") emitido por el país que otorgó el refugio o por la ONU.</p>
      <h3>Costo y trámite de la visa de turismo</h3>
      <ul><li><strong>Costo de la visa: USD 30</strong> (bajó de USD 32)</li><li><strong>Costo de la cita: USD 7.30</strong>, se paga en agencias BAC o Lafise antes de agendar</li><li>La visa se tramita de forma presencial en el Consulado de Costa Rica en Managua (Reparto San Juan)</li><li>Vigencia de la visa: 60 días desde su expedición para ser utilizada</li><li>Se puede solicitar visa de doble entrada si el itinerario lo justifica</li><li>Cita: llamar al +505 7833-5400</li></ul>
      <h3>Visa de tránsito aeroportuario</h3>
      <p>Costa Rica exige visa de tránsito a nicaragüenses que hagan escala en sus aeropuertos por más de 12 horas o que no tengan visa de EE.UU. vigente por al menos 6 meses. Costo: USD 32 más USD 7.30 de cita, por cada escala.</p>
      <h3>Residencia permanente</h3>
      <p>Para solicitar residencia, el interesado debe presentar:</p>
      <ul><li>Solicitud ante la Dirección General de Migración y Extranjería</li><li>Certificado de antecedentes penales de Nicaragua</li><li>Comprobante de ingresos o patrimonio que acredite sostenibilidad</li><li>Certificado médico y de vacunación según requisitos vigentes</li></ul>
      <h2>Estados Unidos</h2>
      <h3>TPS: terminado para nicaragüenses</h3>
      <p>El Estatus de Protección Temporal (TPS) para nicaragüenses fue revocado a partir del 8 de septiembre de 2025. El 10 de febrero de 2026, un tribunal federal de apelaciones (Noveno Circuito) revirtió la protección judicial que mantenía vigente el TPS para nicaragüenses y hondureños, confirmando su finalización. Quienes no cuentan con otro estatus migratorio legal quedaron indocumentados y perdieron su autorización de trabajo. Se recomienda buscar asesoría de un abogado de inmigración para revisar opciones como asilo, residencia permanente u otras visas.</p>
      <h3>Nuevo programa de fianza para visas de turismo y negocios (B1/B2)</h3>
      <p>Desde el <strong>2 de abril de 2026</strong>, Estados Unidos aplica a los nicaragüenses un programa de fianza migratoria para visas de turismo y negocios:</p>
      <ul><li>El oficial consular fija una fianza de <strong>USD 5,000, 10,000 o 15,000</strong>, pagadera al momento de la entrevista</li><li>Las nuevas visas ya <strong>no tienen validez de 10 años</strong>: son de <strong>una sola entrada</strong>, con vigencia de <strong>3 meses</strong></li><li>Permiten estadías de hasta <strong>30 días</strong> (el tiempo final lo define migración al ingresar)</li><li>Solo pueden usarse para entrar <strong>por vía aérea comercial</strong></li><li>Permanecer más tiempo del autorizado puede significar la <strong>pérdida del dinero de la fianza</strong></li><li>El programa aplica a cualquier nicaragüense sin importar el país donde tramite la visa, si usa su pasaporte nicaragüense</li><li>Las <strong>visas emitidas antes del 2 de abril de 2026 siguen siendo válidas</strong> hasta su fecha de expiración original</li></ul>
      <h3>Visa de turista (B1/B2): documentos</h3>
      <ul><li>Formulario DS-160 completado</li><li>Pasaporte vigente con validez posterior a la estadía (mínimo 6 meses después de la entrada)</li><li>Fotografía reciente con especificaciones del consulado</li><li>Comprobante de empleo, ingresos o patrocinio</li><li>Cita para entrevista en el consulado de Managua</li><li>Formulario I-94 (registra entrada y salida)</li></ul>
      <h3>Visas de trabajo temporal H-2A y H-2B</h3>
      <p>Requieren una oferta de empleo formal de un empleador estadounidense, certificación del Departamento de Trabajo y aprobación de la petición I-129 por parte del USCIS.</p>
      <h3>Contexto: sanciones a funcionarios</h3>
      <p>En junio de 2026, el Departamento de Estado de EE.UU. anunció restricciones de visa a más de 100 funcionarios nicaragüenses y sus familiares, en el marco de sanciones relacionadas con la muerte del preso político Brooklyn Rivera. Esta medida no afecta directamente a la población general, pero forma parte de un contexto de mayor tensión migratoria entre ambos países.</p>
      <h2>España</h2>
      <h3>Reforma del reglamento de extranjería 2026</h3>
      <p>España reestructuró las figuras de arraigo en <strong>cinco categorías</strong>: de segunda oportunidad, sociolaboral, social, socioformativo y familiar. El cambio más relevante para trabajadores nicaragüenses es que el <strong>arraigo sociolaboral ya no exige exclusivamente un contrato de 12 meses a tiempo completo</strong>: ahora se aceptan jornadas de 30 horas semanales y contratos fijos-discontinuos.</p>
      <h3>Regularización extraordinaria (ya cerrada)</h3>
      <p>En abril de 2026 se aprobó el Real Decreto 316/2026, que introdujo una regularización extraordinaria para personas que estuvieran en España antes del 31 de diciembre de 2025. El plazo de solicitud fue del <strong>16 de abril al 30 de junio de 2026</strong> y <strong>ya se cerró</strong>. Quienes no lo tramitaron dentro de ese plazo deben recurrir a las vías ordinarias de arraigo.</p>
      <h3>Visa Schengen de turismo</h3>
      <ul><li><strong>Costo: €90</strong> para adultos (subió desde €80), €45 para niños de 6 a 12 años, gratis para menores de 6</li><li>Formulario de solicitud de visa Schengen</li><li>Pasaporte vigente</li><li>Seguro médico con cobertura mínima de €30,000</li><li>Reservas de alojamiento y vuelo</li><li>Prueba de medios económicos para la estadía</li><li>Tiempo estimado: 15-30 días hábiles</li></ul>
      <h3>Residencia por arraigo</h3>
      <p>El arraigo permite regularizar la situación de extranjeros que acreditan permanencia continuada en España y vínculos laborales, familiares o sociales. Requiere certificado de antecedentes penales apostillado y pago de tasas administrativas. Con la reforma 2026, conviene identificar cuál de las cinco categorías de arraigo se ajusta mejor al caso particular antes de iniciar el trámite.</p>
      <h2>Documentos comunes para la mayoría de trámites</h2>
      <ul><li>Certificado de nacimiento apostillado</li><li>Certificado de matrimonio o divorcio (si aplica)</li><li>Certificado de antecedentes penales apostillado</li><li>Títulos académicos o certificaciones laborales (para visas de trabajo)</li></ul>
      <p><strong>Importante:</strong> conseguir cita para apostillar documentos en la Cancillería de Nicaragua está tomando hasta 4 meses según reportes de mayo de 2026. Ver nuestra guía de apostillas para más detalles sobre este atraso.</p>
      <h2>Tiempos y costos actualizados</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Trámite</th><th style="padding:10px;text-align:left;">Tiempo estimado</th><th style="padding:10px;text-align:left;">Costo aproximado</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Visa turismo Costa Rica</td><td style="padding:10px;text-align:left;">Cita + trámite en consulado</td><td style="padding:10px;text-align:left;">USD 30 + USD 7.30 cita</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Visa tránsito aeroportuario Costa Rica</td><td style="padding:10px;text-align:left;">Trámite en consulado</td><td style="padding:10px;text-align:left;">USD 32 + USD 7.30 cita</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Visa B1/B2 EE.UU. (nueva, desde abril 2026)</td><td style="padding:10px;text-align:left;">Cita consular + fianza</td><td style="padding:10px;text-align:left;">USD 185 (trámite) + fianza USD 5,000-15,000</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Visa Schengen España</td><td style="padding:10px;text-align:left;">15-30 días hábiles</td><td style="padding:10px;text-align:left;">€90</td></tr><tr style=""><td style="padding:10px;text-align:left;">Residencia Costa Rica</td><td style="padding:10px;text-align:left;">3-12 meses según categoría</td><td style="padding:10px;text-align:left;">USD 50-300</td></tr></tbody></table>
    `,
    faqs: [
      { question: '¿Sigue existiendo el TPS para nicaragüenses en EE.UU.?', answer: 'No. Fue revocado desde el 8 de septiembre de 2025 y un tribunal de apelaciones confirmó su finalización el 10 de febrero de 2026.' },
      { question: '¿Cuánto es la fianza para la visa de turista de EE.UU.?', answer: 'Entre USD 5,000 y 15,000, según determine el oficial consular en la entrevista. Aplica a solicitudes hechas desde el 2 de abril de 2026 en adelante.' },
      { question: '¿Necesito visa para entrar a Costa Rica si ya tengo visa de EE.UU.?', answer: 'No, si la visa o residencia estadounidense (o canadiense) tiene al menos 3 meses de vigencia al momento de ingresar.' },
      { question: '¿Puedo todavía aplicar a la regularización extraordinaria en España?', answer: 'No. El plazo fue del 16 de abril al 30 de junio de 2026 y ya cerró. Las vías vigentes son las categorías ordinarias de arraigo.' },
      { question: '¿Puedo trabajar en Costa Rica con visa de turista?', answer: 'No. La visa de turista no autoriza trabajar. Se requiere una visa de residente o permiso de trabajo específico.' }
    ],
  },
  {
    slug: 'salario-minimo-nicaragua-2026',
    title: 'Salario mínimo Nicaragua 2026: tabla completa por sector y categoría',
    description: 'Cuánto es el salario mínimo en Nicaragua en 2026. Tabla actualizada por sector: agropecuario, servicios, industria, comercio, construcción y hogar.',
    category: 'Economía',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-01-05',
    updatedDate: '2026-07-30',
    content: `
      <blockquote><h3>Qué cambió desde la última actualización (17 de junio de 2026)</h3><ul><li>La tabla de sectores que publicábamos antes no coincidía con las categorías oficiales de la Ley 625: son <strong>9 sectores</strong> (no 5), más zona franca aparte.</li><li>El ajuste vigente para el período <strong>marzo 2026 - febrero 2027</strong> fue de <strong>4%</strong> para 8 de los 9 sectores, aprobado el <strong>5 de marzo de 2026</strong>, con retroactividad al 1 de marzo.</li><li>Zona franca tuvo un ajuste distinto, de <strong>6.7%</strong>, por un acuerdo separado firmado en octubre de 2022.</li><li>El salario mínimo promedio (C$9,314) cubre apenas el <strong>43.8%</strong> del costo de la canasta básica familiar, según cifras del INIDE de enero de 2026.</li></ul></blockquote>
      <p>El salario mínimo en Nicaragua para el período que va de marzo de 2026 a febrero de 2027 fue fijado por la Comisión Nacional del Salario Mínimo el 5 de marzo de 2026, con un ajuste del 4% para la mayoría de sectores, tras un acuerdo entre el Ministerio del Trabajo (MITRAB), representantes sindicales y empresariales. El ajuste beneficia a unos 325,000 trabajadores formales de nueve sectores económicos. Esta guía detalla los montos vigentes por sector, quién los fija y qué hacer si su empleador le paga menos del mínimo.</p>
      <h2>Tabla oficial de salarios mínimos 2026 (vigente 1 marzo 2026 - 28 febrero 2027)</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Sector económico</th><th style="padding:10px;text-align:left;">C$/mes 2025</th><th style="padding:10px;text-align:left;">C$/mes 2026 (+4%)</th><th style="padding:10px;text-align:left;">Nota</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Agropecuario</td><td style="padding:10px;text-align:left;">5,950.02</td><td style="padding:10px;text-align:left;"><strong>6,188.02</strong></td><td style="padding:10px;text-align:left;">Más alimentación a cargo del empleador</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Micro y pequeña industria artesanal y turística</td><td style="padding:10px;text-align:left;">6,268.00</td><td style="padding:10px;text-align:left;"><strong>6,519.00</strong></td><td style="padding:10px;text-align:left;"></td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Industria manufacturera</td><td style="padding:10px;text-align:left;">7,999.00</td><td style="padding:10px;text-align:left;"><strong>8,320.38</strong></td><td style="padding:10px;text-align:left;"></td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Pesca y acuicultura</td><td style="padding:10px;text-align:left;">9,047.00</td><td style="padding:10px;text-align:left;"><strong>9,409.09</strong></td><td style="padding:10px;text-align:left;"></td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Industria sujeta a régimen especial</td><td style="padding:10px;text-align:left;">9,602.00</td><td style="padding:10px;text-align:left;"><strong>9,986.46</strong></td><td style="padding:10px;text-align:left;"></td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Electricidad, gas, agua, comercio, hoteles, transporte</td><td style="padding:10px;text-align:left;">10,913.54</td><td style="padding:10px;text-align:left;"><strong>11,350.08</strong></td><td style="padding:10px;text-align:left;">Sector más amplio, cubre a la mayoría de trabajadores urbanos</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Minas y canteras</td><td style="padding:10px;text-align:left;">10,686.00</td><td style="padding:10px;text-align:left;"><strong>11,113.46</strong></td><td style="padding:10px;text-align:left;"></td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Construcción, financieros y seguros</td><td style="padding:10px;text-align:left;">13,315.00</td><td style="padding:10px;text-align:left;"><strong>13,848.23</strong></td><td style="padding:10px;text-align:left;">El más alto</td></tr><tr style=""><td style="padding:10px;text-align:left;">Zona franca (acuerdo separado desde octubre 2022)</td><td style="padding:10px;text-align:left;">8,771.00</td><td style="padding:10px;text-align:left;"><strong>9,359.46</strong></td><td style="padding:10px;text-align:left;">+6.7%, no +4%</td></tr></tbody></table>
      <p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: valores oficiales según acta de la Comisión Nacional del Salario Mínimo del 5 de marzo de 2026, publicados por MITRAB. El tipo de cambio de referencia del BCN para 2026 es fijo, de C$36.6243 por USD 1.00 durante todo el año.</em></p>
      <h2>¿Cómo saber cuál es mi salario mínimo?</h2>
      <p>El salario mínimo depende de la <strong>actividad económica de su empleador</strong>, no de su cargo, título o especialidad. Por ejemplo: un contador que trabaja en un banco tiene el mínimo del sector financiero (C$13,848.23); el mismo contador en una empresa de construcción tiene el mismo mínimo, porque construcción y financieros comparten categoría. Un guardia de seguridad en una empresa agropecuaria tiene el mínimo agropecuario; el mismo guardia en un banco tiene el mínimo financiero.</p>
      <h2>¿Quién define el salario mínimo?</h2>
      <p>La Comisión Nacional del Salario Mínimo, conformada por representantes del gobierno, empleadores y trabajadores (a través del Frente Nacional de los Trabajadores, FNT), fija los ajustes. El MITRAB publica los valores oficiales y los difunde por sus canales institucionales. Para 2026, la negociación comenzó tarde: la comisión se instaló hasta el 13 de febrero, menos de dos semanas antes de que vencieran los salarios del período anterior.</p>
      <h2>Salario mínimo frente a la canasta básica</h2>
      <p>El salario mínimo promedio de los 9 sectores es de aproximadamente <strong>C$9,314 mensuales</strong>. Según el INIDE, la canasta básica familiar se valoró en <strong>C$21,249.74</strong> en enero de 2026, lo que significa que el salario mínimo promedio cubre apenas el <strong>43.8%</strong> del costo de la canasta. Ni siquiera el salario mínimo más alto (construcción y financieros, C$13,848.23) alcanza a cubrir el costo diario completo de la canasta básica una vez descontados impuestos y aportes al INSS.</p>
      <h2>Evolución reciente del salario mínimo</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Período</th><th style="padding:10px;text-align:left;">Sector comercio (C$/mes)</th><th style="padding:10px;text-align:left;">Sector agropecuario (C$/mes)</th><th style="padding:10px;text-align:left;">Incremento</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Mar 2023 - Feb 2024</td><td style="padding:10px;text-align:left;">9,780.00</td><td style="padding:10px;text-align:left;">5,330.00</td><td style="padding:10px;text-align:left;">+8%</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Mar 2024 - Feb 2025</td><td style="padding:10px;text-align:left;">10,494.00</td><td style="padding:10px;text-align:left;">5,730.00</td><td style="padding:10px;text-align:left;">+7.3%</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Mar 2025 - Feb 2026</td><td style="padding:10px;text-align:left;">10,913.54</td><td style="padding:10px;text-align:left;">5,950.02</td><td style="padding:10px;text-align:left;">+4%</td></tr><tr style="background:#f9fafb;"><td style="padding:10px;text-align:left;">Mar 2026 - Feb 2027</td><td style="padding:10px;text-align:left;">11,350.08</td><td style="padding:10px;text-align:left;">6,188.02</td><td style="padding:10px;text-align:left;">+4%</td></tr></tbody></table>
      <h2>¿Qué pasa si un empleador paga menos?</h2>
      <p>Pagar por debajo del salario mínimo constituye una infracción laboral sancionable. El trabajador puede presentar una denuncia en las delegaciones departamentales del MITRAB. Es recomendable llevar copia del contrato, recibos de pago y cualquier documento que acredite la relación laboral. Si fue despedido después del 1 de marzo de 2026, su liquidación debe calcularse con el nuevo salario mínimo 2026, no con el del período anterior; si le calcularon con el monto viejo, tiene derecho a reclamar la diferencia.</p>
    `,
    faqs: [
      { question: '¿Cuál es el salario mínimo mensual en Nicaragua 2026?', answer: 'Varía por sector: desde C$6,188.02 (agropecuario) hasta C$13,848.23 (construcción, financieros y seguros). El promedio simple entre los 9 sectores es de C$9,314.' },
      { question: '¿Desde cuándo rige el salario mínimo 2026?', answer: 'Desde el 1 de marzo de 2026, de forma retroactiva, y estará vigente hasta el 28 de febrero de 2027.' },
      { question: '¿El salario mínimo en zona franca es diferente?', answer: 'Sí. Zona franca se rige por un acuerdo propio desde octubre de 2022, con un ajuste de 6.7% para 2026, distinto al 4% del resto de sectores.' },
      { question: '¿El salario del sector agropecuario incluye alimentación?', answer: 'Sí. El empleador debe proveer alimentación además del salario de C$6,188.02. Si no lo hace, debe pagar el equivalente en dinero.' },
      { question: '¿Se aplica el salario mínimo a trabajadores informales?', answer: 'El salario mínimo aplica a relaciones laborales formales. La protección depende de que exista un contrato o relación laboral reconocida.' }
    ],
  },
  {
    slug: 'costo-de-vida-nicaragua-2026',
    title: 'Costo de vida en Nicaragua 2026: presupuesto mensual para familia y persona sola',
    description: 'Cuánto cuesta vivir en Nicaragua en 2026. Presupuesto mensual: alquiler, comida, transporte, servicios, educación y salud. Comparativa Managua vs provincias.',
    category: 'Economía',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-03-01',
    updatedDate: '2026-07-30',
    content: `
      <blockquote><h3>Qué cambió desde la última actualización (17 de junio de 2026)</h3><ul><li>Datos oficiales del INIDE muestran que la <strong>canasta básica subió de forma sostenida</strong> durante 2026: de C$20,821.68 en diciembre de 2025 a <strong>C$21,372.90 en mayo de 2026</strong> (dato oficial más reciente disponible), un incremento de C$551.22 en cinco meses.</li><li>Casi el <strong>93% de ese aumento</strong> se concentró en alimentos.</li><li>El salario mínimo promedio (C$9,314) cubre menos de la mitad de la canasta básica; ni siquiera el salario mínimo más alto la cubre por completo.</li><li>El propio cálculo del INIDE asigna solo <strong>C$900 mensuales</strong> de alquiler dentro de la canasta básica, una cifra muy por debajo de los precios reales de alquiler que reportamos en esta guía.</li></ul></blockquote>
      <p>El costo de vida en Nicaragua sigue siendo uno de los más bajos de Centroamérica, pero la brecha entre lo que cuesta vivir y lo que gana un trabajador promedio se ha ampliado durante 2026. Esta guía combina el presupuesto mensual estimado con los datos oficiales más recientes del Instituto Nacional de Información de Desarrollo (INIDE) sobre la canasta básica.</p>
      <h2>La canasta básica en 2026: evolución mes a mes</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Mes</th><th style="padding:10px;text-align:left;">Costo total canasta básica (C$)</th><th style="padding:10px;text-align:left;">Componente alimentos (C$)</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Diciembre 2025</td><td style="padding:10px;text-align:left;">20,821.68</td><td style="padding:10px;text-align:left;">14,817.46</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Enero 2026</td><td style="padding:10px;text-align:left;">21,249.74</td><td style="padding:10px;text-align:left;">15,233.82</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Febrero 2026</td><td style="padding:10px;text-align:left;">21,164.00</td><td style="padding:10px;text-align:left;">—</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Abril 2026</td><td style="padding:10px;text-align:left;">21,245.69</td><td style="padding:10px;text-align:left;">15,207.41</td></tr><tr style=""><td style="padding:10px;text-align:left;">Mayo 2026</td><td style="padding:10px;text-align:left;">21,372.90</td><td style="padding:10px;text-align:left;">15,328.35</td></tr></tbody></table>
      <p>Para cubrir el costo total de la canasta básica se necesitan alrededor de C$705 diarios, lo que equivale a más de tres salarios mínimos promedio. Incluso el salario mínimo más alto (construcción y financieros, C$13,848.23 mensuales) solo cubre cerca del 65% de la canasta, una vez descontados impuestos y aportes al INSS.</p>
      <h2>Presupuesto mensual: persona sola</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Rubro</th><th style="padding:10px;text-align:left;">Managua (C$)</th><th style="padding:10px;text-align:left;">Provincia (C$)</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Alquiler (apartamento 1 hab)</td><td style="padding:10px;text-align:left;">8,000 - 15,000</td><td style="padding:10px;text-align:left;">4,000 - 8,000</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Alimentación</td><td style="padding:10px;text-align:left;">6,000 - 10,000</td><td style="padding:10px;text-align:left;">4,500 - 7,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Transporte (bus + taxi ocasional)</td><td style="padding:10px;text-align:left;">1,500 - 3,000</td><td style="padding:10px;text-align:left;">1,000 - 2,000</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Servicios (luz, agua, internet)</td><td style="padding:10px;text-align:left;">2,500 - 4,500</td><td style="padding:10px;text-align:left;">1,500 - 3,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Celular</td><td style="padding:10px;text-align:left;">500 - 1,200</td><td style="padding:10px;text-align:left;">500 - 1,000</td></tr><tr style="background:#fef3c7;"><td style="padding:10px;text-align:left;"><strong>TOTAL ESTIMADO</strong></td><td style="padding:10px;text-align:left;"><strong>18,500 - 33,700</strong></td><td style="padding:10px;text-align:left;"><strong>11,500 - 21,000</strong></td></tr></tbody></table>
      <h2>Presupuesto mensual: familia de 4</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Rubro</th><th style="padding:10px;text-align:left;">Managua (C$)</th><th style="padding:10px;text-align:left;">Provincia (C$)</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Alquiler (casa 3 hab)</td><td style="padding:10px;text-align:left;">18,000 - 35,000</td><td style="padding:10px;text-align:left;">8,000 - 18,000</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Alimentación</td><td style="padding:10px;text-align:left;">18,000 - 28,000</td><td style="padding:10px;text-align:left;">12,000 - 20,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Transporte</td><td style="padding:10px;text-align:left;">4,000 - 7,000</td><td style="padding:10px;text-align:left;">2,500 - 5,000</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Servicios</td><td style="padding:10px;text-align:left;">4,500 - 8,000</td><td style="padding:10px;text-align:left;">3,000 - 5,500</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Educación (colegio privado)</td><td style="padding:10px;text-align:left;">6,000 - 15,000</td><td style="padding:10px;text-align:left;">3,000 - 8,000</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Salud (seguro privado)</td><td style="padding:10px;text-align:left;">3,000 - 8,000</td><td style="padding:10px;text-align:left;">2,000 - 5,000</td></tr><tr style="background:#fef3c7;"><td style="padding:10px;text-align:left;"><strong>TOTAL ESTIMADO</strong></td><td style="padding:10px;text-align:left;"><strong>53,500 - 101,000</strong></td><td style="padding:10px;text-align:left;"><strong>30,500 - 61,500</strong></td></tr></tbody></table>
      <p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: los valores de esta tabla son estimaciones de mercado (alquiler, alimentación fuera de la canasta oficial, servicios, educación y salud), distintas de la canasta básica del INIDE, que mide solo 53 productos básicos con supuestos fijos (por ejemplo, C$900 de alquiler mensual, una cifra muy por debajo del mercado real en Managua).</em></p>
      <h2>¿Por qué la canasta básica oficial "no cuadra" con el costo real de vivir?</h2>
      <p>La canasta básica del INIDE es un índice técnico pensado para medir 53 productos esenciales, no un presupuesto de vida completo. Por eso asigna solo C$900 mensuales al rubro de alquiler, muy por debajo de lo que cuesta arrendar en la práctica (ver tabla de presupuesto arriba). Esto explica por qué es común escuchar que "la canasta básica no refleja la realidad": técnicamente mide una canasta de subsistencia, no el costo de vida completo de un hogar urbano.</p>
      <h2>Comparativa con otros países centroamericanos</h2>
      <p>Nicaragua suele ubicarse por debajo de Costa Rica, Panamá y Guatemala en gastos de alojamiento y alimentación. Los alquileres en Managua son comparables a los de ciudades como Tegucigalpa, mientras que los productos agrícolas locales tienden a ser más económicos.</p>
      <h2>Consejos para reducir gastos</h2>
      <ul><li>Compre frutas y verduras en mercados municipales en lugar de supermercados</li><li>Use buses en lugar de taxis privados para trayectos cotidianos</li><li>Contrate planes combinados de internet y telefonía según el uso real</li><li>Considere zonas aledañas a Managua si busca menores costos de alquiler</li></ul>
    `,
    faqs: [
      { question: '¿Cuánto cuesta la canasta básica en Nicaragua en 2026?', answer: 'Según el último dato oficial confirmado del INIDE, C$21,372.90 en mayo de 2026, con una tendencia sostenida al alza desde diciembre de 2025.' },
      { question: '¿Cuánto necesita ganar una persona sola para vivir en Managua?', answer: 'Con un ingreso de C$20,000 a C$25,000 mensuales, una persona sola puede cubrir alquiler modesto, alimentación, transporte y servicios básicos en Managua.' },
      { question: '¿El salario mínimo alcanza para cubrir la canasta básica?', answer: 'No. Ni siquiera el salario mínimo más alto (C$13,848.23) cubre el costo total de la canasta básica una vez descontados impuestos y aportes al INSS.' },
      { question: '¿Es más barato vivir en provincias?', answer: 'Sí. Los alquileres y algunos servicios suelen ser más económicos fuera de Managua, aunque la disponibilidad de empleo formal puede ser menor.' }
    ],
  },
  {
    slug: 'mejores-playas-nicaragua-2026',
    title: 'Mejores playas de Nicaragua 2026: ranking, costos y cómo llegar',
    description: 'Ranking de las mejores playas de Nicaragua. San Juan del Sur, Corn Island, Las Peñitas, Popoyo. Costos, transporte, surf, alojamiento y seguridad.',
    category: 'Turismo',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-02-15',
    updatedDate: '2026-06-17',
    content: `<h2>Mejores playas de Nicaragua 2026</h2><p>Nicaragua cuenta con casi 300 kilómetros de costa en el Pacífico y más de 450 kilómetros en el Caribe. Este territorio ofrece playas para surfistas, familias, buceadores y viajeros que buscan destinos poco masificados. Esta guía resume las principales playas del país, cómo llegar, costos aproximados y recomendaciones de seguridad.</p><h2>Principales playas del Pacífico nicaragüense</h2><p>La costa del Pacífico concentra la mayoría de destinos accesibles desde Managua y es conocida por sus atardeceres, oleaje para surf y ambiente relajado.</p><ul><li><strong>San Juan del Sur:</strong> Bahía turística con restaurantes, hospedajes, pesca deportiva y actividades acuáticas. Ubicada a unos 140 km de Managua.</li><li><strong>Playa Maderas:</strong> Playa de surf a 15 minutos de San Juan del Sur, con oleaje para distintos niveles y ambiente tranquilo.</li><li><strong>Playa Popoyo:</strong> Reconocida por sus olas de tubo, es una de las playas favoritas de surfistas experimentados. Se encuentra cerca de Tola, a unos 130 km de Managua.</li><li><strong>Las Peñitas (León):</strong> Playa cercana a la ciudad de León, ideal para familias y surfistas principiantes.</li><li><strong>Playa El Coco:</strong> Playa familiar a pocos minutos de San Juan del Sur, con oleaje suave y poco concurrida.</li><li><strong>Playa La Boquita (Carazo):</strong> Frecuentada por familias locales, ofrece pescado fresco y ambiente auténtico a poco más de una hora de Managua.</li></ul><h2>Playas del Caribe nicaragüense</h2><p>El Caribe de Nicaragua, con menor desarrollo turístico, destaca por aguas cristalinas, arrecifes y cultura afrocaribeña.</p><ul><li><strong>Corn Island:</strong> Archipiélago con playas de arena blanca, buceo, snorkel y gastronomía caribeña. Se accede por vuelo desde Managua o lancha desde Bluefields.</li><li><strong>Little Corn Island:</strong> Isla pequeña sin vehículos, ideal para desconectar. Requiere lancha desde Corn Island.</li></ul><h2>Comparativa de costos estimados por día</h2><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Destino</th><th style="padding:10px;text-align:right;">Diario USD (aprox.)</th><th style="padding:10px;text-align:center;">Perfil</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">San Juan del Sur</td><td style="padding:10px;text-align:right;">40 - 80</td><td style="padding:10px;text-align:center;">Turístico</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Corn Island</td><td style="padding:10px;text-align:right;">60 - 100</td><td style="padding:10px;text-align:center;">Turístico / Caribe</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Popoyo / Maderas</td><td style="padding:10px;text-align:right;">20 - 50</td><td style="padding:10px;text-align:center;">Surf</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Las Peñitas / El Coco</td><td style="padding:10px;text-align:right;">15 - 40</td><td style="padding:10px;text-align:center;">Familiar</td></tr><tr><td style="padding:10px;">La Boquita</td><td style="padding:10px;text-align:right;">10 - 20</td><td style="padding:10px;text-align:center;">Local</td></tr></tbody></table><p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: los costos son estimaciones referenciales que incluyen alimentación básica, transporte local y hospedaje económico. Los precios varían según temporada y tipo de servicio.</em></p><h2>Recomendaciones de seguridad</h2><ul><li>No deje objetos de valor desatendidos en la playa.</li><li>Respete las señales de banderas de seguridad: rojo indica peligro y amarillo precaución.</li><li>Consulte a locales sobre corrientes marinas antes de nadar, especialmente en el Caribe.</li><li>Use protector solar, sombrero y hidratación constante por el clima tropical.</li></ul><h2>Preguntas frecuentes</h2><h3>¿Cuál es la mejor playa para surf en Nicaragua?</h3><p>Playa Popoyo y Playa Maderas son las más reconocidas por sus condiciones de surf. Popoyo es ideal para surfistas experimentados, mientras que Maderas ofrece olas para diferentes niveles.</p><h3>¿Cómo llegar a Corn Island?</h3><p>Se puede llegar en vuelo desde Managua (aproximadamente 1h 20min) o en lancha desde Bluefields (aproximadamente 6 horas).</p><h3>¿Cuándo es la mejor época para visitar las playas?</h3><p>La temporada de noviembre a abril es la más seca y soleada, ideal para la costa del Pacífico. Para el Caribe, los meses de febrero a mayo suelen tener menos lluvia.</p><h2>Fuentes consultadas</h2><p>Información basada en datos del Instituto Nicaragüense de Turismo (INTUR), reportes de operadores turísticos locales y guías de viaje reconocidas. Los costos son estimaciones referenciales y pueden variar según temporada.</p>`,
    faqs: [
      { question: '¿Cuál es la mejor playa para surf en Nicaragua?', answer: 'Popoyo y Playa Maderas son las mejores para surf. Popoyo tiene olas de tubo para expertos. Maderas es ideal para intermedios.' },
      { question: '¿Es seguro viajar a Corn Island?', answer: 'Sí. Corn Island es seguro para turistas. Se recomienda precaución estándar como en cualquier destino turístico.' },
      { question: '¿Cuánto cuesta un viaje de 3 días a San Juan del Sur?', answer: 'Aproximadamente $150-300 USD por persona incluyendo transporte, hospedaje medio y comidas.' },
    ],
  },
  {
    slug: 'dolar-a-cordoba-nicaragua-hoy-2026',
    title: 'Dólar a córdoba Nicaragua hoy 2026: tipo de cambio actualizado',
    description: 'Tipo de cambio del dólar a córdoba en Nicaragua 2026. Cotización oficial del BCN, paralelo y en bancos. Conversor y tendencias del tipo de cambio.',
    category: 'Economía',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-01-01',
    updatedDate: '2026-07-30',
    content: `
      <blockquote><h3>Qué cambió desde la última actualización (17 de junio de 2026)</h3><ul><li>El BCN <strong>eliminó el deslizamiento cambiario</strong> (la depreciación gradual y programada del córdoba) para todo 2026: la tasa de deslizamiento es <strong>0% anual</strong>.</li><li>Como resultado, el tipo de cambio oficial está <strong>fijo en C$36.6243 por USD 1.00 durante todo el año 2026</strong>, del 1 de enero al 31 de diciembre.</li><li>Esto es un cambio de fondo frente al sistema de "minidevaluaciones" diarias que Nicaragua usó por años.</li></ul></blockquote>
      <p>Desde 2026, el Banco Central de Nicaragua (BCN) cambió la forma en que administra el tipo de cambio. Antes, el córdoba se depreciaba de forma gradual y diaria frente al dólar mediante un mecanismo de "deslizamiento" o minidevaluación programada. El BCN anunció que, para todo el año 2026, esa tasa de deslizamiento se mantiene en <strong>0% anual</strong>, lo que significa que el tipo de cambio oficial es fijo durante los doce meses del año.</p>
      <h2>Tipo de cambio oficial 2026</h2>
      <p><strong>C$ 36.6243 por USD 1.00</strong>, vigente sin variación desde el 1 de enero hasta el 31 de diciembre de 2026, según lo publicado por el BCN.</p>
      <p>Este es el cambio más importante en la política cambiaria nicaragüense en años recientes: el país pasa de una devaluación gradual y predecible a una tasa fija por todo el año. Según el BCN, la decisión responde al objetivo de anclar expectativas y preservar el poder adquisitivo de la población en un contexto de crecimiento económico sostenido.</p>
      <h2>Tipo de cambio en el mercado (referencial, julio 2026)</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Mercado</th><th style="padding:10px;text-align:left;">Compra (C$/USD)</th><th style="padding:10px;text-align:left;">Venta (C$/USD)</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">BCN (oficial, fijo todo 2026)</td><td style="padding:10px;text-align:left;">36.6243</td><td style="padding:10px;text-align:left;">36.6243</td></tr><tr style="background:#f9fafb;"><td style="padding:10px;text-align:left;">Bancos comerciales y casas de cambio (Managua)</td><td style="padding:10px;text-align:left;">~36.20 - 36.40</td><td style="padding:10px;text-align:left;">~36.60 - 36.90</td></tr></tbody></table>
      <p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: aunque el tipo de cambio oficial del BCN es fijo, bancos y casas de cambio siguen aplicando su propio spread (diferencia entre compra y venta) sobre esa referencia. A finales de julio de 2026, la venta promedio en Managua rondaba los C$36.64 por dólar. Verifique la tasa exacta con su banco, ya que puede variar levemente día a día según la entidad.</em></p>
      <h2>¿Cómo se determina el tipo de cambio en Nicaragua en 2026?</h2>
      <p>El BCN fija el tipo de cambio oficial de referencia, y para 2026 decidió mantener la tasa de deslizamiento en 0%, es decir, sin devaluación programada durante todo el año. Bancos, casas de cambio y otros agentes aplican sus propios márgenes (spreads) sobre esa referencia oficial, por lo que el precio final que usted paga o recibe varía ligeramente según dónde cambie.</p>
      <h2>Dónde cambiar dólares en Nicaragua</h2>
      <ul><li><strong>Bancos comerciales:</strong> Banpro, BAC y Lafise Bancentro ofrecen tasas competitivas para montos grandes. Requieren identificación.</li><li><strong>Casas de cambio:</strong> concentradas en la zona bancaria de Managua y el Mercado Oriental. Mayor flexibilidad de horarios pero spreads más amplios.</li><li><strong>Remesas:</strong> Western Union, MoneyGram y Ria aplican un tipo de cambio corporativo, generalmente menor que el bancario.</li><li><strong>Tarjetas de crédito y débito:</strong> los bancos aplican el tipo de cambio de las redes Visa o Mastercard más una comisión internacional.</li></ul>
      <h2>Consejos para obtener mejor tipo de cambio</h2>
      <ul><li>Cambie montos grandes en bancos para obtener mejores tasas.</li><li>Evite cambiar en aeropuertos y hoteles, donde los spreads suelen ser más altos.</li><li>Compare tasas entre al menos dos bancos o casas de cambio.</li><li>Considere transferencias bancarias para montos elevados en lugar de efectivo.</li></ul>
      <h2>Histórico y tendencias</h2>
      <p>El córdoba se depreció de forma gradual frente al dólar durante más de una década, pasando de cerca de C$34.50 en 2020 a C$36.6243 en 2026. Con la decisión del BCN de fijar la tasa de deslizamiento en 0% para todo 2026, el tipo de cambio oficial no debería moverse durante el resto del año, salvo un cambio de política.</p>
    `,
    faqs: [
      { question: '¿A cuánto está el dólar en Nicaragua hoy?', answer: 'El tipo de cambio oficial del BCN es fijo en C$36.6243 por USD 1.00 durante todo 2026. En bancos y casas de cambio, la venta ronda los C$36.60-36.90.' },
      { question: '¿Por qué el tipo de cambio ya no sube cada día como antes?', answer: 'Porque el BCN fijó la tasa de deslizamiento cambiario en 0% para 2026: eliminó, por ahora, la depreciación diaria programada que se aplicaba en años anteriores.' },
      { question: '¿Dónde es mejor cambiar dólares en Nicaragua?', answer: 'Los bancos comerciales (Banpro, BAC, Lafise) suelen ofrecer mejores tasas para montos grandes. Las casas de cambio son más ágiles pero con spreads mayores.' },
      { question: '¿Se puede usar dólares en Nicaragua?', answer: 'Sí, el dólar es ampliamente aceptado en hoteles, restaurantes turísticos y comercios grandes. En mercados y transporte público se prefiere el córdoba.' }
    ],
  },
  {
    slug: 'gastronomia-nicaragua-platos-tipicos-2026',
    title: 'Gastronomía de Nicaragua: platos típicos, ingredientes y dónde probarlos',
    description: 'Descubre la rica gastronomía nicaragüense. Gallo pinto, nacatamales, vigorón, quesillo y más. Guía de platos típicos, ingredientes y mejores lugares para comer.',
    category: 'Cultura',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-06-25',
    updatedDate: '2026-06-25',
    content: `
      <h2>La gastronomía de Nicaragua</h2>
      <p>La cocina nicaragüense es una fusión de tradiciones indígenas, españolas y caribeñas. Sus platos se caracterizan por el uso de maíz, frijoles, plátano, yuca, queso fresco y carnes. Cada región del país aporta sabores únicos que reflejan su historia y su gente. Esta guía recorre los platos más representativos de Nicaragua.</p>
      <h2>Platos típicos imprescindibles</h2>
      <h3>1. Gallo pinto</h3>
      <p>El plato nacional por excelencia. Arroz mezclado con frijoles rojos, cebolla, pimienta y salsa Lizano. Se sirve en desayuno y cena, acompañado de huevo, queso frito, plátano maduro o tortilla. En la Costa Caribe se conoce como <em>rice and beans</em> y se cocina con leche de coco.</p>
      <h3>2. Nacatamal</h3>
      <p>El nacatamal es herencia de la gastronomía precolombina. Se prepara con masa de maíz, manteca, sal, papas, arvejas, tomate, cebolla, chiltoma y un trozo de carne de cerdo o pollo. Todo se envuelve en hojas de plátano y se cocina al vapor durante varias horas. Es tradición comerlo los domingos y en Navidad.</p>
      <h3>3. Vigorón</h3>
      <p>Plato originario de Granada. Yuca cocida, chicharrón y ensalada de repollo curtido en vinagre. Se sirve en hoja de plátano y es muy popular en festividades y mercados.</p>
      <h3>4. Quesillo</h3>
      <p>Tortilla de maíz rellena de queso fresco, cebolla curtida en vinagre y crema. Se vende en carretillas a orillas de carreteras, especialmente entre Managua y León. Es uno de los bocadillos más queridos del país.</p>
      <h3>5. Indio viejo</h3>
      <p>Sopa espesa de origen indígena. Se prepara con masa de maíz desgranada, carne deshebrada, achiote, cebolla, ají y hierbabuena. Su textura es similar a la de una polenta suave y se sirve en plato hondo.</p>
      <h3>6. Sopa de mondongo</h3>
      <p>Sopa de callos de res cocidos lentamente con verduras, especias y naranja agria. Se considera un remedio para la resaca y se consume especialmente los domingos por la mañana.</p>
      <h3>7. Tres leches</h3>
      <p>El postre más famoso de Nicaragua. Bizcocho empapado en tres tipos de leche: evaporada, condensada y crema. Se cubre con merengue y puede llevar canela o ron. Es indispensable en cumpleaños, bodas y fiestas patronales.</p>
      <h2>Bebidas típicas</h2>
      <ul>
        <li><strong>Chicha de maíz:</strong> Bebida fermentada de maíz, tradicional en el Pacífico. Dulce, espesa y refrescante.</li>
        <li><strong>Cacao:</strong> Bebida de cacao molido con agua o leche, canela y azúcar. Se toma caliente o fría.</li>
        <li><strong>Pinolillo:</strong> Bebida de maíz tostado molido con cacao y canela. Se disuelve en agua o leche fría y es muy popular en el campo.</li>
        <li><strong>Macuá:</strong> Cóctel nacional a base de ron flor de caña, jugo de limón, naranja, granadina y azúcar. Refrescante y tropical.</li>
        <li><strong>Elote:</strong> Bebida de maíz tierno licuado con leche, canela y azúcar. Muy común en fiestas y mercados.</li>
      </ul>
      <h2>Ingredientes base de la cocina nicaragüense</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Ingrediente</th><th style="padding:10px;text-align:left;">Uso principal</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Maíz</td><td style="padding:10px;">Tortillas, nacatamales, atol, pinolillo</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Frijoles</td><td style="padding:10px;">Gallo pinto, sopa de frijoles</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Yuca</td><td style="padding:10px;">Vigorón, yuca frita, sopa</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Plátano</td><td style="padding:10px;">Tajadas, maduro frito, plátano en tentación</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Queso fresco</td><td style="padding:10px;">Quesillo, cuajada, ensalada</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px;">Achiote</td><td style="padding:10px;">Colorante natural para arroces y carnes</td></tr>
      </tbody></table>
      <h2>Dónde probar la gastronomía típica</h2>
      <ul>
        <li><strong>Granada:</strong> Vigorón en el Parque Central, comida tradicional en restaurantes coloniales.</li>
        <li><strong>Masaya:</strong> Mercado de Artesanías con comida típica, nacatamales los domingos.</li>
        <li><strong>León:</strong> Sopa de mondongo en mercados, dulces tradicionales en Subtiava.</li>
        <li><strong>Rivas:</strong> Mariscos frescos en San Juan del Sur, ceviche de pescado.</li>
        <li><strong>Bluefields y Corn Island:</strong> Rondon, pan de coco, rice and beans con coco.</li>
      </ul>
    
      <h2>Preguntas frecuentes</h2>
      <h3>¿Cuál es el plato típico más famoso de Nicaragua?</h3>
      <p>El gallo pinto es considerado el plato nacional. Se consume a diario y consiste en arroz mezclado con frijoles, cebolla y especias.</p>
      <h3>¿Qué es el pinolillo?</h3>
      <p>Es una bebida tradicional hecha con maíz tostado molido, cacao y canela. Se disuelve en agua o leche fría y es muy popular en el campo nicaragüense.</p>
      <h3>¿Cuál es el postre más popular de Nicaragua?</h3>
      <p>El tres leches. Es un bizcocho empapado en tres tipos de leche y cubierto con merengue, indispensable en celebraciones.</p>
      
      <h2>Fuentes consultadas</h2>
      <p>Información basada en la tradición gastronómica nicaragüense documentada por el Instituto Nicaragüense de Turismo (INTUR), la Secretaría de Cultura y Patrimonio y publicaciones especializadas sobre cocina centroamericana.</p>
    `,
    faqs: [
      { question: '¿Cuál es el plato típico más famoso de Nicaragua?', answer: 'El gallo pinto es considerado el plato nacional. Se consume a diario y consiste en arroz mezclado con frijoles, cebolla y especias.' },
      { question: '¿Qué es el pinolillo?', answer: 'Es una bebida tradicional hecha con maíz tostado molido, cacao y canela. Se disuelve en agua o leche fría y es muy popular en el campo nicaragüense.' },
      { question: '¿Cuál es el postre más popular de Nicaragua?', answer: 'El tres leches. Es un bizcocho empapado en tres tipos de leche y cubierto con merengue, indispensable en celebraciones.' },
    ],
  },
  {
    slug: 'turismo-ecologico-aventura-nicaragua-2026',
    title: 'Turismo ecológico y de aventura en Nicaragua: guía completa 2026',
    description: 'Los mejores destinos de turismo ecológico y aventura en Nicaragua. Volcanes, lagunas, canopy, senderismo, surf y observación de naturaleza.',
    category: 'Turismo',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-06-25',
    updatedDate: '2026-06-25',
    content: `
      <h2>Turismo ecológico y de aventura en Nicaragua</h2>
      <p>Nicaragua es un destino ideal para los amantes de la naturaleza y la adrenalina. Su geografía volcánica, lagos enormes, bosques tropicales y dos costas ofrecen experiencias únicas de ecoturismo y deportes de aventura. Esta guía recorre los mejores destinos para explorar el lado salvaje de Nicaragua.</p>
      <h2>Destinos de aventura imperdibles</h2>
      <h3>1. Volcán Cerro Negro: sandboarding extremo</h3>
      <p>El único volcán del mundo donde se practica <strong>sandboarding</strong> (descenso en tabla sobre ceniza volcánica). Ubicado cerca de León, el ascenso dura unos 45 minutos y el descenso en tabla alcanza velocidades emocionantes. Es una experiencia única que atrae a aventureros de todo el mundo.</p>
      <p><strong>Costo aproximado:</strong> $30-35 USD por persona (incluye tabla, guía y transporte desde León).</p>
      <h3>2. Isla de Ometepe: ecoturismo en su máxima expresión</h3>
      <p>Formada por dos volcanes (Concepción y Maderas) en medio del lago Cocibolca, Ometepe es Patrimonio de la Biosfera UNESCO. Ideal para:</p>
      <ul>
        <li><strong>Senderismo:</strong> Subida al Volcán Maderas (1,394 msnm) por bosque nuboso.</li>
        <li><strong>Kayak:</strong> Remar en la ensenada de Charco Verde.</li>
        <li><strong>Cascadas:</strong> San Ramón, con caída de 50 metros en medio de la selva.</li>
        <li><strong>Ojo de agua:</strong> Piscina natural de agua cristalina rodeada de vegetación.</li>
      </ul>
      <p><strong>Costo promedio:</strong> $25-50 USD por día (hospedaje + comida).</p>
      <h3>3. Laguna de Apoyo: crater paradisíaco</h3>
      <p>Una laguna de origen volcánico con aguas cálidas y cristalinas. Perfecta para nadar, hacer kayak, paddleboard y buceo de altura. El cráter está rodeado de bosque seco tropical y ofrece vistas espectaculares.</p>
      <p><strong>Entrada:</strong> $3-5 USD. Hospedaje en la orilla desde $20 USD/noche.</p>
      <h3>4. Reserva Indio Maíz: selva tropical virgen</h3>
      <p>Una de las reservas naturales más grandes de Centroamérica. Ubicada en la Costa Caribe, alberga jaguares, perezosos, monos aulladores y cientos de especies de aves. Solo accesible por río desde El Bluff o San Juan de Nicaragua.</p>
      <p><strong>Actividades:</strong> Observación de fauna, paseos en bote por ríos, visita a comunidades indígenas rama.</p>
      <h3>5. San Juan del Sur: surf para todos los niveles</h3>
      <p>La capital del surf en Nicaragua. Playa con bahía protegida ideal para principiantes, mientras que playas cercanas como Maderas, Hermosa y Remanso ofrecen olas para intermedios y avanzados.</p>
      <ul>
        <li><strong>Clases de surf:</strong> $20-30 USD por sesión.</li>
        <li><strong>Alquiler de tabla:</strong> $10-15 USD por día.</li>
        <li><strong>Mejor época:</strong> Abril a octubre (olas más grandes).</li>
      </ul>
      <h3>6. Volcán Masaya: lava bajo tus pies</h3>
      <p>Parque nacional con uno de los pocos volcanes activos del mundo donde se puede observar lava en el cráter Santiago. Las visitas nocturnas permiten ver el resplandor de la lava en la oscuridad.</p>
      <p><strong>Entrada:</strong> $7 USD (extranjeros), $2 USD (nacionales). Visitas nocturnas con guía.</p>
      <h2>Actividades de aventura y sus costos</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Actividad</th><th style="padding:10px;text-align:left;">Ubicación</th><th style="padding:10px;text-align:right;">Costo aprox.</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Sandboarding</td><td style="padding:10px;">Cerro Negro, León</td><td style="padding:10px;text-align:right;">$30-35 USD</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Canopy / tirolesa</td><td style="padding:10px;">Mombacho, San Juan del Sur</td><td style="padding:10px;text-align:right;">$20-40 USD</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Buceo / snorkel</td><td style="padding:10px;">Corn Island, Laguna Apoyo</td><td style="padding:10px;text-align:right;">$35-60 USD</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Senderismo guiado</td><td style="padding:10px;">Ometepe, Mombacho</td><td style="padding:10px;text-align:right;">$15-30 USD</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Paddleboard</td><td style="padding:10px;">Granada, Laguna Apoyo</td><td style="padding:10px;text-align:right;">$10-20 USD</td></tr>
      <tr><td style="padding:10px;">Pesca deportiva</td><td style="padding:10px;">San Juan del Sur, Caribbean</td><td style="padding:10px;text-align:right;">$50-150 USD</td></tr>
      </tbody></table>
      <h2>Consejos para el ecoturista</h2>
      <ul>
        <li>Lleva repelente de insectos y protector solar biodegradable.</li>
        <li>Respeta la flora y fauna: no alimentes animales silvestres.</li>
        <li>Contrata guías locales certificados para senderismo en volcanes.</li>
        <li>Verifica el clima antes de visitar volcanes activos.</li>
        <li>Lleva agua suficiente y calzado cerrado para caminatas.</li>
        <li>Prefiere hospedajes ecoamigables que apoyen a comunidades locales.</li>
      </ul>
      <h2>Mejor época para visitar</h2>
      <p>La temporada seca (noviembre a abril) es ideal para actividades al aire libre. La temporada lluviosa (mayo a octubre) ofrece paisajes más verdes y menos turistas, aunque algunas rutas de senderismo pueden estar resbaladizas.</p>
    
      <h2>Preguntas frecuentes</h2>
      <h3>¿Qué es el sandboarding en Nicaragua?</h3>
      <p>Es el descenso en tabla sobre la ceniza volcánica del Cerro Negro, cerca de León. Es una actividad única que atrae a aventureros internacionales.</p>
      <h3>¿Cuándo es la mejor época para hacer surf en San Juan del Sur?</h3>
      <p>La temporada de olas más grandes va de abril a octubre. Para principiantes, la época seca (noviembre a abril) ofrece olas más suaves.</p>
      <h3>¿Es seguro hacer senderismo en volcanes activos?</h3>
      <p>Sí, siempre que se contrate un guía certificado y se sigan las instrucciones de seguridad. Los parques nacionales monitorean la actividad volcánica.</p>
      
      <h2>Fuentes consultadas</h2>
      <p>Información basada en datos del Instituto Nicaragüense de Turismo (INTUR), el Sistema Nacional de Áreas Protegidas (SINAP), la UNESCO y operadores turísticos locales. Los costos son estimaciones referenciales.</p>
    `,
    faqs: [
      { question: '¿Qué es el sandboarding en Nicaragua?', answer: 'Es el descenso en tabla sobre la ceniza volcánica del Cerro Negro, cerca de León. Es una actividad única en el mundo que atrae a aventureros internacionales.' },
      { question: '¿Cuándo es la mejor época para hacer surf en San Juan del Sur?', answer: 'La temporada de olas más grandes va de abril a octubre. Para principiantes, la época seca (noviembre-abril) ofrece olas más suaves.' },
      { question: '¿Es seguro hacer senderismo en volcanes activos?', answer: 'Sí, siempre que se contrate un guía certificado y se sigan las instrucciones de seguridad. Los parques nacionales monitorean la actividad volcánica constantemente.' },
    ],
  },
  {
    slug: 'economia-nicaragua-2026-guia',
    title: 'Economía de Nicaragua 2026: guía completa para entender cómo funciona',
    description: 'Todo sobre la economía nicaragüense en 2026: sectores principales, PIB, empleo, inflación, comercio exterior y oportunidades. Explicado de forma sencilla.',
    category: 'Economía',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-06-25',
    updatedDate: '2026-06-25',
    content: `
      <h2>La economía de Nicaragua en 2026</h2>
      <p>Nicaragua es la economía más grande de Centroamérica en términos de superficie territorial, con una posición geográfica estratégica entre dos océanos y una población joven y emprendedora. En 2026, la economía nicaragüense muestra un sólido crecimiento en sectores clave como el turismo, la agricultura, la construcción y las manufacturas, consolidándose como un destino atractivo para inversiones y emprendimiento.</p>
      <h2>Principales sectores económicos</h2>
      <h3>1. Agricultura</h3>
      <p>El sector agropecuario emplea aproximadamente al 30% de la población económicamente activa. Los principales productos de exportación son:</p>
      <ul>
        <li><strong>Café:</strong> Nicaragua es uno de los principales productores de café de América Latina. El café de altura de Matagalpa, Jinotega y Nueva Segovia es especialmente valorado.</li>
        <li><strong>Azúcar:</strong> Las centrales azucareras en Chinandega y León son pilares del sector.</li>
        <li><strong>Carne bovina:</strong> Exportación creciente hacia Estados Unidos y Centroamérica.</li>
        <li><strong>Plátano y cacao:</strong> Productos emergentes con demanda internacional creciente.</li>
      </ul>
      <h3>2. Turismo</h3>
      <p>El turismo se ha convertido en uno de los sectores de más rápido crecimiento. Nicaragua recibe más de un millón de visitantes internacionales al año, atraídos por playas del Pacífico y Caribe, volcanes activos, ciudades coloniales y reservas naturales.</p>
      <h3>3. Manufactura y maquila</h3>
      <p>Las zonas francas en Managua, Masaya y León albergan empresas textiles, ensamblaje electrónico y producción de calzado. Este sector genera miles de empleos formales.</p>
      <h3>4. Construcción</h3>
      <p>La construcción de infraestructura pública (carreteras, puentes, hospitales) y desarrollo inmobiliario han impulsado este sector.</p>
      <h2>Indicadores económicos clave 2026</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Indicador</th><th style="padding:10px;text-align:right;">Valor estimado</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">PIB nominal</td><td style="padding:10px;text-align:right;">USD 16,000 - 17,000 millones</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">PIB per cápita</td><td style="padding:10px;text-align:right;">USD 2,400 - 2,600</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Inflación anual</td><td style="padding:10px;text-align:right;">5% - 7%</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Tasa de desempleo</td><td style="padding:10px;text-align:right;">4% - 6%</td></tr>
      <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Reservas internacionales</td><td style="padding:10px;text-align:right;">USD 3,500 - 4,000 millones</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px;">Deuda pública / PIB</td><td style="padding:10px;text-align:right;">45% - 55%</td></tr>
      </tbody></table>
      <p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: valores estimados basados en proyecciones del BCN y FMI para 2026.</em></p>
      <h2>Empleo y salarios</h2>
      <p>El mercado laboral nicaragüense ofrece oportunidades en diversos sectores productivos. Las remesas de nicaragüenses en el exterior representan una fuente importante de ingresos para miles de familias y dinamizan el comercio local. El salario mínimo varía por sector, oscilando entre C$ 7,185 (agropecuario) y C$ 9,173 (construcción) mensuales en 2026, con revisiones periódicas que buscan mejorar el poder adquisitivo de los trabajadores.</p>
      <h2>Comercio exterior</h2>
      <p>Nicaragua exporta principalmente hacia Estados Unidos, Centroamérica y la Unión Europea. Los principales productos de exportación son café, carne, azúcar, oro y textiles. Las importaciones principales son combustibles, maquinaria, equipos electrónicos y productos manufacturados.</p>
      <h2>Oportunidades de crecimiento</h2>
      <ul>
        <li>Expansión del turismo sostenible en zonas del Pacífico y Caribe.</li>
        <li>Desarrollo de energías renovables: geotérmica, eólica y solar.</li>
        <li>Crecimiento de la agroindustria con productos de alta demanda internacional.</li>
        <li>Inversión en infraestructura vial y conectividad digital.</li>
        <li>Fortalecimiento del sector de zonas francas y manufactura ligera.</li>
      </ul>
      
      <h2>Preguntas frecuentes</h2>
      <h3>¿Cuál es el principal sector de la economía nicaragüense?</h3>
      <p>La agricultura es uno de los sectores más importantes, empleando a una parte significativa de la población activa y generando divisas por exportaciones de café, azúcar, carne y cacao.</p>
      <h3>¿Qué porcentaje del PIB representan las remesas?</h3>
      <p>Las remesas enviadas por nicaragüenses en el exterior representan una de las principales fuentes de ingresos del país, superando en algunos años el 15% del PIB según el Banco Central de Nicaragua.</p>
      <h3>¿Cuáles son los principales socios comerciales de Nicaragua?</h3>
      <p>Estados Unidos, Centroamérica, México y la Unión Europea son los principales destinos de exportaciones. Las importaciones principales provienen de Estados Unidos, China y Centroamérica.</p>
      
      <h2>Fuentes consultadas</h2>
      <p>Información basada en reportes del Banco Central de Nicaragua (BCN), proyecciones del Fondo Monetario Internacional (FMI), el Ministerio de Hacienda y Crédito Público y el Ministerio de Fomento, Industria y Comercio (MIFIC). Los indicadores son estimaciones referenciales y deben verificarse con las publicaciones oficiales.</p>
    `,
    faqs: [
      { question: '¿Cuál es el PIB de Nicaragua en 2026?', answer: 'El PIB nominal estimado de Nicaragua en 2026 ronda los USD 16,000-17,000 millones, con un PIB per cápita de aproximadamente USD 2,400-2,600.' },
      { question: '¿Qué sectores generan más empleo en Nicaragua?', answer: 'La agricultura emplea alrededor del 30% de la población activa. El comercio informal, la construcción y el turismo también son importantes generadores de empleo.' },
      { question: '¿Cuánto representan las remesas en la economía nicaragüense?', answer: 'Las remesas representan más del 15% del PIB de Nicaragua, siendo una de las fuentes de divisas más importantes del país.' },
    ],
  }
];

export function getEvergreenBySlug(slug: string): EvergreenArticle | undefined {
  return EVERGREEN_ARTICLES.find((article) => article.slug === slug);
}

export function getAllEvergreen(): EvergreenArticle[] {
  return EVERGREEN_ARTICLES;
}
