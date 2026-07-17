/**
 * Test fixtures parte 2 — Internacionales, Deportes, Tecnología, Clima, Salud, Espectáculos
 */

import type { TestFixture } from './fixtures';

// ───────────────────────────────────────────────
// INTERNACIONALES — 20 casos
// ───────────────────────────────────────────────

export const internacionalesFixtures: TestFixture[] = [
  {
    nombre: 'int-01-cumbre-onu',
    noticia: {
      titulo: 'Asamblea General de la ONU debate cambio climático',
      contenido: '<p>La Asamblea General de la ONU debatió el cambio climático en su sesión anual. Según el secretario general, 150 países presentaron compromisos para reducir emisiones.</p><p>Los países de Centroamérica solicitaron mayor financiamiento para adaptación. La reunión concluyó con una declaración conjunta.</p><p>Analistas internacionales indicaron que los compromisos aún son insuficientes.</p>',
      resumen: 'ONU debate cambio climático. 150 países presentan compromisos para reducir emisiones.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-15', slug: 'onu-cambio-climatico',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Cumbre con ONU, secretario general, cifras y analistas',
  },
  {
    nombre: 'int-02-elecciones-eeuu',
    noticia: {
      titulo: 'Estados Unidos define candidaturas presidenciales para 2026',
      contenido: '<p>Estados Unidos definió las candidaturas presidenciales para las elecciones de 2026. Según sondeos, la carrera es ajustada entre los dos partidos principales.</p><p>El candidato del partido demócrata indicó que enfocará su campaña en economía y salud. El candidato republicano priorizará seguridad e inmigración.</p><p>Analistas señalaron que el resultado afectará las relaciones con Centroamérica.</p>',
      resumen: 'EEUU define candidaturas presidenciales 2026. Carrera ajustada entre demócratas y republicanos.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-14', slug: 'eeuu-elecciones-2026',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Elecciones con candidatos, sondeos y analistas',
  },
  {
    nombre: 'int-03-acuerdo-paris',
    noticia: {
      titulo: 'Cumbre de París alcanza acuerdo sobre reducción de carbono',
      contenido: '<p>La Cumbre de París alcanzó un acuerdo para reducir las emisiones de carbono en 40% para 2035. Según los organizadores, 180 países suscribieron el pacto.</p><p>El presidente de Francia indicó que es el acuerdo más ambicioso de la década. Los fondos para países en desarrollo alcanzarán los 100,000 millones de dólares.</p><p>Los expertos indicaron que la implementación será el mayor desafío.</p>',
      resumen: 'Cumbre de París: 180 países acuerdan reducir carbono 40% para 2035.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-13', slug: 'cumbre-paris-carbono',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Acuerdo con presidente, cifras y expertos',
  },
  {
    nombre: 'int-04-mercosur',
    noticia: {
      titulo: 'Mercosur y Unión Europea avanzan en tratado comercial',
      contenido: '<p>El Mercosur y la Unión Europea avanzaron en las negociaciones del tratado comercial tras 20 años de diálogos. Según los negociadores, se resolvió el 90% de los puntos pendientes.</p><p>El canciller de Brasil indicó que el tratado beneficiará a 700 millones de personas. La firma está prevista para diciembre.</p><p>Los sectores agrícolas de ambos bloques expresaron preocupación por la competencia.</p>',
      resumen: 'Mercosur y UE avanzan en tratado comercial. 90% de puntos resueltos. Firma en diciembre.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-12', slug: 'mercosur-ue-tratado',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Tratado con canciller, cifras y sectores',
  },
  {
    nombre: 'int-05-migracion-venezuela',
    noticia: {
      titulo: 'ONU reporta 6 millones de migrantes venezolanos en el mundo',
      contenido: '<p>La ONU reportó que 6 millones de venezolanos han migrado en los últimos años. Según el ACNUR, la mayoría se encuentra en Colombia, Perú y Ecuador.</p><p>El representante del ACNUR indicó que la crisis humanitaria requiere C$2,000 millones en ayuda. Se han establecido campos de refugiados en países fronterizos.</p><p>Los gobiernos de la región solicitaron mayor cooperación internacional.</p>',
      resumen: 'ONU reporta 6 millones de migrantes venezolanos. Mayoría en Colombia, Perú y Ecuador.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-11', slug: 'migracion-venezuela-onu',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Migración con ONU, ACNUR, cifras y gobiernos',
  },
  {
    nombre: 'int-06-guerra-ucrania',
    noticia: {
      titulo: 'Ucrania y Rusia inician conversaciones de paz en Ginebra',
      contenido: '<p>Ucrania y Rusia iniciaron conversaciones de paz en Ginebra bajo mediación de la ONU. Según los mediadores, la primera ronda se centró en el cese al fuego.</p><p>El secretario general de la ONU indicó que es el primer avance diplomático en dos años. Se programó una segunda ronda para agosto.</p><p>Los analistas indicaron que el camino será largo pero es un paso necesario.</p>',
      resumen: 'Ucrania y Rusia inician conversaciones de paz en Ginebra. Primer avance diplomático en dos años.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-10', slug: 'ucrania-rusia-paz-ginebra',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Paz con ONU, secretario general, mediadores y analistas',
  },
  {
    nombre: 'int-07-china-tecnologia',
    noticia: {
      titulo: 'China presenta nuevo chip de inteligencia artificial',
      contenido: '<p>China presentó un nuevo chip de inteligencia artificial que duplica la velocidad de procesamiento. Según el fabricante, el chip será producido a escala industrial en 2026.</p><p>El ministro de tecnología de China indicó que el país busca liderar la industria de IA. La inversión en desarrollo supera los 50,000 millones de dólares.</p><p>Analistas indicaron que la presentación aumenta la tensión tecnológica con Estados Unidos.</p>',
      resumen: 'China presenta chip de IA que duplica velocidad. Producción industrial en 2026.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-09', slug: 'china-chip-ia',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Tecnología con ministro, cifras y analistas',
  },
  {
    nombre: 'int-08-argentina-economia',
    noticia: {
      titulo: 'Argentina reporta inflación del 3.2% en junio, la más baja en tres años',
      contenido: '<p>Argentina reportó una inflación del 3.2% en junio, la más baja en tres años. Según el ministerio de Economía, la tendencia confirma la desaceleración.</p><p>El ministro indicó que la meta es llegar al 1% mensual para fin de año. El peso argentino se estabilizó frente al dólar.</p><p>Los analistas señalaron que es un buen indicador pero los efectos tardan en llegar al consumidor.</p>',
      resumen: 'Argentina: inflación 3.2% en junio, la más baja en tres años. Meta: 1% mensual.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-08', slug: 'argentina-inflacion-junio',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Economía con ministro, cifras y analistas',
  },
  {
    nombre: 'int-09-brasil-amazonas',
    noticia: {
      titulo: 'Brasil reduce deforestación del Amazonas en 30%',
      contenido: '<p>Brasil redujo la deforestación del Amazonas en 30% en los últimos 12 meses. Según el Instituto Nacional de Investigaciones Espaciales, se preservaron 8,000 km² de bosque.</p><p>El presidente de Brasil indicó que la meta es llegar a deforestación cero para 2030. Se han implementado operativos contra la tala ilegal.</p><p>Los ambientalistas indicaron que los resultados son alentadores pero requieren sostenibilidad.</p>',
      resumen: 'Brasil reduce deforestación del Amazonas 30%. 8,000 km² preservados.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-07', slug: 'brasil-amazonas-deforestacion',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Amazonas con presidente, instituto, cifras y ambientalistas',
  },
  {
    nombre: 'int-10-japon-terremoto',
    noticia: {
      titulo: 'Japón registra terremoto de magnitud 6.5 sin víctimas',
      contenido: '<p>Japón registró un terremoto de magnitud 6.5 en la región de Osaka. Según la agencia meteorológica, no se reportaron víctimas ni daños mayores.</p><p>El gobierno japonés indicó que las estructuras sismorresistentes funcionaron correctamente. Se emitió una alerta de tsunami que fue retirada una hora después.</p><p>Los habitantes indicaron que el sismo fue sentido con fuerza pero sin consecuencias.</p>',
      resumen: 'Terremoto 6.5 en Osaka, Japón. Sin víctimas ni daños. Alerta de tsunami retirada.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-06', slug: 'japon-terremoto-osaka',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Terremoto con agencia, gobierno, cifras e habitantes',
  },
  {
    nombre: 'int-11-cumbre-g20',
    noticia: {
      titulo: 'G20 acuerda reestructurar deuda de países en desarrollo',
      contenido: '<p>El G20 acordó reestructurar la deuda de 70 países en desarrollo. Según el comunicado, se reestructurarán C$100,000 millones en deudas.</p><p>El presidente del G20 indicó que la medida busca evitar crisis financieras. Los países beneficiarios tendrán un período de gracia de 5 años.</p><p>Los economistas indicaron que es un paso importante para la estabilidad global.</p>',
      resumen: 'G20 acuerda reestructurar deuda de 70 países. C$100,000 millones en reestructuración.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-05', slug: 'g20-deuda-paises',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'G20 con presidente, cifras y economistas',
  },
  {
    nombre: 'int-12-mexico-frontera',
    noticia: {
      titulo: 'México y Guatemala refuerzan cooperación fronteriza',
      contenido: '<p>México y Guatemala reforzaron la cooperación fronteriza para regular el flujo migratorio. Según los cancilleres, se implementarán controles conjuntos.</p><p>El canciller mexicano indicó que se invertirán 50 millones de dólares en infraestructura fronteriza. Se crearán dos centros de atención migratoria.</p><p>Las organizaciones de derechos humanos indicaron que la medida debe proteger a los migrantes.</p>',
      resumen: 'México y Guatemala refuerzan cooperación fronteriza. $50 millones en infraestructura.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-04', slug: 'mexico-guatemala-frontera',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Frontera con cancilleres, cifras y ONG',
  },
  {
    nombre: 'int-13-europa-gas',
    noticia: {
      titulo: 'Europa reduce dependencia del gas ruso al 15%',
      contenido: '<p>Europa redujo su dependencia del gas ruso al 15% según la Comisión Europea. Hace dos años, la dependencia era del 40%.</p><p>La comisaria de energía indicó que la diversificación incluye gas natural licuado de Estados Unidos y Qatar. Se invertirán 50,000 millones de euros en energías renovables.</p><p>Los analistas indicaron que la transición energética aceleró la independencia.</p>',
      resumen: 'Europa reduce dependencia gas ruso al 15% (era 40%). Diversificación con EU y Qatar.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-03', slug: 'europa-gas-ruso',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Gas con comisaria, cifras y analistas',
  },
  {
    nombre: 'int-14-corea-dialogo',
    noticia: {
      titulo: 'Coreas retoman diálogo tras dos años de tensión',
      contenido: '<p>Las dos Coreas retomaron el diálogo diplomático tras dos años de tensión. Según los mediadores, las conversaciones se realizan en Panmunjom.</p><p>El mediador principal indicó que los temas incluyen reunificación familiar y cooperación económica. Se programaron reuniones mensuales.</p><p>Los analistas indicaron que es un avance significativo pero cauteloso.</p>',
      resumen: 'Coreas retoman diálogo diplomático tras dos años. Conversaciones en Panmunjom.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-02', slug: 'coreas-dialogo',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Diálogo con mediadores, temas y analistas',
  },
  {
    nombre: 'int-15-india-economia',
    noticia: {
      titulo: 'India supera a Japón como cuarta economía mundial',
      contenido: '<p>India superó a Japón como la cuarta economía mundial según el FMI. El PIB indio alcanzó los 3.7 billones de dólares.</p><p>El ministro de finanzas de India indicó que el crecimiento se debe al sector servicios y manufactura. La proyección es de 7% para 2026.</p><p>Los economistas indicaron que India podría superar a Alemania en tres años.</p>',
      resumen: 'India supera a Japón como cuarta economía. PIB de 3.7 billones de dólares.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-07-01', slug: 'india-cuarta-economia',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Economía con FMI, ministro, cifras y economistas',
  },
  {
    nombre: 'int-16-africa-sequia',
    noticia: {
      titulo: 'Cuerno de África enfrenta peor sequía en 40 años',
      contenido: '<p>El Cuerno de África enfrenta la peor sequía en 40 años según la ONU. Más de 20 millones de personas enfrentan inseguridad alimentaria.</p><p>El representante de la FAO indicó que se necesitan 5,000 millones de dólares en ayuda humanitaria. Las cosechas se perdieron en Etiopía, Somalia y Kenia.</p><p>Las ONG indicaron que la crisis se agrava por el cambio climático.</p>',
      resumen: 'Cuerno de África: peor sequía en 40 años. 20 millones en inseguridad alimentaria.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-06-30', slug: 'africa-sequia-onu',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Sequía con ONU, FAO, cifras y ONG',
  },
  {
    nombre: 'int-17-canada-incendios',
    noticia: {
      titulo: 'Canadá combate 200 incendios forestales simultáneos',
      contenido: '<p>Canadá combate 200 incendios forestales simultáneos en la provincia de British Columbia. Según el servicio forestal, se han quemado 500,000 hectáreas.</p><p>El primer ministro indicó que se movilizaron 5,000 bomberos. Se solicitó ayuda internacional a Estados Unidos y Australia.</p><p>Los habitantes de zonas afectadas fueron evacuados a centros de refugio.</p>',
      resumen: 'Canadá combate 200 incendios. 500,000 hectáreas quemadas en British Columbia.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-06-29', slug: 'canada-incendios-forestales',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Incendios con primer ministro, cifras e habitantes',
  },
  {
    nombre: 'int-18-oms-salud',
    noticia: {
      titulo: 'OMS declara fin de emergencia sanitaria por COVID-19',
      contenido: '<p>La OMS declaró el fin de la emergencia sanitaria internacional por COVID-19. Según el director general, la mortalidad disminuyó 95% desde el pico.</p><p>El director indicó que el virus continúa circulando pero ya no constituye una emergencia. Se recomienda mantener la vigilancia genómica.</p><p>Los ministros de salud de varios países indicaron que ajustarán sus protocolos.</p>',
      resumen: 'OMS declara fin de emergencia por COVID-19. Mortalidad disminuyó 95%.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-06-28', slug: 'oms-covid-fin-emergencia',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Salud con OMS, director, cifras y ministros',
  },
  {
    nombre: 'int-19-costa-rica-ambiente',
    noticia: {
      titulo: 'Costa Rica alcanza 99% de energía renovable por tercer año',
      contenido: '<p>Costa Rica alcanzó el 99% de energía renovable por tercer año consecutivo. Según el Instituto Costarricense de Electricidad, las fuentes principales son hidroeléctrica y geotérmica.</p><p>El presidente indicó que la meta es llegar al 100% en 2027. Se invertirán 2,000 millones de dólares en nueva infraestructura.</p><p>Los ambientalistas indicaron que Costa Rica es modelo para la región.</p>',
      resumen: 'Costa Rica: 99% energía renovable por tercer año. Meta: 100% en 2027.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-06-27', slug: 'costa-rica-energia-renovable',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Energía con presidente, instituto, cifras y ambientalistas',
  },
  {
    nombre: 'int-20-papa-visita',
    noticia: {
      titulo: 'Papa anuncia visita a Centroamérica en octubre',
      contenido: '<p>El Papa anunció una visita a Centroamérica en octubre. Según el Vaticano, la gira incluirá Guatemala, El Salvador y Nicaragua.</p><p>El portavoz del Vaticano indicó que el Papa se reunirá con líderes religiosos y comunidades. La agenda incluye una misa en Managua.</p><p>Los fieles indicaron que es una noticia esperada desde hace años.</p>',
      resumen: 'Papa visitará Centroamérica en octubre. Gira incluye Guatemala, El Salvador y Nicaragua.',
      categoria: 'Internacionales', autor: 'Redacción NI', fecha: '2025-06-26', slug: 'papa-visita-centroamerica',
    },
    categoriaEsperada: 'Internacionales', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Visita con Vaticano, portavoz y fieles',
  },
];

// ───────────────────────────────────────────────
// DEPORTES — 20 casos
// ───────────────────────────────────────────────

export const deportesFixtures: TestFixture[] = [
  {
    nombre: 'dep-01-clasico-nacional',
    noticia: {
      titulo: 'Real Estelí vence 2-1 al Diriangén en clásico nacional',
      contenido: '<p>Real Estelí venció 2-1 al Diriangén en el clásico nacional disputado en el estadio Independencia. Los goles fueron anotados por Carlos López al minuto 35 y por Mario Ruiz al 78.</p><p>El Diriangén descontó mediante un penal convertido por Javier Silva al 85. Con este resultado, Real Estelí se acerca al líder de la tabla.</p><p>El entrenador de Real Estelí indicó que el equipo mostró carácter. El próximo partido será contra Walter Ferretti el domingo.</p>',
      resumen: 'Real Estelí vence 2-1 al Diriangén. Goles de López y Ruiz. Silva descontó de penal.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-15', slug: 'real-esteli-diriangen-clasico',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Clásico con resultado, goles, tabla y entrenador',
  },
  {
    nombre: 'dep-02-seleccion-victoria',
    noticia: {
      titulo: 'Nicaragua vence a Honduras 3-0 en eliminatoria mundialista',
      contenido: '<p>La selección de Nicaragua venció 3-0 a Honduras en la eliminatoria mundialista. Los goles fueron anotados por Juan Barrera, Carlos López y un autogol del defensa hondureño.</p><p>Con esta victoria, Nicaragua suma 9 puntos y se coloca segunda en el grupo. El próximo partido será contra Costa Rica en septiembre.</p><p>El director técnico indicó que el equipo está en su mejor momento. La figura del partido fue Barrera.</p>',
      resumen: 'Nicaragua vence 3-0 a Honduras. Barrera, López y autogol. Segundos en el grupo con 9 puntos.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-14', slug: 'nicaragua-honduras-eliminatoria',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 65, veredictoEsperado: 'publicar_destacado',
    descripcion: 'Selección con resultado, goles, tabla y DT',
  },
  {
    nombre: 'dep-03-beisbol-final',
    noticia: {
      titulo: 'Industriales se corona campeón de la liga profesional de béisbol',
      contenido: '<p>Industriales se coronó campeón de la liga profesional de béisbol al vencer 4-2 a Boer en el séptimo juego de la final. El lanzador estrella lanzó 7 entradas sin carreras.</p><p>El mánager de Industriales indicó que es el quinto título consecutivo. El equipo terminó la temporada con 45 victorias y 20 derrotas.</p><p>La figura de la serie fue el lanzador con 15 ponches en dos juegos. El próximo torneo inicia en octubre.</p>',
      resumen: 'Industriales campeón: vence 4-2 a Boer en séptimo juego. Quinto título consecutivo.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-13', slug: 'industriales-campeon-beisbol',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 65, veredictoEsperado: 'publicar_destacado',
    descripcion: 'Béisbol con resultado, estadísticas, mánager y figura',
  },
  {
    nombre: 'dep-04-boxeo-titulo',
    noticia: {
      titulo: 'Boxeador nicaragüense defiende título mundial por cuarta vez',
      contenido: '<p>El boxeador nicaragüense Román González defendió su título mundial por cuarta vez al vencer por KO en el sexto asalto. La pelea se realizó en Managua ante 10,000 espectadores.</p><p>El entrenador indicó que González está en su mejor forma. Su récord es de 50 victorias y 2 derrotas. La próxima pelea será en septiembre en Estados Unidos.</p><p>La figura del boxeo nacional indicó que quiere retirarse como campeón.</p>',
      resumen: 'Román González defiende título mundial por cuarta vez. KO en sexto asalto en Managua.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-12', slug: 'gonzalez-boxeo-titulo',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Boxeo con resultado, récord, entrenador y figura',
  },
  {
    nombre: 'dep-05-futbol-tabla',
    noticia: {
      titulo: 'Walter Ferretti lidera tabla de posiciones tras jornada 15',
      contenido: '<p>Walter Ferretti lidera la tabla de posiciones tras la jornada 15 con 33 puntos. Le siguen Real Estelí con 30 y Diriangén con 28.</p><p>El entrenador de Walter Ferretti indicó que el equipo mantiene la regularidad. Han ganado 10 partidos, empatado 3 y perdido 2.</p><p>El próximo partido del líder será contra Chinandega el sábado. La figura del equipo es el goleador con 12 goles.</p>',
      resumen: 'Walter Ferretti lidera con 33 puntos. Real Estelí segundo con 30. Jornada 15.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-11', slug: 'walter-ferretti-tabla',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Tabla con posiciones, estadísticas, DT y figura',
  },
  {
    nombre: 'dep-06-ciclismo-vuelta',
    noticia: {
      titulo: 'Ciclista nicaragüense gana etapa de la Vuelta a Centroamérica',
      contenido: '<p>El ciclista nicaragüense Miguel Rodríguez ganó la quinta etapa de la Vuelta a Centroamérica. La etapa de 120 kilómetros se corrió entre León y Granada.</p><p>Rodríguez cruzó la meta en 2 horas y 45 minutos. Se coloca tercero en la clasificación general a 30 segundos del líder.</p><p>El director del equipo indicó que Rodríguez tiene opciones de ganar la vuelta. La próxima etapa es una contrarreloj de 20 kilómetros.</p>',
      resumen: 'Miguel Rodríguez gana etapa León-Granada en Vuelta a Centroamérica. Tercero en la general.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-10', slug: 'rodriguez-ciclismo-vuelta',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Ciclismo con resultado, tiempo, clasificación y DT',
  },
  {
    nombre: 'dep-07-basquet-final',
    noticia: {
      titulo: 'Costa Caribe vence a Managua en final de baloncesto',
      contenido: '<p>Costa Caribe venció a Managua 85-78 en la final del campeonato nacional de baloncesto. El partido se jugó en el gimnasio Alexis Argüello.</p><p>El jugador estrella anotó 30 puntos y capturó 12 rebotes. Fue elegido MVP de la final. Costa Caribe logra su tercer título consecutivo.</p><p>El entrenador indicó que el equipo demostró superioridad durante toda la temporada. El próximo torneo inicia en septiembre.</p>',
      resumen: 'Costa Caribe campeón: vence 85-78 a Managua. MVP con 30 puntos y 12 rebotes.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-09', slug: 'costa-caribe-basquet-final',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Básquet con resultado, estadísticas, MVP y DT',
  },
  {
    nombre: 'dep-08-tenis-torneo',
    noticia: {
      titulo: 'Tenista nicaragüense alcanza semifinal en torneo ITF',
      contenido: '<p>El tenista nicaragüense Luis Pérez alcanzó las semifinales del torneo ITF en Guatemala. Pérez venció al cuarto favorito en cuartos por 6-4 y 6-3.</p><p>Pérez indicó que está en su mejor nivel. Su ranking subió 50 posiciones tras este torneo. La semifinal será contra el primer favorito.</p><p>El entrenador indicó que Pérez tiene potencial para entrar al top 200 mundial.</p>',
      resumen: 'Luis Pérez en semifinales ITF Guatemala. Vence al cuarto favorito 6-4, 6-3.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-08', slug: 'perez-tenis-itf',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Tenis con resultado, ranking y entrenador',
  },
  {
    nombre: 'dep-09-atletismo-record',
    noticia: {
      titulo: 'Atleta nicaragüense bate récord nacional en 100 metros',
      contenido: '<p>La atleta nicaragüense María Rivera batió el récord nacional en los 100 metros lisos con un tiempo de 11.15 segundos. El récord anterior duraba 12 años.</p><p>Rivera indicó que lleva tres años preparándose para este momento. Su próximo objetivo es clasificar a los Juegos Olímpicos.</p><p>El entrenador indicó que Rivera tiene talento para competir a nivel internacional. La marca la coloca entre las mejores de Centroamérica.</p>',
      resumen: 'María Rivera bate récord nacional: 11.15s en 100 metros. Récord anterior duraba 12 años.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-07', slug: 'rivera-atletismo-record',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Atletismo con récord, tiempo, atleta y DT',
  },
  {
    nombre: 'dep-10-voleibol-juegos',
    noticia: {
      titulo: 'Selección de voleibol clasifica a Juegos Centroamericanos',
      contenido: '<p>La selección de voleibol de Nicaragua clasificó a los Juegos Centroamericanos tras vencer a El Salvador 3-1. Los sets fueron 25-20, 25-18, 22-25 y 25-21.</p><p>El capitán indicó que el equipo trabajó duro para esta clasificación. El torneo se realizará en Guatemala en noviembre.</p><p>El entrenador indicó que el equipo tiene nivel para medallas. La figura del partido fue el atacante con 20 puntos.</p>',
      resumen: 'Voleibol clasifica a Juegos Centroamericanos: vence 3-1 a El Salvador.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-06', slug: 'voleibol-juegos-centroamericanos',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Voleibol con resultado, sets, capitán y DT',
  },
  {
    nombre: 'dep-11-natacion-medalla',
    noticia: {
      titulo: 'Nadador nicaragüense gana medalla de oro en Centroamericano',
      contenido: '<p>El nadador nicaragüense Carlos Méndez ganó medalla de oro en los 200 metros libres del campeonato centroamericano. Méndez registró un tiempo de 1:48.32.</p><p>Méndez indicó que la medalla es el resultado de meses de entrenamiento. Su próximo objetivo es el campeonato panamericano.</p><p>El entrenador indicó que Méndez es el mejor nadador del país en la última década.</p>',
      resumen: 'Carlos Méndez oro en 200m libres con 1:48.32 en centroamericano de natación.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-05', slug: 'mendez-natacion-oro',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Natación con resultado, tiempo y entrenador',
  },
  {
    nombre: 'dep-12-futbol-ascenso',
    noticia: {
      titulo: 'Chinandega FC logra ascenso a primera división',
      contenido: '<p>Chinandega FC logró el ascenso a la primera división tras vencer 2-0 a Juventus Managua. Los goles fueron anotados en la segunda mitad.</p><p>El entrenador indicó que el ascenso es un logro histórico para el club. El equipo terminó invicto la temporada con 18 victorias y 4 empates.</p><p>El presidente del club indicó que se reforzará el equipo para primera división. La figura de la temporada fue el goleador con 25 goles.</p>',
      resumen: 'Chinandega FC asciende a primera: vence 2-0 a Juventus. Invicto con 18V y 4E.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-04', slug: 'chinandega-fc-ascenso',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Ascenso con resultado, estadísticas y presidente',
  },
  {
    nombre: 'dep-13-pesas-record',
    noticia: {
      titulo: 'Levantador de pesas nicaragüense gana bronce en panamericano',
      contenido: '<p>El levantador de pesas nicaragüense Roberto Vega ganó medalla de bronce en el campeonato panamericano. Vega levantó 250 kg en total (110 en arranque y 140 en envión).</p><p>Vega indicó que el bronce es un paso hacia el mundial. Su récord personal es de 260 kg.</p><p>El entrenador indicó que Vega tiene potencial para oro en el próximo campeonato.</p>',
      resumen: 'Roberto Vega bronce en panamericano de pesas. 250 kg total (110+140).',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-03', slug: 'vega-pesas-bronce',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Pesas con resultado, cifras y entrenador',
  },
  {
    nombre: 'dep-14-futbol-derrota',
    noticia: {
      titulo: 'Selección sub-20 cae ante Costa Rica en pre-mundial',
      contenido: '<p>La selección sub-20 de Nicaragua cayó 2-1 ante Costa Rica en el pre-mundial. El gol nicaragüense fue anotado por penalty en el minuto 70.</p><p>El director técnico indicó que el equipo dejó todo en la cancha. Con esta derrota, Nicaragua se complica en el grupo con 3 puntos.</p><p>El próximo partido será contra Panamá el miércoles. La figura del partido fue el portero con 8 atajadas.</p>',
      resumen: 'Sub-20 cae 2-1 ante Costa Rica en pre-mundial. Gol de penal. 3 puntos en el grupo.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-02', slug: 'sub20-costa-rica-premundial',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Derrota con resultado, gol, tabla y DT',
  },
  {
    nombre: 'dep-15-surf-campeonato',
    noticia: {
      titulo: 'Surfista nicaragüense gana torneo nacional en San Juan del Sur',
      contenido: '<p>El surfista nicaragüense Diego López ganó el torneo nacional de surf en San Juan del Sur. López obtuvo la puntuación más alta con 15.5 puntos en dos olas.</p><p>López indicó que las condiciones del mar fueron excelentes. Su próximo objetivo es el campeonato centroamericano en Costa Rica.</p><p>El organizador del torneo indicó que participaron 30 surfistas de todo el país.</p>',
      resumen: 'Diego López gana torneo nacional de surf en San Juan del Sur. 15.5 puntos.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-07-01', slug: 'lopez-surf-san-juan',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Surf con resultado, puntuación y organizador',
  },
  {
    nombre: 'dep-16-beisbol-jornada',
    noticia: {
      titulo: 'Boer y Chinandega empatan en jornada de béisbol',
      contenido: '<p>Boer y Chinandega empataron 3-3 en una jornada de béisbol que se decidió en extra innings. El partido duró 11 entradas.</p><p>El lanzador de Boer lanzó 6 entradas con 8 ponches. El mánager indicó que el equipo necesita mejorar la ofensiva.</p><p>Con este resultado, Boer mantiene el segundo lugar en la tabla con 28 puntos. El próximo juego será el viernes.</p>',
      resumen: 'Boer y Chinandega empatan 3-3 en 11 entradas. Boer segundo con 28 puntos.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-06-30', slug: 'boer-chinandega-beisbol',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Béisbol con resultado, innings, estadísticas y mánager',
  },
  {
    nombre: 'dep-17-karate-medalla',
    noticia: {
      titulo: 'Karateka nicaragüense gana plata en campeonato centroamericano',
      contenido: '<p>La karateka nicaragüense Sofía Torres ganó medalla de plata en kumite del campeonato centroamericano. Torres perdió la final por 2-1 contra Guatemala.</p><p>Torres indicó que la plata es un resultado positivo. Su próximo objetivo es el panamericano en octubre.</p><p>El entrenador indicó que Torres demostró gran nivel. Es su tercera medalla internacional del año.</p>',
      resumen: 'Sofía Torres plata en kumite centroamericano. Pierde final 2-1 vs Guatemala.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-06-29', slug: 'torres-karate-plata',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Karate con resultado, marcador y entrenador',
  },
  {
    nombre: 'dep-18-futbol-fichaje',
    noticia: {
      titulo: 'Real Estelí ficha delantero argentino para próxima temporada',
      contenido: '<p>Real Estelí fichó al delantero argentino Diego Martínez para la próxima temporada. Martínez llega cedido por un año desde un club de segunda división de Argentina.</p><p>El presidente del club indicó que Martínez aportará experiencia goleadora. En su última temporada anotó 15 goles en 30 partidos.</p><p>El entrenador indicó que Martínez se integrará al equipo la próxima semana. El torneo inicia en agosto.</p>',
      resumen: 'Real Estelí ficha delantero argentino Diego Martínez. Cedido por un año.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-06-28', slug: 'real-esteli-fichaje-martinez',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Fichaje con presidente, estadísticas y DT',
  },
  {
    nombre: 'dep-19-judo-panamericano',
    noticia: {
      titulo: 'Judoka nicaragüense clasifica a mundial de judo',
      contenido: '<p>El judoka nicaragüense Andrés Gómez clasificó al mundial de judo tras quedar quinto en el panamericano. Gómez ganó 4 de 6 combates.</p><p>Gómez indicó que la clasificación es un sueño. El mundial se realizará en Uzbekistán en septiembre.</p><p>El entrenador indicó que Gómez necesita preparación física adicional para el mundial.</p>',
      resumen: 'Andrés Gómez clasifica a mundial de judo. Quinto en panamericano con 4 victorias.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-06-27', slug: 'gomez-judo-mundial',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Judo con resultado, combates y DT',
  },
  {
    nombre: 'dep-20-futbol-arbitraje',
    noticia: {
      titulo: 'FIFA designa árbitro nicaragüense para Juegos Olímpicos',
      contenido: '<p>La FIFA designó al árbitro nicaragüense Henry Pineda para dirigir en los Juegos Olímpicos. Pineda es el primer árbitro nicaragüense en lograr esta designación.</p><p>Pineda indicó que es el logro más importante de su carrera. Ha dirigido 200 partidos a nivel internacional.</p><p>La federación nicaragüense indicó que es un orgullo para el arbitraje nacional. Pineda viajará a París en julio.</p>',
      resumen: 'FIFA designa árbitro Henry Pineda para Juegos Olímpicos. Primer nicaragüense en lograrlo.',
      categoria: 'Deportes', autor: 'Redacción NI', fecha: '2025-06-26', slug: 'pineda-arbitro-olimpicos',
    },
    categoriaEsperada: 'Deportes', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Arbitraje con FIFA, designación, cifras y federación',
  },
];
