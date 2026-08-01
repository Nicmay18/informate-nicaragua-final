// editorialEnhancer no evalúa cantidad de palabras.
// Evalúa si el contenido aporta información nueva, contexto, antecedentes, consecuencias, impacto e instituciones.
export interface EditorialEnhancerInput {
  titulo: string;
  contenido: string;
  categoria: string;
  meniResult: any;
}

export interface EditorialEnhancerResult {
  preguntasSinResponder: string[];
  informacionFaltante: string[];
  seccionesRecomendadas: string[];
  oportunidadesValor: string[];
  riesgosEditoriales: string[];
  prioridad: 'Alta' | 'Media' | 'Baja';
  resumenEditor: string;
}

export interface CheckItem {
  pregunta: string;
  informacion: string;
  seccion: string;
  oportunidad: string;
  riesgo: string;
  keywords: string[];
}

export const BASEL_POR_CATEGORIA: Record<string, CheckItem[]> = {
  sucesos: [
    {
      pregunta: '¿Qué ocurrió primero, qué ocurrió después y en qué horario?',
      informacion: 'Cronología confirmada del suceso',
      seccion: 'Cronología del hecho',
      oportunidad: 'Permitir al lector reconstruir el orden de los hechos',
      riesgo: 'No inventar horas exactas ni orden de eventos sin fuente',
      keywords: ['primero', 'luego', 'despues', 'posteriormente', 'antes', 'ayer', 'horas', 'minutos', 'mientras', 'inicialmente', 'finalmente', 'tras'],
    },
    {
      pregunta: '¿Qué hicieron las autoridades y qué instancia investiga?',
      informacion: 'Respuesta institucional',
      seccion: 'Actuación de autoridades',
      oportunidad: 'Aportar confianza y verificabilidad',
      riesgo: 'No atribuir declaraciones ni acciones sin comunicado',
      keywords: ['autoridades', 'policia', 'bomberos', 'fiscalia', 'ministerio', 'gobierno', 'institucion', 'delegacion', 'comision'],
    },
    {
      pregunta: '¿Cómo afecta esto a la comunidad?',
      informacion: 'Impacto comunitario',
      seccion: 'Contexto social',
      oportunidad: 'Humanizar sin explotar el dolor',
      riesgo: 'No inventar reacciones de familiares ni vecinos',
      keywords: ['comunidad', 'familia', 'vecinos', 'barrio', 'sociedad', 'reaccion'],
    },
    {
      pregunta: '¿Qué puede hacer una persona para prevenir una situación similar?',
      informacion: 'Recomendación de prevención',
      seccion: 'Prevención',
      oportunidad: 'Aumentar utilidad práctica',
      riesgo: 'No inventar rutas ni teléfonos sin fuente',
      keywords: ['prevenir', 'prevencion', 'evitar', 'proteccion', 'ruta', 'denuncia'],
    },
    {
      pregunta: '¿Qué ley o normativa aplica?',
      informacion: 'Norma aplicable',
      seccion: 'Marco legal',
      oportunidad: 'Contextualizar las consecuencias jurídicas',
      riesgo: 'No interpretar la ley sin asesoría ni fuente',
      keywords: ['ley', 'normativa', 'articulo', 'codigo', 'penal', 'ley 779'],
    },
  ],
  nacionales: [
    {
      pregunta: '¿A quién afecta esta decisión y cómo?',
      informacion: 'Efecto práctico para el lector',
      seccion: 'Impacto ciudadano',
      oportunidad: 'Explicar por qué le importa al ciudadano',
      riesgo: 'No inventar casos personales ni cifras',
      keywords: ['afecta', 'ciudadano', 'usuario', 'beneficiario', 'hogar', 'familia', 'poblacion'],
    },
    {
      pregunta: '¿Qué decisiones o hechos anteriores explican este anuncio?',
      informacion: 'Contexto histórico reciente',
      seccion: 'Antecedentes',
      oportunidad: 'Ayudar al lector a entender la continuidad',
      riesgo: 'No inventar antecedentes no verificados',
      keywords: ['anterior', 'anteriormente', 'antes', 'desde', 'pasado', 'previamente', '2024', '2023'],
    },
    {
      pregunta: '¿Qué instituciones están involucradas?',
      informacion: 'Entes responsables',
      seccion: 'Instituciones',
      oportunidad: 'Fortalecer EEAT',
      riesgo: 'No atribuir responsabilidad sin fuente',
      keywords: ['ministerio', 'institucion', 'ente', 'direccion', 'gobernacion', 'alcaldia'],
    },
    {
      pregunta: '¿Hay cifras o comparaciones que permitan dimensionar el tema?',
      informacion: 'Cifra verificable',
      seccion: 'Datos comparativos',
      oportunidad: 'Aportar evidencia concreta',
      riesgo: 'No inventar porcentajes ni totales',
      keywords: ['cifra', 'por ciento', 'porcentaje', 'total', 'miles', 'millones', 'comparacion', 'aumento', 'disminuyo'],
    },
  ],
  internacionales: [
    {
      pregunta: '¿Por qué este tema importa a Nicaragua?',
      informacion: 'Conexión nacional',
      seccion: 'Impacto para Nicaragua',
      oportunidad: 'Diferenciar la cobertura de agencias internacionales',
      riesgo: 'No inventar afectación a nicaragüenses',
      keywords: ['nicaragua', 'nicaraguense', 'centroamerica', 'region'],
    },
    {
      pregunta: '¿Cómo repercute en la región?',
      informacion: 'Consecuencia para Centroamérica',
      seccion: 'Impacto regional',
      oportunidad: 'Ampliar contexto',
      riesgo: 'No extrapolar efectos sin evidencia',
      keywords: ['region', 'centroamerica', 'paises', 'vecinos', 'migracion', 'economia'],
    },
    {
      pregunta: '¿Cuál es el contexto internacional del hecho?',
      informacion: 'Situación previa del país o región',
      seccion: 'Contexto internacional',
      oportunidad: 'Situar al lector',
      riesgo: 'No simplificar conflictos o posiciones oficiales',
      keywords: ['pais', 'gobierno', 'nacion', 'internacional', 'crisis', 'conflicto'],
    },
  ],
  deportes: [
    {
      pregunta: '¿Cuál es la trayectoria del protagonista?',
      informacion: 'Historial deportivo',
      seccion: 'Trayectoria del protagonista',
      oportunidad: 'Contextualizar el logro',
      riesgo: 'No inventar datos de clubes o años',
      keywords: ['trayectoria', 'carrera', 'debut', 'temporada', 'club', 'seleccion'],
    },
    {
      pregunta: '¿Por qué este logro es histórico?',
      informacion: 'Dato histórico del evento',
      seccion: 'Importancia histórica',
      oportunidad: 'Aumentar originalidad',
      riesgo: 'No afirmar récords no confirmados',
      keywords: ['historia', 'historico', 'primera vez', 'record', 'medalla', 'titulo'],
    },
    {
      pregunta: '¿Qué datos definen al protagonista?',
      informacion: 'Estadísticas personales',
      seccion: 'Datos del protagonista',
      oportunidad: 'Fortalecer perfil',
      riesgo: 'No inventar estadísticas',
      keywords: ['edad', 'nacimiento', 'goles', 'puntos', 'partidos', 'ano'],
    },
    {
      pregunta: '¿Qué significa para Nicaragua?',
      informacion: 'Impacto deportivo nacional',
      seccion: 'Significado para Nicaragua',
      oportunidad: 'Conectar con el público local',
      riesgo: 'No exagerar importancia sin evidencia',
      keywords: ['nicaragua', 'seleccion', 'pais', 'orgullo', 'deporte nacional'],
    },
  ],
  cultura: [
    {
      pregunta: '¿Cuál es la historia del evento, artista o tradición?',
      informacion: 'Antecedente cultural',
      seccion: 'Historia',
      oportunidad: 'Aportar profundidad',
      riesgo: 'No inventar biografías ni fechas',
      keywords: ['historia', 'origen', 'fundacion', 'comenzo', 'desde', 'ano', 'edad'],
    },
    {
      pregunta: '¿Qué significa esta obra o evento?',
      informacion: 'Relevancia cultural',
      seccion: 'Significado',
      oportunidad: 'Conectar con el lector',
      riesgo: 'No atribuir interpretaciones sin fuente',
      keywords: ['significado', 'representa', 'simboliza', 'importancia', 'valor'],
    },
    {
      pregunta: '¿Cómo se vincula con el contexto local?',
      informacion: 'Vínculo con Nicaragua',
      seccion: 'Contexto local',
      oportunidad: 'Diferenciar cobertura',
      riesgo: 'No inventar relevancia comunitaria',
      keywords: ['managua', 'nicaragua', 'comunidad', 'local', 'tradicion', 'patrimonio'],
    },
  ],
  tecnologia: [
    {
      pregunta: '¿Para qué sirve esta tecnología en la práctica?',
      informacion: 'Caso de uso real',
      seccion: 'Utilidad práctica',
      oportunidad: 'Responder la intención del usuario',
      riesgo: 'No inventar usos no documentados',
      keywords: ['sirve', 'util', 'usar', 'aplicacion', 'funcion', 'beneficio'],
    },
    {
      pregunta: '¿Qué cambia para el usuario?',
      informacion: 'Diferencia con la versión anterior',
      seccion: 'Cambios para usuarios',
      oportunidad: 'Clarificar impacto',
      riesgo: 'No afirmar funciones no anunciadas',
      keywords: ['cambio', 'nuevo', 'ahora', 'antes', 'mejora', 'actualizacion'],
    },
    {
      pregunta: '¿Qué impacto o riesgo tiene?',
      informacion: 'Beneficios y riesgos documentados',
      seccion: 'Impacto',
      oportunidad: 'Aportar equilibrio informativo',
      riesgo: 'No inventar riesgos ni estudios',
      keywords: ['impacto', 'consecuencia', 'efecto', 'riesgo', 'seguridad', 'privacidad'],
    },
  ],
};

export const GENERICOS: CheckItem[] = [
  {
    pregunta: '¿Por qué importa esta noticia?',
    informacion: 'Contexto general',
    seccion: 'Contexto',
    oportunidad: 'Explicar relevancia',
    riesgo: 'No inventar importancia',
    keywords: ['importante', 'relevante', 'significa', 'impacta'],
  },
  {
    pregunta: '¿Qué antecedentes explican este hecho?',
    informacion: 'Antecedente verificable',
    seccion: 'Antecedentes',
    oportunidad: 'Situar al lector',
    riesgo: 'No inventar antecedentes',
    keywords: ['anterior', 'previamente', 'desde', 'pasado', 'antecedente'],
  },
  {
    pregunta: '¿Qué consecuencias tiene?',
    informacion: 'Consecuencia verificable',
    seccion: 'Consecuencias',
    oportunidad: 'Aumentar utilidad',
    riesgo: 'No extrapolar sin evidencia',
    keywords: ['consecuencia', 'resultado', 'efecto', 'impacto'],
  },
];

export function normalizarTexto(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function contieneAlguna(texto: string, keywords: string[]): boolean {
  return keywords.some((k) => texto.includes(k));
}

function obtenerChecks(categoria: string): CheckItem[] {
  const cat = (categoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (cat.includes('suceso')) return BASEL_POR_CATEGORIA.sucesos;
  if (cat.includes('nacional')) return BASEL_POR_CATEGORIA.nacionales;
  if (cat.includes('internacional')) return BASEL_POR_CATEGORIA.internacionales;
  if (cat.includes('deporte')) return BASEL_POR_CATEGORIA.deportes;
  if (cat.includes('cultura')) return BASEL_POR_CATEGORIA.cultura;
  if (cat.includes('tecnolog')) return BASEL_POR_CATEGORIA.tecnologia;
  return GENERICOS;
}

export function editorialEnhancer(input: EditorialEnhancerInput): EditorialEnhancerResult {
  const { titulo, contenido, categoria, meniResult } = input;
  const texto = normalizarTexto(contenido);
  const checks = obtenerChecks(categoria);

  const preguntasSinResponder = new Set<string>();
  const informacionFaltante = new Set<string>();
  const seccionesRecomendadas = new Set<string>();
  const oportunidadesValor = new Set<string>();
  const riesgosEditoriales = new Set<string>();

  for (const check of checks) {
    if (!contieneAlguna(texto, check.keywords)) {
      preguntasSinResponder.add(`Falta investigar: ${check.pregunta}`);
      informacionFaltante.add(`Falta conseguir: ${check.informacion}`);
      seccionesRecomendadas.add(check.seccion);
      oportunidadesValor.add(check.oportunidad);
      riesgosEditoriales.add(`Si se agrega esta sección, evitar: ${check.riesgo}`);
    }
  }

  if (meniResult?.valorEditorial?.preguntasAbiertas?.length) {
    for (const p of meniResult.valorEditorial.preguntasAbiertas) {
      preguntasSinResponder.add(`Pregunta abierta de MENI: ${p}`);
    }
  }

  if (meniResult?.recomendaciones?.length) {
    for (const r of meniResult.recomendaciones) {
      const m = r?.mensaje || r?.punto || JSON.stringify(r);
      if (m) {
        riesgosEditoriales.add(`Recomendación MENI: ${m}`);
        if (m.toLowerCase().includes('contexto') || m.toLowerCase().includes('antecedente')) {
          informacionFaltante.add(`Falta investigar: ${m}`);
        }
      }
    }
  }

  const total = checks.length;
  const faltantes = preguntasSinResponder.size;
  const score = typeof meniResult?.scoreFinal === 'number' ? meniResult.scoreFinal : 100;

  let prioridad: 'Alta' | 'Media' | 'Baja' = 'Baja';
  if (faltantes >= total * 0.5 || score < 80) {
    prioridad = 'Alta';
  } else if (faltantes >= total * 0.25 || score < 90) {
    prioridad = 'Media';
  }

  const respondidas = total - faltantes > 0 ? total - faltantes : 0;
  const resumenEditor = `La noticia "${(titulo || '').replace(/\s+/g, ' ').trim()}" responde ${respondidas} de ${total} preguntas editoriales clave para la categoría ${categoria}. Prioridad: ${prioridad}.${faltantes > 0 ? ' Hace falta: ' + [...informacionFaltante].slice(0, 3).join('; ') + '.' : ' Sin faltantes editoriales detectados.'}`;

  return {
    preguntasSinResponder: [...preguntasSinResponder].slice(0, 10),
    informacionFaltante: [...informacionFaltante].slice(0, 10),
    seccionesRecomendadas: [...seccionesRecomendadas].slice(0, 10),
    oportunidadesValor: [...oportunidadesValor].slice(0, 10),
    riesgosEditoriales: [...riesgosEditoriales].slice(0, 10),
    prioridad,
    resumenEditor,
  };
}
