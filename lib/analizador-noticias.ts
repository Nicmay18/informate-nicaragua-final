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

const TRANSICIONES_IA = [
  'en conclusion', 'en resumen', 'es importante destacar',
  'vale la pena mencionar', 'no hay que olvidar', 'en el contexto de',
  'desde esta perspectiva', 'en ultima instancia', 'a fin de cuentas',
  'en el marco de', 'resulta fundamental', 'resulta evidente',
  'no cabe duda', 'es indiscutible', 'resulta innegable',
  'en conclusion', 'en resumen', 'en definitiva', 'para concluir',
  'como se menciono anteriormente', 'es relevante senalar',
  'no se puede ignorar', 'es crucial', 'es vital',
];

// ───────────────────────────────────────────────
// MOTOR PRINCIPAL
// ───────────────────────────────────────────────

export async function analizarNoticia(noticia: NoticiaInput): Promise<ResultadoAnalisis> {
  const filtros = {
    oro: analizarFiltroOro(noticia),
    adsense: analizarFiltroAdSense(noticia),
    discover: analizarFiltroDiscover(noticia),
    news: analizarFiltroNews(noticia),
    seo: analizarFiltroSEO(noticia),
    eeat: analizarFiltroEEAT(noticia),
  };

  const puntuacionTotal = Object.values(filtros).reduce((sum, f) => sum + f.puntuacion, 0) / 6;

  let nivel: ResultadoAnalisis['nivel'];
  let aprobado: boolean;

  if (puntuacionTotal >= 75 && filtros.oro.aprobado && filtros.adsense.aprobado) {
    nivel = 'ORO';
    aprobado = true;
  } else if (puntuacionTotal >= 60 && filtros.adsense.aprobado) {
    nivel = 'PLATA';
    aprobado = true;
  } else if (puntuacionTotal >= 60) {
    nivel = 'BRONCE';
    aprobado = false;
  } else {
    nivel = 'RECHAZADO';
    aprobado = false;
  }

  const accionesRequeridas = generarAcciones(filtros);

  return {
    aprobado,
    nivel,
    puntuacion: Math.round(puntuacionTotal),
    filtros,
    accionesRequeridas,
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

  // 2. Lead (primer parrafo)
  const primerParrafo = n.contenido.match(/<p>(.*?)<\/p>/)?.[1] || '';
  const leadPalabras = primerParrafo.replace(/<[^>]*>/g, '').split(' ').filter(p => p.length > 0).length;
  checks.push({
    nombre: 'Lead informativo',
    estado: leadPalabras >= 20 && leadPalabras <= 60 ? 'PASS' : leadPalabras >= 15 ? 'WARN' : 'FAIL',
    mensaje: `Lead de ${leadPalabras} palabras. Ideal: 20-60.`,
    valorActual: leadPalabras,
    valorEsperado: '20-60',
  });

  // 3. Relleno emocional
  const contenidoLower = textoPlano.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const adjetivosEncontrados = ADJETIVOS_EMOCIONALES.filter(adj => contenidoLower.includes(adj));
  checks.push({
    nombre: 'Relleno emocional',
    estado: adjetivosEncontrados.length <= 3 ? 'PASS' : 'FAIL',
    mensaje: adjetivosEncontrados.length === 0
      ? 'Ningun adjetivo emocional detectado.'
      : `Detectados: ${adjetivosEncontrados.join(', ')} (max permitido: 3)`,
    valorActual: adjetivosEncontrados.length,
    valorEsperado: 0,
  });

  // 4. Transiciones IA
  const transicionesEncontradas = TRANSICIONES_IA.filter(t => contenidoLower.includes(t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  checks.push({
    nombre: 'Transiciones IA',
    estado: transicionesEncontradas.length <= 2 ? 'PASS' : 'FAIL',
    mensaje: transicionesEncontradas.length === 0
      ? '0 detectadas.'
      : `Detectadas: ${transicionesEncontradas.join(', ')} (max permitido: 2)`,
    valorActual: transicionesEncontradas.length,
    valorEsperado: 0,
  });

  // 5. Veracidad (fuentes atribuidas)
  const tieneFuentes = /informo|confirmo|declaro|preciso|senalo|indico|dijo|explico|manifesto/.test(contenidoLower);
  const blockquotes = (n.contenido.match(/<blockquote>/g) || []).length;
  checks.push({
    nombre: 'Fuentes atribuidas',
    estado: tieneFuentes && blockquotes >= 1 ? 'PASS' : tieneFuentes ? 'WARN' : 'FAIL',
    mensaje: tieneFuentes && blockquotes >= 1
      ? `${blockquotes} blockquotes con fuentes atribuidas.`
      : `Solo ${blockquotes} blockquotes. Minimo: 1.`,
    valorActual: blockquotes,
    valorEsperado: '>=1',
  });

  // 6. Estructura
  const h2s = (n.contenido.match(/<h2>/gi) || []).length;
  const strongs = (n.contenido.match(/<strong>/gi) || []).length;
  checks.push({
    nombre: 'Estructura (h2)',
    estado: h2s >= 2 ? 'PASS' : h2s >= 1 ? 'WARN' : 'FAIL',
    mensaje: h2s >= 2 ? `${h2s} subtitulos <h2>.` : `Solo ${h2s} <h2>. Minimo: 2.`,
    valorActual: h2s,
    valorEsperado: '>=2',
  });
  checks.push({
    nombre: 'Negritas (strong)',
    estado: strongs >= 5 ? 'PASS' : strongs >= 2 ? 'WARN' : 'FAIL',
    mensaje: strongs >= 5 ? `${strongs} <strong>.` : `Solo ${strongs} <strong>. Minimo: 5.`,
    valorActual: strongs,
    valorEsperado: '>=5',
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return {
    aprobado: puntuacion >= 70 && !checks.some(c => c.estado === 'FAIL'),
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
  checks.push({
    nombre: 'Revision editorial',
    estado: patronesIA.length <= 3 ? 'PASS' : 'FAIL',
    mensaje: patronesIA.length === 0
      ? 'Sin patrones de IA detectados.'
      : `Patrones IA detectados: ${patronesIA.length}. Requiere revision humana.`,
  });

  const puntuacion = checks.filter(c => c.estado === 'PASS').length / checks.length * 100;
  return {
    aprobado: puntuacion >= 65 && !checks.some(c => c.estado === 'FAIL'),
    puntuacion: Math.round(puntuacion),
    checks,
  };
}

// ───────────────────────────────────────────────
// NIVEL 3: FILTROS GOOGLE DISCOVER
// ───────────────────────────────────────────────

function analizarFiltroDiscover(n: NoticiaInput): FiltroResultado {
  const checks: CheckItem[] = [];

  // 1. Imagen destacada
  checks.push({
    nombre: 'Imagen destacada',
    estado: n.imagenDestacada ? 'PASS' : 'FAIL',
    mensaje: n.imagenDestacada
      ? 'Imagen presente. Verificar manualmente >=1200px de ancho.'
      : 'SIN IMAGEN. Discover requiere imagen obligatoria.',
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

  // 3. Frescura
  checks.push({
    nombre: 'Senal de frescura',
    estado: n.fechaActualizacion ? 'PASS' : 'WARN',
    mensaje: n.fechaActualizacion
      ? 'dateModified presente.'
      : 'Sin fecha de actualizacion. Discover favorece contenido "fresco".',
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
  const categoriasValidas = ['Nacionales', 'Sucesos', 'Politica', 'Economia', 'Deportes', 'Cultura', 'Salud', 'Tecnologia', 'Internacionales', 'Espectaculos', 'Infraestructura', 'Judicial', 'General'];
  checks.push({
    nombre: 'Categoria News',
    estado: categoriasValidas.includes(n.categoria) ? 'PASS' : 'WARN',
    mensaje: categoriasValidas.includes(n.categoria)
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
    nombre: 'Meta description 150-160 chars',
    estado: n.resumen.length >= 150 && n.resumen.length <= 160 ? 'PASS' : n.resumen.length >= 120 ? 'WARN' : 'FAIL',
    mensaje: `${n.resumen.length} caracteres. Ideal: 150-160.`,
    valorActual: n.resumen.length,
    valorEsperado: '150-160',
  });

  // 3. Slug optimizado
  const slugValido = /^[a-z0-9-]+$/.test(n.slug) && !/[aeiouAEIOU]/.test(n.slug) || /^[a-z0-9-]+$/.test(n.slug.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  checks.push({
    nombre: 'Slug SEO',
    estado: slugValido ? 'PASS' : 'FAIL',
    mensaje: slugValido
      ? `Slug valido: ${n.slug}`
      : `Slug invalido: ${n.slug}. Usar solo minusculas, numeros y guiones.`,
  });

  // 4. Keywords en contenido
  const keywordsSugeridas = extraerKeywordsLSI(n);
  checks.push({
    nombre: 'Keywords LSI',
    estado: keywordsSugeridas.length >= 3 ? 'PASS' : 'WARN',
    mensaje: `Sugeridas: ${keywordsSugeridas.slice(0, 5).join(', ')}`,
    valorActual: keywordsSugeridas.length,
    valorEsperado: '>=3',
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

  // 2. Fuentes verificables
  const tieneURLs = /https?:\/\//.test(n.contenido);
  checks.push({
    nombre: 'Fuentes verificables',
    estado: tieneURLs ? 'PASS' : 'WARN',
    mensaje: tieneURLs
      ? 'Fuentes con URLs detectadas.'
      : 'Sin URLs de fuentes. Agregar links verificables cuando sea posible.',
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
    metaDescription: n.resumen.length < 150
      ? n.resumen + ' ' + n.categoria + ' Nicaragua.'
      : n.resumen.slice(0, 157) + '...',
    keywordsLSI,
    h2Sugeridos: sugerirH2(n),
  };
}

function extraerKeywordsLSI(n: NoticiaInput): string[] {
  const texto = (n.titulo + ' ' + n.contenido).toLowerCase();

  const mapa: Record<string, string[]> = {
    'Sucesos': ['accidente', 'managua', 'policia nacional', 'transito', 'heridos'],
    'Politica': ['gobierno', 'nicaragua', 'asamblea nacional', 'ley', 'ministerio'],
    'Economia': ['precio', 'mercado', 'exportacion', 'cordoba', 'dolar'],
    'Salud': ['minsa', 'hospital', 'vacuna', 'salud', 'epidemia'],
    'Deportes': ['beisbol', 'futbol', 'nicaragua', 'mundial', 'juegos'],
    'Tecnologia': ['internet', 'redes sociales', 'celular', 'aplicacion', 'digital'],
    'Internacionales': ['eeuu', 'mexico', 'centroamerica', 'mundo', 'crisis'],
    'Nacionales': ['nicaragua', 'managua', 'gobierno', 'pais', 'nacional'],
  };

  const sugeridas = mapa[n.categoria] || ['nicaragua', 'noticias', n.categoria.toLowerCase()];
  return sugeridas.filter(k => texto.includes(k));
}

function sugerirH2(n: NoticiaInput): string[] {
  const h2s: string[] = [];
  const categoria = n.categoria.toLowerCase();

  if (categoria === 'sucesos') {
    h2s.push('Hechos principales', 'Declaraciones de fuentes', 'Desarrollo', 'Antecedentes');
  } else if (categoria === 'politica') {
    h2s.push('Anuncio oficial', 'Reacciones', 'Analisis', 'Contexto politico');
  } else if (categoria === 'deportes') {
    h2s.push('Resultados', 'Reacciones', 'Proximos encuentros', 'Contexto');
  } else if (categoria === 'economia') {
    h2s.push('Datos clave', 'Impacto', 'Reacciones del mercado', 'Contexto');
  } else {
    h2s.push('Informacion principal', 'Declaraciones', 'Desarrollo', 'Contexto');
  }

  return h2s;
}
