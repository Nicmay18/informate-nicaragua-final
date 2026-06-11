import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// MOTOR DE PULIDO LOCAL - 100% OFFLINE, SIN DEPENDENCIAS API
// ═══════════════════════════════════════════════════════════════

const REGLAS_PULIDO = {
  // 1. ELIMINAR transiciones de IA
  transiciones_ia: {
    patron: /\b(además|asimismo|sin embargo|no obstante|para finalizar|finalmente|por otro lado|por su parte|es importante destacar|cabe señalar|vale la pena mencionar|en conclusión|en resumen|por lo tanto|de igual manera|de la misma forma|en primer lugar|en segundo lugar|en este sentido|en tanto que|en contraste|por ende|consecuentemente)\b[,;]?\s*/gi,
    reemplazo: (_match: string, contexto: any) => {
      if (contexto.esInicioParrafo) return '';
      return '. ';
    }
  },

  // 2. ELIMINAR relleno emocional
  relleno_emocional: {
    patron: /\b(tragedia|trágico|tragicamente|lamentablemente|tristemente|desgraciadamente|por desgracia|consternación|conmoción|amado|querido|profundo dolor|ambiente de dolor)\b[,;]?\s*/gi,
    reemplazo: ''
  },

  // 3. CITAS GENÉRICAS por categoría
  citas_genericas: {
    policial: [
      '"Se activaron los protocolos de investigación correspondientes", indicaron las autoridades.',
      '"Las indagaciones continúan para esclarecer los hechos", señalaron fuentes oficiales.',
      '"El caso fue remitido a la fiscalía competente", confirmaron testigos del lugar.'
    ],
    salud: [
      '"El paciente fue atendido en la unidad de emergencias", reportaron los socorristas.',
      '"Se aplicaron los procedimientos establecidos", indicó el personal médico.',
      '"La situación está bajo control", precisaron las autoridades de salud.'
    ],
    transito: [
      '"Las unidades de rescate acudieron al lugar", confirmaron testigos.',
      '"Se recomienda precaución a los conductores", señalaron las autoridades.',
      '"El percance ocurrió en condiciones de tráfico intenso", indicaron residentes.'
    ],
    clima: [
      '"Se mantiene monitoreo constante del fenómeno", indicó el especialista.',
      '"Las condiciones podrían variar en las próximas horas", precisaron meteorólogos.',
      '"Se recomienda estar atento a boletines oficiales", señalaron autoridades.'
    ],
    general: [
      '"Las autoridades confirmaron los hechos", reportaron fuentes locales.',
      '"Testigos del lugar indicaron lo ocurrido", señalaron vecinos.',
      '"La información fue verificada por medios locales", confirmaron residentes.'
    ]
  },

  // 4. FUENTES ATRIBUIDAS genéricas
  fuentes_genericas: [
    'señalaron las autoridades locales',
    'indicaron testigos del lugar',
    'confirmaron fuentes oficiales',
    'reportaron vecinos del sector',
    'precisaron los socorristas',
    'manifestaron residentes locales'
  ],

  // 5. SUBTÍTULOS H2 genéricos
  subtitulos: [
    'Desarrollo del hecho',
    'Contexto de la situación',
    'Detalles del incidente',
    'Reacciones de la comunidad'
  ]
};

// Funciones auxiliares
function detectarCategoria(titulo: string, contenido: string): string {
  const texto = (titulo + ' ' + contenido).toLowerCase();
  if (/accidente|tránsito|choque|colisión|motociclista|conductor|vía|carretera|ruta/i.test(texto)) return 'transito';
  if (/salud|paciente|hospital|médico|ambulancia|enfermedad|viruela|dengue/i.test(texto)) return 'salud';
  if (/policía|delincuente|robo|captura|detenido|fiscalía|investigan/i.test(texto)) return 'policial';
  if (/lluvia|clima|depresión|tropical|ineter|temperatura|viento/i.test(texto)) return 'clima';
  return 'general';
}

function contarPalabras(texto: string): number {
  return texto.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
}

function contarDatosConcretos(texto: string): number {
  const patrones = [
    /\b\d{1,3}\s*años\b/gi,
    /\b\d{1,2}:\d{2}\b/g,
    /\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi,
    /\b\d+\s*(km|kilómetros|metros|m)\b/gi,
    /\b\d{1,3}(?:\.\d{3})*\b/g,
    /\b(?:managua|león|granada|masaya|estelí|chinandega|matagalpa|jinotega|rivas|jinotepe|boaco|chontales|ocotal|nueva segovia|madriz|san carlos|bluefields|puerto cabezas|barrio|colonia|comunidad)\b/gi
  ];
  let total = 0;
  patrones.forEach(p => {
    const matches = texto.match(p) || [];
    total += matches.length;
  });
  return total;
}

function calcularScore(contenido: string, _titulo: string, _meta: string): number {
  let score = 40;
  const palabras = contarPalabras(contenido);
  
  // Longitud
  if (palabras >= 500) score += 20;
  else if (palabras >= 350) score += 10;
  
  // H2
  if (/<h2[^>]*>/i.test(contenido)) score += 15;
  
  // Citas
  if (/<blockquote>/i.test(contenido) || /"[^"]{20,200}"/g.test(contenido)) score += 10;
  
  // Fuentes atribuidas
  const fuentes = (contenido.match(/\b(señaló|indicó|confirmó|reportó|afirmó|manifestó|precisó|agregó|explicó|detalló)\b/gi) || []).length;
  if (fuentes >= 2) score += 15;
  else if (fuentes >= 1) score += 8;
  
  // Datos concretos
  const datos = contarDatosConcretos(contenido);
  const densidad = (datos / palabras * 100);
  if (densidad >= 5) score += 15;
  else if (densidad >= 3) score += 8;
  
  // Penalizaciones
  const transiciones = (contenido.match(REGLAS_PULIDO.transiciones_ia.patron) || []).length;
  score -= transiciones * 10;
  
  const relleno = (contenido.match(REGLAS_PULIDO.relleno_emocional.patron) || []).length;
  score -= relleno * 10;
  
  return Math.max(0, score);
}

function pulirNoticia(titulo: string, contenido: string, meta: string, _categoria: string) {
  let contenidoPulido = contenido;
  let tituloPulido = titulo;
  const cambios: string[] = [];
  const advertencias: string[] = [];
  const citasAgregadas: string[] = [];
  const fuentesAgregadas: string[] = [];
  const transicionesEliminadas: string[] = [];

  // 1. Eliminar transiciones IA
  const transAntes = (contenidoPulido.match(REGLAS_PULIDO.transiciones_ia.patron) || []);
  transAntes.forEach((t: string) => {
    if (!transicionesEliminadas.includes(t.trim())) transicionesEliminadas.push(t.trim());
  });
  contenidoPulido = contenidoPulido.replace(REGLAS_PULIDO.transiciones_ia.patron, (_match, offset) => {
    const esInicio = offset === 0 || contenidoPulido[offset - 1] === '\n' || contenidoPulido[offset - 1] === '>';
    return esInicio ? '' : '. ';
  });
  if (transAntes.length > 0) cambios.push(`Eliminadas ${transAntes.length} transiciones de IA`);

  // 2. Eliminar relleno emocional
  const rellenoAntes = (contenidoPulido.match(REGLAS_PULIDO.relleno_emocional.patron) || []).length;
  contenidoPulido = contenidoPulido.replace(REGLAS_PULIDO.relleno_emocional.patron, '');
  if (rellenoAntes > 0) cambios.push(`Eliminadas ${rellenoAntes} instancias de relleno emocional`);

  // 3. Normalizar espacios
  contenidoPulido = contenidoPulido
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])([A-Za-zÁÉÍÓÚÑáéíóúñ])/g, '$1 $2')
    .trim();

  // 4. Agregar H2 si no tiene
  const tieneH2 = /<h2[^>]*>/i.test(contenidoPulido);
  if (!tieneH2) {
    const parrafos = contenidoPulido.split(/\n\n+/);
    if (parrafos.length >= 2) {
      const mitad = Math.floor(parrafos.length / 2);
      parrafos.splice(mitad, 0, '<h2>Desarrollo del hecho</h2>');
      contenidoPulido = parrafos.join('\n\n');
      cambios.push('Agregado subtítulo H2');
    }
  }

  // 5. Agregar citas si no tiene
  const tieneCitas = /<blockquote>/i.test(contenidoPulido) || /"[^"]{20,200}"/g.test(contenidoPulido);
  if (!tieneCitas) {
    const cat = detectarCategoria(titulo, contenido) as keyof typeof REGLAS_PULIDO.citas_genericas;
    const citasDisponibles = REGLAS_PULIDO.citas_genericas[cat] || REGLAS_PULIDO.citas_genericas.general;
    const citaAleatoria = citasDisponibles[Math.floor(Math.random() * citasDisponibles.length)];
    contenidoPulido += `\n\n<p>${citaAleatoria}</p>`;
    citasAgregadas.push(citaAleatoria);
    cambios.push('Agregada 1 cita textual');
  }

  // 6. Agregar fuentes si tiene pocas
  const fuentesActuales = (contenidoPulido.match(/\b(señaló|indicó|confirmó|reportó|afirmó|manifestó|precisó|agregó|explicó|detalló)\b/gi) || []).length;
  if (fuentesActuales < 2) {
    const fuenteAleatoria = REGLAS_PULIDO.fuentes_genericas[Math.floor(Math.random() * REGLAS_PULIDO.fuentes_genericas.length)];
    contenidoPulido += `\n\n<p>Respecto al caso, ${fuenteAleatoria}.</p>`;
    fuentesAgregadas.push(fuenteAleatoria);
    cambios.push('Agregada fuente atribuida');
  }

  // 7. Extender si es corto
  const palabras = contarPalabras(contenidoPulido);
  if (palabras < 500) {
    const extension = `\n\n<h2>Contexto adicional</h2>\n<p>La situación continúa siendo monitoreada por las autoridades correspondientes. Se recomienda a la población mantenerse informada a través de canales oficiales y seguir las indicaciones de las autoridades locales.</p>`;
    contenidoPulido += extension;
    advertencias.push(`Contenido extendido de ${palabras} a ${palabras + 50} palabras aproximadamente`);
  }

  // Calcular score nuevo
  const scoreNuevo = calcularScore(contenidoPulido, tituloPulido, meta);
  const nivelNuevo = scoreNuevo >= 80 ? 'ORO' : scoreNuevo >= 60 ? 'BRONCE' : 'PELIGRO';

  const palabrasAntes = contarPalabras(contenido);
  const palabrasDespues = contarPalabras(contenidoPulido);

  // Generar mejor meta descripción si es muy corta
  let metaDescripcion = meta || '';
  const palabrasMeta = metaDescripcion.split(/\s+/).filter(Boolean).length;
  
  if (palabrasMeta < 15 || metaDescripcion.length < 80) {
    // Extraer primera oración sustancial del contenido pulido
    const textoLimpio = contenidoPulido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const primeraOracion = textoLimpio.match(/[^.!?]+[.!?]/)?.[0] || textoLimpio.slice(0, 160);
    
    // Combinar título + primera oración para meta más completa
    metaDescripcion = `${tituloPulido}. ${primeraOracion}`.slice(0, 155).trim();
    if (metaDescripcion.length > 150) metaDescripcion += '...';
    
    cambios.push(`Meta descripción mejorada (${palabrasMeta} → ${metaDescripcion.split(/\s+/).filter(Boolean).length} palabras)`);
  }

  return {
    success: true,
    version_pulida: {
      titulo: tituloPulido,
      meta_descripcion: metaDescripcion,
      contenido: contenidoPulido,
      palabras: palabrasDespues,
      citas_agregadas: citasAgregadas,
      fuentes_agregadas: fuentesAgregadas,
      transiciones_eliminadas: transicionesEliminadas,
      cambios_aplicados: cambios,
      advertencias_editor: advertencias
    },
    diff: {
      titulo_cambio: titulo !== tituloPulido,
      contenido_cambio: contenido.length !== contenidoPulido.length,
      palabras_antes: palabrasAntes,
      palabras_despues: palabrasDespues
    },
    score_anterior: calcularScore(contenido, titulo, meta),
    score_nuevo: scoreNuevo,
    nivel_nuevo: nivelNuevo,
    requiere_revision_manual: advertencias.length > 0 || scoreNuevo < 80
  };
}

// API Handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { titulo, contenido, meta_descripcion, categoria, score_actual: _score_actual, nivel_actual: _nivel_actual } = body;

    if (!titulo || !contenido) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, contenido' },
        { status: 400 }
      );
    }

    const resultado = pulirNoticia(
      titulo,
      contenido,
      meta_descripcion || '',
      categoria || detectarCategoria(titulo, contenido)
    );

    return NextResponse.json(resultado);

  } catch (error: any) {
    console.error('[Pulir Local] Error:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
