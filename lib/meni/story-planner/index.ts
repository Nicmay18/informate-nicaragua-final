/**
 * Story Planner — Engine
 * ======================
 * MENI v7: El módulo más importante de todo el sistema.
 *
 * Antes de que el LLM escriba una sola palabra, el Story Planner:
 * 1. Detecta el tipo de historia
 * 2. Define el enfoque para Nicaragua
 * 3. Establece el orden narrativo exacto (qué va primero, segundo, tercero)
 * 4. Lista qué debe explicar (valor de servicio)
 * 5. Prohíbe frases cliché que otros medios usan
 * 6. Define el ángulo Nicaragua Informate
 *
 * El LLM recibe esto y solo redacta. No decide.
 */

import type { StoryPlannerInput, StoryPlan, StoryType, NarrativeBlock } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectarTipo(texto: string, categoria?: string): StoryType {
  const t = texto.toLowerCase();
  if (/coca[ií]na|droga|narcot|decomiso|ocupaci[oó]n.*kilos?|kilos?.*(ocup|decom|incaut)/i.test(t)) return 'operativo_antidrogas';
  if (/operativo|allanamiento|captura|detenci[oó]n|aprehensi[oó]n|redada/i.test(t)) return 'operativo_policial';
  if (/accidente|choque|colisi[oó]n|volcadura|atropello|v[ií]ctima.*v[ií]a|v[ií]a.*fallecido/i.test(t)) return 'accidente_transito';
  if (/(?:\b)(?:homicidio|asesinato|parricidio|femicidio|muert[oa]s?|fallecid[oa]s?|falleci[oó]|muerte\s+violenta|ejecutado|balacera|cad[eá]ver|arma.*fallecido|fallecido.*arma)(?:\b)/i.test(t)) return 'homicidio';
  if (/incendio|fuego|siniestro|conflagraci[oó]n|conato/i.test(t)) return 'incendio';
  if (/dengue|malaria|covid|virus|epidemia|brote|salud|hospital|intoxicaci[oó]n|enfermedad/i.test(t)) return 'salud_publica';
  if (/precio|inflaci[oó]n|salario|econom[ií]a|d[oó]lar|c[oó]rdoba|exportaci[oó]n|importaci[oó]n|canasta/i.test(t)) return 'economia';
  if (/pol[ií]tica|gobierno|asamblea|partido|elecci[oó]n|reforma|decreto|presidente|ministro/i.test(t)) return 'politica_nacional';
  if (/(?:^|\W)(?:internacional|onu|russia|china|mundo|exterior|estados\s+unidos)(?=$|\W)|\bue\b|(?:^|\W)am[eé]rica(?=$|\W)/i.test(t)) return 'hecho_internacional';
  if (/deporte|f[uú]tbol|b[eé]isbol|boxeo|campeonato|selecci[oó]n|liga|torneo/i.test(t)) return 'deporte';
  if (/inundaci[oó]n|deslave|lluvia|tormenta|terremoto|hurac[aá]n|desastre|evacuaci[oó]n/i.test(t)) return 'desastre_natural';
  if (/educaci[oó]n|colegio|universidad|estudiante|maestro|profesor|escuela/i.test(t)) return 'educacion';
  if (/cultura|m[uú]sica|arte|festival|concierto|exposici[oó]n|patrimonio/i.test(t)) return 'cultura';
  if (categoria) {
    const c = categoria.toLowerCase();
    if (c.includes('suceso')) return 'homicidio';
    if (c.includes('econom')) return 'economia';
    if (c.includes('deport')) return 'deporte';
    if (c.includes('salud')) return 'salud_publica';
    if (c.includes('politic')) return 'politica_nacional';
    if (c.includes('internac')) return 'hecho_internacional';
  }
  return 'general';
}

const TIPO_LABELS: Record<StoryType, string> = {
  operativo_antidrogas: 'Operativo antidrogas',
  operativo_policial: 'Operativo policial',
  accidente_transito: 'Accidente de tránsito',
  homicidio: 'Hecho violento',
  incendio: 'Siniestro / Incendio',
  salud_publica: 'Salud pública',
  economia: 'Economía / Consumo',
  politica_nacional: 'Política nacional',
  hecho_internacional: 'Hecho internacional',
  deporte: 'Deporte',
  desastre_natural: 'Desastre natural',
  educacion: 'Educación',
  cultura: 'Cultura',
  general: 'Hecho noticioso',
};

const PLANES: Record<StoryType, {
  enfoque: string;
  orden: { tipo: string; descripcion: string; queIncluir: string[] }[];
  explicacionesServicio: string[];
  frasesProhibidas: string[];
  anguloNI: string;
  proposito: string;
  queNoHacer: string[];
}> = {
  operativo_antidrogas: {
    enfoque: 'Impacto para Nicaragua: qué refleja sobre el combate al narcotráfico',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió: el decomiso u operativo', queIncluir: ['Cantidad decomisada', 'Lugar exacto', 'Fecha y hora', 'Institución que ejecutó el operativo'] },
      { tipo: 'operativo', descripcion: 'Cómo se desarrolló el operativo', queIncluir: ['Procedimiento', 'Duración', 'Unidades involucradas'] },
      { tipo: 'encontrado', descripcion: 'Qué encontraron', queIncluir: ['Tipo y cantidad de sustancia', 'Ot elementos incautados (vehículos, armas, dinero)', 'Lugar del hallazgo (casa, vehículo, ruta)'] },
      { tipo: 'capturados', descripcion: 'Quienes fueron capturados', queIncluir: ['Número de detenidos', 'Nacionalidades si se conocen', 'Si hay identidad reservada'] },
      { tipo: 'antecedentes', descripcion: 'Antecedentes relevantes', queIncluir: ['Decomisos previos en la zona', 'Tendencia de decomisos en el país', 'Comparación con cifras anteriores'] },
      { tipo: 'significado', descripcion: 'Qué significa', queIncluir: ['Qué representa esa cantidad de droga', 'Por qué el operativo importa', 'Contexto del narcotráfico en la ruta centroamericana'] },
      { tipo: 'sigue', descripcion: 'Qué sigue ahora', queIncluir: ['Proceso legal', 'Investigaciones abiertas', 'Próximos pasos de autoridades'] },
    ],
    explicacionesServicio: [
      'Explicar qué representa la cantidad decomisada (ej: 137 kilos = X dosis potenciales)',
      'Explicar por qué este operativo importa para la seguridad ciudadana',
      'Comparar con decomisos anteriores para dar contexto',
      'Explicar el rol de Nicaragua como ruta de tránsito en el narcotráfico regional',
    ],
    frasesProhibidas: [
      'Importante golpe',
      'Contundente operativo',
      'Fuerte golpe',
      'Gran decomiso',
      'Macizo operativo',
      'Exitoso operativo',
      'Significativo golpe al crimen organizado',
    ],
    anguloNI: 'No vender el decomiso. Explicar qué refleja sobre el combate al narcotráfico y por qué importa para la seguridad del nicaragüense.',
    proposito: 'Informar el hecho y explicar su contexto, sin celebrar ni dramatizar la acción policial.',
    queNoHacer: [
      'No celebrar el operativo como victoria',
      'No usar lenguaje militar para describir acción policial',
      'No exponer identidades de detenidos si no fueron reveladas oficialmente',
      'No especular sobre conexiones con organizaciones criminales sin confirmación',
    ],
  },
  operativo_policial: {
    enfoque: 'Hecho, proceso legal y derechos del detenido',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió', queIncluir: ['Delito imputado', 'Lugar', 'Fecha'] },
      { tipo: 'captura', descripcion: 'Cómo fue la captura', queIncluir: ['Circunstancias', 'Institución', 'Si hubo resistencia'] },
      { tipo: 'cargos', descripcion: 'Cargos y proceso legal', queIncluir: ['Delito imputado', 'Marco legal aplicable', 'Próximos pasos judiciales'] },
      { tipo: 'contexto', descripcion: 'Contexto de seguridad en la zona', queIncluir: ['Antecedentes delictivos en el área', 'Percepción de seguridad'] },
      { tipo: 'sigue', descripcion: 'Qué sigue', queIncluir: ['Audiencia', 'Plazos legales', 'Estado de la investigación'] },
    ],
    explicacionesServicio: [
      'Explicar qué delito se imputa y qué implica legalmente',
      'Explicar los derechos del detenido en el proceso nicaragüense',
      'Explicar el proceso judicial que sigue',
    ],
    frasesProhibidas: [
      'Peligroso delincuente',
      'Criminal confeso',
      'Malogrado sujeto',
      'Sujeto de mala conducta',
    ],
    anguloNI: 'Informar el hecho sin estigmatizar al detenido. Explicar el proceso legal y los derechos.',
    proposito: 'Reportar el hecho y orientar al lector sobre el proceso legal.',
    queNoHacer: [
      'No juzgar antes de sentencia',
      'No exponer datos sensibles del detenido',
      'No usar lenguaje peyorativo',
    ],
  },
  accidente_transito: {
    enfoque: 'Hecho, víctimas, causas y prevención',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió y dónde', queIncluir: ['Tipo de accidente', 'Lugar exacto', 'Fecha y hora'] },
      { tipo: 'victimas', descripcion: 'Estado de víctimas', queIncluir: ['Fallecidos/heridos', 'Edad si se conoce', 'Vehículos involucrados'] },
      { tipo: 'causas', descripcion: 'Causas probables', queIncluir: ['Versión de autoridades', 'Estado de la vía', 'Condiciones'] },
      { tipo: 'autoridades', descripcion: 'Acción de autoridades', queIncluir: ['Quién respondió', 'Tiempo de respuesta', 'Trabajo en el lugar'] },
      { tipo: 'antecedentes', descripcion: 'Antecedentes en la zona', queIncluir: ['Accidentes previos en el punto', 'Estado de la vía'] },
      { tipo: 'prevencion', descripcion: 'Prevención', queIncluir: ['Recomendaciones de tránsito', 'Recordatorio de la Ley 431'] },
    ],
    explicacionesServicio: [
      'Explicar el estado de la vía donde ocurrió',
      'Explicar las causas más comunes de accidentes en Nicaragua',
      'Explicar qué dice la Ley 431 sobre seguridad vial',
    ],
    frasesProhibidas: [
      'Trágico accidente',
      'Horroroso choque',
      'Espeluznante accidente',
      'Fatal desenlace',
      'Pérdida irreparable',
    ],
    anguloNI: 'Informar sin explotar el dolor. Explicar causas y prevención para que el lector aprenda.',
    proposito: 'Reportar el hecho y aportar valor de servicio: prevención y contexto vial.',
    queNoHacer: [
      'No mostrar imágenes sensibles',
      'No exponer identidades de víctimas sin confirmación familiar',
      'No especular sobre causas antes del informe oficial',
    ],
  },
  homicidio: {
    enfoque: 'Hecho, investigación y contexto de seguridad',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió', queIncluir: ['Lugar', 'Fecha', 'Circunstancias generales sin detalles sensibles'] },
      { tipo: 'victima', descripcion: 'La víctima', queIncluir: ['Edad si se conoce', 'Ocupación si es relevante', 'No exponer identidad si no es oficial'] },
      { tipo: 'circunstancias', descripcion: 'Cómo ocurrió', queIncluir: ['Versión de autoridades', 'Arma involucrada si es relevante', 'Sin detalles morbosos'] },
      { tipo: 'investigacion', descripcion: 'Estado de la investigación', queIncluir: ['Si hay detenidos', 'Diligencias en curso', 'Autoridad a cargo'] },
      { tipo: 'contexto', descripcion: 'Contexto de seguridad', queIncluir: ['Antecedentes en la zona', 'Tendencia general'] },
    ],
    explicacionesServicio: [
      'Explicar el proceso de investigación penal en Nicaragua',
      'Explicar el contexto de seguridad en la zona sin alarmar',
      'Explicar qué protections legales existen para víctimas',
    ],
    frasesProhibidas: [
      'Sangriento crimen',
      'Horroroso hallazgo',
      'Macabro descubrimiento',
      'Víctima fue ultimada',
      'Oleada de violencia',
    ],
    anguloNI: 'Informar el hecho sin morbo. Explicar el contexto de seguridad y el proceso judicial.',
    proposito: 'Reportar con respeto a la víctima y aportar contexto sin generar alarma.',
    queNoHacer: [
      'No incluir detalles morbosos',
      'No mostrar imágenes del cuerpo o del lugar del crimen',
      'No exponer identidad de menores',
      'No especular sobre móviles antes de investigación oficial',
    ],
  },
  incendio: {
    enfoque: 'Hecho, respuesta, causas y estado actual',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió', queIncluir: ['Tipo de siniestro', 'Lugar', 'Fecha y hora'] },
      { tipo: 'afectacion', descripcion: 'Daños y afectación', queIncluir: ['Locales afectados', 'Personas impactadas', 'Pérdidas materiales si se conocen'] },
      { tipo: 'respuesta', descripcion: 'Respuesta de bomberos', queIncluir: ['Tiempo de respuesta', 'Unidades desplegadas', 'Cómo se controló'] },
      { tipo: 'causa', descripcion: 'Causa probable', queIncluir: ['Hipótesis', 'Investigación en curso'] },
      { tipo: 'estado', descripcion: 'Estado actual', queIncluir: ['Situación del lugar', 'Medidas tomadas'] },
    ],
    explicacionesServicio: [
      'Explicar cómo prevenir este tipo de siniestros',
      'Explicar el tiempo de respuesta promedio de bomberos en la zona',
      'Explicar qué hacer en caso de incendio',
    ],
    frasesProhibidas: [
      'Infernal incendio',
      'Pavoroso siniestro',
      'Llamas devoraron',
      'Tragedia evitada milagrosamente',
    ],
    anguloNI: 'Informar el hecho y aportar valor de prevención.',
    proposito: 'Reportar el siniestro y orientar sobre prevención.',
    queNoHacer: [
      'No especular sobre causas antes del informe',
      'No dramatizar las llamas',
    ],
  },
  salud_publica: {
    enfoque: 'Hecho, datos, prevención y dónde acudir',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió', queIncluir: ['Enfermedad o problema', 'Lugar', 'Número de casos'] },
      { tipo: 'datos', descripcion: 'Datos epidemiológicos', queIncluir: ['Cifras', 'Tendencia', 'Tasa de incidencia'] },
      { tipo: 'transmision', descripcion: 'Cómo se transmite', queIncluir: ['Vector o vía de contagio', 'Período de incubación'] },
      { tipo: 'sintomas', descripcion: 'Síntomas', queIncluir: ['Principales síntomas', 'Cuándo acudir al médico'] },
      { tipo: 'prevencion', descripcion: 'Prevención', queIncluir: ['Medidas preventivas', 'Recomendaciones de MINSA'] },
      { tipo: 'autoridades', descripcion: 'Respuesta de autoridades', queIncluir: ['Qué dijo MINSA', 'Alertas o campañas'] },
    ],
    explicacionesServicio: [
      'Explicar cómo se transmite la enfermedad',
      'Explicar cómo prevenir',
      'Explicar dónde pueden atenderse los afectados',
      'Explicar qué significa el brote en contexto nacional',
    ],
    frasesProhibidas: [
      'Terrorífico brote',
      'Mortal enfermedad',
      'Pánico en la población',
      'Alarma sanitaria',
    ],
    anguloNI: 'Informar con datos y prevención. No generar pánico. Explicar qué hacer.',
    proposito: 'Reportar el hecho de salud y aportar información útil para que el lector se proteja.',
    queNoHacer: [
      'No generar alarma',
      'No usar lenguaje catastrofista',
      'No dar consejos médicos sin fuente oficial',
    ],
  },
  economia: {
    enfoque: 'Hecho, cifras, impacto en el bolsillo y contexto',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué cambió', queIncluir: ['Producto o servicio', 'Dirección del cambio (subió/bajó)', 'Magnitud'] },
      { tipo: 'cifras', descripcion: 'Cifras concretas', queIncluir: ['Monto o porcentaje', 'Comparación con período anterior'] },
      { tipo: 'impacto', descripcion: 'Impacto en el consumidor', queIncluir: ['Cómo afecta el presupuesto familiar', 'Qué productos se encarecen'] },
      { tipo: 'causas', descripcion: 'Por qué cambió', queIncluir: ['Factores del mercado', 'Decisiones oficiales', 'Contexto internacional'] },
      { tipo: 'contexto', descripcion: 'Contexto económico', queIncluir: ['Tendencia general', 'Canasta básica', 'Inflación'] },
    ],
    explicacionesServicio: [
      'Explicar cómo afecta al bolsillo del nicaragüense',
      'Explicar qué productos de la canasta básica se ven afectados',
      'Explicar el contexto económico nacional',
    ],
    frasesProhibidas: [
      'Duro golpe al bolsillo',
      'Escandaloso aumento',
      'Desorbitado precio',
      'Crisis económica',
    ],
    anguloNI: 'Explicar el cambio económico en términos que el ciudadano entienda. No dramatizar.',
    proposito: 'Informar el cambio y explicar su impacto real en la vida del nicaragüense.',
    queNoHacer: [
      'No usar lenguaje alarmista sobre economía',
      'No dar consejos financieros',
      'No comparar con otros países sin contexto',
    ],
  },
  politica_nacional: {
    enfoque: 'Hecho, implicaciones y impacto directo en el ciudadano',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué decisión o hecho ocurrió', queIncluir: ['Decisión', 'Quién la tomó', 'Fecha'] },
      { tipo: 'actor', descripcion: 'Actor principal', queIncluir: ['Quién anunció', 'Cargo', 'Contexto de la decisión'] },
      { tipo: 'implicaciones', descripcion: 'Qué significa para el ciudadano', queIncluir: ['Cambios concretos', 'Desde cuándo aplica', 'A quiénes afecta'] },
      { tipo: 'contexto', descripcion: 'Contexto político', queIncluir: ['Antecedentes', 'Decisiones relacionadas'] },
      { tipo: 'sigue', descripcion: 'Qué sigue', queIncluir: ['Próximos pasos', 'Implementación', 'Plazos'] },
    ],
    explicacionesServicio: [
      'Explicar cómo afecta directamente al ciudadano',
      'Explicar qué cambia con esta decisión',
      'Explicar el marco legal o institucional',
    ],
    frasesProhibidas: [
      'Histórica decisión',
      'Contundente medida',
      'Sin precedentes',
      'Revolucionario cambio',
    ],
    anguloNI: 'Informar la decisión y explicar su impacto concreto en el ciudadano, sin tomar partido.',
    proposito: 'Reportar el hecho político y orientar al ciudadano sobre cómo le afecta.',
    queNoHacer: [
      'No tomar posición política',
      'No usar lenguaje partidista',
      'No omitir contexto relevante',
    ],
  },
  hecho_internacional: {
    enfoque: 'Qué ocurrió y por qué importa para Nicaragua o los nicaragüenses',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió en el exterior', queIncluir: ['País', 'Fecha', 'Hecho'] },
      { tipo: 'contexto', descripcion: 'Contexto internacional', queIncluir: ['Por qué ocurrió', 'Antecedentes'] },
      { tipo: 'impacto_ni', descripcion: 'Impacto para Nicaragua', queIncluir: ['Conexión con Nicaragua', 'Nicaragüenses afectados', 'Efectos indirectos'] },
      { tipo: 'reacciones', descripcion: 'Reacciones', queIncluir: ['Respuestas internacionales', 'Posición de Nicaragua si la hay'] },
    ],
    explicacionesServicio: [
      'Explicar por qué un hecho internacional importa para Nicaragua',
      'Explicar el contexto internacional necesario para entender',
      'Explicar si hay nicaragüenses afectados',
    ],
    frasesProhibidas: [
      'Conmoción mundial',
      'Estremece al mundo',
      'El mundo en shock',
    ],
    anguloNI: 'Explicar el hecho internacional desde su relevancia para Nicaragua. No solo traducir noticias de agencia.',
    proposito: 'Informar el hecho y explicar su conexión con Nicaragua.',
    queNoHacer: [
      'No traducir literalmente de agencias internacionales',
      'No omitir la conexión nicaragüense',
      'No asumir que el lector conoce el contexto internacional',
    ],
  },
  deporte: {
    enfoque: 'Resultado, contexto y qué significa para el equipo o selección',
    orden: [
      { tipo: 'resultado', descripcion: 'Resultado', queIncluir: ['Marcador', 'Equipos', 'Fecha'] },
      { tipo: 'protagonista', descripcion: 'Protagonista', queIncluir: ['Figura del partido', 'Jugada clave'] },
      { tipo: 'contexto', descripcion: 'Contexto deportivo', queIncluir: ['Posición en tabla', 'Racha', 'Antecedentes'] },
      { tipo: 'sigue', descripcion: 'Qué viene', queIncluir: ['Próximo compromiso', 'Calendario'] },
    ],
    explicacionesServicio: [
      'Explicar qué significa el resultado para la clasificación',
      'Explicar el contexto del torneo o liga',
    ],
    frasesProhibidas: [
      'Histórica victoria',
      'Humillante derrota',
      'Incredible remontada',
      'Epico partido',
    ],
    anguloNI: 'Contar la historia deportiva sin exagerar. Explicar el contexto.',
    proposito: 'Informar el resultado y aportar contexto deportivo.',
    queNoHacer: [
      'No exagerar resultados',
      'No usar lenguaje sensacionalista',
    ],
  },
  desastre_natural: {
    enfoque: 'Hecho, afectación, respuesta de autoridades y qué debe hacer el ciudadano',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió', queIncluir: ['Tipo de desastre', 'Zonas afectadas', 'Fecha'] },
      { tipo: 'afectacion', descripcion: 'Personas y zonas afectadas', queIncluir: ['Familias/personas', 'Viviendas', 'Infraestructura'] },
      { tipo: 'autoridades', descripcion: 'Respuesta de autoridades', queIncluir: ['SINAPRED, MARENA, alcaldías', 'Medidas tomadas', 'Albergues si los hay'] },
      { tipo: 'que_hacer', descripcion: 'Qué debe hacer el ciudadano', queIncluir: ['Medidas de seguridad', 'Puntos de evacuación', 'Contactos de emergencia'] },
      { tipo: 'antecedentes', descripcion: 'Antecedentes', queIncluir: ['Desastres similares en la zona', 'Vulnerabilidad de Nicaragua'] },
    ],
    explicacionesServicio: [
      'Explicar qué debe hacer el ciudadano',
      'Explicar dónde están los albergues o puntos de evacuación',
      'Explicar la vulnerabilidad de Nicaragua a desastres naturales',
      'Explicar el rol de SINAPRED',
    ],
    frasesProhibidas: [
      'Tragedia natural',
      'Escena desoladora',
      'Desesperación de las víctimas',
      'Catástrofe inevitable',
    ],
    anguloNI: 'Informar el desastre y orientar al ciudadano. No dramatizar el sufrimiento.',
    proposito: 'Reportar el desastre y aportar información de servicio para la seguridad.',
    queNoHacer: [
      'No dramatizar el sufrimiento',
      'No mostrar imágenes sensibles',
      'No omitir las medidas de seguridad',
    ],
  },
  educacion: {
    enfoque: 'Hecho, impacto en estudiantes y contexto educativo',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió', queIncluir: ['Decisión o hecho', 'Institución', 'Fecha'] },
      { tipo: 'afectados', descripcion: 'A quiénes afecta', queIncluir: ['Estudiantes, maestros, padres', 'Niveles educativos'] },
      { tipo: 'impacto', descripcion: 'Impacto', queIncluir: ['Cómo cambia la educación', 'Desde cuándo aplica'] },
      { tipo: 'autoridades', descripcion: 'Posición de autoridades', queIncluir: ['MINED', 'Direcciones departamentales'] },
      { tipo: 'contexto', descripcion: 'Contexto educativo', queIncluir: ['Antecedentes', 'Situación del sistema educativo'] },
    ],
    explicacionesServicio: [
      'Explicar cómo afecta a estudiantes y padres',
      'Explicar el contexto del sistema educativo nicaragüense',
    ],
    frasesProhibidas: [
      'Grave crisis educativa',
      'Desastroso resultado',
    ],
    anguloNI: 'Informar el hecho educativo y explicar su impacto en la comunidad escolar.',
    proposito: 'Reportar y orientar a la comunidad educativa.',
    queNoHacer: [
      'No politizar la educación',
      'No omitir el impacto en estudiantes',
    ],
  },
  cultura: {
    enfoque: 'Hecho cultural y su valor para la identidad nicaragüense',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió', queIncluir: ['Evento cultural', 'Lugar', 'Fecha'] },
      { tipo: 'protagonista', descripcion: 'Protagonistas', queIncluir: ['Artistas o instituciones', 'Obras presentadas'] },
      { tipo: 'contexto', descripcion: 'Contexto cultural', queIncluir: ['Tradición o género', 'Relevancia para Nicaragua'] },
      { tipo: 'valor', descripcion: 'Valor para el lector', queIncluir: ['Por qué importa', 'Cómo participar o asistir'] },
    ],
    explicacionesServicio: [
      'Explicar el contexto cultural o artístico',
      'Explicar la tradición o género al que pertenece',
    ],
    frasesProhibidas: [
      'Espectacular evento',
      'Magnífica presentación',
    ],
    anguloNI: 'Resaltar el valor cultural para la identidad nicaragüense sin exagerar.',
    proposito: 'Informar el hecho cultural y aportar contexto.',
    queNoHacer: [
      'No usar lenguaje publicitario',
      'No omitir el contexto cultural',
    ],
  },
  general: {
    enfoque: 'Hecho, contexto e impacto para el lector',
    orden: [
      { tipo: 'hecho', descripcion: 'Qué ocurrió', queIncluir: ['Hecho principal', 'Lugar', 'Fecha'] },
      { tipo: 'contexto', descripcion: 'Contexto necesario', queIncluir: ['Información para entender el hecho'] },
      { tipo: 'impacto', descripcion: 'Impacto', queIncluir: ['Cómo afecta al lector o comunidad'] },
      { tipo: 'antecedentes', descripcion: 'Antecedentes', queIncluir: ['Hechos previos relacionados'] },
      { tipo: 'sigue', descripcion: 'Qué sigue', queIncluir: ['Próximos pasos'] },
    ],
    explicacionesServicio: [
      'Explicar el contexto necesario para entender el hecho',
      'Explicar el impacto para el lector',
    ],
    frasesProhibidas: [
      'Importante acontecimiento',
      'Trascendental hecho',
      'Insólito suceso',
    ],
    anguloNI: 'Informar el hecho y explicar por qué importa al nicaragüense.',
    proposito: 'Reportar el hecho y aportar contexto e impacto.',
    queNoHacer: [
      'No omitir contexto',
      'No especular',
    ],
  },
};

function computeScore(tipo: StoryType, textoPlano: string): number {
  const plan = PLANES[tipo];
  let score = 50;
  if (plan.orden.length >= 5) score += 15;
  if (plan.explicacionesServicio.length >= 3) score += 15;
  if (plan.frasesProhibidas.length >= 3) score += 10;
  if (plan.queNoHacer.length >= 3) score += 10;
  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;
  if (palabras > 100) score += 10;
  if (palabras > 300) score += 5;
  return Math.min(score, 100);
}

export function runStoryPlanner(input: StoryPlannerInput): StoryPlan {
  const textoPlano = stripHtml(`${input.titulo} ${input.contenido}`);
  const tipo = detectarTipo(textoPlano, input.categoria);
  const plan = PLANES[tipo];

  const ordenNarrativo: NarrativeBlock[] = plan.orden.map((b, i) => ({
    orden: i + 1,
    tipo: b.tipo,
    descripcion: b.descripcion,
    queIncluir: b.queIncluir,
  }));

  const score = computeScore(tipo, textoPlano);

  return {
    tipo,
    tipoLabel: TIPO_LABELS[tipo],
    enfoque: plan.enfoque,
    ordenNarrativo,
    explicacionesServicio: plan.explicacionesServicio,
    frasesProhibidas: plan.frasesProhibidas,
    anguloNI: plan.anguloNI,
    proposito: plan.proposito,
    queNoHacer: plan.queNoHacer,
    score,
  };
}
