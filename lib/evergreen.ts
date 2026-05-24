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
];

export function getEvergreenBySlug(slug: string): EvergreenArticle | undefined {
  return EVERGREEN_ARTICLES.find((article) => article.slug === slug);
}

export function getAllEvergreen(): EvergreenArticle[] {
  return EVERGREEN_ARTICLES;
}
