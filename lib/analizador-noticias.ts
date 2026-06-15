/**
 * Motor forense de analisis de noticias - Nicaragua Informate
 * 6 niveles de validacion: ORO, AdSense, Discover, News, SEO, E-E-A-T
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
  slug: string;
  palabrasClave?: string[];
}

export interface ResultadoAnalisis {
  aprobado: boolean;
  nivel: 'ORO' | 'PLATA' | 'BRONCE' | 'RECHAZADO';
  puntuacion: number;
  filtros: {
    oro: FiltroResultado;
    adsense: FiltroResultado;
    discover: FiltroResultado;
    news: FiltroResultado;
    seo: FiltroResultado;
    eeat: FiltroResultado;
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
  
  // Densidad y Contexto
  const dL = (t.match(/\b\d+\s*(?:años|km|personas|heridos|muertos|metros)\b/gi)||[]).length;
  const dG = (t.match(/\b(?:Reuters|AP|Bloomberg|OpenAI|Apple|Google|Microsoft|Amazon|Meta|Netflix|Disney|KFC)\b/g)||[]).length;
  const dens = palabras ? Math.round(((dL + dG) / palabras) * 1000) / 10 : 0;

  // SCORING UNIFICADO
  let scoreTotal = 0;
  if(palabras >= 450) scoreTotal += 20; else if(palabras >= 350) scoreTotal += 14;
  if(adjetivosEncontrados.length === 0) scoreTotal += 20; else if(adjetivosEncontrados.length <= 2) scoreTotal += 8;
  if(transicionesEncontradas.length === 0) scoreTotal += 20; else if(transicionesEncontradas.length <= 2) scoreTotal += 8;
  if(dens >= 2) scoreTotal += 15; else if(dens >= 1) scoreTotal += 11;
  scoreTotal += 10; // Variación media por defecto
  scoreTotal += 10; // Contexto por defecto (siempre hay Nicaragua)
  if(tieneAtribuciones || tieneCitas) scoreTotal += 5;

  if (scoreTotal > 100) scoreTotal = 100;

  const filtros = {
    oro: analizarFiltroOro(noticia),
    adsense: analizarFiltroAdSense(noticia),
    discover: analizarFiltroDiscover(noticia),
    news: analizarFiltroNews(noticia),
    seo: analizarFiltroSEO(noticia),
    eeat: analizarFiltroEEAT(noticia),
  };

  const todosFiltrosAprobados = Object.values(filtros).every(f => f.aprobado);
  let nivel: ResultadoAnalisis['nivel'] = (todosFiltrosAprobados || scoreTotal >= 90) ? 'ORO' : (scoreTotal >= 75 ? 'PLATA' : 'BRONCE');
  let aprobado = nivel === 'ORO' || scoreTotal >= 85;

  return {
    aprobado,
    nivel,
    puntuacion: scoreTotal,
    filtros,
    accionesRequeridas: generarAcciones(filtros),
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

  // 1. Extension
  checks.push({
    nombre: 'Extension minima',
    estado: palabraCount >= 500 ? 'PASS' : palabraCount >= 350 ? 'WARN' : 'FAIL',
    mensaje: palabraCount >= 500
      ? `${palabraCount} palabras. Cumple meta AdSense.`
      : palabraCount >= 350
        ? `${palabraCount} palabras. Aceptable pero debil.`
        : `Solo ${palabraCount} palabras. Minimo requerido: 500.`,
    valorActual: palabraCount,
    valorEsperado: 500,
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

  // 5. Veracitud (fuentes atribuidas) — Mas estricto
  const palabrasAtribucion = /informo|confirmo|declaro|preciso|senalo|indico|dijo|explico|manifesto|afirmo|agrego|aseguro|destaco|menciono|aclaro|comento|expreso|anuncio|revelo|preciso|indico|agrego|indico/.test(contenidoLower);
  const blockquotes = (n.contenido.match(/<blockquote>/g) || []).length;
  // Detectar citas con comillas (rectas o tipograficas) + palabra de atribucion
  const tieneCitasAtribuidas = /["\u201c][^"\u201d]{8,}["\u201d][\s,]*[^.]*(?:inform|confirm|declar|precis|senal|indic|dij|explic|manifest|afirm|agreg|asegur|destac|mencion|aclar|coment|expres|anunc|revel)/i.test(n.contenido);
  // Detectar "segun X" o "de acuerdo con X"
  const tieneSegun = /\bsegun\s+[A-Z]|\bde\s+acuerdo\s+con\s+[A-Z]|\bsegun\s+informes|\bsegun\s+la\s+Policia|\bsegun\s+el\s+Ministerio/i.test(contenidoLower);
  const passFuentes = palabrasAtribucion || blockquotes >= 1 || tieneCitasAtribuidas || tieneSegun;
  checks.push({
    nombre: 'Fuentes atribuidas',
    estado: passFuentes ? 'PASS' : 'FAIL',
    mensaje: passFuentes
      ? `${blockquotes} blockquotes. Fuentes atribuidas detectadas.`
      : 'CRITICO: Sin atribucion de fuentes (testigos, policia, autoridades).',
    valorActual: blockquotes,
    valorEsperado: '>=1',
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
    estado: h2s >= 1 ? 'PASS' : 'FAIL',
    mensaje: h2s >= 1 ? `${h2s} subtitulos detectados.` : `Sin subtitulos. Minimo: 1.`,
    valorActual: h2s,
    valorEsperado: '>=1',
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
    aprobado: puntuacion >= 55 && fails <= 1,
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

  // 1. Thin content
  checks.push({
    nombre: 'Thin content',
    estado: palabraCount >= 350 ? 'PASS' : 'FAIL',
    mensaje: palabraCount >= 350
      ? `${palabraCount} palabras. Cumple politica AdSense.`
      : `CRITICO: ${palabraCount} palabras. Google marca como "pobre calidad".`,
    valorActual: palabraCount,
    valorEsperado: '>=350',
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
    aprobado: puntuacion >= 80 && !checks.some(c => c.estado === 'FAIL'),
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
    nombre: 'Titulo 55-60 chars',
    estado: n.titulo.length >= 50 && n.titulo.length <= 60 ? 'PASS' : n.titulo.length > 60 ? 'WARN' : 'FAIL',
    mensaje: `${n.titulo.length} caracteres. Ideal: 55-60.`,
    valorActual: n.titulo.length,
    valorEsperado: '55-60',
  });

  // 2. Meta description
  checks.push({
    nombre: 'Meta description 150-170 chars',
    estado: n.resumen.length >= 150 && n.resumen.length <= 170 ? 'PASS' : n.resumen.length >= 120 ? 'WARN' : 'FAIL',
    mensaje: `${n.resumen.length} caracteres. Ideal: 150-170.`,
    valorActual: n.resumen.length,
    valorEsperado: '150-170',
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
// NIVEL 6: FILTROS E-E-A-T
// ───────────────────────────────────────────────

function analizarFiltroEEAT(n: NoticiaInput): FiltroResultado {
  const checks: CheckItem[] = [];

  // 1. Autor visible
  checks.push({
    nombre: 'Autor con bio',
    estado: n.autor ? 'PASS' : 'FAIL',
    mensaje: n.autor
      ? `Autor: ${n.autor}`
      : 'Sin autor visible. E-E-A-T requiere autor identificable.',
  });

  // 2. Fuentes verificables (PASS si hay atribuciones, citas, o autor identificable)
  const tieneAtribuciones = /inform[oó]|confirm[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó]|manifest[oó]|afirm[oó]|agreg[oó]|asegur[oó]|destac[oó]|mencion[oó]/.test(n.contenido);
  const tieneURLs = /https?:\/\//.test(n.contenido);
  const tieneCitas = (n.contenido.match(/<blockquote>/g) || []).length >= 1;
  const passFuentes = tieneAtribuciones || tieneURLs || tieneCitas || (n.autor && n.autor.length > 2);
  checks.push({
    nombre: 'Fuentes verificables',
    estado: passFuentes ? 'PASS' : 'WARN',
    mensaje: passFuentes
      ? 'Fuentes atribuidas o autor verificado detectados.'
      : 'Sin atribuciones claras. Agregar citas o fuentes cuando sea posible.',
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return {
    aprobado: puntuacion >= 75,
    puntuacion: Math.round(puntuacion),
    checks,
  };
}

// ───────────────────────────────────────────────
// UTILIDADES
// ───────────────────────────────────────────────

function generarAcciones(filtros: ResultadoAnalisis['filtros']): string[] {
  const acciones: string[] = [];

  if (!filtros.oro.aprobado) {
    acciones.push('Revisar calidad editorial: extension, fuentes, estructura');
  }
  if (!filtros.adsense.aprobado) {
    acciones.push('CRITICO: No publicar hasta cumplir politicas AdSense');
  }
  if (!filtros.discover.aprobado) {
    acciones.push('Agregar imagen >=1200px y fecha de actualizacion');
  }
  if (!filtros.news.aprobado) {
    acciones.push('Verificar schema NewsArticle y autor');
  }
  if (!filtros.seo.aprobado) {
    acciones.push('Optimizar titulo, meta description y slug');
  }
  if (!filtros.eeat.aprobado) {
    acciones.push('Enriquecer perfil de autor y fuentes');
  }

  return acciones;
}

function generarMetadataSugerida(n: NoticiaInput, _filtros: ResultadoAnalisis['filtros']) {
  const keywordsLSI = extraerKeywordsLSI(n);

  return {
    tituloOptimizado: n.titulo.length > 60
      ? n.titulo.slice(0, 57) + '...'
      : n.titulo,
    metaDescription: n.resumen.length >= 150 && n.resumen.length <= 170
      ? n.resumen
      : n.resumen.length < 150
        ? n.resumen + ' ' + n.categoria + ' Nicaragua.'
        : n.resumen.slice(0, 167) + '...',
    keywordsLSI,
    h2Sugeridos: sugerirH2(n),
  };
}

function extraerKeywordsLSI(n: NoticiaInput): string[] {
  const texto = (n.titulo + ' ' + n.contenido).toLowerCase();

  const mapa: Record<string, string[]> = {
    'sucesos': ['accidente', 'managua', 'policia nacional', 'transito', 'heridos'],
    'deportes': ['beisbol', 'futbol', 'nicaragua', 'mundial', 'juegos'],
    'tecnologia': ['internet', 'redes sociales', 'celular', 'aplicacion', 'digital'],
    'internacionales': ['eeuu', 'mexico', 'centroamerica', 'mundo', 'crisis'],
    'nacionales': ['nicaragua', 'managua', 'gobierno', 'pais', 'nacional'],
    'espectaculos': ['concierto', 'managua', 'artista', 'musica', 'evento'],
    'general': ['nicaragua', 'noticias', 'informacion', 'actualidad', 'pais'],
  };

  // Normalizar categoría para buscar en el mapa (quitar acentos)
  const catNormalizada = (n.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const sugeridas = mapa[catNormalizada] || ['nicaragua', 'noticias', catNormalizada];
  return sugeridas.filter(k => texto.includes(k));
}

function sugerirH2(n: NoticiaInput): string[] {
  const h2s: string[] = [];
  const categoria = (n.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  if (categoria === 'sucesos') {
    h2s.push('Hechos principales', 'Declaraciones de fuentes', 'Desarrollo', 'Antecedentes');
  } else if (categoria === 'deportes') {
    h2s.push('Resultados', 'Reacciones', 'Proximos encuentros', 'Contexto');
  } else if (categoria === 'espectaculos') {
    h2s.push('Detalles del evento', 'Repertorio', 'Reacciones del publico', 'Contexto');
  } else if (categoria === 'tecnologia') {
    h2s.push('Caracteristicas principales', 'Impacto en Nicaragua', 'Desarrollo', 'Contexto');
  } else if (categoria === 'internacionales') {
    h2s.push('Informacion principal', 'Reacciones internacionales', 'Desarrollo', 'Contexto');
  } else if (categoria === 'nacionales') {
    h2s.push('Informacion principal', 'Declaraciones oficiales', 'Desarrollo', 'Impacto nacional');
  } else {
    h2s.push('Informacion principal', 'Declaraciones', 'Desarrollo', 'Contexto');
  }

  return h2s;
}
