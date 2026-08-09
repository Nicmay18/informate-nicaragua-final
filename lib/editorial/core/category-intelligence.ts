/**
 * MENI Category Intelligence
 * ==========================
 * Capa declarativa que define, por categoría, qué preguntas debe responder
 * una noticia para ser útil para el lector nicaragüense. El scorer la consume
 * a través del EditorialProfile; no hay lógica condicional aquí.
 */

import type { EditorialProfile } from './types';

type ProfileFields = Pick<
  EditorialProfile,
  'requiredEvidence' | 'requiredContext' | 'requiredUtility' | 'forbiddenQuestions' | 'forbiddenRecommendations' | 'sugerenciasBase'
>;

const INTELLIGENCE: Record<string, ProfileFields> = {
  Sucesos: {
    requiredEvidence: {
      'qué pasó':    /\b(?:ocurri[oó]|sucedi[oó]|incidente|accidente|robo|hurto|incautaci[oó]n|decomis[oa]|incendio|colisi[oó]n|explosi[oó]n|fuga|hallazgo|pelea|altercado|atropell[oa]|ahogad[oa]|sumersi[oó]n|disparo|lesion[oa]|fallecid[oa]|v[ií]ctima|detenid[oa]|capturad[oa])\b/i,
      'dónde':       /\b(?:barrio|colonia|carretera|ruta|km\s+\d+|municipio|departamento|comunidad|zona|sector|calle|avenida|entrada|rotonda|puente|intersecci[oó]n)\b/i,
      'cuándo':      /\b(?:\d{1,2}\s+de\s+\w+|\d{1,2}:\d{2}|madrugada|mañana|tarde|noche|anoche|ayer|hoy|antier|horas?\s+de\s+la|s[aá]bado|domingo|lunes|martes|mi[eé]rcoles|jueves|viernes)\b/i,
      'cómo ocurrió': /\b(?:testigos?|seg[uú]n|versiones?|de acuerdo|informaci[oó]n preliminar|circunstancias?|presuntamente|aparentemente|motivo|causa)\b/i,
      'estado actual': /\b(?:investigaci[oó]n|pesquisas|seguimiento|b[uú]squeda|operativo|proceso|diligencias|peritaje|autopsia|expediente)\b/i,
      'impacto':     /\b(?:herid[oa]s?|fallecid[oa]s?|afectad[oa]s?|damnificad[oa]s?|evacuad[oa]s?|v[ií]ctimas?|p[eé]rdidas?|da[nñ]os?|lesiones?|detenid[oa]s?)\b/i,
    },
    requiredContext: {
      tipo: 'antecedentes o prevención del suceso',
      patrones: [
        /\b(?:antecedentes?|contexto|similar|precedente|prevenci[oó]n|medidas?|recomendaciones?|evitar|cuidado|alerta)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['qué pasó', 'dónde', 'cuándo', 'cómo ocurrió', 'estado actual', 'impacto'] },
    forbiddenQuestions: ['delito', 'cargos penales', 'expediente judicial', 'sentencia', 'trámite migratorio'],
    forbiddenRecommendations: ['solicitar asilo', 'presentar denuncia penal', 'contratar abogado'],
    sugerenciasBase: {
      oportunidades: ['Citar fuente oficial sobre el estado de las víctimas.', 'Incluir hora, ruta y número de afectados.', 'Agregar contexto de incidentes similares.'],
      convertirReferencia: ['Citar parte oficial cuando exista.', 'Construir cronología con horas verificables.', 'Actualizar con nuevos datos oficiales.'],
      nivel10: ['Mapa de incidentes por zona.', 'Guía de prevención.'],
    },
  },

  Internacionales: {
    requiredEvidence: {
      'por qué importa a Nicaragua': /\b(?:Nicaragua|nicarag[uü]ense|centroam[eé]rica|regi[oó]n|pa[ií]s|impacto\s+(?:en|para)|afecta\s+a|implica\s+para|repercusi[oó]n)\b/i,
      'qué pasó':    /\b(?:acuerd[oaó]|firm[oaó]|anunci[oaó]|decidi[oó]|report[oaó]|cumbre|reuni[oó]n|negociaci[oó]n|tratado|resoluci[oó]n|designaci[oó]n|sanci[oó]n|deportaci[oó]n|expulsi[oó]n|medida|pol[ií]tica|conflicto)\b/i,
      'quiénes o qué países': /\b(?:ONU|Naciones\s+Unidas|UE|Uni[oó]n\s+Europea|G20|OTAN|FMI|OMS|UNESCO|ACNUR|FAO|OEA|Estados\s+Unidos|EE\.?UU\.?|M[eé]xico|Guatemala|Honduras|El\s+Salvador|Costa\s+Rica|Panam[aá]|Brasil|Argentina|Colombia|Venezuela|España|Francia|Alemania|Jap[oó]n|China|Rusia|India)\b/i,
      'qué cambia':  /\b(?:cambia|entra\s+en\s+vigor|vigencia|aplica|modifica|reforma|nuevo|anterior|diferencia|implicaciones?|consecuencias?)\b/i,
      'antecedentes': /\b(?:tras|despu[eé]s\s+de|durante|en\s+el\s+marco\s+de|hist[oó]ricamente|anteriormente|previamente|en\s+202[4-9]|desde\s+202[0-9])\b/i,
    },
    requiredContext: {
      tipo: 'impacto regional o para Nicaragua',
      patrones: [
        /\b(?:impacto\s+(?:regional|en\s+Nicaragua|para\s+Nicaragua)|repercusi[oó]n|relaciones\s+bilaterales|cooperaci[oó]n|migraci[oó]n|comercio|frontera|remesas?)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['por qué importa a Nicaragua', 'qué pasó', 'quiénes o qué países', 'qué cambia', 'antecedentes'] },
    forbiddenQuestions: ['delito', 'quién fue detenido', 'cuáles son los cargos', 'expediente local', 'trámite nacional'],
    forbiddenRecommendations: ['ir al lugar', 'solicitar expediente local', 'entrevistar testigos'],
    sugerenciasBase: {
      oportunidades: ['Explicar por qué importa a Nicaragua.', 'Incluir cifras del acuerdo o reporte.', 'Contrastar con postura de Nicaragua o Centroamérica.'],
      convertirReferencia: ['Incluir reacción regional.', 'Contextualizar con antecedentes.', 'Explicar cambios concretos para el lector.'],
      nivel10: ['Infografía del acuerdo.', 'Línea de tiempo de relaciones.'],
    },
  },

  Deportes: {
    requiredEvidence: {
      'qué significa': /\b(?:significa|implica|representa|hist[oó]rico|primera\s+vez|r[eé]cord|marca|logro|clasificaci[oó]n|eliminatoria)\b/i,
      'quién o qué equipo': /\b(?:selecci[oó]n|equipo|jugador[oa]?|atleta|[aá]rbitro|entrenador|FIFA|FIBA|FENIBAL|FENIFUT| Nicaragua)\b/i,
      'próximo rival o desafío': /\b(?:pr[oó]ximo|rival|siguiente|partido|encuentro|fecha|etapa|ronda|eliminatoria|torneo)\b/i,
      'consecuencias': /\b(?:consecuencia|clasificaci[oó]n|puntaje|tabla|posici[oó]n|semifinal|final|octavos|cuartos|mundial|olimp[ií]pic[oa])\b/i,
      'cifras o datos': /\b(?:\d+\s*(?:a\s+\d+|–\d+|:\d+)|marcador|goles?|puntos?|sets?|minutos?| kilometraje|medallas?)\b/i,
    },
    requiredContext: {
      tipo: 'antecedentes deportivos',
      patrones: [
        /\b(?:hist[oó]rico|anteriormente|pasada\s+edici[oó]n|edici[oó]n\s+anterior|racha|invict[oa]|r[eé]cord|trayectoria)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['qué significa', 'quién o qué equipo', 'próximo rival o desafío', 'consecuencias', 'cifras o datos'] },
    forbiddenQuestions: ['víctimas', 'heridos', 'investigación policial', 'delito', 'detenido'],
    forbiddenRecommendations: ['llamar a emergencias', 'evacuar', 'presentar denuncia'],
    sugerenciasBase: {
      oportunidades: ['Explicar por qué el logro es histórico para Nicaragua.', 'Incluir datos de la competencia.', 'Mencionar próximo rival o etapa.'],
      convertirReferencia: ['Agregar declaraciones del atleta o entrenador.', 'Contextualizar con antecedentes del equipo.', 'Explicar consecuencias para la clasificación.'],
      nivel10: ['Cuadro de posiciones.', 'Calendario de próximos partidos.'],
    },
  },

  Espectaculos: {
    requiredEvidence: {
      'qué es':        /\b(?:concierto|festival|cine|pel[ií]cula|obra|teatro|exposici[oó]n|evento|presentaci[oó]n|lanzamiento|estreno|gira|banda|cantante|artista|actor|actriz)\b/i,
      'dónde':         /\b(?:lugar|ubicaci[oó]n|sala|cine|teatro|estadio|plaza|parque|ciudad|Managua|Le[oó]n|Granada|Masaya|Estel[ií]|Bluefields|Rivas)\b/i,
      'cuándo':        /\b(?:\d{1,2}\s+de\s+\w+|\d{1,2}:\d{2}|s[aá]bado|domingo|lunes|martes|mi[eé]rcoles|jueves|viernes|pr[oó]ximo|esta\s+semana|fin\s+de\s+semana|agosto|septiembre|octubre|noviembre|diciembre)\b/i,
      'cuánto cuesta': /\b(?:C?\$[\d.,]+|\d+\s*(?:c[oó]rdobas?|d[oó]lares?)|precio|costo|entrada|boleto|tarifa|gratuito|gratis|descuento)\b/i,
      'vale la pena':  /\b(?:vale\s+la\s+pena|recomendaci[oó]n|recomienda|opini[oó]n|cr[ií]tica|rese[nñ]a|destacad[oa]|imperdible)\b/i,
    },
    requiredContext: {
      tipo: 'recomendación o contexto del evento',
      patrones: [
        /\b(?:recomendaciones?|qu[eé]\s+esperar|c[oó]mo\s+llegar|horario|edad|p[uú]blico|familia|art[ií]stas?|invitad[oa]s?)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['qué es', 'dónde', 'cuándo', 'cuánto cuesta', 'vale la pena'] },
    forbiddenQuestions: ['investigación policial', 'víctimas', 'delito', 'detenido'],
    forbiddenRecommendations: ['llamar a la policía', 'evacuar el lugar'],
    sugerenciasBase: {
      oportunidades: ['Incluir horarios exactos y lugar.', 'Mencionar precios o si es gratuito.', 'Agregar recomendación para el público.'],
      convertirReferencia: ['Entrevistar o citar a los organizadores.', 'Explicar acceso y estacionamiento.', 'Incluir reseña o contexto artístico.'],
      nivel10: ['Lista de funciones o fechas.', 'Galería de artistas.'],
    },
  },

  Economia: {
    requiredEvidence: {
      'cuánto cambia': /\b(?:C?\$[\d.,]+|\d+\s*(?:millones|mil|billones|por\s+ciento|%|\%)?|inflaci[oó]n|precio|tasa|devaluaci[oó]n|aumento|disminuci[oó]n|sube|baja|crecimiento|PIB)\b/i,
      'quién gana':    /\b(?:beneficia|gana|ventaja|oprtunidad|inversi[oó]n|empresa|sector|exportador|productor|turismo|empleo)\b/i,
      'quién pierde':  /\b(?:perjudica|pierde|p[eé]rdida|impacto\s+negativo|costo|canasta\s+b[aá]sica|salario|gasolina|transporte)\b/i,
      'impacto al bolsillo': /\b(?:bolsillo|consumidor|familia|hogar|precio\s+final|costo\s+de\s+vida|alimentos|vivienda|transporte|combustible)\b/i,
      'qué cambia':   /\b(?:nuevo|reforma|medida|pol[ií]tica|decreto|resoluci[oó]n|vigencia|aplica|entra\s+en\s+vigor)\b/i,
    },
    requiredContext: {
      tipo: 'contexto macroeconómico o histórico',
      patrones: [
        /\b(?:contexto\s+econ[oó]mico|macroecon[oó]mico|tendencia|hist[oó]rico|comparaci[oó]n|anual|mensual|acumulado|interanual)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['cuánto cambia', 'quién gana', 'quién pierde', 'impacto al bolsillo', 'qué cambia'] },
    forbiddenQuestions: ['delito', 'detenido', 'víctimas', 'investigación policial'],
    forbiddenRecommendations: ['evacuar', 'llamar a emergencias'],
    sugerenciasBase: {
      oportunidades: ['Incluir cifras concretas de cambio.', 'Explicar quién gana y quién pierde.', 'Relacionar con el bolsillo del lector.'],
      convertirReferencia: ['Contextualizar con datos históricos.', 'Citar fuente oficial (BCN, MIFIC).', 'Comparar con meses o a[nñ]os anteriores.'],
      nivel10: ['Gráfica de evolución de precios.', 'Calculadora de impacto.'],
    },
  },

  Tecnologia: {
    requiredEvidence: {
      'qué es':        /\b(?:smartphone|laptop|tablet|app|aplicaci[oó]n|software|hardware|chip|procesador|RAM|GB|MB|GHz|pulgadas|5G|IA|inteligencia\s+artificial|ciberseguridad|internet|red\s+social|streaming|robot|algoritmo)\b/i,
      'especificaciones': /\b(?:\d+\s*(?:GB|MB|GHz|RAM|pulgadas|MP|mAh|n[úu]cleos)|procesador|c[aá]mara|pantalla|bater[ií]a|almacenamiento|resoluci[oó]n)\b/i,
      'precio o disponibilidad': /\b(?:C?\$[\d.,]+|precio|costo|disponible|venta|preventa|stock|lanzamiento|comprar)\b/i,
      'quién se beneficia': /\b(?:usuario|consumidor|empresa|pyme|sector|educaci[oó]n|salud|gobierno|ventaja|beneficio)\b/i,
      'cómo se usa':   /\b(?:c[oó]mo\s+usar|tutorial|paso\s+a\s+paso|configurar|instalar|activar|gu[ií]a\s+de\s+uso)\b/i,
    },
    requiredContext: {
      tipo: 'comparación o evolución tecnológica',
      patrones: [
        /\b(?:comparaci[oó]n|vs\.?|anterior|versi[oó]n\s+anterior|modelo\s+anterior|mejora|novedad|lanzamiento\s+previo)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['qué es', 'especificaciones', 'precio o disponibilidad', 'quién se beneficia', 'cómo se usa'] },
    forbiddenQuestions: ['delito', 'detenido', 'víctimas'],
    forbiddenRecommendations: ['llamar a la policía', 'evacuar'],
    sugerenciasBase: {
      oportunidades: ['Incluir especificaciones técnicas.', 'Mencionar precio o disponibilidad en Nicaragua.', 'Explicar quién se beneficia.'],
      convertirReferencia: ['Comparar con versión anterior.', 'Agregar guía de uso rápido.', 'Citar fuentes oficiales de la marca.'],
      nivel10: ['Tabla de especificaciones.', 'Video-tutorial embebido.'],
    },
  },

  Salud: {
    requiredEvidence: {
      'qué es':        /\b(?:enfermedad|condici[oó]n|s[ií]ntomas?|diagn[oó]stico|tratamiento|vacuna|brote|casos?|pacientes?|MINSa|hospital)\b/i,
      'cifras':        /\b(?:\d+\s*(?:casos?|personas?|muertes?|dosis|por\s+ciento|%|m[eé]dicos?|camas?)|C?\$[\d.,]+)\b/i,
      'dónde aplica':  /\b(?:Managua|Le[oó]n|Granada|Masaya|Estel[ií]|Jinotega|Matagalpa|Chinandega|Carazo|Rivas|Boaco|Chontales|Nueva\s+Segovia|Madriz|R[ií]o\s+San\s+Juan|RACCS|RACCN|departamento|municipio|centro\s+de\s+salud|hospital|cl[ií]nica)\b/i,
      'qué hacer':     /\b(?:qu[eé]\s+hacer|c[oó]mo\s+actuar|prevenci[oó]n|medidas?|recomendaciones?|consejos?|sintomatolog[ií]a|cu[aá]ndo\s+acudir)\b/i,
      'quién lo dijo': /\b(?:MINSa|ministerio\s+de\s+salud|m[eé]dic[oa]|epidemi[oó]log[oa]|OPS|OMS|especialista|director[oa]|autoridad)\b/i,
    },
    requiredContext: {
      tipo: 'contexto epidemiológico o histórico',
      patrones: [
        /\b(?:tendencia|aumento|disminuci[oó]n|comparado|semana\s+anterior|mes\s+anterior|a[nñ]o\s+pasado|ciclo|temporada)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['qué es', 'cifras', 'dónde aplica', 'qué hacer', 'quién lo dijo'] },
    forbiddenQuestions: ['delito', 'detenido', 'investigación policial'],
    forbiddenRecommendations: ['solicitar asilo', 'evacuar'],
    sugerenciasBase: {
      oportunidades: ['Citar fuente oficial (MINSa, OPS, OMS).', 'Incluir cifras actualizadas.', 'Agregar recomendaciones de prevención.'],
      convertirReferencia: ['Contextualizar con tendencia epidemiológica.', 'Explicar dónde aplica en Nicaragua.', 'Señalar cuándo acudir al médico.'],
      nivel10: ['Mapa de casos por departamento.', 'Infografía de prevención.'],
    },
  },

  Politica: {
    requiredEvidence: {
      'qué pasó':      /\b(?:gobierno|presidente|vicepresidente|ministro|asamblea\s+nacional|diputad[oa]|decreto|ley|iniciativa|reforma|elecciones|comicios|campa[nñ]a|votaci[oó]n|CSE|Consejo\s+Supremo\s+Electoral)\b/i,
      'quién impulsa': /\b(?:presidente|vicepresidente|ministro|diputad[oa]|oficialismo|oposici[oó]n|partido|alianza|coalici[oó]n|bancada|magistrad[oa])\b/i,
      'qué dice la oposición o expertos': /\b(?:oposici[oó]n|rechazo|apoyo|cr[ií]tica|expert[oa]|analista|opini[oó]n|postura|posici[oó]n)\b/i,
      'qué cambia':   /\b(?:cambia|entra\s+en\s+vigor|vigencia|aplica|modifica|reforma|nuevo|anterior|diferencia|implicaciones?|consecuencias?)\b/i,
      'contexto legal': /\b(?:ley|decreto|tr[aá]mite|marco\s+jur[ií]dico|reglamento|legislaci[oó]n|normativa|constituci[oó]n)\b/i,
    },
    requiredContext: {
      tipo: 'contexto político o histórico',
      patrones: [
        /\b(?:contexto\s+pol[ií]tico|antecedente|hist[oó]ricamente|relaci[oó]n|tensión|negociaci[oó]n|acuerdo|disputa)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['qué pasó', 'quién impulsa', 'qué dice la oposición o expertos', 'qué cambia', 'contexto legal'] },
    forbiddenQuestions: ['delito', 'detenido', 'investigación policial'],
    forbiddenRecommendations: ['evacuar', 'llamar a emergencias'],
    sugerenciasBase: {
      oportunidades: ['Citar fuente oficial o documento.', 'Incluir posición de la oposición o expertos.', 'Explicar el cambio concreto.'],
      convertirReferencia: ['Contextualizar con antecedentes políticos.', 'Comparar con leyes anteriores.', 'Agregar cronología del trámite.'],
      nivel10: ['Cronograma legislativo.', 'Mapa de posiciones partidarias.'],
    },
  },

  Nacionales: {
    requiredEvidence: {
      'qué anunció el gobierno o institución': /\b(?:gobierno|ministerio|programa|plan|inauguraci[oó]n|obra|infraestructura|carretera|vivienda|educaci[oó]n|MINED|energ[ií]a|ENATREL|agua\s+potable|ENACAL|reforestaci[oó]n|MARENA|producci[oó]n|agropecuario|MAG|cooperaci[oó]n|beca|censo|INEC)\b/i,
      'cifras':        /\b(?:\d+\s*(?:millones|mil|beneficiarios?|personas?|familias?|casas?|km|hect[aá]reas|escuelas?|hospitales?)|C?\$[\d.,]+)\b/i,
      'dónde aplica':  /\b(?:Managua|departamento|municipio|comunidad|barrio|zona|rural|urbana|regi[oó]n|carretera|km\s+\d+)\b/i,
      'quién lo dijo': /\b(?:ministro|viceministro|copresidente|alcald[ea]|director[oa]|autoridad|instituci[oó]n|oficial|gobierno)\b/i,
      'qué cambia':   /\b(?:cambia|entra\s+en\s+vigor|vigencia|aplica|modifica|nuevo|anterior|diferencia|implicaciones?|consecuencias?)\b/i,
    },
    requiredContext: {
      tipo: 'contexto nacional o histórico',
      patrones: [
        /\b(?:antecedente|contexto\s+nacional|pol[ií]tica\s+p[uú]blica|plan\s+nacional|hist[oó]rico|comparaci[oó]n|anterior)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['qué anunció el gobierno o institución', 'cifras', 'dónde aplica', 'quién lo dijo', 'qué cambia'] },
    forbiddenQuestions: ['delito', 'detenido', 'investigación policial'],
    forbiddenRecommendations: ['evacuar', 'llamar a emergencias'],
    sugerenciasBase: {
      oportunidades: ['Citar fuente oficial.', 'Incluir cifras y lugar de aplicación.', 'Explicar cambio para el ciudadano.'],
      convertirReferencia: ['Contextualizar con planes anteriores.', 'Agregar reacciones ciudadanas.', 'Especificar alcance geográfico.'],
      nivel10: ['Mapa de obras por departamento.', 'Tabla de beneficiarios.'],
    },
  },

  Clima: {
    requiredEvidence: {
      'qué fenómeno': /\b(?:hurac[aá]n|tormenta|depresi[oó]n\s+tropical|lluvia|sequ[ií]a|inundaci[oó]n|temperatura|calor|fr[ií]o|viento|marea|sismo|terremoto|volc[aá]n|alerta)\b/i,
      'dónde':        /\b(?:Managua|departamento|municipio|comunidad|r[ií]o|cuenca|laguna|lago|costa|pac[ií]fico|caribe|volc[aá]n|reservorio|presa)\b/i,
      'cuándo':       /\b(?:\d{1,2}\s+de\s+\w+|\d{1,2}:\d{2}|madrugada|mañana|tarde|noche|s[aá]bado|domingo|lunes|martes|mi[eé]rcoles|jueves|viernes|pr[oó]ximo|hasta)\b/i,
      'afectados o impacto': /\b(?:herid[oa]s?|fallecid[oa]s?|afectad[oa]s?|damnificad[oa]s?|evacuad[oa]s?|v[ií]ctimas?|p[eé]rdidas?|da[nñ]os?|comunidades?|familias?)\b/i,
      'qué hacer o recomendaciones': /\b(?:recomienda|recomendaciones?|qu[eé]\s+hacer|c[oó]mo\s+prepararse|medidas?|precauci[oó]n|evacuar|albergue|SINAPRED|COMUPRED|INETER)\b/i,
    },
    requiredContext: {
      tipo: 'contexto climático o histórico',
      patrones: [
        /\b(?:hist[oó]rico|anterior|temporada|comparado|a[nñ]o\s+pasado|pron[oó]stico|tendencia|ciclo)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['qué fenómeno', 'dónde', 'cuándo', 'afectados o impacto', 'qué hacer o recomendaciones'] },
    forbiddenQuestions: ['delito', 'detenido', 'investigación policial'],
    forbiddenRecommendations: ['presentar denuncia', 'solicitar asilo'],
    sugerenciasBase: {
      oportunidades: ['Citar INETER o SINAPRED.', 'Incluir zonas afectadas.', 'Agregar recomendaciones de prevención.'],
      convertirReferencia: ['Contextualizar con temporadas anteriores.', 'Explicar alertas activas.', 'Actualizar con nuevos pronósticos.'],
      nivel10: ['Mapa de alertas.', 'Cronograma de lluvias.'],
    },
  },

  Servicio: {
    requiredEvidence: {
      'qué trámite o servicio': /\b(?:tr[aá]mite|servicio|procedimiento|paso\s+a\s+paso|gu[ií]a|requisitos?|documentos?|instrucciones?|c[oó]mo\s+hacer)\b/i,
      'dónde':         /\b(?:direcci[oó]n|oficina|sucursal|municipio|departamento|en\s+l[ií]nea|en\s+l[ií]nea|plataforma|sitio\s+web)\b/i,
      'cuánto cuesta o tiempo': /\b(?:C?\$[\d.,]+|gratuito|gratis|costo|tarifa|pago|d[ií]as\s+h[aá]biles|plazo|tiempo\s+estimado)\b/i,
      'requisitos':    /\b(?:requisitos?|documentos?\s+necesarios?|se\s+requiere|debe\s+presentar|pasos?)\b/i,
      'contacto':      /\b(?:tel[eé]fono|whatsapp|correo|email|redes?\s+sociales?|atenci[oó]n\s+al\s+cliente)\b/i,
    },
    requiredContext: {
      tipo: 'contexto o vigencia del trámite',
      patrones: [
        /\b(?:vigencia|v[aá]lido\s+hasta|resoluci[oó]n|decreto|acuerdo|normativa|requisito\s+previo)\b/i,
      ],
    },
    requiredUtility: { preguntas: ['qué trámite o servicio', 'dónde', 'cuánto cuesta o tiempo', 'requisitos', 'contacto'] },
    forbiddenQuestions: ['delito', 'detenido', 'investigación policial'],
    forbiddenRecommendations: ['evacuar', 'llamar a emergencias'],
    sugerenciasBase: {
      oportunidades: ['Listar requisitos claros.', 'Incluir costos y tiempos.', 'Agregar datos de contacto.'],
      convertirReferencia: ['Explicar vigencia o cambios recientes.', 'Incluir enlace a formulario oficial.', 'Mencionar excepciones.'],
      nivel10: ['Checklist descargable.', 'Video tutorial.'],
    },
  },

  Cultura: {
    requiredEvidence: {
      'qué actividad': /\b(?:festival|fiesta|celebraci[oó]n|tradici[oó]n|patrimonio|obra|teatro|danza|literatura|poes[ií]a|artesan[ií]a|gastronom[ií]a|ritual|manifestaci[oó]n|exposici[oó]n|galer[ií]a|museo|comida\s+t[ií]pica|platillo)\b/i,
      'quién o qué grupo': /\b(?:artista|artesano|escritor|poeta|m[uú]sico|bailar[ií]n|colectivo|comunidad|familia|organizador|protagonista)\b/i,
      'dónde y cuándo': /\b(?:municipio|departamento|barrio|comunidad|plaza|iglesia|centro\s+cultural|galer[ií]a|museo|teatro|ciudad|Managua|Le[oó]n|Granada|Masaya|Estel[ií]|Jinotega|Matagalpa|Chinandega|Carazo|Rivas|\d{1,2}\s+de\s+\w+|s[aá]bado|domingo|viernes)\b/i,
      'significado o historia': /\b(?:significa|significado|historia|origen|patrimonio|identidad|reconocimiento|valor\s+cultural|relevancia|impacto\s+cultural|ancestral|generaciones)\b/i,
      'cómo asistir o participar': /\b(?:c[oó]mo\s+asistir|c[oó]mo\s+participar|entrada|acceso|horario|ubicaci[oó]n|lugar|cu[aá]nto\s+cuesta|gratuito|gratis)\b/i,
    },
    requiredContext: {
      tipo: 'contexto histórico o identitario',
      patrones: [/\b(?:historia|origen|patrimonio|ancestral|colonial|prehisp[aá]nico|tradici[oó]n|generaciones|identidad)\b/i],
    },
    requiredUtility: { preguntas: ['qué actividad', 'quién o qué grupo', 'dónde y cuándo', 'significado o historia', 'cómo asistir o participar'] },
    forbiddenQuestions: ['qué fenómeno', 'qué hacer o recomendaciones según perfil clima', 'contexto climático', 'cuánto subió o bajó', 'impacto en presupuesto familiar'],
    forbiddenRecommendations: ['inventar especialistas', 'inventar estadísticas'],
    sugerenciasBase: {
      oportunidades: ['Incluir qué actividad es, su significado y quién participa.', 'Mencionar lugar, fecha y cómo asistir.', 'Conectar con identidad nicaragüense.'],
      convertirReferencia: ['Contextualizar historia del evento o tradición.', 'Citar a protagonistas o artesanos.', 'Explicar relevancia territorial.'],
      nivel10: ['Galería del evento.', 'Crónica del proceso creativo o tradicional.'],
    },
  },

  Turismo: {
    requiredEvidence: {
      'destino o atractivo': /\b(?:mirador|mirador\s+de|catarina|volc[aá]n|isla|playa|reserva|parque|laguna|laguna\s+de|cerro|museo|centro\s+hist[oó]rico|catedral|iglesia|mercado|malec[oó]n|puerto|ruta\s+tur[ií]stica|destino\s+tur[ií]stico)\b/i,
      'ubicación': /\b(?:Managua|Le[oó]n|Granada|Masaya|Estel[ií]|Jinotega|Matagalpa|Chinandega|Carazo|Rivas|Boaco|Chontales|Nueva\s+Segovia|Madriz|R[ií]o\s+San\s+Juan|RACCS|RACCN|municipio|departamento|comunidad|barrio|km\s+\d+)\b/i,
      'cómo llegar o acceso': /\b(?:c[oó]mo\s+llegar|direcci[oó]n|desde|carretera|ruta|entrada|acceso|se\s+llega|llegar)\b/i,
      'horarios o condiciones': /\b(?:horario|hora|abre|cierra|lunes\s+a\s+domingo|todos\s+los\s+dias|de\s+\d+\s+a\s+\d+|condici[oó]n|recomendaci[oó]n\s+de\s+visita)\b/i,
      'precios o costos': /\b(?:C?\$[\d.,]+|\d+\s*(?:c[oó]rdobas?|d[oó]lares?)|precio|costo|entrada|boleto|tarifa|gratuito|gratis)\b/i,
      'actividades o servicios': /\b(?:actividad|actividades|qu[eé]\s+hacer|qu[eé]\s+ver|atractivo|tour|recorrido|senderismo|caminata|nadar|observaci[oó]n|avistamiento|degustaci[oó]n|restaurante|cafeter[ií]a|baño|estacionamiento|gu[ií]a)\b/i,
    },
    requiredContext: {
      tipo: 'historia o atractivo del destino',
      patrones: [/\b(?:historia|tradici[oó]n|patrimonio|cultura|naturaleza|panorama|vista|origen|fundado|siglo)\b/i],
    },
    requiredUtility: { preguntas: ['destino o atractivo', 'ubicación', 'cómo llegar o acceso', 'horarios o condiciones', 'precios o costos', 'actividades o servicios'] },
    forbiddenQuestions: ['qué fenómeno', 'cuánto subió o bajó', 'impacto en presupuesto familiar', 'qué institución interviene'],
    forbiddenRecommendations: ['invertir sin verificar', 'comprar paquete no confirmado'],
    sugerenciasBase: {
      oportunidades: ['Incluir ubicación exacta y cómo llegar.', 'Verificar horarios y precios actuales.', 'Mencionar servicios disponibles.'],
      convertirReferencia: ['Agregar recomendaciones prácticas para el visitante.', 'Incluir advertencias sobre condiciones de acceso.', 'Citar la fuente de precios y horarios.'],
      nivel10: ['Mapa de acceso.', 'Checklist para el visitante.'],
    },
  },
};

export function getCategoryProfileFields(categoria: string): ProfileFields | null {
  const normalizada = categoria
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  for (const [key, fields] of Object.entries(INTELLIGENCE)) {
    if (key.toLowerCase() === normalizada) return fields;
  }
  return null;
}
