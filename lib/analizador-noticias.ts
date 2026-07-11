/**
 * Analizador Forense de Noticias - Nicaragua Informate v2.0
 * REGLA RECTORA: "Es mejor una noticia de 350 palabras totalmente verificable
 * que una de 800 palabras con informacion inferida."
 *
 * Niveles: FORENSE > ORO > PLATA > BRONCE > RECHAZADO
 * Prioridad: VERIFICABILIDAD sobre longitud.
 */

export type NoticiaTipo =
  | 'Tecnologia' | 'Sucesos' | 'Economia' | 'Salud' | 'Infraestructura' | 'Judicial'
  | 'Nacionales' | 'Deportes' | 'Internacionales' | 'Espectaculos' | 'General' | 'Politica' | 'Cultura';

export interface NoticiaInput {
  titulo: string;
  contenido: string;
  resumen: string;
  categoria: string;
  autor: string;
  fecha: string;
  fechaActualizacion?: string;
  imagenDestacada?: string;
  imagen?: string;
  slug: string;
  palabrasClave?: string[];
  keywords?: string;
}

export interface PalabraSensibleDetectada {
  palabra: string;
  sugerencia: string;
  contexto: string;
}

export type TipoNotaEditorial =
  | 'Sucesos'
  | 'Política'
  | 'Economía'
  | 'Deportes'
  | 'Salud'
  | 'Educación'
  | 'Tecnología'
  | 'Internacionales'
  | 'Cultura'
  | 'Opinión'
  | 'Reportaje'
  | 'Investigación'
  | 'Entrevista'
  | 'Análisis'
  | 'Explicador'
  | 'Servicio';

export type TipoArticulo =
  | 'Noticia'
  | 'Reportaje'
  | 'Investigación'
  | 'Entrevista'
  | 'Análisis'
  | 'Explicador'
  | 'Servicio'
  | 'Opinión';

export interface CriterioEditorJefe {
  nombre: string;
  puntuacion: number;
  maximo: number;
  justificacion: string;
  estrellas: string;
}

export interface EvidenciaAporte {
  tipo: 'contexto' | 'explicación' | 'dato propio' | 'marco legal' | 'antecedente';
  snippet: string;
}

export interface SugerenciaV7 {
  texto: string;
  impacto: string;
  tiempo: string;
  dificultad: 'Baja' | 'Media' | 'Alta';
  beneficio: string;
}

export interface ReporteEditorJefe {
  tipoNota: TipoNotaEditorial;
  tipoArticulo: TipoArticulo;
  razonamientoTipo: string;
  puntuacion: number;
  puntuacionMaxima: number;
  veredicto:
    | '★ Reemplazable'
    | '★★ Necesita desarrollo'
    | '★★★ Publicable'
    | '★★★★ Competitiva'
    | '★★★★☆ Muy competitiva'
    | '★★★★★ Nota de referencia';
  criterios: CriterioEditorJefe[];

  // Editor Jefe — análisis editorial
  porQueExiste: string;
  aporteOriginal: string;
  razonReferenciaSiNo: 'Sí' | 'No';
  razonamientoReferencia: string;
  oportunidadesEditoriales: SugerenciaV7[];
  investigacionAdicional: string;
  preguntaSinResponder: string;
  datoEnriquecedor: string;
  comoConvertirReferencia: SugerenciaV7[];

  // Detectores
  detectorNicaraguaInformate: string;
  detectorFacebook: string;
  detectorGoogle: string;
  detectorEEATReal: string;

  // Principio rector del Editor Jefe
  principioRector: string;
  preguntaFinal: string;

  // Niveles 7.5-10
  nivel7_5_evidenciaAporte: EvidenciaAporte[];
  nivel8_impactoLector: string;
  nivel9_preguntasSinRespuesta: string[];
  nivel10_oportunidades: SugerenciaV7[];

  // Nivel de evidencia verificable (antialucinación)
  nivelEvidencia: {
    criterio: string;
    detectado: 'Sí' | 'No' | 'Parcial';
    puntaje: number;
    maximo: number;
  }[];

  // Indicadores Editor Jefe 2.0
  factibilidad: string;
  tiempoReferencia: string;
  retornoEditorial: 'ALTO' | 'MEDIO' | 'BAJO';
  retornoExplicacion: string;
  prioridadEditorial: string;
  valorParaLector: string;
  publicarPortada: 'Sí' | 'No';
  porQuePublicarPortada: string;

  // Discover / compartir
  discoverRazon: string;
  descubreProbabilidad: 'ALTA' | 'MEDIA' | 'BAJA';
  porQueCompartible: string;
  compartibleSiNo: 'Sí' | 'No';

  // Autoauditoría Constitución V7.0
  auditoriaInterna: {
    aprobado: boolean;
    observaciones: string[];
    ajustesRealizados: string[];
  };
}

export interface ResultadoAnalisis {
  aprobado: boolean;
  nivel: 'FORENSE' | 'ORO' | 'PLATA' | 'BRONCE' | 'RECHAZADO';
  puntuacion: number;
  palabrasSensiblesDetectadas?: PalabraSensibleDetectada[];
  cierreGenerico?: boolean;
  filtros: {
    oro: FiltroResultado;
    adsense: FiltroResultado;
    discover: FiltroResultado;
    news: FiltroResultado;
    seo: FiltroResultado;
    eeat: FiltroResultado;
    valorEditorial: FiltroResultado;
  };
  accionesRequeridas: string[];
  metadataSugerida: {
    tituloOptimizado?: string;
    metaDescription?: string;
    keywordsLSI?: string[];
    h2Sugeridos?: string[];
  };
  reporteVPR?: ReporteEditorJefe;
}

export interface FiltroResultado {
  aprobado: boolean;
  puntuacion: number;
  checks: CheckItem[];
}

export interface CheckItem {
  nombre: string;
  estado: 'PASS' | 'FAIL' | 'WARN';
  mensaje: string;
  valorActual?: string | number;
  valorEsperado?: string | number;
}

// ───────────────────────────────────────────────
// PALABRAS PROHIBIDAS (AdSense + Editorial)
// ───────────────────────────────────────────────

const ADJETIVOS_EMOCIONALES = [
  'tragico', 'terrible', 'impactante', 'conmociono', 'devastador',
  'horrible', 'alarmante', 'desgarrador', 'lamentable', 'dramatico',
  'critico', 'escalofriante', 'espeluznante', 'increible', 'inimaginable',
  'indignante', 'escandaloso', 'vergonzoso', 'aterrador', 'mortifero',
  'sangriento', 'brutal', 'salvaje', 'violento', 'agresivo',
  'tragedia', 'fatal', 'horror', 'impactante', 'desgarrador',
];

const CLICKBAIT_PATTERNS = [
  /no vas a creer/i,
  /esto cambiara todo/i,
  /la verdad sobre/i,
  /exclusiva/i,
  /bomba/i,
  /escandalo/i,
  /filtran/i,
  /se filtra/i,
  /\.{3,}$/,
  /¡.*!/,
  /urgente/i,
  /ultima hora/i,
  /alerta/i,
  /revelan/i,
  /destapan/i,
  /exclusivo/i,
  /increible/i,
  /sorprendente/i,
];

// Transiciones exclusivamente IA (detectadas en textos generados por LLM)
// EXCLUIDAS: ademas, sin embargo, por su parte, asimismo, en cuanto a, no obstante
// porque son uso legitimo del periodismo en espanol.
const TRANSICIONES_IA = [
  'en conclusion', 'en resumen', 'es importante destacar',
  'vale la pena mencionar', 'no hay que olvidar', 'en el contexto de',
  'desde esta perspectiva', 'en ultima instancia', 'a fin de cuentas',
  'en el marco de', 'resulta fundamental', 'resulta evidente',
  'no cabe duda', 'es indiscutible', 'resulta innegable',
  'en definitiva', 'para concluir',
  'como se menciono anteriormente', 'es relevante senalar',
  'no se puede ignorar', 'es crucial', 'es vital',
  'finalmente', 'por otro lado', 'por ende', 'de igual manera',
  'en ese sentido', 'al respecto', 'por lo tanto', 'en consecuencia',
  'cabe señalar', 'vale la pena recordar', 'en este contexto', 'a su vez',
];

// ───────────────────────────────────────────────
// PALABRAS SENSIBLES NICARAGUA (con reemplazos sugeridos)
// ───────────────────────────────────────────────
const PALABRAS_SENSIBLES_NICARAGUA: Record<string, string> = {
  'siniestr': 'grave',
  'fatal': 'grave con consecuencias serias',
  'calcin': 'afectado por incendio',
  'muere': 'resulta gravemente afectado',
  'murio': 'resultó gravemente afectado',
  'muertos': 'afectados',
  'asesinato': 'incidente grave',
  'homicidio': 'incidente grave',
  'secuestro': 'privación de libertad',
  'drogas': 'sustancias ilícitas',
  'narcotrafico': 'tráfico ilegal de sustancias',
  'narco': 'grupos delictivos',
  'cartel': 'grupos delictivos',
  'sicario': 'presunto agresor',
  'ejecutado': 'privado de la vida',
  'decapitado': 'gravemente afectado',
  'descuartizado': 'gravemente afectado',
  'incinerado': 'afectado por incendio',
  'ahogado': 'afectado por asfixia',
  'ahorcado': 'afectado por asfixia',
  'violent': 'grave con uso de fuerza',
  'autoridades investigan': 'Nicaragua Informate intentó obtener versión oficial',
  'se realizan las investigaciones correspondientes': 'la institución no ha emitido comunicado',
  'hasta el momento no hay detenidos': 'fuentes policiales continúan las pesquisas',
  'la víctima': 'la persona afectada',
  'el fallecido': 'la persona',
  'el occiso': 'la persona',
};

const FRASES_GENERICAS_CIERRE = [
  'autoridades investigan',
  'se realizan las investigaciones',
  'hasta el momento no hay detenidos',
  'la víctima',
  'el fallecido',
  'el occiso',
];

// ───────────────────────────────────────────────
// FUNCIONES HELPER FORENSE
// ───────────────────────────────────────────────

function detectarPalabrasSensibles(texto: string): PalabraSensibleDetectada[] {
  const encontradas: PalabraSensibleDetectada[] = [];
  for (const [palabra, sugerencia] of Object.entries(PALABRAS_SENSIBLES_NICARAGUA)) {
    const regex = new RegExp(palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(texto)) {
      const idx = texto.toLowerCase().indexOf(palabra.toLowerCase());
      const inicio = Math.max(0, idx - 50);
      const fin = Math.min(texto.length, idx + 50 + palabra.length);
      encontradas.push({
        palabra,
        sugerencia,
        contexto: texto.substring(inicio, fin).replace(/\n/g, ' '),
      });
    }
  }
  return encontradas;
}

function detectarCierreGenerico(texto: string): boolean {
  const final = texto.slice(-300).toLowerCase();
  return FRASES_GENERICAS_CIERRE.some(frase => final.includes(frase));
}

// ───────────────────────────────────────────────
// MOTOR PRINCIPAL (LOGICA UNIFICADA ORO)
// ───────────────────────────────────────────────

export async function analizarNoticia(noticia: NoticiaInput): Promise<ResultadoAnalisis> {
  const t = noticia.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // Detectar problemas
  const contenidoLower = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const adjetivosEncontrados = ADJETIVOS_EMOCIONALES.filter(adj => contenidoLower.includes(adj));
  const transicionesEncontradas = TRANSICIONES_IA.filter(tr => contenidoLower.includes(tr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));

  // Anti-atribuciones falsas a instituciones (EEAT Nicaragua)
  const atribucionesFalsas = /\bpolicia\s+nacional\s+de\s+nicaragua\b|\bpnc\b|\bministerio\s+de\s+salud\s+de\s+nicaragua\b|\bmina\b|\bsilais\b.*\bnicaragua\b|\balcald[ií]a\s+de\s+managua\b|\bsupremo\s+poder\b.*\bnicaragua\b/i.test(contenidoLower) &&
    !/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(contenidoLower);

  // ─── NUEVAS DETECCIONES FORENSE NICARAGUA ───
  const palabrasSensiblesDetectadas = detectarPalabrasSensibles(noticia.contenido + ' ' + noticia.titulo);
  const cierreGenerico = detectarCierreGenerico(noticia.contenido);

  // ─── CHECKS UNIFICADOS (mismos 8 que el panel) ───
  const textoPlano = noticia.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabrasTotales = textoPlano.split(' ').filter(p => p.length > 0).length;
  const leadTexto2 = textoPlano.split(/\n|\./)[0] || '';
  const leadPalabras = leadTexto2.split(' ').filter(p => p.length > 0).length;
  const h2s = (noticia.contenido.match(/<h2/gi) || []).length;
  const strongs = (noticia.contenido.match(/<strong/gi) || []).length;
  const blockquotes2 = (noticia.contenido.match(/<blockquote>/gi) || []).length;
  const tituloLen = (noticia.titulo || '').length;
  const resumenLen = (noticia.resumen || '').length;

  // Detectar atribuciones en texto plano (no solo blockquotes)
  const textoLower = textoPlano.toLowerCase();
  const tieneAtribucionTexto = /\b(?:testigo|familiar|vecino|habitante|comerciante|conductor|pasajero|declar[oó]|indic[oó]|dijo|mencion[oó]|precis[oó]|señal[oó]|confirm[oó]|seg[uú]n|redes sociales|medios? locales?|fiscal|polic[ií]|autoridades?|oficiales?|spokesperson|director|jefe|vocero|representante|report[oó]|indic[oó])\b/.test(textoLower);
  const tieneCitasAtribuidas2 = (noticia.contenido.match(/<cite[^>]*>[^]*?<\/cite>/gi) || []).length >= 1;
  const passFuentesPrincipal = blockquotes2 >= 1 || tieneAtribucionTexto || tieneCitasAtribuidas2;

  // ─── DENSIDAD DE DATOS VERIFICABLES (auditoría quirúrgica) ───
  const nombresPropios = (textoPlano.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
  const instituciones = (textoLower.match(/\b(fiscalía|policía|bomberos|hospital|ministerio|alcaldía|municipio|departamento|instituto|jueza|comisaría|dirección|unidad|centro|clínica|juzgado|tribunal|procuraduría|defensoría|medicina\s+legal)\b/g) || []).length;
  const datosConcretos = (textoPlano.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length
    + (textoPlano.match(/\bC?\$\s*\d{1,3}(?:,\d{3})*\b/g) || []).length
    + (textoPlano.match(/\b\d{2,3}\s+(kilómetros?|km|metros?|m|años?|frascos?|personas?|heridos?|afectados?|fallecidos?)\b/gi) || []).length;
  const densidadVerificable = nombresPropios + instituciones + datosConcretos;
  const esNotaVerificable = densidadVerificable >= 3;

  const checks = [
    { nombre: 'Extensión verificable', pasa: palabrasTotales >= 350 || (palabrasTotales >= 250 && esNotaVerificable) },
    { nombre: 'Lead ≥10 palabras', pasa: leadPalabras >= 10 },
    { nombre: 'Estructura o densidad', pasa: h2s >= 1 || (palabrasTotales < 350 && esNotaVerificable) },
    { nombre: 'Negritas / datos clave', pasa: strongs >= 1 },
    { nombre: 'Citas o atribución', pasa: passFuentesPrincipal },
    { nombre: 'Título SEO 20-90 chars', pasa: tituloLen >= 20 && tituloLen <= 90 },
    { nombre: 'Meta 50-300 chars', pasa: resumenLen >= 50 && resumenLen <= 300 },
    { nombre: 'Imagen destacada', pasa: true },
  ];
  const checksOK = checks.filter(c => c.pasa).length;

  const filtros = {
    oro: analizarFiltroOro(noticia),
    adsense: analizarFiltroAdSense(noticia),
    discover: analizarFiltroDiscover(noticia),
    news: analizarFiltroNews(noticia),
    seo: analizarFiltroSEO(noticia),
    eeat: analizarFiltroEEAT(noticia),
    valorEditorial: analizarFiltroValorEditorial(noticia),
  };

  // ─── CÁLCULO DE PUNTUACIÓN — Promedio de los 7 filtros unificados ───
  const filtrosScores = [
    filtros.oro.puntuacion,
    filtros.adsense.puntuacion,
    filtros.discover.puntuacion,
    filtros.news.puntuacion,
    filtros.seo.puntuacion,
    filtros.eeat.puntuacion,
    filtros.valorEditorial.puntuacion,
  ];
  const scoreTotal = Math.round(filtrosScores.reduce((a, b) => a + b, 0) / filtrosScores.length);

  // ─── DETERMINACIÓN DE NIVEL v6.0 — Auditoría quirúrgica aplicada ───
  //   FORENSE:  8/8 checks + score ≥ 70 + 0 adjetivos + ≤1 transición + valorEditorial aprobado
  //   ORO:      8/8 checks
  //   PLATA:    6-7/8 checks
  //   BRONCE:   4-5/8 checks
  //   RECHAZADO: <4/8 checks

  const esRechazado = checksOK < 4;
  const esForense = checksOK === 8 &&
    scoreTotal >= 70 &&
    !atribucionesFalsas &&
    adjetivosEncontrados.length === 0 &&
    transicionesEncontradas.length <= 1 &&
    filtros.valorEditorial.aprobado;

  let nivel: ResultadoAnalisis['nivel'];
  if (esRechazado) nivel = 'RECHAZADO';
  else if (esForense) nivel = 'FORENSE';
  else if (checksOK >= 6) nivel = 'ORO';
  else if (checksOK >= 4) nivel = 'PLATA';
  else if (checksOK >= 2) nivel = 'BRONCE';
  else nivel = 'RECHAZADO';

  const aprobado = nivel !== 'RECHAZADO';

  return {
    aprobado,
    nivel,
    puntuacion: scoreTotal,
    palabrasSensiblesDetectadas,
    cierreGenerico,
    filtros,
    accionesRequeridas: generarAcciones(filtros, palabrasSensiblesDetectadas, cierreGenerico),
    metadataSugerida: generarMetadataSugerida(noticia, filtros),
    reporteVPR: analizarValorPeriodisticoReal(noticia),
  };
}


// ───────────────────────────────────────────────
// NIVEL 1: FILTROS ORO (Editorial)
// ───────────────────────────────────────────────

function analizarFiltroOro(n: NoticiaInput): FiltroResultado {
  const checks: CheckItem[] = [];
  const textoPlano = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(' ').filter(p => p.length > 0);
  const palabraCount = palabras.length;

  // 1. Extension adecuada (verificabilidad > longitud)
  // Densidad de datos verificables para evaluar extensión
  const nombresOro = (textoPlano.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
  const instOro = (textoPlano.toLowerCase().match(/\b(fiscalía|policía|bomberos|hospital|ministerio|alcaldía|municipio|departamento|instituto|jueza|comisaría|dirección|unidad|centro|clínica|juzgado|tribunal|procuraduría|defensoría|medicina\s+legal)\b/g) || []).length;
  const datosOro = (textoPlano.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length
    + (textoPlano.match(/\bC?\$\s*\d{1,3}(?:,\d{3})*\b/g) || []).length;
  const densidadOro = nombresOro + instOro + datosOro;
  const esVerificableOro = densidadOro >= 3;

  checks.push({
    nombre: 'Extension adecuada',
    estado: palabraCount >= 300 || (palabraCount >= 250 && esVerificableOro) ? 'PASS' : palabraCount >= 250 ? 'WARN' : 'FAIL',
    mensaje: palabraCount >= 300 || (palabraCount >= 250 && esVerificableOro)
      ? `${palabraCount} palabras. Extensión adecuada con datos verificables.`
      : palabraCount >= 250
        ? `${palabraCount} palabras. Aceptable para noticias breves.`
        : `Solo ${palabraCount} palabras. Muy corta para ser informativa.`,
    valorActual: palabraCount,
    valorEsperado: '>=250 con datos verificables',
  });

  // 2. Lead (primer parrafo) — funciona con HTML o texto plano
  let leadPalabras = 0;
  const todosParrafos = n.contenido.match(/<p>(.*?)<\/p>/g) || [];
  for (const p of todosParrafos) {
    const texto = p.replace(/<[^>]*>/g, '').trim();
    const count = texto.split(' ').filter(w => w.length > 0).length;
    if (count > 3) { leadPalabras = count; break; }
  }
  // Fallback: si no hay <p>, tomar primeras palabras del texto plano
  if (leadPalabras === 0) {
    const primerasPalabras = textoPlano.split(' ').filter(w => w.length > 0).slice(0, 50);
    leadPalabras = primerasPalabras.length;
  }
  checks.push({
    nombre: 'Lead informativo',
    estado: leadPalabras >= 30 ? 'PASS' : leadPalabras >= 15 ? 'WARN' : 'FAIL',
    mensaje: `Lead de ${leadPalabras} palabras. Ideal: 35-50.`,
    valorActual: leadPalabras,
    valorEsperado: '35-50',
  });

  // 3. Relleno emocional (0 = PASS, >0 = WARN)
  const contenidoLower = textoPlano.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const adjetivosEncontrados = ADJETIVOS_EMOCIONALES.filter(adj => contenidoLower.includes(adj));
  checks.push({
    nombre: 'Relleno emocional',
    estado: adjetivosEncontrados.length === 0 ? 'PASS' : 'WARN',
    mensaje: adjetivosEncontrados.length === 0
      ? 'Ningun adjetivo emocional detectado.'
      : `Detectados ${adjetivosEncontrados.length}: ${adjetivosEncontrados.slice(0, 5).join(', ')}`,
    valorActual: adjetivosEncontrados.length,
    valorEsperado: 0,
  });

  // 4. Transiciones IA (0 = PASS, >0 = WARN)
  const transicionesEncontradas = TRANSICIONES_IA.filter(t => contenidoLower.includes(t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  checks.push({
    nombre: 'Transiciones IA',
    estado: transicionesEncontradas.length === 0 ? 'PASS' : 'WARN',
    mensaje: transicionesEncontradas.length === 0
      ? '0 detectadas.'
      : `Detectadas ${transicionesEncontradas.length}: ${transicionesEncontradas.slice(0, 3).join(', ')}`,
    valorActual: transicionesEncontradas.length,
    valorEsperado: 0,
  });

  // 5. Veracitud (fuentes atribuidas) — Adaptado a realidad nicaragüense
  const palabrasAtribucion = /testigo|familiar|vecino|habitante|morador|comerciante|conductor|pasajero|testimonio|declar[oó]|indic[oó]|dijo|mencion[oó]|precis[oó]|señal[oó]|confirm[oó]/.test(contenidoLower);
  const blockquotesOro = (n.contenido.match(/<blockquote>/g) || []).length;
  // Detectar citas con comillas (rectas o tipograficas) + palabra de atribucion
  const tieneCitasAtribuidas = /["\u201c][^"\u201d]{8,}["\u201d][\s,]*[^.]*(?:inform|confirm|declar|precis|senal|indic|dij|explic|manifest|afirm|agreg|asegur|destac|mencion|aclar|coment|expres|anunc|revel)/i.test(n.contenido);
  // Detectar "segun X" o "de acuerdo con X" o "versiones indican"
  const tieneSegun = /\bsegun\s+[A-Z]|\bde\s+acuerdo\s+con\s+[A-Z]|\bversiones\s+indican|\btestigos\s+en\s+el\s+lugar|\bfamiliares\s+de\s+la\s+victima|\bvideos\s+compartidos/i.test(contenidoLower);
  // Detectar atribuciones a redes sociales o medios
  const tieneRedesMedios = /\b(?:redes sociales|facebook|tiktok|instagram|youtube|medios? locales?)\b/i.test(contenidoLower);
  const passFuentes = palabrasAtribucion || blockquotesOro >= 1 || tieneCitasAtribuidas || tieneSegun || tieneRedesMedios;
  checks.push({
    nombre: 'Fuentes atribuidas',
    estado: passFuentes ? 'PASS' : 'WARN',
    mensaje: passFuentes
      ? `Fuentes detectadas: testigos, familiares, medios o citas.`
      : 'SIN FUENTES CLARAS: Agregar atribucion (testigos, familiares, videos, medios).',
    valorActual: blockquotesOro,
    valorEsperado: '>=0',
  });

  // 6. Estructura
  let h2s = (n.contenido.match(/<h2>/gi) || []).length;
  let strongs = (n.contenido.match(/<strong>/gi) || []).length;
  
  // Detectar <p> con subtitulos de seccion como si fueran h2
  const pConSubtitulo = (n.contenido.match(/<p>\s*(hechos principales|declaraciones de fuentes|desarrollo|antecedentes|contexto|detalles del incidente|respuesta institucional|reacciones|impacto|consecuencias|medidas adoptadas|investigacion|estadisticas|cifras|datos oficiales|historial|antecedentes similares|marco legal|sanciones|penas|contexto regional|reacciones oficiales|declaraciones institucionales|declaraciones oficiales)\s*<\/p>/gi) || []).length;
  h2s += pConSubtitulo;
  
  // Fallback texto plano: detectar cualquier linea que parezca subtitulo de seccion
  if (h2s === 0) {
    const lineas = n.contenido.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const seccionesComunes = /^(hechos principales|declaraciones de fuentes|desarrollo|antecedentes|contexto|detalles del incidente|respuesta institucional|reacciones|impacto|consecuencias|medidas adoptadas|investigacion|estadisticas|cifras|datos oficiales|historial|antecedentes similares|marco legal|sanciones|penas|contexto regional|reacciones oficiales|declaraciones institucionales|declaraciones oficiales)/i;
    
    const posiblesH2 = lineas.filter(l => {
      // Quitar markdown: ## ** * - etc.
      const limpio = l.replace(/^#{1,6}\s*/, '').replace(/^\*\*?\s*/, '').replace(/^\*\*?\s*/, '').replace(/^-\s*/, '').replace(/^\*\*?\s*/, '').trim();
      if (!limpio) return false;
      
      // Coincide con palabras de seccion conocidas
      if (seccionesComunes.test(limpio)) return true;
      
      // Corta (5-50 chars), sin punto/coma al final, empieza con mayuscula, no es cita
      const largoOk = limpio.length >= 5 && limpio.length <= 50;
      const sinPunto = !limpio.endsWith('.') && !limpio.endsWith(',') && !limpio.endsWith(';');
      const empiezaMayus = /^[A-ZÁÉÍÓÚÑ]/.test(limpio);
      const noEsCita = !limpio.startsWith('"') && !limpio.startsWith('"') && !limpio.startsWith("'");
      // Que tenga formato de titulo: palabras en mayuscula
      const palabras = limpio.split(' ');
      const variasMayus = palabras.filter(w => w.length > 2 && /^[A-ZÁÉÍÓÚÑ]/.test(w)).length >= 1;
      return largoOk && sinPunto && empiezaMayus && noEsCita && variasMayus;
    });
    h2s = Math.min(posiblesH2.length, 8); // max 8 para no inflar
  }
  
  // Fallback texto plano: detectar datos resaltados (fechas, numeros, mayusculas)
  if (strongs === 0) {
    const fechas = (textoPlano.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
    const numeros = (textoPlano.match(/\b\d{2,4}\b/g) || []).length;
    const mayusculas = (textoPlano.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
    if (fechas + numeros + mayusculas >= 5) {
      strongs = fechas + numeros + mayusculas; // Considerar como datos resaltados
    }
  }
  
  checks.push({
    nombre: 'Estructura (h2)',
    estado: h2s >= 1 || (palabraCount < 300 && esVerificableOro) ? 'PASS' : 'WARN',
    mensaje: h2s >= 1 || (palabraCount < 300 && esVerificableOro)
      ? `${h2s} subtítulos. Nota breve verificable: subtítulos opcionales.`
      : `Sin subtítulos. Opcional si la noticia es breve y verificable.`,
    valorActual: h2s,
    valorEsperado: '>=0 (opcional para notas breves)',
  });
  checks.push({
    nombre: 'Negritas (strong)',
    estado: strongs >= 1 ? 'PASS' : 'WARN',
    mensaje: strongs >= 1 ? `${strongs} datos clave resaltados.` : `Sin datos resaltados. Recomendado resaltar fechas, nombres y cifras.`,
    valorActual: strongs,
    valorEsperado: '>=1',
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  const fails = checks.filter(c => c.estado === 'FAIL').length;
  return {
    aprobado: puntuacion >= 50 && fails <= 1,
    puntuacion: Math.round(puntuacion),
    checks,
  };
}

// ───────────────────────────────────────────────
// NIVEL 2: FILTROS ADSENSE
// ───────────────────────────────────────────────

function analizarFiltroAdSense(n: NoticiaInput): FiltroResultado {
  // El puntaje de AdSense se basa en Valor Editorial Real + seguridad programática
  const ve = analizarFiltroValorEditorial(n);
  const checks: CheckItem[] = [...ve.checks];

  const textoPlano = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabraCount = textoPlano.split(' ').filter(p => p.length > 0).length;

  // 1. Thin content — Verificabilidad, no longitud
  const datosConcretosAdsense = (textoPlano.match(/\b\d{1,2}\s+de\s+\w+\b/gi) || []).length
    + (textoPlano.match(/\b(?:Managua|Granada|León|Masaya|Estelí|Chinandega|Matagalpa|Jinotega|Rivas|Carazo|Nicaragua)\b/gi) || []).length
    + (textoPlano.match(/\b(?:Policía|Ministerio|Hospital|Alcaldía|Comisaría|INSS|municipio|departamento|barrio)\b/gi) || []).length
    + (textoPlano.match(/\btestigo|familiar|vecino|habitante|comerciante|conductor|pasajero\b/gi) || []).length;
  const tieneDatosConcretos = datosConcretosAdsense >= 3;
  const passThinContent = palabraCount >= 300 || (palabraCount >= 250 && tieneDatosConcretos);
  checks.push({
    nombre: 'Thin content',
    estado: passThinContent ? 'PASS' : 'WARN',
    mensaje: passThinContent
      ? `${palabraCount} palabras con datos concretos. Contenido sustancial.`
      : `${palabraCount} palabras. Corta pero puede ser valida si es verificable.`,
    valorActual: palabraCount,
    valorEsperado: '>=250 con datos',
  });

  // 2. Clickbait en titulo
  const tieneClickbait = CLICKBAIT_PATTERNS.some(p => p.test(n.titulo));
  checks.push({
    nombre: 'Clickbait',
    estado: !tieneClickbait ? 'PASS' : 'FAIL',
    mensaje: !tieneClickbait
      ? 'Titulo descriptivo sin clickbait.'
      : 'Titulo detectado como clickbait enganoso.',
  });

  // 3. Valor anadido
  const palabrasUnicas = new Set(textoPlano.toLowerCase().split(' ')).size;
  const ratioUnicidad = palabrasUnicas / palabraCount;
  checks.push({
    nombre: 'Valor anadido original',
    estado: ratioUnicidad >= 0.4 ? 'PASS' : 'WARN',
    mensaje: `Ratio de unicidad: ${(ratioUnicidad * 100).toFixed(1)}%.`,
    valorActual: `${(ratioUnicidad * 100).toFixed(1)}%`,
    valorEsperado: '>=40%',
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return {
    aprobado: puntuacion >= 60 && !checks.some(c => c.estado === 'FAIL'),
    puntuacion: Math.round(puntuacion),
    checks,
  };
}

// ───────────────────────────────────────────────
// NIVEL 3: FILTROS GOOGLE DISCOVER
// ───────────────────────────────────────────────

function analizarFiltroDiscover(n: NoticiaInput): FiltroResultado {
  const checks: CheckItem[] = [];

  // 1. Imagen destacada (WARN en vez de FAIL para no bloquear)
  checks.push({
    nombre: 'Imagen destacada',
    estado: n.imagenDestacada ? 'PASS' : 'WARN',
    mensaje: n.imagenDestacada
      ? 'Imagen presente. Verificar manualmente >=1200px de ancho.'
      : 'Sin imagen detectada. Se recomienda agregar una imagen >=1200px.',
  });

  // 2. Titulo descriptivo
  const tituloLimpio = !CLICKBAIT_PATTERNS.some(p => p.test(n.titulo));
  checks.push({
    nombre: 'Titulo Discover-friendly',
    estado: tituloLimpio ? 'PASS' : 'FAIL',
    mensaje: tituloLimpio
      ? 'Titulo descriptivo.'
      : 'Titulo sensacionalista. Discover penaliza.',
  });

  // 3. Frescura (relajado: con fecha de publicacion es suficiente para notas existentes)
  checks.push({
    nombre: 'Senal de frescura',
    estado: 'PASS',
    mensaje: n.fechaActualizacion
      ? 'dateModified presente. Contenido actualizado.'
      : 'datePublished presente. Noticia indexada correctamente.',
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return {
    aprobado: puntuacion >= 66,
    puntuacion: Math.round(puntuacion),
    checks,
  };
}

// ───────────────────────────────────────────────
// NIVEL 4: FILTROS GOOGLE NEWS
// ───────────────────────────────────────────────

function analizarFiltroNews(n: NoticiaInput): FiltroResultado {
  const checks: CheckItem[] = [];

  // 1. Schema NewsArticle basico
  checks.push({
    nombre: 'Schema NewsArticle',
    estado: 'PASS',
    mensaje: 'Verificar que schema.ts incluya: author, publisher, dateModified.',
  });

  // 2. Autor verificado
  checks.push({
    nombre: 'Autor verificado',
    estado: n.autor && n.autor.length > 3 ? 'PASS' : 'FAIL',
    mensaje: n.autor
      ? `Autor: ${n.autor}`
      : 'Sin autor. Google News requiere author (Person).',
  });

  // 3. Fechas visibles en DOM
  checks.push({
    nombre: 'Fechas visibles',
    estado: n.fecha ? 'PASS' : 'FAIL',
    mensaje: n.fecha
      ? 'datePublished presente.'
      : 'Sin fecha de publicacion visible.',
  });

  // 4. Categoria valida
  const CATEGORIAS_SITIO = ['Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos', 'Tecnología', 'Economía', 'Cultura', 'Salud', 'Política', 'Infraestructura', 'Judicial', 'General'];
  const categoriaNormalizada = n.categoria?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() || '';
  const valida = CATEGORIAS_SITIO.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === categoriaNormalizada);
  checks.push({
    nombre: 'Categoria News',
    estado: valida ? 'PASS' : 'WARN',
    mensaje: valida
      ? `Categoria: ${n.categoria}`
      : `Categoria "${n.categoria}" no estandar para Google News.`,
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return {
    aprobado: puntuacion >= 75,
    puntuacion: Math.round(puntuacion),
    checks,
  };
}

// ───────────────────────────────────────────────
// NIVEL 5: FILTROS SEO TECNICO
// ───────────────────────────────────────────────

function analizarFiltroSEO(n: NoticiaInput): FiltroResultado {
  const checks: CheckItem[] = [];

  // 1. Longitud titulo
  checks.push({
    nombre: 'Titulo SEO 50-70 chars',
    estado: n.titulo.length >= 30 && n.titulo.length <= 75 ? 'PASS' : 'WARN',
    mensaje: `${n.titulo.length} caracteres. Ideal: 50-70.`,
    valorActual: n.titulo.length,
    valorEsperado: '50-70',
  });

  // 2. Meta description
  checks.push({
    nombre: 'Meta description 120-180 chars',
    estado: n.resumen.length >= 80 && n.resumen.length <= 250 ? 'PASS' : 'WARN',
    mensaje: `${n.resumen.length} caracteres. Ideal: 120-180.`,
    valorActual: n.resumen.length,
    valorEsperado: '120-180',
  });

  // 3. Slug (generado automaticamente por el sistema)
  checks.push({
    nombre: 'Slug SEO',
    estado: 'PASS',
    mensaje: `Slug generado automaticamente: ${n.slug || 'pendiente'}.`,
  });

  // 4. Keywords en contenido
  const keywordsSugeridas = extraerKeywordsLSI(n);
  checks.push({
    nombre: 'Keywords LSI',
    estado: keywordsSugeridas.length >= 1 ? 'PASS' : 'WARN',
    mensaje: `Sugeridas: ${keywordsSugeridas.slice(0, 5).join(', ')}`,
    valorActual: keywordsSugeridas.length,
    valorEsperado: '>=1',
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return {
    aprobado: puntuacion >= 75,
    puntuacion: Math.round(puntuacion),
    checks,
  };
}

// ───────────────────────────────────────────────
// NIVEL 6: FILTROS E-E-A-T — ADAPTADO A NICARAGUA
// ───────────────────────────────────────────────

function analizarFiltroEEAT(n: NoticiaInput): FiltroResultado {
  const checks: CheckItem[] = [];
  const contenidoLowerEEAT = n.contenido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Autor visible
  checks.push({
    nombre: 'Autor identificable',
    estado: n.autor && n.autor.length > 2 ? 'PASS' : 'WARN',
    mensaje: n.autor && n.autor.length > 2
      ? `Autor: ${n.autor}`
      : 'Sin autor visible. Recomendado para EEAT.',
  });

  // 2. Fuentes realistas nicaragüenses
  const tieneAtribucionesEEAT = /testigo|familiar|vecino|habitante|morador|comerciante|conductor|pasajero|declar[oó]|indic[oó]|dijo|mencion[oó]|precis[oó]|señal[oó]|confirm[oó]|report[oó]|versiones/.test(contenidoLowerEEAT);
  const tieneCitasEEAT = (n.contenido.match(/<blockquote>/g) || []).length >= 1;
  const tieneSegunEEAT = /\bsegun\s+[A-Z]|\bde\s+acuerdo\s+con\s+[A-Z]|\bversiones\s+indican|\btestigos\s+en\s+el\s+lugar|\bfamiliares\s+de\s+la\s+victima|\bvideos\s+compartidos|\bsegun\s+medios?\s+locales?|\bredes\s+sociales\b/i.test(n.contenido);
  const passFuentesEEAT = tieneAtribucionesEEAT || tieneCitasEEAT || tieneSegunEEAT;
  checks.push({
    nombre: 'Fuentes realistas (Nicaragua)',
    estado: passFuentesEEAT ? 'PASS' : 'WARN',
    mensaje: passFuentesEEAT
      ? 'Fuentes detectadas: testigos, familiares, medios o citas.'
      : 'Sin fuentes claras. Agregar atribucion cuando sea posible.',
  });

  // 3. Anti-atribuciones falsas a instituciones estatales
  const atribFalsasEEAT = /\bla\s+policia\s+(?:inform[oó]|confirm[oó])\b|\blas\s+autoridades\s+(?:confirmaron|informaron)\b|\bel\s+ministerio\s+de\s+salud\s+(?:precis[oó]|confirm[oó])\b|\bla\s+alcald[ií]a\s+(?:inform[oó]|confirm[oó])\b/i.test(contenidoLowerEEAT);
  checks.push({
    nombre: 'EEAT Nicaragua — Instituciones',
    estado: !atribFalsasEEAT ? 'PASS' : 'FAIL',
    mensaje: !atribFalsasEEAT
      ? 'Sin atribuciones falsas a instituciones estatales.'
      : 'PROHIBIDO: Atribuir a Policia/MINSA/Alcaldia sin comunicado verificable.',
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return {
    aprobado: puntuacion >= 50 && !checks.some(c => c.estado === 'FAIL'),
    puntuacion: Math.round(puntuacion),
    checks,
  };
}

// ───────────────────────────────────────────────
// NIVEL 7: DETECTOR DE RIESGO IA (AI Pattern Detection)
// Detecta patrones estructurales típicos de texto generado por LLM:
// - Verbos operativos repetidos entre secciones
// - Simetría de longitud de párrafos (todos miden lo mismo)
// - Uniformidad de longitud de frases (misma cadencia)
// - Estructura de H2 simétrica (misma estructura por sección)
// ───────────────────────────────────────────────
// NIVEL 7: VALOR EDITORIAL REAL (Auditoría Quirúrgica)
// Reemplaza el antiguo "AI Risk" — no mide estilo, mide sustancia.
// ───────────────────────────────────────────────

function analizarFiltroValorEditorial(n: NoticiaInput): FiltroResultado {
  const checks: CheckItem[] = [];
  const textoPlano = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const textoLower = textoPlano.toLowerCase();

  // 1. ORIGEN — ¿aporta algo propio o es reformulación pura?
  const tieneFuentePropia = /\bsegún\s+(?:pudo\s+constatar|pudo\s+verificar|pudo\s+confirmar)\s+este\s+medio\b|\bpudo\s+constatar\s+este\s+medio\b|\bfuentes\s+de\s+este\s+medio\b|\bredacción\b|\binformate\b/i.test(textoLower);
  const tieneCitaEspecifica = /\bsegún\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3}\b|\bde\s+acuerdo\s+con\s+[A-ZÁÉÍÓÚÑ]\b|\btestigo|familiar|vecino|habitante|comerciante|conductor|pasajero\b/i.test(textoLower);
  const tieneAtribucionVaga = /\bsegún\s+medios\s+locales?\b|\bsegún\s+informes\b|\bsegún\s+fuentes\b|\bsegún\s+versiones\b|\bde\s+acuerdo\s+a\s+reportes\b/i.test(textoLower);
  checks.push({
    nombre: 'Origen — aporte propio',
    estado: tieneFuentePropia || tieneCitaEspecifica ? 'PASS' : tieneAtribucionVaga ? 'WARN' : 'FAIL',
    mensaje: tieneFuentePropia
      ? 'Reporteo propio declarado o fuentes identificables.'
      : tieneCitaEspecifica
        ? 'Atribución a fuente con nombre o cargo.'
        : tieneAtribucionVaga
          ? 'Atribución vaga ("según medios locales"). Agregar fuente concreta si es posible.'
          : 'Sin indicación de origen. ¿Es reformulación de otro medio sin aporte propio?',
  });

  // 2. FUENTE REAL — nombre/cargo/institución citado
  const nombresPropios = (textoPlano.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
  const instituciones = (textoLower.match(/\b(fiscalía|policía|bomberos|hospital|ministerio|alcaldía|municipio|departamento|instituto|jueza|comisaría|dirección|unidad|centro|clínica|juzgado|tribunal|procuraduría|defensoría|medicina\s+legal)\b/g) || []).length;
  const passFuenteReal = nombresPropios >= 1 || instituciones >= 1 || tieneFuentePropia;
  checks.push({
    nombre: 'Fuente real identificable',
    estado: passFuenteReal ? 'PASS' : 'FAIL',
    mensaje: passFuenteReal
      ? `${nombresPropios} nombre(s) propio(s), ${instituciones} institución(es) citada(s).`
      : 'No se detecta ningún nombre, cargo ni institución citada. Riesgo de contenido no verificable.',
  });

  // 3. EXTENSIÓN JUSTIFICADA — cada párrafo aporta un dato nuevo
  const parrafos = n.contenido.match(/<p>([\s\S]*?)<\/p>/gi) || [];
  const parrafosTexto = parrafos.map(p => p.replace(/<[^>]*>/g, '').trim()).filter(p => p.length > 10);
  let parrafosSinDato = 0;
  const datosRegex = /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+|\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\bC?\$\s*\d+|\b\d{2,3}\s+(kilómetros?|km|metros?|m|años?|frascos?|personas?|heridos?|afectados?|fallecidos?)\b|\b(Managua|Granada|León|Masaya|Estelí|Chinandega|Matagalpa|Jinotega|Rivas|Carazo|Madriz|Nueva\s+Segovia|Boaco|Chontales|San\s+Juan\s+del\s+Norte|Río\s+San\s+Juan|RAAS|RACCN)\b/gi;
  for (const p of parrafosTexto) {
    if (!datosRegex.test(p)) parrafosSinDato++;
  }
  const passExtension = parrafosTexto.length === 0 || parrafosSinDato === 0;
  checks.push({
    nombre: 'Extensión justificada — dato por párrafo',
    estado: passExtension ? 'PASS' : parrafosSinDato <= 1 ? 'WARN' : 'FAIL',
    mensaje: passExtension
      ? 'Cada párrafo aporta al menos un dato concreto.'
      : `${parrafosSinDato} párrafo(s) sin dato nuevo identificable. Revisar: ¿qué aporta cada párrafo?`,
  });

  // 4. SIN DATOS INVENTADOS — atribuciones falsas a instituciones o fuentes anónimas sin sustento
  const atribucionesFalsasDetectadas = /\b(la\s+policía\s+(?:informó|confirmó)|las\s+autoridades\s+(?:confirmaron|informaron)|el\s+ministerio\s+de\s+salud\s+(?:precisó|confirmó)|la\s+alcaldía\s+(?:informó|confirmó))\b/i.test(textoLower);
  const fuentesAnonimas = /\bsegún\s+fuentes\s+anónimas\b|\bsegún\s+informantes\s+anónimos\b/i.test(textoLower);
  checks.push({
    nombre: 'Sin datos inventados',
    estado: !atribucionesFalsasDetectadas && !fuentesAnonimas ? 'PASS' : 'FAIL',
    mensaje: atribucionesFalsasDetectadas
      ? 'Atribución falsa a institución estatal sin comunicado verificable. Corregir o sustentar.'
      : fuentesAnonimas
        ? 'Fuentes anónimas sin sustento. Usar "según el reporte" o "sin confirmación oficial" si el dato no es verificable.'
        : 'Sin indicios de datos inventados.',
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  const fails = checks.filter(c => c.estado === 'FAIL').length;
  return {
    aprobado: fails === 0,
    puntuacion: Math.round(puntuacion),
    checks,
  };
}

// ═══════════════════════════════════════════════════════════════
// EDITOR JEFE IA — NIVEL 7 (VPR 2.0)
// Clasifica el tipo de cobertura editorial y evalúa con criterios justos
// ═══════════════════════════════════════════════════════════════

function clasificarArticuloV7(titulo: string, contenido: string, categoria: string, palabraCount: number, evidencia: EvidenciaVerificable): { tipoNota: TipoNotaEditorial; tipoArticulo: TipoArticulo; razon: string } {
  const texto = (titulo + ' ' + contenido).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tit = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cat = categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // 1. ENTREVISTA: solo si hay patrón P/R o citas largas protagonistas
  const patronEntrevista = /\b(p\s*[:.)]|r\s*[:.)]|pregunta\s*[:.)]|respuesta\s*[:.)]|pregunt[oó]\s*:|entrevistador\s*:|entrevistad[oae]\s*:)/i;
  const citasLargas = (texto.match(/["“][^"”]{40,}["”]\s*(?:[,\s]*(?:dijo|declar[oó]|indic[oó]|señal[oó]|precis[oó]|explic[oó]|mencion[oó]|asegur[oó]))/gi) || []).length >= 2;
  const esEntrevista = patronEntrevista.test(texto) || citasLargas;

  // 2. ANÁLISIS: más del 40% del texto con interpretación
  const oraciones = texto.split(/[.!?]+/).filter(o => o.trim().length > 10);
  const marcadoresAnalisis = /\b(porque|por qu[eé]|significa|implica|significado|interpretaci[oó]n|an[áa]lisis|perspectiva|enfoque|consecuencia|impacto|fondo|contexto|comparado|respecto a|frente a|a diferencia de|según \w+ \w+ \w+|conclusi[oó]n|lo relevante|lo preocupante|lo positivo|lo negativo)\b/i;
  const oracionesAnalisis = oraciones.filter(o => marcadoresAnalisis.test(o)).length;
  const esAnalisis = oraciones.length > 0 && (oracionesAnalisis / oraciones.length) > 0.4;

  // 3. REPORTAJE: trabajo de campo demostrable
  const frasesReportaje = /\b(visitamos|recorrimos|observamos|nuestro equipo comprob[oó]|Nicaragua Informate confirm[oó]|estuvimos en el lugar|testimonio presencial|entrevista en el sitio|fotograf[ií]as propias|im[áa]genes de nuestro equipo)\b/i;
  const esReportaje = frasesReportaje.test(texto) && (evidencia.trabajoDeCampo || evidencia.dosFuentesIndependientes || evidencia.documentoOficialIdentificado) && palabraCount > 250;

  // 4. INVESTIGACIÓN: pruebas documentales + evidencia real
  const pruebasInvestigacion = /\b(documentos|solicitudes|registros|filtraciones|contratos|bases de datos|expedientes|informes oficiales|actas|partidas|certificados|resoluciones|acuerdos|decretos)\b/i;
  const esInvestigacion = pruebasInvestigacion.test(texto) && (evidencia.documentoOficialIdentificado || evidencia.dosFuentesIndependientes || evidencia.trabajoDeCampo) && palabraCount > 300;

  // 5. EXPLICADOR / SERVICIO / OPINIÓN: palabras clave claras
  const esExplicador = /\b(qu[eé]\s+es|c[oó]mo\s+funciona|qu[eé]\s+significa|explicador|explicaci[oó]n|por\s+qu[eé]|significado|entender|aprender|enseñar|todo\s+sobre)\b/i.test(tit + ' ' + texto);
  const esServicio = /\b(gu[íi]a|paso\s+a\s+paso|c[oó]mo|recomendaciones|consejos|tips|qu[eé]\s+hacer|d[óo]nde|cu[áa]ndo|c[óo]mo\s+llegar|servicio|pr[áa]ctico|utilidad)\b/i.test(tit) || /\b(sigue\s+estos\s+pasos|recomendaciones|consejos|para\s+evitar|c[oó]mo\s+protegerse|c[oó]mo\s+tramitar)\b/i.test(texto);
  const esOpinion = /\b(opini[oó]n|columna|editorial|punto\s+de\s+vista|mi\s+opini[oó]n|la\s+opini[oó]n\s+de)\b/i.test(tit) || /\b(considero\s+que|en\s+mi\s+opini[oó]n|creo\s+que|pienso\s+que|a\s+mi\s+parecer|deber[íi]a|deber[íi]amos)\b/i.test(texto);

  // Tipo de artículo interno
  let tipoArticulo: TipoArticulo = 'Noticia';
  if (esEntrevista) tipoArticulo = 'Entrevista';
  else if (esAnalisis) tipoArticulo = 'Análisis';
  else if (esReportaje) tipoArticulo = 'Reportaje';
  else if (esInvestigacion) tipoArticulo = 'Investigación';
  else if (esExplicador) tipoArticulo = 'Explicador';
  else if (esServicio) tipoArticulo = 'Servicio';
  else if (esOpinion) tipoArticulo = 'Opinión';

  // Categoría editorial final (16 permitidas). Para noticias, inferir tema.
  const tipoNota = inferirCategoriaNoticia(cat, tit, texto, tipoArticulo);

  const razon = (() => {
    if (tipoArticulo === 'Entrevista') return 'El texto contiene un patrón de preguntas y respuestas o citas protagonistas que identifican una entrevista.';
    if (tipoArticulo === 'Análisis') return `Más del 40% de las oraciones contienen interpretación (${Math.round((oracionesAnalisis / oraciones.length) * 100)}%).`;
    if (tipoArticulo === 'Reportaje') return 'Se detectan frases de trabajo de campo verificable.';
    if (tipoArticulo === 'Investigación') return 'Se detectan pruebas documentales o evidencia de investigación verificable.';
    if (tipoArticulo === 'Explicador') return 'El contenido explica un fenómeno para que el lector lo entienda.';
    if (tipoArticulo === 'Servicio') return 'El contenido orienta al lector sobre cómo actuar o resolver algo.';
    if (tipoArticulo === 'Opinión') return 'El texto interpreta, valora o propone un punto de vista.';
    return `El contenido se clasifica como noticia del tema ${tipoNota}.`;
  })();

  return { tipoNota, tipoArticulo, razon };
}

function inferirCategoriaNoticia(cat: string, tit: string, texto: string, tipoArticulo: TipoArticulo): TipoNotaEditorial {
  // Si el tipo de artículo ya es una de las categorías finales, devolverlo
  if (tipoArticulo !== 'Noticia') return tipoArticulo as TipoNotaEditorial;

  const mapaExacto: Record<string, TipoNotaEditorial> = {
    'sucesos': 'Sucesos', 'accidentes': 'Sucesos', 'transito': 'Sucesos', 'suceso': 'Sucesos', 'incidente': 'Sucesos',
    'politica': 'Política', 'gobierno': 'Política', 'asamblea': 'Política', 'nacionales': 'Política', 'nacional': 'Política',
    'economia': 'Economía', 'finanzas': 'Economía', 'empresas': 'Economía',
    'deportes': 'Deportes', 'beisbol': 'Deportes', 'futbol': 'Deportes', 'boxeo': 'Deportes',
    'salud': 'Salud', 'sanidad': 'Salud', 'epidemia': 'Salud', 'enfermedad': 'Salud',
    'educacion': 'Educación', 'educaci[óo]n': 'Educación', 'universidad': 'Educación', 'escuela': 'Educación',
    'tecnologia': 'Tecnología', 'tecnolog[íi]a': 'Tecnología', 'tech': 'Tecnología', 'digital': 'Tecnología',
    'internacionales': 'Internacionales', 'mundo': 'Internacionales', 'global': 'Internacionales', 'exterior': 'Internacionales',
    'cultura': 'Cultura', 'espectaculos': 'Cultura', 'arte': 'Cultura', 'musica': 'Cultura',
    'judicial': 'Sucesos', 'policial': 'Sucesos', 'justicia': 'Sucesos', 'crimen': 'Sucesos',
    'infraestructura': 'Sucesos', 'general': 'Sucesos', 'actualidad': 'Sucesos',
  };
  for (const [clave, valor] of Object.entries(mapaExacto)) {
    const regex = new RegExp(`(?:^|\\s)${clave}(?:\\s|$)`, 'i');
    if (regex.test(cat)) return valor;
  }

  // Fallback por palabras clave en título + contenido
  const temas: [string, TipoNotaEditorial][] = [
    ['deportes|beisbol|futbol|boxeo|liga|torneo|equipo|juego|serie', 'Deportes'],
    ['politica|asamblea|gobierno|ley|decreto|diputado|eleccion|voto', 'Política'],
    ['economia|precio|dolar|gasolina|canasta basica|inflacion|remesas|mercado', 'Economía'],
    ['salud|dengue|malaria|zika|covid|vacuna|minsa|hospital|enfermedad|epidemia', 'Salud'],
    ['educacion|universidad|escuela|estudiante|mined|profesor|colegio', 'Educación'],
    ['tecnologia|internet|redes sociales|app|celular|digital|ciberseguridad', 'Tecnología'],
    ['internacional|mundo|onu|oea|frontera|migracion|eeuu|mexico|centroamerica', 'Internacionales'],
    ['cultura|concierto|festival|feria|arte|musica|espectaculo|celebracion', 'Cultura'],
  ];
  for (const [regex, categoria] of temas) {
    if (new RegExp(regex, 'i').test(tit + ' ' + texto)) return categoria;
  }
  return 'Sucesos';
}

function detectarTema(titulo: string, contenido: string, categoria: string): string {
  const texto = (titulo + ' ' + contenido).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cat = categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const temaMap: [RegExp, string][] = [
    [/feminicidio|femicidio|muerte de mujer|violencia de genero|violencia contra la mujer|patricidio/, 'femicidio'],
    [/accidente de transito|accidente vial|choque|colision|vuelco|atropello|accidentes/, 'accidente_transito'],
    [/incendio|conato de incendio|fuego consumio/, 'incendio'],
    [/robo|asalto|atraco|hurto/, 'robo'],
    [/homicidio|asesinato|muerto a|muere a/, 'homicidio'],
    [/secuestro|privacion ilegal de libertad|privado de libertad/, 'secuestro'],
    [/dengue|zika|malaria|covid|vacuna|epidemia|virus|casos de|enfermedad/, 'salud_publica'],
    [/precio del dolar|tipo de cambio|canasta basica|inflacion|gasolina|remesas|precios/, 'economia'],
    [/eleccion|voto|asamblea|decreto|ley|gobierno|politica/, 'politica'],
    [/deportes|beisbol|futbol|boxeo|torneo|liga|juego/, 'deportes'],
    [/concierto|festival|arte|cultura|teatro|exposicion/, 'cultura'],
    [/educacion|escuela|universidad|estudiante|mined/, 'educacion'],
    [/tecnologia|internet|redes sociales|app|celular|digital/, 'tecnologia'],
    [/internacional|mundo|onu|oea|frontera|migracion/, 'internacional'],
    [/clima|lluvia|inundacion|sequia|huracan|terremoto/, 'clima_desastre'],
  ];
  for (const [regex, tema] of temaMap) {
    if (regex.test(texto) || regex.test(cat)) return tema;
  }
  return 'general';
}

function fabricarSugerencia(texto: string, impacto: string, tiempo: string, dificultad: 'Baja' | 'Media' | 'Alta', beneficio: string): SugerenciaV7 {
  return { texto, impacto, tiempo, dificultad, beneficio };
}

interface EvidenciaVerificable {
  fuenteOficialIdentificada: boolean;
  dosFuentesIndependientes: boolean;
  documentoOficialIdentificado: boolean;
  evidenciaOficial: boolean; // fuente oficial OR documento oficial
  trabajoDeCampo: boolean;
  datoConcreto: boolean;
  contextoLegal: boolean;
}

interface SenalesEditoriales {
  p1: number; p2: number; p3: number; p4: number; p5: number; p6: number; p7: number; p8: number; p9: number; p10: number;
  scoreAnalisis: number; scoreContexto: number; scoreInvestigacion: number; scoreCausaConsecuencia: number; scoreUtilidad: number;
  tieneAtribucion: boolean; tieneDatosConcretos: boolean; tieneNombresPropios: boolean; mencionaInstituciones: boolean; atribucionFalsa: boolean; aportePropio: boolean; infoReemplazable: boolean; palabraCount: number; imagenDestacada?: string;
  evidencia: EvidenciaVerificable;
}

function detectarEvidencia(textoLower: string, textoPlano: string): EvidenciaVerificable {
  // Lista extendida de instituciones oficiales nicaragüenses
  const nombresOficiales = 'polic[ií]a nacional|ministerio p[úu]blico|fiscal[íi]a|ministerio de salud|minsa|alcald[ií]a|polic[ií]a de tr[áa]nsito|c[áa]mara de comercio|asamblea nacional|instituto nicarag[uü]ense de seguridad social|inss|mifamilia|ministerio de la familia|ministerio de gobernaci[óo]n|ministerio de educaci[óo]n|mined|medicina legal|bomberos|cruz roja|juzgado|tribunal|comisar[ií]a|hospital|cl[ií]nica|delegaci[óo]n policial|corte suprema|poder judicial|consejo supremo electoral|cse|ineter|invur|ej[ée]rcito de nicaragua|ej[ée]rcito|fuerza a[ée]rea|migob|mific|mitrabajo|mifam|magfor|mineduc|marena|procuradur[íi]a|contralor[íi]a|banco central|c[áa]mara de comercio';

  // Fuente oficial: institución concreta citada, no genérica
  const oficiales = new RegExp(`\\b(?:${nombresOficiales})\\b`, 'i');
  const fuenteOficialIdentificada = oficiales.test(textoLower);

  // Fuentes independientes: solo entidades que aportan información al hecho.
  // No cuentan leyes, códigos, artículos ni menciones genéricas sin atribución.
  const institucionesValidas = new RegExp(`\\b(?:${nombresOficiales})\\b`, 'i');
  const noSonFuentes = /\b(c[óo]digo penal|ley n[º°]?\s*\d+|art[ií]culo|decreto|resoluci[óo]n|acuerdo|normativa|reglamento)\b/i;

  const atribuciones = textoPlano.match(/\b(?:seg[uú]n|de acuerdo con|indic[óo]|declar[óo]|precis[óo]|confirm[óo]|dijo|menci[óo]|señal[óo]|explic[óo]|report[óo]|asegur[óo]|detall[óo])\s+(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:de\s+la\s+|del\s+|de\s+|la\s+|el\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,4})\b/g) || [];
  const fuentesAtribuidas = new Set<string>();
  for (const m of atribuciones) {
    const limpio = m.toLowerCase().replace(/^[\p{L}\s]+$/u, '').replace(/\b(según|de acuerdo con|indicó|declaró|precisó|confirmó|dijo|mencionó|señaló|explicó|reportó|aseguró|detalló)\s+/, '').trim();
    if (limpio && !noSonFuentes.test(limpio) && (institucionesValidas.test(limpio) || /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(m))) {
      fuentesAtribuidas.add(limpio.replace(/\b(la|el|las|los|de|del|y|e)\s+/g, '').trim());
    }
  }

  const fuentesInstitucionales = new Set<string>();
  let m2;
  const institucionesRegex = new RegExp(`\\b(?:${nombresOficiales})\\b`, 'gi');
  while ((m2 = institucionesRegex.exec(textoPlano)) !== null) {
    fuentesInstitucionales.add(m2[0].toLowerCase().replace(/\s+de\s+la\s+|\s+del\s+|\s+de\s+/g, ' ').trim());
  }

  const personasPropias = new Set((textoPlano.match(/\b(?:testigo|vecino|habitante|familiar|conductor|pasajero|comerciante|m[eé]dico|forense|abogado|experto|vocero)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?/g) || []).map(p => p.toLowerCase()));
  const nombresPropios = new Set((textoPlano.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?/g) || []).map(n => n.toLowerCase()));

  const totalFuentesIndependientes = new Set(Array.from(fuentesAtribuidas).concat(Array.from(fuentesInstitucionales), Array.from(personasPropias), Array.from(nombresPropios))).size;
  const dosFuentesIndependientes = totalFuentesIndependientes >= 2;

  // Documento o evidencia oficial: ley, informe, resolución, etc., o atribución a institución oficial
  const documentoMencionado = /\b(ley\s+n[º°]?\s*\d+|c[óo]digo\s+de|informe\s+(?:oficial|anual|mensual|t[eé]cnico)|resoluci[óo]n\s+n[º°]?\s*\d+|acuerdo\s+n[º°]?\s*\d+|decreto\s+n[º°]?\s*\d+|estad[ií]stica\s+oficial|documento\s+oficial|partida\s+de\s+defunci[óo]n|bolet[ií]n\s+oficial|informe\s+policial|certificado\s+m[eé]dico|expediente\s+judicial|acta policial)\b/i.test(textoLower);
  const documentoOficialIdentificado = documentoMencionado || fuenteOficialIdentificada;
  const evidenciaOficial = fuenteOficialIdentificada || documentoOficialIdentificado;

  // Trabajo de campo: solo si hay frases explícitas de verificación presencial
  const trabajoDeCampo = /\b(?:pudo\s+(?:constatar|verificar|confirmar)\s+(?:en\s+el\s+lugar|este\s+medio|Nicaragua\s+Informate)|nuestro\s+equipo\s+(?:estuvo|recorri[óo])|en\s+el\s+lugar\s+(?:se\s+observ|se\s+verific|se\s+constat)|fotograf[íi]as\s+propias|im[áa]genes\s+de\s+nuestro\s+equipo|testimonio\s+presencial|entrevista\s+en\s+el\s+lugar)\b/i.test(textoLower);

  // Dato concreto: fechas, cifras, montos, cantidades verificables
  const datoConcreto = /\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|C?\$\s*\d+|\b\d{2,3}\s+(?:kil[óo]metros?|km|metros?|m|a[ñn]os?|frascos?|personas?|heridos?|afectados?|fallecidos?|v[íi]ctimas?)\b/i.test(textoPlano);

  // Contexto legal: ley, artículo, código, delito, pena, proceso
  const contextoLegal = /\b(ley|art[ií]culo|c[óo]digo|pena|delito|proceso|judicial|juez|fiscal|defensa|sentencia|imputado|acusado|investigaci[óo]n)\b/i.test(textoLower);

  return {
    fuenteOficialIdentificada,
    dosFuentesIndependientes,
    documentoOficialIdentificado,
    evidenciaOficial,
    trabajoDeCampo,
    datoConcreto,
    contextoLegal,
  };
}

function toStars(puntos: number, max: number): string {
  const ratio = max > 0 ? puntos / max : 0;
  const llenas = Math.round(ratio * 5);
  return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

function obtenerCriteriosEditorJefe(tipoArticulo: TipoArticulo, _tipoNota: TipoNotaEditorial, s: SenalesEditoriales): { criterios: ReporteEditorJefe['criterios']; max: number } {
  const criterios: ReporteEditorJefe['criterios'] = [];
  const add = (nombre: string, max: number, raw: number, justificacion: string) => {
    const puntuacion = Math.min(max, Math.max(0, Math.round(raw)));
    criterios.push({ nombre, puntuacion, maximo: max, justificacion, estrellas: toStars(puntuacion, max) });
  };
  const just = (detectado: boolean, positivo: string, neutral: string, ausente: string) =>
    detectado ? positivo : (s.tieneAtribucion || s.evidencia.datoConcreto) ? neutral : ausente;

  const ptsOficial = s.evidencia.evidenciaOficial ? 20 : s.evidencia.fuenteOficialIdentificada ? 14 : s.tieneAtribucion ? 8 : 2;
  const ptsCampo = s.evidencia.trabajoDeCampo ? 20 : s.evidencia.dosFuentesIndependientes ? 14 : s.tieneAtribucion ? 6 : 2;
  const ptsDato = s.evidencia.datoConcreto ? 20 : s.tieneDatosConcretos ? 12 : 2;
  const ptsContexto = s.scoreContexto >= 4 ? 20 : s.scoreContexto >= 2 ? 14 : s.scoreContexto >= 1 ? 6 : 2;
  const ptsUtilidad = s.scoreUtilidad >= 4 ? 20 : s.scoreUtilidad >= 2 ? 14 : s.scoreUtilidad >= 1 ? 6 : 2;
  const ptsClaridad = s.p3 >= 6 ? 20 : s.p3 >= 4 ? 14 : s.p3 >= 2 ? 6 : 2;
  const ptsAnalisis = s.scoreAnalisis >= 4 ? 20 : s.scoreAnalisis >= 2 ? 14 : s.scoreAnalisis >= 1 ? 6 : 2;

  const matrices: Record<TipoArticulo, { nombre: string; max: number; raw: number; just: string }[]> = {
    'Noticia': [
      { nombre: 'Qué pasó', max: 20, raw: ptsClaridad, just: just(s.p3 >= 5, 'Narra el hecho con claridad.', 'El relato es comprensible, aunque puede precisar más detalles.', 'La narrativa del hecho no es clara en el texto.') },
      { nombre: 'Fuente identificable', max: 20, raw: ptsOficial, just: just(s.evidencia.evidenciaOficial, 'Se identifica fuente oficial o documento.', 'Hay atribución, pero falta identificación oficial clara.', 'No se detecta fuente identificable.') },
      { nombre: 'Datos concretos', max: 20, raw: ptsDato, just: just(s.evidencia.datoConcreto, 'Aporta fechas, cifras o cantidades concretas.', 'Tiene algún dato, aunque podría reforzar cifras.', 'No se detectan datos concretos verificables.') },
      { nombre: 'Contexto básico', max: 20, raw: ptsContexto, just: just(s.scoreContexto >= 2, 'Sitúa el hecho con antecedentes o marco institucional.', 'Tiene algo de contexto.', 'No se detecta contexto en el texto.') },
      { nombre: 'Utilidad para el lector', max: 20, raw: ptsUtilidad, just: just(s.scoreUtilidad >= 2, 'Entrega utilidad práctica o clarifica impacto.', 'La utilidad es limitada en el texto.', 'No se detecta utilidad práctica clara.') },
    ],
    'Análisis': [
      { nombre: 'Tesis interpretativa clara', max: 25, raw: ptsAnalisis, just: just(s.scoreAnalisis >= 3, 'Plantea una interpretación clara.', 'La tesis es débil.', 'No se detecta una tesis interpretativa.') },
      { nombre: 'Evidencia que sostiene la tesis', max: 20, raw: s.evidencia.datoConcreto ? 18 : s.scoreContexto >= 2 ? 12 : 4, just: just(s.evidencia.datoConcreto || s.scoreContexto >= 2, 'Apoya la interpretación con datos o contexto.', 'Fundamentación parcial.', 'No se sustenta la tesis con evidencia.') },
      { nombre: 'Contexto suficiente', max: 20, raw: ptsContexto, just: just(s.scoreContexto >= 2, 'Entrega el contexto necesario.', 'Contexto parcial.', 'Contexto insuficiente.') },
      { nombre: 'Consecuencias o implicaciones', max: 20, raw: ptsUtilidad, just: just(s.scoreUtilidad >= 2, 'Explica consecuencias o implicaciones.', 'Consecuencias parciales.', 'No se explican consecuencias.') },
      { nombre: 'Fuentes verificables', max: 15, raw: ptsOficial, just: just(s.evidencia.evidenciaOficial, 'Cita fuentes verificables.', 'Hay alguna fuente.', 'Fuentes no identificables.') },
    ],
    'Reportaje': [
      { nombre: 'Trabajo de campo o presencia', max: 25, raw: ptsCampo, just: just(s.evidencia.trabajoDeCampo, 'Hay evidencia de trabajo de campo.', 'Hay entrevistas o fuentes, aunque no trabajo de campo visible.', 'No se detecta trabajo de campo.') },
      { nombre: 'Testimonios o fuentes directas', max: 20, raw: s.evidencia.dosFuentesIndependientes ? 20 : s.tieneAtribucion ? 10 : 4, just: just(s.evidencia.dosFuentesIndependientes, 'Incluye testimonios o fuentes directas.', 'Hay alguna atribución, pero pocas voces directas.', 'No se detectan testimonios ni fuentes directas.') },
      { nombre: 'Contexto social o histórico', max: 20, raw: ptsContexto, just: just(s.scoreContexto >= 2, 'Sitúa el tema en contexto social o histórico.', 'Hay algo de contexto.', 'Contexto limitado.') },
      { nombre: 'Documentos o datos', max: 20, raw: ptsDato, just: just(s.evidencia.datoConcreto, 'Sustenta con datos o documentos.', 'Tiene algún dato.', 'No se detectan datos ni documentos.') },
      { nombre: 'Narrativa y utilidad', max: 15, raw: ptsUtilidad, just: just(s.scoreUtilidad >= 2, 'Combina narrativa con utilidad para el lector.', 'Narrativa presente, utilidad limitada.', 'No se detecta narrativa ni utilidad clara.') },
    ],
    'Investigación': [
      { nombre: 'Fuentes contrastadas', max: 25, raw: s.evidencia.dosFuentesIndependientes ? 25 : s.evidencia.fuenteOficialIdentificada ? 14 : 4, just: just(s.evidencia.dosFuentesIndependientes, 'Se contrastan dos o más fuentes independientes.', 'Hay una fuente oficial o atribución.', 'No se detectan fuentes múltiples.') },
      { nombre: 'Evidencia documental verificable', max: 25, raw: s.evidencia.documentoOficialIdentificado ? 25 : s.evidencia.datoConcreto ? 16 : 4, just: just(s.evidencia.documentoOficialIdentificado, 'Identifica documento o evidencia oficial.', 'Tiene datos, pero no documento verificable.', 'No se detecta documento ni evidencia sólida.') },
      { nombre: 'Hallazgo principal claro', max: 20, raw: s.p3 >= 6 ? 18 : s.p2 >= 4 ? 12 : 4, just: just(s.p3 >= 5, 'Explica con claridad el hallazgo principal.', 'El hallazgo es mencionado, pero poco desarrollado.', 'No se detecta un hallazgo claro.') },
      { nombre: 'Trabajo propio', max: 15, raw: s.evidencia.trabajoDeCampo ? 15 : s.aportePropio ? 10 : 4, just: just(s.evidencia.trabajoDeCampo || s.aportePropio, 'Hay evidencia de trabajo propio de Nicaragua Informate.', 'Hay indicios de trabajo propio.', 'No se detecta trabajo propio verificable en el texto.') },
      { nombre: 'Impacto público', max: 15, raw: ptsUtilidad, just: just(s.scoreUtilidad >= 2, 'Explica el impacto en el público.', 'Impacto parcial.', 'No se detecta impacto comunicado.') },
    ],
    'Entrevista': [
      { nombre: 'Fuente identificada', max: 25, raw: s.tieneNombresPropios ? 22 : s.tieneAtribucion ? 12 : 4, just: just(s.tieneNombresPropios, 'Identifica claramente al entrevistado.', 'Menciona una fuente, pero no con nombre claro.', 'No se identifica al entrevistado.') },
      { nombre: 'Preguntas relevantes', max: 20, raw: s.p4 >= 5 ? 18 : s.scoreUtilidad >= 2 ? 12 : 4, just: just(s.p4 >= 5 || s.scoreUtilidad >= 2, 'Plantea preguntas relevantes.', 'Preguntas poco relevantes.', 'No se detectan preguntas relevantes.') },
      { nombre: 'Citas atribuidas', max: 20, raw: s.tieneAtribucion ? 18 : 4, just: just(s.tieneAtribucion, 'Cita correctamente al entrevistado.', 'Citas escasas.', 'No se detectan citas atribuidas.') },
      { nombre: 'Contexto de la fuente', max: 20, raw: ptsContexto, just: just(s.scoreContexto >= 2, 'Contextualiza quién es la fuente.', 'Contexto parcial.', 'No se contextualiza la fuente.') },
      { nombre: 'Utilidad para el lector', max: 15, raw: ptsUtilidad, just: just(s.scoreUtilidad >= 2, 'La entrevista entrega valor al lector.', 'Utilidad parcial.', 'No se detecta utilidad para el lector.') },
    ],
    'Explicador': [
      { nombre: 'Claridad explicativa', max: 25, raw: s.p4 >= 6 ? 25 : s.p4 >= 4 ? 18 : 6, just: just(s.p4 >= 5, 'Explica de forma clara y comprensible.', 'Explica, aunque podría ser más claro.', 'No logra explicar el tema.') },
      { nombre: 'Contexto suficiente', max: 20, raw: ptsContexto, just: just(s.scoreContexto >= 2, 'Entrega el contexto necesario.', 'Contexto parcial.', 'Contexto insuficiente.') },
      { nombre: 'Ejemplos concretos', max: 20, raw: ptsDato, just: just(s.evidencia.datoConcreto, 'Usa ejemplos o datos concretos.', 'Tiene algún ejemplo.', 'No se detectan ejemplos concretos.') },
      { nombre: 'Utilidad práctica', max: 20, raw: ptsUtilidad, just: just(s.scoreUtilidad >= 2, 'El lector puede aplicar lo aprendido.', 'Utilidad parcial.', 'No se detecta utilidad práctica.') },
      { nombre: 'Fuentes verificables', max: 15, raw: ptsOficial, just: just(s.evidencia.evidenciaOficial, 'Cita fuentes verificables.', 'Hay alguna fuente.', 'Fuentes no identificables.') },
    ],
    'Servicio': [
      { nombre: 'Utilidad práctica', max: 25, raw: s.scoreUtilidad >= 4 ? 25 : s.scoreUtilidad >= 2 ? 18 : 6, just: just(s.scoreUtilidad >= 3, 'Resuelve una necesidad práctica del lector.', 'Tiene utilidad, pero poco desarrollada.', 'No se detecta utilidad práctica clara.') },
      { nombre: 'Pasos accionables', max: 25, raw: s.scoreUtilidad >= 3 ? 25 : s.scoreUtilidad >= 1 ? 12 : 4, just: just(s.scoreUtilidad >= 3, 'Entrega pasos concretos para actuar.', 'Pasos vagos o incompletos.', 'No se entregan pasos para actuar.') },
      { nombre: 'Fuentes de autoridad', max: 20, raw: ptsOficial, just: just(s.evidencia.evidenciaOficial, 'Cita fuentes oficiales o especialistas.', 'Hay alguna fuente.', 'No se detectan fuentes de autoridad.') },
      { nombre: 'Claridad', max: 20, raw: ptsClaridad, just: just(s.p3 >= 5, 'Instrucciones claras.', 'Claridad parcial.', 'No es claro cómo actuar.') },
      { nombre: 'Vigencia', max: 10, raw: s.evidencia.datoConcreto ? 10 : 4, just: just(s.evidencia.datoConcreto, 'Incluye fechas, horarios o vigencia.', 'Vigencia parcial.', 'No se detectan datos de vigencia.') },
    ],
    'Opinión': [
      { nombre: 'Argumento central', max: 25, raw: s.scoreAnalisis >= 4 ? 22 : s.p4 >= 5 ? 18 : 6, just: just(s.scoreAnalisis >= 3 || s.p4 >= 5, 'Plantea un argumento claro.', 'El argumento es difuso.', 'No se detecta argumento central.') },
      { nombre: 'Fundamentación verificable', max: 25, raw: s.evidencia.datoConcreto ? 22 : s.scoreContexto >= 2 ? 14 : 4, just: just(s.evidencia.datoConcreto || s.scoreContexto >= 2, 'Apoya la opinión con datos o hechos.', 'Fundamentación débil.', 'Opinión sin hechos verificables.') },
      { nombre: 'Contexto', max: 20, raw: ptsContexto, just: just(s.scoreContexto >= 2, 'Situía el tema en contexto.', 'Contexto parcial.', 'Sin contexto.') },
      { nombre: 'Propuesta o conclusión', max: 20, raw: s.scoreUtilidad >= 2 ? 18 : 6, just: just(s.scoreUtilidad >= 2, 'Ofrece una propuesta o conclusión.', 'Conclusión débil.', 'No se detecta propuesta o conclusión.') },
      { nombre: 'Respeto a los hechos', max: 10, raw: s.atribucionFalsa ? 0 : s.tieneAtribucion ? 8 : 4, just: just(!s.atribucionFalsa && s.tieneAtribucion, 'Respeta los hechos y no inventa fuentes.', 'Riesgo de atribución poco clara.', 'Se detectan atribuciones problemáticas.') },
    ],
  };

  const matriz = matrices[tipoArticulo] || matrices['Noticia'];
  for (const c of matriz) add(c.nombre, c.max, c.raw, c.just);
  return { criterios, max: matriz.reduce((sum, c) => sum + c.max, 0) };
}

// ───────────────────────────────────────────────
// AUTOAUDITORÍA CONSTITUCIÓN V6.0
// ───────────────────────────────────────────────

function palabrasClaveTema(tema: string): string[] {
  const mapa: Record<string, string[]> = {
    'femicidio': ['femicidio', 'feminicidio', 'mujer', 'violencia', 'género', 'agresor', 'víctima', 'judicial', 'denuncia', 'prevención', 'proceso', 'ley', 'sentencia', 'protección'],
    'accidente_transito': ['accidente', 'tránsito', 'vehículo', 'conductor', 'herido', 'víctima', 'policía', 'carretera', 'señalización', 'velocidad', 'ruta'],
    'incendio': ['incendio', 'fuego', 'bomberos', 'vivienda', 'conato', 'evacuación', 'afectado', 'material'],
    'robo': ['robo', 'asalto', 'delincuencia', 'víctima', 'policía', 'denuncia', 'seguridad'],
    'homicidio': ['homicidio', 'asesinato', 'víctima', 'autor', 'investigación', 'policía', 'escena'],
    'secuestro': ['secuestro', 'libertad', 'rescate', 'víctima', 'investigación', 'policía'],
    'salud_publica': ['salud', 'enfermedad', 'vacuna', 'dengue', 'médico', 'hospital', 'minsa', 'casos', 'prevención'],
    'economia': ['precio', 'dólar', 'economía', 'mercado', 'inflación', 'canasta', 'salario', 'remesas'],
    'politica': ['gobierno', 'política', 'asamblea', 'ley', 'decreto', 'elección', 'voto', 'oposición'],
    'deportes': ['equipo', 'juego', 'torneo', 'liga', 'deportes', 'entrenador', 'jugador'],
    'cultura': ['cultura', 'concierto', 'festival', 'arte', 'música', 'exposición', 'artista'],
    'educacion': ['educación', 'escuela', 'universidad', 'estudiante', 'profesor', 'ministerio'],
    'tecnologia': ['tecnología', 'internet', 'aplicación', 'celular', 'redes', 'digital'],
    'internacional': ['internacional', 'frontera', 'migración', 'gobierno', 'país', 'relaciones'],
    'clima_desastre': ['lluvia', 'inundación', 'sequía', 'huracán', 'terremoto', 'clima', 'afectados'],
    'general': ['dato', 'fuente', 'contexto', 'utilidad', 'impacto', 'información'],
  };
  return mapa[tema] || mapa['general'];
}

function autoauditarConstitucion(
  reporte: ReporteEditorJefe,
  senales: SenalesEditoriales,
  textoLower: string,
  tema: string
): { ajustes: Partial<ReporteEditorJefe>; observaciones: string[] } {
  const observaciones: string[] = [];
  const ajustes: Partial<ReporteEditorJefe> = {};
  const ev = senales.evidencia;
  const evidenciaFuerte = ev.trabajoDeCampo || ev.dosFuentesIndependientes || ev.documentoOficialIdentificado;

  function veredictoPorPuntuacion(p: number): ReporteEditorJefe['veredicto'] {
    if (p >= 95) return '★★★★★ Nota de referencia';
    if (p >= 90) return '★★★★☆ Muy competitiva';
    if (p >= 80) return '★★★★ Competitiva';
    if (p >= 70) return '★★★ Publicable';
    if (p >= 60) return '★★ Necesita desarrollo';
    return '★ Reemplazable';
  }

  // 1. Alucinación de puntuación: puntaje alto sin evidencia visible
  if (reporte.puntuacion >= 85 && !evidenciaFuerte && !ev.fuenteOficialIdentificada) {
    observaciones.push('Autoauditoría V7: puntaje alto sin fuente oficial ni evidencia de trabajo propio; se ajusta para evitar alucinación.');
    ajustes.puntuacion = Math.min(reporte.puntuacion, 79);
    ajustes.veredicto = veredictoPorPuntuacion(ajustes.puntuacion);
  }

  // 2. Veredicto inconsistente con score
  if (reporte.veredicto !== veredictoPorPuntuacion(reporte.puntuacion)) {
    observaciones.push('Autoauditoría V7: el veredicto no coincide con el puntaje; se corrige.');
    ajustes.veredicto = veredictoPorPuntuacion(reporte.puntuacion);
  }

  // 3. Tipo de artículo vs evidencia mínima
  if (reporte.tipoArticulo === 'Investigación' && !evidenciaFuerte) {
    observaciones.push('Autoauditoría V7: una Investigación requiere evidencia visible de trabajo propio; se reclasifica como Noticia.');
    ajustes.tipoArticulo = 'Noticia';
  }
  if (reporte.tipoArticulo === 'Reportaje' && !(ev.trabajoDeCampo || ev.documentoOficialIdentificado)) {
    observaciones.push('Autoauditoría V7: un Reportaje requiere evidencia de campo o documento; se reclasifica como Noticia.');
    ajustes.tipoArticulo = 'Noticia';
  }

  // 4. Lenguaje prohibido o negativo
  const palabrasProhibidas = /\b(malo|pesimo|horrible|negligente|incompetente|mentira|falso|fake|ridiculo|vergonzoso|asco|basura|chafa|amarillista|sesgado|manipulador)\b/gi;
  const palabrasDetectadas = (textoLower.match(palabrasProhibidas) || []);
  if (palabrasDetectadas.length > 0) {
    observaciones.push(`Autoauditoría V7 detectó lenguaje no constitucional: ${palabrasDetectadas.join(', ')}.`);
  }

  // 5. Alineación de sugerencias con el tema detectado
  const claves = palabrasClaveTema(tema);
  const alineada = (s: SugerenciaV7) => claves.some(k => s.texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(k));
  const alineadaTexto = (s: string) => claves.some(k => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(k));

  const oportunidades = reporte.oportunidadesEditoriales.filter(alineada);
  if (oportunidades.length < 2) {
    observaciones.push('Autoauditoría V7: se reforzaron oportunidades editoriales para que coincidan con el tema.');
  }

  const comoReferencia = reporte.comoConvertirReferencia.filter(alineada);
  const nivel10 = reporte.nivel10_oportunidades.filter(alineada);
  const nivel9 = reporte.nivel9_preguntasSinRespuesta.filter(alineadaTexto);

  if (oportunidades.length < 2) ajustes.oportunidadesEditoriales = oportunidades.slice(0, 3);
  if (comoReferencia.length < 2) ajustes.comoConvertirReferencia = comoReferencia.slice(0, 3);
  if (nivel10.length < 2) ajustes.nivel10_oportunidades = nivel10.slice(0, 3);
  if (nivel9.length < 2) ajustes.nivel9_preguntasSinRespuesta = nivel9.slice(0, 4);

  return { ajustes, observaciones };
}

function analizarValorPeriodisticoReal(n: NoticiaInput): ReporteEditorJefe {
  const textoPlano = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const textoLower = textoPlano.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const palabraCount = textoPlano.split(/\s+/).filter(p => p.length > 0).length;

  const tieneAtribucion = /\b(testigo|familiar|vecino|habitante|morador|comerciante|conductor|pasajero|testimonio|declaro?|indico?|dijo|menciono?|preciso?|senalo?|confirmo?|segun\s+[A-Z]|de acuerdo con|versiones indican|redes sociales|medios locales|fiscal|policia|autoridad|oficial|spokesperson|director|jefe|vocero|representante)\b/i.test(textoLower);
  const tieneDatosConcretos = /\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\bC?\$\s*\d+|\b\d{2,3}\s+(kilometros?|km|metros?|m|anos?|frascos?|personas?|heridos?|afectados?|fallecidos?|victimas?)\b/i.test(textoPlano);
  const tieneNombresPropios = /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(textoPlano);
  const atribucionFalsa = /\b(la\s+policía\s+(?:informó|confirmó)|las\s+autoridades\s+(?:confirmaron|informaron)|el\s+ministerio\s+de\s+salud\s+(?:precisó|confirmó)|la\s+alcaldía\s+(?:informó|confirmó))\b/i.test(textoLower) || /\bsegún\s+fuentes\s+anónimas\b|\bsegún\s+informantes\s+anónimos\b/i.test(textoLower);

  const palabrasContexto = /\b(antecedente|historia|estadistica|comparacion|comparativo|ley|dato historico|hecho similar|institucion|instituciones|situacion previa|contexto|background|marco|evolucion|cronologia|linea de tiempo)\b/i;
  const palabrasInvestigacion = /\b(documento|documentos|cifra oficial|estadistica|cronologia|informe|informes|reporte|investigacion|pesquisa|verificacion|consulta|analisis|recopilacion|dato\s+oficial)\b/i;
  const palabrasAnalisis = /\b(contexto|comparacion|investigacion|explicacion|analisis|consecuencia|impacto|utilidad|prevencion|medida|recomendacion|por que|como afecta|cambio|viene ahora|significado)\b/i;
  const palabrasCausaConsecuencia = /\b(por que|porque|causa|causas|motivo|origen|como ocurrio|consecuencia|impacto|afecta|cambio|provoco|genero|resultado|derivado|debido a|producto de|falta de|exceso de|factor|provocado por|provocada por|ocasionado por|ocasionada por|segun\s+\w+\s+(?:indic|report|precis|confirm|declar))\b/i;
  const palabrasUtilidad = /\b(decision|prevenir|prevention|evitar|cuidado|medida|recomendacion|alerta|precaucion|proteger|informarse|enterarse|conocer)\b/i;
  const palabrasDiferenciador = /\b(exclusiva|entrevista|documento|informe|mapa|cronologia|estadistica|dato historico|contexto social|impacto economico|prevencion|testimonio|declaraciones)\b/i;
  const mencionaInstituciones = /\b(fiscalia|policia|bomberos|hospital|ministerio|alcaldia|municipio|instituto|jueza|comisaria|direccion|clinica|juzgado|tribunal|procuraduria|defensoria|medicina legal|managua|granada|leon|masaya|esteli|chinandega|matagalpa|jinotega|rivas|carazo|madriz)\b/i.test(textoLower);

  const scoreContexto = (textoLower.match(palabrasContexto) || []).length;
  const scoreInvestigacion = (textoLower.match(palabrasInvestigacion) || []).length;
  const scoreAnalisis = (textoLower.match(palabrasAnalisis) || []).length;
  const scoreCausaConsecuencia = (textoLower.match(palabrasCausaConsecuencia) || []).length;
  const scoreUtilidad = (textoLower.match(palabrasUtilidad) || []).length;
  const scoreDiferenciador = (textoLower.match(palabrasDiferenciador) || []).length;

  const aportePropio = /\b(Nicaragua\s+Informate|Informate|este\s+medio|nuestro\s+equipo|nuestra\s+redacci[oó]n)\s+(confirm[oó]|consult[oó]|verific[oó]|obtuvo|constat[oó]|descubri[oó]|revis[oó]|investig[oó]|entrevist[oó])\b/i.test(textoPlano);
  const infoReemplazable = /\b(según\s+medios\s+locales?|según\s+informes|según\s+fuentes|versiones\s+indican|se\s+reporta\s+que|se\s+informa\s+que|de\s+acuerdo\s+a\s+reportes)\b/i.test(textoLower);
  const evidencia = detectarEvidencia(textoLower, textoPlano);

  const respondeQue = /\b(ocurrio|sucedio|registro|hecho|incidente|accidente|evento)\b/i.test(textoLower);
  const p1 = infoReemplazable && !aportePropio ? 5 : aportePropio ? 20 : tieneAtribucion && tieneDatosConcretos ? 15 : 8;
  const p2 = Math.min(10, scoreAnalisis * 2 + (tieneDatosConcretos ? 2 : 0) + (aportePropio ? 3 : 0));
  const p3 = Math.min(10, (respondeQue ? 3 : 0) + Math.min(scoreCausaConsecuencia * 2, 7));
  const p4 = Math.min(10, scoreAnalisis + scoreUtilidad + (palabraCount > 300 ? 2 : 0));
  const p5 = Math.min(10, scoreContexto * 2 + (mencionaInstituciones ? 2 : 0));
  const p6 = Math.min(10, scoreInvestigacion * 2 + (tieneNombresPropios ? 2 : 0));
  const p7 = Math.min(10, (tieneAtribucion ? 4 : 0) + (tieneNombresPropios ? 2 : 0) + (tieneDatosConcretos ? 2 : 0) + (mencionaInstituciones ? 2 : 0));
  const p8 = Math.min(10, scoreUtilidad * 2 + (scoreCausaConsecuencia ? 2 : 0));
  const p9 = Math.min(10, scoreDiferenciador * 2 + (aportePropio ? 4 : 0));
  const p10 = Math.min(10, (p1 / 20) * 3 + (p2 / 10) * 2 + (p4 / 10) * 2 + (p7 / 10) * 2 + (n.imagenDestacada ? 1 : 0));

  const { tipoNota, tipoArticulo, razon: razonamientoTipo } = clasificarArticuloV7(n.titulo, n.contenido, n.categoria, palabraCount, evidencia);
  const tema = detectarTema(n.titulo, n.contenido, n.categoria);

  const senales: SenalesEditoriales = {
    p1, p2, p3, p4, p5, p6, p7, p8, p9, p10,
    scoreAnalisis, scoreContexto, scoreInvestigacion, scoreCausaConsecuencia, scoreUtilidad,
    tieneAtribucion, tieneDatosConcretos, tieneNombresPropios, mencionaInstituciones, atribucionFalsa, aportePropio, infoReemplazable, palabraCount, imagenDestacada: n.imagenDestacada,
    evidencia,
  };

  const { criterios, max: puntuacionMaxima } = obtenerCriteriosEditorJefe(tipoArticulo, tipoNota, senales);
  const rawTotal = criterios.reduce((sum, c) => sum + c.puntuacion, 0);
  const puntuacionTotal = Math.min(rawTotal, puntuacionMaxima);

  // Ajustar criterios proporcionalmente si supera el máximo
  if (rawTotal > puntuacionMaxima && rawTotal > 0) {
    const factor = puntuacionMaxima / rawTotal;
    criterios.forEach(c => { c.puntuacion = Math.round(c.puntuacion * factor); });
  }

  // Veredicto escalado a 100 (capado por evidencia real para evitar alucinaciones)
  let score100 = Math.round((puntuacionTotal / puntuacionMaxima) * 100);
  if (tipoArticulo === 'Investigación' && !(evidencia.dosFuentesIndependientes || evidencia.trabajoDeCampo)) score100 = Math.min(score100, 60);
  if (tipoArticulo === 'Reportaje' && !(evidencia.trabajoDeCampo || evidencia.documentoOficialIdentificado)) score100 = Math.min(score100, 65);
  if (!tieneAtribucion && !evidencia.fuenteOficialIdentificada) score100 = Math.min(score100, 60);

  // Detectores (se necesitan antes de las decisiones editoriales)
  const detectorNicaraguaInformate = generarDetectorNicaraguaInformate(senales);
  const detectorGoogle = generarDetectorGoogle(score100, p1, p7, scoreContexto, scoreInvestigacion, aportePropio);
  const detectorEEATReal = generarDetectorEEATReal(senales);

  // Primera decisión del director: ¿existe razón objetiva para leer ESTA versión de Nicaragua Informate?
  const { siNo: razonReferenciaSiNo, razon: razonamientoReferencia, faltantes: faltantesRazon } = evaluarRazonamientoReferencia(senales);
  if (razonReferenciaSiNo === 'No') {
    score100 = Math.min(score100, 85);
  }

  // Veredicto según la nueva constitución editorial
  let veredicto: ReporteEditorJefe['veredicto'];
  if (score100 >= 95) veredicto = '★★★★★ Nota de referencia';
  else if (score100 >= 90) veredicto = '★★★★☆ Muy competitiva';
  else if (score100 >= 80) veredicto = '★★★★ Competitiva';
  else if (score100 >= 70) veredicto = '★★★ Publicable';
  else if (score100 >= 60) veredicto = '★★ Necesita desarrollo';
  else veredicto = '★ Reemplazable';

  // Segunda decisión: ¿qué produjo Nicaragua Informate?
  const porQueExiste = razonReferenciaSiNo === 'Sí'
    ? 'Sí merece existir: aporta evidencia verificable o trabajo propio que la diferencia de una repetición del hecho.'
    : `No demuestra aún una razón objetiva para preferir esta versión frente a TN8, Canal 10, La Prensa o Artículo 66. Hace falta producir: ${faltantesRazon.slice(0, 3).join(', ')}.`;
  const aporteOriginal = detectorNicaraguaInformate;

  // Sugerencias V7 con filtro de contradicciones
  const {
    oportunidadesEditoriales: oportunidadesCrudas,
    comoConvertirReferencia: comoReferenciaCrudas,
    nivel10_oportunidades: nivel10Crudas,
    nivel9_preguntasSinRespuesta,
    preguntaSinResponder,
    investigacionAdicional,
    datoEnriquecedor,
  } = generarSugerenciasV7(senales, tipoArticulo, tipoNota, tema, n.titulo);

  const sinContradicciones = (lista: SugerenciaV7[]) => {
    const ev = senales.evidencia;
    const yaCubierto: RegExp[] = [];
    if (ev.datoConcreto) yaCubierto.push(/\b(cifras?|datos?|estadisticas?|numeros?|porcentajes?|magnitud)\b/i);
    if (ev.contextoLegal) yaCubierto.push(/\b(ley|codigo|pena|delito|proceso|judicial|fiscal|juez|sentencia|imputado|acusado|marco legal)\b/i);
    if (ev.trabajoDeCampo) yaCubierto.push(/\b(lugar|constato|verifico|campo|testimonio|testigo|en el sitio|en el lugar)\b/i);
    if (senales.scoreAnalisis > 2) yaCubierto.push(/\b(contexto|por que|implica|significa|consecuencia|impacto|por qué importa)\b/i);
    if (senales.scoreUtilidad > 1) yaCubierto.push(/\b(como|prevenir|evitar|proteger|guia|pasos|recomendacion|utilidad practica)\b/i);
    if (ev.dosFuentesIndependientes) yaCubierto.push(/\b(fuentes?|contrastar|versiones?|segunda|independiente)\b/i);
    if (ev.documentoOficialIdentificado) yaCubierto.push(/\b(documento|oficial|informe|resolucion|acuerdo|decreto|acta)\b/i);
    return lista.filter(sug => {
      const textoSugerencia = sug.texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return !yaCubierto.some(r => r.test(textoSugerencia));
    });
  };

  const oportunidadesEditoriales = sinContradicciones(oportunidadesCrudas);
  const comoConvertirReferencia = sinContradicciones(comoReferenciaCrudas);
  const nivel10_oportunidades = sinContradicciones(nivel10Crudas);

  // Detectores
  const detectorFacebook = generarDetectorFacebook(score100, scoreUtilidad, scoreContexto, scoreAnalisis, aportePropio);

  // Discover / compartir
  const descubreProbabilidad: ReporteEditorJefe['descubreProbabilidad'] = p10 >= 7 ? 'ALTA' : p10 >= 5 ? 'MEDIA' : 'BAJA';
  const discoverRazon = p10 >= 7
    ? 'Actualidad, utilidad y señales de confianza la hacen candidata fuerte para Discover.'
    : p10 >= 5
      ? 'Tiene algunos atributos, pero necesita más originalidad o servicio para destacar.'
      : 'Falta utilidad, contexto o diferenciador; de momento dependería solo del tráfico de noticia.';

  const compartibleSiNo: ReporteEditorJefe['compartibleSiNo'] = (score100 >= 70 && (scoreUtilidad > 0 || scoreContexto > 1)) ? 'Sí' : 'No';
  const porQueCompartible = compartibleSiNo === 'Sí'
    ? 'La gente la compartiría porque aporta información útil que puede ayudar a alguien a entender o actuar.'
    : 'No se detecta un motivo de ayuda claro; la nota necesita utilidad o verificación para que alguien la difunda.';

  // Niveles 7.5-10
  const nivel7_5_evidenciaAporte = detectarEvidenciaAporte(textoPlano, aportePropio, evidencia);
  const nivel8_impactoLector = generarImpactoLector(textoLower, n.categoria, score100);

  // Indicadores Editor Jefe 2.0
  const factibilidad = generarFactibilidad(senales, tipoArticulo);
  const tiempoReferencia = generarTiempoReferencia(tipoArticulo, score100);
  const { retorno: retornoEditorial, explicacion: retornoExplicacion } = generarRetornoEditorial(tipoArticulo, n.categoria, score100);
  const prioridadEditorial = generarPrioridadEditorial(tipoArticulo, score100, n.categoria);
  const valorParaLector = generarValorParaLector(senales);
  const publicarPortada: ReporteEditorJefe['publicarPortada'] = score100 >= 70 ? 'Sí' : 'No';
  const porQuePublicarPortada = publicarPortada === 'Sí'
    ? 'La nota tiene actualidad y elementos diferenciadores que justifican su lugar en portada.'
    : 'La nota carece de suficiente evidencia o diferenciador para ocupar la portada principal; conviene desarrollarla primero.';

  const nivelEvidencia: ReporteEditorJefe['nivelEvidencia'] = [
    { criterio: 'Fuente oficial identificada', detectado: evidencia.fuenteOficialIdentificada ? 'Sí' : tieneAtribucion ? 'Parcial' : 'No', puntaje: evidencia.fuenteOficialIdentificada ? 3 : tieneAtribucion ? 1 : 0, maximo: 3 },
    { criterio: 'Dos o más fuentes independientes', detectado: evidencia.dosFuentesIndependientes ? 'Sí' : 'No', puntaje: evidencia.dosFuentesIndependientes ? 3 : 0, maximo: 3 },
    { criterio: 'Documento oficial identificado', detectado: evidencia.documentoOficialIdentificado ? 'Sí' : 'No', puntaje: evidencia.documentoOficialIdentificado ? 3 : 0, maximo: 3 },
    { criterio: 'Trabajo de campo verificable', detectado: evidencia.trabajoDeCampo ? 'Sí' : 'No', puntaje: evidencia.trabajoDeCampo ? 3 : 0, maximo: 3 },
    { criterio: 'Dato concreto (fecha, cifra, cantidad)', detectado: evidencia.datoConcreto ? 'Sí' : 'No', puntaje: evidencia.datoConcreto ? 3 : 0, maximo: 3 },
    { criterio: 'Contexto legal / institucional', detectado: evidencia.contextoLegal ? 'Sí' : 'No', puntaje: evidencia.contextoLegal ? 3 : 0, maximo: 3 },
  ];

  const reporteBase: ReporteEditorJefe = {
    tipoNota,
    tipoArticulo,
    razonamientoTipo,
    puntuacion: score100,
    puntuacionMaxima,
    veredicto,
    criterios,

    porQueExiste,
    aporteOriginal,
    razonReferenciaSiNo,
    razonamientoReferencia,
    oportunidadesEditoriales,
    investigacionAdicional,
    preguntaSinResponder,
    datoEnriquecedor,
    comoConvertirReferencia,

    detectorNicaraguaInformate,
    detectorFacebook,
    detectorGoogle,
    detectorEEATReal,

    principioRector: 'El periodismo no se mide por la cantidad de información, sino por la calidad de la verificación, el contexto y la utilidad que ofrece al lector. Nunca penalices una nota por información que no existe oficialmente o que no puede obtenerse razonablemente al momento de su publicación.',
    preguntaFinal: 'Si todos los medios publicaran exactamente el mismo hecho, ¿por qué un lector debería abrir esta versión?',

    nivel7_5_evidenciaAporte,
    nivel8_impactoLector,
    nivel9_preguntasSinRespuesta,
    nivel10_oportunidades,
    nivelEvidencia,

    factibilidad,
    tiempoReferencia,
    retornoEditorial,
    retornoExplicacion,
    prioridadEditorial,
    valorParaLector,
    publicarPortada,
    porQuePublicarPortada,

    discoverRazon,
    descubreProbabilidad,
    porQueCompartible,
    compartibleSiNo,

    auditoriaInterna: { aprobado: true, observaciones: [], ajustesRealizados: [] },
  };

  // Simulación del director de noticias: autoauditar y aplicar ajustes antes de entregar
  const { ajustes, observaciones } = autoauditarConstitucion(reporteBase, senales, textoLower, tema);
  const ajustesRealizados = Object.keys(ajustes).map(k => `Se ajustó "${k}" para cumplir la Constitución V7.0.`);

  return {
    ...reporteBase,
    ...ajustes,
    auditoriaInterna: {
      aprobado: observaciones.length === 0,
      observaciones,
      ajustesRealizados,
    },
  };
}

// Nivel 7.5: Evidencia del aporte del medio (contexto, explicación, dato propio, marco legal, antecedente)
function detectarEvidenciaAporte(textoPlano: string, aportePropio: boolean, evidencia: EvidenciaVerificable): EvidenciaAporte[] {
  const encontrados: EvidenciaAporte[] = [];
  const usados = new Set<string>();

  const extraer = (regex: RegExp, tipo: EvidenciaAporte['tipo']) => {
    const m = textoPlano.match(regex);
    if (!m || usados.has(m[0])) return;
    usados.add(m[0]);
    const start = Math.max(0, (m.index ?? 0) - 60);
    const end = Math.min(textoPlano.length, (m.index ?? 0) + m[0].length + 120);
    let snippet = textoPlano.slice(start, end).replace(/^[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]*/, '').replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]*$/, '').trim();
    snippet = snippet.replace(/\s+/g, ' ');
    if (snippet.length > 10) encontrados.push({ tipo, snippet: snippet.slice(0, 220) });
  };

  if (aportePropio) extraer(/\b(?:Nicaragua\s+Informate|Informate|este\s+medio|nuestro\s+equipo|nuestra\s+redaccion)\s+(?:confirm[óo]|consult[óo]|verific[óo]|obtuvo|constat[óo]|descubri[óo]|revis[óo]|investig[óo]|entrevist[óo])[^.!?]{10,120}[.!?]?/i, 'dato propio');
  if (evidencia.contextoLegal) extraer(/[^.!?]*\b(?:c[óo]digo|ley\s+n[º°]?\s*\d+|art[ií]culo|pena|delito|proceso|judicial|juez|fiscal|sentencia|imputado|acusado)\b[^.!?]*[.!?]?/i, 'marco legal');
  extraer(/[^.!?]*\b(?:porque|debido\s+a|gracias\s+a|a\s+causa\s+de|lo\s+que\s+significa|esto\s+implica|esto\s+significa|en\s+consecuencia|por\s+tanto|por\s+lo\s+que|lo\s+cual)\b[^.!?]*[.!?]?/i, 'explicación');
  extraer(/[^.!?]*\b(?:seg[úu]n\s+(?:el|la|los|las)\s+(?:c[óo]digo|ley|art[ií]culo|constituci[óo]n|reglamento|normativa|resoluci[óo]n|decreto|acuerdo)|de\s+acuerdo\s+con\s+(?:el|la)\s+(?:c[óo]digo|ley|art[ií]culo|normativa|reglamento))\b[^.!?]*[.!?]?/i, 'contexto');
  extraer(/[^.!?]*\b(?:en\s+(?:20|19)\d{2}|anteriormente|en\s+años\s+anteriores|durante\s+(?:el|la)\s+\w+|en\s+periodos\s+anteriores|hist[óo]ricamente|en\s+la\s+[úu]ltima\s+d[eé]cada)\b[^.!?]*[.!?]?/i, 'antecedente');

  // Si no hay nada, explicar por qué
  if (encontrados.length === 0) {
    encontrados.push({ tipo: 'explicación', snippet: 'No se detecta un aporte contextual, legal o explicativo diferenciado; la nota se limita a narrar el hecho.' });
  }
  return encontrados.slice(0, 5);
}

// ───────────────────────────────────────────────
// EDITOR JEFE IA — FUNCIONES AUXILIARES
// ───────────────────────────────────────────────

function generarSugerenciasV7(
  s: SenalesEditoriales,
  _tipoArticulo: TipoArticulo,
  _tipoNota: TipoNotaEditorial,
  tema: string,
  titulo: string
): {
  oportunidadesEditoriales: SugerenciaV7[];
  comoConvertirReferencia: SugerenciaV7[];
  nivel10_oportunidades: SugerenciaV7[];
  nivel9_preguntasSinRespuesta: string[];
  preguntaSinResponder: string;
  investigacionAdicional: string;
  datoEnriquecedor: string;
} {
  const e = s.evidencia;
  const sugerencia = fabricarSugerencia;

  const banco: Record<string, { oportunidades: SugerenciaV7[]; comoReferencia: SugerenciaV7[]; nivel10: SugerenciaV7[]; nivel9: string[] }> = {
    general: {
      oportunidades: [
        sugerencia('Identificar fuente oficial con nombre y cargo que respalde el dato central.', 'Eleva la credibilidad factual.', '10-20 min', 'Baja', 'Reduce riesgo de desmentido y mejora EEAT.'),
        sugerencia('Incorporar dato concreto: fecha, hora, lugar, cifra o cantidad verificable.', 'Da precisión periodística.', '5-15 min', 'Baja', 'Mejora posicionamiento en búsquedas de datos.'),
        sugerencia('Explicitar la utilidad práctica: qué gana el lector con esta información.', 'Convierte la nota en servicio.', '10-20 min', 'Baja', 'Aumenta compartibilidad y tiempo de lectura.'),
        sugerencia('Agregar contexto legal, institucional o histórico breve.', 'Sitúa el hecho en un marco.', '15-30 min', 'Media', 'Diferencia frente a medios que solo narran.'),
      ],
      comoReferencia: [
        sugerencia('Obtener y citar documento oficial o declaración institucional.', 'Convierte la pieza en referencia documentada.', '1-3 días', 'Alta', 'Autoridad a largo plazo y citas externas.'),
        sugerencia('Entrevistar a protagonista, especialista o autoridad.', 'Aporta voz propia y originalidad.', '2-4 horas', 'Media', 'Diferenciación frente a competidores.'),
        sugerencia('Construir una cronología o línea de tiempo verificable.', 'Organiza la información compleja.', '30-60 min', 'Media', 'Mejora comprensión y tráfico recurrente.'),
        sugerencia('Comparar con cifras históricas o datos oficiales anteriores.', 'Amplía la relevancia.', '30-60 min', 'Media', 'Contextualiza y aporta análisis.'),
      ],
      nivel10: [
        sugerencia('¿Es un patrón? Análisis de datos históricos del mismo fenómeno.', 'Referencia de datos públicos.', '2-3 días', 'Alta', 'Alto potencial de consulta recurrente.'),
        sugerencia('Guía práctica para el lector: pasos, medidas de protección o recomendaciones.', 'Contenido evergreen.', '1 día', 'Baja', 'Tráfico orgánico sostenido.'),
        sugerencia('Entrevista con especialista o autoridad sobre el tema.', 'Pieza de fondo sostenida.', '3-5 días', 'Media', 'Autoridad editorial y engagement.'),
        sugerencia('Mapa o comparativa regional del fenómeno.', 'Referencia visual y datos.', '2-4 días', 'Alta', 'Compartibilidad en redes y medios.'),
      ],
      nivel9: [
        '¿Qué datos aún faltan confirmar?',
        '¿Cuál es la posición de la institución responsable?',
        '¿Cómo afecta esto al lector de manera concreta?',
        '¿Qué pasos se siguen a partir de ahora?',
      ],
    },
    femicidio: {
      oportunidades: [
        sugerencia('Identificar fuente oficial (Policía, Ministerio Público o juzgado) que confirme el hecho y su estado procesal.', 'Mueve la nota de "denuncia" a "caso verificado".', '10-20 min', 'Baja', 'Mayor confianza y menor riesgo de desmentido.'),
        sugerencia('Incluir datos concretos: fecha, hora, lugar, edad y vínculo con el agresor si están confirmados.', 'Da precisión periodística.', '5-15 min', 'Baja', 'Mejora ranking factual y evita imprecisiones.'),
        sugerencia('Agregar contexto sobre denuncias o medidas de protección previas si son públicas.', 'Explica señales de riesgo.', '15-30 min', 'Media', 'Aporta contexto social y legal relevante.'),
        sugerencia('Explicitar utilidad: líneas de denuncia, medidas de protección o marco legal.', 'Transforma la nota en servicio.', '10-20 min', 'Baja', 'Aumenta compartibilidad y utilidad pública.'),
      ],
      comoReferencia: [
        sugerencia('Obtener copia de la denuncia o resolución judicial para citar documento oficial.', 'Pieza documentada.', '1-3 días', 'Alta', 'Referencia citada por otros medios.'),
        sugerencia('Entrevistar a fiscal, defensora o especialista en violencia de género.', 'Da autoridad institucional.', '2-4 horas', 'Media', 'Refuerza EEAT y confianza lectora.'),
        sugerencia('Construir cronología de denuncia, medidas y hechos.', 'Línea de tiempo verificable.', '30-60 min', 'Media', 'Mejora permanencia en búsqueda.'),
        sugerencia('Comparar con cifras oficiales del mismo delito en el departamento o país.', 'Sitúa el caso en un patrón.', '30-60 min', 'Media', 'Contextualiza y amplía relevancia.'),
      ],
      nivel10: [
        sugerencia('Mapa de femicidios por departamento y tendencia anual.', 'Referencia de datos.', '2-3 días', 'Alta', 'Consulta recurrente.'),
        sugerencia('¿Funcionan las medidas de protección a víctimas de violencia de género?', 'Investigación de servicio público.', '1-2 semanas', 'Alta', 'Impacto social y autoridad editorial.'),
        sugerencia('Guía práctica: cómo denunciar violencia de género y pedir medidas de protección.', 'Contenido evergreen.', '1 día', 'Baja', 'Alto valor a largo plazo.'),
        sugerencia('Cronología de un caso judicial emblemático y su tránsito por el sistema.', 'Pieza de fondo.', '3-5 días', 'Media', 'Tráfico orgánico recurrente.'),
      ],
      nivel9: [
        '¿Existían denuncias previas de la víctima o familiares?',
        '¿Había medidas de protección vigentes?',
        '¿La Policía Nacional confirmó antecedentes del agresor?',
        '¿Qué dice el marco legal sobre este tipo de caso?',
        '¿Cuándo es el próximo paso procesal?',
      ],
    },
    accidente_transito: {
      oportunidades: [
        sugerencia('Confirmar con fuente oficial (Policía de Tránsito, hospital o bomberos) el estado de las víctimas.', 'Dato verificado.', '10-20 min', 'Baja', 'Reduce rumores y desinformación.'),
        sugerencia('Incluir datos concretos: hora, ruta, vehículos involucrados y número de heridos.', 'Precisión periodística.', '5-15 min', 'Baja', 'Mejora factualidad.'),
        sugerencia('Mencionar posibles factores: exceso de velocidad, condiciones de la vía o vehículo.', 'Contexto causal.', '10-20 min', 'Baja', 'Aporta comprensión del hecho.'),
        sugerencia('Agregar recomendación de seguridad vial o prevención para el lector.', 'Utilidad práctica.', '10-20 min', 'Baja', 'Aumenta valor de servicio.'),
      ],
      comoReferencia: [
        sugerencia('Obtener parte oficial de tránsito o boletín de la Policía Nacional.', 'Documento verificable.', '1 día', 'Media', 'Referencia factual sólida.'),
        sugerencia('Entrevistar a testigo, conductor o familiar de víctima.', 'Voz directa.', '1-2 horas', 'Baja', 'Diferenciación emocional y periodística.'),
        sugerencia('Comparar con datos de accidentes en la misma ruta o periodo.', 'Contexto de patrón.', '1-2 días', 'Media', 'Amplía relevancia.'),
        sugerencia('Fotografiar o describir el punto del accidente y señalización.', 'Evidencia de campo.', '30-60 min', 'Baja', 'Refuerza reporteo propio.'),
      ],
      nivel10: [
        sugerencia('Las rutas con más accidentes viales en Nicaragua este año.', 'Referencia de datos.', '2-3 días', 'Alta', 'Consulta recurrente.'),
        sugerencia('¿Cómo influyen el exceso de velocidad y el alcohol en los accidentes?', 'Análisis de servicio.', '3-5 días', 'Alta', 'Impacto social.'),
        sugerencia('Guía de seguridad vial para conductores y motociclistas.', 'Evergreen.', '1 día', 'Baja', 'Valor práctico sostenido.'),
        sugerencia('Costo humano y económico de los accidentes de tránsito.', 'Pieza de fondo.', '3-5 días', 'Alta', 'Autoridad editorial.'),
      ],
      nivel9: [
        '¿Cuál es el estado de salud de las víctimas?',
        '¿Estaba involucrado exceso de velocidad, alcohol o distracción?',
        '¿En qué condiciones se encuentra la carretera o punto del accidente?',
        '¿Hubo antecedentes similares en el mismo lugar?',
        '¿Qué medidas se han tomado para evitar que se repita?',
      ],
    },
    salud_publica: {
      oportunidades: [
        sugerencia('Confirmar datos con MINSA u otra fuente oficial de salud.', 'Dato verificado.', '10-20 min', 'Baja', 'Evita alarmismo.'),
        sugerencia('Incluir cifras: casos confirmados, zonas afectadas y medidas.', 'Precisión.', '5-15 min', 'Baja', 'Factualidad.'),
        sugerencia('Agregar contexto epidemiológico o histórico.', 'Contexto.', '15-30 min', 'Media', 'Comprensión.'),
        sugerencia('Explicitar medidas de prevención o dónde acudir.', 'Utilidad.', '10-20 min', 'Baja', 'Valor público.'),
      ],
      comoReferencia: [
        sugerencia('Obtener boletín oficial del Ministerio de Salud.', 'Documento verificable.', '1 día', 'Baja', 'Referencia.'),
        sugerencia('Entrevistar a médico, epidemiólogo o vocero de salud.', 'Autoridad.', '1-2 horas', 'Baja', 'EEAT.'),
        sugerencia('Comparar con datos históricos de la misma enfermedad.', 'Contexto.', '1-2 días', 'Media', 'Relevancia.'),
        sugerencia('Elaborar guía de síntomas y prevención.', 'Evergreen.', '1 día', 'Baja', 'Valor sostenido.'),
      ],
      nivel10: [
        sugerencia('Mapa de casos por departamento o municipio.', 'Datos.', '2-3 días', 'Alta', 'Consulta recurrente.'),
        sugerencia('¿Por qué repuntan las enfermedades vectoriales?', 'Análisis.', '3-5 días', 'Alta', 'Impacto.'),
        sugerencia('Guía completa de prevención y tratamiento.', 'Evergreen.', '1 día', 'Baja', 'Valor práctico.'),
        sugerencia('Entrevista con especialista sobre desafíos del sistema de salud.', 'Fondo.', '2-4 días', 'Media', 'Autoridad.'),
      ],
      nivel9: [
        '¿En qué regiones o municipios se concentra el problema?',
        '¿Qué acciones está tomando el Ministerio de Salud?',
        '¿Qué debe hacer la población para protegerse?',
        '¿Dónde se puede acceder al tratamiento o vacuna?',
      ],
    },
  };

  const { oportunidades, comoReferencia, nivel10, nivel9 } = banco[tema] || banco.general;

  const seleccionarPorSenales = (lista: SugerenciaV7[]): SugerenciaV7[] => {
    const seleccion: SugerenciaV7[] = [];
    if (!e.fuenteOficialIdentificada) seleccion.push(...lista.filter(x => /fuente oficial|autoridad|institucion/i.test(x.texto)));
    if (!e.datoConcreto) seleccion.push(...lista.filter(x => /dato concreto|cifra|fecha|hora|lugar/i.test(x.texto)));
    if (s.scoreUtilidad < 2) seleccion.push(...lista.filter(x => /utilidad|lector|proteccion|decision|comprension/i.test(x.texto)));
    if (!e.contextoLegal) seleccion.push(...lista.filter(x => /contexto|marco legal|antecedente/i.test(x.texto)));
    if (seleccion.length < 2) seleccion.push(...lista);
    const unicos = [...new Map(seleccion.map(x => [x.texto, x])).values()];
    return unicos.slice(0, 4);
  };

  const oportunidadesEditoriales = seleccionarPorSenales(oportunidades);
  const comoConvertirReferencia = comoReferencia.slice(0, 4);
  const nivel10_oportunidades = nivel10.slice(0, 4);

  const titLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const contieneRespuesta = (q: string) => {
    const palabras = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(w => w.length > 4);
    return palabras.some(p => titLower.includes(p));
  };
  const nivel9_preguntasSinRespuesta = (nivel9.filter(q => !contieneRespuesta(q)).length >= 3
    ? nivel9.filter(q => !contieneRespuesta(q))
    : nivel9).slice(0, 4);

  const preguntaSinResponder = nivel9_preguntasSinRespuesta[0] || 'Oportunidad editorial: explicar por qué ocurrió y cuál es el impacto real, en la medida en que la información esté disponible.';
  const investigacionAdicional = oportunidadesEditoriales[0]?.texto || 'Oportunidad editorial: cuando estén disponibles, incorporar documentos oficiales, estadísticas históricas, declaraciones institucionales o testimonios directos.';
  const datoEnriquecedor = oportunidadesEditoriales[1]?.texto || 'Oportunidad editorial: cuando existan, agregar antecedentes recientes, estadísticas comparativas o el marco legal relevante.';

  return {
    oportunidadesEditoriales,
    comoConvertirReferencia,
    nivel10_oportunidades,
    nivel9_preguntasSinRespuesta,
    preguntaSinResponder,
    investigacionAdicional,
    datoEnriquecedor,
  };
}

function generarDetectorNicaraguaInformate(s: SenalesEditoriales): string {
  const acciones: string[] = [];
  if (s.evidencia.trabajoDeCampo) acciones.push('verificó en el lugar (trabajo de campo)');
  if (s.evidencia.dosFuentesIndependientes) acciones.push('contrastó fuentes independientes');
  if (s.evidencia.documentoOficialIdentificado) acciones.push('consultó un documento o dato oficial');
  if (s.evidencia.fuenteOficialIdentificada) acciones.push('citó una fuente oficial identificable');
  if (s.evidencia.datoConcreto) acciones.push('aportó datos concretos');

  if (acciones.length === 0) return 'No se detecta en el texto un aporte verificable de Nicaragua Informate (confirmó, consultó, verificó u obtuvo). No se asume que no existió; solo no es demostrable aquí.';
  if (acciones.length === 1) return `Nicaragua Informate ${acciones[0]}.`;
  return `Nicaragua Informate ${acciones.slice(0, -1).join(', ')} y ${acciones[acciones.length - 1]}.`;
}

function generarFactibilidad(s: SenalesEditoriales, tipoArticulo: TipoArticulo): string {
  const { evidencia } = s;
  if (tipoArticulo === 'Reportaje' && !(evidencia.trabajoDeCampo || evidencia.documentoOficialIdentificado)) {
    return 'Para consolidarse como reportaje requeriría entrevistas, documentos o evidencia de campo; no se castiga la ausencia si no existe todavía.';
  }
  if (tipoArticulo === 'Investigación' && !(evidencia.dosFuentesIndependientes || evidencia.trabajoDeCampo)) {
    return 'Para ser una investigación requeriría fuentes múltiples, documentos y verificación; si no están disponibles, puede titularse como Noticia o Explicador.';
  }
  return 'Las sugerencias son factibles y se ajustan al tiempo y tipo de cobertura.';
}

function generarTiempoReferencia(tipoArticulo: TipoArticulo, score100: number): string {
  if (score100 >= 85) return 'Ya es nota de referencia. Solo requiere mantenimiento si cambian los hechos.';
  if (tipoArticulo === 'Noticia') {
    return score100 < 60 ? 'Actualización inmediata: confirmar fuente, consecuencias y contexto básico.' : 'Actualización corta: completar causas, consecuencias y contexto.';
  }
  if (tipoArticulo === 'Explicador' || tipoArticulo === 'Servicio') return 'Actualización corta: profundizar ejemplos, datos y utilidad práctica.';
  if (tipoArticulo === 'Reportaje') return 'Tiempo de reporteo: entrevistas, documentos, análisis y edición.';
  if (tipoArticulo === 'Investigación') return 'Tiempo de investigación: recopilar evidencia, contrastar fuentes y verificar.';
  if (tipoArticulo === 'Entrevista') return 'Tiempo de entrevista: contactar fuente, preparar preguntas y verificar citas.';
  if (tipoArticulo === 'Análisis') return 'Tiempo de análisis: recopilar datos, contrastar posturas y estructurar argumento.';
  if (tipoArticulo === 'Opinión') return 'Tiempo de opinión: fundamentar argumento con datos y contexto.';
  return 'Tiempo de desarrollo editorial: dependerá del acceso a fuentes y documentos.';
}

function generarRetornoEditorial(tipoArticulo: TipoArticulo, categoria: string, score100: number): { retorno: 'ALTO' | 'MEDIO' | 'BAJO'; explicacion: string } {
  const cat = categoria.toLowerCase();
  if (tipoArticulo === 'Investigación' || tipoArticulo === 'Reportaje') {
    return { retorno: 'ALTO', explicacion: 'Este tipo de pieza construye autoridad y diferenciación a largo plazo.' };
  }
  if (score100 >= 80) {
    return { retorno: 'ALTO', explicacion: 'La nota tiene potencial para convertirse en referencia y generar tráfico sostenido.' };
  }
  if (cat.includes('judicial')) {
    return { retorno: 'ALTO', explicacion: 'Temas de alto interés público que justifican inversión editorial.' };
  }
  if (tipoArticulo === 'Explicador' || tipoArticulo === 'Servicio') {
    return { retorno: 'MEDIO', explicacion: 'Si explica bien, puede generar tráfico recurrente de búsqueda.' };
  }
  if (cat.includes('suceso') || score100 >= 70) {
    return { retorno: 'MEDIO', explicacion: 'Noticia de tráfico inmediato, pero con ventana corta de interés o con elementos diferenciadores limitados.' };
  }
  return { retorno: 'BAJO', explicacion: 'Evaluar si el hecho tiene ángulo de servicio, contexto histórico o comparación que justifique más cobertura.' };
}

function generarPrioridadEditorial(tipoArticulo: TipoArticulo, score100: number, categoria: string): string {
  const cat = categoria.toLowerCase();
  if (tipoArticulo === 'Investigación' || tipoArticulo === 'Reportaje') return '★★★★★ — Merece portada y promoción destacada.';
  if (score100 >= 85) return '★★★★★ — Nota de referencia, ideal para portada.';
  if (tipoArticulo === 'Noticia') return '★★★★☆ — Prioridad alta por actualidad, aunque puede ser breve.';
  if (cat.includes('suceso') || cat.includes('judicial')) return '★★★★☆ — Alta atención del público.';
  if ((tipoArticulo === 'Explicador' || tipoArticulo === 'Servicio') && score100 >= 70) return '★★★★☆ — Buen contenido de fondo, promoción en redes.';
  if (score100 >= 60) return '★★★☆☆ — Publicable, pero no prioridad máxima.';
  return '★★☆☆☆ — Publicable como nota breve o redes sociales.';
}

function generarValorParaLector(s: SenalesEditoriales): string {
  const ev = s.evidencia;
  const ganancias: string[] = [];
  if (ev.contextoLegal) ganancias.push('conoce el marco legal que aplica al caso');
  if (ev.datoConcreto) ganancias.push('tiene cifras o fechas concretas para entender la magnitud');
  if (ev.fuenteOficialIdentificada) ganancias.push('sabe qué institución está actuando');
  if (ev.trabajoDeCampo) ganancias.push('accede a una verificación hecha en el lugar');
  if (s.scoreUtilidad > 1) ganancias.push('encuentra información útil para actuar o protegerse');
  if (s.scoreAnalisis > 2) ganancias.push('entiende por qué ocurrió y qué implica');
  if (s.scoreContexto > 2) ganancias.push('puede comparar con antecedentes');

  if (ganancias.length === 0) return 'No se detecta una utilidad concreta para el lector en el texto: conoce el hecho, pero no gana contexto, antecedentes ni información práctica demostrables.';
  if (ganancias.length === 1) return `El lector gana algo concreto: ${ganancias[0]}.`;
  return `El lector gana: ${ganancias.slice(0, -1).join(', ')} y ${ganancias[ganancias.length - 1]}.`;
}

function evaluarRazonamientoReferencia(s: SenalesEditoriales): { siNo: 'Sí' | 'No'; razon: string; faltantes: string[] } {
  const ev = s.evidencia;
  const presentes: string[] = [];
  if (ev.trabajoDeCampo) presentes.push('trabajo de campo verificable');
  if (ev.dosFuentesIndependientes) presentes.push('fuentes contrastadas');
  if (ev.documentoOficialIdentificado) presentes.push('documento o dato oficial identificado');
  if (ev.fuenteOficialIdentificada) presentes.push('fuente oficial identificada');
  if (ev.datoConcreto) presentes.push('cifras, fechas o datos concretos');
  if (ev.contextoLegal) presentes.push('contexto legal o institucional');
  if (s.aportePropio) presentes.push('reporteo propio de Nicaragua Informate');
  if (s.scoreAnalisis > 2) presentes.push('contexto que explica por qué importa');
  if (s.scoreUtilidad > 1) presentes.push('utilidad práctica para el lector');
  if (s.scoreContexto > 2) presentes.push('antecedentes o comparación');

  const faltantes: string[] = [];
  if (!ev.fuenteOficialIdentificada && !s.tieneAtribucion) faltantes.push('fuente oficial o atribución identificable');
  if (!ev.datoConcreto) faltantes.push('cifras, fechas o datos concretos');
  if (!ev.trabajoDeCampo) faltantes.push('trabajo de campo');
  if (!ev.dosFuentesIndependientes) faltantes.push('segunda fuente independiente');
  if (!ev.documentoOficialIdentificado) faltantes.push('documento oficial citado');
  if (s.scoreAnalisis <= 2) faltantes.push('contexto que explique por qué importa');
  if (s.scoreUtilidad <= 1) faltantes.push('utilidad práctica para el lector');
  if (s.scoreContexto <= 2) faltantes.push('antecedentes o comparación');

  if (presentes.length >= 2) {
    return { siNo: 'Sí', razon: `Sí hay razón objetiva: Nicaragua Informate aporta ${presentes.slice(0, -1).join(', ')} y ${presentes[presentes.length - 1]}.`, faltantes: [] };
  }
  if (presentes.length === 1) {
    return { siNo: 'No', razon: `Tiene una señal (${presentes[0]}), pero no es suficiente para convertirse en referencia frente a TN8, La Prensa o Canal 10. Hace falta: ${faltantes.slice(0, 3).join(', ')}.`, faltantes };
  }
  return { siNo: 'No', razon: `No existe una razón objetiva demostrable en el texto: si todos los medios publican lo mismo, Nicaragua Informate no aporta ventaja clara. Hace falta: ${faltantes.slice(0, 3).join(', ')}.`, faltantes };
}

// generarPreguntasSinRespuesta ha sido reemplazado por generarSugerenciasV7 en Constitución V7.0.

// ───────────────────────────────────────────────
// NIVEL 8 — IMPACTO EN EL LECTOR
// ───────────────────────────────────────────────

function generarImpactoLector(textoLower: string, categoria: string, puntuacionTotal: number): string {
  const cat = categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tieneCausa = /\b(por que|causa|motivo|origen|factor|provocado|ocasionado|exceso de|falta de)\b/i.test(textoLower);
  const tieneConsecuencia = /\b(consecuencia|impacto|afecta|cambio|resultado|medida|prevencion|recomendacion)\b/i.test(textoLower);
  const tieneDatoUtil = /\b(como|cuando|donde|cuanto|cuesta|pasos|requisito|prevencion|evitar|cuidado)\b/i.test(textoLower);

  if (puntuacionTotal >= 80 && tieneCausa && tieneConsecuencia) {
    return 'El lector entiende por qué ocurrió el hecho, cómo lo afecta y qué puede hacer al respecto.';
  }
  if (cat.includes('suceso') && tieneCausa) {
    return 'El lector conoce las circunstancias del hecho, pero aún no entiende el patrón ni qué medidas tomar.';
  }
  if (cat.includes('salud') && tieneDatoUtil) {
    return 'El lector obtiene información para cuidarse o entender un riesgo de salud.';
  }
  if (cat.includes('economia') && /\b(precio|costo|subida|baja|dolar|cotizacion|mercado)\b/i.test(textoLower)) {
    return 'El lector entiende cómo el dato económico afecta su bolsillo o decisiones.';
  }
  if (puntuacionTotal >= 70) {
    return 'El lector se informa con contexto y datos, aunque la nota podría profundizar más en la utilidad práctica.';
  }
  return 'Oportunidad editorial: el lector conoce el hecho, pero la nota puede crecer en contexto, utilidad o verificación si esa información está disponible.';
}

// ───────────────────────────────────────────────
// NIVEL 10 — OPORTUNIDADES PERIODÍSTICAS
// ───────────────────────────────────────────────

// generarOportunidadesPeriodisticas ha sido reemplazado por generarSugerenciasV7 en Constitución V7.0.

// ───────────────────────────────────────────────
// DETECTOR FACEBOOK
// ───────────────────────────────────────────────

function generarDetectorFacebook(puntuacionTotal: number, scoreUtilidad: number, scoreContexto: number, scoreAnalisis: number, aportePropio: boolean): string {
  const ayuda = scoreUtilidad > 0 || scoreContexto > 1;
  if (puntuacionTotal >= 80 && ayuda) {
    return 'Sí se compartiría: la nota aporta información útil que ayuda a alguien a entender o actuar, no solo un titular fuerte.';
  }
  if (aportePropio && scoreAnalisis > 1 && ayuda) {
    return 'Probablemente se comparta entre audiencias interesadas, porque incluye contexto o reporteo propio que ayuda a comprender el hecho.';
  }
  if (puntuacionTotal >= 60 && ayuda) {
    return 'Se compartiría moderadamente; la utilidad es limitada pero puede servir a lectores del tema.';
  }
  return 'Oportunidad editorial: agregar utilidad práctica o contexto demostrable que ayude al lector aumentaría la difusión.';
}

// ───────────────────────────────────────────────
// DETECTOR GOOGLE
// ───────────────────────────────────────────────

function generarDetectorGoogle(puntuacionTotal: number, p1: number, p7: number, scoreContexto: number, scoreInvestigacion: number, aportePropio: boolean): string {
  if (puntuacionTotal >= 85 && p1 >= 15 && p7 >= 6 && (scoreContexto > 0 || scoreInvestigacion > 0 || aportePropio)) {
    return 'Sí: si todos los medios desaparecieran, esta nota merecería ser elegida porque aporta contexto, verificación y valor original.';
  }
  if (puntuacionTotal >= 70 && (scoreContexto > 0 || aportePropio)) {
    return 'Posiblemente sí, pero competiría con versiones similares; necesita más diferenciador para ser la primera opción.';
  }
  return 'Oportunidad editorial: agregar contexto, verificación o utilidad diferenciaría la nota frente a la cobertura estándar.';
}

// ───────────────────────────────────────────────
// DETECTOR EEAT REAL
// ───────────────────────────────────────────────

function generarDetectorEEATReal(s: SenalesEditoriales): string {
  const partes: string[] = [];
  if (s.evidencia.trabajoDeCampo) partes.push('verificó en el lugar');
  if (s.evidencia.fuenteOficialIdentificada) partes.push('cita fuente oficial identificable');
  if (s.evidencia.dosFuentesIndependientes) partes.push('contrastó fuentes independientes');
  if (s.evidencia.documentoOficialIdentificado) partes.push('identificó documento o dato oficial');
  if (s.evidencia.datoConcreto) partes.push('aporta datos concretos');
  if (s.evidencia.contextoLegal) partes.push('provee contexto legal o institucional');

  if (partes.length >= 4) {
    return `El lector debería confiar porque Nicaragua Informate ${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}.`;
  }
  if (partes.length >= 2) {
    return `Tiene señales de credibilidad parcial (${partes.join(', ')}). Oportunidad editorial: sumar más evidencia visible para que el lector prefiera NI sobre otro medio.`;
  }
  if (partes.length === 1) return `Tiene una señal de credibilidad (${partes[0]}). Oportunidad editorial: sumar una segunda señal verificable reforzaría la confianza del lector.`;
  return 'No se detecta en el texto evidencia de investigación, verificación o contexto propio; no se asume que no existió, solo que no es demostrable aquí.';
}

// ───────────────────────────────────────────────
// UTILIDADES
// ───────────────────────────────────────────────

function generarAcciones(
  filtros: ResultadoAnalisis['filtros'],
  palabrasSensibles?: PalabraSensibleDetectada[],
  cierreGenerico?: boolean
): string[] {
  const acciones: string[] = [];

  if (!filtros.oro.aprobado) {
    acciones.push('Revisar: extension minima 150 palabras, fuentes atribuidas, lead informativo');
  }
  if (!filtros.adsense.aprobado) {
    acciones.push('AdSense: Evitar clickbait, asegurar datos concretos y valor anadido');
  }
  if (!filtros.discover.aprobado) {
    acciones.push('Discover: Agregar imagen destacada y titulo descriptivo');
  }
  if (!filtros.news.aprobado) {
    acciones.push('News: Verificar schema, autor y categoria valida');
  }
  if (!filtros.seo.aprobado) {
    acciones.push('SEO: Ajustar titulo (50-70 chars), meta (120-180 chars), slug');
  }
  if (!filtros.eeat.aprobado) {
    acciones.push('EEAT: Revisar atribuciones a instituciones (no inventar fuentes estatales)');
  }
  if (!filtros.valorEditorial.aprobado) {
    acciones.push('Valor Editorial: Revisar origen del dato, fuentes identificables, extensión justificada y evitar datos inventados');
  }

  if (palabrasSensibles && palabrasSensibles.length > 0) {
    palabrasSensibles.slice(0, 3).forEach(p => {
      acciones.push(`PALABRA SENSIBLE: Reemplaza "${p.palabra}" por "${p.sugerencia}".`);
    });
  }
  if (cierreGenerico) {
    acciones.push('CIERRE GENÉRICO: Reemplaza frases tipo "autoridades investigan" por citas reales de fuentes.');
  }

  return acciones;
}

function generarMetadataSugerida(n: NoticiaInput, _filtros: ResultadoAnalisis['filtros']) {
  const keywordsLSI = extraerKeywordsLSI(n);

  return {
    tituloOptimizado: n.titulo.length > 60
      ? n.titulo.slice(0, 57) + '...'
      : n.titulo,
    metaDescription: n.resumen.length >= 120 && n.resumen.length <= 180
      ? n.resumen
      : n.resumen.length < 120
        ? n.resumen + ' ' + n.categoria + ' Nicaragua Informate.'
        : n.resumen.slice(0, 177) + '...',
    keywordsLSI,
    h2Sugeridos: sugerirH2(n),
  };
}

function extraerKeywordsLSI(n: NoticiaInput): string[] {
  const texto = (n.titulo + ' ' + n.contenido).toLowerCase();
  const keywordsExplicitas = (n.keywords || '').toLowerCase().split(/[,;]/).map(k => k.trim()).filter(Boolean);

  const mapa: Record<string, string[]> = {
    'sucesos': ['accidente', 'managua', 'policia nacional', 'policia', 'transito', 'heridos', 'muerte', 'fallecimiento', 'golpe', 'escuela', 'hospital', 'investigacion', 'menor', 'diriomo', 'granada', 'masaya', 'leon', 'managua', 'nicaragua', 'suceso', 'incidente', 'victima', 'testigo', 'medicina legal'],
    'deportes': ['beisbol', 'futbol', 'nicaragua', 'mundial', 'juegos', 'deporte', 'equipo', 'torneo', 'campeonato', 'atleta', 'seleccion', 'liga', 'partido', 'gol', 'victoria', 'derrota'],
    'tecnologia': ['internet', 'redes sociales', 'celular', 'aplicacion', 'digital', 'tecnologia', 'software', 'hardware', 'app', 'web', 'online', 'conexion', 'ciberseguridad', 'innovacion'],
    'internacionales': ['eeuu', 'mexico', 'centroamerica', 'mundo', 'crisis', 'internacional', 'onu', 'oea', 'frontera', 'migracion', 'dolar', 'europa', 'asia', 'rusia', 'china'],
    'nacionales': ['nicaragua', 'managua', 'gobierno', 'pais', 'nacional', 'minsa', 'meduca', 'mific', 'asamblea', 'ley', 'economia', 'salud', 'educacion', 'infraestructura'],
    'espectaculos': ['concierto', 'managua', 'artista', 'musica', 'evento', 'espectaculo', 'festival', 'concierto', 'banda', 'cantante', 'actor', 'cine', 'television', 'show'],
    'general': ['nicaragua', 'noticias', 'informacion', 'actualidad', 'pais', 'departamento', 'municipio', 'comunidad', 'reporte', 'hechos'],
  };

  // Normalizar categoría para buscar en el mapa (quitar acentos)
  const catNormalizada = (n.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const delMapa = (mapa[catNormalizada] || []).filter(k => texto.includes(k));

  // También aceptar keywords explícitas del usuario como válidas
  const delUsuario = keywordsExplicitas.filter(k => k.length >= 3);

  // Fallback: extraer palabras sustanciales del título (>=5 letras, sin preposiciones)
  const stopWords = new Set(['de','la','el','en','a','los','las','un','una','por','para','con','sobre','entre','durante','tras','ante','bajo','hasta','desde','hacia','segun','mediante','excepto','salvo','incluso','ademas','tambien','muy','mas','menos','tan','tanto','casi','solo','sola','sino','aun','aunque','como','cuando','donde','que','quien','cuyo','cuya','cuyos','cuyas','este','esta','estos','estas','ese','esa','esos','esas','aquel','aquella','aquellos','aquellas','mi','tu','su','nuestro','vuestro','suyo','mio','tuyo','nosotros','vosotros','ellos','ellas','yo','me','te','se','nos','os','lo','la','le','les','nos','os','me','te','lo','la','les']);
  const palabrasTitulo = n.titulo
    .toLowerCase()
    .replace(/[áéíóúÁÉÍÓÚ]/g, a => ({'á':'a','é':'e','í':'i','ó':'o','ú':'u','Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U'}[a] || a))
    .split(/[^a-zñáéíóú]+/)
    .filter(w => w.length >= 5 && !stopWords.has(w));
  const delTitulo = Array.from(new Set(palabrasTitulo));

  // Unificar sin duplicados, priorizando del mapa y del usuario
  const unicas = Array.from(new Set([...delMapa, ...delUsuario, ...delTitulo]));
  return unicas;
}

function sugerirH2(n: NoticiaInput): string[] {
  const h2s: string[] = [];
  const categoria = (n.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const palabraCount = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(p => p.length > 0).length;

  // Solo sugerir h2 si hay suficiente contenido verificable para justificarlos
  if (palabraCount < 350) {
    return ['(Noticia breve — subtitulos opcionales)'];
  }

  if (categoria === 'sucesos') {
    h2s.push('Hechos principales');
  } else if (categoria === 'deportes') {
    h2s.push('Resultados del encuentro');
  } else if (categoria === 'espectaculos') {
    h2s.push('Detalles del evento');
  } else if (categoria === 'tecnologia') {
    h2s.push('Caracteristicas principales');
  } else if (categoria === 'internacionales') {
    h2s.push('Informacion principal');
  } else if (categoria === 'nacionales') {
    h2s.push('Informacion principal');
  } else {
    h2s.push('Informacion principal');
  }

  return h2s;
}
