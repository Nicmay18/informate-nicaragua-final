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
    `,
    faqs: [
      { question: '¿Cuál es el PIB de Nicaragua en 2026?', answer: 'El PIB nominal estimado de Nicaragua en 2026 ronda los USD 16,000-17,000 millones, con un PIB per cápita de aproximadamente USD 2,400-2,600.' },
      { question: '¿Qué sectores generan más empleo en Nicaragua?', answer: 'La agricultura emplea alrededor del 30% de la población activa. El comercio informal, la construcción y el turismo también son importantes generadores de empleo.' },
      { question: '¿Cuánto representan las remesas en la economía nicaragüense?', answer: 'Las remesas representan más del 15% del PIB de Nicaragua, siendo una de las fuentes de divisas más importantes del país.' },
    ],
  },
];

export function getEvergreenBySlug(slug: string): EvergreenArticle | undefined {
  return EVERGREEN_ARTICLES.find((article) => article.slug === slug);
}

export function getAllEvergreen(): EvergreenArticle[] {
  return EVERGREEN_ARTICLES;
}
