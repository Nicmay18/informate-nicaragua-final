/**
 * MENI Editorial Profiles v2.0
 * ================================
 * Cada tipo de noticia tiene sus propios criterios de evaluación.
 * No hay plantilla universal.
 */

export interface EditorialCriterios {
  /** Nombre canónico detectado */
  tipo: string;
  /** Descripción del lector ideal y su intención */
  intencionLector: string;
  /** Preguntas que el contenido debe responder para aprobar */
  preguntasObligatorias: string[];
  /** RegExp para detectar contexto en el texto */
  contexto: RegExp[];
  /** RegExp para detectar explicación en el texto */
  explicacion: RegExp[];
  /** RegExp para detectar servicio/valor práctico en el texto */
  servicio: RegExp[];
  /** Si la ausencia de respuesta bloquea la nota */
  bloqueaPorServicio: boolean;
  /** Si se exige contexto histórico/antecedentes */
  exigeContexto: boolean;
  /** Si se exige valor diferencial comparado con la competencia */
  exigeDiferencial: boolean;
  /** Longitud mínima recomendada (palabras) */
  minPalabras: number;
  /** Mensaje cuando falla el servicio */
  mensajeServicioFaltante: string;
}

export const CATEGORIAS_EDITORIALES: Record<string, EditorialCriterios> = {
  Sucesos: {
    tipo: 'sucesos',
    intencionLector: 'Saber qué ocurrió, dónde, cuándo, quiénes intervienen y qué hacen las autoridades.',
    preguntasObligatorias: [
      '¿Qué ocurrió?',
      '¿Dónde y cuándo?',
      '¿Quién fue detenido o afectado?',
      '¿Cuáles son los cargos o consecuencias?',
      '¿Qué dice el proceso legal o las autoridades?',
    ],
    contexto: [
      /\bantecedente|previo|anterior|historia|registro|tendencia|patr[oó]n\b/i,
      /\bporqu[eé]|debido a|como resultado|causa|motivo|circunstancia|origen\b/i,
      /\binvestigaci[oó]n|pesquisa|operativo|seguimiento|b[uú]squeda\b/i,
    ],
    explicacion: [
      /\bqu[eé]\s+ocurri[oó]|qu[eé]\s+pas[oó]|c[oó]mo\s+sucedi[oó]\b/i,
      /\binvestiga\s+la\s+polic[ií]a|qu[eé]\s+falta\s+por\s+conocer\b/i,
      /\bcausa|motivo|circunstancias|antecedentes|prevenci[oó]n\b/i,
      /\bafecta\s+a\s+la\s+comunidad|impacto\s+en\s+la\s+zona\b/i,
    ],
    servicio: [
      /\bprevenci[oó]n|recomendaci[oó]n|qu[eé]\s+hacer|c[oó]mo\s+actuar\b/i,
      /\bautoridades\s+(informaron|indicaron|explicaron|dijeron)\b/i,
      /\bemergencia|n[uú]mero|tel[eé]fono|denuncia|reportar\b/i,
    ],
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    mensajeServicioFaltante:
      'La nota de sucesos no responde qué ocurrió, quién fue detenido, cuáles son los cargos o qué dicen las autoridades.',
  },
  Politica: {
    tipo: 'política',
    intencionLector: 'Entender la decisión, quién la tomó, a quién afecta y qué cambia.',
    preguntasObligatorias: [
      '¿Qué decidieron?',
      '¿Quién lo anunció?',
      '¿A quién afecta?',
      '¿Qué cambia en la práctica?',
      '¿Qué dicen las partes?',
    ],
    contexto: [
      /\bantecedente|contexto|marco|historia|anterior|legislaci[oó]n|normativa\b/i,
      /\bdebate|discusi[oó]n|postura|oposici[oó]n|oficialismo\b/i,
      /\bproyecto|ley|decreto|acuerdo|pol[ií]tica\s+p[uú]blica\b/i,
    ],
    explicacion: [
      /\bqu[eé]\s+decidieron|qu[eé]\s+se\s+aprob[oó]|qu[eé]\s+cambia\b/i,
      /\bqui[eé]n\s+lo\s+anunci[oó]|a\s+qui[eé]n\s+afecta|c[oó]mo\s+se\s+aplica\b/i,
      /\bconsecuencia|impacto|alcance|beneficio|repercusión\b/i,
    ],
    servicio: [
      /\bqu[eé]\s+cambia\s+para|c[oó]mo\s+afecta\s+a|qu[eé]\s+debo\s+saber\b/i,
      /\btr[aá]mite|requisito|d[oó]nde\s+acudir|c[oó]mo\s+acceder\b/i,
      /\boposici[oó]n|oficialismo|reacci[oó]n|postura\b/i,
    ],
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: true,
    minPalabras: 250,
    mensajeServicioFaltante:
      'La nota política no explica qué decidieron, a quién afecta ni qué cambia para el lector.',
  },
  Economia: {
    tipo: 'economía',
    intencionLector: 'Conocer el dato económico, su magnitud, impacto en precios, bolsillo y qué esperar.',
    preguntasObligatorias: [
      '¿Cuál es el dato o medida?',
      '¿Quién lo anunció?',
      '¿Cómo afecta precios o salarios?',
      '¿Qué significa para el bolsillo?',
      '¿Cuándo entra en vigor?',
    ],
    contexto: [
      /\bantecedente|tendencia|hist[oó]rico|comparaci[oó]n|variaci[oó]n|anterior\b/i,
      /\binflaci[oó]n|devaluaci[oó]n|tipos\s+de\s+cambio|reservas|d[eé]ficit|super[aá]vit\b/i,
      /\bmercado|sector|industria|exportaci[oó]n|importaci[oó]n\b/i,
    ],
    explicacion: [
      /\bcu[aá]l\s+es\s+el\s+dato|qu[eé]\s+significa\s+el\s+n[uú]mero|en\s+qu[eé]\s+cambia\b/i,
      /\bc[oó]mo\s+impacta|a\s+qui[eé]n\s+afecta|qu[eé]\s+pasar[aá]\s+con\s+los\s+precios\b/i,
      /\bmagnitud|escala|porcentaje|cantidad|monto|presupuesto\b/i,
    ],
    servicio: [
      /\bc[oó]mo\s+me\s+afecta|qu[eé]\s+hacer|cu[aá]ndo\s+entra\s+en\s+vigor\b/i,
      /\bprecios|salarios|bolsillo|cartera|gastos|recomendaci[oó]n\b/i,
      /\btr[aá]mite|requisito|beneficio|exenci[oó]n|deducci[oó]n\b/i,
    ],
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    mensajeServicioFaltante:
      'La nota económica no explica cuál es el dato, cómo impacta el bolsillo ni qué cambia prácticamente.',
  },
  Nacionales: {
    tipo: 'nacionales',
    intencionLector: 'Saber la decisión o hecho nacional, quién interviene, dónde ocurre y qué implica para Nicaragua.',
    preguntasObligatorias: [
      '¿Qué anunciaron ocurrió?',
      '¿Quién está involucrado?',
      '¿Dónde y cuándo?',
      '¿Qué significa para el ciudadano?',
    ],
    contexto: [
      /\bantecedente|previo|anterior|historia|contexto|marco|referencia\b/i,
      /\bporqu[eé]|debido a|como resultado|causa|motivo|raz[oó]n\b/i,
      /\bconsecuencia|impacto|alcance|beneficio|cambio|transformaci[oó]n\b/i,
    ],
    explicacion: [
      /\bqu[eé]\s+cambia|qu[eé]\s+significa|qu[eé]\s+implica\b/i,
      /\ba\s+qui[eé]n\s+beneficia|qu[eé]\s+instituci[oó]n\s+interviene\b/i,
      /\bimpacto|alcance|instituci[oó]n|beneficiarios|cobertura\b/i,
      /\bqu[eé]\s+significa\s+para\s+nicaragua|qu[eé]\s+sigue\s+ahora\b/i,
    ],
    servicio: [
      /\bqu[eé]\s+cambia|c[oó]mo\s+afecta|qu[eé]\s+implica\b/i,
      /\bbeneficiarios|familias|comunidades|personas\s+beneficiadas\b/i,
      /\brequisitos|tr[aá]mite|c[oó]mo\s+acceder|d[oó]nde\s+acudir\b/i,
    ],
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    mensajeServicioFaltante:
      'La nota nacional no explica qué cambia, a quién afecta ni qué debe saber el ciudadano.',
  },
  Internacionales: {
    tipo: 'internacionales',
    intencionLector: 'Entender el hecho global y por qué importa para Nicaragua o la región.',
    preguntasObligatorias: [
      '¿Qué ocurrió en el mundo?',
      '¿Dónde y quiénes participan?',
      '¿Por qué importa para Nicaragua?',
      '¿Qué reacciones hay?',
    ],
    contexto: [
      /\bcontexto|antecedentes|historia|previo|anterior|referencia\b/i,
      /\bpor\s+qu[eé]\s+importa|relevancia|repercute|consecuencia\b/i,
      /\brelaci[oó]n|v[ií]nculo|acuerdo|tratado|alianza|diplom[aá]tico\b/i,
    ],
    explicacion: [
      /\bpor\s+qu[eé]\s+importa\s+en\s+nicaragua|c[oó]mo\s+repercute\b/i,
      /\bcontexto\s+global|antecedentes|qu[eé]\s+significa\b/i,
      /\brelevancia|consecuencia|impacto\s+internacional\b/i,
      /\bqu[eé]\s+significa|c[oó]mo\s+afecta|es\s+decir\b/i,
    ],
    servicio: [
      /\bc[oó]mo\s+afecta\s+a\s+nicaragua|qu[eé]\s+significa\s+para\s+el\s+pa[ií]s\b/i,
      /\brecomendaci[oó]n|precauci[oó]n|alerta|implicaci[oó]n\b/i,
    ],
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 200,
    mensajeServicioFaltante:
      'La nota internacional no explica por qué importa para Nicaragua ni qué implica para el lector.',
  },
  DeportesIndividuales: {
    tipo: 'deportes-individuales',
    intencionLector: 'Conocer al atleta, su origen, disciplina, resultado, contexto de trayectoria y próximo desafío.',
    preguntasObligatorias: [
      '¿Quién es el atleta?',
      '¿Cuál es su nacionalidad u origen?',
      '¿Qué edad tiene?',
      '¿En qué disciplina compite?',
      '¿En qué torneo o campeonato participó?',
      '¿Qué resultado obtuvo?',
      '¿Qué categoría o modalidad compite?',
      '¿Cuál es su próximo evento o desafío?',
      '¿Dónde y cuándo será el próximo reto?',
      '¿Cuál es su trayectoria deportiva?',
    ],
    contexto: [
      /\bnombre|atleta|boxeador|nadador|ciclista|gimnasta|judoka|karateca|luchador|deportista\b/i,
      /\bnacionalidad|origen|procedente|nacido\s+en|pa[ií]s|nicaragua\b/i,
      /\bedad|a[nñ]os|cumplea[nñ]os|joven\b/i,
      /\bdisciplina|deporte|boxeo|atletismo|nataci[oó]n|ciclismo|sanda|wushu|lucha|mma\b/i,
      /\btorneo|campeonato|competencia|open|juegos|mundial|continental\b/i,
      /\btrayectoria|carrera|historia\s+deportiva|antecedente|camino\b/i,
    ],
    explicacion: [
      /\bqui[eé]n\s+es\s+el\s+atleta|perfil\s+del\s+atleta|debut|trayectoria\b/i,
      /\bqu[eé]\s+gan[oó]|titulo|medalla|campeonato|logro|conquista|resultado\s+obtenido\b/i,
      /\ben\s+qu[eé]\s+competencia|torneo|campeonato|prueba|combate|pelea\b/i,
      /\bc[oó]mo\s+consigui[oó]|c[oó]mo\s+logr[oó]|c[oó]mo\s+venci[oó]|super[oó]|derrot[oó]|t[eé]cnica|estrategia\b/i,
      /\bqu[eé]\s+viene|qu[eé]\s+sigue|pr[oó]ximo\s+evento|pr[oó]ximo\s+desaf[ií]o|pr[oó]ximo\s+reto\b/i,
    ],
    servicio: [
      /\bpr[oó]ximo\s+evento|pr[oó]xima\s+competencia|pr[oó]ximo\s+desaf[ií]o|pr[oó]ximo\s+reto\b/i,
      /\bfecha|hora|lugar|sede|estadio|gimnasio|pista|piscina|circuito\b/i,
      /\btrayectoria|carrera|contexto\s+deportivo|historia\s+del\s+atleta\b/i,
      /\bdatos\s+útiles|seguir|informaci[oó]n\s+pr[aá]ctica\b/i,
    ],
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    mensajeServicioFaltante:
      'La nota del atleta individual no incluye datos prácticos como próximo evento, lugar, fecha o trayectoria.',
  },

  Deportes: {
    tipo: 'deportes',
    intencionLector: 'Conocer el evento, equipos/atletas, resultado, contexto y qué sigue.',
    preguntasObligatorias: [
      '¿Qué evento/partido es?',
      '¿Quiénes compiten?',
      '¿Cuándo y dónde?',
      '¿Qué está en juego?',
      '¿Qué sigue para cada equipo/atleta?',
    ],
    contexto: [
      /\bantecedente|previo|historia|rival|enfrentamiento|temporada\b/i,
      /\btorneo|liga|campeonato|tabla|posici[oó]n|clasificaci[oó]n\b/i,
      /\bcontexto|momento|forma|racha|estad[ií]stica\b/i,
    ],
    explicacion: [
      /\bc[oó]mo\s+queda\s+la\s+tabla|qu[eé]\s+sigue|pr[oó]ximo\s+partido\b/i,
      /\ban[aá]lisis|estad[ií]stica|resultado|consecuencia|figuras\b/i,
      /\bqu[eé]\s+significa\s+el\s+resultado|c[oó]mo\s+afecta\s+la\s+clasificaci[oó]n\b/i,
      /\bqu[eé]\s+viene\s+despu[eé]s|c[oó]mo\s+queda\b/i,
    ],
    servicio: [
      /\bpr[oó]ximo\s+partido|calendario|entradas|boletos|d[oó]nde\s+ver\b/i,
      /\bfecha|hora|canal|estadio|sede|transmisi[oó]n\b/i,
    ],
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    mensajeServicioFaltante:
      'La nota deportiva no incluye datos prácticos como cuándo, dónde o cómo ver el evento.',
  },
  Cultura: {
    tipo: 'cultura',
    intencionLector: 'Conocer la manifestación cultural, su historia, significado, dónde y cuándo disfrutarla.',
    preguntasObligatorias: [
      '¿Qué actividad cultural es?',
      '¿Cuál es su historia o significado?',
      '¿Dónde y cuándo ocurre?',
      '¿Cómo asistir o participar?',
      '¿Para quién es?',
    ],
    contexto: [
      /\btradici[oó]n|historia|or[ií]gen|patrimonio|aniversario|legado\b/i,
      /\bcontexto|significado|simbolismo|ra[ií]ces|cultura\s+popular\b/i,
      /\bartista|creador|compositor|autor|mestizaje\b/i,
    ],
    explicacion: [
      /\bqu[eé]\s+es|de\s+qu[eé]\s+trata|por\s+qu[eé]\s+se\s+celebra\b/i,
      /\bqu[eé]\s+hace\s+diferente|por\s+qu[eé]\s+importa|valor\s+cultural\b/i,
      /\bmanifestaci[oó]n|expresi[oó]n|obra|exposici[oó]n|galer[ií]a|museo\b/i,
    ],
    servicio: [
      /\bd[oó]nde|cu[aá]ndo|horario|entrada|boleto|costo|precio\b/i,
      /\bc[oó]mo\s+llegar|c[oó]mo\s+asistir|programaci[oó]n|actividades\b/i,
      /\bpara\s+qui[eé]n|p[uú]blico|edades|taller|visita\s+guiada\b/i,
    ],
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    mensajeServicioFaltante:
      'La nota cultural no incluye datos prácticos: dónde, cuándo, precio o cómo asistir.',
  },
  Espectaculos: {
    tipo: 'entretenimiento',
    intencionLector: 'Saber qué actividad de entretenimiento hay, dónde, cuándo, cuánto cuesta y cómo asistir.',
    preguntasObligatorias: [
      '¿Qué es la actividad?',
      '¿Dónde será?',
      '¿Cuándo será?',
      '¿Cuál es el precio?',
      '¿Cómo asistir?',
      '¿Para quién es?',
      '¿Qué experiencia ofrece?',
    ],
    contexto: [
      /\bantecedente|previo|edici[oó]n|anterior|historia|trayectoria\b/i,
      /\bcontexto|origen|tradici[oó]n|cultura|patrimonio\b/i,
      /\bartista|grupo|banda|productor|organizador\b/i,
    ],
    explicacion: [
      /\bvale\s+la\s+pena\s+asistir|qu[eé]\s+encontrar[aá]|qu[eé]\s+hace\s+diferente\b/i,
      /\bexperiencia|atractivo|novedad|propuesta|estilo|show\b/i,
      /\bqu[eé]\s+significa|c[oó]mo\s+es|qu[eé]\s+esperar\b/i,
    ],
    servicio: [
      /\bd[oó]nde|cu[aá]ndo|cu[aá]nto\s+cuesta|qui[eé]n\s+puede\s+ir\b/i,
      /\bentradas|boletos|horario|fecha|sede|lugar|costo|precio\b/i,
      /\bc[oó]mo\s+llegar|recomendaciones|tips|informaci[oó]n\s+pr[aá]ctica\b/i,
    ],
    bloqueaPorServicio: false,
    exigeContexto: false,
    exigeDiferencial: false,
    minPalabras: 120,
    mensajeServicioFaltante:
      'La nota de entretenimiento no incluye datos prácticos del evento: qué es, dónde, cuándo, precio o cómo asistir.',
  },
  Tecnologia: {
    tipo: 'tecnología',
    intencionLector: 'Saber qué tecnología es, cómo funciona, para quién, precio y disponibilidad.',
    preguntasObligatorias: [
      '¿Qué tecnología o producto es?',
      '¿Cómo funciona o qué novedad trae?',
      '¿Para quién es?',
      '¿Cuánto cuesta o dónde conseguirlo?',
    ],
    contexto: [
      /\bantecedente|previo|anterior|versi[oó]n|generaci[oó]n|evoluci[oó]n\b/i,
      /\bcontexto|historia|mercado|tendencia|competencia\b/i,
      /\bpor\s+qu[eé]|raz[oó]n|causa|motivo\b/i,
    ],
    explicacion: [
      /\bqu[eé]\s+hace|c[oó]mo\s+funciona|qu[eé]\s+cambia\b/i,
      /\bqu[eé]\s+ventajas|qu[eé]\s+limitaciones|vale\s+la\s+pena\b/i,
      /\bqui[eé]n\s+puede\s+usarlo|c[oó]mo\s+se\s+usa|para\s+qu[eé]\s+sirve\b/i,
      /\bfuncionamiento|utilidad|ventajas|beneficios|caracter[ií]sticas\b/i,
    ],
    servicio: [
      /\bqui[eé]n\s+puede\s+usarlo|c[oó]mo\s+conseguirlo|d[oó]nde\s+comprar\b/i,
      /\bprecio|costo|disponibilidad|requisitos|compatibilidad\b/i,
      /\brecomendaci[oó]n|consejo|tip\b/i,
    ],
    bloqueaPorServicio: false,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 150,
    mensajeServicioFaltante:
      'La nota tecnológica no explica para quién es, dónde conseguirlo ni el precio/disponibilidad.',
  },
  Salud: {
    tipo: 'salud',
    intencionLector: 'Conocer el tema de salud, recomendaciones, a quién afecta y qué hacer.',
    preguntasObligatorias: [
      '¿De qué se trata?',
      '¿A quién afecta?',
      '¿Qué recomiendan las autoridades o expertos?',
      '¿Qué hacer o evitar?',
    ],
    contexto: [
      /\bantecedente|contexto|historia|previo|anterior|referencia\b/i,
      /\bprevalencia|incidencia|casos|estad[ií]stica|pandemia|epidemia\b/i,
      /\bexpertos|especialistas|autoridades\s+de\s+salud|minsa|oms\b/i,
    ],
    explicacion: [
      /\bde\s+qu[eé]\s+se\s+trata|c[oó]mo\s+se\s+transmite|por\s+qu[eé]\s+importa\b/i,
      /\bs[ií]ntomas|se[nñ]ales|diagn[oó]stico|tratamiento|prevenci[oó]n\b/i,
      /\bqu[eé]\s+significa|qu[eé]\s+hay\s+que\s+saber\b/i,
    ],
    servicio: [
      /\bqu[eé]\s+hacer|c[oó]mo\s+prevenir|cu[aá]ndo\s+acudir|recomendaciones\b/i,
      /\bd[oó]nde\s+vacunarme|d[oó]nde\s+acudir|n[uú]mero|centro\s+de\s+salud\b/i,
    ],
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 180,
    mensajeServicioFaltante:
      'La nota de salud no explica qué hacer, cómo prevenir o dónde acudir.',
  },
  Educacion: {
    tipo: 'educación',
    intencionLector: 'Conocer la información educativa, quién la anuncia, a quién afecta y qué cambia.',
    preguntasObligatorias: [
      '¿Qué anuncio o medida es?',
      '¿Quién la aplica?',
      '¿A quién afecta?',
      '¿Cuándo empieza o vence?',
      '¿Qué debe hacer el estudiante/familia?',
    ],
    contexto: [
      /\bantecedente|contexto|historia|anterior|ciclo\s+escolar|a[nñ]o\s+lectivo\b/i,
      /\bministerio\s+de\s+educaci[oó]n|mined|colegio|universidad|instituto\b/i,
      /\bbeca|matr[ií]cula|curso|carrera|calificaci[oó]n|examen\b/i,
    ],
    explicacion: [
      /\bqu[eé]\s+anunciaron|qu[eé]\s+medida|qu[eé]\s+cambia\b/i,
      /\ba\s+qui[eé]n\s+afecta|qui[eé]nes\s+participan|qu[eé]\s+significa\b/i,
      /\bciclo|calendario|requisitos|documentos|inscripci[oó]n\b/i,
    ],
    servicio: [
      /\bc[oó]mo\s+inscribirse|qu[eé]\s+se\s+necesita|d[oó]nde\s+acudir\b/i,
      /\bfecha|plazo|requisito|tr[aá]mite|beca|matr[ií]cula\b/i,
      /\bqu[eé]\s+debo\s+hacer|pasos\s+a\s+seguir\b/i,
    ],
    bloqueaPorServicio: true,
    exigeContexto: true,
    exigeDiferencial: false,
    minPalabras: 180,
    mensajeServicioFaltante:
      'La nota educativa no explica qué debe hacer el estudiante o la familia, dónde acudir ni los plazos.',
  },
  General: {
    tipo: 'general',
    intencionLector: 'Conocer el hecho de interés público con claridad y datos útiles.',
    preguntasObligatorias: ['¿Qué pasó?', '¿Dónde y cuándo?', '¿Por qué importa?', '¿Qué necesita saber el lector?'],
    contexto: [
      /\bantecedente|contexto|previo|historia|referencia\b/i,
      /\bporqu[eé]|debido a|como resultado|causa|motivo\b/i,
      /\bconsecuencia|impacto|afectaci[oó]n|alcance|cambio\b/i,
    ],
    explicacion: [
      /\bqu[eé]\s+significa|c[oó]mo\s+funciona|qu[eé]\s+es|qu[eé]\s+cambia\b/i,
      /\bes\s+decir|o\s+sea|en\s+otras\s+palabras|esto\s+significa\s+que\b/i,
      /\bpor\s+qu[eé]|c[oó]mo\s+afecta|qu[eé]\s+implica|qu[eé]\s+sigue\b/i,
      /\bimpacto|alcance|consecuencia|beneficio|utilidad\b/i,
    ],
    servicio: [
      /\bqu[eé]\s+hacer|c[oó]mo\s+afecta|qu[eé]\s+cambia\b/i,
      /\bprevenci[oó]n|recomendaci[oó]n|consejo|tip\b/i,
      /\bautoridades\s+(informaron|indicaron|explicaron|dijeron)\b/i,
    ],
    bloqueaPorServicio: false,
    exigeContexto: false,
    exigeDiferencial: false,
    minPalabras: 120,
    mensajeServicioFaltante:
      'La nota no responde qué hacer ni qué cambia para el lector.',
  },
};

export const INDIVIDUAL_SPORTS_KEYWORDS = /\b(?:artes\s+marciales|sanda|wushu|lucha|luchador|mma|muay\s+thai|kickboxing|cinturon|cintur[oó]n|boxeo|boxeador|atletismo|atleta|nadador|nataci[oó]n|ciclismo|ciclista|gimnasia|gimnasta|halterofilia|halter[oó]filo|esgrima|esgrimista|judo|judoka|karate|karateca|taekwondo|taekwondista|surf|skate|patinaje|patinador|patinadora|tenis|tenista|golf|golfista|yudo|yudoka|taekwondin)\b/i;

export function getPerfilEditorial(categoria: string, textoPlano?: string): EditorialCriterios {
  const cat = (categoria || 'General').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let key = cat;
  if (!CATEGORIAS_EDITORIALES[key]) {
    for (const k of Object.keys(CATEGORIAS_EDITORIALES)) {
      if (k.toLowerCase() === cat.toLowerCase()) {
        key = k;
        break;
      }
    }
  }

  // Fallbacks por palabra clave
  if (!CATEGORIAS_EDITORIALES[key]) {
    if (/suceso|polic|judicial|accidente|delito|crimen/i.test(cat)) key = 'Sucesos';
    else if (/deporte|f[uú]tbol|b[eé]isbol/i.test(cat)) key = 'Deportes';
    else if (/tecno|gadget|app|software/i.test(cat)) key = 'Tecnologia';
    else if (/espect|entreten|evento|cine|m[uú]sica|show/i.test(cat)) key = 'Espectaculos';
    else if (/cultur|art|patrimonio|galeria/i.test(cat)) key = 'Cultura';
    else if (/internac|mundial|global/i.test(cat)) key = 'Internacionales';
    else if (/econom|finanza|precio|salario/i.test(cat)) key = 'Economia';
    else if (/pol[ií]t|gobierno|asamblea/i.test(cat)) key = 'Politica';
    else if (/salud|minsa|vacuna|sintoma|pandemia/i.test(cat)) key = 'Salud';
    else if (/educ| mined|universidad|colegio/i.test(cat)) key = 'Educaci';
    else if (/nacional|comunidad|local|servicio publico/i.test(cat)) key = 'Nacionales';
    else key = 'General';
  }

  if (key === 'Deportes' && textoPlano && INDIVIDUAL_SPORTS_KEYWORDS.test(textoPlano)) {
    return CATEGORIAS_EDITORIALES.DeportesIndividuales;
  }

  return CATEGORIAS_EDITORIALES[key];
}
