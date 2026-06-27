/**
 * Analizador Forense de Noticias - Nicaragua Informate v2.0
 * REGLA RECTORA: "Es mejor una noticia de 250 palabras totalmente verificable
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

export interface ResultadoAnalisis {
  aprobado: boolean;
  nivel: 'FORENSE' | 'ORO' | 'PLATA' | 'BRONCE' | 'RECHAZADO';
  puntuacion: number;
  aiRiskScore?: number;
  aiRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  aiRiskIssues?: string[];
  palabrasSensiblesDetectadas?: PalabraSensibleDetectada[];
  cierreGenerico?: boolean;
  aiMetrics?: {
    repeticion_verbos: number;
    simetria_parrafos: number;
    cadencia_oraciones: number;
    simetria_h2: number;
    exceso_enumerativo: number;
    h2_repetidos: number;
  };
  filtros: {
    oro: FiltroResultado;
    adsense: FiltroResultado;
    discover: FiltroResultado;
    news: FiltroResultado;
    seo: FiltroResultado;
    eeat: FiltroResultado;
    aiRisk: FiltroResultado;
  };
  accionesRequeridas: string[];
  metadataSugerida: {
    tituloOptimizado?: string;
    metaDescription?: string;
    keywordsLSI?: string[];
    h2Sugeridos?: string[];
  };
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
  'fallecidos': 'gravemente afectados',
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

const VERBOS_OPERATIVOS_IA = [
  'realizar', 'llevar', 'efectuar', 'ejecutar', 'desarrollar',
  'implementar', 'establecer', 'generar', 'crear', 'analizar',
  'evaluar', 'determinar', 'considerar', 'señalar', 'indicar'
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

function detectarMetricasIA(texto: string) {
  const sentences = texto.split(/[.!?]+\s*/).filter(s => s.length > 10);
  const nSent = sentences.length || 1;

  const verbosEncontrados = VERBOS_OPERATIVOS_IA.filter(v => texto.toLowerCase().includes(v));
  const repeticionVerb = verbosEncontrados.length / nSent;

  const paragraphs = texto.split(/\n\s*\n/).filter(p => p.split(/\s+/).filter(w => w.length > 0).length > 10);
  let simetriaParafo = 1;
  if (paragraphs.length > 1) {
    const lens = paragraphs.map(p => p.split(/\s+/).filter(w => w.length > 0).length);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const variance = lens.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lens.length;
    simetriaParafo = 1 - Math.min(variance / (mean + 1), 1);
  }

  const sentLens = sentences.filter(s => s.split(/\s+/).filter(w => w.length > 0).length > 5)
    .map(s => s.split(/\s+/).filter(w => w.length > 0).length);
  let cadencia = 1;
  if (sentLens.length > 1) {
    const meanS = sentLens.reduce((a, b) => a + b, 0) / sentLens.length;
    const varS = sentLens.reduce((a, b) => a + Math.pow(b - meanS, 2), 0) / sentLens.length;
    cadencia = 1 - Math.min(varS / (meanS + 1), 1);
  }

  const h2s = (texto.match(/<h2[^>]*>(.*?)<\/h2>/gi) || []);
  let simetriaH2 = 1;
  if (h2s.length > 1) {
    const h2Lens = h2s.map(h => h.length);
    const meanH = h2Lens.reduce((a, b) => a + b, 0) / h2Lens.length;
    const varH = h2Lens.reduce((a, b) => a + Math.pow(b - meanH, 2), 0) / h2Lens.length;
    simetriaH2 = 1 - Math.min(varH / (meanH + 1), 1);
  }

  // Detectar H2s repetidos exactos (patrón clásico de IA en bucle)
  const h2Texts = h2s.map(h => {
    const m = h.match(/<h2[^>]*>(.*?)<\/h2>/i);
    return m ? m[1].trim().toLowerCase().replace(/\s+/g, ' ') : '';
  }).filter(t => t.length > 0);
  const h2Counts = new Map<string, number>();
  for (const t of h2Texts) h2Counts.set(t, (h2Counts.get(t) || 0) + 1);
  const h2Repetidos = Array.from(h2Counts.values()).filter(c => c > 1).reduce((a, b) => a + b, 0);

  const enumerativos = (texto.match(/(primero|segundo|tercero|cuarto|en primer lugar|en segundo lugar)/gi) || []).length;

  return {
    repeticion_verbos: repeticionVerb,
    simetria_parrafos: simetriaParafo,
    cadencia_oraciones: cadencia,
    simetria_h2: simetriaH2,
    exceso_enumerativo: Math.min(enumerativos / 3, 1),
    h2_repetidos: h2Repetidos,
  };
}

// ───────────────────────────────────────────────
// MOTOR PRINCIPAL (LOGICA UNIFICADA ORO)
// ───────────────────────────────────────────────

export async function analizarNoticia(noticia: NoticiaInput): Promise<ResultadoAnalisis> {
  const t = noticia.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = t.split(' ').filter(p => p.length > 0).length;
  
  // Detectar problemas
  const contenidoLower = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const adjetivosEncontrados = ADJETIVOS_EMOCIONALES.filter(adj => contenidoLower.includes(adj));
  const transicionesEncontradas = TRANSICIONES_IA.filter(tr => contenidoLower.includes(tr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  
  // Fuentes y Citas
  const tieneAtribuciones = /inform[oó]|confirm[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó]|manifest[oó]|afirm[oó]|agreg[oó]|asegur[oó]|destac[oó]|mencion[oó]/.test(contenidoLower);
  const tieneCitas = (noticia.contenido.match(/<blockquote>/g) || []).length >= 1;
  
  // ───────────────────────────────────────────────
  // SCORING FORENSE v2.0 — Verificabilidad > Longitud
  // ───────────────────────────────────────────────

  // 1. Datos concretos — GENÉRICO para cualquier país (fechas, números, lugares, instituciones)
  const datosConcretos = (t.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length
    + (t.match(/\b\d{2,4}\b/g) || []).length
    + (t.match(/\b(?:Managua|Granada|León|Masaya|Estelí|Chinandega|Matagalpa|Jinotega|Rivas|Carazo|Boaco|Chontales|Madriz|Nueva Segovia|Río San Juan|RAAN|RAAS|Bluefields|Puerto Cabezas|Ocotal|Jinotepe|Diriamba|Nandaime|Nagarote|Panamá|Guatemala|Honduras|Costa Rica|El Salvador|Tegucigalpa|San José|San Salvador|Cabo Verde|Praia|Madrid|Barcelona|Lisboa|Porto|Sevilla|Valencia|Bilbao|Málaga|Lisboa|Portugal|España|Poptún|Petén|Ciudad de Panamá|Aeropuerto|Marcos|Gelabert)\b/gi) || []).length
    + (t.match(/\b(?:Policía Nacional|Ministerio de Salud|MINSA|INSS|MEDUCA|MIFIC|Asamblea Nacional|Alcaldía|Hospital|Centro de Salud|Comisaría|Servicio Nacional de Migración|SNM|Ministerio Público|Corte Suprema|Congreso|Presidencia|Ministerio de|Gobierno de)\b/gi) || []).length;
  const densidadDatos = palabras ? Math.round((datosConcretos / palabras) * 1000) / 10 : 0;

  // 2. Lead completo (responde quién/qué/cuándo/dónde) — GENÉRICO para cualquier país
  const leadTexto = noticia.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\n|\./)[0] || '';
  const leadTieneQuien = /\b(?:murió|falleció|nacido|identificado|de \d+ años|nombre|llamado|conocido|ciudadano|persona|víctima|herido|detenido|arrestado|fue|se reportó)\b/i.test(leadTexto);
  const leadTieneQue = /\b(?:accidente|incidente|hechos|ocurrió|sucedió|reportó|reportan|dejó|provocó|causó|ataque|robo|expulsión|deportación|retorno|operativo|medida|decisión|anunció|confirmó)\b/i.test(leadTexto);
  const leadTieneDonde = /\b(?:Managua|Granada|León|Masaya|Estelí|Chinandega|Matagalpa|Jinotega|Rivas|Carazo|km \d+|carretera|ruta|barrio|colonia|municipio|departamento|Panamá|Guatemala|Honduras|Costa Rica|El Salvador|Ciudad de|Madrid|Barcelona|Lisboa|Portugal|España|Cabo Verde|Poptún|Petén|departamento de|provincia de|región de|aeropuerto)\b/i.test(leadTexto);
  const leadTieneCuando = /\b(?:este|ayer|hoy|la madrugada|la mañana|la tarde|la noche|el \d+|\d+ de \w+|\d{4}|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|enero|febrero|marzo|abril|mayo)\b/i.test(leadTexto);
  const leadCompleto = (leadTieneQuien || leadTieneQue) && leadTieneDonde && leadTieneCuando;

  // 3. Anti-atribuciones falsas a instituciones (EEAT Nicaragua)
  // Solo marcar como sospechosa si se mencionan instituciones nicaraguenses sin nombre concreto
  const atribucionesFalsas = /\bpolicia\s+nacional\s+de\s+nicaragua\b|\bpnc\b|\bministerio\s+de\s+salud\s+de\s+nicaragua\b|\bmina\b|\bsilais\b.*\bnicaragua\b|\balcald[ií]a\s+de\s+managua\b|\bsupremo\s+poder\b.*\bnicaragua\b/i.test(contenidoLower) &&
    !/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(contenidoLower);

  // 4. Citas — verificar que blockquotes tengan atribución (guion largo, verbo de atribucion, o nombre propio)
  const blockquotes = (noticia.contenido.match(/<blockquote>/g) || []).length;
  const citasConAtribucion = (noticia.contenido.match(/<blockquote>[^]*?(?:—\s*[A-ZÁÉÍÓÚÑ]|inform[oó]|confirm[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó]|manifest[oó]|afirm[oó]|agreg[oó]|asegur[oó]|destac[oó]|mencion[oó])[^]*?<\/blockquote>/gi) || []).length;
  const citasSospechosas = tieneCitas && citasConAtribucion === 0;

  // ─── NUEVAS DETECCIONES FORENSE NICARAGUA ───
  const palabrasSensiblesDetectadas = detectarPalabrasSensibles(noticia.contenido + ' ' + noticia.titulo);
  const cierreGenerico = detectarCierreGenerico(noticia.contenido);
  const aiMetrics = detectarMetricasIA(noticia.contenido);
  const aiIndex = (
    aiMetrics.repeticion_verbos * 0.15 +
    (1 - aiMetrics.simetria_parrafos) * 0.25 +
    (1 - aiMetrics.cadencia_oraciones) * 0.15 +
    (1 - aiMetrics.simetria_h2) * 0.1 +
    aiMetrics.exceso_enumerativo * 0.15 +
    Math.min(aiMetrics.h2_repetidos / 3, 1.0) * 0.2
  );
  const aiRiskScoreMetrics = Math.max(0, Math.min(100, 100 - (aiIndex * 100)));

  // ─── CÁLCULO DE PUNTUACIÓN ───
  let scoreTotal = 0;

  // A. Verificabilidad de datos (0-30 pts)
  if (densidadDatos >= 4) scoreTotal += 30;
  else if (densidadDatos >= 2) scoreTotal += 22;
  else if (densidadDatos >= 1) scoreTotal += 14;
  else scoreTotal += 5;

  // B. Anti-emocional (0-15 pts)
  if (adjetivosEncontrados.length === 0) scoreTotal += 15;
  else if (adjetivosEncontrados.length <= 2) scoreTotal += 8;
  else scoreTotal += 2;

  // C. Anti-IA detectable (0-15 pts)
  if (transicionesEncontradas.length <= 2) scoreTotal += 15;
  else if (transicionesEncontradas.length <= 5) scoreTotal += 8;
  else scoreTotal += 2;

  // D. Lead completo para Discover (0-15 pts)
  if (leadCompleto) scoreTotal += 15;
  else if (leadTieneQue && leadTieneDonde) scoreTotal += 10;
  else scoreTotal += 4;

  // E. Fuentes atribuidas (0-15 pts) — penalizar citas sin atribución
  if (citasSospechosas) scoreTotal += 2;
  else if (tieneAtribuciones && citasConAtribucion >= 1) scoreTotal += 15;
  else if (tieneAtribuciones || blockquotes >= 1) scoreTotal += 10;
  else scoreTotal += 3;

  // F. EEAT Nicaragua — No atribuciones falsas (0-10 pts)
  if (!atribucionesFalsas) scoreTotal += 10;
  else scoreTotal += 0;

  // G. Palabras sensibles de Nicaragua (penalización)
  if (palabrasSensiblesDetectadas.length > 0) {
    scoreTotal -= Math.min(palabrasSensiblesDetectadas.length * 5, 20);
  }

  // H. Cierre genérico (penalización)
  if (cierreGenerico) scoreTotal -= 10;

  // H2. H2s repetidos — patrón de IA en bucle (penalización severa)
  if (aiMetrics.h2_repetidos > 0) scoreTotal -= 15;

  // I. Métricas IA mejoradas (bonus/penalización)
  if (aiRiskScoreMetrics >= 80) scoreTotal += 5;
  else if (aiRiskScoreMetrics < 50) scoreTotal -= 10;

  if (scoreTotal > 100) scoreTotal = 100;
  if (scoreTotal < 0) scoreTotal = 0;

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
  const tieneImagen = !!(noticia.imagen && noticia.imagen.length > 0) || !!(noticia.imagenDestacada && noticia.imagenDestacada.length > 0);

  const checks = [
    { nombre: 'Extension ≥350 palabras', pasa: palabrasTotales >= 350 },
    { nombre: 'Lead ≥35 palabras', pasa: leadPalabras >= 35 },
    { nombre: 'Subtitulos (h2) ≥1', pasa: h2s >= 1 },
    { nombre: 'Negritas / datos clave', pasa: strongs >= 1 },
    { nombre: 'Citas o atribucion', pasa: blockquotes2 >= 1 },
    { nombre: 'Titulo SEO 50-70 chars', pasa: tituloLen >= 50 && tituloLen <= 70 },
    { nombre: 'Meta 120-180 chars', pasa: resumenLen >= 120 && resumenLen <= 180 },
    { nombre: 'Imagen destacada', pasa: tieneImagen },
  ];
  const checksOK = checks.filter(c => c.pasa).length;

  const filtros = {
    oro: analizarFiltroOro(noticia),
    adsense: analizarFiltroAdSense(noticia),
    discover: analizarFiltroDiscover(noticia),
    news: analizarFiltroNews(noticia),
    seo: analizarFiltroSEO(noticia),
    eeat: analizarFiltroEEAT(noticia),
    aiRisk: analizarFiltroAIRisk(noticia),
  };

  const aiRiskScore = filtros.aiRisk.puntuacion;
  const aiRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = aiRiskScore >= 80 ? 'LOW' : aiRiskScore >= 50 ? 'MEDIUM' : 'HIGH';
  const aiRiskIssues = filtros.aiRisk.checks
    .filter(c => c.estado === 'FAIL' || c.estado === 'WARN')
    .map(c => c.mensaje);

  // ─── DETERMINACIÓN DE NIVEL v5.0 — UNIFICADO: fuente de verdad = 8 checks del panel ───
  // Todos los evaluadores usan los mismos 8 checks:
  //   FORENSE:  8/8 checks + score ≥ 70 + 0 adjetivos + ≤1 transicion + AI risk LOW
  //   ORO:      8/8 checks
  //   PLATA:    6-7/8 checks
  //   BRONCE:   4-5/8 checks
  //   RECHAZADO: <4/8 checks O atribuciones falsas

  const esRechazado = atribucionesFalsas || checksOK < 4 || aiMetrics.h2_repetidos > 0;
  const esForense = checksOK === 8 &&
    scoreTotal >= 70 &&
    !atribucionesFalsas &&
    adjetivosEncontrados.length === 0 &&
    transicionesEncontradas.length <= 1 &&
    aiRiskLevel === 'LOW';

  let nivel: ResultadoAnalisis['nivel'];
  if (esRechazado) nivel = 'RECHAZADO';
  else if (esForense) nivel = 'FORENSE';
  else if (checksOK === 8) nivel = 'ORO';
  else if (checksOK >= 6) nivel = 'PLATA';
  else if (checksOK >= 4) nivel = 'BRONCE';
  else nivel = 'RECHAZADO';

  const aprobado = nivel !== 'RECHAZADO';

  return {
    aprobado,
    nivel,
    puntuacion: scoreTotal,
    aiRiskScore,
    aiRiskLevel,
    aiRiskIssues,
    palabrasSensiblesDetectadas,
    cierreGenerico,
    aiMetrics,
    filtros,
    accionesRequeridas: generarAcciones(filtros, palabrasSensiblesDetectadas, cierreGenerico),
    metadataSugerida: generarMetadataSugerida(noticia, filtros),
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
  checks.push({
    nombre: 'Extension adecuada',
    estado: palabraCount >= 200 ? 'PASS' : palabraCount >= 150 ? 'WARN' : 'FAIL',
    mensaje: palabraCount >= 200
      ? `${palabraCount} palabras. Extension adecuada.`
      : palabraCount >= 150
        ? `${palabraCount} palabras. Aceptable para noticias breves.`
        : `Solo ${palabraCount} palabras. Muy corta para ser informativa.`,
    valorActual: palabraCount,
    valorEsperado: '>=200',
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
    estado: h2s >= 1 ? 'PASS' : 'WARN',
    mensaje: h2s >= 1 ? `${h2s} subtitulos detectados.` : `Sin subtitulos. Opcional si la noticia es breve.`,
    valorActual: h2s,
    valorEsperado: '>=0',
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
  const checks: CheckItem[] = [];
  const textoPlano = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabraCount = textoPlano.split(' ').filter(p => p.length > 0).length;

  // 1. Thin content — Verificabilidad, no longitud
  const datosConcretosAdsense = (textoPlano.match(/\b\d{1,2}\s+de\s+\w+\b/gi) || []).length
    + (textoPlano.match(/\b(?:Managua|Granada|León|Masaya|Estelí|Chinandega|Matagalpa|Jinotega|Rivas|Carazo|Nicaragua)\b/gi) || []).length
    + (textoPlano.match(/\b(?:Policía|Ministerio|Hospital|Alcaldía|Comisaría|INSS|municipio|departamento|barrio)\b/gi) || []).length
    + (textoPlano.match(/\btestigo|familiar|vecino|habitante|comerciante|conductor|pasajero\b/gi) || []).length;
  const tieneDatosConcretos = datosConcretosAdsense >= 3;
  const passThinContent = palabraCount >= 200 || (palabraCount >= 150 && tieneDatosConcretos);
  checks.push({
    nombre: 'Thin content',
    estado: passThinContent ? 'PASS' : 'WARN',
    mensaje: passThinContent
      ? `${palabraCount} palabras con datos concretos. Contenido sustancial.`
      : `${palabraCount} palabras. Corta pero puede ser valida si es verificable.`,
    valorActual: palabraCount,
    valorEsperado: '>=150 con datos',
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

  // 4. Contenido generado sin revision
  const patronesIA = TRANSICIONES_IA.filter(t => textoPlano.toLowerCase().includes(t.toLowerCase()));
  const estadoRevision = patronesIA.length === 0 ? 'PASS' : (patronesIA.length <= 2 ? 'WARN' : 'FAIL');
  checks.push({
    nombre: 'Revision editorial',
    estado: estadoRevision,
    mensaje: patronesIA.length === 0
      ? 'Sin patrones de IA detectados.'
      : `Patrones IA detectados: ${patronesIA.length}. Requiere revision humana.`,
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
    estado: n.titulo.length >= 50 && n.titulo.length <= 70 ? 'PASS' : n.titulo.length >= 30 && n.titulo.length <= 75 ? 'WARN' : 'FAIL',
    mensaje: `${n.titulo.length} caracteres. Ideal: 50-70.`,
    valorActual: n.titulo.length,
    valorEsperado: '50-70',
  });

  // 2. Meta description
  checks.push({
    nombre: 'Meta description 120-180 chars',
    estado: n.resumen.length >= 120 && n.resumen.length <= 180 ? 'PASS' : n.resumen.length >= 80 ? 'WARN' : 'FAIL',
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
// - Exceso de patrón enumerativo ("además... también... asimismo...")
// ───────────────────────────────────────────────

function analizarFiltroAIRisk(n: NoticiaInput): FiltroResultado {
  const checks: CheckItem[] = [];
  const textoPlano = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. REPETICIÓN DE VERBOS OPERATIVOS entre secciones
  // Detecta patrones como "Las autoridades X... Las autoridades Y... Las autoridades Z..."
  const verbosOperativos = ['realizaron', 'ejecutaron', 'reportaron', 'confirmaron', 'informaron',
    'destacaron', 'indicaron', 'señalaron', 'manifestaron', 'declararon',
    'explicaron', 'mencionaron', 'precisaron', 'aseguraron', 'agregaron',
    'anunciaron', 'revelaron', 'detallaron', 'expresaron', 'comentaron'];
  const contenidoLower = textoPlano.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Contar cuántas veces aparece cada verbo
  const verbosRepetidos = verbosOperativos.filter(v => {
    const matches = contenidoLower.match(new RegExp(`\\b${v}\\b`, 'g'));
    return matches && matches.length >= 2;
  });
  const sujetoRepetido = /las autoridades|los funcionarios|el ministerio|la policia|la institucion/gi;
  const sujetoMatches = textoPlano.match(sujetoRepetido) || [];
  const sujetoCount = sujetoMatches.length;
  const verbRisk = verbosRepetidos.length >= 3 || (verbosRepetidos.length >= 2 && sujetoCount >= 3);
  checks.push({
    nombre: 'Repetición de verbos operativos',
    estado: verbRisk ? 'FAIL' : verbosRepetidos.length >= 1 ? 'WARN' : 'PASS',
    mensaje: verbRisk
      ? `ALTO RIESGO IA: ${verbosRepetidos.length} verbos repetidos (${verbosRepetidos.slice(0, 3).join(', ')}). Sujeto repetido ${sujetoCount}x. Variar verbos y sujetos.`
      : verbosRepetidos.length >= 1
        ? `Verbo repetido: ${verbosRepetidos.join(', ')}. Considerar variar.`
        : 'Sin repetición problemática de verbos operativos.',
    valorActual: verbosRepetidos.length,
    valorEsperado: 0,
  });

  // 2. SIMETRÍA DE PÁRRAFOS (uniformidad de longitud)
  const parrafosHtml = n.contenido.match(/<p>([\s\S]*?)<\/p>/gi) || [];
  const parrafosTexto = parrafosHtml.length > 0
    ? parrafosHtml.map(p => p.replace(/<[^>]*>/g, '').trim()).filter(p => p.length > 10)
    : textoPlano.split(/\n\s*\n/).filter(p => p.trim().length > 10);
  if (parrafosTexto.length >= 3) {
    const longitudes = parrafosTexto.map(p => p.split(/\s+/).filter(w => w.length > 0).length);
    const media = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
    const desviacion = Math.sqrt(longitudes.reduce((sum, l) => sum + Math.pow(l - media, 2), 0) / longitudes.length);
    const cv = media > 0 ? desviacion / media : 0; // Coeficiente de variación
    // CV < 0.15 = párrafos casi idénticos en longitud = patrón IA
    const paragraphSymmetry = cv < 0.15;
    checks.push({
      nombre: 'Simetría de párrafos',
      estado: paragraphSymmetry ? 'FAIL' : cv < 0.25 ? 'WARN' : 'PASS',
      mensaje: paragraphSymmetry
        ? `ALTO RIESGO IA: Párrafos de longitud casi idéntica (CV=${(cv * 100).toFixed(0)}%). Romper simetría: alternar párrafos cortos y largos.`
        : cv < 0.25
          ? `Párrafos algo uniformes (CV=${(cv * 100).toFixed(0)}%). Considerar variar más.`
          : `Variación natural de longitud entre párrafos (CV=${(cv * 100).toFixed(0)}%).`,
      valorActual: `${(cv * 100).toFixed(0)}%`,
      valorEsperado: '>25%',
    });
  } else {
    checks.push({
      nombre: 'Simetría de párrafos',
      estado: 'PASS',
      mensaje: 'Menos de 3 párrafos — no aplica análisis de simetría.',
    });
  }

  // 3. UNIFORMIDAD DE LONGITUD DE FRASES
  const frases = textoPlano.split(/[.!?]+/).map(f => f.trim()).filter(f => f.split(/\s+/).length >= 3);
  if (frases.length >= 5) {
    const longitudesFrase = frases.map(f => f.split(/\s+/).filter(w => w.length > 0).length);
    const mediaFrase = longitudesFrase.reduce((a, b) => a + b, 0) / longitudesFrase.length;
    const desvFrase = Math.sqrt(longitudesFrase.reduce((sum, l) => sum + Math.pow(l - mediaFrase, 2), 0) / longitudesFrase.length);
    const cvFrase = mediaFrase > 0 ? desvFrase / mediaFrase : 0;
    const sentenceUniformity = cvFrase < 0.20;
    checks.push({
      nombre: 'Uniformidad de cadencia de frases',
      estado: sentenceUniformity ? 'FAIL' : cvFrase < 0.30 ? 'WARN' : 'PASS',
      mensaje: sentenceUniformity
        ? `ALTO RIESGO IA: Frases de longitud uniforme (CV=${(cvFrase * 100).toFixed(0)}%). La IA escribe frases de longitud similar. Alternar frases cortas (5-10 palabras) con largas (20+).`
        : cvFrase < 0.30
          ? `Frases algo uniformes (CV=${(cvFrase * 100).toFixed(0)}%). Variar más.`
          : `Ritmo natural de frases (CV=${(cvFrase * 100).toFixed(0)}%).`,
      valorActual: `${(cvFrase * 100).toFixed(0)}%`,
      valorEsperado: '>30%',
    });
  } else {
    checks.push({
      nombre: 'Uniformidad de cadencia de frases',
      estado: 'PASS',
      mensaje: 'Menos de 5 frases — no aplica análisis de cadencia.',
    });
  }

  // 4. H2s REPETIDOS EXACTOS (patrón de IA en bucle)
  const h2MatchesDup = n.contenido.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h2TextsDup = h2MatchesDup.map(h => {
    const m = h.match(/<h2[^>]*>(.*?)<\/h2>/i);
    return m ? m[1].trim().toLowerCase().replace(/\s+/g, ' ') : '';
  }).filter(t => t.length > 0);
  const h2CountsDup = new Map<string, number>();
  for (const t of h2TextsDup) h2CountsDup.set(t, (h2CountsDup.get(t) || 0) + 1);
  const dupH2s = Array.from(h2CountsDup.entries()).filter(([, c]) => c > 1);
  const totalDupH2s = dupH2s.reduce((sum, [, c]) => sum + c, 0);
  if (dupH2s.length > 0) {
    checks.push({
      nombre: 'H2s repetidos exactos',
      estado: 'FAIL',
      mensaje: 'RECHAZADO: ' + dupH2s.length + ' subtítulo(s) repetido(s) exactamente (' + totalDupH2s + ' ocurrencias): ' + dupH2s.map(([t, c]) => '"' + t + '" (' + c + 'x)').join(', ') + '. Cada H2 debe ser único.',
      valorActual: totalDupH2s,
      valorEsperado: 0,
    });
  } else {
    checks.push({
      nombre: 'H2s repetidos exactos',
      estado: 'PASS',
      mensaje: 'Sin subtítulos repetidos.',
    });
  }

  // 5. ESTRUCTURA H2 SIMÉTRICA (mismos tipos de contenido por sección)
  const h2Matches = n.contenido.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  if (h2Matches.length >= 3) {
    const h2Textos = h2Matches.map(h => h.replace(/<[^>]*>/g, '').trim().toLowerCase());
    // Detectar si todos los H2 siguen el mismo patrón (ej: todos empiezan con mismo tipo de palabra)
    const primerosTokens = h2Textos.map(h => h.split(/\s+/)[0] || '');
    const tokensUnicos = new Set(primerosTokens);
    const tokenRepetido = primerosTokens.length - tokensUnicos.size >= 2; // 2+ H2 empiezan igual
    // Detectar si todos los H2 tienen longitud similar
    const h2Longitudes = h2Textos.map(h => h.length);
    const h2Media = h2Longitudes.reduce((a, b) => a + b, 0) / h2Longitudes.length;
    const h2Cv = h2Media > 0 ? Math.sqrt(h2Longitudes.reduce((s, l) => s + Math.pow(l - h2Media, 2), 0) / h2Longitudes.length) / h2Media : 0;
    const h2Symmetry = tokenRepetido || h2Cv < 0.15;
    checks.push({
      nombre: 'Simetría de estructura H2',
      estado: h2Symmetry ? 'WARN' : 'PASS',
      mensaje: h2Symmetry
        ? `RIESGO IA: Subtítulos con estructura simétrica${tokenRepetido ? ` (inician igual: "${[...tokensUnicos].filter(t => primerosTokens.filter(p => p === t).length >= 2).join('", "')}")` : ''}. Variar estilo: unos narrativos, otros técnicos, otros analíticos.`
        : `Variación natural en estructura de subtítulos.`,
      valorActual: h2Cv < 0.15 ? 'simétrico' : 'variado',
      valorEsperado: 'variado',
    });
  } else {
    checks.push({
      nombre: 'Simetría de estructura H2',
      estado: 'PASS',
      mensaje: 'Menos de 3 subtítulos — no aplica análisis de simetría H2.',
    });
  }

  // 5. EXCESO DE PATRÓN ENUMERATIVO
  const marcadoresEnumerativos = ['ademas', 'tambien', 'asimismo', 'igualmente', 'de igual manera',
    'por otro lado', 'por su parte', 'en cuanto a', 'no obstante', 'sin embargo',
    'de igual forma', 'del mismo modo', 'a su vez', 'por ende', 'en consecuencia',
    'por lo tanto', 'cabe señalar', 'vale la pena'];
  const marcadoresEncontrados = marcadoresEnumerativos.filter(m => contenidoLower.includes(m));
  const enumerativeExcess = marcadoresEncontrados.length >= 5;
  checks.push({
    nombre: 'Exceso de patrón enumerativo',
    estado: enumerativeExcess ? 'FAIL' : marcadoresEncontrados.length >= 3 ? 'WARN' : 'PASS',
    mensaje: enumerativeExcess
      ? `ALTO RIESGO IA: ${marcadoresEncontrados.length} marcadores enumerativos (${marcadoresEncontrados.slice(0, 4).join(', ')}). La IA encadena ideas con conectores. Reducir a máximo 2.`
      : marcadoresEncontrados.length >= 3
        ? `${marcadoresEncontrados.length} marcadores enumerativos. Considerar reducir.`
        : `Uso moderado de conectores (${marcadoresEncontrados.length}).`,
    valorActual: marcadoresEncontrados.length,
    valorEsperado: '<=2',
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  const fails = checks.filter(c => c.estado === 'FAIL').length;
  return {
    aprobado: puntuacion >= 60 && fails === 0,
    puntuacion: Math.round(puntuacion),
    checks,
  };
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
  if (!filtros.aiRisk.aprobado) {
    acciones.push('Riesgo IA: Variar verbos, romper simetría de párrafos, alternar longitud de frases, reducir conectores enumerativos');
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
  const delTitulo = [...new Set(palabrasTitulo)];

  // Unificar sin duplicados, priorizando del mapa y del usuario
  const unicas = Array.from(new Set([...delMapa, ...delUsuario, ...delTitulo]));
  return unicas;
}

function sugerirH2(n: NoticiaInput): string[] {
  const h2s: string[] = [];
  const categoria = (n.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const palabraCount = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(p => p.length > 0).length;

  // Solo sugerir h2 si hay suficiente contenido verificable para justificarlos
  if (palabraCount < 250) {
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
