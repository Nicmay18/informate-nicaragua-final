/**
 * Analizador Forense de Noticias - Nicaragua Informate v2.1
 * REGLA RECTORA: El Director Editorial evalua la noticia con la informacion
 * publica disponible en este momento. No exige recursos que el medio no tiene:
 * corresponsales permanentes, acceso a hospitales, Policia, Medicina Legal,
 * expedientes judiciales ni entrevistas exclusivas.
 *
 * El "trabajo de campo" se redefine como "evidencia verificable". Si la nota
 * cita una fuente oficial, medio identificado, documento, video, fotografia o
 * testimonio publicado por un medio reconocido, el trabajo periodistico se
 * considera SATISFECHO.
 *
 * Niveles: FORENSE > ORO > PLATA > BRONCE > RECHAZADO
 * Prioridad: VERIFICABILIDAD sobre longitud. No se penaliza por informacion
 * que depende de terceros; se marca como "Oportunidad futura de actualizacion".
 */

import { evaluarEditorJefeV2, type ResultadoEditorJefeV2 } from './editor-jefe/engine';
import { mapearReporteEditorJefe } from './editor-jefe/mapper';
import type { VerticalEditorial } from './editor-jefe/perfiles';
import { evaluarPorVertical, type DiferenciadorNI } from './editor-jefe/modulos';

function limpiarContenidoNoticia(contenido: string): string {
  // Eliminar bloques típicos de panel/CMS/IA: panel de administración, mensajes del sistema, prompts, UI, etc.
  return contenido
    .replace(/\[panel[^\]]*\][\s\S]*?\[\/panel\]/gi, ' ')
    .replace(/\[sistema[^\]]*\][\s\S]*?\[\/sistema\]/gi, ' ')
    .replace(/\[ui[^\]]*\][\s\S]*?\[\/ui\]/gi, ' ')
    .replace(/\[instruccion[^\]]*\][\s\S]*?\[\/instruccion\]/gi, ' ')
    // Líneas o frases que comienzan con etiquetas de panel/sistema/prompt/interfaz
    .replace(/(?:^|\n)\s*(?:panel de administraci[oó]n|panel|mensaje del sistema|nota del sistema|instrucci[oó]n(?:es)? del sistema|prompt del sistema|contexto del sistema|ui|interfaz|sidebar|men[uú]|login|dashboard|consola|debug|system message|system prompt|user prompt|assistant prompt)\s*(?::|—|–|-)?\s*.*/gim, ' ')
    // Etiquetas tipo HTML de sistema/panel
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
  decisionPortada:
    | 'No publicar'
    | 'Publicar breve'
    | 'Publicar estándar'
    | 'Portada'
    | 'Cobertura especial';
  explicacionPortada: string;

  // Perfil editorial especializado por vertical
  perfilVertical: {
    vertical: VerticalEditorial;
    criterios: string[];
    evidenciaAceptada: string[];
    utilidad: string[];
    contexto: string[];
    preguntas: string[];
    benchmark: string[];
    ee: string[];
  };

  diferenciadorNI?: DiferenciadorNI;
  valorAgregado?: string[];

  // Discover / compartir
  discoverRazon: string;
  descubreProbabilidad: 'ALTA' | 'MEDIA' | 'BAJA';
  porQueCompartible: string;
  compartibleSiNo: 'Sí' | 'No';
  categoriaFacebook:
    | 'Servicio'
    | 'Utilidad'
    | 'Impacto'
    | 'Identificación'
    | 'Debate'
    | 'Orgullo local'
    | 'Sorpresa'
    | 'Ninguna';
  razonFacebook: string;

  // Producción propia y riesgo legal
  produccionNicaraguaInformate: string[];
  riesgoLegal: {
    nivel: 'Bajo' | 'Medio' | 'Alto';
    explicacion: string;
  };

  // Firma del Director Editorial
  firmaDirector: string;

  // Autoauditoría Constitución V7.0
  auditoriaInterna: {
    aprobado: boolean;
    observaciones: string[];
    ajustesRealizados: string[];
  };
}

export interface FaseTriageItem {
  pregunta: string;
  respuesta: 'Sí' | 'No';
  observacion?: string;
}

export interface ExtraccionDocumental {
  tipo: string;
  valores: string[];
}

export interface OracionEtiquetada {
  texto: string;
  origen: 'OFICIAL' | 'SEMIOFICIAL' | 'TESTIGO' | 'REDES' | 'PERIODÍSTICO' | 'DOCUMENTAL' | 'FORENSE' | 'SIN ORIGEN';
}

export interface CheckParrafo {
  parrafo: string;
  quien: string;
  como: string;
  donde: string;
  verificable: 'Sí' | 'No' | 'Parcial';
  tieneFuente: 'Sí' | 'No' | 'Parcial';
  marcaRoja: boolean;
  motivo?: string;
}

export interface HallazgoContaminacion {
  tipo: 'clickbait' | 'emocion' | 'especulacion' | 'suposicion' | 'sensacionalismo' | 'iaRepetitiva' | 'relleno' | 'adjetivo' | 'opinion' | 'moralizacion' | 'juicio' | 'drama' | 'palabraProhibida';
  texto: string;
  sugerencia: string;
}

export interface ElementoEstructural {
  presente: boolean;
  evaluacion: string;
}

export interface ParrafoHemorragia {
  parrafo: string;
  aportaDatoNuevo: boolean;
  accion: 'mantener' | 'eliminar' | 'condensar';
  motivo: string;
}

export interface CheckSEO {
  elemento: string;
  estado: 'PASS' | 'FAIL' | 'WARN';
  valorActual?: string;
  valorEsperado?: string;
  recomendacion?: string;
}

export interface CheckEEAT {
  criterio: string;
  presente: boolean;
  evidencia?: string;
}

export interface RiesgoLegal {
  tipo: string;
  presente: boolean;
  severidad: 'Baja' | 'Media' | 'Alta';
  correccion: string;
}

export interface PalabraAdsenseRiesgo {
  palabra: string;
  contexto: string;
  sugerencia: string;
}

export interface FacebookForense {
  probabilidad: 'ALTA' | 'MEDIA' | 'BAJA' | 'NULA';
  motivos: string[];
  riesgos: string[];
}

export interface DiscoverForense {
  probabilidad: 'ALTA' | 'MEDIA' | 'BAJA' | 'NULA';
  justificacion: string;
  faltantes: string[];
}

export interface UtilidadForense {
  items: { pregunta: string; respuesta: 'Sí' | 'No' }[];
  ganancias: string[];
}

export interface DiferenciadorForense {
  evidencia: string[];
  observacion: string;
}

export type ClasificacionPortadaForense =
  | 'Portada principal'
  | 'Portada secundaria'
  | 'Portada breve'
  | 'Actualización'
  | 'Seguimiento'
  | 'Especial'
  | 'Archivo';

export interface ReporteForenseV1 {
  version: '1.0';
  rol: 'auditoria';
  observaciones: string[];
  advertencias: string[];
  hallazgos: string[];

  fase0_identificacion: {
    tipoNota: string;
    nivelRiesgo: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
    observacion: string;
  };

  fase1_triage: {
    items: FaseTriageItem[];
    observaciones: string[];
  };

  fase2_autopsiaDocumental: {
    extracciones: ExtraccionDocumental[];
  };

  fase3_necropsiaEvidencia: {
    oraciones: OracionEtiquetada[];
    conteo: Record<OracionEtiquetada['origen'], number>;
  };

  fase4_cadenaCustodia: {
    parrafos: CheckParrafo[];
    observaciones: string[];
  };

  fase5_detectorContaminacion: {
    hallazgos: HallazgoContaminacion[];
    observaciones: string[];
  };

  fase6_cirugiaEstructural: {
    elementos: Record<string, ElementoEstructural>;
    observaciones: string[];
  };

  fase7_controlHemorragia: {
    parrafos: ParrafoHemorragia[];
    observaciones: string[];
  };

  fase8_tomografiaSEO: {
    checks: CheckSEO[];
  };

  fase9_resonanciaEEAT: {
    checks: CheckEEAT[];
  };

  fase10_forenseLegal: {
    riesgos: string[];
    observaciones: string[];
  };

  fase11_forenseAdsense: {
    palabras: PalabraAdsenseRiesgo[];
    observaciones: string[];
  };

  fase12_forenseFacebook: {
    motivos: string[];
    riesgos: string[];
    observaciones: string[];
  };

  fase13_forenseDiscover: DiscoverForense;

  fase14_forenseUtilidad: UtilidadForense;

  fase15_forenseDiferenciador: DiferenciadorForense;

  fase16_forensePortada: {
    observacion: string;
  };

  fase17_forenseFacebookProbabilidad: FacebookForense;

  fase18_forenseGoogle: {
    observacion: string;
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
  reporteForenseV1?: ReporteForenseV1;
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

export async function analizarNoticia(noticiaOriginal: NoticiaInput): Promise<ResultadoAnalisis> {
  // Asegurar que el análisis se haga únicamente sobre el contenido de la noticia,
  // nunca sobre textos del panel, mensajes del sistema o elementos de la interfaz.
  const noticia: NoticiaInput = {
    ...noticiaOriginal,
    contenido: limpiarContenidoNoticia(noticiaOriginal.contenido),
  };

  const t = noticia.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // Detectar problemas
  const contenidoLower = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const adjetivosEncontrados = ADJETIVOS_EMOCIONALES.filter(adj => contenidoLower.includes(adj));
  const transicionesEncontradas = TRANSICIONES_IA.filter(tr => contenidoLower.includes(tr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));

  // Anti-atribuciones falsas a instituciones (EEAT Nicaragua)
  const atribucionesFalsas = /\bpolicia\s+nacional\s+de\s+nicaragua\b|\bpnc\b|\bministerio\s+de\s+salud\s+de\s+nicaragua\b|\bmina\b|\bsilais\b.*\bnicaragua\b|\balcald[ií]a\s+de\s+managua\b|\bsupremo\s+poder\b.*\bnicaragua\b/i.test(contenidoLower) &&
    !/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(contenidoLower);

  // ─── EDITOR JEFE V2 PRIMERO para garantizar consistencia con la Constitución Forense ───
  const v2 = evaluarEditorJefeV2(noticia);

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
  const reporteForense = analizarForenseV1(noticia, v2);

  // Sincronizar observaciones contradictorias entre Editor Jefe y Constitución Forense
  const reporteForenseSincronizado = sincronizarForenseConEditorJefe(reporteForense, v2, filtros);

  return {
    aprobado,
    nivel,
    puntuacion: scoreTotal,
    palabrasSensiblesDetectadas,
    cierreGenerico,
    filtros,
    accionesRequeridas: generarAcciones(filtros, palabrasSensiblesDetectadas, cierreGenerico),
    metadataSugerida: generarMetadataSugerida(noticia, filtros),
    reporteVPR: (() => {
      const observacionesForense = [
        ...reporteForenseSincronizado.observaciones,
        ...reporteForenseSincronizado.advertencias,
        ...reporteForenseSincronizado.hallazgos,
      ];
      const ajustes = evaluarPorVertical(noticia, v2);
      v2.fase1_evidencia.utilidad = ajustes.utilidad;
      v2.fase1_evidencia.originalidad = ajustes.originalidad;
      v2.fase5_sugerencias = ajustes.sugerencias;
      v2.fase6_consistencia = ajustes.consistencia;
      const reporte = mapearReporteEditorJefe(noticia, v2, observacionesForense);
      reporte.diferenciadorNI = ajustes.diferenciadorNI;
      reporte.prioridadEditorial = ajustes.prioridadEditorial;
      reporte.valorAgregado = ajustes.valorAgregado;
      return reporte;
    })(),
    reporteForenseV1: reporteForenseSincronizado,
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






// ───────────────────────────────────────────────
// AUTOAUDITORÍA CONSTITUCIÓN V6.0
// ───────────────────────────────────────────────

function analizarForenseV1(n: NoticiaInput, v2: ResultadoEditorJefeV2): ReporteForenseV1 {
  const textoPlano = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const textoLower = textoPlano.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const palabraCount = textoPlano.split(/\s+/).filter(p => p.length > 0).length;
  const parrafos = textoPlano.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
  const oraciones = textoPlano.split(/[.!?]+/).map(o => o.trim()).filter(o => o.length > 10);
  const aportePropio = /\b(Nicaragua\s+Informate|Informate|este\s+medio|nuestro\s+equipo|nuestra\s+redacci[oó]n)\s+(confirm[oó]|consult[oó]|verific[oó]|obtuvo|constat[oó]|descubri[oó]|revis[oó]|investig[oó]|entrevist[oó])\b/i.test(textoPlano);

  const observaciones: string[] = [];
  const advertencias: string[] = [];
  const hallazgos: string[] = [];

  // RFC-012: si el Editor Jefe V2 ya aprobó evidencia, la Constitución Forense no puede contradecirlo.
  const evEditorJefe = v2.fase1_evidencia;
  const editorJefeApruebaEvidencia =
    evEditorJefe.fuenteIdentificada >= 60 ||
    evEditorJefe.documentoOficial >= 60 ||
    evEditorJefe.trabajoDeCampo >= 60 ||
    evEditorJefe.dosFuentes >= 60;
  const editorJefeApruebaDatos = editorJefeApruebaEvidencia || evEditorJefe.datosConcretos >= 60;

  // ─── FASE 0: IDENTIFICACIÓN DEL PACIENTE ───
  const catLower = n.categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tipoNota: string = (() => {
    if (catLower.includes('suces')) return 'Sucesos';
    if (catLower.includes('nacional')) return 'Nacionales';
    if (catLower.includes('internacional')) return 'Internacionales';
    if (catLower.includes('politic')) return 'Política';
    if (catLower.includes('econom')) return 'Economía';
    if (catLower.includes('tecnolog')) return 'Tecnología';
    if (catLower.includes('deporte')) return 'Deportes';
    if (catLower.includes('espectacul')) return 'Espectáculos';
    if (catLower.includes('investig')) return 'Investigación';
    if (catLower.includes('reportaje')) return 'Reportaje';
    if (catLower.includes('entrevista')) return 'Entrevista';
    if (catLower.includes('analisis')) return 'Análisis';
    if (catLower.includes('salud')) return 'Nacionales';
    if (catLower.includes('judicial')) return 'Sucesos';
    if (catLower.includes('cultura')) return 'Nacionales';
    return 'Nacionales';
  })();

  const nivelRiesgo: ReporteForenseV1['fase0_identificacion']['nivelRiesgo'] = (() => {
    if (tipoNota === 'Sucesos') return 'Alto';
    if (tipoNota === 'Investigación' || tipoNota === 'Reportaje') return 'Crítico';
    if (tipoNota === 'Política') return 'Medio';
    return 'Bajo';
  })();
  const observacionFase0 = tipoNota === 'Sucesos'
    ? 'Fase 0: nota tipo Sucesos. Se activa protocolo Sucesos. Nunca se clasifica como Reportaje o Investigación.'
    : `Fase 0: nota tipo ${tipoNota}. Nivel de riesgo ${nivelRiesgo}.`;
  observaciones.push(observacionFase0);

  // ─── FASE 1: TRIAGE EDITORIAL ───
  const evOficial = /\b(?:polic[ií]a nacional|fiscal[íi]a|ministerio p[úu]blico|ministerio de salud|minsa|alcald[ií]a|juzgado|tribunal|comisar[ií]a|bomberos|cruz roja|hospital|medicina legal|asamblea nacional|inss|poder judicial|consejo supremo electoral|ineter|invur|ej[ée]rcito|migob|mific|mitrabajo|mifam|magfor|mineduc|marena|procuradur[íi]a|contralor[íi]a|banco central)\b/i.test(textoLower);
  const existeNoticia = /\b(ocurri[oó]|sucedi[oó]|pas[oó]|registr[oó]|report[oó]|confirm[oó]|inform[oó]|detuvieron|capturaron|falleci[oó]|herido|accidente|incendio|robo|hurto|allanamiento|proceso|juicio|audiencia|fallo|sentencia|decreto|resoluci[óo]n|acuerdo|medida|anuncio|declaraci[óo]n)\b/i.test(textoLower);
  const interesPublico = /\b(poblaci[óo]n|comunidad|ciudadan[íi]a|afecta|impacta|servicio p[úu]blico|salud|seguridad|econom[íi]a|educaci[óo]n|tr[áa]nsito|justicia|derechos|vulneraci[óo]n|denuncia|protesta|marcha)\b/i.test(textoLower);
  const actualidad = /\b(hoy|este|ayer|este lunes|este martes|la mañana|la tarde|la noche|[úu]ltimo|reciente|actualizaci[óo]n|en desarrollo|contin[uú]a|se espera|pr[oó]xim)\b/i.test(textoLower) || palabraCount > 0;
  const evidencia = editorJefeApruebaEvidencia || /\b(dijo|indic[oó]|precis[oó]|señal[oó]|confirm[oó]|declar[oó]|inform[oó]|report[oó]|testimonio|versi[óo]n|documento|fotograf[íi]a|video|peritaje|expediente|acta|oficio|nota|comunicado)\b/i.test(textoLower);
  const fuente = editorJefeApruebaEvidencia || /\b(?:polic[ií]a|fiscal[íi]a|ministerio|alcald[ií]a|juzgado|tribunal|comisar[ií]a|bomberos|hospital|autoridad|vocero|director|jefe|representante|testigo|vecino|habitante|comerciante)\b/i.test(textoLower);
  const datoVerificable = editorJefeApruebaDatos || /\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\bC?\$\s*\d+|\b\d{2,3}\s+(kil[óo]metros?|km|metros?|años?|personas?|heridos?|afectados?|fallecidos?|v[ií]ctimas?)\b|\b\d{1,2}:\d{2}\b/.test(textoPlano);
  const utilidad = /\b(c[óo]mo|qu[eé] hacer|a d[óo]nde|requisito|paso|prevenci[óo]n|evitar|cuidado|proteger|denunciar|consultar|medida|seguimiento|derecho|proceso)\b/i.test(textoLower);
  const contexto = /\b(por qu[eé]|causa|motivo|origen|antecedente|historia|contexto|marco legal|ley|instituci[óo]n|proceso|consecuencia|impacto|resultado)\b/i.test(textoLower);
  const proceso = /\b(proceso|investigaci[óo]n|juicio|audiencia|fallo|resoluci[óo]n|etapa|seguimiento|contin[uú]a|pr[oó]xim|a partir de)\b/i.test(textoLower);

  const triageItems: FaseTriageItem[] = [
    { pregunta: '¿Existe noticia?', respuesta: existeNoticia ? 'Sí' : 'No', observacion: !existeNoticia ? 'No se detecta un relato de hecho claro.' : undefined },
    { pregunta: '¿Existe interés público?', respuesta: interesPublico ? 'Sí' : 'No', observacion: !interesPublico ? 'No se detecta afectación a la comunidad o servicio público.' : undefined },
    { pregunta: '¿Existe actualidad?', respuesta: actualidad ? 'Sí' : 'No', observacion: !actualidad ? 'No se detecta referencia temporal clara.' : undefined },
    { pregunta: '¿Existe evidencia?', respuesta: evidencia ? 'Sí' : 'No', observacion: !evidencia ? 'No se detectan señales de evidencia documental o testimonial.' : undefined },
    { pregunta: '¿Existe fuente?', respuesta: fuente ? 'Sí' : 'No', observacion: !fuente ? 'No se identifica una fuente atribuible.' : undefined },
    { pregunta: '¿Existe dato verificable?', respuesta: datoVerificable ? 'Sí' : 'No', observacion: !datoVerificable ? 'Faltan datos concretos (fechas, cifras, lugares, horas).' : undefined },
    { pregunta: '¿Existe utilidad?', respuesta: utilidad ? 'Sí' : 'No', observacion: !utilidad ? 'No se detecta orientación práctica para el lector.' : undefined },
    { pregunta: '¿Existe contexto?', respuesta: contexto ? 'Sí' : 'No', observacion: !contexto ? 'No se detecta explicación de causas o antecedentes.' : undefined },
    { pregunta: '¿Existe proceso?', respuesta: proceso ? 'Sí' : 'No', observacion: !proceso ? 'No se detecta descripción de seguimiento o consecuencias.' : undefined },
  ];
  const fase1Observaciones = triageItems
    .filter(i => i.respuesta === 'No')
    .map(i => `Fase 1 Triage — ${i.pregunta} ${i.observacion || ''}`.trim());
  const fase1 = { items: triageItems, observaciones: fase1Observaciones };
  if (fase1Observaciones.length > 0) {
    observaciones.push(...fase1Observaciones);
  }

  // ─── FASE 2: AUTOPSIA DOCUMENTAL ───
  const nombres = (textoPlano.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+\b/g) || []).slice(0, 10);
  const fechas = (textoPlano.match(/\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi) || []).slice(0, 10);
  const horas = (textoPlano.match(/\b\d{1,2}:\d{2}\b/g) || []).slice(0, 10);
  const edades = (textoPlano.match(/\b\d{1,3}\s+años\b/gi) || []).slice(0, 10);
  const lugares = (textoPlano.match(/\b(?:Managua|León|Granada|Estelí|Chinandega|Matagalpa|Juigalpa|Carazo|Rivas|Madriz|Nueva Segovia|Boaco|Masaya|Jinotega|Río San Juan|Ciudad Sandino|Tipitapa|Sebaco|barrio|colonia|municipio|departamento|km \d+|carretera)\b/gi) || []).slice(0, 10);
  const instituciones = (textoPlano.match(/\b(?:Policía Nacional|Ministerio Público|Fiscalía|Ministerio de Salud|Minsa|Alcaldía|Policía de Tránsito|Cámara de Comercio|Asamblea Nacional|INSS|Mifamilia|Ministerio de Gobernación|Ministerio de Educación|Mined|Medicina Legal|Bomberos|Cruz Roja|Juzgado|Tribunal|Comisaría|Hospital|Clínica|Delegación policial|Corte Suprema|Poder Judicial|Consejo Supremo Electoral|INETER|INVUR|Ejército de Nicaragua|MIGOB|MIFIC|MITRABAJO|MIFAM|MAGFOR|MINEDUC|Marena|Procuraduría|Contraloría|Banco Central)\b/gi) || []).slice(0, 10);
  const cifras = (textoPlano.match(/\b(?:C\$|US\$|\$)?\s*\d+(?:\.\d{3})*(?:,\d{2})?\b/g) || []).slice(0, 10);
  const fase2 = {
    extracciones: [
      { tipo: 'Nombres propios', valores: [...new Set(nombres)] },
      { tipo: 'Fechas', valores: [...new Set(fechas)] },
      { tipo: 'Horas', valores: [...new Set(horas)] },
      { tipo: 'Edades', valores: [...new Set(edades)] },
      { tipo: 'Lugares', valores: [...new Set(lugares)] },
      { tipo: 'Instituciones', valores: [...new Set(instituciones)] },
      { tipo: 'Cifras', valores: [...new Set(cifras)] },
    ].filter(e => e.valores.length > 0),
  };

  // ─── FASE 3: NECROPSIA DE EVIDENCIA ───
  const contextoLegalRegex = /\b(?:ley|juez|jueces|tribunal|fiscal[íi]a|ministerio\s+p[úu]blico|fiscal|juzgado|sentencia|fallo|resoluci[oó]n|decreto|art[íi]culo|norma|proceso|judicial|legal|imputado|acusado|delito|pena|defensor|magistrado|procuradur[íi]a|abogado)\b/i;
  const condicionalesEspeculativos = /\b(?:se desconoce|no se sabe|podr[íi]a|podria|eventualmente|de confirmarse|de confirmar|supuestamente|presuntamente|al parecer|seg[úu]n versiones no confirmadas)\b/i;
  const etiquetarOracion = (oracion: string): OracionEtiquetada['origen'] => {
    const o = oracion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/\b(?:según|de acuerdo con|informó|precisó|señaló|declaró|confirmó|dijo)\s+(?:policía|fiscalía|ministerio|alcaldía|juzgado|tribunal|bomberos|hospital|autoridad|oficial|vocero)\b/i.test(oracion)) return 'OFICIAL';
    if (/\b(?:según|version de|informa|indica|precisa|redes sociales|medios locales|trascendió|se conoció)\b/i.test(o)) return 'PERIODÍSTICO';
    if (/\b(?:testimonio|testigo|vecino|habitante|comerciante|conductor|pasajero|familiar|afectado|dijo|indicó|señaló)\b/i.test(o)) return 'TESTIGO';
    if (/\b(?:documento|oficio|acta|resolución|decreto|expediente|peritaje|comunicado|nota)\b/i.test(o)) return 'DOCUMENTAL';
    if (/\b(?:redes sociales|publicación|post|tuit|comentario|viral|mensaje en redes)\b/i.test(o)) return 'REDES';
    if (condicionalesEspeculativos.test(o)) {
      // RFC-012: expresiones condicionales en contexto legal son descriptivas, no especulativas.
      if (contextoLegalRegex.test(o)) return evOficial ? 'OFICIAL' : 'PERIODÍSTICO';
      return 'SIN ORIGEN';
    }
    if (/\b(?:verificó|constató|en el lugar|en el sitio|presencialmente|trabajo de campo)\b/i.test(o)) return 'FORENSE';
    if (evOficial) return 'SEMIOFICIAL';
    return 'SIN ORIGEN';
  };
  const oracionesEtiquetadas = oraciones.slice(0, 40).map(o => ({ texto: o, origen: etiquetarOracion(o) }));
  const conteoOrigenes = {
    OFICIAL: 0, SEMIOFICIAL: 0, TESTIGO: 0, REDES: 0, PERIODÍSTICO: 0, DOCUMENTAL: 0, FORENSE: 0, 'SIN ORIGEN': 0,
  };
  oracionesEtiquetadas.forEach(o => { conteoOrigenes[o.origen]++; });
  const fase3 = { oraciones: oracionesEtiquetadas, conteo: conteoOrigenes };

  // ─── FASE 4: CADENA DE CUSTODIA ───
  const checkParrafos = parrafos.slice(0, 20).map(p => {
    const pl = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const quien = /\b(?:según|de acuerdo con|informó|precisó|señaló|declaró|confirmó|dijo)\s+(?:policía|fiscalía|ministerio|alcaldía|juzgado|tribunal|bomberos|hospital|autoridad|oficial|vocero|testigo|vecino|habitante|comerciante|familiar)\b/i.test(p) ? 'Sí' : 'No';
    const como = /\b(?:dijo|indicó|precisó|señaló|declaró|confirmó|testimonio|documento|oficio|acta|resolución|decreto|peritaje|constató|verificó)\b/i.test(p) ? 'Sí' : 'No';
    const donde = /\b(?:en el lugar|en el sitio|en la escena|en el hospital|en la comisaría|en el juzgado|en la alcaldía|frente a|cerca de|barrio|colonia|municipio|departamento)\b/i.test(p) ? 'Sí' : 'No';
    const verificable: CheckParrafo['verificable'] = (quien === 'Sí' && como === 'Sí') ? 'Sí' : (quien === 'Sí' || como === 'Sí') ? 'Parcial' : 'No';
    const tieneFuente: CheckParrafo['tieneFuente'] = quien;
    const marcaRoja = verificable === 'No' && p.length > 60 && !/\b(?:según|de acuerdo con|informó|precisó|señaló|declaró|confirmó|dijo|testimonio|documento|oficio|acta|resolución|decreto|peritaje)\b/i.test(p) && !/\b(?:el hecho|el incidente|la información|la nota|este medio)\b/i.test(pl);
    const motivo = marcaRoja ? 'Párrafo sin atribución ni fuente identificable.' : undefined;
    return { parrafo: p.slice(0, 200), quien, como, donde, verificable, tieneFuente, marcaRoja, motivo };
  });
  const fase4Observaciones = checkParrafos
    .filter(p => p.marcaRoja)
    .map(p => `Fase 4 Cadena de custodia: ${p.motivo || 'Párrafo sin fuente identificable.'}`);
  const fase4 = { parrafos: checkParrafos, observaciones: fase4Observaciones };
  if (fase4Observaciones.length > 0) {
    observaciones.push(...fase4Observaciones);
  }

  // ─── FASE 5: DETECTOR DE CONTAMINACIÓN ───
  const hallazgosContaminacion: HallazgoContaminacion[] = [];
  let match: RegExpExecArray | null;
  CLICKBAIT_PATTERNS.forEach(pat => {
    const m = textoLower.match(pat);
    if (m) hallazgosContaminacion.push({ tipo: 'clickbait', texto: m[0], sugerencia: 'Reformular sin clickbait; crear curiosidad sin engañar.' });
  });
  ADJETIVOS_EMOCIONALES.forEach(adj => {
    const re = new RegExp(`\\b${adj}\\b`, 'gi');
    while ((match = re.exec(textoPlano)) !== null) {
      hallazgosContaminacion.push({ tipo: 'emocion', texto: match[0], sugerencia: 'Sustituir el adjetivo emocional por un dato verificable.' });
    }
  });
  const especulativas = /\b(podr[íi]a|podria|quiz[áa]s|quiza|tal vez|posiblemente|se especula|se rumor|se cree|se supone|se sospecha|parece ser|al parecer|eventualmente|de confirmarse|de confirmar)\b/gi;
  while ((match = especulativas.exec(textoPlano)) !== null) {
    // RFC-012: no marcar como especulación las expresiones condicionales usadas en contexto legal.
    const inicio = Math.max(0, match.index - 80);
    const fin = Math.min(textoPlano.length, match.index + match[0].length + 80);
    const ventana = textoPlano.slice(inicio, fin).toLowerCase();
    if (contextoLegalRegex.test(ventana)) continue;
    hallazgosContaminacion.push({ tipo: 'especulacion', texto: match[0], sugerencia: 'Eliminar especulación; usar atribución clara o eliminar la frase.' });
  }
  const suposiciones = /\b(supuestamente|según se dice|la gente dice|se comenta|dicen que|versiones indican|sin confirmar)\b/gi;
  while ((match = suposiciones.exec(textoPlano)) !== null) {
    hallazgosContaminacion.push({ tipo: 'suposicion', texto: match[0], sugerencia: 'Atribuir la información a una fuente concreta o eliminarla.' });
  }
  const sensacionalismo = /\b(horror|terror|brutal|macabro|sangriento|degollado|masacre|asesinato|muerto)\b/gi;
  while ((match = sensacionalismo.exec(textoPlano)) !== null) {
    hallazgosContaminacion.push({ tipo: 'sensacionalismo', texto: match[0], sugerencia: 'Reducir sensacionalismo; usar términos forenses neutros.' });
  }
  const iaRepetitiva = /\b(en la actualidad|es importante destacar|en resumen|cabe destacar|vale la pena mencionar|en este contexto|como se mencionó anteriormente)\b/gi;
  while ((match = iaRepetitiva.exec(textoPlano)) !== null) {
    hallazgosContaminacion.push({ tipo: 'iaRepetitiva', texto: match[0], sugerencia: 'Eliminar relleno típico de IA.' });
  }
  const relleno = /\b(mucho|muy|realmente|bastante|demasiado|sumamente|extremadamente)\b/gi;
  while ((match = relleno.exec(textoPlano)) !== null) {
    hallazgosContaminacion.push({ tipo: 'relleno', texto: match[0], sugerencia: 'Eliminar adverbios de intensidad sin función informativa.' });
  }
  const opinion = /\b(considero que|pienso que|me parece que|en mi opinión|es evidente que|es claro que|obviamente)\b/gi;
  while ((match = opinion.exec(textoPlano)) !== null) {
    hallazgosContaminacion.push({ tipo: 'opinion', texto: match[0], sugerencia: 'Eliminar opinión del redactor; usar datos o citas.' });
  }
  const moralizacion = /\b(debería|deberian|es inaceptable|es indignante|no puede ser que|hasta cuándo|vergonzoso|lamentable)\b/gi;
  while ((match = moralizacion.exec(textoPlano)) !== null) {
    hallazgosContaminacion.push({ tipo: 'moralizacion', texto: match[0], sugerencia: 'Eliminar juicio moral; reportar hechos verificables.' });
  }
  const fase5Observaciones = hallazgosContaminacion.length > 0
    ? [`Fase 5 Detector de contaminación encontró ${hallazgosContaminacion.length} frase(s) que pueden afectar la neutralidad.`]
    : [];
  const fase5 = { hallazgos: hallazgosContaminacion.slice(0, 20), observaciones: fase5Observaciones };
  if (hallazgosContaminacion.length > 0) {
    advertencias.push(...fase5Observaciones);
    hallazgos.push(...hallazgosContaminacion.slice(0, 10).map(h => `${h.tipo}: ${h.texto}`));
  }

  // ─── FASE 6: CIRUGÍA ESTRUCTURAL ───
  const elementosEstructura: Record<string, ElementoEstructural> = {
    lead: { presente: /^(?:En|La|Un|El|Una|Este|Ayer|Hoy|En la mañana|En la tarde|En horas|Durante|Según|Al menos)/.test(textoPlano) || parrafos[0]?.length > 20, evaluacion: parrafos[0]?.length > 20 ? 'Lead detectado' : 'Lead ausente o muy corto' },
    cronologia: { presente: /\b(?:primero|luego|después|posteriormente|a las|minutos más tarde|horas más tarde|el mismo día|al día siguiente)\b/i.test(textoLower), evaluacion: 'Cronología en construcción' },
    contexto: { presente: /\b(?:por qué|causa|motivo|antecedente|contexto|marco legal|histórico)\b/i.test(textoLower), evaluacion: 'Contexto presente' },
    proceso: { presente: /\b(?:investigación|proceso|juicio|audiencia|fallo|resolución|seguimiento|etapa)\b/i.test(textoLower), evaluacion: 'Proceso detectado' },
    consecuencias: { presente: /\b(?:consecuencia|impacto|resultado|afecta|cambiará|medida|prevención|recomendación)\b/i.test(textoLower), evaluacion: 'Consecuencias presentes' },
    servicio: { presente: /\b(?:cómo denunciar|qué hacer|a dónde acudir|requisito|paso|medida|prevención|evitar|cuidado|proteger|consultar|línea telefónica)\b/i.test(textoLower), evaluacion: 'Servicio al lector detectado' },
    seguimiento: { presente: /\b(?:continúa|seguimiento|próximo|actualización|en desarrollo|se informará|se dará a conocer)\b/i.test(textoLower), evaluacion: 'Seguimiento futuro detectado' },
  };
  const estructuraCompleta = Object.values(elementosEstructura).filter(e => e.presente).length >= 4;
  const fase6Observaciones = estructuraCompleta
    ? []
    : ['Fase 6 Cirugía estructural: faltan elementos; revisar lead, cronología, contexto, proceso, consecuencias, servicio o seguimiento.'];
  const fase6 = { elementos: elementosEstructura, observaciones: fase6Observaciones };
  if (!estructuraCompleta) observaciones.push(...fase6Observaciones);

  // ─── FASE 7: CONTROL DE HEMORRAGIA ───
  const parrafosHemorragia: ParrafoHemorragia[] = [];
  const datosVistos: string[] = [];
  parrafos.forEach(p => {
    const pl = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const palabrasClave = pl.split(/\s+/).filter(w => w.length > 4);
    const aportaDatoNuevo = palabrasClave.some(w => !datosVistos.includes(w));
    if (aportaDatoNuevo) {
      palabrasClave.forEach(w => { if (!datosVistos.includes(w)) datosVistos.push(w); });
    }
    let accion: ParrafoHemorragia['accion'] = 'mantener';
    let motivo = 'Aporta información nueva.';
    if (!aportaDatoNuevo && p.length > 80) {
      accion = 'eliminar';
      motivo = 'Repite información ya presentada o no aporta dato nuevo.';
    } else if (!aportaDatoNuevo && p.length <= 80) {
      accion = 'condensar';
      motivo = 'Párrafo corto sin dato nuevo; se puede condensar con otro.';
    }
    parrafosHemorragia.push({ parrafo: p.slice(0, 200), aportaDatoNuevo, accion, motivo });
  });
  const eliminarCount = parrafosHemorragia.filter(p => p.accion === 'eliminar').length;
  const fase7Observaciones = eliminarCount > 0
    ? [`Fase 7 Control de hemorragia: ${eliminarCount} párrafo(s) sin aporte nuevo.`]
    : [];
  const fase7 = { parrafos: parrafosHemorragia.slice(0, 20), observaciones: fase7Observaciones };
  if (eliminarCount > 0) observaciones.push(...fase7Observaciones);

  // ─── FASE 8: TOMOGRAFÍA SEO ───
  const tituloLen = n.titulo.length;
  const metaLen = n.resumen?.length || 0;
  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.slug);
  const checksSEO: CheckSEO[] = [
    { elemento: 'Título 50-70 caracteres', estado: tituloLen >= 50 && tituloLen <= 70 ? 'PASS' : 'WARN', valorActual: String(tituloLen), valorEsperado: '50-70', recomendacion: 'Ajustar longitud del título.' },
    { elemento: 'Meta description 120-180 caracteres', estado: metaLen >= 120 && metaLen <= 180 ? 'PASS' : 'WARN', valorActual: String(metaLen), valorEsperado: '120-180', recomendacion: 'Ajustar meta descripción.' },
    { elemento: 'Slug canónico', estado: slugOk ? 'PASS' : 'WARN', valorActual: n.slug, recomendacion: 'Usar slug en minúsculas con guiones.' },
    { elemento: 'Imagen destacada', estado: n.imagenDestacada || n.imagen ? 'PASS' : 'FAIL', recomendacion: 'Incluir imagen destacada.' },
    { elemento: 'Palabras clave', estado: (n.palabrasClave && n.palabrasClave.length > 0) || n.keywords ? 'PASS' : 'WARN', recomendacion: 'Definir palabras clave principales.' },
  ];
  const fase8 = { checks: checksSEO };
  if (checksSEO.some(c => c.estado === 'FAIL')) {
    advertencias.push('Fase 8 SEO: hay elementos FAIL que deberían corregirse.');
  }

  // ─── FASE 9: RESONANCIA EEAT ───
  const checksEEAT: CheckEEAT[] = [
    { criterio: 'Autor identificado', presente: !!(n.autor && n.autor.length > 1), evidencia: n.autor },
    { criterio: 'Fuente identificada', presente: evOficial || fuente, evidencia: 'Detectada en texto' },
    { criterio: 'Documento o dato oficial', presente: /\b(?:documento|oficio|acta|resolución|decreto|peritaje|expediente|comunicado)\b/i.test(textoLower) },
    { criterio: 'Institución mencionada', presente: /\b(?:policía|fiscalía|ministerio|alcaldía|juzgado|tribunal|hospital|bomberos)\b/i.test(textoLower) },
    { criterio: 'Proceso descrito', presente: /\b(?:proceso|investigación|juicio|audiencia|fallo|resolución|etapa)\b/i.test(textoLower) },
    { criterio: 'Contexto aportado', presente: /\b(?:por qué|causa|motivo|antecedente|contexto|marco legal)\b/i.test(textoLower) },
    { criterio: 'Verificación visible', presente: /\b(?:verificó|constató|en el lugar|en el sitio|trabajo de campo|presencialmente)\b/i.test(textoLower) },
    { criterio: 'Valor agregado / comparación', presente: /\b(?:comparación|en contraste|a diferencia|anteriormente|en otras ocasiones|históricamente)\b/i.test(textoLower) },
    { criterio: 'Utilidad práctica', presente: /\b(?:cómo|qué hacer|a dónde|requisito|paso|prevención|evitar|cuidado)\b/i.test(textoLower) },
  ];
  const eeatPresentes = checksEEAT.filter(c => c.presente).length;
  const fase9 = { checks: checksEEAT };
  if (eeatPresentes < 5) {
    observaciones.push(`Fase 9 EEAT: ${eeatPresentes} de 9 criterios presentes.`);
  }

  // ─── FASE 10: FORENSE LEGAL ───
  const riesgosLegal: string[] = [];
  if (/\b(culpable|inocente|condenado|sentenciado)\b/i.test(textoLower) && !/\b(?:según|de acuerdo con|fallo|sentencia|juez|tribunal)\b/i.test(textoLower)) {
    riesgosLegal.push('Presunción de inocencia (Alta): usar "presunto", "investigado" o atribuir a fallo judicial.');
  }
  if (/\b(?:menor|adolescente|niño|niña|menor de edad)\b/i.test(textoLower) && /\b(?:víctima|agresión|violación|abuso|secuestro|desaparecid)\b/i.test(textoLower)) {
    riesgosLegal.push('Protección de menores (Alta): evitar identificar a menores víctimas.');
  }
  if (/\b(?:nombre completo|identidad|dni|cédula|fotografía|imagen de|video de)\b/i.test(textoLower) && /\b(?:víctima|imputado|acusado|detenido|preso)\b/i.test(textoLower)) {
    riesgosLegal.push('Identificación indebida (Media): omitir datos personales de víctimas o imputados.');
  }
  const fase10 = { riesgos: riesgosLegal, observaciones: riesgosLegal.length > 0 ? ['Riesgos legales detectados; consultar al editor responsable.'] : [] };
  if (riesgosLegal.length > 0) advertencias.push(...riesgosLegal);

  // ─── FASE 11: FORENSE ADSENSE ───
  const palabrasAdsenseRiesgo: PalabraAdsenseRiesgo[] = [];
  const palabrasAdsense = ['muerto', 'asesinato', 'asesinado', 'horror', 'macabro', 'terror', 'brutal', 'masacre', 'sangre', 'cadáver', 'degollado', 'violencia gráfica', 'tortura', 'violación', 'ahorcado', 'linchamiento', 'ejecución', 'decapitado'];
  palabrasAdsense.forEach(pal => {
    const re = new RegExp(`\\b${pal}\\b`, 'gi');
    let m;
    while ((m = re.exec(textoPlano)) !== null) {
      const inicio = Math.max(0, m.index - 30);
      const fin = Math.min(textoPlano.length, m.index + pal.length + 30);
      palabrasAdsenseRiesgo.push({ palabra: pal, contexto: textoPlano.slice(inicio, fin), sugerencia: 'Sustituir por términos neutros o eliminar si no aporta valor periodístico.' });
    }
  });
  const fase11Observaciones = palabrasAdsenseRiesgo.length > 0
    ? [`Fase 11 Forense AdSense: ${palabrasAdsenseRiesgo.length} palabra(s) de riesgo para monetización.`]
    : [];
  const fase11 = { palabras: palabrasAdsenseRiesgo.slice(0, 20), observaciones: fase11Observaciones };
  if (palabrasAdsenseRiesgo.length > 0) advertencias.push(...fase11Observaciones);

  // ─── FASE 12: FORENSE FACEBOOK ───
  const motivosFacebook: string[] = [];
  const riesgosFacebook: string[] = [];
  if (CLICKBAIT_PATTERNS.some(p => p.test(textoLower))) {
    riesgosFacebook.push('Título o texto con clickbait detectado.');
  }
  if (/\b(?:muerto|asesinato|tragedia|horror|brutal|masacre)\b/i.test(textoLower)) {
    riesgosFacebook.push('Contenido de tragedia: la gente no comparte por utilidad sino por morbo; riesgo de demonetización.');
  }
  if (/\b(?:cómo denunciar|qué hacer|a dónde acudir|requisito|paso|medida|prevención|evitar|cuidado)\b/i.test(textoLower)) {
    motivosFacebook.push('Servicio práctico al lector.');
  }
  if (/\b(?:Managua|León|Granada|Estelí|Chinandega|Matagalpa|Juigalpa|Carazo|Rivas|Madriz|Nueva Segovia|Boaco|Masaya|Jinotega|Río San Juan)\b/i.test(textoPlano)) {
    motivosFacebook.push('Cercanía geográfica / identidad local.');
  }
  if (/\b(?:nicoaragüense|país|comunidad|vecino|barrio|municipio|departamento|somos)\b/i.test(textoLower)) {
    motivosFacebook.push('Identidad local.');
  }
  if (/\b(?:documento|oficio|acta|peritaje|expediente|constató|verificó|trabajo de campo)\b/i.test(textoLower)) {
    motivosFacebook.push('Información verificada / dato inesperado.');
  }
  const fase12Observaciones = riesgosFacebook.length > 0
    ? ['Fase 12 Forense Facebook: existen riesgos de clickbait o tragedia morbosa.']
    : [];
  const fase12 = { motivos: motivosFacebook, riesgos: riesgosFacebook, observaciones: fase12Observaciones };
  if (riesgosFacebook.length > 0) advertencias.push(...fase12Observaciones);

  // ─── FASE 13: FORENSE DISCOVER ───
  const discoverChecks = [
    aportePropio || /\b(?:documento|oficio|acta|peritaje|expediente|constató|verificó|trabajo de campo)\b/i.test(textoLower),
    /\b(?:por qué|causa|motivo|contexto|marco legal|institución|proceso)\b/i.test(textoLower),
    /\b(?:cómo|qué hacer|a dónde|requisito|paso|medida|prevención|evitar|cuidado)\b/i.test(textoLower),
    /\b(?:Managua|León|Granada|Estelí|Chinandega|Matagalpa|Juigalpa|Carazo|Rivas|Madriz|Nueva Segovia|Boaco|Masaya|Jinotega|Río San Juan|Ciudad Sandino|Tipitapa|Sebaco)\b/i.test(textoPlano),
    /\b(?:Policía Nacional|Ministerio Público|Fiscalía|Ministerio de Salud|Minsa|Alcaldía|Asamblea Nacional|INSS|Bomberos|Cruz Roja|Juzgado|Tribunal|Hospital)\b/i.test(textoPlano),
  ].filter(Boolean).length;
  const discoverProb: DiscoverForense['probabilidad'] = discoverChecks >= 4 ? 'ALTA' : discoverChecks >= 2 ? 'MEDIA' : discoverChecks === 1 ? 'BAJA' : 'NULA';
  const discoverJust = discoverProb === 'ALTA'
    ? 'Google mostraría esta nota porque aporta aporte propio, contexto, servicio, cercanía y fuente identificable.'
    : discoverProb === 'MEDIA'
      ? 'Tiene algunos atributos, pero le falta aporte propio, utilidad o contexto para destacar en Discover.'
      : discoverProb === 'BAJA'
        ? 'Poca justificación para Discover: falta originalidad, contexto o servicio.'
        : 'No se detecta razón clara para que Google muestre esta nota.';
  const fase13: DiscoverForense = { probabilidad: discoverProb, justificacion: discoverJust, faltantes: discoverProb === 'ALTA' ? [] : ['aporte propio', 'contexto institucional', 'servicio al lector', 'cercanía local', 'fuente oficial'].slice(0, 4 - discoverChecks) };

  // ─── FASE 14: FORENSE UTILIDAD ───
  const utilidadItems: { pregunta: string; respuesta: 'Sí' | 'No' }[] = [
    { pregunta: '¿Qué aprende el lector?', respuesta: /\b(?:dato|información|hecho|cifra|fecha|lugar|nombre|decisión|ley)\b/i.test(textoLower) ? 'Sí' : 'No' },
    { pregunta: '¿Qué decisión puede tomar?', respuesta: /\b(?:cómo denunciar|qué hacer|a dónde acudir|requisito|paso|medida|prevención|evitar|cuidado|proteger|denunciar|consultar)\b/i.test(textoLower) ? 'Sí' : 'No' },
    { pregunta: '¿Qué comprende mejor?', respuesta: /\b(?:por qué|causa|motivo|contexto|proceso|institución|ley)\b/i.test(textoLower) ? 'Sí' : 'No' },
    { pregunta: '¿Qué derecho conoce?', respuesta: /\b(?:derecho|garantía|presunción|inocencia|protección|denuncia|ley)\b/i.test(textoLower) ? 'Sí' : 'No' },
    { pregunta: '¿Qué proceso entiende?', respuesta: /\b(?:proceso|investigación|juicio|audiencia|fallo|resolución|etapa|seguimiento)\b/i.test(textoLower) ? 'Sí' : 'No' },
    { pregunta: '¿Qué institución descubre?', respuesta: /\b(?:Policía|Fiscalía|Ministerio|Alcaldía|Juzgado|Tribunal|Hospital|Bomberos|INSS|Minsa)\b/i.test(textoPlano) ? 'Sí' : 'No' },
  ];
  const utilidadAprobado = utilidadItems.filter(i => i.respuesta === 'Sí').length >= 2;
  const utilidadGanancias = utilidadItems.filter(i => i.respuesta === 'Sí').map(i => i.pregunta.replace('¿', '').replace('?', ''));
  const fase14 = { items: utilidadItems, ganancias: utilidadGanancias };
  if (!utilidadAprobado) {
    observaciones.push('Fase 14 Forense utilidad: la nota responde menos de dos preguntas de utilidad real.');
  }

  // ─── FASE 15: FORENSE DIFERENCIADOR ───
  const diferenciadorEvidencia: string[] = [];
  if (/\b(?:verificó|constató|en el lugar|en el sitio|presencialmente|trabajo de campo)\b/i.test(textoLower)) diferenciadorEvidencia.push('trabajo de campo verificable');
  if (/\b(?:documento|oficio|acta|peritaje|expediente|resolución|decreto)\b/i.test(textoLower)) diferenciadorEvidencia.push('documento o evidencia oficial');
  if (/\b(?:dijo|indicó|precisó|señaló|declaró|confirmó)\s+(?:el|la)\s+(?:testigo|vecino|habitante|comerciante|familiar|afectado)\b/i.test(textoLower)) diferenciadorEvidencia.push('voz directa de afectado o testigo');
  if (/\b(?:por qué|causa|motivo|contexto|marco legal|institución|proceso|consecuencia)\b/i.test(textoLower)) diferenciadorEvidencia.push('contexto o explicación');
  // RFC-012: reconocer reorganización editorial, cronología, explicación legal y valor de servicio como aporte propio
  if (/\b(?:primero|luego|después|posteriormente|a las|minutos más tarde|horas más tarde|el mismo día|al día siguiente|cronología|secuencia|inicialmente|finalmente)\b/i.test(textoLower)) diferenciadorEvidencia.push('cronología o secuencia explicativa');
  if (/\b(?:en resumen|en otras palabras|esto significa que|esto implica|para entenderlo|lo importante es|aquí te explicamos|así funciona|de forma sencilla|qué debes saber|preguntas frecuentes|lo que cambia|resumido|te explicamos|te contamos)\b/i.test(textoLower)) diferenciadorEvidencia.push('reorganización editorial para el lector');
  if (/\b(?:marco legal|ley|normativa|artículo|decreto|resolución|sentencia|fallo|juzgado|tribunal|fiscalía|ministerio público)\b/i.test(textoLower) && /\b(?:explica|significa|implica|afecta|cómo|por qué)\b/i.test(textoLower)) diferenciadorEvidencia.push('explicación legal');
  if (/\b(?:cómo|qué hacer|a dónde acudir|requisito|paso|medida|prevención|evitar|cuidado|proteger|denunciar|consultar|línea telefónica)\b/i.test(textoLower)) diferenciadorEvidencia.push('valor de servicio para el lector');
  const fase15Observacion = diferenciadorEvidencia.length > 0
    ? `Diferenciadores detectados: ${diferenciadorEvidencia.join(', ')}.`
    : 'No se detecta una razón objetiva para preferir esta versión sobre otros medios.';
  const fase15 = { evidencia: diferenciadorEvidencia, observacion: fase15Observacion };
  if (diferenciadorEvidencia.length === 0) {
    observaciones.push(fase15Observacion);
  }

  // ─── FASE 16: FORENSE DE PORTADA ───
  const fase16 = { observacion: 'La clasificación de portada es competencia exclusiva del Editor Jefe V2; la Constitución Forense solo registra señales de relevancia.' };

  // ─── FASE 17: FORENSE FACEBOOK PROBABILIDAD ───
  const fbProbTotal = motivosFacebook.length;
  const fbProb: FacebookForense['probabilidad'] = fbProbTotal >= 3 ? 'ALTA' : fbProbTotal >= 2 ? 'MEDIA' : fbProbTotal === 1 ? 'BAJA' : 'NULA';
  const fase17: FacebookForense = { probabilidad: fbProb, motivos: motivosFacebook, riesgos: riesgosFacebook };

  // ─── FASE 18: FORENSE GOOGLE ───
  const fase18 = { observacion: (diferenciadorEvidencia.length > 0 && eeatPresentes >= 5) ? 'Tiene diferenciador objetivo y al menos 5 señales EEAT para competir en Google.' : 'Falta diferenciador o señales EEAT suficientes para competir en Google.' };

  const reporte: ReporteForenseV1 = {
    version: '1.0',
    rol: 'auditoria',
    observaciones,
    advertencias,
    hallazgos,
    fase0_identificacion: { tipoNota, nivelRiesgo, observacion: observacionFase0 },
    fase1_triage: fase1,
    fase2_autopsiaDocumental: fase2,
    fase3_necropsiaEvidencia: fase3,
    fase4_cadenaCustodia: fase4,
    fase5_detectorContaminacion: fase5,
    fase6_cirugiaEstructural: fase6,
    fase7_controlHemorragia: fase7,
    fase8_tomografiaSEO: fase8,
    fase9_resonanciaEEAT: fase9,
    fase10_forenseLegal: fase10,
    fase11_forenseAdsense: fase11,
    fase12_forenseFacebook: fase12,
    fase13_forenseDiscover: fase13,
    fase14_forenseUtilidad: fase14,
    fase15_forenseDiferenciador: fase15,
    fase16_forensePortada: fase16,
    fase17_forenseFacebookProbabilidad: fase17,
    fase18_forenseGoogle: fase18,
  };
  return reporte;
}

function sincronizarForenseConEditorJefe(
  forense: ReporteForenseV1,
  v2: ResultadoEditorJefeV2,
  filtros: ResultadoAnalisis['filtros']
): ReporteForenseV1 {
  const ev = v2.fase1_evidencia;
  const editorJefeApruebaEvidencia =
    ev.fuenteIdentificada >= 60 ||
    ev.documentoOficial >= 60 ||
    ev.trabajoDeCampo >= 60 ||
    ev.dosFuentes >= 60;
  const editorJefeApruebaDatos = editorJefeApruebaEvidencia || ev.datosConcretos >= 60;

  // RFC-012: si Editor Jefe ya aprobó evidencia/datos, la Constitución Forense no puede decir lo contrario.
  const fase1 = forense.fase1_triage;
  const aprobarItem = (pregunta: string) => {
    const item = fase1.items.find(i => i.pregunta === pregunta);
    if (item) {
      item.respuesta = 'Sí';
      item.observacion = undefined;
    }
  };

  if (editorJefeApruebaEvidencia) {
    aprobarItem('¿Existe evidencia?');
    aprobarItem('¿Existe fuente?');
  }
  if (editorJefeApruebaDatos) {
    aprobarItem('¿Existe dato verificable?');
  }
  if (ev.trabajoDeCampo >= 60) {
    aprobarItem('¿Existe proceso?');
  }

  // Filtrar observaciones contradictorias
  forense.observaciones = forense.observaciones.filter(o => {
    if (editorJefeApruebaEvidencia && /Fase 1 Triage — (?:¿Existe evidencia\?|¿Existe fuente\?)/.test(o)) return false;
    if (editorJefeApruebaDatos && /Fase 1 Triage — ¿Existe dato verificable\?/.test(o)) return false;
    if (ev.trabajoDeCampo >= 60 && /Fase 4 Cadena de custodia|Párrafo sin atribución ni fuente identificable/.test(o)) return false;
    if (filtros?.eeat?.aprobado && o.startsWith('Fase 9 EEAT:')) return false;
    return true;
  });

  // Si Editor Jefe aprobó evidencia, no puede decirse que no hay razón objetiva para preferir la nota.
  if (editorJefeApruebaEvidencia && forense.fase15_forenseDiferenciador.observacion.includes('No se detecta una razón objetiva')) {
    forense.fase15_forenseDiferenciador.observacion =
      'El Editor Jefe detectó evidencia verificable (fuente, documento, testimonio o campo) que fundamenta el aporte propio.';
    if (forense.fase15_forenseDiferenciador.evidencia.length === 0) {
      forense.fase15_forenseDiferenciador.evidencia.push('evidencia verificable reconocida por el Editor Jefe');
    }
  }

  return forense;
}

// ───────────────────────────────────────────────
// EDITOR JEFE IA — FUNCIONES AUXILIARES
// ───────────────────────────────────────────────




// ───────────────────────────────────────────────
// NIVEL 8 — IMPACTO EN EL LECTOR
// ───────────────────────────────────────────────

// ───────────────────────────────────────────────
// NIVEL 10 — OPORTUNIDADES PERIODÍSTICAS
// ───────────────────────────────────────────────

// generarOportunidadesPeriodisticas ha sido reemplazado por generarSugerenciasV7 en Constitución V7.0.

// ───────────────────────────────────────────────
// DETECTOR FACEBOOK
// ───────────────────────────────────────────────

// ───────────────────────────────────────────────
// DETECTOR GOOGLE
// ───────────────────────────────────────────────

// ───────────────────────────────────────────────
// DETECTOR EEAT REAL
// ───────────────────────────────────────────────

// ───────────────────────────────────────────────
// NUEVOS CAMPOS CONSTITUCIÓN EDITORIAL V7.0
// ───────────────────────────────────────────────

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
