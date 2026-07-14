/**
 * Perfiles editoriales por vertical
 * ================================
 * Cada categoría periodística tiene su propio lenguaje, evidencia aceptada,
 * utilidad esperada, sugerencias, benchmark y criterios EEAT.
 *
 * Regla de oro: no se toca engine.ts; este módulo se consume desde
 * analizador-noticias.ts para reemplazar las sugerencias genéricas por
 * recomendaciones especializadas.
 */

import type { EvidenciaPuntuada } from './engine';
import type { NoticiaInput, SugerenciaV7 } from '../analizador-noticias';

export type VerticalEditorial =
  | 'Sucesos'
  | 'Nacionales'
  | 'Internacionales'
  | 'Deportes'
  | 'Tecnología'
  | 'Espectáculos'
  | 'Economía'
  | 'Política'
  | 'Opinión'
  | 'Servicio'
  | 'General';

export interface ResumenPerfilEditorial {
  vertical: VerticalEditorial;
  criterios: string[];
  evidenciaAceptada: string[];
  utilidad: string[];
  contexto: string[];
  preguntas: string[];
  benchmark: string[];
  ee: string[];
}

export interface PerfilEditorial {
  vertical: VerticalEditorial;
  alias: string[];
  criterios: string[];
  evidenciaAceptada: string[];
  utilidad: string[];
  contexto: string[];
  preguntas: string[];
  sugerencias: {
    oportunidadesEditoriales: SugerenciaV7[];
    comoConvertirReferencia: SugerenciaV7[];
    nivel10: SugerenciaV7[];
  };
  benchmark: string[];
  ee: string[];
}

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const fabricarSugerencia = (
  texto: string,
  impacto: string,
  tiempo: string,
  dificultad: 'Baja' | 'Media' | 'Alta',
  beneficio: string
): SugerenciaV7 => ({ texto, impacto, tiempo, dificultad, beneficio });

export function detectarVertical(noticia: NoticiaInput): VerticalEditorial {
  const cat = norm(noticia.categoria || '');
  const mapa: [string[], VerticalEditorial][] = [
    [['suceso', 'sucesos', 'policial', 'policiales', 'judicial', 'judiciales', 'transito', 'emergencia', 'emergencias', 'crimen', 'seguridad'], 'Sucesos'],
    [['nacional', 'nacionales', 'pais', 'nicaragua', 'actualidad'], 'Nacionales'],
    [['internacional', 'internacionales', 'mundo', 'global', 'exterior'], 'Internacionales'],
    [['deporte', 'deportes', 'beisbol', 'futbol', 'boxeo', 'atletismo', 'liga'], 'Deportes'],
    [['tecnologia', 'tech', 'digital', 'internet', 'software', 'hardware', 'apps'], 'Tecnología'],
    [['espectaculo', 'espectaculos', 'cultura', 'famosos', 'entretenimiento', 'cine', 'musica'], 'Espectáculos'],
    [['economia', 'economicas', 'finanzas', 'negocios', 'mercado'], 'Economía'],
    [['politica', 'politicas', 'gobierno', 'asamblea', 'leyes'], 'Política'],
    [['opinion', 'opinion', 'columna', 'editorial'], 'Opinión'],
    [['servicio', 'servicios', 'guia', 'tutoriales', 'preguntas frecuentes', 'faq'], 'Servicio'],
  ];

  for (const [alias, vertical] of mapa) {
    if (alias.some(a => cat.includes(a))) return vertical;
  }
  return 'General';
}

export function evidenciaAceptadaPorVertical(vertical: VerticalEditorial): string[] {
  return perfiles.find(p => p.vertical === vertical)?.evidenciaAceptada || perfiles[perfiles.length - 1].evidenciaAceptada;
}

export function benchmarkPorVertical(vertical: VerticalEditorial): string[] {
  return perfiles.find(p => p.vertical === vertical)?.benchmark || [];
}

export function criteriosPorVertical(vertical: VerticalEditorial): string[] {
  return perfiles.find(p => p.vertical === vertical)?.criterios || [];
}

export function utilidadPorVertical(vertical: VerticalEditorial): string[] {
  return perfiles.find(p => p.vertical === vertical)?.utilidad || [];
}

export function contextoPorVertical(vertical: VerticalEditorial): string[] {
  return perfiles.find(p => p.vertical === vertical)?.contexto || [];
}

export function preguntasPorVertical(vertical: VerticalEditorial): string[] {
  return perfiles.find(p => p.vertical === vertical)?.preguntas || [];
}

export function eePorVertical(vertical: VerticalEditorial): string[] {
  return perfiles.find(p => p.vertical === vertical)?.ee || [];
}

export function resumenPerfilEditorial(vertical: VerticalEditorial): ResumenPerfilEditorial {
  const p = perfiles.find(x => x.vertical === vertical) || perfiles[perfiles.length - 1];
  return {
    vertical: p.vertical,
    criterios: p.criterios,
    evidenciaAceptada: p.evidenciaAceptada,
    utilidad: p.utilidad,
    contexto: p.contexto,
    preguntas: p.preguntas,
    benchmark: p.benchmark,
    ee: p.ee,
  };
}

const perfiles: PerfilEditorial[] = [
  {
    vertical: 'Sucesos',
    alias: ['sucesos', 'policial', 'judicial', 'tránsito', 'emergencias'],
    criterios: [
      'Respetar presunción de inocencia.',
      'No asumir culpabilidad.',
      'Reconstruir hechos con datos verificables.',
      'Distinguir hechos confirmados de testimonios.',
      'Si la nota reconstruye hechos → Cobertura.',
      'Si existe investigación propia → Reportaje.',
    ],
    evidenciaAceptada: [
      'Policía Nacional',
      'Bomberos',
      'Hospital o centro de salud',
      'Medicina Legal',
      'COMUPRED / SINAPRED',
      'Vecinos identificados',
      'Testigos identificados',
      'Videos verificables',
      'Fotografías de campo',
      'Reportes de campo publicados',
      'Medios citados',
      'Familiares identificados',
      'Organizaciones civiles',
    ],
    utilidad: ['prevenir', 'explicar', 'cronología', 'contexto', 'antecedentes'],
    contexto: ['zona del hecho', 'hora', 'víctimas', 'estado de la investigación'],
    preguntas: [
      '¿Qué ocurrió exactamente?',
      '¿Cuándo y dónde sucedió?',
      '¿Quiénes están involucrados?',
      '¿Qué dice la fuente oficial?',
      '¿Hay testigos o familiares identificados?',
      '¿Cuál es el estado actual del hecho?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Citar la fuente institucional que confirmó el hecho (Policía, Bomberos, COMUPRED, Medicina Legal u hospital).',
          'Dato verificado.',
          '10-20 min',
          'Baja',
          'Reduce especulación y rumores.'
        ),
        fabricarSugerencia(
          'Incluir cronología precisa: fecha, hora, lugar y secuencia de hechos verificables.',
          'Precisión factual.',
          '10-20 min',
          'Baja',
          'Mejora comprensión del lector.'
        ),
        fabricarSugerencia(
          'Agregar contexto sobre incidentes similares recientes en la misma zona o período.',
          'Contexto de patrón.',
          '15-30 min',
          'Media',
          'Aporta relevancia local.'
        ),
        fabricarSugerencia(
          'Explicitar medidas de prevención o recomendaciones de seguridad pública si son pertinentes.',
          'Utilidad práctica.',
          '10-20 min',
          'Baja',
          'Convierte la nota en servicio.'
        ),
        fabricarSugerencia(
          'Separar claramente los hechos confirmados de testimonios, versiones o hipótesis.',
          'Rigor editorial.',
          '10-15 min',
          'Baja',
          'Protege contra desmentidos.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Construir una línea de tiempo con fuentes oficiales y testimonios identificados.',
          'Reconstrucción verificable.',
          '30-60 min',
          'Media',
          'Eleva autoridad de la pieza.'
        ),
        fabricarSugerencia(
          'Comparar con datos oficiales de incidentes similares en el mismo período.',
          'Contexto estadístico.',
          '1-2 días',
          'Media',
          'Amplía relevancia.'
        ),
        fabricarSugerencia(
          'Actualizar la nota cuando se publique un parte oficial nuevo o cambie el estado de las víctimas.',
          'Vigencia.',
          '10-20 min',
          'Baja',
          'Mantiene la pieza actualizada.'
        ),
        fabricarSugerencia(
          'Incluir la versión de un familiar o testigo identificado, si ya es información pública.',
          'Humanización verificada.',
          '20-30 min',
          'Media',
          'Aumenta cercanía sin especular.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Mapa de incidentes por departamento o municipio con datos oficiales.',
          'Datos visuales.',
          '2-3 días',
          'Alta',
          'Consulta recurrente.'
        ),
        fabricarSugerencia(
          'Guía de prevención basada en recomendaciones públicas de COMUPRED o Bomberos.',
          'Evergreen de servicio.',
          '1 día',
          'Baja',
          'Tráfico sostenido.'
        ),
      ],
    },
    benchmark: ['TN8', 'Canal 10', 'Radio Ya'],
    ee: [
      'Experiencia contrastada en cobertura de sucesos.',
      'Autoridad: citar instituciones oficiales con nombre y cargo.',
      'Confianza: respetar presunción de inocencia.',
      'Relevancia local inmediata.',
    ],
  },
  {
    vertical: 'Nacionales',
    alias: ['nacionales', 'país', 'actualidad'],
    criterios: [
      'Buscar impacto ciudadano.',
      'Identificar instituciones involucradas.',
      'Aportar servicio: pasos, plazos o derechos.',
      'Incluir contexto y antecedentes.',
      'Mencionar marco legal cuando aplique.',
    ],
    evidenciaAceptada: [
      'Instituciones nacionales',
      'Comunicados oficiales',
      'Datos públicos',
      'Voceros identificados',
      'Medios nacionales reconocidos',
      'Documentos públicos',
    ],
    utilidad: ['entender impacto', 'conocer trámites', 'defender derechos', 'tomar decisiones'],
    contexto: ['institución responsable', 'historial de la política', 'afectados directos'],
    preguntas: [
      '¿Qué institución está involucrada?',
      '¿Cómo afecta al ciudadano común?',
      '¿Hay un marco legal o decreto aplicable?',
      '¿Cuáles son los pasos a seguir?',
      '¿Existen antecedentes similares?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Citar la institución oficial o comunicado que respalde la información central.',
          'Credibilidad institucional.',
          '10-20 min',
          'Baja',
          'Reduce riesgo de desmentido.'
        ),
        fabricarSugerencia(
          'Explicar el impacto directo en el ciudadano: trámites, derechos, plazos o costos.',
          'Utilidad pública.',
          '15-30 min',
          'Media',
          'Convierte la nota en servicio.'
        ),
        fabricarSugerencia(
          'Agregar antecedentes de decisiones, políticas o hechos similares anteriores.',
          'Contexto nacional.',
          '20-40 min',
          'Media',
          'Aporta profundidad.'
        ),
        fabricarSugerencia(
          'Incluir el marco legal, decreto o normativa aplicable si es información pública.',
          'Precisión jurídica.',
          '15-30 min',
          'Media',
          'Eleva rigor.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Obtener el comunicado oficial o datos de la institución responsable.',
          'Documento verificable.',
          '30-60 min',
          'Media',
          'Referencia documentada.'
        ),
        fabricarSugerencia(
          'Comparar con políticas o hechos anteriores del mismo organismo.',
          'Contexto histórico.',
          '1-2 días',
          'Media',
          'Relevancia nacional.'
        ),
        fabricarSugerencia(
          'Actualizar cuando la institución publique nuevos datos o resoluciones.',
          'Vigencia.',
          '10-20 min',
          'Baja',
          'Mantiene la pieza útil.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Análisis del impacto de la medida con datos oficiales y testimonios identificados.',
          'Análisis de fondo.',
          '2-4 días',
          'Alta',
          'Autoridad editorial.'
        ),
        fabricarSugerencia(
          'Guía práctica de trámites o derechos afectados.',
          'Evergreen de servicio.',
          '1 día',
          'Baja',
          'Tráfico sostenido.'
        ),
      ],
    },
    benchmark: ['Confidencial', 'La Prensa', '100% Noticias'],
    ee: [
      'Dominio del contexto institucional nicaragüense.',
      'Autoridad: citar fuentes oficiales por nombre.',
      'Confianza: explicar impacto real en el lector.',
    ],
  },
  {
    vertical: 'Internacionales',
    alias: ['internacionales', 'mundo', 'global'],
    criterios: [
      'Contextualizar en escenario mundial.',
      'Explicar el fenómeno.',
      'Incluir antecedentes.',
      'Medir impacto para Nicaragua.',
      'Aceptar agencias y medios reconocidos.',
    ],
    evidenciaAceptada: [
      'ONU',
      'Reuters',
      'Associated Press (AP)',
      'AFP',
      'BBC',
      'Deutsche Welle (DW)',
      'CNN',
      'Gobiernos oficiales',
      'Agencias internacionales reconocidas',
      'Medios extranjeros con corresponsalía',
    ],
    utilidad: ['contexto mundial', 'impacto en Nicaragua', 'geopolítica', 'migración', 'economía'],
    contexto: ['países involucrados', 'organismos internacionales', 'efectos regionales'],
    preguntas: [
      '¿Qué ocurrió y dónde?',
      '¿Por qué importa para Nicaragua?',
      '¿Qué dicen agencias internacionales?',
      '¿Hay impacto económico o migratorio?',
      '¿Cuáles son los antecedentes?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Situar la noticia en su contexto internacional con fuentes reconocidas.',
          'Contexto global.',
          '15-30 min',
          'Media',
          'Evita desinformación local.'
        ),
        fabricarSugerencia(
          'Explicitar la relevancia para Nicaragua: migración, economía, geopolítica o comercio.',
          'Utilidad local.',
          '15-30 min',
          'Media',
          'Conecta con el lector.'
        ),
        fabricarSugerencia(
          'Incluir antecedentes del conflicto, acuerdo, sanción o evento.',
          'Profundidad.',
          '20-40 min',
          'Media',
          'Mejora comprensión.'
        ),
        fabricarSugerencia(
          'Citar agencias internacionales o gobiernos oficiales para datos centrales.',
          'Credibilidad.',
          '10-20 min',
          'Baja',
          'Autoridad factual.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Ampliar con análisis de impacto concreto para Nicaragua.',
          'Relevancia nacional.',
          '1-2 días',
          'Media',
          'Diferenciación.'
        ),
        fabricarSugerencia(
          'Comparar con posiciones oficiales del país u organismos regionales.',
          'Contexto geopolítico.',
          '1-2 días',
          'Media',
          'Aporta ángulo local.'
        ),
        fabricarSugerencia(
          'Actualizar con reacciones de organismos internacionales o cambios en el escenario.',
          'Vigencia.',
          '20-30 min',
          'Baja',
          'Mantiene actualizado.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Análisis de relación Nicaragua-país o tema internacional con datos.',
          'Análisis de fondo.',
          '2-4 días',
          'Alta',
          'Autoridad editorial.'
        ),
        fabricarSugerencia(
          'Guía sobre cómo afecta a nicaragüenses residentes en el exterior o en el país.',
          'Servicio.',
          '1-2 días',
          'Media',
          'Tráfico sostenido.'
        ),
      ],
    },
    benchmark: ['Reuters', 'AP', 'AFP', 'BBC', 'DW', 'CNN'],
    ee: [
      'Dominio de contexto geopolítico.',
      'Autoridad: citar agencias y gobiernos oficiales.',
      'Confianza: traducir el impacto para Nicaragua.',
    ],
  },
  {
    vertical: 'Deportes',
    alias: ['deportes', 'beisbol', 'fútbol', 'boxeo'],
    criterios: [
      'Priorizar resultado.',
      'Incluir estadísticas.',
      'Mencionar alineaciones.',
      'Actualizar tabla o clasificación.',
      'Agregar calendario.',
      'Destacar figuras.',
      'Contexto deportivo.',
    ],
    evidenciaAceptada: [
      'Liga oficial',
      'Federación',
      'Acta del partido',
      'Tabla oficial',
      'Comunicado del club',
      'Medios deportivos reconocidos',
      'Estadísticas oficiales',
    ],
    utilidad: ['comprender torneo', 'seguir clasificación', 'conocer próximos partidos', 'identificar figuras'],
    contexto: ['torneo', 'equipo', 'jugador', 'racha reciente'],
    preguntas: [
      '¿Cuál fue el resultado?',
      '¿Quiénes jugaron?',
      '¿Cómo queda la clasificación?',
      '¿Cuándo es el próximo partido?',
      '¿Quién fue la figura?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Incluir resultado, marcador y estadísticas clave del partido o evento.',
          'Dato central.',
          '5-15 min',
          'Baja',
          'Satisfacción inmediata del lector.'
        ),
        fabricarSugerencia(
          'Mencionar alineaciones, goles, anotaciones o figuras destacadas.',
          'Precisión deportiva.',
          '10-20 min',
          'Baja',
          'Aumenta interés.'
        ),
        fabricarSugerencia(
          'Actualizar tabla de posiciones, clasificación o ronda del torneo.',
          'Contexto de competencia.',
          '10-20 min',
          'Baja',
          'Utilidad recurrente.'
        ),
        fabricarSugerencia(
          'Agregar calendario y próximos enfrentamientos del equipo o competidor.',
          'Servicio al aficionado.',
          '10-20 min',
          'Baja',
          'Fideliza al lector.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Citar acta, liga, federación o comunicado oficial del club.',
          'Documento verificable.',
          '20-30 min',
          'Media',
          'Autoridad deportiva.'
        ),
        fabricarSugerencia(
          'Comparar con histórico reciente del equipo o jugador.',
          'Contexto.',
          '30-60 min',
          'Media',
          'Aporta perspectiva.'
        ),
        fabricarSugerencia(
          'Construir cronología del torneo o serie con fechas y resultados.',
          'Línea de tiempo.',
          '30-60 min',
          'Media',
          'Comprensión del campeonato.'
        ),
        fabricarSugerencia(
          'Actualizar con resultados o comunicados oficiales posteriores.',
          'Vigencia.',
          '10-20 min',
          'Baja',
          'Mantiene utilidad.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Análisis de rendimiento del equipo con estadísticas oficiales.',
          'Análisis.',
          '2-4 días',
          'Alta',
          'Autoridad deportiva.'
        ),
        fabricarSugerencia(
          'Guía de calendario, posibles rivales y formato del torneo.',
          'Evergreen.',
          '1 día',
          'Baja',
          'Tráfico sostenido.'
        ),
      ],
    },
    benchmark: ['ESPN', 'Marca', 'AS'],
    ee: [
      'Experiencia en cobertura deportiva.',
      'Autoridad: citar liga, federación o acta oficial.',
      'Confianza: datos estadísticos verificables.',
    ],
  },
  {
    vertical: 'Tecnología',
    alias: ['tecnología', 'tech', 'digital'],
    criterios: [
      'Explicar qué cambia.',
      'Describir cómo funciona.',
      'Mencionar beneficios y riesgos.',
      'Incluir compatibilidad.',
      'Analizar privacidad.',
      'Mencionar precio y disponibilidad.',
      'Incluir fechas y versiones.',
    ],
    evidenciaAceptada: [
      'Apple',
      'Google',
      'OpenAI',
      'GitHub',
      'Documentación oficial',
      'Blogs oficiales de empresas',
      'Medios tecnológicos reconocidos',
      'Investigadores o analistas identificados',
    ],
    utilidad: ['cómo afecta al usuario', 'qué cambia', 'cómo funciona', 'riesgos y beneficios'],
    contexto: ['plataforma', 'versión', 'mercado objetivo', 'disponibilidad en Nicaragua'],
    preguntas: [
      '¿Qué cambia con esto?',
      '¿Cómo funciona?',
      '¿Es seguro para la privacidad?',
      '¿Cuánto cuesta y dónde está disponible?',
      '¿Afecta a usuarios de Nicaragua?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Explicar qué cambia y cómo funciona la tecnología en lenguaje claro.',
          'Comprensión.',
          '20-40 min',
          'Media',
          'Reduce barrera técnica.'
        ),
        fabricarSugerencia(
          'Mencionar versiones, compatibilidad, requisitos y disponibilidad.',
          'Utilidad práctica.',
          '15-30 min',
          'Media',
          'Ayuda al lector a decidir.'
        ),
        fabricarSugerencia(
          'Analizar riesgos de privacidad, seguridad o dependencia tecnológica.',
          'Profundidad.',
          '20-40 min',
          'Media',
          'Diferenciación.'
        ),
        fabricarSugerencia(
          'Incluir precio, fecha de lanzamiento o regiones donde aplica.',
          'Dato concreto.',
          '10-20 min',
          'Baja',
          'Aumenta utilidad.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Citar documentación oficial del desarrollador o empresa.',
          'Fuente primaria.',
          '20-30 min',
          'Media',
          'Autoridad técnica.'
        ),
        fabricarSugerencia(
          'Comparar con versiones anteriores o alternativas del mercado.',
          'Contexto.',
          '30-60 min',
          'Media',
          'Aporta perspectiva.'
        ),
        fabricarSugerencia(
          'Actualizar cuando se publiquen parches, nuevas versiones o correcciones.',
          'Vigencia.',
          '10-20 min',
          'Baja',
          'Mantiene utilidad.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Guía de uso o configuración paso a paso para usuarios.',
          'Evergreen.',
          '1-2 días',
          'Media',
          'Tráfico sostenido.'
        ),
        fabricarSugerencia(
          'Análisis de impacto en privacidad y seguridad con datos verificables.',
          'Análisis.',
          '2-3 días',
          'Alta',
          'Autoridad.'
        ),
      ],
    },
    benchmark: ['The Verge', 'Ars Technica', 'TechCrunch', 'OpenAI'],
    ee: [
      'Dominio técnico y capacidad de traducción.',
      'Autoridad: citar documentación oficial.',
      'Confianza: separar promesas de hechos verificables.',
    ],
  },
  {
    vertical: 'Espectáculos',
    alias: ['espectáculos', 'cultura', 'entretenimiento', 'cine', 'música'],
    criterios: [
      'Priorizar trayectoria.',
      'Incluir contexto.',
      'Mencionar proyecto actual.',
      'Citar fuente oficial.',
      'Verificar redes oficiales.',
      'Citar comunicado.',
      'Distinguir rumores de hechos.',
    ],
    evidenciaAceptada: [
      'Comunicado oficial',
      'Representante identificado',
      'Red social oficial verificada',
      'Productora o sello discográfico',
      'Entrevista publicada',
      'Medios especializados reconocidos',
    ],
    utilidad: ['conocer proyecto', 'contexto artístico', 'información verificada'],
    contexto: ['trayectoria', 'obra', 'fecha de evento', 'plataforma'],
    preguntas: [
      '¿Quién es el artista o figura?',
      '¿Qué proyecto anuncia?',
      '¿Hay un comunicado oficial?',
      '¿Es un rumor o está confirmado?',
      '¿Dónde y cuándo ocurre el evento?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Citar comunicado oficial, representante o red social verificada.',
          'Verificación.',
          '10-20 min',
          'Baja',
          'Evita difundir rumores.'
        ),
        fabricarSugerencia(
          'Contextualizar con trayectoria del artista, proyecto o producción.',
          'Contexto.',
          '15-30 min',
          'Media',
          'Aumenta interés.'
        ),
        fabricarSugerencia(
          'Distinguir entre información confirmada y especulación o rumor.',
          'Rigor.',
          '10-15 min',
          'Baja',
          'Protege credibilidad.'
        ),
        fabricarSugerencia(
          'Incluir datos del evento, fecha, lugar o plataforma si aplica.',
          'Utilidad.',
          '10-20 min',
          'Baja',
          'Informa al lector.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Obtener declaración oficial o entrevista publicada.',
          'Fuente primaria.',
          '30-60 min',
          'Media',
          'Autoridad.'
        ),
        fabricarSugerencia(
          'Verificar información en redes oficiales o páginas oficiales del proyecto.',
          'Confirmación.',
          '10-20 min',
          'Baja',
          'Reduce desinformación.'
        ),
        fabricarSugerencia(
          'Actualizar si se confirman o desmienten rumores públicos.',
          'Vigencia.',
          '10-20 min',
          'Baja',
          'Mantiene precisión.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Perfil o trayectoria del artista con datos verificables.',
          'Evergreen.',
          '1-2 días',
          'Media',
          'Tráfico sostenido.'
        ),
        fabricarSugerencia(
          'Guía de eventos próximos y plataformas de transmisión.',
          'Servicio.',
          '1 día',
          'Baja',
          'Utilidad recurrente.'
        ),
      ],
    },
    benchmark: ['Billboard', 'Variety', 'People'],
    ee: [
      'Experiencia en cobertura de entretenimiento.',
      'Autoridad: citar fuentes oficiales.',
      'Confianza: no convertir rumores en hechos.',
    ],
  },
  {
    vertical: 'Economía',
    alias: ['economía', 'finanzas', 'negocios', 'mercado'],
    criterios: [
      'Buscar cifras.',
      'Analizar mercado.',
      'Medir impacto ciudadano.',
      'Mencionar precios.',
      'Identificar empresas.',
      'Citar instituciones.',
      'Contexto económico.',
    ],
    evidenciaAceptada: [
      'Banco Central de Nicaragua',
      'Instituciones financieras',
      'Comunicados empresariales',
      'Datos oficiales',
      'Medios económicos reconocidos',
      'Informes de mercado públicos',
    ],
    utilidad: ['cómo afecta al bolsillo', 'entender indicador', 'tomar decisiones'],
    contexto: ['indicador', 'tendencia', 'mercado', 'impacto en hogares'],
    preguntas: [
      '¿Cuáles son las cifras?',
      '¿Cómo afecta al ciudadano?',
      '¿Qué institución publicó los datos?',
      '¿Cuál es la tendencia?',
      '¿Hay comparación con meses o años anteriores?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Incluir cifras concretas: precios, tasas, montos o porcentajes.',
          'Precisión.',
          '10-20 min',
          'Baja',
          'Mejora factualidad.'
        ),
        fabricarSugerencia(
          'Explicar el impacto en el bolsillo del ciudadano o del sector.',
          'Utilidad.',
          '15-30 min',
          'Media',
          'Conecta con el lector.'
        ),
        fabricarSugerencia(
          'Citar institución o comunicado oficial que publicó el dato económico.',
          'Credibilidad.',
          '10-20 min',
          'Baja',
          'Reduce riesgo de desmentido.'
        ),
        fabricarSugerencia(
          'Agregar contexto de mercado o tendencia del indicador.',
          'Contexto.',
          '20-40 min',
          'Media',
          'Aporta profundidad.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Comparar con datos históricos del mismo indicador.',
          'Tendencia.',
          '1-2 días',
          'Media',
          'Aumenta relevancia.'
        ),
        fabricarSugerencia(
          'Construir gráfica o tabla explicativa con datos públicos.',
          'Visual.',
          '1-2 días',
          'Media',
          'Mejora comprensión.'
        ),
        fabricarSugerencia(
          'Actualizar cuando se publiquen nuevos datos oficiales.',
          'Vigencia.',
          '10-20 min',
          'Baja',
          'Mantiene utilidad.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Análisis de tendencia del indicador con datos oficiales.',
          'Análisis.',
          '2-4 días',
          'Alta',
          'Autoridad.'
        ),
        fabricarSugerencia(
          'Guía práctica: cómo afecta el cambio a la economía familiar.',
          'Evergreen.',
          '1 día',
          'Baja',
          'Tráfico sostenido.'
        ),
      ],
    },
    benchmark: ['Forbes', 'El Financiero', 'Bloomberg'],
    ee: [
      'Dominio de indicadores económicos.',
      'Autoridad: citar BCN o fuentes oficiales.',
      'Confianza: cifras verificables y comparables.',
    ],
  },
  {
    vertical: 'Política',
    alias: ['política', 'gobierno', 'asamblea'],
    criterios: [
      'Buscar leyes y decretos.',
      'Identificar instituciones.',
      'Mencionar partidos.',
      'Medir impacto ciudadano.',
      'Incluir marco jurídico.',
      'Construir cronología.',
    ],
    evidenciaAceptada: [
      'Asamblea Nacional',
      'Decretos publicados',
      'Leyes',
      'Comunicados de partidos',
      'Instituciones estatales',
      'Medios políticos reconocidos',
    ],
    utilidad: ['cómo afecta al ciudadano', 'entender decisión', 'conocer derechos'],
    contexto: ['institución', 'partido', 'marco jurídico', 'antecedente'],
    preguntas: [
      '¿Qué ley o decreto está involucrado?',
      '¿Quién lo promovió?',
      '¿Cómo impacta al ciudadano?',
      '¿Cuál es la cronología?',
      '¿Qué dicen las partes?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Citar ley, decreto o comunicado institucional aplicable.',
          'Fundamento jurídico.',
          '15-30 min',
          'Media',
          'Reduce riesgo de sesgo.'
        ),
        fabricarSugerencia(
          'Explicar el impacto concreto en el ciudadano.',
          'Utilidad pública.',
          '15-30 min',
          'Media',
          'Conecta con el lector.'
        ),
        fabricarSugerencia(
          'Incluir cronología de hechos, votaciones o publicaciones oficiales.',
          'Claridad.',
          '20-40 min',
          'Media',
          'Mejora comprensión.'
        ),
        fabricarSugerencia(
          'Mencionar partidos, instituciones o funcionarios involucrados por su nombre.',
      'Precisión.',
          '10-20 min',
          'Baja',
          'Aporta contexto.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Obtener documento oficial público: decreto, ley o resolución.',
          'Fuente primaria.',
          '30-60 min',
          'Media',
          'Autoridad.'
        ),
        fabricarSugerencia(
          'Comparar con legislación o decisiones políticas anteriores.',
          'Contexto histórico.',
          '1-2 días',
          'Media',
          'Aporta profundidad.'
        ),
        fabricarSugerencia(
          'Actualizar con reacciones oficiales o nuevas etapas del trámite.',
          'Vigencia.',
          '10-20 min',
          'Baja',
          'Mantiene actualizado.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Análisis del impacto de la medida con datos oficiales.',
          'Análisis.',
          '2-4 días',
          'Alta',
          'Autoridad.'
        ),
        fabricarSugerencia(
          'Guía de trámites o derechos afectados por la normativa.',
          'Servicio.',
          '1 día',
          'Baja',
          'Tráfico sostenido.'
        ),
      ],
    },
    benchmark: ['100% Noticias', 'Confidencial', 'La Prensa'],
    ee: [
      'Dominio del marco jurídico e institucional.',
      'Autoridad: citar documentos oficiales.',
      'Confianza: separar hechos de posiciones partidarias.',
    ],
  },
  {
    vertical: 'Opinión',
    alias: ['opinión', 'columna', 'editorial'],
    criterios: [
      'Presentar argumento claro.',
      'Fundamentar con datos o hechos.',
      'Identificar autor.',
      'Incluir contexto.',
      'Aportar propuesta o perspectiva.',
    ],
    evidenciaAceptada: [
      'Autor identificado',
      'Datos públicos',
      'Hechos verificables citados',
      'Fuentes documentadas',
      'Experiencia del autor',
    ],
    utilidad: ['entender perspectiva', 'contrastar argumentos', 'informar debate'],
    contexto: ['tema de actualidad', 'antecedente del debate', 'posturas'],
    preguntas: [
      '¿Cuál es la tesis del autor?',
      '¿Está fundamentada con datos o hechos?',
      '¿Quién escribe y por qué tiene autoridad?',
      '¿Qué contexto explica la opinión?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Presentar claramente la tesis o argumento central del texto.',
          'Claridad.',
          '10-15 min',
          'Baja',
          'Orienta al lector.'
        ),
        fabricarSugerencia(
          'Fundamentar la opinión con datos, hechos verificables o experiencia del autor.',
          'Rigor argumentativo.',
          '20-40 min',
          'Media',
          'Aumenta credibilidad.'
        ),
        fabricarSugerencia(
          'Contextualizar el tema de actualidad que motiva el texto.',
          'Contexto.',
          '15-30 min',
          'Media',
          'Ancla la opinión en hechos.'
        ),
        fabricarSugerencia(
          'Identificar al autor y su trayectoria en el tema.',
          'Autoridad.',
          '10-15 min',
          'Baja',
          'Refuerza EEAT.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Agregar enlaces a hechos o datos citados.',
          'Verificación.',
          '15-30 min',
          'Media',
          'Aumenta transparencia.'
        ),
        fabricarSugerencia(
          'Incluir contrapuntos o reacciones publicadas si existen.',
          'Pluralidad.',
          '20-30 min',
          'Media',
          'Enriquece el debate.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Columna de análisis con datos actualizados y perspectiva estructurada.',
          'Análisis.',
          '1-2 días',
          'Alta',
          'Autoridad.'
        ),
      ],
    },
    benchmark: ['El País', 'The New York Times Opinion', 'Semanario Universitario'],
    ee: [
      'Autoridad del columnista en el tema.',
      'Transparencia: separar opinión de hecho.',
      'Fundamentación con datos verificables.',
    ],
  },
  {
    vertical: 'Servicio',
    alias: ['servicio', 'guía', 'tutoriales', 'preguntas frecuentes'],
    criterios: [
      'Priorizar utilidad.',
      'Estructurar pasos.',
      'Incluir guía.',
      'Aportar prevención.',
      'Responder preguntas frecuentes.',
      'Decir qué hacer y cómo hacerlo.',
    ],
    evidenciaAceptada: [
      'Instituciones',
      'Guías oficiales',
      'Expertos identificados',
      'Datos verificables',
      'Páginas oficiales',
    ],
    utilidad: ['qué hacer', 'cómo hacerlo', 'dónde acudir', 'cómo prevenir'],
    contexto: ['problema o necesidad', 'pasos', 'plazos', 'requisitos'],
    preguntas: [
      '¿Qué debe hacer el lector?',
      '¿Cuáles son los pasos?',
      '¿Dónde acudir?',
      '¿Qué debe evitar?',
      '¿Cuáles son las preguntas más frecuentes?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Estructurar la respuesta en pasos concretos y numerados.',
          'Claridad.',
          '15-30 min',
          'Media',
          'Mejora utilidad.'
        ),
        fabricarSugerencia(
          'Incluir preguntas frecuentes con respuestas directas.',
          'Servicio.',
          '20-40 min',
          'Media',
          'Aumenta tráfico de búsqueda.'
        ),
        fabricarSugerencia(
          'Agregar teléfonos, plataformas, horarios o lugares de atención.',
          'Utilidad inmediata.',
          '10-20 min',
          'Baja',
          'Resuelve una necesidad.'
        ),
        fabricarSugerencia(
          'Mencionar prevención, alertas oficiales o errores comunes a evitar.',
          'Prevención.',
          '10-20 min',
          'Baja',
          'Protege al lector.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Actualizar con información oficial vigente y enlaces a fuentes.',
          'Confianza.',
          '15-30 min',
          'Media',
          'Mantiene vigencia.'
        ),
        fabricarSugerencia(
          'Agregar infografía o lista de verificación descargable.',
          'Visual.',
          '1-2 días',
          'Media',
          'Mejora comprensión.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Guía definitiva del trámite o servicio con actualización periódica.',
          'Evergreen.',
          '2-3 días',
          'Alta',
          'Tráfico recurrente.'
        ),
      ],
    },
    benchmark: ['The New York Times Wirecutter', 'Consumer Reports', 'Guías locales'],
    ee: [
      'Experiencia práctica en el tema.',
      'Actualización constante.',
      'Fuentes oficiales y pasos verificados.',
    ],
  },
  {
    vertical: 'General',
    alias: [],
    criterios: [
      'Citar fuente identificable.',
      'Incluir dato concreto.',
      'Explicitar utilidad.',
      'Agregar contexto.',
    ],
    evidenciaAceptada: [
      'Fuente oficial',
      'Medio reconocido',
      'Documento público',
      'Dato verificable',
    ],
    utilidad: ['informar', 'contextualizar', 'servir al lector'],
    contexto: ['antecedente', 'actor principal', 'impacto'],
    preguntas: [
      '¿Qué ocurrió?',
      '¿Quién está involucrado?',
      '¿Por qué importa?',
    ],
    sugerencias: {
      oportunidadesEditoriales: [
        fabricarSugerencia(
          'Citar con nombre y cargo la fuente oficial o medio que respalde el dato central.',
          'Credibilidad.',
          '10-20 min',
          'Baja',
          'Reduce riesgo de desmentido.'
        ),
        fabricarSugerencia(
          'Incorporar dato concreto: fecha, hora, lugar, cifra o cantidad verificable.',
          'Precisión.',
          '5-15 min',
          'Baja',
          'Mejora factualidad.'
        ),
        fabricarSugerencia(
          'Explicitar la utilidad práctica: qué gana el lector con esta información.',
          'Utilidad.',
          '10-20 min',
          'Baja',
          'Convierte en servicio.'
        ),
        fabricarSugerencia(
          'Agregar contexto legal, institucional o histórico breve con datos públicos.',
          'Contexto.',
          '15-30 min',
          'Media',
          'Aporta profundidad.'
        ),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia(
          'Citar documento oficial o declaración institucional pública disponible.',
          'Referencia.',
          '30-60 min',
          'Media',
          'Autoridad.'
        ),
        fabricarSugerencia(
          'Construir cronología o línea de tiempo con fechas verificables.',
          'Organización.',
          '30-60 min',
          'Media',
          'Comprensión.'
        ),
        fabricarSugerencia(
          'Actualizar cuando aparezcan nuevos datos públicos oficiales.',
          'Vigencia.',
          '10-20 min',
          'Baja',
          'Mantiene utilidad.'
        ),
      ],
      nivel10: [
        fabricarSugerencia(
          'Análisis de patrón con datos históricos públicos.',
          'Análisis.',
          '2-3 días',
          'Alta',
          'Autoridad.'
        ),
        fabricarSugerencia(
          'Guía práctica para el lector: pasos, medidas o recomendaciones.',
          'Evergreen.',
          '1 día',
          'Baja',
          'Tráfico sostenido.'
        ),
      ],
    },
    benchmark: ['Medios nacionales de referencia'],
    ee: [
      'Autoridad: fuentes identificables.',
      'Precisión: datos concretos.',
      'Utilidad: responde a la necesidad del lector.',
    ],
  },
];

const ACCIONES_PROHIBIDAS = /\b(entrevistar|entrevista\s+(?:a|con|al|a\s+la)|hablar\s+(?:con|del|de|al?\s+la?)|ir\s+(?:al?|a\s+la?)|visitar\s+(?:al?|a\s+la?)|solicitar\s+(?:expediente|copia|ficha|documento|informe)|consultar\s+(?:hospital|medicina\s+legal|fiscal|policia|bomberos|comisaria|juzgado|alcaldia)|esperar\s+(?:version|declaracion|informe)\s+(?:policial|oficial|institucional)|en\s+el\s+lugar|presencial|presencialmente|testimonio\s+directo|testigo\s+directo|acceso\s+(?:institucional|a\s+(?:la|el|los|las))|obtener\s+(?:copia|expediente|ficha|documento)|ir\s+a\s+preguntar|preguntar\s+(?:a|en|al))\b/i;

function filtrarSugerenciasRealizables(lista: SugerenciaV7[]): SugerenciaV7[] {
  const reemplazo = fabricarSugerencia(
    'Cuando existan nuevos datos públicos oficiales, actualizar la nota con cifras, declaraciones o antecedentes.',
    'Mantiene la pieza vigente sin exigir acceso exclusivo.',
    '10-20 min',
    'Baja',
    'Mejora permanencia y autoridad editorial.'
  );
  return lista
    .map(s => (ACCIONES_PROHIBIDAS.test(norm(s.texto)) ? reemplazo : s))
    .filter((s, i, arr) => arr.findIndex(x => x.texto === s.texto) === i);
}

function seleccionarPorEvidencia(
  lista: SugerenciaV7[],
  e: EvidenciaPuntuada
): SugerenciaV7[] {
  const seleccion: SugerenciaV7[] = [];
  if (e.fuenteIdentificada < 70) {
    seleccion.push(
      ...lista.filter(x => /fuente|institucion|comunicado|oficial|documento|acta|liga|federacion|documentacion/i.test(x.texto))
    );
  }
  if (e.datosConcretos < 70) {
    seleccion.push(
      ...lista.filter(x => /dato|resultado|marcador|cifra|fecha|hora|lugar|precio|paso|version|estadistica|alineacion/i.test(x.texto))
    );
  }
  if (e.contexto < 70) {
    seleccion.push(
      ...lista.filter(x => /contexto|antecedente|marco|tendencia|trayectoria|cronologia|historico/i.test(x.texto))
    );
  }
  if (e.utilidad < 70) {
    seleccion.push(
      ...lista.filter(x => /utilidad|impacto|prevencion|pasos|guia|que hacer|servicio|beneficio|riesgo/i.test(x.texto))
    );
  }
  if (seleccion.length < 2) {
    seleccion.push(...lista);
  }
  const unicos = [...new Map(seleccion.map(x => [x.texto, x])).values()];
  return unicos.slice(0, 4);
}

export function generarSugerenciasPorVertical(
  noticia: NoticiaInput,
  ev: EvidenciaPuntuada
): { oportunidadesEditoriales: SugerenciaV7[]; comoConvertirReferencia: SugerenciaV7[]; nivel10: SugerenciaV7[] } {
  const vertical = detectarVertical(noticia);
  const perfil = perfiles.find(p => p.vertical === vertical) || perfiles[perfiles.length - 1];
  const raw = perfil.sugerencias;

  return {
    oportunidadesEditoriales: filtrarSugerenciasRealizables(seleccionarPorEvidencia(raw.oportunidadesEditoriales, ev)),
    comoConvertirReferencia: filtrarSugerenciasRealizables(raw.comoConvertirReferencia.slice(0, 4)),
    nivel10: filtrarSugerenciasRealizables(raw.nivel10.slice(0, 4)),
  };
}
