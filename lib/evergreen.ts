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
    updatedDate: '2026-05-24',
    content: `
      <h2>¿Qué es la apostilla y para qué sirve?</h2>
      <p>La apostilla es un sello que certifica la autenticidad de documentos públicos nicaragüenses para que sean válidos en países que forman parte de la Convención de La Haya. Este proceso simplifica la legalización de documentos para trámites en el extranjero.</p>
      
      <h2>Documentos que se pueden apostillar</h2>
      <ul>
        <li>Certificados de nacimiento</li>
        <li>Certificados de matrimonio</li>
        <li>Certificados de defunción</li>
        <li>Diplomas y títulos académicos</li>
        <li>Antecedentes penales</li>
        <li>Poderes notariales</li>
        <li>Documentos de la Corte Suprema de Justicia</li>
      </ul>
      
      <h2>Requisitos para apostillar documentos</h2>
      <p>Para apostillar un documento en Nicaragua, necesitas:</p>
      <ul>
        <li>Documento original o copia certificada</li>
        <li>Cédula de identidad del solicitante</li>
        <li>Pago de la tasa correspondiente (C$ 150-300 según documento)</li>
      </ul>
      
      <h2>Dónde realizar el trámite</h2>
      <p>La apostilla se realiza en la Cancillería de Nicaragua (Ministerio de Relaciones Exteriores) en Managua. También hay oficinas delegadas en las principales ciudades del país.</p>
      
      <h2>Tiempos de procesamiento</h2>
      <p>El tiempo promedio es de 3-5 días hábiles. Para trámites urgentes, existe un servicio exprés con costo adicional que entrega en 24 horas.</p>
      
      <h2>Costos actualizados 2026</h2>
      <ul>
        <li>Apostilla estándar: C$ 200 por documento</li>
        <li>Servicio exprés (24 horas): C$ 400 por documento</li>
        <li>Certificaciones adicionales: C$ 50 cada una</li>
      </ul>
    `,
    faqs: [
      { question: '¿Cuánto tiempo dura la apostilla?', answer: 'La apostilla no tiene fecha de vencimiento, pero algunos países pueden requerir que el documento sea reciente (menos de 6 meses).' },
      { question: '¿Puedo apostillar documentos extranjeros en Nicaragua?', answer: 'No. Los documentos extranjeros deben apostillarse en el país de origen antes de ser usados en Nicaragua.' },
      { question: '¿Qué pasa si mi documento está en inglés?', answer: 'Si el documento está en otro idioma, debe tener traducción oficial realizada por un traductor jurado en Nicaragua.' },
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
    updatedDate: '2026-05-24',
    content: `
      <h2>¿Qué es el récord policial?</h2>
      <p>El récord policial o antecedentes penales es un documento que certifica si una persona tiene o no registros de procesos penales en Nicaragua. Este documento es requerido para trámites de empleo, visas, residencias y otros procedimientos legales.</p>
      
      <h2>Cuándo se puede solicitar la anulación</h2>
      <p>La anulación del récord policial procede cuando:</p>
      <ul>
        <li>Ha pasado más de 5 años desde el cumplimiento de la pena</li>
        <li>El proceso penal fue archivado o sobreseído</li>
        <li>Se obtuvo una absolución definitiva</li>
        <li>El delito fue de menor gravedad y no hay reincidencia</li>
      </ul>
      
      <h2>Requisitos para solicitar la anulación</h2>
      <ul>
        <li>Solicitud escrita dirigida al Jefe de la Policía Nacional</li>
        <li>Cédula de identidad vigente</li>
        <li>Certificación de la sentencia judicial (si aplica)</li>
        <li>Comprobante de pago de la tasa (C$ 500)</li>
        <li>Constancia de residencia</li>
      </ul>
      
      <h2>Paso a paso del trámite</h2>
      <ol>
        <li>Reúna todos los documentos requeridos</li>
        <li>Presente la solicitud en la delegación de la Policía Nacional más cercana</li>
        <li>Pague la tasa correspondiente en la caja</li>
        <li>Espere la resolución (30-45 días hábiles)</li>
        <li>Recoja la resolución favorable</li>
      </ol>
      
      <h2>Tiempos y costos</h2>
      <p>El proceso toma entre 30 y 45 días hábiles. El costo es de C$ 500 por solicitud, más C$ 100 por cada certificación adicional.</p>
    `,
    faqs: [
      { question: '¿Cuánto tiempo tarda la anulación del récord policial?', answer: 'El proceso tarda entre 30 y 45 días hábiles desde la presentación de la solicitud.' },
      { question: '¿Puedo solicitar la anulación si tengo un proceso en curso?', answer: 'No. La anulación solo procede cuando el proceso penal ha concluido con sentencia definitiva o archivo.' },
      { question: '¿La anulación elimina el registro permanentemente?', answer: 'Sí. Una vez aprobada, el antecedente penal se elimina de los registros públicos y no aparecerá en futuras consultas.' },
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
      <h2>Destinos imperdibles en Nicaragua</h2>
      
      <h3>1. Isla de Ometepe</h3>
      <p>Formada por dos volcanes en el lago Cocibolca, Ometepe es uno de los destinos más impresionantes de Nicaragua. Ideal para ecoturismo, senderismo y observación de naturaleza.</p>
      <p><strong>Costo promedio:</strong> $30-50 USD por día (alojamiento + comida)</p>
      
      <h3>2. León Viejo</h3>
      <p>Sitio arqueológico declarado Patrimonio de la Humanidad por la UNESCO. Las ruinas de la ciudad colonial original de León ofrecen un viaje al pasado de Nicaragua.</p>
      <p><strong>Entrada:</strong> $5 USD para extranjeros</p>
      
      <h3>3. Corn Island</h3>
      <p>Para los amantes del mar y el buceo, las Islas del Maíz en el Caribe ofrecen playas de arena blanca y arrecifes de coral impresionantes.</p>
      <p><strong>Costo promedio:</strong> $60-80 USD por día</p>
      
      <h3>4. Volcán Masaya</h3>
      <p>Uno de los pocos volcanes activos del mundo donde puedes ver lava en movimiento. El parque nacional ofrece visitas guiadas nocturnas.</p>
      <p><strong>Entrada:</strong> $7 USD para extranjeros</p>
      
      <h3>5. San Juan del Sur</h3>
      <p>Destino de surf favorito en el Pacífico nicaragüense. Con playas para todos los niveles y vibrante vida nocturna.</p>
      <p><strong>Costo promedio:</strong> $40-70 USD por día</p>
      
      <h2>Mejor época para visitar</h2>
      <p>La temporada seca (noviembre a abril) es ideal para visitar, especialmente para actividades al aire libre. La temporada lluviosa (mayo a octubre) ofrece paisajes más verdes y menor afluencia turística.</p>
      
      <h2>Consejos de seguridad</h2>
      <ul>
        <li>Use transporte oficial o servicios de taxi recomendados</li>
        <li>No porte objetos de valor visibles</li>
        <li>Mantenga copias de sus documentos importantes</li>
        <li>Verifique las alertas de actividad volcánica antes de visitar parques</li>
      </ul>
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
    updatedDate: '2026-05-24',
    content: `
      <h2>Historia del béisbol en Nicaragua</h2>
      <p>El béisbol llegó a Nicaragua a finales del siglo XIX y rápidamente se convirtió en el deporte nacional. Desde entonces, ha formado parte de la identidad cultural del país, produciendo jugadores de clase mundial que han destacado en las Grandes Ligas de Estados Unidos.</p>
      
      <h2>Equipos principales</h2>
      
      <h3>Liga de Béisbol Profesional Nacional (LBPN)</h3>
      <ul>
        <li><strong>Indios del Boer</strong> - Managua</li>
        <li><strong>Tigres de Chinandega</strong> - Chinandega</li>
        <li><strong>Leones de León</strong> - León</li>
        <li><strong>Fiera de San Carlos</strong> - San Carlos</li>
        <li><strong>Gigantes de Rivas</strong> - Rivas</li>
      </ul>
      
      <h2>Estadios principales</h2>
      <ul>
        <li><strong>Estadio Denis Martínez</strong> - Managua (capacidad: 15,000)</li>
        <li><strong>Estadio Yamil Ruge</strong> - Chinandega (capacidad: 8,000)</li>
        <li><strong>Estadio Héroes y Mártires</strong> - León (capacidad: 6,000)</li>
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
        <li>Víctor Padilla</li>
        <li>Marlín Salazar</li>
        <li>Jonathan Loáisiga</li>
      </ul>
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
    updatedDate: '2026-05-24',
    content: `
      <h2>Costa Rica</h2>
      
      <h3>Requisitos para entrada</h3>
      <ul>
        <li>Pasaporte vigente (mínimo 6 meses)</li>
        <li>Boleto de retorno</li>
        <li>Prueba de solvencia económica ($500 USD)</li>
        <li>Seguro médico internacional</li>
      </ul>
      
      <h3>Visa de residente</h3>
      <p>Para residencia permanente, necesitas:</p>
      <ul>
        <li>Solicitud en la Dirección General de Migración</li>
        <li>Certificado de antecedentes penales nicaragüenses</li>
        <li>Comprobante de ingresos mensuales ($1,000 USD)</li>
        <li>Certificado médico</li>
      </ul>
      
      <h2>Estados Unidos</h2>
      
      <h3>Visa de turista (B1/B2)</h3>
      <ul>
        <li>Formulario DS-160 completado</li>
        <li>Pasaporte vigente</li>
        <li>Foto reciente</li>
        <li>Comprobante de empleo o ingresos</li>
        <li>Cita en consulado (tiempo de espera: 6-12 meses)</li>
      </ul>
      
      <h3>Visa de trabajador H-2A/H-2B</h3>
      <p>Para trabajo temporal agrícola o no agrícola:</p>
      <ul>
        <li>Oferta de empleo de empleador estadounidense</li>
        <li>Certificación del Departamento de Trabajo</li>
        <li>Petición I-129 aprobada</li>
      </ul>
      
      <h2>España</h2>
      
      <h3>Visa Schengen (turista)</h3>
      <ul>
        <li>Formulario de solicitud</li>
        <li>Pasaporte vigente</li>
        <li>Seguro médico con cobertura €30,000</li>
        <li>Reservas de hotel y vuelo</li>
        <li>Prueba de solvencia (€70 por día)</li>
      </ul>
      
      <h3>Residencia por arraigo</h3>
      <p>Para nicaragüenses ya en España:</p>
      <ul>
        <li>Permanencia continuada de 3 años</li>
        <li>Contrato de trabajo o arraigo social</li>
        <li>Certificado de antecedentes penales</li>
        <li>Pago de tasas (€10-€100 según tipo)</li>
      </ul>
      
      <h2>Documentos necesarios comunes</h2>
      <ul>
        <li>Certificado de nacimiento apostillado</li>
        <li>Certificado de matrimonio (si aplica)</li>
        <li>Antecedentes penales apostillados</li>
        <li>Diplomas académicos (para visas de trabajo)</li>
      </ul>
    `,
    faqs: [
      { question: '¿Cuánto tiempo tarda la visa de turista para EE.UU.?', answer: 'El tiempo de espera para cita en consulado es de 6 a 12 meses. El procesamiento del visa toma 2-4 semanas adicionales.' },
      { question: '¿Puedo trabajar en Costa Rica con visa de turista?', answer: 'No. La visa de turista no permite trabajar. Necesitas una visa de residente o permiso de trabajo específico.' },
      { question: '¿Qué es el arraigo social en España?', answer: 'Es una figura legal que permite regularizar la situación migratoria de extranjeros que demuestran arraigo en España (vínculos familiares, laborales o sociales).' },
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
    updatedDate: '2026-06-17',
    content: `<h2>Salario mínimo en Nicaragua 2026</h2><p>El salario mínimo en Nicaragua para 2026 fue ajustado por el Ministerio del Trabajo (MITRAB) en enero. Los valores varían según el sector económico.</p><h2>Tabla de salarios mínimos 2026</h2><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Sector</th><th style="padding:10px;text-align:right;">Mensual (C$)</th><th style="padding:10px;text-align:right;">Diario (C$)</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Agropecuario</td><td style="padding:10px;text-align:right;">7,185.71</td><td style="padding:10px;text-align:right;">287.43</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Servicios, industria y comercio</td><td style="padding:10px;text-align:right;">8,179.43</td><td style="padding:10px;text-align:right;">327.18</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Construcción, minas y canteras</td><td style="padding:10px;text-align:right;">9,173.15</td><td style="padding:10px;text-align:right;">366.93</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Trabajadores del hogar</td><td style="padding:10px;text-align:right;">5,500.00</td><td style="padding:10px;text-align:right;">220.00</td></tr><tr><td style="padding:10px;">Centrales azucareras (zafra)</td><td style="padding:10px;text-align:right;">9,500.00</td><td style="padding:10px;text-align:right;">380.00</td></tr></tbody></table><p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: valores oficiales MITRAB enero 2026. Tipo de cambio referencia: C$ 36.65 = USD 1.00</em></p><h2>¿Quién define el salario mínimo?</h2><p>El Consejo Nacional del Salario Mínimo, conformado por representantes del gobierno, empresarios y sindicatos, fija los ajustes anuales. El MITRAB publica los valores oficiales en <em>La Gaceta</em>.</p><h2>¿Qué pasa si pagan menos?</h2><p>Pagar por debajo del salario mínimo es infracción laboral sancionable. Denuncie en delegaciones del MITRAB o al 1800-1000-800 (llamada gratuita).</p><h2>Diferencia: salario mínimo vs promedio</h2><p>El salario mínimo es el piso legal. El promedio en sectores formales ronda C$ 12,000-15,000 mensuales. La informalidad laboral representa más del 60% de la población económicamente activa.</p>`,
    faqs: [
      { question: '¿Cuál es el salario mínimo mensual en Nicaragua 2026?', answer: 'Para servicios, industria y comercio es de C$ 8,179.43 mensuales (C$ 327.18 diarios). El sector agropecuario tiene el mínimo más bajo: C$ 7,185.71 mensuales.' },
      { question: '¿Se aplica a trabajadores informales?', answer: 'El salario mínimo solo aplica a relaciones laborales formales. El MITRAB ha intensificado inspecciones en sectores informales.' },
      { question: '¿Cuándo se actualiza?', answer: 'El Consejo Nacional del Salario Mínimo se reúne anualmente, generalmente en diciembre-enero, para fijar los valores del año siguiente.' },
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
    updatedDate: '2026-06-17',
    content: `<h2>Costo de vida en Nicaragua 2026</h2><p>El costo de vida en Nicaragua es uno de los más bajos de Centroamérica, aunque varía significativamente entre Managua y las provincias. Esta guía detalla los gastos mensuales promedio para una persona sola y una familia de 4 miembros.</p><h2>Presupuesto mensual: persona sola</h2><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Rubro</th><th style="padding:10px;text-align:right;">Managua (C$)</th><th style="padding:10px;text-align:right;">Provincia (C$)</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Alquiler (apartamento 1 hab)</td><td style="padding:10px;text-align:right;">8,000 - 15,000</td><td style="padding:10px;text-align:right;">4,000 - 8,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Alimentación</td><td style="padding:10px;text-align:right;">6,000 - 10,000</td><td style="padding:10px;text-align:right;">4,500 - 7,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Transporte (bus + taxi ocasional)</td><td style="padding:10px;text-align:right;">1,500 - 3,000</td><td style="padding:10px;text-align:right;">1,000 - 2,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Servicios (luz, agua, internet)</td><td style="padding:10px;text-align:right;">2,500 - 4,500</td><td style="padding:10px;text-align:right;">1,500 - 3,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Celular</td><td style="padding:10px;text-align:right;">500 - 1,200</td><td style="padding:10px;text-align:right;">500 - 1,000</td></tr><tr style="background:#fef3c7;"><td style="padding:10px;font-weight:700;">TOTAL ESTIMADO</td><td style="padding:10px;text-align:right;font-weight:700;">18,500 - 33,700</td><td style="padding:10px;text-align:right;font-weight:700;">11,500 - 21,000</td></tr></tbody></table><h2>Presupuesto mensual: familia de 4</h2><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Rubro</th><th style="padding:10px;text-align:right;">Managua (C$)</th><th style="padding:10px;text-align:right;">Provincia (C$)</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Alquiler (casa 3 hab)</td><td style="padding:10px;text-align:right;">18,000 - 35,000</td><td style="padding:10px;text-align:right;">8,000 - 18,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Alimentación</td><td style="padding:10px;text-align:right;">18,000 - 28,000</td><td style="padding:10px;text-align:right;">12,000 - 20,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Transporte</td><td style="padding:10px;text-align:right;">4,000 - 7,000</td><td style="padding:10px;text-align:right;">2,500 - 5,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Servicios</td><td style="padding:10px;text-align:right;">4,500 - 8,000</td><td style="padding:10px;text-align:right;">3,000 - 5,500</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Educación (colegio privado)</td><td style="padding:10px;text-align:right;">6,000 - 15,000</td><td style="padding:10px;text-align:right;">3,000 - 8,000</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Salud (seguro privado)</td><td style="padding:10px;text-align:right;">3,000 - 8,000</td><td style="padding:10px;text-align:right;">2,000 - 5,000</td></tr><tr style="background:#fef3c7;"><td style="padding:10px;font-weight:700;">TOTAL ESTIMADO</td><td style="padding:10px;text-align:right;font-weight:700;">53,500 - 101,000</td><td style="padding:10px;text-align:right;font-weight:700;">30,500 - 61,500</td></tr></tbody></table><h2>Comparativa con otros países centroamericanos</h2><p>Nicaragua es aproximadamente 30% más barata que Costa Rica y 20% más barata que Honduras en términos de costo de vida. Los alquileres en Managua son similares a los de Tegucigalpa pero la comida local es más económica.</p><h2>Consejos para reducir gastos</h2><ul><li>Compre en mercados municipales en vez de supermercados (ahorro del 20-40% en frutas y verduras)</li><li>Use buses en lugar de taxis (C$ 10-15 vs C$ 100-300 por viaje)</li><li>Contrate internet + TV en paquete (Tigo, Claro ofrecen descuentos)</li><li>Considere vivir en zonas periféricas de Managua (Ciudad Sandino, Tipitapa) para pagar menos alquiler</li></ul>`,
    faqs: [
      { question: '¿Cuánto necesita ganar una persona sola para vivir bien en Nicaragua?', answer: 'Con C$ 20,000-25,000 mensuales una persona sola puede vivir cómodamente en Managua. En provincias, con C$ 15,000 es suficiente.' },
      { question: '¿Es caro vivir en Managua comparado con otras ciudades?', answer: 'Managua es la ciudad más cara de Nicaragua, pero sigue siendo económica comparada con San José (Costa Rica) o Ciudad de Guatemala.' },
      { question: '¿Cuánto cuesta la canasta básica en Nicaragua 2026?', answer: 'La canasta básica alimentaria para una familia de 4 personas ronda los C$ 12,000-15,000 mensuales según el INSS y el BCN.' },
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
    content: `<h2>Mejores playas de Nicaragua 2026</h2><p>Nicaragua cuenta con más de 300 km de costa en el Pacífico y el Caribe. Desde playas de surf mundial hasta islotes paradisíacos en el Caribe, estas son las mejores opciones para 2026.</p><h2>Top 7 playas de Nicaragua</h2><h3>1. San Juan del Sur</h3><p>La playa más famosa de Nicaragua. Bahía protegida ideal para familias, con vida nocturna y restaurantes. Surf para principiantes.</p><ul><li><strong>Ubicación:</strong> 140 km de Managua (2h 30min por carretera)</li><li><strong>Costo promedio:</strong> $40-80 USD/día (hotel + comida)</li><li><strong>Actividades:</strong> Surf, pesca deportiva, canopy, vida nocturna</li><li><strong>Mejor época:</strong> Diciembre-abril (temporada seca)</li></ul><h3>2. Playa Maderas (cerca de San Juan del Sur)</h3><p>Playas de surf de clase internacional. Olas consistentes para surfistas intermedios y avanzados. Ambiente bohemio.</p><ul><li><strong>Costo:</strong> $25-50 USD/día</li><li><strong>Actividades:</strong> Surf, yoga, trekking</li></ul><h3>3. Corn Island (Islas del Maíz)</h3><p>Caribe nicaragüense con playas de arena blanca y aguas cristalinas. Buceo, snorkel y cultura afrocaribeña.</p><ul><li><strong>Ubicación:</strong> Vuelo desde Managua (1h 20min) o lancha desde Bluefields (6h)</li><li><strong>Costo:</strong> $60-100 USD/día</li><li><strong>Mejor época:</strong> Febrero-mayo (menos lluvia)</li></ul><h3>4. Playa Popoyo</h3><p>Una de las mejores playas de surf de Centroamérica. Olas de tubo para expertos. Poca infraestructura, ambiente rústico.</p><ul><li><strong>Ubicación:</strong> 130 km de Managua, cerca de Tola</li><li><strong>Costo:</strong> $20-40 USD/día</li></ul><h3>5. Las Peñitas (León)</h3><p>Playas tranquilas del Pacífico cercanas a León. Ideal para familias y surf principiante. Atardeceres espectaculares.</p><ul><li><strong>Costo:</strong> $15-30 USD/día</li><li><strong>Distancia desde León:</strong> 20 minutos</li></ul><h3>6. Playa El Coco (San Juan del Sur)</h3><p>Playa familiar con oleaje suave y palmeras. Menos concurrida que la bahía principal. Ideal para niños.</p><ul><li><strong>Costo:</strong> $20-40 USD/día</li></ul><h3>7. Playa La Boquita (Carazo)</h3><p>Playa local frecuentada por familias de Diriamba y Jinotepe. Economía, pescado fresco y ambiente auténtico nicaragüense.</p><ul><li><strong>Costo:</strong> $10-20 USD/día</li><li><strong>Distancia desde Managua:</strong> 1h 15min</li></ul><h2>Comparativa de costos</h2><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Playas</th><th style="padding:10px;text-align:right;">Diario USD</th><th style="padding:10px;text-align:center;">Nivel</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">San Juan del Sur</td><td style="padding:10px;text-align:right;">40 - 80</td><td style="padding:10px;text-align:center;">Turístico</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Corn Island</td><td style="padding:10px;text-align:right;">60 - 100</td><td style="padding:10px;text-align:center;">Turístico</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Popoyo / Maderas</td><td style="padding:10px;text-align:right;">20 - 50</td><td style="padding:10px;text-align:center;">Surf</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Las Peñitas / El Coco</td><td style="padding:10px;text-align:right;">15 - 40</td><td style="padding:10px;text-align:center;">Familiar</td></tr><tr><td style="padding:10px;">La Boquita</td><td style="padding:10px;text-align:right;">10 - 20</td><td style="padding:10px;text-align:center;">Local</td></tr></tbody></table><h2>Seguridad en las playas</h2><ul><li>No deje objetos de valor desatendidos en la playa</li><li>Respete las banderas de seguridad (rojo = peligro, amarillo = precaución)</li><li>En Corn Island, consulte con locales sobre corrientes marinas</li><li>Use protector solar (el sol tropical es intensísimo)</li></ul>`,
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
    updatedDate: '2026-06-17',
    content: `<h2>Tipo de cambio dólar a córdoba Nicaragua 2026</h2><p>El tipo de cambio en Nicaragua es administrado por el Banco Central de Nicaragua (BCN) mediante un sistema de bandas cambiarias. Aunque existe un tipo de cambio oficial, las casas de cambio y bancos aplican spreads diferentes.</p><h2>Tipo de cambio actual (junio 2026)</h2><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Mercado</th><th style="padding:10px;text-align:right;">Compra (C$/USD)</th><th style="padding:10px;text-align:right;">Venta (C$/USD)</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">BCN (referencia)</td><td style="padding:10px;text-align:right;">36.50</td><td style="padding:10px;text-align:right;">36.65</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Bancos comerciales</td><td style="padding:10px;text-align:right;">36.20 - 36.40</td><td style="padding:10px;text-align:right;">36.70 - 36.90</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Casas de cambio</td><td style="padding:10px;text-align:right;">36.00 - 36.30</td><td style="padding:10px;text-align:right;">36.80 - 37.00</td></tr><tr><td style="padding:10px;">Mercado informal</td><td style="padding:10px;text-align:right;">36.00 - 36.20</td><td style="padding:10px;text-align:right;">37.00 - 37.20</td></tr></tbody></table><p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: valores referenciales junio 2026. Los tipos de cambio bancarios varían según la entidad. Consulte directamente con su banco.</em></p><h2>¿Cómo se determina el tipo de cambio en Nicaragua?</h2><p>El BCN establece un tipo de cambio de referencia diario basado en la oferta y demanda de divisas. Las bandas cambiarias permiten fluctuaciones controladas. Nicaragua no tiene una moneda flotante pura; el BCN interviene para mantener estabilidad.</p><h2>Dónde cambiar dólares en Nicaragua</h2><ul><li><strong>Bancos:</strong> Banpro, BAC, Lafise Bancentro. Requieren identificación. Mejores tasas para montos grandes.</li><li><strong>Casas de cambio:</strong> Concentradas en Mercado Oriental y zona bancaria de Managua. Tienen spreads más amplios.</li><li><strong>Envíos de remesas:</strong> Western Union, MoneyGram, Ria. Aplican tipo de cambio corporativo (generalmente menor).</li><li><strong>Tarjetas de crédito:</strong> Los bancos aplican tipo de cambio Visa/Mastercard + comisión del 2-3%.</li></ul><h2>Consejos para obtener mejor tipo de cambio</h2><ul><li>Cambie montos grandes en bancos (mejor tasa por volumen)</li><li>Evite aeropuertos y hoteles (peores tasas)</li><li>Compare al menos 2 bancos antes de cambiar</li><li>Considere usar transferencia bancaria en lugar de efectivo</li></ul><h2>Histórico del tipo de cambio</h2><p>El córdoba se ha depreciado gradualmente frente al dólar. En 2020 el tipo de cambio era C$ 34.50. En 2026 ronda C$ 36.65. Se proyecta que para finales de 2026 podría alcanzar C$ 37.00-37.50.</p>`,
    faqs: [
      { question: '¿A cuánto está el dólar en Nicaragua hoy?', answer: 'El tipo de cambio referencia del BCN es C$ 36.65 por USD 1.00. Los bancos compran entre C$ 36.20-36.40 y venden entre C$ 36.70-36.90.' },
      { question: '¿Dónde es mejor cambiar dólares en Nicaragua?', answer: 'Los bancos (Banpro, BAC, Lafise) ofrecen las mejores tasas para montos grandes. Las casas de cambio son más rápidas pero con spreads mayores.' },
      { question: '¿Se puede usar dólares en Nicaragua?', answer: 'Sí, el dólar es ampliamente aceptado en hoteles, restaurantes turísticos y comercios grandes. Sin embargo, en mercados y transporte público solo se aceptan córdobas.' },
    ],
  },
];

export function getEvergreenBySlug(slug: string): EvergreenArticle | undefined {
  return EVERGREEN_ARTICLES.find((article) => article.slug === slug);
}

export function getAllEvergreen(): EvergreenArticle[] {
  return EVERGREEN_ARTICLES;
}
