import type { NoticiaInput } from '@/lib/meni';

/** Casos sintéticos del harness de autopsia. No son noticias verificadas.
 * Fecha fija: el reloj de los tests debe fijarse al mismo instante. */
export const evaluationDate = '2026-11-04T12:00:00.000Z';
export function article(titulo: string, contenido: string, categoria = 'Sucesos', fuenteOriginal?: string): NoticiaInput {
  return {
    titulo, contenido, categoria, fuenteOriginal, resumen: titulo,
    autor: 'Redacción INFORMATE NICARAGUA', fecha: evaluationDate,
    slug: 'fixture-editorial', keywords: ['nicaragua'],
  };
}

export const policeSource = 'La Policía Nacional informó que un hombre de 34 años murió la madrugada de hoy tras un accidente de tránsito en el kilómetro 14 de la Carretera Norte, en Managua. La víctima conducía una motocicleta que colisionó contra un vehículo pesado. El conductor del camión permanece en el lugar. Las investigaciones continúan.';
export const police = article(
  'Hombre muere en accidente de tránsito en Carretera Norte',
  '<p>Un hombre de 34 años murió la madrugada de este lunes tras un accidente de tránsito en el kilómetro 14 de la Carretera Norte, en Managua, informó la Policía Nacional.</p><p>Según el parte policial, la víctima conducía una motocicleta que colisionó contra un vehículo pesado. El conductor del camión permaneció en el lugar del siniestro.</p><p>Las autoridades señalaron que las investigaciones continúan para determinar las causas del accidente. La policía no informó el nombre de la víctima ni el estado del otro conductor.</p>',
  'Sucesos', policeSource,
);
police.resumen = 'La Policía Nacional confirmó la muerte de un motociclista de 34 años tras chocar contra un vehículo pesado la madrugada de este lunes en Managua.';

export const contradictorySport = article(
  'Diriangén golea 5-0 a Real Estelí y sigue invicto',
  '<p>Diriangén derrotó este domingo a Real Estelí por marcador de 5-0 en el Estadio Cacique Diriangén, aunque el acta oficial registra que el partido terminó 0-2 a favor de Estelí.</p><p>Los goles de Diriangén los anotó Juan Pérez, quien en realidad juega para Real Estelí, según la alineación oficial del encuentro.</p><p>El entrenador de Diriangén celebró la victoria que lo deja líder, aunque la tabla oficial muestra a Real Estelí en la primera posición con 27 puntos.</p>', 'Deportes',
);
contradictorySport.resumen = 'Diriangén venció 5-0 a Real Estelí, aunque perdió el partido según el marcador oficial.';

export const limited = article(
  'Policía captura a sospechoso de robo en León',
  '<p>La Policía Nacional capturó a un hombre de 27 años por su presunta participación en un robo a mano armada ocurrido en el centro de la ciudad de León, informó la institución.</p><p>Según el parte policial, el detenido fue capturado tras una denuncia ciudadana y el caso ya fue presentado a la Fiscalía.</p><p>La Policía no especificó el monto del robo, la identidad de la víctima ni la fecha exacta del hecho.</p>', 'Sucesos',
  'Policía Nacional informa captura de un sujeto de 27 años por su presunta participación en robo a mano armada ocurrido en el centro de la ciudad de León. El caso fue presentado a la Fiscalía.',
);
limited.resumen = 'El detenido es investigado por su presunta participación en un robo a mano armada en el centro de León.';
export const filler = '<p>Cabe mencionar que los robos son delitos que ocurren en muchos lugares del mundo y han afectado a personas desde tiempos inmemoriales. La seguridad ciudadana es un tema muy importante para todos los nicaragüenses y las autoridades siempre trabajan por el bienestar de la población en general.</p><p>Es importante recordar que los ciudadanos deben estar atentos y reportar cualquier actividad sospechosa a las autoridades correspondientes. La colaboración entre la policía y la ciudadanía es fundamental para mantener el orden y la paz social en el país.</p>';

export const empirical: Record<string, NoticiaInput> = {
  sucesos_policial: police,
  nacionales_comunicado: {
    ...article('MINSA inicia jornada de vacunación antirrábica en Managua',
      '<p>El Ministerio de Salud (MINSA) anunció que del 10 al 20 de este mes se desarrollará la jornada nacional de vacunación antirrábica canina en Managua.</p><p>Según el comunicado oficial, brigadas de salud recorrerán los barrios de la capital para aplicar la vacuna de forma gratuita a perros y gatos.</p><p>La vacuna antirrábica protege a las mascotas de la rabia, una enfermedad mortal que puede transmitirse a las personas por mordeduras.</p>', 'Nacionales',
      'El Ministerio de Salud (MINSA) informa a la población que del 10 al 20 de este mes se desarrollará la jornada nacional de vacunación antirrábica canina en Managua. Brigadas recorrerán los barrios de la capital.'),
    resumen: 'El Ministerio de Salud anunció una jornada de vacunación antirrábica que se desarrollará en los próximos días en Managua.',
  },
  deportes_resultado: {
    ...article('Real Estelí vence 2-1 a Diriangén y se mantiene líder',
      '<p>Real Estelí derrotó 2-1 a Diriangén la noche de este domingo en el Estadio Independencia, en el marco de la jornada 12 del torneo de apertura de la Liga Primera.</p><p>Los goles del Tren del Norte fueron de Juan Pérez al minuto 34 y de Manuel Gómez al 78. Por Diriangén descontó Carlos Rodríguez al 85.</p><p>"Sabíamos que iba a ser un partido difícil. El grupo respondió con carácter", declaró el entrenador de Real Estelí al finalizar el compromiso.</p><p>Con la victoria, Real Estelí suma 27 puntos y se mantiene líder del campeonato. Diriangén se queda con 18 unidades en la cuarta posición.</p>', 'Deportes'),
    resumen: 'Real Estelí derrotó 2-1 a Diriangén en el Estadio Independencia y continúa en la cima del torneo de apertura.',
  },
  internacional_agencia: {
    ...article('Banco Central Europeo mantiene tasas de interés en 2%',
      '<p>El Banco Central Europeo (BCE) decidió este jueves mantener su tasa de interés de referencia en 2%, según informó la agencia Reuters.</p><p>La decisión estaba en línea con lo esperado por los analistas, en un contexto de inflación estable en la zona euro.</p><p>La medida afecta los créditos en los países que usan el euro. Para Nicaragua, su impacto es indirecto: influye en el tipo de cambio global y en los flujos de remesas desde Europa.</p>', 'Internacionales',
      'FRANKFURT (Reuters) - The European Central Bank kept its key interest rate at 2% on Thursday, as widely expected, amid stable inflation in the euro zone.'),
    resumen: 'El BCE decidió mantener su tasa de referencia en 2%, en línea con lo esperado por los analistas.',
  },
  provisionales: {
    ...article('Preliminar: 12 personas evacuadas por inundaciones en Chinandega',
      '<p>Unas 12 personas fueron evacuadas de forma preliminar en el municipio de El Viejo, Chinandega, debido a las inundaciones provocadas por las lluvias, reportó el SINAPRED.</p><p>El organismo precisó que las cifras son provisionales y podrían incrementarse conforme avancen las evaluaciones de daños en la zona.</p><p>El comisionado de SINAPRED indicó que los evacuados fueron trasladados a un albergue habilitado en la iglesia local. No se reportaron víctimas hasta el momento.</p>', 'Nacionales'),
    resumen: 'Autoridades reportan cifras preliminares de evacuados por las lluvias en Chinandega; los datos podrían cambiar.',
  },
  sin_citas: {
    ...article('Inauguran puente vehicular en la carretera a Masaya',
      '<p>Las autoridades inauguraron este martes un puente vehicular en la carretera a Masaya, en el municipio de Masatepe, informó la Alcaldía local.</p><p>Según la municipalidad, la obra beneficiará a unos 15 mil habitantes que antes debían rodear la zona durante la época lluviosa.</p><p>La inversión fue de 2.3 millones de córdobas, financiados con fondos del municipio. La construcción duró cinco meses.</p>', 'Nacionales'),
    resumen: 'Las autoridades inauguraron un puente que beneficiará a unos 15 mil habitantes del municipio de Masatepe.',
  },
  temporal: {
    ...article('Bomberos controlan incendio en mercado de Estelí',
      '<p>Bomberos controlaron en la madrugada de este lunes un incendio que se registró la noche del domingo en un sector del mercado municipal de Estelí, informó el Benemérito Cuerpo de Bomberos.</p><p>Según el reporte, el siniestro afectó seis tramos comerciales. No se reportaron personas lesionadas hasta el momento.</p><p>Las autoridades indicaron que la causa del incendio se encuentra bajo investigación y que este lunes se evaluarán los daños.</p>'),
    resumen: 'El incendio se registró la noche del domingo y fue controlado en la madrugada de este lunes; la causa se investiga.',
  },
  contexto_limitado: limited,
  titular_atractivo: {
    ...article('El café se dispara: su precio internacional sube 40% y afectará al bolsillo',
      '<p>El precio internacional del café subió 40% en lo que va del año, alcanzando 280 dólares por quintal, según datos de la bolsa de Nueva York citados por el Consejo Nicaragüense del Café.</p><p>Para los productores nacionales la alza representa un ingreso mayor por la cosecha que inicia en octubre. Pero para los consumidores podría traducirse en un encarecimiento del café en el mercado local.</p><p>Especialistas atribuyen el aumento a la sequía en Brasil y la menor cosecha en Vietnam, los dos mayores productores mundiales.</p>', 'Economía'),
    resumen: 'El precio internacional del café alcanzó su mayor nivel del año, con efectos para productores y consumidores.',
  },
  errores_factuales: contradictorySport,
  relleno: { ...limited, contenido: limited.contenido + filler },
};

/** Extractos del material que aportó el propietario. No completamos hechos,
 * atribuciones ni originales ausentes. Sirven para preservar precisión en
 * correcciones; no para certificar la verdad externa de estos sucesos. */
export const historical = [
  ['Río Escondido', 'Accidente de panga en la ruta Bluefields–Ciudad El Rama, Costa Caribe Sur. Yureilin García, seis años. Eydin López, aproximadamente 22 años. Dos fallecidos. Una menor desaparecida en el material inicial.'],
  ['Presupuesto General 2027', 'Banco Central de Nicaragua. Ovidio Reyes. C$33,023 millones para Salud. C$20,248 millones para Educación. Presupuesto General 2027.'],
  ['Eveling Ortega vs. Alma Meraz', 'Eveling «La Colocha» Ortega contra Alma «La Leona» Meraz. Título interino minimosca de la AMB, 108 libras. 30 de octubre de 2026. Centro de Convenciones Olof Palme, Managua. Decisión mayoritaria.'],
  ['Operación Dignidad Nacional', 'Playa Salamina. Villa El Carmen. Fuerza Naval. Policía Nacional. Aproximadamente 500 paquetes sospechosos. Tres barriles de gasolina. Embarcación roja.'],
  ['Nota de Prensa 007-2026', 'Rafael Antonio Valdez García. Jinotega. Liberia, Costa Rica. Jasmina López Castro. Valeska Valdez López, nueve años.'],
  ['Venta de pólvora', 'Periodo del 15 de noviembre de 2026 al 10 de enero de 2027. Plan de Uso Responsable de la Pólvora Festiva. Acreditación y capacitación de comerciantes. Asignación de puestos. Inspecciones. Supervisión de menores. Recomendaciones de seguridad.'],
] as const;
