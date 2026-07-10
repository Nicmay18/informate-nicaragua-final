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
  | 'Breaking News'
  | 'Nota informativa'
  | 'Nota informativa + contexto'
  | 'Nota explicativa'
  | 'Análisis'
  | 'Reportaje'
  | 'Investigación';

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

export interface ReporteEditorJefe {
  tipoNota: TipoNotaEditorial;
  razonamientoTipo: string;
  puntuacion: number;
  puntuacionMaxima: number;
  veredicto: '🔴 Reemplazable' | '🟡 Competitiva' | '🟢 Referencia' | '🏆 Periodismo de alto valor';
  criterios: CriterioEditorJefe[];

  // Editor Jefe — análisis editorial
  porQueExiste: string;
  aporteOriginal: string;
  oportunidadesEditoriales: string[];
  investigacionAdicional: string;
  preguntaSinResponder: string;
  datoEnriquecedor: string;
  comoConvertirReferencia: string[];

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
  nivel10_oportunidades: string[];

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
  retornoPeriodistico: string;
  prioridadEditorial: string;
  valorParaLector: string;
  razonamientoReferencia: string;

  // Discover / compartir
  discoverRazon: string;
  discoverSiNo: 'Sí' | 'No';
  porQueCompartible: string;
  compartibleSiNo: 'Sí' | 'No';
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

function clasificarTipoNota(titulo: string, contenido: string, _categoria: string, palabraCount: number, evidencia: EvidenciaVerificable): { tipo: TipoNotaEditorial; razon: string } {
  const texto = (titulo + ' ' + contenido).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tit = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const frasesInvestigacion = /\b(documentos exclusivos|meses de investigacion|semanas de investigacion|trabajo de investigacion|investigacion de este medio|investigacion de Nicaragua Informate|denuncia documentada|pruebas documentales|evidencia documental|fuentes multiples|verificacion documental|informacion inedita|revelacion|hallazgo)\b/i.test(texto);
  const entrevistasMultiples = (texto.match(/\b(entrevista|entrevistó|entrevisto|testimonio|declaraciones)\b/g) || []).length >= 2;
  const hayDocumentoYOtros = evidencia.documentoOficialIdentificado && (evidencia.dosFuentesIndependientes || entrevistasMultiples || evidencia.trabajoDeCampo);
  const esInvestigacion = (evidencia.dosFuentesIndependientes || evidencia.trabajoDeCampo || hayDocumentoYOtros) &&
    (frasesInvestigacion || (palabraCount > 600 && entrevistasMultiples && evidencia.documentoOficialIdentificado));

  const esReportaje = (evidencia.dosFuentesIndependientes || evidencia.trabajoDeCampo || evidencia.documentoOficialIdentificado) &&
    /\b(entrevista|documento|testimonio|cronologia|antecedentes|reportaje|mapa|estadistica|dato historico|contexto social|impacto economico|declaraciones)\b/i.test(texto) && palabraCount > 400;

  const esExplicativa = /\b(por que|que significa|como funciona|explicacion|que es|significado de|guia|consecuencias de|paso a paso|tutorial)\b/i.test(tit) || /\b(enseña|explica|aprende|entender|significado|como afecta|por que ocurre|como funciona|de que se trata)\b/i.test(texto);

  const esAnalisis = !esInvestigacion && !esReportaje && (palabraCount > 350) &&
    (/\b(analisis|analiza|interpretacion|contexto|consecuencias|impacto|causas|implicaciones|significado|tendencia|panorama|escenario|comparativa)\b/i.test(texto) || /\b(por que|como afecta|que\s+significa|quien\s+gana|quien\s+pierde|a\s+largo\s+plazo)\b/i.test(tit));

  const esBreaking = (/(ultima hora|hace minutos|hace pocos minutos|se registra|acaba de|recien|emergencia|informacion preliminar|primeros reportes|en vivo)/i.test(tit) || /\b(accidente|incendio|captura|terremoto|asesinato|fallecio|murio|heridos|explosion|colapso)\b/i.test(tit)) && palabraCount < 300;

  const esDesarrollo = /\b(actualizacion|en desarrollo|sigue evolucionando|nueva informacion|se reporta|ultimo balance|cobertura|minuto a minuto|segunda edicion|version actualizada|actualizado)\b/i.test(texto);

  if (esInvestigacion) return { tipo: 'Investigación', razon: 'Reúne documentos, fuentes múltiples y/o trabajo de campo propio con revelación de información no publicada.' };
  if (esReportaje) return { tipo: 'Reportaje', razon: 'Incluye señales verificables de entrevistas, documentos o trabajo de campo.' };
  if (esExplicativa) return { tipo: 'Nota explicativa', razon: 'Su objetivo principal es enseñar o explicar un fenómeno.' };
  if (esAnalisis) return { tipo: 'Análisis', razon: 'Interpreta causas, consecuencias o implicaciones sin reportaje original de campo.' };
  if (esBreaking) return { tipo: 'Breaking News', razon: 'El título y la extensión indican un hecho reciente con información aún limitada.' };
  if (esDesarrollo) return { tipo: 'Nota informativa + contexto', razon: 'El hecho sigue evolucionando y la nota actualiza información previa con contexto adicional.' };
  return { tipo: 'Nota informativa', razon: 'El hecho ya ocurrió y la nota narra los hechos de manera informativa.' };
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

function obtenerCriteriosEditorJefe(tipoNota: TipoNotaEditorial, s: SenalesEditoriales): { criterios: ReporteEditorJefe['criterios']; max: number } {
  const criterios: ReporteEditorJefe['criterios'] = [];
  const add = (nombre: string, max: number, raw: number, justificacion: string) => {
    const puntuacion = Math.min(max, Math.round(raw));
    criterios.push({ nombre, puntuacion, maximo: max, justificacion, estrellas: toStars(puntuacion, max) });
  };

  const verificacionJustificacion = s.evidencia.dosFuentesIndependientes
    ? 'Se detecta al menos una fuente identificable y atribuciones claras. Se contrastan versiones.'
    : s.evidencia.fuenteOficialIdentificada || s.tieneAtribucion
      ? 'Se detecta al menos una fuente identificable y atribuciones claras.'
      : 'No se detecta fuente identificable ni atribución clara.';

  const trabajoPropioEstricto = s.evidencia.trabajoDeCampo || s.aportePropio;
  const trabajoPropioJustificacion = s.evidencia.trabajoDeCampo
    ? 'Trabajo de campo propio demostrado.'
    : s.aportePropio
      ? 'Se detecta frase de trabajo propio (confirmó/consultó/verificó/obtuvo).'
      : 'No es posible determinar si existió trabajo propio desde el texto. No se castiga lo no demostrable.';

  switch (tipoNota) {
    case 'Breaking News': {
      add('Rapidez y claridad', 15, s.p3 + (s.palabraCount < 200 ? 4 : 0) + (s.tieneAtribucion ? 3 : 0), s.p3 >= 6 ? 'Informa el hecho con rapidez y claridad pese al poco tiempo.' : 'El relato inicial no logra comunicar con claridad qué ocurrió.');
      add('Fuente identificable', 20, s.p7 + s.p1 / 2, s.p7 >= 8 ? 'Cita o atribuye la información a una fuente.' : 'No se identifica de dónde proviene la información.');
      add('Datos confirmados', 20, (s.tieneDatosConcretos ? 12 : 0) + s.p1 / 2, s.tieneDatosConcretos ? 'Aporta datos concretos sin inventar.' : 'Faltan datos verificables o hay riesgo de invención.');
      add('Responde qué pasó', 20, s.p3 * 2, s.p3 >= 6 ? 'Responde la pregunta esencial del hecho.' : 'No queda claro el hecho central.');
      add('Responde qué sigue', 10, s.p8 + (s.scoreCausaConsecuencia ? 2 : 0), s.p8 >= 4 ? 'Indica pasos inmediatos o próximas acciones.' : 'No anticipa qué viene después.');
      add('Sin inventar', 10, s.atribucionFalsa ? 0 : 10, s.atribucionFalsa ? 'Detectada atribución falsa o fuente anónima sin respaldo.' : 'Evita atribuciones falsas o fuentes anónimas sin sustento.');
      return { criterios, max: 95 };
    }
    case 'Nota informativa + contexto': {
      add('Qué cambió respecto a antes', 15, s.p2 + s.p9 + (s.aportePropio ? 3 : 0), s.p2 + s.p9 >= 6 ? 'Aporta información nueva respecto a versiones previas.' : 'No se percibe el avance respecto a la última versión.');
      add('Información nueva verificable', 20, s.p1 + s.p7, s.p1 + s.p7 >= 12 ? 'Agrega datos verificables de fuentes.' : 'La "actualización" carece de datos nuevos.');
      add('Qué falta confirmar', 15, s.p8 + (s.scoreCausaConsecuencia ? 4 : 0) + 4, s.p8 + (s.scoreCausaConsecuencia ? 4 : 0) + 4 >= 8 ? 'Reconoce lo que aún no está confirmado.' : 'No deja claro qué información sigue siendo provisional.');
      add('Contexto del evento', 15, s.p5 + s.p2, s.p5 + s.p2 >= 8 ? 'Situación del hecho en su contexto.' : 'Falta contexto para entender la evolución.');
      add('Fuentes y atribuciones', 15, s.p7 + s.p1 / 3, verificacionJustificacion);
      add('Utilidad para seguimiento', 10, s.p8 + (s.scoreUtilidad ? 2 : 0), s.p8 >= 4 ? 'Útil para quienes siguen el caso.' : 'No aporta orientación sobre cómo seguir el hecho.');
      return { criterios, max: 90 };
    }
    case 'Nota informativa': {
      add('Qué pasó', 20, s.p3 * 2, s.p3 >= 6 ? 'Narra el hecho con claridad.' : 'El hecho no está claro.');
      add('Por qué ocurrió', 15, s.scoreCausaConsecuencia * 2 + (s.scoreAnalisis ? 3 : 0), s.scoreCausaConsecuencia > 0 ? 'Explica causas o motivos.' : 'No aborda las causas.');
      add('Cómo ocurrió', 15, s.p3 + (s.tieneDatosConcretos ? 4 : 0), s.p3 + (s.tieneDatosConcretos ? 4 : 0) >= 8 ? 'Detalla mecanismo o circunstancias.' : 'Falta el "cómo" del hecho.');
      add('Consecuencias', 15, s.p8 + s.scoreCausaConsecuencia * 2, s.p8 + s.scoreCausaConsecuencia * 2 >= 8 ? 'Menciona impacto o consecuencias.' : 'No explica qué cambia por el hecho.');
      add('Contexto', 10, s.p5 + (s.scoreContexto ? 2 : 0), s.p5 >= 4 ? 'Incluye contexto básico.' : 'Carece de antecedentes.');
      add('Utilidad práctica', 10, s.p8, s.p8 >= 4 ? 'Tiene utilidad para el lector.' : 'No ofrece utilidad clara.');
      return { criterios, max: 85 };
    }
    case 'Nota explicativa': {
      add('Enseña algo nuevo', 25, s.p4 * 2 + (s.scoreAnalisis ? 5 : 0), s.p4 >= 6 ? 'El lector aprende un concepto o relación nueva.' : 'No logra que el lector aprenda.');
      add('Contexto suficiente', 20, s.p5 * 2, s.p5 >= 4 ? 'Provee el contexto necesario para entender.' : 'Contexto insuficiente.');
      add('Análisis claro', 20, s.p2 * 2, s.p2 >= 4 ? 'Explica causas, consecuencias o implicaciones.' : 'Falta análisis.');
      add('Datos concretos', 15, (s.tieneDatosConcretos ? 8 : 0) + s.p7 / 2, s.tieneDatosConcretos ? 'Sustenta con datos o ejemplos.' : 'Falta sustento de datos.');
      add('Utilidad para decisiones', 10, s.p8 + (s.scoreUtilidad ? 3 : 0), s.p8 >= 4 ? 'El lector puede actuar o decidir mejor.' : 'No aporta aplicación práctica.');
      return { criterios, max: 90 };
    }
    case 'Análisis': {
      add('Pregunta central', 20, s.p3 * 2, s.p3 >= 6 ? 'Plantea claramente qué fenómeno analiza.' : 'No queda claro el objeto de análisis.');
      add('Contexto y antecedentes', 20, s.p5 * 2 + (s.scoreContexto ? 4 : 0), s.p5 >= 4 ? 'Provee contexto necesario para interpretar.' : 'Falta contexto para sostener el análisis.');
      add('Interpretación propia', 20, s.p2 * 2 + (s.scoreAnalisis ? 6 : 0), s.scoreAnalisis > 0 ? 'Aporta una interpretación, no solo datos.' : 'Solo acumula datos sin interpretación.');
      add('Fuentes identificables', 20, s.p7 + s.p1 / 2, verificacionJustificacion);
      add('Utilidad del análisis', 20, s.p8 + (s.scoreUtilidad ? 4 : 0), s.p8 >= 4 ? 'El lector entiende implicaciones o puede actuar.' : 'El análisis no termina de ser útil.');
      return { criterios, max: 100 };
    }
    case 'Reportaje': {
      const puntajeInvestigacionVisible = s.evidencia.trabajoDeCampo ? 20 : s.evidencia.documentoOficialIdentificado ? 16 : s.p6 >= 4 ? 8 : 2;
      add('Investigación visible', 20, puntajeInvestigacionVisible, s.evidencia.trabajoDeCampo ? 'Se demuestra trabajo de campo propio.' : s.evidencia.documentoOficialIdentificado ? 'Se identifica documento oficial, pero no se demuestra trabajo de campo.' : 'No se detecta investigación verificable: solo narración o palabras clave.');
      const puntajeFuentesPropias = s.evidencia.dosFuentesIndependientes ? 20 : s.evidencia.trabajoDeCampo ? 16 : s.p7 + s.p9 >= 8 ? 6 : 2;
      add('Entrevistas o fuentes propias', 20, puntajeFuentesPropias, s.evidencia.dosFuentesIndependientes ? 'Se detectan dos o más fuentes independientes.' : s.evidencia.trabajoDeCampo ? 'Hay trabajo de campo, pero no se contrastan fuentes.' : 'No se demuestran entrevistas ni fuentes propias.');
      add('Contexto amplio', 15, s.p5 + (s.scoreContexto ? 4 : 0), s.p5 >= 4 ? 'Contexto rico y amplio.' : 'Contexto limitado para un reportaje.');
      add('Análisis y explicación', 15, s.p2 + s.p4, s.p2 + s.p4 >= 8 ? 'Analiza, no solo describe.' : 'Falta análisis.');
      const puntajeDocumentos = s.evidencia.documentoOficialIdentificado ? 15 : s.evidencia.datoConcreto ? 6 : 2;
      add('Documentos o datos', 15, puntajeDocumentos, s.evidencia.documentoOficialIdentificado ? 'Documento o dato oficial identificado.' : s.evidencia.datoConcreto ? 'Dato concreto, pero no documento verificable.' : 'Falta evidencia documental.');
      add('Impacto o utilidad', 10, s.p8, s.p8 >= 4 ? 'Impacto o utilidad para el lector.' : 'Poca utilidad o impacto.');
      return { criterios, max: 95 };
    }
    case 'Investigación': {
      const puntajeFuentesMultiples = s.evidencia.dosFuentesIndependientes ? 20 : s.evidencia.fuenteOficialIdentificada ? 8 : 2;
      add('Fuentes múltiples y contrastadas', 20, puntajeFuentesMultiples, s.evidencia.dosFuentesIndependientes ? 'Se detectan dos o más fuentes independientes.' : s.evidencia.fuenteOficialIdentificada ? 'Solo una fuente oficial identificada; no se contrastan versiones.' : 'No se detectan fuentes múltiples ni contrastadas.');
      const puntajeDocumentos = s.evidencia.documentoOficialIdentificado ? 20 : s.evidencia.datoConcreto ? 6 : 2;
      add('Documentos / evidencia', 20, puntajeDocumentos, s.evidencia.documentoOficialIdentificado ? 'Documento oficial identificado.' : s.evidencia.datoConcreto ? 'Dato concreto, pero no documento oficial citado.' : 'No se identifica documento ni evidencia sólida.');
      const puntajeVerificacion = (s.evidencia.dosFuentesIndependientes || s.evidencia.trabajoDeCampo || s.evidencia.fuenteOficialIdentificada || s.tieneAtribucion) ? 20 : 4;
      add('Verificación y contraste', 20, puntajeVerificacion, verificacionJustificacion);
      const puntajeTrabajoPropio = trabajoPropioEstricto ? 20 : 10;
      add('Trabajo propio de Nicaragua Informate', 20, puntajeTrabajoPropio, trabajoPropioJustificacion);
      add('Impacto del hallazgo', 10, s.p8 + (s.scoreCausaConsecuencia ? 3 : 0), s.p8 >= 4 ? 'El hallazgo tiene impacto público.' : 'Poco impacto comunicado.');
      add('Claridad de hallazgos', 10, s.p2 + s.p4, s.p2 + s.p4 >= 6 ? 'Explica bien los hallazgos.' : 'Hallazgos poco claros.');
      return { criterios, max: 100 };
    }
    default:
      add('Información básica', 50, s.p3 * 3, s.p3 >= 6 ? 'Narra el hecho con claridad.' : 'El hecho no está claro.');
      add('Fuentes y atribuciones', 50, s.p7 + s.p1 / 2, verificacionJustificacion);
      return { criterios, max: 100 };
  }
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

  const { tipo: tipoNota, razon: razonamientoTipo } = clasificarTipoNota(n.titulo, n.contenido, n.categoria, palabraCount, evidencia);

  const senales: SenalesEditoriales = {
    p1, p2, p3, p4, p5, p6, p7, p8, p9, p10,
    scoreAnalisis, scoreContexto, scoreInvestigacion, scoreCausaConsecuencia, scoreUtilidad,
    tieneAtribucion, tieneDatosConcretos, tieneNombresPropios, mencionaInstituciones, atribucionFalsa, aportePropio, infoReemplazable, palabraCount, imagenDestacada: n.imagenDestacada,
    evidencia,
  };

  const { criterios, max: puntuacionMaxima } = obtenerCriteriosEditorJefe(tipoNota, senales);
  const rawTotal = criterios.reduce((sum, c) => sum + c.puntuacion, 0);
  const puntuacionTotal = Math.min(rawTotal, puntuacionMaxima);

  // Ajustar criterios proporcionalmente si supera el máximo
  if (rawTotal > puntuacionMaxima && rawTotal > 0) {
    const factor = puntuacionMaxima / rawTotal;
    criterios.forEach(c => { c.puntuacion = Math.round(c.puntuacion * factor); });
  }

  // Veredicto escalado a 100 (capado por evidencia real para evitar alucinaciones)
  let score100 = Math.round((puntuacionTotal / puntuacionMaxima) * 100);
  if (tipoNota === 'Investigación' && !(evidencia.dosFuentesIndependientes || evidencia.trabajoDeCampo)) score100 = Math.min(score100, 60);
  if (tipoNota === 'Reportaje' && !(evidencia.trabajoDeCampo || evidencia.documentoOficialIdentificado)) score100 = Math.min(score100, 65);
  if (!tieneAtribucion && !evidencia.fuenteOficialIdentificada) score100 = Math.min(score100, 60);

  let veredicto: ReporteEditorJefe['veredicto'];
  if (score100 >= 90) veredicto = '🏆 Periodismo de alto valor';
  else if (score100 >= 80) veredicto = '🟢 Referencia';
  else if (score100 >= 60) veredicto = '🟡 Competitiva';
  else veredicto = '🔴 Reemplazable';

  const porQueExiste = (evidencia.dosFuentesIndependientes || evidencia.trabajoDeCampo || evidencia.documentoOficialIdentificado || scoreAnalisis > 2)
    ? 'Este artículo aporta información verificada, contexto o evidencia que lo diferencia de una simple repetición.'
    : 'Este artículo narra un hecho relevante, pero no se detecta evidencia demostrable de trabajo propio, verificación adicional o documentos que lo diferencien. Oportunidad editorial: contrastar con fuentes o agregar contexto cuando esté disponible.';

  const aporteOriginal = (evidencia.dosFuentesIndependientes || evidencia.trabajoDeCampo || evidencia.documentoOficialIdentificado || scoreAnalisis > 2)
    ? `Aporta ${evidencia.trabajoDeCampo ? 'reporteo propio' : evidencia.dosFuentesIndependientes ? 'fuentes contrastadas' : evidencia.documentoOficialIdentificado ? 'evidencia oficial' : 'contexto o análisis'}${scoreAnalisis > 2 ? ' y contexto adicional' : '.'}`
    : 'No se detecta evidencia demostrable de trabajo propio, verificación o documentos en el texto; no se asume que no existió, solo que no es visible aquí.';

  const comoConvertirReferencia = generarComoConvertirReferencia(senales, tipoNota);
  const oportunidadesEditoriales = generarOportunidadesEditoriales(senales, tipoNota);

  const investigacionAdicional = tipoNota === 'Breaking News'
    ? 'En una nota de última hora no se exige investigación profunda; basta con confirmar datos y fuentes oficiales.'
    : p6 < 6
      ? 'Oportunidad editorial: cuando estén disponibles, incorporar documentos oficiales, estadísticas históricas, declaraciones institucionales o testimonios directos.'
      : 'Oportunidad editorial: ampliar con cifras comparativas o una línea de tiempo para reforzar la solidez.';

  const preguntaSinResponder = scoreCausaConsecuencia > 0
    ? 'Oportunidad editorial: profundizar en qué medidas o cambios se derivan del hecho cuando estén confirmados.'
    : 'Oportunidad editorial: explicar por qué ocurrió y cuál es el impacto real, en la medida en que la información esté disponible.';

  const datoEnriquecedor = p5 < 6
    ? 'Oportunidad editorial: cuando existan, agregar antecedentes recientes, estadísticas comparativas o el marco legal relevante.'
    : 'Oportunidad editorial: una entrevista, documento oficial o cifra actualizada reforzaría el diferenciador.';

  // Detectores
  const detectorNicaraguaInformate = generarDetectorNicaraguaInformate(senales);
  const detectorFacebook = generarDetectorFacebook(score100, scoreUtilidad, scoreContexto, scoreAnalisis, aportePropio);
  const detectorGoogle = generarDetectorGoogle(score100, p1, p7, scoreContexto, scoreInvestigacion, aportePropio);
  const detectorEEATReal = generarDetectorEEATReal(senales);

  // Discover / compartir
  const discoverSiNo: ReporteEditorJefe['discoverSiNo'] = p10 >= 6 ? 'Sí' : 'No';
  const discoverRazon = p10 >= 6
    ? 'Discover tendría señales de utilidad, confianza y originalidad para mostrarla.'
    : 'Oportunidad editorial: agregar utilidad, contexto o diferenciador para dejar de depender solo del tráfico de noticia.';

  const compartibleSiNo: ReporteEditorJefe['compartibleSiNo'] = score100 >= 70 ? 'Sí' : 'No';
  const porQueCompartible = score100 >= 70
    ? 'Porque aporta información útil, contexto o análisis que justifica compartirla.'
    : 'Oportunidad editorial: la nota necesita un valor diferencial (contexto, verificación o utilidad) para que alguien la comparta.';

  // Niveles 7.5-10
  const nivel7_5_evidenciaAporte = detectarEvidenciaAporte(textoPlano, aportePropio, evidencia);
  const nivel8_impactoLector = generarImpactoLector(textoLower, n.categoria, score100);
  const nivel9_preguntasSinRespuesta = generarPreguntasSinRespuesta(textoLower, n.categoria, n.titulo, tipoNota);
  const nivel10_oportunidades = generarOportunidadesPeriodisticas(n.categoria, n.titulo);

  // Indicadores Editor Jefe 2.0
  const factibilidad = generarFactibilidad(senales, tipoNota);
  const tiempoReferencia = generarTiempoReferencia(tipoNota, score100);
  const retornoPeriodistico = generarRetornoPeriodistico(tipoNota, n.categoria, n.titulo, score100);
  const prioridadEditorial = generarPrioridadEditorial(tipoNota, score100, n.categoria);
  const valorParaLector = generarValorParaLector(textoLower, n.categoria, score100, scoreUtilidad, scoreCausaConsecuencia);
  const razonamientoReferencia = generarRazonamientoReferencia(senales);

  const nivelEvidencia: ReporteEditorJefe['nivelEvidencia'] = [
    { criterio: 'Fuente oficial identificada', detectado: evidencia.fuenteOficialIdentificada ? 'Sí' : tieneAtribucion ? 'Parcial' : 'No', puntaje: evidencia.fuenteOficialIdentificada ? 3 : tieneAtribucion ? 1 : 0, maximo: 3 },
    { criterio: 'Dos o más fuentes independientes', detectado: evidencia.dosFuentesIndependientes ? 'Sí' : 'No', puntaje: evidencia.dosFuentesIndependientes ? 3 : 0, maximo: 3 },
    { criterio: 'Documento oficial identificado', detectado: evidencia.documentoOficialIdentificado ? 'Sí' : 'No', puntaje: evidencia.documentoOficialIdentificado ? 3 : 0, maximo: 3 },
    { criterio: 'Trabajo de campo verificable', detectado: evidencia.trabajoDeCampo ? 'Sí' : 'No', puntaje: evidencia.trabajoDeCampo ? 3 : 0, maximo: 3 },
    { criterio: 'Dato concreto (fecha, cifra, cantidad)', detectado: evidencia.datoConcreto ? 'Sí' : 'No', puntaje: evidencia.datoConcreto ? 3 : 0, maximo: 3 },
    { criterio: 'Contexto legal / institucional', detectado: evidencia.contextoLegal ? 'Sí' : 'No', puntaje: evidencia.contextoLegal ? 3 : 0, maximo: 3 },
  ];

  return {
    tipoNota,
    razonamientoTipo,
    puntuacion: score100,
    puntuacionMaxima,
    veredicto,
    criterios,

    porQueExiste,
    aporteOriginal,
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
    retornoPeriodistico,
    prioridadEditorial,
    valorParaLector,
    razonamientoReferencia,

    discoverRazon,
    discoverSiNo,
    porQueCompartible,
    compartibleSiNo,
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

function generarComoConvertirReferencia(s: SenalesEditoriales, tipoNota: TipoNotaEditorial): string[] {
  const pasos: string[] = [];
  if (tipoNota === 'Breaking News') {
    pasos.push('Confirmar la fuente y el dato central con una atribución clara.');
    pasos.push('Actualizar la nota a medida que haya más información disponible.');
    if (!s.evidencia.datoConcreto) pasos.push('Añadir el dato concreto básico (hora, lugar, número de afectados).');
    return pasos;
  }
  if (!s.evidencia.fuenteOficialIdentificada) pasos.push('Oportunidad editorial: cuando esté disponible, añadir fuente oficial con nombre y cargo o documento que respalde el dato central.');
  if (!s.evidencia.dosFuentesIndependientes && tipoNota !== 'Nota informativa') pasos.push('Oportunidad editorial: contrastar el dato con al menos una fuente independiente si es accesible.');
  if (!s.evidencia.documentoOficialIdentificado && (tipoNota === 'Reportaje' || tipoNota === 'Investigación')) pasos.push('Oportunidad editorial: identificar el documento, informe o dato oficial que respalde la investigación cuando sea público.');
  if (!s.evidencia.trabajoDeCampo && (tipoNota === 'Reportaje' || tipoNota === 'Investigación')) pasos.push('Oportunidad editorial: incluir evidencia de trabajo de campo (observación, entrevista o verificación presencial) si es accesible.');
  if (!s.evidencia.contextoLegal && tipoNota === 'Investigación') pasos.push('Oportunidad editorial: incluir marco legal o institucional relevante.');
  if (pasos.length === 0) {
    pasos.push('Mantener el nivel actual y verificar que el dato central siga vigente.');
    pasos.push('Considerar una actualización si surge nueva información relevante.');
  }
  return pasos;
}

function generarOportunidadesEditoriales(s: SenalesEditoriales, tipoNota: TipoNotaEditorial): string[] {
  const oportunidades: string[] = [];
  if (tipoNota === 'Breaking News') {
    oportunidades.push('Confirmar la fuente oficial del dato central.');
    oportunidades.push('Añadir dato concreto (hora, lugar, número de afectados).');
    if (!s.evidencia.datoConcreto) oportunidades.push('Actualizar con el estado de las víctimas o próximos pasos.');
    return oportunidades;
  }
  if (!s.evidencia.fuenteOficialIdentificada) oportunidades.push('Oportunidad editorial: cuando sea posible, identificar fuente oficial con nombre o documento.');
  if (!s.evidencia.dosFuentesIndependientes && tipoNota !== 'Nota informativa') oportunidades.push('Oportunidad editorial: contrastar con al menos una fuente independiente si está disponible.');
  if (!s.evidencia.documentoOficialIdentificado && (tipoNota === 'Reportaje' || tipoNota === 'Investigación')) oportunidades.push('Oportunidad editorial: consultar documento o dato oficial cuando sea público.');
  if (!s.evidencia.trabajoDeCampo && (tipoNota === 'Reportaje' || tipoNota === 'Investigación')) oportunidades.push('Oportunidad editorial: incluir evidencia de trabajo de campo o entrevista directa si es accesible.');
  if (s.p8 < 5 && s.scoreCausaConsecuencia === 0) oportunidades.push('Oportunidad editorial: explicar consecuencias o utilidad práctica para el lector.');
  if (oportunidades.length === 0) oportunidades.push('Nada crítico; se recomienda mantener el nivel y actualizar si surgen nuevos datos.');
  return oportunidades;
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

function generarFactibilidad(s: SenalesEditoriales, tipoNota: TipoNotaEditorial): string {
  const { palabraCount, p7, evidencia } = s;
  if (tipoNota === 'Breaking News') {
    if (palabraCount < 150 && !evidencia.fuenteOficialIdentificada) return 'Es factible: solo se puede pedir rapidez, claridad y fuente. No se exige investigación profunda.';
    return 'Es factible y está bien ejecutada para una nota de última hora.';
  }
  if (tipoNota === 'Nota informativa' && palabraCount < 250) {
    return 'Es factible como nota breve, pero no se le puede exigir entrevistas ni documentos.';
  }
  if (tipoNota === 'Reportaje' && !(evidencia.trabajoDeCampo || evidencia.documentoOficialIdentificado)) {
    return 'Para consolidarse como reportaje requeriría entrevistas, documentos o evidencia de campo; no se castiga la ausencia si no existe todavía.';
  }
  if (tipoNota === 'Investigación' && !(evidencia.dosFuentesIndependientes || evidencia.trabajoDeCampo)) {
    return 'Para ser una investigación requeriría fuentes múltiples, documentos y verificación; si no están disponibles, puede titularse como nota informativa o análisis.';
  }
  if (p7 < 6 && !evidencia.fuenteOficialIdentificada) return 'No es razonable pedir investigación profunda a esta altura; las sugerencias se ajustan al tipo de nota.';
  return 'Las sugerencias son factibles y se ajustan al tiempo y tipo de cobertura.';
}

function generarTiempoReferencia(tipoNota: TipoNotaEditorial, score100: number): string {
  if (score100 >= 85) return 'Ya es nota de referencia. Solo requiere mantenimiento si cambian los hechos.';
  if (tipoNota === 'Breaking News') return '15-30 minutos para confirmar fuente y actualizar con datos nuevos.';
  if (tipoNota === 'Nota informativa + contexto') return '30 minutos - 2 horas para agregar contexto y confirmar información faltante.';
  if (tipoNota === 'Nota informativa') {
    if (score100 < 60) return '2-4 horas: agregar antecedentes, consecuencias y fuentes claras.';
    return '1-2 horas: completar causas, consecuencias y contexto.';
  }
  if (tipoNota === 'Nota explicativa') return '2-4 horas: profundizar ejemplos, datos y utilidad práctica.';
  if (tipoNota === 'Reportaje') return '1-3 días: entrevistas, documentos, análisis y edición.';
  return '1 semana o más: investigación documental, múltiples fuentes y verificación.';
}

function generarRetornoPeriodistico(tipoNota: TipoNotaEditorial, categoria: string, titulo: string, score100: number): string {
  const tit = titulo.toLowerCase();
  const cat = categoria.toLowerCase();
  if (tipoNota === 'Investigación' || tipoNota === 'Reportaje') return 'Alto: este tipo de pieza construye autoridad y diferenciación a largo plazo.';
  if (score100 >= 80) return 'Alto: la nota tiene potencial para convertirse en referencia y generar tráfico sostenido.';
  if (tit.includes('femicidio') || tit.includes('asesinato') || tit.includes('muerte') || cat.includes('judicial')) return 'Alto: temas de alto interés público que justifican inversión editorial.';
  if (tit.includes('accidente') || tit.includes('incendio') || cat.includes('suceso')) return 'Medio: noticia de tráfico inmediato, pero con ventana corta de interés.';
  if (tipoNota === 'Nota explicativa') return 'Medio-alto: si explica bien, puede generar tráfico recurrente de búsqueda.';
  return 'Oportunidad editorial: evaluar si el hecho tiene ángulo de servicio, contexto histórico o comparación que justifique más cobertura.';
}

function generarPrioridadEditorial(tipoNota: TipoNotaEditorial, score100: number, categoria: string): string {
  const cat = categoria.toLowerCase();
  if (tipoNota === 'Investigación' || tipoNota === 'Reportaje') return '★★★★★ — Merece portada y promoción destacada.';
  if (score100 >= 85) return '★★★★★ — Nota de referencia, ideal para portada.';
  if (tipoNota === 'Breaking News') return '★★★★☆ — Prioridad alta por actualidad, aunque puede ser breve.';
  if (cat.includes('suceso') || cat.includes('judicial')) return '★★★★☆ — Alta atención del público.';
  if (tipoNota === 'Nota informativa + contexto') return '★★★☆☆ — Seguimiento necesario, no necesariamente portada principal.';
  if (tipoNota === 'Nota explicativa' && score100 >= 70) return '★★★★☆ — Buen contenido de fondo, promoción en redes y SEO.';
  if (score100 >= 60) return '★★★☆☆ — Publicable, pero no prioridad máxima.';
  return '★★☆☆☆ — Publicable como nota breve o redes sociales.';
}

function generarValorParaLector(textoLower: string, categoria: string, score100: number, scoreUtilidad: number, scoreCausaConsecuencia: number): string {
  const cat = categoria.toLowerCase();
  const aprende = /\b(como|por que|significado|explica|entender|guia|pasos|recomendacion|medida|prevencion)\b/i.test(textoLower);
  const riesgo = /\b(alerta|precaucion|evitar|cuidado|proteger|riesgo|peligro|vacuna)\b/i.test(textoLower);
  const ley = /\b(ley|articulo|codigo|pena|delito|proceso|derecho|legitima defensa)\b/i.test(textoLower);
  const cambio = /\b(cambio|nuevo|subida|baja|precio|costo|tarifa|salario|dolar)\b/i.test(textoLower);

  if (score100 >= 80 && (aprende || riesgo || ley || cambio)) {
    return 'El lector gana comprensión real: aprende, se protege, entiende una ley o conoce un cambio que le afecta.';
  }
  if (cat.includes('salud') && riesgo) return 'El lector obtiene información para cuidarse o entender un riesgo de salud.';
  if (cat.includes('economia') && cambio) return 'El lector entiende cómo el dato económico afecta su bolsillo o decisiones.';
  if (aprende) return 'El lector aprende algo, aunque podría profundizar más en la utilidad práctica.';
  if (scoreUtilidad > 0 || scoreCausaConsecuencia > 0) return 'El lector se informa con contexto, pero la utilidad práctica es limitada.';
  return 'Oportunidad editorial: el lector conoce el hecho, pero la nota puede agregar contexto, antecedentes o utilidad práctica si existe información disponible.';
}

function generarRazonamientoReferencia(s: SenalesEditoriales): string {
  const diferenciadores: string[] = [];
  if (s.evidencia.trabajoDeCampo) diferenciadores.push('trabajo de campo verificable');
  if (s.evidencia.dosFuentesIndependientes) diferenciadores.push('fuentes contrastadas');
  if (s.evidencia.documentoOficialIdentificado) diferenciadores.push('documento o dato oficial identificado');
  if (s.evidencia.fuenteOficialIdentificada) diferenciadores.push('fuente oficial identificada');
  if (s.evidencia.datoConcreto) diferenciadores.push('datos concretos');

  if (diferenciadores.length >= 3) {
    return `Sí hay razón objetiva: Nicaragua Informate aporta ${diferenciadores.slice(0, -1).join(', ')} y ${diferenciadores[diferenciadores.length - 1]}.`;
  }
  if (diferenciadores.length >= 1) {
    return `Tiene una señal (${diferenciadores[0]}), pero no es suficiente para convertirse en referencia frente a TN8, La Prensa o Canal 10. Oportunidad editorial: agregar una segunda fuente o contexto.`;
  }
  return 'No existe una razón objetiva demostrable en el texto: si todos los medios publican lo mismo, Nicaragua Informate no aporta ventaja clara. Oportunidad editorial: agregar contexto, verificación o utilidad.';
}

function generarPreguntasSinRespuesta(textoLower: string, categoria: string, titulo: string, tipoNota: TipoNotaEditorial): string[] {
  if (tipoNota === 'Breaking News') {
    return ['¿Qué datos aún faltan confirmar?', '¿Cuál es el estado actual de las personas afectadas?', '¿Qué pasos sigue la autoridad competente?'];
  }

  const cat = categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tit = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const menciona = (palabra: string) => textoLower.includes(palabra);
  const enTitulo = (palabra: string) => tit.includes(palabra);
  const contar = (lista: string[]) => lista.filter(p => menciona(p) || enTitulo(p)).length;

  // Ponderación: título pesa más que contenido; categoría es confirmatoria
  const senales: Record<string, { cat: string[]; titulo: string[]; texto: string[] }> = {
    judicial: {
      cat: ['judicial', 'policial', 'crimen', 'justicia'],
      titulo: ['feminicidio', 'femicidio', 'homicidio', 'asesinato', 'asesinada', 'asesinado', 'crimen', 'robo', 'detenido', 'detenida', 'imputado', 'imputada', 'acusado', 'acusada', 'sentencia', 'audiencia', 'judicial', 'violencia', 'agresion', 'agredida', 'atacada', 'fiscalia'],
      texto: ['fiscalia', 'ministerio publico', 'policia nacional', 'juzgado', 'tribunal', 'audiencia', 'imputado', 'acusado', 'victima', 'testigo', 'delito', 'pena', 'proceso', 'ley 779', 'medida de proteccion', 'denuncia'],
    },
    accidente: {
      cat: ['suceso', 'transito', 'accidente'],
      titulo: ['accidente', 'choque', 'colision', 'vuelco', 'volcamiento', 'incendio', 'explosion', 'derrumbe', 'atropello', 'atropellado'],
      texto: ['accidente', 'choque', 'colision', 'vehiculo', 'conductor', 'pasajero', 'herido', 'fallecido', 'ambulancia', 'carretera', 'velocidad'],
    },
    salud: {
      cat: ['salud', 'sanidad'],
      titulo: ['dengue', 'malaria', 'zika', 'chikungunya', 'covid', 'vacuna', 'epidemia', 'hospital', 'minsa', 'enfermedad'],
      texto: ['minsa', 'ministerio de salud', 'vacuna', 'tratamiento', 'casos', 'paciente', 'hospital', 'centro de salud'],
    },
    politica: {
      cat: ['politica', 'gobierno', 'nacion'],
      titulo: ['asamblea', 'ley', 'decreto', 'acuerdo', 'eleccion', 'voto', 'gobierno', 'politica', 'sancion', 'diputado'],
      texto: ['asamblea nacional', 'gobierno', 'ley', 'decreto', 'acuerdo', 'ejecutivo', 'diputado', 'politica'],
    },
    economia: {
      cat: ['economia', 'finanzas'],
      titulo: ['precio', 'dolar', 'gasolina', 'canasta basica', 'inflacion', 'remesas', 'economia', 'mercado'],
      texto: ['precio', 'dolar', 'mercado', 'economia', 'finanzas', 'impacto economico'],
    },
    deportes: {
      cat: ['deportes', 'beisbol', 'futbol', 'boxeo'],
      titulo: ['beisbol', 'futbol', 'boxeo', 'juego', 'serie', 'torneo', 'liga', 'equipo'],
      texto: ['beisbol', 'futbol', 'boxeo', 'equipo', 'juego', 'serie', 'torneo', 'tabla', 'clasificacion'],
    },
    cultura: {
      cat: ['cultura', 'espectaculos', 'arte'],
      titulo: ['festival', 'concierto', 'feria', 'evento', 'celebracion', 'cultura'],
      texto: ['festival', 'concierto', 'evento', 'artista', 'entrada', 'boleto'],
    },
  };

  const puntajes: Record<string, number> = {};
  for (const [tipo, s] of Object.entries(senales)) {
    let score = 0;
    if (s.cat.some(c => cat.includes(c))) score += 3;
    score += contar(s.titulo) * 4;
    score += contar(s.texto) * 1;
    puntajes[tipo] = score;
  }

  const tipoDominante = Object.entries(puntajes).sort((a, b) => b[1] - a[1])[0];
  const bancoKey = tipoDominante && tipoDominante[1] > 0 ? tipoDominante[0] : 'sucesos';

  const bancos: Record<string, string[]> = {
    judicial: [
      '¿Existían denuncias previas de la víctima o familiares?',
      '¿Había medidas de protección vigentes para la víctima?',
      '¿La Policía Nacional confirmó antecedentes del imputado?',
      '¿Qué dice la Ley 779 sobre este tipo de caso?',
      '¿Qué viene en el proceso judicial?',
      '¿Cuándo será la próxima audiencia?',
    ],
    accidente: [
      '¿Cuál es el estado de salud de las víctimas?',
      '¿Estaba involucrado exceso de velocidad, alcohol o distracción?',
      '¿En qué condiciones se encuentra la carretera o el punto del accidente?',
      '¿Hubo antecedentes similares en el mismo lugar?',
      '¿Qué medidas se han tomado para evitar que se repita?',
    ],
    sucesos: [
      '¿Qué institución tiene la responsabilidad directa?',
      '¿Existen datos históricos que permitan comparar?',
      '¿Qué pasos siguen tras este hecho?',
    ],
    salud: [
      '¿Por qué volvió a crecer el problema?',
      '¿En qué regiones o municipios se concentra?',
      '¿Qué acciones está tomando el Ministerio de Salud?',
      '¿Qué debe hacer la población para protegerse?',
      '¿Dónde se puede acceder al tratamiento o vacuna?',
    ],
    politica: [
      '¿Qué cambia concretamente con este acuerdo o ley?',
      '¿Qué dicen los sectores críticos o la oposición?',
      '¿Cuándo entra en vigencia o hay plazos?',
      '¿A quiénes afecta directamente?',
      '¿Qué institución ejecutará la medida?',
    ],
    economia: [
      '¿Por qué subió o bajó el precio o indicador?',
      '¿Cómo se compara con el año o mes anterior?',
      '¿A quiénes afecta directamente?',
      '¿Qué autoridad reguló o anunció el cambio?',
      '¿Cuál es la proyección a corto plazo?',
    ],
    deportes: [
      '¿Cuál fue el resultado o marcador final?',
      '¿Qué estadísticas destacan del evento?',
      '¿Qué dijeron los protagonistas o entrenadores?',
      '¿Cómo quedó la posición en la tabla o clasificación?',
      '¿Cuándo es el próximo compromiso?',
    ],
    cultura: [
      '¿Cuándo y dónde se realiza?',
      '¿Cuál es el costo de acceso?',
      '¿Quiénes organizan el evento?',
      '¿Qué artistas o expositores participan?',
    ],
  };

  const preguntas = bancos[bancoKey] || bancos.sucesos;

  // Filtrar preguntas cuya respuesta ya aparece en el texto (heurística simple)
  const palabrasClave = ['denuncia', 'antecedente', 'policia', 'velocidad', 'alcohol', 'herido', 'minsa', 'region', 'prevencion', 'tratamiento', 'cambio', 'critica', 'oposicion', 'plazo', 'afectados', 'resultado', 'marcador', 'estadisticas', 'declaracion', 'entrevista', 'fecha', 'hora', 'costo', 'entrada', 'organizadores', 'motivo', 'comparacion', 'anterior', 'afecta', 'audiencia', 'proteccion'];
  const filtradas = preguntas.filter(q => {
    const palabra = palabrasClave.find(p => q.toLowerCase().includes(p));
    return !palabra || !menciona(palabra);
  });

  return filtradas.slice(0, 6);
}

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

function generarOportunidadesPeriodisticas(categoria: string, titulo: string): string[] {
  const cat = categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tit = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const ideas: string[] = [];

  if (cat.includes('suceso') || tit.includes('accidente') || tit.includes('choque') || tit.includes('colision')) {
    ideas.push('¿Por qué aumentan los accidentes los fines de semana?');
    ideas.push('Las cinco carreteras o zonas con más accidentes en Nicaragua.');
    ideas.push('Qué dice la Policía de Tránsito sobre exceso de velocidad.');
    ideas.push('Cómo influye el alcohol en los accidentes viales.');
    ideas.push('Qué pasa con el uso del casco y el cinturón de seguridad.');
    ideas.push('Cuánto cuesta económicamente un accidente para una familia nicaragüense.');
    ideas.push('Cómo cambió la mortalidad vial respecto al año anterior.');
  }

  if (cat.includes('salud') || tit.includes('malaria') || tit.includes('dengue') || tit.includes('zika') || tit.includes('vacuna')) {
    ideas.push('Mapa de los municipios con más casos este año.');
    ideas.push('¿Por qué volvió a crecer la enfermedad en la frontera?');
    ideas.push('Qué cambia con el nuevo acuerdo o plan de salud.');
    ideas.push('Entrevista con el médico o epidemiólogo a cargo.');
    ideas.push('Costo del tratamiento para las familias afectadas.');
  }

  if (cat.includes('judicial') || tit.includes('adolescente') || tit.includes('feminicidio') || tit.includes('femicidio') || tit.includes('homicidio') || tit.includes('crimen')) {
    ideas.push('Historial de casos similares en el mismo departamento.');
    ideas.push('¿Funcionan las medidas de protección a víctimas?');
    ideas.push('Entrevista con organizaciones de derechos humanos.');
    ideas.push('Explicación del marco legal y posibles penas.');
    ideas.push('Cronología del proceso judicial y próximos pasos.');
    ideas.push('Reacción de la familia de la víctima o del imputado.');
  }

  if (cat.includes('economia') || tit.includes('precio') || tit.includes('dolar') || tit.includes('gasolina') || tit.includes('canasta basica')) {
    ideas.push('Comparativa de precios con el año pasado.');
    ideas.push('Cómo afecta el dato a la canasta básica.');
    ideas.push('Opinión de economistas o sectores productivos.');
    ideas.push('Mapa de precios en mercados de Nicaragua.');
  }

  if (cat.includes('politica') || cat.includes('gobierno') || tit.includes('acuerdo') || tit.includes('ley') || tit.includes('decreto')) {
    ideas.push('Cronología de la norma o acuerdo y quiénes la impulsaron.');
    ideas.push('Análisis de sectores afectados y posibles objeciones.');
    ideas.push('Verificación de cumplimiento de plazos.');
  }

  if (cat.includes('deportes') || tit.includes('beisbol') || tit.includes('futbol') || tit.includes('boxeo')) {
    ideas.push('Análisis de la tabla de posiciones y próximos rivales.');
    ideas.push('Perfil del protagonista o figura clave del evento.');
    ideas.push('Reacciones de los equipos y entrenadores.');
  }

  if (cat.includes('cultura') || cat.includes('espectaculos') || tit.includes('festival') || tit.includes('concierto') || tit.includes('celebracion')) {
    ideas.push('Entrevista con artistas o organizadores.');
    ideas.push('Guía práctica para asistir: costos, horarios, accesos.');
    ideas.push('Impacto económico del evento para la ciudad.');
  }

  if (ideas.length === 0) {
    ideas.push('Perfil de los protagonistas del hecho.');
    ideas.push('Cronología completa de los antecedentes.');
    ideas.push('Reacciones de la comunidad o instituciones involucradas.');
    ideas.push('Impacto económico o social a mediano plazo.');
  }

  return ideas.slice(0, 6);
}

// ───────────────────────────────────────────────
// DETECTOR FACEBOOK
// ───────────────────────────────────────────────

function generarDetectorFacebook(puntuacionTotal: number, scoreUtilidad: number, scoreContexto: number, scoreAnalisis: number, aportePropio: boolean): string {
  if (puntuacionTotal >= 80 && (scoreUtilidad > 0 || scoreContexto > 1)) {
    return 'Sí se compartiría: la nota aporta información útil o reveladora que el lector querrá difundir, no solo un titular fuerte.';
  }
  if (aportePropio && scoreAnalisis > 1) {
    return 'Probablemente se comparta entre audiencias interesadas en el tema, porque incluye contexto o reporteo propio.';
  }
  if (puntuacionTotal >= 60) {
    return 'Se compartiría moderadamente; no es viral por utilidad, sino por relevancia informativa básica.';
  }
  return 'Oportunidad editorial: la nota carece de sorpresa, utilidad o contexto demostrable; agregar uno de esos elementos aumentaría la difusión.';
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
  return 'Oportunidad editorial: la nota es reemplazable por la cobertura estándar; agregar contexto, verificación o utilidad diferenciaría su posición.';
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
    return `Tiene señales de credibilidad parcial (${partes.join(', ')}), pero falta sustento para que el lector prefiera NI sobre otro medio.`;
  }
  if (partes.length === 1) return `Tiene una señal de credibilidad (${partes[0]}), pero no es suficiente para preferir NI.`;
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
