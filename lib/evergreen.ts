export interface EvergreenArticle {
  slug: string;
  title: string;
  /** Título SEO absoluto (sin sufijo de marca). Si se omite, se deriva de `title`. */
  seoTitle?: string;
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
    seoTitle: 'Cómo apostillar documentos en Nicaragua: guía de citas 2026',
    description: 'Requisitos, pasos, costos y tiempos reales para apostillar documentos nicaragüenses en 2026. Citas en citas.cancilleria.gob.ni, espera de 2 a 4 meses y tabla de costos. Guía actualizada.',
    category: 'Trámites',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-01-15',
    updatedDate: '2026-11-17',
    content: `
      <blockquote><h3>Qué cambió desde la última actualización (24 de mayo de 2026)</h3><ul><li>El trámite ahora se agenda por una <strong>plataforma de citas en línea</strong> (citas.cancilleria.gob.ni), no de forma presencial sin cita.</li><li>Las citas disponibles se están agotando con <strong>hasta 4 meses de espera</strong>, según un reporte de mayo de 2026.</li><li>Surgió un <strong>mercado negro de citas</strong>, con precios de USD 100 a 400 por un cupo, según denuncias ciudadanas.</li><li>Los tiempos de "3 a 5 días hábiles" que indicábamos antes <strong>ya no reflejan la realidad del trámite</strong> para la mayoría de solicitantes.</li></ul></blockquote>
      <p>La apostilla es un sello que certifica la autenticidad de documentos públicos nicaragüenses para que sean válidos en países que forman parte de la Convención de La Haya. Nicaragua es miembro desde 2013, por lo que los documentos apostillados en el país son reconocidos en más de 120 naciones sin necesidad de legalización consular adicional. Sin embargo, en 2026 el trámite enfrenta demoras importantes que todo solicitante debe conocer antes de planificar un viaje o trámite migratorio.</p>
      <h2>Documentos que se pueden apostillar en Nicaragua</h2>
      <ul><li>Certificados de nacimiento, matrimonio y defunción</li><li>Diplomas, títulos académicos y certificados de estudio</li><li>Certificados de antecedentes penales</li><li>Poderes notariales y actas notariales</li><li>Documentos de la Corte Suprema de Justicia y tribunales</li><li>Documentos de registros públicos y municipales</li></ul>
      <p>Los documentos deben estar vigentes y en buen estado físico. Algunos países de destino exigen que el documento sea reciente, generalmente emitido en los últimos 3 a 6 meses. Los documentos académicos (diplomas, títulos, certificados de notas) requieren autenticación previa por instituciones como el INATEC antes de poder apostillarse; ese paso previo tiene un costo de C$ 30, pagadero en cuenta de INATEC en Banpro.</p>
      <h2>Cómo agendar la cita en línea (actualizado)</h2>
      <p>Desde abril de 2025, la Cancillería digitalizó el proceso de citas para apostillado. Los pasos son:</p>
      <ol><li>Ingresar a <a href="https://citas.cancilleria.gob.ni" target="_blank" rel="noopener noreferrer">citas.cancilleria.gob.ni</a></li><li>Seleccionar la institución, el departamento y la sede donde se desea ser atendido</li><li>Completar el formulario con datos personales: tipo y número de documento, nombre completo, fecha de nacimiento, sexo, nacionalidad, teléfono y correo electrónico</li><li>Verificar el correo con el código enviado</li><li>Descargar o guardar el comprobante de cita (también llega por correo)</li></ol>
      <p>Para más información se puede llamar al 2244-8008.</p>
      <h2>La demora real del trámite en 2026</h2>
      <p>Aunque el sistema virtual eliminó las filas físicas frente a la Cancillería, no resolvió el cuello de botella de fondo: la demanda de citas supera la capacidad de atención. Un reporte de Despacho 505 verificó que, hasta el 13 de mayo de 2026, la cita más próxima disponible en la plataforma era para el 5 de julio, es decir, casi dos meses de espera solo para conseguir turno. Otros usuarios han reportado esperas de hasta 4 meses.</p>
      <p>Esta escasez de citas generó un mercado paralelo: intermediarios que revenden cupos de la plataforma por montos de entre <strong>USD 100 y USD 400</strong>, según denuncias ciudadanas recogidas por Despacho 505. Si usted necesita el documento con urgencia (por ejemplo, para una entrevista de visa o un trámite migratorio con fecha límite), planifique con al menos 2 a 4 meses de anticipación y evite intermediarios no oficiales.</p>
      <h2>Requisitos para apostillar documentos en 2026</h2>
      <ul><li>Documento original o copia certificada por la institución emisora</li><li>Cédula de identidad vigente del solicitante</li><li>Comprobante de cita generado en la plataforma en línea</li><li>Pago de la tasa correspondiente según tipo de documento y servicio</li></ul>
      <p>Los documentos extranjeros no se apostillan en Nicaragua. Deben ser apostillados en el país de origen antes de ser presentados en el país.</p>
      <h2>Dónde realizar el trámite</h2>
      <p>La apostilla se realiza en la Dirección General de Asuntos Consulares y Migratorios del Ministerio de Relaciones Exteriores (MINREX), en Managua. También existen oficinas delegadas en principales ciudades del país. Se recomienda verificar los horarios de atención y disponibilidad del servicio antes de acudir, incluso teniendo cita confirmada.</p>
      <p><strong>Ojo con el nombre:</strong> la plataforma de citas <strong>citas.cancilleria.gob.ni</strong> es operada por el MINREX. Si busca "citas MINREX" o "citas Cancillería", es el mismo sistema y la misma cita — no son dos trámites distintos. Algunas búsquedas también lo llaman "citas de la Cancillería" o "cita para apostillar"; todas desembocan en el mismo portal.</p>
      <h2>Costos actualizados 2026</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Servicio</th><th style="padding:10px;text-align:left;">Costo aproximado</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Apostilla estándar</td><td style="padding:10px;text-align:left;">C$ 150 - 300 por documento</td></tr><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><td style="padding:10px;text-align:left;">Autenticación previa de documentos académicos (INATEC)</td><td style="padding:10px;text-align:left;">C$ 30</td></tr><tr style=""><td style="padding:10px;text-align:left;">Cupos de cita revendidos en el mercado informal (no oficial, no recomendado)</td><td style="padding:10px;text-align:left;">USD 100 - 400</td></tr></tbody></table>
      <p>Los costos oficiales pueden variar según el tipo de documento; confirme el monto exacto al momento del trámite. Evite pagar por cupos de cita fuera de la plataforma oficial: es un servicio no autorizado y no hay garantía de que la cita sea válida.</p>
    `,
    faqs: [
      { question: '¿La cita de MINREX es la misma que la de la Cancillería?', answer: 'Sí. La plataforma citas.cancilleria.gob.ni es operada por el MINREX (Ministerio de Relaciones Exteriores). "Citas MINREX", "citas Cancillería" y "cita para apostillar" son el mismo trámite y el mismo portal.' },
      { question: '¿Dónde saco la cita para apostillar documentos?', answer: 'En citas.cancilleria.gob.ni: seleccione institución, departamento y sede, complete el formulario y verifique su correo para descargar el comprobante.' },
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
    seoTitle: 'Anular récord policial en Nicaragua: requisitos 2026',
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
      <p>En <a href="https://tramitesenlinea.policia.gob.ni/" target="_blank" rel="noopener noreferrer">tramitesenlinea.policia.gob.ni</a>:</p>
      <ol><li>Crear un usuario con nombre completo, correo electrónico y número de cédula</li><li>Crear una nueva solicitud en la pestaña "Trámites", indicando el motivo (laboral, académico, migratorio)</li><li>Elegir el trámite "Certificado de conducta" y la forma de entrega: Correos de Nicaragua, en la delegación policial, o impresión directa</li><li>Si se elige entrega a domicilio por Correos de Nicaragua: C$10 adicionales para entrega en papel, C$30 para material PVC</li><li>Procesar el pago e ingresar los datos del vaucher</li></ol>
      <h3>Opción B: kioscos tecnológicos</h3>
      <p>Existen <strong>78 kioscos tecnológicos</strong> distribuidos en todos los municipios del país, disponibles las 24 horas, todos los días de la semana:</p>
      <ol><li>Seleccionar "Trámites en línea" en el kiosco</li><li>Colocar la cédula de identidad vigente en el lector</li><li>Verificar los datos personales mostrados</li><li>Ir a la pestaña "Certificados" → "Certificado de Conducta", elegir el motivo y generar el trámite</li><li>Pagar en el kiosco (vaucher de banco o agente Banpro) e ingresar el número SIF</li><li>Imprimir el documento</li></ol>
      <p><strong>Importante:</strong> si usted tiene antecedentes penales, el sistema no le permitirá generar el documento de forma automática en el kiosco.</p>
      <h3>Si usted vive en el extranjero</h3>
      <p>Puede hacer la solicitud en línea desde fuera de Nicaragua y luego autenticar el documento (ver siguiente sección) para que tenga validez legal en el país donde lo necesite.</p>
      <h2>2. Autenticación del récord de policía</h2>
      <p>La autenticación es un trámite adicional, indispensable para gestiones migratorias, laborales y académicas en el extranjero. Si el país de destino pertenece a la Convención de La Haya, el documento puede requerir <a href="/guia/apostillar-documentos-nicaragua-2026">apostilla</a> en lugar de —o además de— la autenticación; verifique el requisito específico con la entidad receptora.</p>
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
      <p><strong>Fuente oficial:</strong> <a href="https://ni.usembassy.gov/" target="_blank" rel="noopener noreferrer">Embajada de Estados Unidos en Managua</a> — requisitos de visa y citas consulares.</p>
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
      <p><strong>Importante:</strong> conseguir cita para apostillar documentos en la Cancillería de Nicaragua está tomando hasta 4 meses según reportes de mayo de 2026. Ver <a href="/guia/apostillar-documentos-nicaragua-2026">nuestra guía de apostillas</a> para más detalles sobre este atraso.</p>
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
    seoTitle: 'Salario mínimo Nicaragua 2026: cuánto es por sector',
    description: 'Salario mínimo Nicaragua 2026: de C$6,188 (agropecuario) a C$13,848 (construcción y financieros). Tabla oficial por sector, vigente de marzo 2026 a febrero 2027.',
    category: 'Economía',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-01-05',
    updatedDate: '2026-11-17',
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
      <p><strong>Fuente oficial:</strong> <a href="https://www.mitrab.gob.ni/" target="_blank" rel="noopener noreferrer">MITRAB</a> — actas de la Comisión Nacional del Salario Mínimo y valores vigentes por sector.</p>
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
      <p><strong>Fuente oficial:</strong> <a href="https://inide.gob.ni/" target="_blank" rel="noopener noreferrer">INIDE</a> — encuestas de la canasta básica familiar por mes.</p>
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
      <p><strong>Fuente oficial:</strong> <a href="https://www.bcn.gob.ni/" target="_blank" rel="noopener noreferrer">Banco Central de Nicaragua</a> — tipo de cambio oficial y tabla de deslizamiento cambiario.</p>
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
  },
  {
    slug: 'remesas-a-nicaragua-2026-como-enviar-dinero',
    title: 'Remesas a Nicaragua 2026: cuánto envían los nicaragüenses y cómo',
    seoTitle: 'Remesas a Nicaragua 2026: cuánto se envía y cómo',
    description: 'Guía de remesas a Nicaragua 2026: cuánto dinero reciben las familias, de qué países llega, formas de enviar, comisiones y tipo de cambio. Información verificada con fuentes oficiales.',
    category: 'Diáspora',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-11-28',
    updatedDate: '2026-11-28',
    content: `
      <p>Las remesas son uno de los pilares de la economía familiar nicaragüense: millones de personas en Nicaragua dependen cada mes del dinero que envían familiares desde el exterior. Esta guía explica cuánto se envía, desde qué países, qué opciones existen para transferir dinero y qué debe revisar quien envía o recibe. La información es general y fue verificada con fuentes oficiales en noviembre de 2026; no sustituye la asesoría de una institución financiera.</p>
      <h2>Cuánto dinero reciben las familias nicaragüenses en remesas</h2>
      <p>El Banco Central de Nicaragua (BCN) publica un indicador mensual de remesas en <a href="https://bcn.gob.ni/remesas" target="_blank" rel="noopener noreferrer">bcn.gob.ni/remesas</a>, elaborado a partir de la información que reportan las agencias especializadas y los bancos comerciales. Es la fuente oficial para el monto mensual.</p>
      <p>Como referencia de magnitud: estimaciones del Diálogo Interamericano sitúan las remesas recibidas por Nicaragua en torno a USD 6,100 millones durante 2025, con proyecciones cercanas a USD 6,700-6,800 millones para 2026. Estas cifras provienen de análisis independientes porque el BCN suspendió en abril de 2025 la publicación de sus informes trimestrales detallados de remesas; conviene verificar siempre el dato vigente directamente en el BCN.</p>
      <p>Una consulta ciudadana de septiembre de 2026 (Informe de la Consulta Ciudadana, Hagamos Democracia NIC-CR) encontró que el 39.2% de las personas consultadas afirmaba recibir transferencias desde el exterior. La encuesta es descriptiva y no probabilística, por lo que no permite proyectar ese porcentaje al total de la población.</p>
      <h2>Desde qué países llega el dinero</h2>
      <p>Estados Unidos es, con diferencia, el principal origen de las remesas hacia Nicaragua. Según el último desglose oficial disponible del BCN (primer trimestre de 2025), aproximadamente el 83.8% del dinero recibido provino de Estados Unidos, seguido de Costa Rica (7.5%) y España (5.4%). Los porcentajes pueden variar entre períodos; el detalle por país de origen lo publica el BCN en su indicador mensual.</p>
      <h2>Por qué las remesas importan a la economía</h2>
      <p>Las remesas representan una proporción muy alta del PIB nicaragüense. Según el estudio del Diálogo Interamericano citado por medios internacionales, Nicaragua sería en 2026 el país de América Latina con mayor dependencia de las remesas respecto a su PIB (cifras en torno al 34%). Para millones de familias, el envío mensual es un ingreso esencial para alimentación, vivienda, salud y educación.</p>
      <h2>Formas de enviar dinero a Nicaragua</h2>
      <p>Existen varias vías, y la elección depende del monto, la urgencia, el país desde donde se envía y el destinatario:</p>
      <ul>
        <li><strong>Bancos comerciales:</strong> transferencias internacionales (wire transfer) directas a una cuenta bancaria nicaragüense. Suelen ser seguras y registrables, pero con comisiones y tiempos variables según el banco y el corredor corresponsal.</li>
        <li><strong>Remesadoras internacionales:</strong> empresas especializadas en transferencias de dinero, con presencia física o digital, que pagan en efectivo o depósito según el país de destino.</li>
        <li><strong>Aplicaciones y banca digital:</strong> algunas fintech y plataformas permiten enviar dinero desde el extranjero que el destinatario retira en efectivo o recibe en cuenta, según el servicio.</li>
        <li><strong>Efectivo o instrumentos de pago:</strong> en algunos casos se envía dinero en efectivo o mediante giros postales; esta vía concentra riesgos de pérdida, robo y costos de transporte que deben evaluarse con cuidado.</li>
      </ul>
      <p>No existe una única opción "mejor": compare el costo total (comisión + tipo de cambio aplicado + costo de retiro) y los tiempos antes de cada envío. Los montos y las comisiones cambian con frecuencia.</p>
      <h2>Comisiones y tipo de cambio: qué comparar</h2>
      <p>El costo real de una remesa no es solo la comisión visible. Revise:</p>
      <ul>
        <li>La comisión de envío que cobra la empresa.</li>
        <li>El tipo de cambio que aplican al convertir dólares a córdobas (o a la moneda del destinatario).</li>
        <li>El costo de retiro en efectivo en el país de destino, si aplica.</li>
        <li>Los límites de monto por operación o por período.</li>
      </ul>
      <p>Para el tipo de cambio oficial del dólar frente al córdoba, consulte nuestra guía de <a href="/guia/dolar-a-cordoba-nicaragua-hoy-2026">dólar a córdoba en Nicaragua</a> y la publicación del Banco Central de Nicaragua.</p>
      <h2>Reglas y declaraciones cuando se envía desde el exterior</h2>
      <p>Si envía desde Estados Unidos, tenga en cuenta que las instituciones financieras y remesadoras deben reportar ciertas operaciones a las autoridades (por ejemplo, la FinCEN exige reportes de operaciones en efectivo superiores a USD 10,000). Esto no convierte un envío familiar en ilegal, pero sí implica que las operaciones grandes pueden requerir documentación adicional. Consulte las reglas vigentes de la institución que utilice y, si su caso es complejo, a un profesional.</p>
      <h2>Errores comunes al enviar remesas</h2>
      <ul>
        <li>No comparar el costo total: la comisión más baja no siempre es la opción más barata si el tipo de cambio es desfavorable.</li>
        <li>Enviar sin confirmar los datos del destinatario (nombre exacto, número de cuenta o agencia de retiro).</li>
        <li>No conservar el comprobante de la operación.</li>
        <li>Usar servicios no registrados o informales sin verificar su autorización en el país de origen y destino.</li>
      </ul>
      <h2>Preguntas frecuentes</h2>
      <h3>¿Cuánto dinero en remesas recibe Nicaragua al año?</h3>
      <p>Las estimaciones más recientes lo ubican entre USD 6,100 y 6,800 millones anuales, según la fuente (Diálogo Interamericano, BID, FMI). El monto exacto del período vigente debe consultarse en el indicador mensual del Banco Central de Nicaragua.</p>
      <h3>¿Desde qué país viene la mayoría de las remesas?</h3>
      <p>Estados Unidos concentra aproximadamente el 84% de los envíos según el último desglose oficial del BCN disponible, seguido de Costa Rica y España.</p>
      <h3>¿Qué es más barato: banco o remesadora?</h3>
      <p>Depende del monto, el país de envío y la urgencia. Compare la comisión, el tipo de cambio aplicado y el costo de retiro antes de decidir; no hay una respuesta única para todos los casos.</p>
      <h3>¿Puedo enviar remesas en efectivo?</h3>
      <p>Algunas remesadoras permiten el retiro en efectivo en el país de destino, pero transportar dinero en efectivo entre países conlleva riesgos legales y de seguridad. Verifique los límites y requisitos de declaración del país desde donde viaja.</p>
      <h3>¿Las remesas pagan impuestos?</h3>
      <p>Depende de la legislación de cada país. En Estados Unidos existen obligaciones de reporte para ciertos envíos; en Nicaragua las remesas familiares suelen tener un tratamiento particular. Consulte a un profesional fiscal si su caso lo requiere.</p>
      <h2>Fuentes consultadas</h2>
      <p>Banco Central de Nicaragua (indicador mensual de remesas, bcn.gob.ni/remesas); Diálogo Interamericano (estimaciones de remesas 2025-2026, citado por Infobae y otros medios); Informe de la Consulta Ciudadana de septiembre de 2026 (Hagamos Democracia NIC-CR); datos de origen por país del BCN (primer trimestre de 2025). Los montos son referencias y deben verificarse con la fuente oficial vigente.</p>
    `,
    faqs: [
      { question: '¿Cuánto dinero en remesas recibe Nicaragua al año?', answer: 'Las estimaciones recientes lo ubican entre USD 6,100 y 6,800 millones anuales según la fuente. El dato oficial mensual se publica en el Banco Central de Nicaragua (bcn.gob.ni/remesas).' },
      { question: '¿Desde qué país viene la mayoría de las remesas a Nicaragua?', answer: 'Estados Unidos concentra aproximadamente el 84% de los envíos según el último desglose oficial del BCN disponible, seguido de Costa Rica y España.' },
      { question: '¿Qué es más barato para enviar dinero: banco o remesadora?', answer: 'Depende del monto, el país de envío y la urgencia. Compare la comisión, el tipo de cambio aplicado y el costo de retiro antes de decidir.' },
      { question: '¿Se puede enviar dinero en efectivo a Nicaragua?', answer: 'Algunas remesadoras permiten retiro en efectivo en destino, pero transportar efectivo entre países conlleva riesgos legales y de seguridad. Verifique los límites de declaración del país de origen.' },
      { question: '¿Las remesas familiares pagan impuestos?', answer: 'Depende de la legislación de cada país. En EE.UU. existen obligaciones de reporte para ciertos envíos; en Nicaragua las remesas familiares suelen tener tratamiento particular. Consulte a un profesional fiscal si su caso lo requiere.' }
    ],
  },
  {
    slug: 'apostillar-documentos-eeuu-para-nicaragua',
    title: 'Apostillar documentos en EE.UU. para usarlos en Nicaragua: guía paso a paso',
    seoTitle: 'Apostillar documentos en EE.UU. para Nicaragua',
    description: 'Cómo apostillar documentos emitidos en Estados Unidos para que sean válidos en Nicaragua: documentos federales vs estatales, costos, tiempos y errores comunes. Verificado 2026.',
    category: 'Diáspora',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-11-28',
    updatedDate: '2026-11-28',
    content: `
      <p>Si vive en Estados Unidos y necesita usar allí un documento para un trámite en Nicaragua (o al revés), la apostilla es el mecanismo que le da validez internacional. Esta guía explica cómo apostillar documentos emitidos en EE.UU. para presentarlos en Nicaragua, y qué hacer con documentos nicaragüenses que se usarán en Estados Unidos. La información es general; los requisitos exactos dependen del estado y del documento.</p>
      <h2>Qué es la apostilla y cuándo aplica</h2>
      <p>La apostilla es un certificado emitido conforme a la Convención de La Haya de 1961 que autentica la firma y el cargo del funcionario que firmó un documento público, para que ese documento sea reconocido en otro país miembro sin necesidad de legalización consular adicional. Tanto Nicaragua como Estados Unidos son partes de la Convención.</p>
      <p>Si el documento es un acta de nacimiento, matrimonio o defunción de un estado de EE.UU., un diploma, un poder notarial o cualquier documento público estadounidense, y lo necesita ante una institución nicaragüense, deberá apostillarse en EE.UU. Si el documento es nicaragüense y lo necesita ante una institución estadounidense, se apostilla en Nicaragua (ver nuestra guía de <a href="/guia/apostillar-documentos-nicaragua-2026">apostillar documentos en Nicaragua</a>).</p>
      <h2>Documentos federales vs documentos estatales: dónde apostillar cada uno</h2>
      <p>En Estados Unidos la autoridad que apostilla depende del tipo de documento:</p>
      <ul>
        <li><strong>Documentos federales</strong> (expedientes del FBI, documentos emitidos por agencias federales, algunas certificaciones): se tramitan ante la Oficina de Autenticaciones del Departamento de Estado de EE.UU.</li>
        <li><strong>Documentos estatales y municipales</strong> (actas de nacimiento, matrimonio, defunción, documentos notariales, diplomas de universidades estatales): se apostillan ante la Oficina del Secretario de Estado (Secretary of State) del estado que emitió el documento.</li>
      </ul>
      <p>Algunos estados aceptan el trámite en línea y otros solo presencial o por correo. Verifique el procedimiento específico del estado emisor en su sitio oficial del Secretary of State.</p>
      <h2>El trámite paso a paso</h2>
      <ol>
        <li>Identifique el estado o agencia que emitió el documento.</li>
        <li>Confirme que el documento es el original o una copia certificada exigida por la autoridad apostillante (algunos estados aceptan fotocopias certificadas por notario).</li>
        <li>Presente el documento ante la autoridad competente (Secretario de Estado estatal o Oficina de Autenticaciones federal) junto con el formulario y la tarifa correspondiente.</li>
        <li>Reciba el documento con la hoja de apostilla adjunta.</li>
        <li>Si Nicaragua o la institución receptora lo exige, gestione la traducción correspondiente.</li>
      </ol>
      <h2>Costos y tiempos</h2>
      <p>Las tarifas varían por estado y por tipo de documento; la Oficina de Autenticaciones federal y cada Secretary of State estatal publican sus costos vigentes. Los tiempos oscilan desde procesamiento el mismo día hasta varias semanas si se hace por correo, según el estado. Verifique siempre la tarifa y el plazo actuales antes de iniciar el trámite.</p>
      <h2>El camino inverso: documentos nicaragüenses para usar en EE.UU.</h2>
      <p>Si tiene un documento nicaragüense (acta de nacimiento, antecedentes penales, poder notarial) que necesita ante una institución estadounidense:</p>
      <ol>
        <li>Asegúrese de que el documento esté apostillado en Nicaragua (MINREX, vía la plataforma de citas de la Cancillería).</li>
        <li>Verifique si la institución receptora exige traducción al inglés; muchas instituciones de EE.UU. aceptan documentos en español acompañados de traducción certificada.</li>
        <li>Consulte si el documento debe tener una antigüedad máxima (muchos trámites migratorios exigen documentos emitidos en los últimos 3-6 meses).</li>
      </ol>
      <p>Para documentos nicaragüenses que debe apostillar estando en el exterior, consulte nuestra guía de <a href="/guia/tramites-consulares-nicaragua-en-estados-unidos">trámites consulares de Nicaragua en EE.UU.</a> y la sección sobre poderes y autenticaciones.</p>
      <h2>Errores comunes que invalidan la apostilla</h2>
      <ul>
        <li>Apostillar ante la autoridad equivocada (por ejemplo, un notario local en vez del Secretary of State).</li>
        <li>Usar fotocopias no certificadas cuando se exige documento original.</li>
        <li>No verificar si el documento necesita paso previo (algunos documentos notariales requieren certificación del colegio de notarios del estado antes de apostillarse).</li>
        <li>Olvidar que la apostilla autentica la firma, no el contenido: si el documento tiene errores, debe corregirse antes de apostillar.</li>
      </ul>
      <h2>Advertencias importantes</h2>
      <p>Esta guía es informativa y no constituye asesoría legal. Los requisitos de apostilla pueden variar según el estado, el tipo de documento y la institución nicaragüense que lo recibe. Antes de iniciar un trámite con fecha límite, confirme los requisitos directamente con la autoridad emisor y la receptora.</p>
      <h2>Preguntas frecuentes</h2>
      <h3>¿Quién apostilla un acta de nacimiento de un estado de EE.UU.?</h3>
      <p>La Oficina del Secretary of State del estado que emitió el acta. Cada estado tiene su propio procedimiento, tarifa y tiempos.</p>
      <h3>¿Quién apostilla documentos federales de EE.UU.?</h3>
      <p>La Oficina de Autenticaciones del Departamento de Estado de Estados Unidos.</p>
      <h3>¿La apostilla tiene vencimiento?</h3>
      <p>La apostilla en sí no vence, pero el documento subyacente puede tener un límite de antigüedad exigido por la institución receptora (por ejemplo, actas de nacimiento para trámites migratorios suelen exigirse recientes).</p>
      <h3>¿Necesito traducir el documento apostillado?</h3>
      <p>Depende de la institución nicaragüense que lo recibe. Muchas aceptan documentos en inglés; verifique si exigen traducción oficial o jurada.</p>
      <h3>¿Cuánto cuesta apostillar un documento en EE.UU.?</h3>
      <p>Las tarifas varían por estado y tipo de documento. Consulte la tarifa vigente en el sitio oficial del Secretary of State correspondiente o de la Oficina de Autenticaciones federal.</p>
      <h2>Fuentes consultadas</h2>
      <p>Convención de La Haya (hcch.net — directorio de autoridades competentes); Departamento de Estado de EE.UU. (Oficina de Autenticaciones, state.gov); sitios oficiales de Secretarios de Estado estatales; MINREX de Nicaragua (minrex.gob.ni). Verificado en noviembre de 2026.</p>
    `,
    faqs: [
      { question: '¿Quién apostilla un acta de nacimiento de un estado de EE.UU.?', answer: 'La Oficina del Secretary of State del estado que emitió el acta. Cada estado tiene su propio procedimiento, tarifa y tiempos.' },
      { question: '¿Quién apostilla documentos federales de EE.UU.?', answer: 'La Oficina de Autenticaciones del Departamento de Estado de Estados Unidos.' },
      { question: '¿La apostilla tiene vencimiento?', answer: 'La apostilla en sí no vence, pero el documento subyacente puede tener un límite de antigüedad exigido por la institución receptora.' },
      { question: '¿Necesito traducir el documento apostillado?', answer: 'Depende de la institución nicaragüense que lo recibe. Muchas aceptan documentos en inglés; verifique si exigen traducción oficial o jurada.' },
      { question: '¿Cuánto cuesta apostillar un documento en EE.UU.?', answer: 'Las tarifas varían por estado y tipo de documento. Consulte la tarifa vigente en el sitio oficial del Secretary of State correspondiente o de la Oficina de Autenticaciones federal.' }
    ],
  },
  {
    slug: 'tramites-consulares-nicaragua-en-estados-unidos',
    title: 'Trámites consulares de Nicaragua en EE.UU.: pasaporte, registro civil y poderes',
    seoTitle: 'Trámites consulares de Nicaragua en EE.UU.',
    description: 'Guía de trámites consulares de Nicaragua en Estados Unidos: consulado y embajada en Washington, Miami y Nueva York, pasaporte en línea, registro civil y poderes. Verificado 2026.',
    category: 'Diáspora',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-11-28',
    updatedDate: '2026-11-28',
    content: `
      <p>Nicaragua redujo su red consular en Estados Unidos: hoy solo quedan tres oficinas atendiendo al público — la Embajada en Washington D.C., el Consulado General de Miami y el Consulado General de Nueva York. Esta guía explica qué trámites consulares puede realizar un nicaragüense en EE.UU., dónde y cómo iniciarlos. La información está verificada con fuentes oficiales y de prensa especializada en noviembre de 2026; los requisitos pueden cambiar, confirme siempre con el consulado antes de desplazarse.</p>
      <h2>Las tres oficinas consulares nicaragüenses en EE.UU.</h2>
      <ul>
        <li><strong>Embajada de Nicaragua – Sección Consular, Washington D.C.:</strong> 1627 New Hampshire Ave NW, Washington, DC 20009. Teléfono: +1 (202) 939-6531 / +1 (202) 939-6570. Atiende a la comunidad de todo el país, con especial énfasis en la región del Atlántico Medio (DC, Maryland, Virginia).</li>
        <li><strong>Consulado General de Miami:</strong> atiende a la comunidad del sureste de EE.UU. (Florida y alrededores).</li>
        <li><strong>Consulado General de Nueva York:</strong> atiende a la comunidad del noreste.</li>
      </ul>
      <p>Los consulados de Los Ángeles, Houston y Nueva Orleans cerraron en enero de 2024. Si usted vive lejos de estas tres ciudades, muchos trámites ya pueden iniciarse en línea (ver sección de pasaporte) o mediante un poder a un familiar en Nicaragua.</p>
      <h2>Pasaporte nicaragüense en el exterior</h2>
      <p>Desde marzo de 2026, la Dirección General de Migración y Extranjería (DGME) habilitó una plataforma en línea para que los nicaragüenses en el exterior soliciten o renueven su pasaporte sin viajar a Nicaragua. El trámite se inicia en <a href="https://tramitesconsulares.mint.gob.ni" target="_blank" rel="noopener noreferrer">tramitesconsulares.mint.gob.ni</a>.</p>
      <p>El sistema aplica para:</p>
      <ul>
        <li>Solicitud de pasaporte por primera vez.</li>
        <li>Renovación por vencimiento.</li>
        <li>Renovación por pérdida o robo.</li>
      </ul>
      <p>El proceso requiere crear un usuario en la plataforma, completar datos personales, indicar el consulado donde recibirá el documento y activar la cuenta por correo electrónico. Los requisitos documentales incluyen partida de nacimiento (emitida en los últimos 10 años, en buen estado), cédula de identidad nicaragüense o, en su defecto, tarjeta de residencia del país donde vive, permiso de trabajo o pasaporte vigente de otra nacionalidad, y dos fotografías tamaño pasaporte. El costo reportado por consulados y medios es de aproximadamente USD 50; confirme el monto vigente con la plataforma o el consulado. En Miami se ha reportado que el pago se realiza mediante money order.</p>
      <h2>Registro civil consular</h2>
      <p>Los consulados pueden registrar eventos civiles de nicaragüenses en el exterior: nacimientos de hijos de padres nicaragüenses, matrimonios y defunciones. Estos registros tienen validez oficial en Nicaragua y son fundamentales para que los hijos de la diáspora obtengan documentos nicaragüenses. Los requisitos documentales varían según el acto; consulte con el consulado correspondiente.</p>
      <h2>Poderes notariales y autenticaciones</h2>
      <p>Los consulados pueden otorgar poderes notariales que autorizan a un tercero en Nicaragua a realizar trámites en nombre del solicitante (por ejemplo, vender un inmueble, cobrar una herencia o gestionar documentos). También pueden autenticar copias de documentos. Si el poder se otorga ante un notario local de EE.UU., deberá apostillarse para tener validez en Nicaragua (ver nuestra guía de <a href="/guia/apostillar-documentos-eeuu-para-nicaragua">apostillar documentos en EE.UU.</a>).</p>
      <h2>Citas y tiempos de espera</h2>
      <p>Para trámites presenciales, las citas se gestionan a través de la plataforma de la Cancillería (<a href="https://citas.cancilleria.gob.ni" target="_blank" rel="noopener noreferrer">citas.cancilleria.gob.ni</a>) o directamente con el consulado. Las líneas telefónicas suelen estar saturadas; el canal en línea es el método más confiable. Los tiempos de espera varían según la demanda y el trámite.</p>
      <h2>Si tu consulado más cercano está lejos</h2>
      <ul>
        <li>Verifique primero si el trámite puede hacerse en línea (pasaporte, citas).</li>
        <li>Para trámites que requieren presencia, considere otorgar un poder consular o notarial a un familiar de confianza en Nicaragua.</li>
        <li>Para documentos que deben apostillarse en Nicaragua, puede delegar en un apoderado (ver nuestra guía de <a href="/guia/poder-notarial-desde-el-extranjero-para-tramites-en-nicaragua">poder notarial desde el extranjero</a>).</li>
      </ul>
      <h2>Advertencias importantes</h2>
      <p>Esta guía es informativa y no constituye asesoría legal ni consular. Los requisitos, costos y horarios pueden cambiar sin previo aviso. Antes de realizar un trámite con fecha límite, confirme directamente con el consulado correspondiente o la plataforma oficial.</p>
      <h2>Preguntas frecuentes</h2>
      <h3>¿Cuántos consulados de Nicaragua quedan en EE.UU.?</h3>
      <p>Tres: la Embajada en Washington D.C., el Consulado General de Miami y el Consulado General de Nueva York. Los consulados de Los Ángeles, Houston y Nueva Orleans cerraron en enero de 2024.</p>
      <h3>¿Puedo sacar el pasaporte nicaragüense sin ir al consulado?</h3>
      <p>Sí, desde marzo de 2026 la DGME habilitó una plataforma en línea (tramitesconsulares.mint.gob.ni) para solicitar o renovar pasaporte desde el exterior.</p>
      <h3>¿Qué hago si vivo lejos de las tres oficinas consulares?</h3>
      <p>Muchos trámites pueden iniciarse en línea. Para los que requieren presencia, puede otorgar un poder a un familiar en Nicaragua o evaluar el consulado más cercano según su región.</p>
      <h3>¿El consulado registra los nacimientos de mis hijos en EE.UU.?</h3>
      <p>Sí, los nacimientos de hijos de padres nicaragüenses pueden registrarse en el registro civil consular, lo que les da documentos nicaragüenses oficiales.</p>
      <h3>¿Cuánto cuesta el pasaporte en el exterior?</h3>
      <p>El costo reportado es de aproximadamente USD 50, pero varía según el trámite y el consulado. Confirme el monto vigente antes de pagar.</p>
      <h2>Fuentes consultadas</h2>
      <p>MINREX de Nicaragua (minrex.gob.ni); DGME / plataforma tramitesconsulares.mint.gob.ni; Confidencial Digital (reportaje sobre consulados nicaragüenses en EE.UU., 2026); consuldenicaragua.com (directorio consular); Departament of State de EE.UU. (directorio consular). Verificado en noviembre de 2026.</p>
    `,
    faqs: [
      { question: '¿Cuántos consulados de Nicaragua quedan en EE.UU.?', answer: 'Tres: la Embajada en Washington D.C., el Consulado General de Miami y el Consulado General de Nueva York. Los consulados de Los Ángeles, Houston y Nueva Orleans cerraron en enero de 2024.' },
      { question: '¿Puedo sacar el pasaporte nicaragüense sin ir al consulado?', answer: 'Sí, desde marzo de 2026 la DGME habilitó una plataforma en línea (tramitesconsulares.mint.gob.ni) para solicitar o renovar pasaporte desde el exterior.' },
      { question: '¿Qué hago si vivo lejos de las tres oficinas consulares?', answer: 'Muchos trámites pueden iniciarse en línea. Para los que requieren presencia, puede otorgar un poder a un familiar en Nicaragua o evaluar el consulado más cercano según su región.' },
      { question: '¿El consulado registra los nacimientos de mis hijos en EE.UU.?', answer: 'Sí, los nacimientos de hijos de padres nicaragüenses pueden registrarse en el registro civil consular.' },
      { question: '¿Cuánto cuesta el pasaporte en el exterior?', answer: 'El costo reportado es de aproximadamente USD 50, pero varía según el trámite y el consulado. Confirme el monto vigente antes de pagar.' }
    ],
  },
  {
    slug: 'certificado-antecedente-penal-nicaragua-desde-el-extranjero',
    title: 'Certificado de antecedente penal de Nicaragua desde el extranjero: cómo obtenerlo',
    seoTitle: 'Antecedente penal de Nicaragua desde el exterior',
    description: 'Cómo obtener el certificado de conducta o récord policial de Nicaragua desde el extranjero: vías, representante en Managua, auténtica, apostilla y tiempos. Verificado 2026.',
    category: 'Diáspora',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-11-28',
    updatedDate: '2026-11-28',
    content: `
      <p>El certificado de conducta (conocido popularmente como récord policial o antecedente penal) es uno de los documentos más solicitados por nicaragüenses en el exterior: lo exigen trámites de visa, residencia, empleo y nacionalidad en el país donde viven. Esta guía explica cómo obtenerlo desde fuera de Nicaragua, qué pasos intermedios requiere y qué errores invalidan el documento. Verificado con fuentes oficiales en noviembre de 2026.</p>
      <h2>Qué documento se necesita y quién lo emite</h2>
      <p>En Nicaragua el documento se llama <strong>certificado de conducta</strong> y lo emite la <strong>Policía Nacional</strong>. Para uso en el extranjero, el certificado debe cumplir requisitos adicionales que lo diferencian del que se usa dentro del país:</p>
      <ul>
        <li>En muchos casos se requiere que el certificado salga con la firma original del Jefe o Segunda Jefe de Seguridad Pública (especialmente para España y otros países que lo exigen).</li>
        <li>Debe ser <strong>auténticado</strong> en la Oficina de Servicios Policiales de la sede central de la Policía Nacional en Managua.</li>
        <li>Debe ser <strong>apostillado</strong> en la Cancillería (MINREX) de Nicaragua para tener validez internacional.</li>
      </ul>
      <p>La Policía Nacional tiene un portal de trámites en línea en <a href="https://tramitesenlinea.policia.gob.ni" target="_blank" rel="noopener noreferrer">tramitesenlinea.policia.gob.ni</a> donde puede consultar el procedimiento vigente.</p>
      <h2>Vías para obtenerlo desde el extranjero</h2>
      <h3>Vía 1: Representante o apoderado en Nicaragua</h3>
      <p>La vía más común es otorgar un poder a un familiar o gestor de confianza en Nicaragua que acuda a la Policía Nacional, gestione la auténtica y la apostilla, y envíe el documento apostillado al exterior. El poder puede otorgarse ante un consulado nicaragüense o ante un notario local del país de residencia, seguido de la apostilla correspondiente (ver nuestras guías de <a href="/guia/poder-notarial-desde-el-extranjero-para-tramites-en-nicaragua">poder notarial</a> y <a href="/guia/apostillar-documentos-eeuu-para-nicaragua">apostilla</a>).</p>
      <h3>Vía 2: Orientación consular</h3>
      <p>Algunos consulados nicaragüenses orientan sobre el trámite y, en casos específicos, gestionan parte del proceso, pero la emisión del certificado y su auténtica se realizan en Nicaragua. El consulado de Nicaragua en Madrid, por ejemplo, ha coordinado el trámite para solicitantes en España según reportes consulares; confirme siempre la disponibilidad con su consulado.</p>
      <h3>Vía 3: Trámite en línea (cuando esté disponible)</h3>
      <p>La Policía Nacional ha digitalizado parte de sus trámites; verifique en tramitesenlinea.policia.gob.ni si el certificado de conducta para uso en el extranjero puede solicitarse en línea o si requiere presencia del titular o apoderado.</p>
      <h2>Paso a paso del proceso completo</h2>
      <ol>
        <li>Confirme los requisitos exactos del país donde presentará el documento (España, EE.UU., México, etc.) — algunos exigen el certificado con auténtica y apostilla, otros solo el certificado.</li>
        <li>Otorgue un poder a un representante en Nicaragua si no puede realizar el trámite personalmente.</li>
        <li>El representante solicita el certificado de conducta en la Policía Nacional especificando que es para uso en el extranjero.</li>
        <li>Se realiza la auténtica en la Oficina de Servicios Policiales de la sede central en Managua.</li>
        <li>Se apostilla el documento en la Cancillería (MINREX).</li>
        <li>El documento se envía al exterior por el medio más seguro disponible.</li>
      </ol>
      <h2>Tiempos y vigencia</h2>
      <p>Los tiempos dependen de la agilidad del representante, la disponibilidad de citas en la Cancillería para la apostilla (que puede tardar semanas o meses según la demanda) y el envío internacional. Muchos países exigen que el certificado tenga una antigüedad máxima (por ejemplo, emitido en los últimos 3-6 meses); verifique el requisito del país receptor antes de iniciar.</p>
      <h2>Si el certificado muestra antecedentes</h2>
      <p>Si el certificado de conducta refleja anotaciones o antecedentes, el documento es válido pero puede afectar el trámite migratorio. En ese caso existe un procedimiento de anulación de antecedentes ante la Policía Nacional; consulte nuestra guía de <a href="/guia/anular-recurso-policial-nicaragua-2026">cómo anular el récord policial en Nicaragua</a>.</p>
      <h2>Errores comunes</h2>
      <ul>
        <li>Solicitar el certificado "normal" cuando el país receptor exige el certificado para uso en el extranjero (con auténtica y firma del jefe de Seguridad Pública).</li>
        <li>Omitir la auténtica en la Policía Nacional antes de apostillar.</li>
        <li>No verificar la antigüedad máxima que exige el país receptor.</li>
        <li>Usar un poder que no está apostillado o que no faculta específicamente para este trámite.</li>
      </ul>
      <h2>Advertencias importantes</h2>
      <p>Esta guía es informativa y no constituye asesoría legal. Los requisitos del certificado de conducta, la auténtica y la apostilla pueden variar según el país receptor y la situación del solicitante. Antes de un trámite con fecha límite, confirme los requisitos directamente con la Policía Nacional, el consulado y la institución del país donde presentará el documento.</p>
      <h2>Preguntas frecuentes</h2>
      <h3>¿Quién emite el certificado de antecedente penal en Nicaragua?</h3>
      <p>La Policía Nacional de Nicaragua, a través de su certificado de conducta.</p>
      <h3>¿Puedo obtenerlo sin viajar a Nicaragua?</h3>
      <p>Sí, mediante un representante o apoderado en Nicaragua que gestione el trámite ante la Policía Nacional, la auténtica y la apostilla. Algunos consulados orientan, pero la emisión se realiza en el país.</p>
      <h3>¿El certificado necesita apostilla para España?</h3>
      <p>Sí. Nicaragua es parte de la Convención de La Haya y el certificado debe apostillarse en la Cancillería para ser válido en España.</p>
      <h3>¿Cuánto tarda el trámite desde el exterior?</h3>
      <p>Depende del representante, la disponibilidad de citas en la Cancillería y el envío. Puede tardar de 2 a 8 semanas o más; los trámites migratorios suelen tener fechas límite, planifique con anticipación.</p>
      <h3>¿Qué pasa si el certificado muestra antecedentes?</h3>
      <p>El documento es válido pero puede complicar el trámite migratorio. Existe un procedimiento de anulación de antecedentes; consulte nuestra guía específica.</p>
      <h2>Fuentes consultadas</h2>
      <p>Policía Nacional de Nicaragua (policia.gob.ni, tramitesenlinea.policia.gob.ni); MINREX / Cancillería de Nicaragua (minrex.gob.ni); Consulado de Nicaragua en Madrid (requisitos consulares); Convenio de La Haya (hcch.net). Verificado en noviembre de 2026.</p>
    `,
    faqs: [
      { question: '¿Quién emite el certificado de antecedente penal en Nicaragua?', answer: 'La Policía Nacional de Nicaragua, a través de su certificado de conducta.' },
      { question: '¿Puedo obtenerlo sin viajar a Nicaragua?', answer: 'Sí, mediante un representante o apoderado en Nicaragua que gestione el trámite ante la Policía Nacional, la auténtica y la apostilla.' },
      { question: '¿El certificado necesita apostilla para España?', answer: 'Sí. Nicaragua es parte de la Convención de La Haya y el certificado debe apostillarse en la Cancillería para ser válido en España.' },
      { question: '¿Cuánto tarda el trámite desde el exterior?', answer: 'Depende del representante, la disponibilidad de citas en la Cancillería y el envío. Puede tardar de 2 a 8 semanas o más.' },
      { question: '¿Qué pasa si el certificado muestra antecedentes?', answer: 'El documento es válido pero puede complicar el trámite migratorio. Existe un procedimiento de anulación de antecedentes; consulte nuestra guía específica.' }
    ],
  },
  {
    slug: 'nicaraguenses-en-espana-tramites-nie-nacionalidad',
    title: 'Nicaragüenses en España: NIE, empadronamiento y nacionalidad española — guía de trámites',
    seoTitle: 'Trámites para nicaragüenses en España',
    description: 'Guía de trámites para nicaragüenses en España: NIE, empadronamiento, autorización de residencia, nacionalidad española por residencia y trámites nicaragüenses desde España.',
    category: 'Diáspora',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-11-28',
    updatedDate: '2026-11-28',
    content: `
      <p>España es una de las principales destinos de la diáspora nicaragüense en Europa. Esta guía ordena los trámites que un nicaragüense debe realizar al llegar y en los años siguientes: empadronamiento, NIE, autorización de residencia y, en su caso, nacionalidad española. La información está verificada con fuentes oficiales en noviembre de 2026; las políticas migratorias españolas cambian con frecuencia, confirme siempre los requisitos vigentes.</p>
      <h2>Primeros pasos al llegar a España</h2>
      <h3>Empadronamiento</h3>
      <p>El empadronamiento es el registro de residencia ante el ayuntamiento de su ciudad. Es el primer paso obligatorio: sin él no puede obtener el NIE ni acceder a la mayoría de servicios públicos. Se realiza en el ayuntamiento correspondiente presentando el pasaporte y el contrato de alquiler o autorización del propietario del inmueble. El empadronamiento acredita su residencia a efectos administrativos.</p>
      <h3>NIE (Número de Identidad de Extranjero)</h3>
      <p>El NIE es el número que identifica a los extranjeros en España y es necesario para casi todo: abrir cuenta bancaria, trabajar, alquilar vivienda, acceder a la sanidad pública y realizar trámites. Se solicita ante la Oficina de Extranjería (EXTRANJERÍA) de la Policía Nacional, normalmente con cita previa, presentando el pasaporte y justificante de empadronamiento o motivo de la solicitud. Los trámites de NIE pueden gestionarse también a través de representantes acreditados en algunos casos.</p>
      <h2>Autorización de residencia y trabajo</h2>
      <p>Para residir legalmente en España por más de 90 días (turismo) se necesita una autorización de residencia. Las vías principales para nicaragüenses incluyen:</p>
      <ul>
        <li><strong>Residencia por arraigo:</strong> para quienes llevan tiempo en España y cumplen requisitos de integración laboral, social o familiar.</li>
        <li><strong>Residencia por reagrupación familiar:</strong> para reunirse con familiares residentes.</li>
        <li><strong>Residencia por trabajo:</strong> cuando existe una oferta de empleo o autorización de trabajo.</li>
        <li><strong>Residencia no lucrativa:</strong> para quienes tienen medios económicos suficientes y no trabajarán.</li>
      </ul>
      <p>Cada vía tiene requisitos específicos de documentación, plazos y tasas. La Oficina de Extranjería publica los requisitos vigentes en <a href="https://www.interior.gob.es" target="_blank" rel="noopener noreferrer">interior.gob.es</a>.</p>
      <h2>Nacionalidad española por residencia</h2>
      <p>La nacionalidad española puede solicitarse tras un período de residencia legal y continuada en España. Para nacionales de países iberoamericanos — categoría que incluye a Nicaragua — el plazo general de residencia exigido es de <strong>2 años</strong> (frente a los 10 años del régimen general), siempre que se cumplan los demás requisitos.</p>
      <p>El proceso incluye:</p>
      <ol>
        <li>Residencia legal y continuada durante el plazo exigido.</li>
        <li>Buena conducta cívica (certificado de antecedentes penales de España y del país de origen).</li>
        <li>Exámenes de conocimiento: DELE (nivel A2 o superior para hispanohablantes puede eximirse en algunos casos) y CCSE (conocimientos constitucionales y socioculturales) ante el Instituto Cervantes.</li>
        <li>Suficiencia económica y solicitud ante el Ministerio de Justicia.</li>
      </ol>
      <p>El plazo de resolución puede extenderse varios meses o más. Consulte la información oficial en el Ministerio de Justicia y el Instituto Cervantes.</p>
      <h2>Trámites nicaragüenses desde España</h2>
      <p>Como nicaragüense residente en España, también puede necesitar realizar trámites ante el Estado nicaragüense:</p>
      <ul>
        <li><strong>Pasaporte:</strong> renovación o primera emisión — puede iniciarse en línea en tramitesconsulares.mint.gob.ni o en el consulado de Nicaragua en Madrid.</li>
        <li><strong>Registro civil:</strong> registro de nacimientos, matrimonios y defunciones de nicaragüenses en España.</li>
        <li><strong>Certificado de conducta:</strong> para muchos trámites españoles se exige el certificado de antecedentes penales nicaragüense apostillado — consulte nuestra guía de <a href="/guia/certificado-antecedente-penal-nicaragua-desde-el-extranjero">antecedente penal desde el extranjero</a>.</li>
        <li><strong>Poderes notariales:</strong> para autorizar trámites en Nicaragua — consulte nuestra guía de <a href="/guia/poder-notarial-desde-el-extranjero-para-tramites-en-nicaragua">poder notarial desde el extranjero</a>.</li>
      </ul>
      <h2>Errores que retrasan los trámites</h2>
      <ul>
        <li>No empadronarse al llegar: bloquea el NIE y todos los trámites posteriores.</li>
        <li>Dejar vencer el pasaporte o la autorización de residencia.</li>
        <li>Presentar documentación incompleta o no traducida cuando se exige.</li>
        <li>Confundir la inscripción consular con el empadronamiento municipal (son registros distintos).</li>
      </ul>
      <h2>Advertencias importantes</h2>
      <p>Esta guía es informativa y no constituye asesoría legal ni migratoria. Los requisitos, plazos, tasas y procedimientos de EXTRANJERÍA, el Ministerio de Justicia y los consulados cambian con frecuencia. Antes de un trámite con fecha límite, confirme los requisitos vigentes directamente con la autoridad competente.</p>
      <h2>Preguntas frecuentes</h2>
      <h3>¿Cuánto tiempo de residencia necesito para la nacionalidad española siendo nicaragüense?</h3>
      <p>Para nacionales de países iberoamericanos (incluida Nicaragua), el plazo general es de 2 años de residencia legal y continuada, siempre que se cumplan los demás requisitos.</p>
      <h3>¿Qué es el NIE y para qué sirve?</h3>
      <p>Es el Número de Identidad de Extranjero, necesario para casi todos los trámites en España: trabajar, abrir cuenta bancaria, acceder a la sanidad, alquilar y realizar gestiones administrativas.</p>
      <h3>¿El empadronamiento es obligatorio?</h3>
      <p>Sí, es el primer registro obligatorio al llegar y es requisito para obtener el NIE y acceder a servicios públicos.</p>
      <h3>¿Necesito el certificado de antecedentes penales de Nicaragua para la nacionalidad?</h3>
      <p>Sí, normalmente se exige tanto el certificado español como el del país de origen, apostillado y traducido si es necesario.</p>
      <h3>¿Dónde se tramita el NIE?</h3>
      <p>Ante la Oficina de Extranjería (EXTRANJERÍA) de la Policía Nacional, normalmente con cita previa.</p>
      <h2>Fuentes consultadas</h2>
      <p>Ministerio del Interior de España (interior.gob.es — Extranjería); Ministerio de Justicia (nacionalidad española); Instituto Cervantes (exámenes CCSE/DELE); Seguridad Social (seg-social.es); Consulado de Nicaragua en España (minrex.gob.ni). Verificado en noviembre de 2026.</p>
    `,
    faqs: [
      { question: '¿Cuánto tiempo de residencia necesito para la nacionalidad española siendo nicaragüense?', answer: 'Para nacionales de países iberoamericanos (incluida Nicaragua), el plazo general es de 2 años de residencia legal y continuada, siempre que se cumplan los demás requisitos.' },
      { question: '¿Qué es el NIE y para qué sirve?', answer: 'Es el Número de Identidad de Extranjero, necesario para casi todos los trámites en España: trabajar, abrir cuenta bancaria, acceder a la sanidad, alquilar y realizar gestiones administrativas.' },
      { question: '¿El empadronamiento es obligatorio?', answer: 'Sí, es el primer registro obligatorio al llegar y es requisito para obtener el NIE y acceder a servicios públicos.' },
      { question: '¿Necesito el certificado de antecedentes penales de Nicaragua para la nacionalidad?', answer: 'Sí, normalmente se exige tanto el certificado español como el del país de origen, apostillado y traducido si es necesario.' },
      { question: '¿Dónde se tramita el NIE?', answer: 'Ante la Oficina de Extranjería (EXTRANJERÍA) de la Policía Nacional, normalmente con cita previa.' }
    ],
  },
  {
    slug: 'poder-notarial-desde-el-extranjero-para-tramites-en-nicaragua',
    title: 'Poder notarial otorgado en el extranjero para trámites en Nicaragua: cómo hacerlo válido',
    seoTitle: 'Poder notarial desde el extranjero para Nicaragua',
    description: 'Cómo otorgar un poder notarial en el extranjero que sea válido en Nicaragua: poder consular, poder ante notario local con apostilla, requisitos y errores comunes.',
    category: 'Diáspora',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-11-28',
    updatedDate: '2026-11-28',
    content: `
      <p>Cuando un nicaragüense en el extranjero necesita que alguien en Nicaragua realice un trámite en su nombre — vender un inmueble, cobrar una herencia, gestionar documentos, representar en un proceso — debe otorgar un <strong>poder notarial</strong>. Este documento debe ser válido tanto en el país donde se otorga como en Nicaragua. Esta guía explica las vías, los requisitos y los errores que invalidan un poder. Verificado con fuentes oficiales en noviembre de 2026.</p>
      <h2>Qué es un poder y cuándo se necesita</h2>
      <p>Un poder notarial es un documento que autoriza a una persona (el apoderado) a actuar en nombre de otra (el poderdante) ante instituciones públicas o privadas. En Nicaragua se usa para trámites inmobiliarios, bancarios, administrativos, sucesorios y judiciales. Si usted está en el exterior y necesita que un familiar o gestor realice uno de estos trámites, el poder es el instrumento legal.</p>
      <h2>Vías válidas para otorgar el poder</h2>
      <h3>Vía 1: Poder consular</h3>
      <p>Los consulados nicaragüenses en el exterior pueden otorgar poderes notariales con validez directa en Nicaragua, sin necesidad de apostilla adicional. Es la vía más simple cuando el consulado correspondiente ofrece el servicio. Verifique con su consulado si otorga poderes y qué requisitos exige (identificación, datos del apoderado, facultades específicas).</p>
      <h3>Vía 2: Poder ante notario local + apostilla</h3>
      <p>Si el consulado no ofrece el servicio o no hay consulado cerca, puede otorgar el poder ante un notario público del país donde reside. Para que sea válido en Nicaragua, el documento debe:</p>
      <ol>
        <li>Ser otorgado ante un notario competente del país de residencia.</li>
        <li>Ser apostillado conforme a la Convención de La Haya (si ese país es miembro) o legalizado consularmente.</li>
        <li>Si Nicaragua lo exige, ser traducido al español por traductor oficial o jurado.</li>
      </ol>
      <p>La apostilla se obtiene ante la autoridad competente del país emisor (por ejemplo, el Secretary of State en EE.UU. o el Ministerio de Justicia en España). Consulte nuestra guía de <a href="/guia/apostillar-documentos-eeuu-para-nicaragua">apostillar documentos en EE.UU.</a>.</p>
      <h2>Qué debe contener el poder</h2>
      <p>Para que el poder sea válido y útil en Nicaragua, debe especificar claramente:</p>
      <ul>
        <li>Identificación completa del poderdante (nombre, documento de identidad, nacionalidad).</li>
        <li>Identificación completa del apoderado.</li>
        <li>Las <strong>facultades específicas</strong> que se otorgan (por ejemplo, "vender el inmueble ubicado en...", "cobrar la herencia de...", "gestionar el trámite de...").</li>
        <li>El alcance y la duración del poder (si es por un trámite específico o general).</li>
        <li>La firma del poderdante y la autenticación notarial o consular.</li>
      </ul>
      <p>Un poder con facultades vagas ("para que haga lo que sea necesario") puede ser rechazado por las instituciones nicaragüenses. Especificar el trámite exacto es fundamental.</p>
      <h2>Errores que invalidan un poder en Nicaragua</h2>
      <ul>
        <li>Falta de apostilla o legalización consular cuando el documento fue otorgado en el extranjero.</li>
        <li>Facultades mal redactadas o demasiado genéricas.</li>
        <li>El notario del país de origen no es competente para ese tipo de documento.</li>
        <li>No traducir el documento cuando Nicaragua lo exige.</li>
        <li>Usar un poder que ya venció (algunos trámites exigen poderes recientes).</li>
      </ul>
      <h2>Casos frecuentes</h2>
      <ul>
        <li><strong>Venta de inmueble:</strong> el apoderado puede firmar la escritura si el poder lo faculta específicamente.</li>
        <li><strong>Herencias:</strong> el apoderado puede aceptar la herencia y gestionar los documentos ante los registros.</li>
        <li><strong>Trámites administrativos:</strong> obtener certificados, pagar tasas, retirar documentos.</li>
        <li><strong>Representación judicial:</strong> solo si el poder incluye facultades específicas para litigio.</li>
      </ul>
      <h2>Advertencias importantes</h2>
      <p>Esta guía es informativa y no constituye asesoría legal. La validez de un poder depende del país donde se otorga, el tipo de documento, las facultades otorgadas y los requisitos de la institución nicaragüense que lo recibe. Antes de un trámite importante, consulte con un abogado o notario del país correspondiente y con la institución nicaragüense receptora.</p>
      <h2>Preguntas frecuentes</h2>
      <h3>¿Puedo otorgar un poder en EE.UU. para usarlo en Nicaragua?</h3>
      <p>Sí, ante un notario público de EE.UU., seguido de la apostilla del Secretary of State del estado correspondiente. También puede consultar si el consulado nicaragüense otorga poderes con validez directa.</p>
      <h3>¿El poder consular necesita apostilla?</h3>
      <p>No. Los poderes otorgados ante funcionario consular nicaragüense tienen validez directa en Nicaragua.</p>
      <h3>¿Cuánto tarda el proceso?</h3>
      <p>El poder consular puede ser inmediato en el consulado. El poder notarial + apostilla puede tardar de días a semanas según el estado y la carga de la autoridad apostillante.</p>
      <h3>¿Necesito traducir el poder al español?</h3>
      <p>Si se otorgó en un país donde el español no es idioma oficial, probablemente sí. Verifique si Nicaragua exige traducción jurada o oficial.</p>
      <h3>¿Un poder general sirve para cualquier trámite?</h3>
      <p>No siempre. Muchos trámites nicaragüenses exigen poderes específicos que detallen la operación. Un poder demasiado genérico puede ser rechazado.</p>
      <h2>Fuentes consultadas</h2>
      <p>MINREX / consulados nicaragüenses (minrex.gob.ni); Convenio de La Haya (hcch.net); normativa notarial y registral de Nicaragua; guías oficiales de Secretarios de Estado estatales de EE.UU. Verificado en noviembre de 2026.</p>
    `,
    faqs: [
      { question: '¿Puedo otorgar un poder en EE.UU. para usarlo en Nicaragua?', answer: 'Sí, ante un notario público de EE.UU., seguido de la apostilla del Secretary of State del estado correspondiente. También puede consultar si el consulado nicaragüense otorga poderes con validez directa.' },
      { question: '¿El poder consular necesita apostilla?', answer: 'No. Los poderes otorgados ante funcionario consular nicaragüense tienen validez directa en Nicaragua.' },
      { question: '¿Cuánto tarda el proceso?', answer: 'El poder consular puede ser inmediato en el consulado. El poder notarial + apostilla puede tardar de días a semanas según el estado y la autoridad apostillante.' },
      { question: '¿Necesito traducir el poder al español?', answer: 'Si se otorgó en un país donde el español no es idioma oficial, probablemente sí. Verifique si Nicaragua exige traducción jurada u oficial.' },
      { question: '¿Un poder general sirve para cualquier trámite?', answer: 'No siempre. Muchos trámites nicaragüenses exigen poderes específicos que detallen la operación. Un poder demasiado genérico puede ser rechazado.' }
    ],
  },
  {
    slug: 'pasaporte-nicaragua-desde-el-extranjero',
    title: 'Pasaporte nicaragüense en el extranjero: primera vez, renovación y reposición desde el consulado',
    seoTitle: 'Pasaporte nicaragüense en el extranjero',
    description: 'Cómo obtener o renovar el pasaporte nicaragüense desde el exterior: plataforma en línea, consulados en EE.UU., requisitos, costos y tiempos. Verificado 2026.',
    category: 'Diáspora',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-11-28',
    updatedDate: '2026-11-28',
    content: `
      <p>El pasaporte es el documento más necesario para un nicaragüense en el exterior: lo exigen para viajar, renovar visas, realizar trámites consulares y acreditar identidad. Desde marzo de 2026, la DGME habilitó una plataforma en línea que permite solicitar o renovar el pasaporte sin viajar a Nicaragua. Esta guía explica las vías, los requisitos y los errores que retrasan el trámite. Verificado con fuentes oficiales en noviembre de 2026.</p>
      <h2>Dos vías para obtener el pasaporte desde el exterior</h2>
      <h3>Vía 1: Plataforma en línea (DGME)</h3>
      <p>La Dirección General de Migración y Extranjería habilitó en marzo de 2026 una plataforma para que los nicaragüenses en el exterior soliciten o renueven su pasaporte en línea. El trámite se inicia en <a href="https://tramitesconsulares.mint.gob.ni" target="_blank" rel="noopener noreferrer">tramitesconsulares.mint.gob.ni</a>.</p>
      <p>Aplica para:</p>
      <ul>
        <li>Solicitud de pasaporte por primera vez.</li>
        <li>Renovación por vencimiento.</li>
        <li>Reposición por pérdida o robo.</li>
      </ul>
      <p>El proceso requiere crear usuario y contraseña, registrar datos personales (nombres, fecha de nacimiento, profesión, teléfono, correo), indicar el consulado donde recibirá el documento y activar la cuenta por correo. Una vez completado el formulario, el pasaporte se entrega en el consulado seleccionado.</p>
      <h3>Vía 2: Presencial en consulado</h3>
      <p>Si prefiere o necesita hacer el trámite presencialmente, los consulados nicaragüenses en el exterior emiten pasaportes. En EE.UU. quedan tres oficinas: Washington D.C., Miami y Nueva York. Verifique con su consulado si emite pasaportes y qué requisitos documentales exige.</p>
      <h2>Requisitos documentales</h2>
      <p>Para la solicitud en línea o presencial, prepare:</p>
      <ul>
        <li><strong>Partida de nacimiento:</strong> emitida en los últimos 10 años, en buen estado.</li>
        <li><strong>Cédula de identidad nicaragüense:</strong> original o copia de ambos lados, ampliada. Si no la tiene, puede presentar tarjeta de residencia del país donde vive, permiso de trabajo o pasaporte vigente de otra nacionalidad.</li>
        <li><strong>Dos fotografías tamaño pasaporte:</strong> actualizadas, con las especificaciones del consulado.</li>
        <li><strong>Comprobante de pago:</strong> el costo reportado es de aproximadamente USD 50; confirme el monto vigente en la plataforma o consulado. En Miami se ha reportado que se acepta money order.</li>
        <li><strong>Para renovación:</strong> pasaporte original y copia de la página de biodatos y última renovación.</li>
        <li><strong>Para pasaporte extraviado o robado:</strong> declaración ante el funcionario consular (costo adicional reportado de ~USD 10).</li>
        <li><strong>Para menores de edad:</strong> requisitos adicionales que varían según la edad; consulte con el consulado.</li>
      </ul>
      <h2>Citas y tiempos de espera</h2>
      <p>Para trámites presenciales, las citas se gestionan a través de la plataforma de la Cancillería (<a href="https://citas.cancilleria.gob.ni" target="_blank" rel="noopener noreferrer">citas.cancilleria.gob.ni</a>) o directamente con el consulado. La plataforma en línea de la DGME puede reducir la necesidad de cita presencial para la solicitud, pero la entrega física del documento suele requerir presentación en el consulado.</p>
      <h2>Pasaporte vencido o próximo a vencer</h2>
      <p>Si su pasaporte está vencido o venció hace poco, inicie la renovación con anticipación. Muchos países exigen que el pasaporte tenga una validez mínima (por ejemplo, 6 meses) para ingresar o tramitar visas. Si el pasaporte venció hace mucho, es posible que se le trate como primera emisión y se le exijan los requisitos completos.</p>
      <h2>Errores que retrasan el trámite</h2>
      <ul>
        <li>No verificar que la partida de nacimiento tenga menos de 10 años de emitida.</li>
        <li>Presentar documentos en mal estado o copias no legibles.</li>
        <li>No confirmar el consulado de entrega antes de iniciar el trámite en línea.</li>
        <li>Olvidar que el trámite en línea no elimina la necesidad de recoger el documento en el consulado.</li>
        <li>Para menores: no llevar la documentación adicional que exige el consulado.</li>
      </ul>
      <h2>Advertencias importantes</h2>
      <p>Esta guía es informativa y no constituye asesoría legal ni consular. Los requisitos, costos, plataformas y horarios pueden cambiar. Antes de un viaje o trámite con fecha límite, confirme los requisitos vigentes directamente con la plataforma de la DGME o el consulado correspondiente.</p>
      <h2>Preguntas frecuentes</h2>
      <h3>¿Puedo sacar el pasaporte nicaragüense sin ir al consulado?</h3>
      <p>La solicitud puede iniciarse en línea en tramitesconsulares.mint.gob.ni, pero la entrega física del documento generalmente requiere presentarse en el consulado seleccionado.</p>
      <h3>¿Cuánto cuesta el pasaporte en el exterior?</h3>
      <p>El costo reportado es de aproximadamente USD 50, pero varía según el trámite y el consulado. Confirme el monto vigente antes de pagar.</p>
      <h3>¿Qué pasa si perdí mi pasaporte en el exterior?</h3>
      <p>Debe reportar la pérdida ante el consulado y solicitar la reposición. Se requiere una declaración ante el funcionario consular (costo adicional) y los documentos de identidad correspondientes.</p>
      <h3>¿Puedo tramitar el pasaporte de mis hijos menores?</h3>
      <p>Sí, pero los menores tienen requisitos adicionales (partida de nacimiento, presencia de padres o tutores, fotos, etc.). Consulte con el consulado los requisitos específicos por edad.</p>
      <h3>¿El pasaporte tiene vencimiento?</h3>
      <p>Sí, típicamente 5 años para adultos y 3 años para menores, aunque puede variar. Verifique la validez en su documento.</p>
      <h2>Fuentes consultadas</h2>
      <p>DGME / plataforma tramitesconsulares.mint.gob.ni; MINREX / consulados nicaragüenses (minrex.gob.ni); Confidencial Digital (reportaje sobre pasaporte en línea, marzo 2026); consuldenicaragua.com. Verificado en noviembre de 2026.</p>
    `,
    faqs: [
      { question: '¿Puedo sacar el pasaporte nicaragüense sin ir al consulado?', answer: 'La solicitud puede iniciarse en línea en tramitesconsulares.mint.gob.ni, pero la entrega física del documento generalmente requiere presentarse en el consulado seleccionado.' },
      { question: '¿Cuánto cuesta el pasaporte en el exterior?', answer: 'El costo reportado es de aproximadamente USD 50, pero varía según el trámite y el consulado. Confirme el monto vigente antes de pagar.' },
      { question: '¿Qué pasa si perdí mi pasaporte en el exterior?', answer: 'Debe reportar la pérdida ante el consulado y solicitar la reposición. Se requiere una declaración ante el funcionario consular y los documentos de identidad correspondientes.' },
      { question: '¿Puedo tramitar el pasaporte de mis hijos menores?', answer: 'Sí, pero los menores tienen requisitos adicionales. Consulte con el consulado los requisitos específicos por edad.' },
      { question: '¿El pasaporte tiene vencimiento?', answer: 'Sí, típicamente 5 años para adultos y 3 años para menores, aunque puede variar. Verifique la validez en su documento.' }
    ],
  },
  {
    slug: 'visa-h2b-trabajadores-nicaraguenes-estados-unidos',
    title: 'Visa H-2B para trabajadores nicaragüenses en EE.UU.: requisitos, empleador y proceso',
    seoTitle: 'Visa H-2B para nicaragüenses en EE.UU.',
    description: 'Guía de la visa H-2B para trabajadores nicaragüenses en Estados Unidos: qué trabajos cubre, papel del empleador, proceso, cupos y requisitos. Verificado 2026.',
    category: 'Diáspora',
    author: 'Keyling Elieth Rivera Muñoz',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-11-28',
    updatedDate: '2026-11-28',
    content: `
      <p>La visa H-2B permite a trabajadores extranjeros ocupar empleos temporales no agrícolas en Estados Unidos cuando el empleador demuestra que no puede encontrar suficientes trabajadores estadounidenses calificados. Nicaragua ha sido consistentemente incluida en la lista de países elegibles del programa. Esta guía explica el proceso, los requisitos y lo que el trabajador nicaragüense debe saber. Verificado con fuentes oficiales en noviembre de 2026.</p>
      <h2>Qué es la visa H-2B</h2>
      <p>La H-2B es una visa de no inmigrante para trabajo temporal o estacional en sectores no agrícolas: construcción, turismo, hoteles, restaurantes, jardinería, eventos y otros. No aplica para agricultura (esa es la H-2A) ni para trabajo permanente. El trabajador debe tener una oferta de empleo de un empleador estadounidense que haya completado el proceso ante las autoridades laborales.</p>
      <h2>El papel del empleador: el proceso empieza con él</h2>
      <p>El trabajador no puede solicitar la H-2B por iniciativa propia. El proceso lo inicia el empleador estadounidense:</p>
      <ol>
        <li><strong>Certificación laboral del DOL:</strong> el empleador solicita al Departamento de Trabajo (DOL) una certificación que demuestre que no hay trabajadores estadounidenses disponibles y que el empleo no afectará las condiciones laborales locales.</li>
        <li><strong>Petición ante USCIS:</strong> con la certificación aprobada, el empleador presenta el formulario I-129 ante el Servicio de Ciudadanía e Inmigración (USCIS).</li>
        <li><strong>Notificación al trabajador:</strong> USCIS aprueba la petición y notifica al trabajador, quien debe solicitar la visa en el consulado de su país.</li>
      </ol>
      <h2>El papel del trabajador nicaragüense</h2>
      <p>Una vez que el empleador tiene la petición aprobada, el trabajador debe:</p>
      <ol>
        <li>Completar el formulario DS-160 (solicitud de visa no inmigrante) en línea.</li>
        <li>Pagar la tarifa de visa no inmigrante.</li>
        <li>Agendar una entrevista consular en la Embajada de EE.UU. en Managua (o el consulado correspondiente).</li>
        <li>Asistir a la entrevista con la documentación requerida: pasaporte vigente, carta de oferta del empleador, certificación laboral y demás documentos que indique la embajada.</li>
        <li>Si la visa es aprobada, recibir el visto en el pasaporte y poder viajar a EE.UU. para iniciar el empleo.</li>
      </ol>
      <h2>Cupos y elegibilidad</h2>
      <p>La H-2B tiene un cupo anual estatutario (la cifra base es de 66,000 visas, con posibles exenciones adicionales para trabajadores que regresan). El DHS publica anualmente la lista de países cuyos nacionales son elegibles para participar en el programa; Nicaragua ha estado incluida de forma sostenida. La lista se renueva cada año fiscal y puede consultarse en el Federal Register y en uscis.gov.</p>
      <p><strong>Nota importante:</strong> a partir de enero de 2025, las regulaciones del DHS ya no exigen estrictamente que USCIS considere la lista de países elegibles para cada caso; USCIS puede aprobar peticiones de países no listados caso por caso si lo considera del interés de EE.UU. Sin embargo, la inclusión en la lista sigue siendo el camino estándar y más predecible.</p>
      <h2>Costos: quién paga qué</h2>
      <p>Los costos del proceso se reparten entre el empleador y el trabajador:</p>
      <ul>
        <li><strong>Empleador:</strong> típicamente asume los costos de la certificación laboral, la petición I-129 y los gastos de reclutamiento. La ley exige que el empleador no traslade al trabajador costos que le corresponden.</li>
        <li><strong>Trabajador:</strong> la tarifa de visa no inmigrante (consular) y los gastos de viaje a la entrevista y a EE.UU. son generalmente del trabajador, aunque algunos empleadores ofrecen adelantos o reembolso según el contrato.</li>
      </ul>
      <p>Verifique siempre las tarifas vigentes en travel.state.gov y los términos de su oferta de empleo.</p>
      <h2>Protección contra fraude laboral</h2>
      <p>El fraude en reclutamiento de trabajadores H-2B es un problema real. Antes de aceptar una oferta:</p>
      <ul>
        <li>Verifique que el empleador existe y tiene historial de cumplir con el programa (puede consultar con el DOL o USCIS).</li>
        <li>No pague por el trabajo: un empleador legítimo no cobra al trabajador por conseguirle la visa.</li>
        <li>Desconfíe de promesas de "visa garantizada" o de intermediarios que cobran por gestionar el trámite.</li>
        <li>Revise el contrato de trabajo: debe especificar salario, duración, condiciones y quién paga cada gasto.</li>
      </ul>
      <h2>Qué pasa al terminar el contrato</h2>
      <p>La visa H-2B es temporal: el trabajador debe regresar a su país de origen al finalizar el período autorizado, salvo que califique para otra categoría migratoria. El incumplimiento del plazo puede generar consecuencias migratorias futuras. Algunos programas de devolución (retorno) existen pero no son automáticos.</p>
      <h2>Advertencias importantes</h2>
      <p>Esta guía es informativa y no constituye asesoría legal ni migratoria. Las reglas del programa H-2B, los cupos, la elegibilidad de países y los requisitos consulares cambian con frecuencia y dependen del año fiscal. Antes de aceptar una oferta de empleo o iniciar un trámite, consulte directamente con el empleador, la Embajada de EE.UU. en Managua, uscis.gov, dol.gov y travel.state.gov.</p>
      <h2>Preguntas frecuentes</h2>
      <h3>¿Nicaragua está en la lista de países elegibles para la H-2B?</h3>
      <p>Sí. Nicaragua ha sido incluida consistentemente en la lista anual de países elegibles del DHS para el programa H-2B. Verifique la designación vigente del año fiscal actual en el Federal Register.</p>
      <h3>¿Puedo solicitar la H-2B por mi cuenta?</h3>
      <p>No. El proceso lo inicia el empleador estadounidense ante el DOL y USCIS. El trabajador actúa cuando el empleador ya tiene la petición aprobada.</p>
      <h3>¿Cuánto cuesta la visa H-2B?</h3>
      <p>La tarifa consular de visa no immigrant es estándar para todas las visas de esa categoría; verifique el monto vigente en travel.state.gov. Los demás costos del proceso los asume generalmente el empleador.</p>
      <h3>¿Qué trabajos cubre la H-2B?</h3>
      <p>Empleos temporales o estacionales no agrícolas: construcción, turismo, hoteles, restaurantes, jardinería, eventos, etc. No cubre agricultura (H-2A) ni trabajo permanente.</p>
      <h3>¿Puedo quedarme en EE.UU. después del contrato?</h3>
      <p>La H-2B es temporal; debe regresar al finalizar el período autorizado salvo que califique para otra categoría migratoria. Consultar con un abogado de inmigración para su caso específico.</p>
      <h2>Fuentes consultadas</h2>
      <p>USCIS (uscis.gov — programa H-2B); Departamento de Trabajo de EE.UU. (dol.gov — certificación laboral); Departamento de Seguridad Nacional (dhs.gov — lista de países elegibles, Federal Register); Departamento de Estado (travel.state.gov — proceso consular y tarifas); Embajada de EE.UU. en Managua (requisitos de visa). Verificado en noviembre de 2026.</p>
    `,
    faqs: [
      { question: '¿Nicaragua está en la lista de países elegibles para la H-2B?', answer: 'Sí. Nicaragua ha sido incluida consistentemente en la lista anual de países elegibles del DHS para el programa H-2B. Verifique la designación vigente del año fiscal actual en el Federal Register.' },
      { question: '¿Puedo solicitar la H-2B por mi cuenta?', answer: 'No. El proceso lo inicia el empleador estadounidense ante el DOL y USCIS. El trabajador actúa cuando el empleador ya tiene la petición aprobada.' },
      { question: '¿Cuánto cuesta la visa H-2B?', answer: 'La tarifa consular de visa no immigrant es estándar para todas las visas de esa categoría; verifique el monto vigente en travel.state.gov. Los demás costos del proceso los asume generalmente el empleador.' },
      { question: '¿Qué trabajos cubre la H-2B?', answer: 'Empleos temporales o estacionales no agrícolas: construcción, turismo, hoteles, restaurantes, jardinería, eventos, etc. No cubre agricultura ni trabajo permanente.' },
      { question: '¿Puedo quedarme en EE.UU. después del contrato?', answer: 'La H-2B es temporal; debe regresar al finalizar el período autorizado salvo que califique para otra categoría migratoria. Consulte con un abogado de inmigración para su caso específico.' }
    ],
  }
];

/** Título absoluto ≤60 caracteres para SERP; `seoTitle` editorial tiene
 *  prioridad y el `title` largo se recorta en límite de palabra. */
export function evergreenSeoTitle(article: { title: string; seoTitle?: string }): string {
  const raw = article.seoTitle?.trim() || article.title;
  if (raw.length <= 60) return raw;
  const cut = raw.slice(0, 57);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

export function getEvergreenBySlug(slug: string): EvergreenArticle | undefined {
  return EVERGREEN_ARTICLES.find((article) => article.slug === slug);
}

export function getAllEvergreen(): EvergreenArticle[] {
  return EVERGREEN_ARTICLES;
}
