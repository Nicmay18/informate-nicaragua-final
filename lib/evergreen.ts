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
    content: `<p>La apostilla es un sello que certifica la autenticidad de documentos públicos nicaragüenses para que sean válidos en países que forman parte de la Convención de La Haya. Este proceso simplifica la legalización de documentos para trámites de migración, empleo, matrimonio o estudios en el extranjero. Nicaragua es miembro de la Convención de La Haya desde 2021, por lo que los documentos apostillados en el país son reconocidos en más de 120 naciones sin necesidad de legalización consular adicional.</p>
      
      <h2>Documentos que se pueden apostillar en Nicaragua</h2>
      <ul>
        <li>Certificados de nacimiento, matrimonio y defunción</li>
        <li>Diplomas, títulos académicos y certificados de estudio</li>
        <li>Certificados de antecedentes penales</li>
        <li>Poderes notariales y actas notariales</li>
        <li>Documentos de la Corte Suprema de Justicia y tribunales</li>
        <li>Documentos de registros públicos y municipales</li>
      </ul>
      <p>Los documentos deben estar vigentes y en buen estado físico. Algunos países de destino exigen que el documento sea reciente, generalmente emitido en los últimos 3 a 6 meses.</p>
      
      <h2>Requisitos para apostillar documentos en 2026</h2>
      <p>Para apostillar un documento en Nicaragua se requiere:</p>
      <ul>
        <li>Documento original o copia certificada por la institución emisora</li>
        <li>Cédula de identidad vigente del solicitante</li>
        <li>Pago de la tasa correspondiente según tipo de documento y servicio</li>
      </ul>
      <p>Los documentos extranjeros no se apostillan en Nicaragua. Deben ser apostillados en el país de origen antes de ser presentados en el país.</p>
      
      <h2>Dónde realizar el trámite</h2>
      <p>La apostilla se realiza en la Cancillería de Nicaragua, dependiente del Ministerio de Relaciones Exteriores, ubicada en Managua. También existen oficinas delegadas en principales ciudades del país. Se recomienda verificar los horarios de atención y disponibilidad del servicio exprés antes de acudir.</p>
      
      <h2>Tiempos de procesamiento</h2>
      <p>El tiempo promedio de procesamiento es de 3 a 5 días hábiles. Para trámites urgentes, el servicio exprés puede entregar el documento en 24 horas con un costo adicional. El tiempo real puede variar según la cantidad de solicitudes y la disponibilidad de la institución.</p>
      
      <h2>Costos actualizados 2026</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Servicio</th><th style="padding:10px;text-align:right;">Costo aproximado</th></tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Apostilla estándar</td><td style="padding:10px;text-align:right;">C$ 200 por documento</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Servicio exprés (24 horas)</td><td style="padding:10px;text-align:right;">C$ 400 por documento</td></tr>
          <tr><td style="padding:10px;">Certificaciones adicionales</td><td style="padding:10px;text-align:right;">C$ 50 cada una</td></tr>
        </tbody>
      </table>
      <p>Los costos pueden cambiar según el tipo de documento y la política institucional. Se recomienda confirmar el monto actual antes de realizar el pago.</p>
      
      <h2>Preguntas frecuentes</h2>
      <h3>¿Se puede apostillar en línea en Nicaragua?</h3>
      <p>No. El trámite debe realizarse de forma presencial en la Cancillería o sus oficinas delegadas.</p>
      <h3>¿Qué países aceptan la apostilla nicaragüense?</h3>
      <p>Los países miembros de la Convención de La Haya, incluyendo España, México, Costa Rica, Chile, Estados Unidos y la mayoría de países de Europa y América Latina.</p>
      <h3>¿Qué pasa si el documento está en inglés?</h3>
      <p>Dependiendo del país de destino, podría requerirse una traducción oficial realizada por un traductor jurado. Verifica los requisitos específicos en la embajada o entidad receptora.</p>
      
      <h2>Fuentes consultadas</h2>
      <p>Información basada en procedimientos del Ministerio de Relaciones Exteriores de Nicaragua y la Convención de La Haya. Los costos y tiempos son referenciales y pueden variar. Se recomienda consultar directamente con la Cancillería antes de iniciar el trámite.</p>
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
    content: `<p>El récord policial, también conocido como antecedentes penales, es un documento que certifica si una persona tiene registros de procesos penales en Nicaragua. Es requerido para trámites de empleo, visas, residencias y otros procedimientos legales. La anulación del récord policial es un trámite administrativo que permite solicitar la eliminación de antecedentes bajo ciertas condiciones legales. A continuación se detallan los requisitos, pasos y costos para solicitar la anulación en 2026.</p>
      
      <h2>Cuándo se puede solicitar la anulación</h2>
      <p>La anulación del récord policial puede solicitarse cuando se cumplen las siguientes condiciones:</p>
      <ul>
        <li>Han transcurrido más de 5 años desde el cumplimiento de la pena principal y accesorias</li>
        <li>El proceso penal fue archivado, sobreseído o terminado de forma definitiva</li>
        <li>Se obtuvo una sentencia absolutoria firme</li>
        <li>El delito fue de menor gravedad y no existe reincidencia</li>
      </ul>
      <p>La solicitud no procede si existe un proceso penal en curso contra el interesado o si la condena fue por delitos graves con restricciones legales específicas.</p>
      
      <h2>Requisitos para solicitar la anulación</h2>
      <ul>
        <li>Solicitud escrita dirigida al Director General de la Policía Nacional</li>
        <li>Cédula de identidad vigente del solicitante</li>
        <li>Certificación de la sentencia judicial o resolución que acredite la situación legal</li>
        <li>Constancia de residencia actualizada</li>
        <li>Comprobante de pago de la tasa administrativa</li>
      </ul>
      
      <h2>Paso a paso del trámite</h2>
      <ol>
        <li>Reúna todos los documentos requeridos y verifique que estén vigentes</li>
        <li>Presente la solicitud en la delegación de la Policía Nacional más cercana a su domicilio</li>
        <li>Pague la tasa correspondiente según la tarifa oficial</li>
        <li>Espere el período de revisión administrativa (30-45 días hábiles)</li>
        <li>Recoja la resolución en la misma delegación donde presentó el trámite</li>
      </ol>
      
      <h2>Tiempos y costos</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Concepto</th><th style="padding:10px;text-align:right;">Valor aproximado</th></tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Tasa por solicitud</td><td style="padding:10px;text-align:right;">C$ 500</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Certificación adicional</td><td style="padding:10px;text-align:right;">C$ 100 cada una</td></tr>
          <tr><td style="padding:10px;">Tiempo de respuesta</td><td style="padding:10px;text-align:right;">30 a 45 días hábiles</td></tr>
        </tbody>
      </table>
      
      <h2>Preguntas frecuentes</h2>
      <h3>¿Cuánto tiempo tarda la anulación del récord policial?</h3>
      <p>El trámite tarda entre 30 y 45 días hábiles desde la presentación completa de la documentación.</p>
      <h3>¿Puedo solicitar la anulación si tengo un proceso penal en curso?</h3>
      <p>No. La anulación solo procede cuando el proceso ha concluido con sentencia firme, archivo o sobreseimiento definitivo.</p>
      <h3>¿La anulación elimina el registro de forma permanente?</h3>
      <p>Sí. Una vez aprobada, el antecedente penal se elimina de los registros consultables y no aparecerá en futuras constancias.</p>
      
      <h2>Fuentes consultadas</h2>
      <p>Información basada en procedimientos administrativos de la Policía Nacional de Nicaragua y disposiciones del Código Procesal Penal. Los costos y tiempos son referenciales. Se recomienda confirmar el monto y requisitos actuales en la delegación correspondiente.</p>
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
    updatedDate: '2026-05-24',
    content: `
      <p>Los nicaragüenses que desean viajar o residir en Costa Rica, Estados Unidos o España deben cumplir requisitos migratorios específicos de cada país. Esta guía resume los trámites más solicitados en 2026, con documentos comunes, costos aproximados y tiempos estimados. Se recomienda verificar la información directamente en los consulados y entidades oficiales, ya que las normas cambian frecuentemente.</p>
      
      <h2>Costa Rica</h2>
      <h3>Requisitos para entrada</h3>
      <ul>
        <li>Pasaporte vigente con mínimo 6 meses de validez</li>
        <li>Boleto de salida del país</li>
        <li>Prueba de solvencia económica para la estadía</li>
        <li>Seguro médico con cobertura internacional</li>
      </ul>
      <h3>Residencia permanente</h3>
      <p>Para solicitar residencia, el interesado debe presentar:</p>
      <ul>
        <li>Solicitud ante la Dirección General de Migración y Extranjería</li>
        <li>Certificado de antecedentes penales de Nicaragua</li>
        <li>Comprobante de ingresos o patrimonio que acredite sostenibilidad</li>
        <li>Certificado médico y de vacunación según requisitos vigentes</li>
      </ul>
      
      <h2>Estados Unidos</h2>
      <h3>Visa de turista (B1/B2)</h3>
      <ul>
        <li>Formulario DS-160 completado</li>
        <li>Pasaporte vigente con validez posterior a la estadía</li>
        <li>Fotografía reciente con especificaciones del consulado</li>
        <li>Comprobante de empleo, ingresos o patrocinio</li>
        <li>Cita para entrevista en el consulado de Managua</li>
      </ul>
      <h3>Visas de trabajo temporal H-2A y H-2B</h3>
      <p>Requieren una oferta de empleo formal de un empleador estadounidense, certificación del Departamento de Trabajo y aprobación de la petición I-129 por parte del USCIS.</p>
      
      <h2>España</h2>
      <h3>Visa Schengen de turismo</h3>
      <ul>
        <li>Formulario de solicitud de visa Schengen</li>
        <li>Pasaporte vigente</li>
        <li>Seguro médico con cobertura mínima de €30,000</li>
        <li>Reservas de alojamiento y vuelo</li>
        <li>Prueba de medios económicos para la estadía</li>
      </ul>
      <h3>Residencia por arraigo</h3>
      <p>El arraigo permite regularizar la situación de extranjeros que acreditan permanencia continuada en España y vínculos laborales, familiares o sociales. Requiere certificado de antecedentes penales y pago de tasas administrativas.</p>
      
      <h2>Documentos comunes para la mayoría de trámites</h2>
      <ul>
        <li>Certificado de nacimiento apostillado</li>
        <li>Certificado de matrimonio o divorcio (si aplica)</li>
        <li>Certificado de antecedentes penales apostillado</li>
        <li>Títulos académicos o certificaciones laborales (para visas de trabajo)</li>
      </ul>
      
      <h2>Tiempos y costos estimados</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Trámite</th><th style="padding:10px;text-align:left;">Tiempo estimado</th><th style="padding:10px;text-align:right;">Costo aproximado</th></tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Visa B1/B2 EE.UU.</td><td style="padding:10px;">6-12 meses para cita + 2-4 semanas procesamiento</td><td style="padding:10px;text-align:right;">USD 185</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Visa Schengen España</td><td style="padding:10px;">15-30 días hábiles</td><td style="padding:10px;text-align:right;">€80</td></tr>
          <tr><td style="padding:10px;">Residencia Costa Rica</td><td style="padding:10px;">3-12 meses según categoría</td><td style="padding:10px;text-align:right;">USD 50-300</td></tr>
        </tbody>
      </table>
      
      <h2>Preguntas frecuentes</h2>
      <h3>¿Puedo trabajar en Costa Rica con visa de turista?</h3>
      <p>No. La visa de turista no autoriza trabajar. Se requiere una visa de residente o permiso de trabajo específico.</p>
      <h3>¿Cuánto tiempo dura la visa de turista para EE.UU.?</h3>
      <p>El tiempo de espera para entrevista consular puede ser de 6 a 12 meses. Una vez aprobada, la visa puede tener validez de hasta 10 años dependiendo del tipo.</p>
      <h3>¿Qué es el arraigo social en España?</h3>
      <p>Es una figura legal que permite regularizar a extranjeros que acreditan tres años de permanencia en España y demuestran arraigo laboral, social o familiar.</p>
      
      <h2>Fuentes consultadas</h2>
      <p>Información basada en requisitos generales de la Dirección General de Migración y Extranjería de Costa Rica, el Departamento de Estado de Estados Unidos y el Ministerio de Asuntos Exteriores de España. Costos y tiempos son referenciales. Verifique siempre los requisitos actuales en el consulado o embajada correspondiente.</p>
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
    content: `
      <p>El salario mínimo en Nicaragua para 2026 fue ajustado por el Ministerio del Trabajo (MITRAB) a partir de enero. Los valores varían según el sector económico y la categoría del trabajador. Esta guía detalla los montos vigentes, la institucionalidad que los fija y los derechos del trabajador.</p>
      
      <h2>Tabla de salarios mínimos 2026</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Sector</th><th style="padding:10px;text-align:right;">Mensual (C$)</th><th style="padding:10px;text-align:right;">Diario (C$)</th></tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Agropecuario</td><td style="padding:10px;text-align:right;">7,185.71</td><td style="padding:10px;text-align:right;">287.43</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Servicios, industria y comercio</td><td style="padding:10px;text-align:right;">8,179.43</td><td style="padding:10px;text-align:right;">327.18</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Construcción, minas y canteras</td><td style="padding:10px;text-align:right;">9,173.15</td><td style="padding:10px;text-align:right;">366.93</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Trabajadores del hogar</td><td style="padding:10px;text-align:right;">5,500.00</td><td style="padding:10px;text-align:right;">220.00</td></tr>
          <tr><td style="padding:10px;">Centrales azucareras (zafra)</td><td style="padding:10px;text-align:right;">9,500.00</td><td style="padding:10px;text-align:right;">380.00</td></tr>
        </tbody>
      </table>
      <p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: valores referenciales basados en ajustes históricos del MITRAB. El tipo de cambio de referencia es aproximadamente C$ 36.65 por USD 1.00. Confirme el valor oficial vigente en La Gaceta o en el MITRAB.</em></p>
      
      <h2>¿Quién define el salario mínimo?</h2>
      <p>El Consejo Nacional del Salario Mínimo, conformado por representantes del gobierno, empresarios y trabajadores, fija los ajustes anuales. El MITRAB es la entidad encargada de publicar los valores oficiales en <em>La Gaceta, Diario Oficial</em> y difundirlos a través de sus canales institucionales.</p>
      
      <h2>¿Qué pasa si un empleador paga menos?</h2>
      <p>Pagar por debajo del salario mínimo constituye una infracción laboral sancionable. El trabajador puede presentar una denuncia en las delegaciones departamentales del MITRAB o a través de la línea gratuita de atención del ministerio. Es recomendable llevar copia del contrato, recibos de pago y cualquier documento que acredite la relación laboral.</p>
      
      <h2>Salario mínimo vs salario promedio</h2>
      <p>El salario mínimo es el piso legal que debe recibir un trabajador formal. En sectores formales, el ingreso promedio puede superar los C$ 12,000 mensuales dependiendo del rubro y la experiencia. Sin embargo, la informalidad laboral sigue siendo elevada en Nicaragua, por lo que muchos trabajadores no están cubiertos por esta normativa.</p>
      
      <h2>Preguntas frecuentes</h2>
      <h3>¿Cuál es el salario mínimo mensual en Nicaragua 2026?</h3>
      <p>Para el sector de servicios, industria y comercio, el salario mínimo mensual es de C$ 8,179.43. El sector agropecuario tiene un mínimo de C$ 7,185.71 mensuales.</p>
      <h3>¿Se aplica el salario mínimo a trabajadores informales?</h3>
      <p>El salario mínimo aplica a relaciones laborales formales. El MITRAB realiza inspecciones para promover el cumplimiento, pero la protección depende de que exista un contrato o relación laboral reconocida.</p>
      <h3>¿Cuándo se actualiza el salario mínimo?</h3>
      <p>El Consejo Nacional del Salario Mínimo se reúne generalmente a finales de año para definir los ajustes que entran en vigencia en enero del año siguiente.</p>
      
      <h2>Fuentes consultadas</h2>
      <p>Información basada en datos del Ministerio del Trabajo (MITRAB), publicaciones en La Gaceta y reportes económicos del Banco Central de Nicaragua. Los montos deben verificarse con el MITRAB para confirmar el valor oficial vigente.</p>
    `,
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
    content: `
      <p>El costo de vida en Nicaragua es considerado uno de los más bajos de Centroamérica, aunque presenta diferencias importantes entre Managua y las provincias. Esta guía detalla un presupuesto mensual estimado para una persona sola y una familia de cuatro miembros, con rangos que dependen del estilo de vida, ubicación y servicios contratados.</p>
      
      <h2>Presupuesto mensual: persona sola</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Rubro</th><th style="padding:10px;text-align:right;">Managua (C$)</th><th style="padding:10px;text-align:right;">Provincia (C$)</th></tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Alquiler (apartamento 1 hab)</td><td style="padding:10px;text-align:right;">8,000 - 15,000</td><td style="padding:10px;text-align:right;">4,000 - 8,000</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Alimentación</td><td style="padding:10px;text-align:right;">6,000 - 10,000</td><td style="padding:10px;text-align:right;">4,500 - 7,000</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Transporte (bus + taxi ocasional)</td><td style="padding:10px;text-align:right;">1,500 - 3,000</td><td style="padding:10px;text-align:right;">1,000 - 2,000</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Servicios (luz, agua, internet)</td><td style="padding:10px;text-align:right;">2,500 - 4,500</td><td style="padding:10px;text-align:right;">1,500 - 3,000</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Celular</td><td style="padding:10px;text-align:right;">500 - 1,200</td><td style="padding:10px;text-align:right;">500 - 1,000</td></tr>
          <tr style="background:#fef3c7;"><td style="padding:10px;font-weight:700;">TOTAL ESTIMADO</td><td style="padding:10px;text-align:right;font-weight:700;">18,500 - 33,700</td><td style="padding:10px;text-align:right;font-weight:700;">11,500 - 21,000</td></tr>
        </tbody>
      </table>
      
      <h2>Presupuesto mensual: familia de 4</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Rubro</th><th style="padding:10px;text-align:right;">Managua (C$)</th><th style="padding:10px;text-align:right;">Provincia (C$)</th></tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Alquiler (casa 3 hab)</td><td style="padding:10px;text-align:right;">18,000 - 35,000</td><td style="padding:10px;text-align:right;">8,000 - 18,000</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Alimentación</td><td style="padding:10px;text-align:right;">18,000 - 28,000</td><td style="padding:10px;text-align:right;">12,000 - 20,000</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Transporte</td><td style="padding:10px;text-align:right;">4,000 - 7,000</td><td style="padding:10px;text-align:right;">2,500 - 5,000</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Servicios</td><td style="padding:10px;text-align:right;">4,500 - 8,000</td><td style="padding:10px;text-align:right;">3,000 - 5,500</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Educación (colegio privado)</td><td style="padding:10px;text-align:right;">6,000 - 15,000</td><td style="padding:10px;text-align:right;">3,000 - 8,000</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Salud (seguro privado)</td><td style="padding:10px;text-align:right;">3,000 - 8,000</td><td style="padding:10px;text-align:right;">2,000 - 5,000</td></tr>
          <tr style="background:#fef3c7;"><td style="padding:10px;font-weight:700;">TOTAL ESTIMADO</td><td style="padding:10px;text-align:right;font-weight:700;">53,500 - 101,000</td><td style="padding:10px;text-align:right;font-weight:700;">30,500 - 61,500</td></tr>
        </tbody>
      </table>
      <p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: los valores son estimaciones basadas en costos habituales reportados por usuarios y fuentes locales. Los montos reales varían según zona, proveedor y hábitos de consumo.</em></p>
      
      <h2>Comparativa con otros países centroamericanos</h2>
      <p>Según índices de costo de vida, Nicaragua suele ubicarse por debajo de Costa Rica, Panamá y Guatemala en gastos de alojamiento y alimentación. Los alquileres en Managua son comparables a los de ciudades como Tegucigalpa, mientras que los productos agrícolas locales tienden a ser más económicos.</p>
      
      <h2>Consejos para reducir gastos</h2>
      <ul>
        <li>Compre frutas y verduras en mercados municipales en lugar de supermercados</li>
        <li>Use buses en lugar de taxis privados para trayectos cotidianos</li>
        <li>Contrate planes combinados de internet y telefonía según el uso real</li>
        <li>Considere zonas aledañas a Managua si busca menores costos de alquiler</li>
      </ul>
      
      <h2>Preguntas frecuentes</h2>
      <h3>¿Cuánto necesita ganar una persona sola para vivir en Managua?</h3>
      <p>Con un ingreso de C$ 20,000 a C$ 25,000 mensuales, una persona sola puede cubrir alquiler modesto, alimentación, transporte y servicios básicos en Managua.</p>
      <h3>¿Es más barato vivir en provincias?</h3>
      <p>Sí. Los alquileres y algunos servicios suelen ser más económicos fuera de Managua, aunque la disponibilidad de empleo formal puede ser menor.</p>
      <h3>¿Cuánto cuesta la canasta básica alimentaria?</h3>
      <p>La canasta básica alimentaria para una familia promedio se estima entre C$ 12,000 y C$ 15,000 mensuales, según informes del INSS y el Banco Central de Nicaragua.</p>
      
      <h2>Fuentes consultadas</h2>
      <p>Información basada en datos del Instituto Nicaragüense de Seguridad Social (INSS), reportes del Banco Central de Nicaragua (BCN) y sondeos de costos de vida locales. Los montos son estimaciones referenciales y deben ajustarse a la realidad particular de cada hogar.</p>
    `,
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
    content: `<h2>Mejores playas de Nicaragua 2026</h2><p>Nicaragua cuenta con casi 300 kilómetros de costa en el Pacífico y más de 450 kilómetros en el Caribe. Este territorio ofrece playas para surfistas, familias, buceadores y viajeros que buscan destinos poco masificados. Esta guía resume las principales playas del país, cómo llegar, costos aproximados y recomendaciones de seguridad.</p><h2>Principales playas del Pacífico nicaragüense</h2><p>La costa del Pacífico concentra la mayoría de destinos accesibles desde Managua y es conocida por sus atardeceres, oleaje para surf y ambiente relajado.</p><ul><li><strong>San Juan del Sur:</strong> Bahía turística con restaurantes, hospedajes, pesca deportiva y actividades acuáticas. Ubicada a unos 140 km de Managua.</li><li><strong>Playa Maderas:</strong> Playa de surf a 15 minutos de San Juan del Sur, con oleaje para distintos niveles y ambiente tranquilo.</li><li><strong>Playa Popoyo:</strong> Reconocida por sus olas de tubo, es una de las playas favoritas de surfistas experimentados. Se encuentra cerca de Tola, a unos 130 km de Managua.</li><li><strong>Las Peñitas (León):</strong> Playa cercana a la ciudad de León, ideal para familias y surfistas principiantes.</li><li><strong>Playa El Coco:</strong> Playa familiar a pocos minutos de San Juan del Sur, con oleaje suave y poco concurrida.</li><li><strong>Playa La Boquita (Carazo):</strong> Frecuentada por familias locales, ofrece pescado fresco y ambiente auténtico a poco más de una hora de Managua.</li></ul><h2>Playas del Caribe nicaragüense</h2><p>El Caribe de Nicaragua, con menor desarrollo turístico, destaca por aguas cristalinas, arrecifes y cultura afrocaribeña.</p><ul><li><strong>Corn Island:</strong> Archipiélago con playas de arena blanca, buceo, snorkel y gastronomía caribeña. Se accede por vuelo desde Managua o lancha desde Bluefields.</li><li><strong>Little Corn Island:</strong> Isla pequeña sin vehículos, ideal para desconectar. Requiere lancha desde Corn Island.</li></ul><h2>Comparativa de costos estimados por día</h2><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Destino</th><th style="padding:10px;text-align:right;">Diario USD (aprox.)</th><th style="padding:10px;text-align:center;">Perfil</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">San Juan del Sur</td><td style="padding:10px;text-align:right;">40 - 80</td><td style="padding:10px;text-align:center;">Turístico</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Corn Island</td><td style="padding:10px;text-align:right;">60 - 100</td><td style="padding:10px;text-align:center;">Turístico / Caribe</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Popoyo / Maderas</td><td style="padding:10px;text-align:right;">20 - 50</td><td style="padding:10px;text-align:center;">Surf</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Las Peñitas / El Coco</td><td style="padding:10px;text-align:right;">15 - 40</td><td style="padding:10px;text-align:center;">Familiar</td></tr><tr><td style="padding:10px;">La Boquita</td><td style="padding:10px;text-align:right;">10 - 20</td><td style="padding:10px;text-align:center;">Local</td></tr></tbody></table><p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: los costos son estimaciones referenciales que incluyen alimentación básica, transporte local y hospedaje económico. Los precios varían según temporada y tipo de servicio.</em></p><h2>Recomendaciones de seguridad</h2><ul><li>No deje objetos de valor desatendidos en la playa.</li><li>Respete las señales de banderas de seguridad: rojo indica peligro y amarillo precaución.</li><li>Consulte a locales sobre corrientes marinas antes de nadar, especialmente en el Caribe.</li><li>Use protector solar, sombrero y hidratación constante por el clima tropical.</li></ul><h2>Preguntas frecuentes</h2><h3>¿Cuál es la mejor playa para surf en Nicaragua?</h3><p>Playa Popoyo y Playa Maderas son las más reconocidas por sus condiciones de surf. Popoyo es ideal para surfistas experimentados, mientras que Maderas ofrece olas para diferentes niveles.</p><h3>¿Cómo llegar a Corn Island?</h3><p>Se puede llegar en vuelo desde Managua (aproximadamente 1h 20min) o en lancha desde Bluefields (aproximadamente 6 horas).</p><h3>¿Cuándo es la mejor época para visitar las playas?</h3><p>La temporada de noviembre a abril es la más seca y soleada, ideal para la costa del Pacífico. Para el Caribe, los meses de febrero a mayo suelen tener menos lluvia.</p><h2>Fuentes consultadas</h2><p>Información basada en datos del Instituto Nicaragüense de Turismo (INTUR), reportes de operadores turísticos locales y guías de viaje reconocidas. Los costos son estimaciones referenciales y pueden variar según temporada.</p>`,faqs: [
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
    content: `<h2>Tipo de cambio dólar a córdoba Nicaragua 2026</h2><p>El tipo de cambio en Nicaragua es administrado por el Banco Central de Nicaragua (BCN), que publica diariamente un tipo de cambio de referencia. Bancos, casas de cambio y otros agentes aplican spreads sobre esa referencia. Esta guía explica cómo funciona el mercado cambiario, dónde cambiar divisas y qué factores afectan el precio del dólar.</p><h2>Tipo de cambio de referencia 2026</h2><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background:var(--primary);color:#fff;"><th style="padding:10px;text-align:left;">Mercado</th><th style="padding:10px;text-align:right;">Compra (C$/USD)</th><th style="padding:10px;text-align:right;">Venta (C$/USD)</th></tr></thead><tbody><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">BCN (referencia)</td><td style="padding:10px;text-align:right;">36.50</td><td style="padding:10px;text-align:right;">36.65</td></tr><tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb;"><td style="padding:10px;">Bancos comerciales</td><td style="padding:10px;text-align:right;">36.20 - 36.40</td><td style="padding:10px;text-align:right;">36.70 - 36.90</td></tr><tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px;">Casas de cambio</td><td style="padding:10px;text-align:right;">36.00 - 36.30</td><td style="padding:10px;text-align:right;">36.80 - 37.00</td></tr><tr><td style="padding:10px;">Mercado informal</td><td style="padding:10px;text-align:right;">36.00 - 36.20</td><td style="padding:10px;text-align:right;">37.00 - 37.20</td></tr></tbody></table><p style="font-size:0.9rem;color:var(--gray-500);"><em>Nota: valores referenciales basados en información del BCN y el mercado cambiario local. Los tipos de cambio bancarios varían según la entidad. Verifique con su banco.</em></p><h2>¿Cómo se determina el tipo de cambio en Nicaragua?</h2><p>El BCN establece un tipo de cambio de referencia diario basado en la oferta y demanda de divisas. El sistema de bandas cambiarias permite fluctuaciones controladas dentro de un rango. Nicaragua no tiene una moneda de libre flotación; el BCN interviene para mantener la estabilidad cambiaria.</p><h2>Dónde cambiar dólares en Nicaragua</h2><ul><li><strong>Bancos comerciales:</strong> Entidades como Banpro, BAC y Lafise Bancentro ofrecen tasas competitivas para montos grandes. Requieren identificación.</li><li><strong>Casas de cambio:</strong> Concentradas en la zona bancaria de Managua y el Mercado Oriental. Operan con mayor flexibilidad de horarios pero con spreads más amplios.</li><li><strong>Remesas:</strong> Servicios como Western Union, MoneyGram y Ria aplican un tipo de cambio corporativo, generalmente menor que el bancario.</li><li><strong>Tarjetas de crédito y débito:</strong> Los bancos aplican el tipo de cambio de las redes Visa o Mastercard más una comisión internacional.</li></ul><h2>Consejos para obtener mejor tipo de cambio</h2><ul><li>Cambie montos grandes en bancos para obtener mejores tasas.</li><li>Evite cambiar en aeropuertos y hoteles, donde los spreads suelen ser más altos.</li><li>Compare tasas entre al menos dos bancos o casas de cambio.</li><li>Considere transferencias bancarias para montos elevados en lugar de efectivo.</li></ul><h2>Histórico y tendencias</h2><p>El córdoba se ha depreciado de manera gradual frente al dólar durante la última década. En 2020 el tipo de cambio de referencia era cercano a C$ 34.50 por dólar; en 2026 ronda C$ 36.65. Las proyecciones indican que podría continuar una depreciación moderada, sujeta a la política del BCN y las condiciones macroeconómicas.</p><h2>Preguntas frecuentes</h2><h3>¿A cuánto está el dólar en Nicaragua hoy?</h3><p>El tipo de cambio de referencia del BCN es aproximadamente C$ 36.65 por USD 1.00. Los bancos compran entre C$ 36.20-36.40 y venden entre C$ 36.70-36.90.</p><h3>¿Dónde es mejor cambiar dólares en Nicaragua?</h3><p>Los bancos comerciales suelen ofrecer mejores tasas para montos grandes. Las casas de cambio son más ágiles pero con spreads mayores.</p><h3>¿Se puede usar dólares en Nicaragua?</h3><p>Sí, el dólar es ampliamente aceptado en hoteles, restaurantes turísticos y comercios grandes. En mercados, transporte público y negocios pequeños se prefiere el córdoba.</p><h2>Fuentes consultadas</h2><p>Información basada en datos del Banco Central de Nicaragua (BCN), reportes del Fondo Monetario Internacional (FMI) y prácticas del mercado cambiario local. Los tipos de cambio comerciales varían; consulte directamente a su banco o casa de cambio.</p>`,
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
];

export function getEvergreenBySlug(slug: string): EvergreenArticle | undefined {
  return EVERGREEN_ARTICLES.find((article) => article.slug === slug);
}

export function getAllEvergreen(): EvergreenArticle[] {
  return EVERGREEN_ARTICLES;
}
