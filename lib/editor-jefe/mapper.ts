/**
 * Mapper del Motor Editorial V2 al formato ReporteEditorJefe existente.
 * Mantiene compatibilidad con los consumidores actuales del analizador.
 */

import type {
  NoticiaInput,
  ReporteEditorJefe,
  CriterioEditorJefe,
  EvidenciaAporte,
} from '../analizador-noticias';
import type {
  ResultadoEditorJefeV2,
  AccionEditorialV2,
  TipoNotaEditorialV2,
  EvidenciaPuntuada,
} from './engine';
import { detectarVertical, resumenPerfilEditorial } from './perfiles';

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function evaluarRiesgoLegal(
  n: NoticiaInput,
  ev: EvidenciaPuntuada
): ReporteEditorJefe['riesgoLegal'] {
  const todo = `${norm(n.titulo)} ${norm(n.contenido)}`;

  const temasSensibles = /\b(muerte|muert[oa]|falleci[óo]|fallecid[oa]|asesinato|homicidio|feminicidio|femicidio|violaci[óo]|abuso sexual|menor|ni[ñn]o|ni[ñn]a|adolescente|detenido|imputado|acusado|procesado|sentenciado|preso|recluso|víctima|agresor|delito|crimen|escándalo|corrupci[óo]|denuncia|investigaci[óo]n policial|operativo policial)\b/;
  const contieneDatosPersonales = /\b(nombre completo|identidad|menor de edad|víctima menor|imputado menor|datos personales)\b/;
  const esTemaRiesgoso = temasSensibles.test(todo) || contieneDatosPersonales.test(todo);

  if (!esTemaRiesgoso) {
    return { nivel: 'Bajo', explicacion: 'No se detectan riesgos legales evidentes.' };
  }

  if (ev.documentoOficial >= 70 || ev.fuenteIdentificada >= 70) {
    return {
      nivel: 'Bajo',
      explicacion: 'La nota trata un tema sensible, pero cuenta con fuente oficial o documento que mitiga el riesgo.',
    };
  }

  if (ev.dosFuentes >= 70 || ev.datosConcretos >= 70) {
    return {
      nivel: 'Medio',
      explicacion: 'La nota trata un tema sensible y carece de fuente/documento oficial identificado. Se recomienda corroborar con fuentes públicas.',
    };
  }

  return {
    nivel: 'Alto',
    explicacion: 'La nota trata un tema sensible sin fuente oficial ni datos verificables identificados. Requiere revisión editorial antes de publicar.',
  };
}

function inferirCategoriaNota(n: NoticiaInput): ReporteEditorJefe['tipoNota'] {
  const cat = norm(n.categoria);
  const tit = norm(n.titulo);
  const todo = `${cat} ${tit}`;

  if (cat.includes('suces') || cat.includes('judicial') || cat.includes('transit') || cat.includes('policial')) return 'Sucesos';
  if (cat.includes('politic') || cat.includes('nacional')) return 'Política';
  if (cat.includes('econom')) return 'Economía';
  if (cat.includes('deporte')) return 'Deportes';
  if (cat.includes('salud')) return 'Salud';
  if (cat.includes('internacional')) return 'Internacionales';
  if (cat.includes('cultura') || cat.includes('espectacul')) return 'Cultura';
  if (cat.includes('tecnolog')) return 'Tecnología';
  if (cat.includes('educacion')) return 'Educación';
  if (cat.includes('opinion')) return 'Opinión';

  const temas: [RegExp, ReporteEditorJefe['tipoNota']][] = [
    [/\b(deportes|beisbol|futbol|boxeo|liga|torneo|equipo|juego|serie)\b/, 'Deportes'],
    [/\b(politica|asamblea|gobierno|ley|decreto|diputado|eleccion|voto)\b/, 'Política'],
    [/\b(economia|precio|dolar|gasolina|canasta basica|inflacion|remesas|mercado)\b/, 'Economía'],
    [/\b(salud|dengue|malaria|zika|covid|vacuna|minsa|hospital|enfermedad|epidemia)\b/, 'Salud'],
    [/\b(educacion|universidad|escuela|estudiante|mined|profesor|colegio)\b/, 'Educación'],
    [/\b(tecnologia|internet|redes sociales|app|celular|digital|ciberseguridad)\b/, 'Tecnología'],
    [/\b(internacional|mundo|onu|oea|frontera|migracion|eeuu|mexico|centroamerica)\b/, 'Internacionales'],
    [/\b(cultura|concierto|festival|feria|arte|musica|espectaculo|celebracion)\b/, 'Cultura'],
    [/\b(accidente|choque|colision|atropello|vuelco|incendio|robo|asalto|homicidio|asesinato|muerto)\b/, 'Sucesos'],
  ];

  for (const [re, categoria] of temas) {
    if (re.test(todo)) return categoria;
  }
  return 'Sucesos';
}

function mapTipoArticulo(tipo: TipoNotaEditorialV2): ReporteEditorJefe['tipoArticulo'] {
  switch (tipo) {
    case 'Reportaje': return 'Reportaje';
    case 'Investigación': return 'Investigación';
    case 'Entrevista': return 'Entrevista';
    case 'Opinión': return 'Opinión';
    case 'Noticia':
    case 'Breve':
    case 'Cobertura':
    case 'Crónica':
    default:
      return 'Noticia';
  }
}

function mapDecisionPortada(accion: AccionEditorialV2): ReporteEditorJefe['decisionPortada'] {
  switch (accion) {
    case 'no_publicar': return 'No publicar';
    case 'publicar_breve': return 'Publicar breve';
    case 'publicar_estandar': return 'Publicar estándar';
    case 'publicar_destacado':
    case 'portada': return 'Portada';
    case 'cobertura_especial': return 'Cobertura especial';
  }
}

function mapVeredicto(accion: AccionEditorialV2): ReporteEditorJefe['veredicto'] {
  // RFC-002: el veredicto es una traducción de la decisión del Editor Jefe V2.
  // La Constitución Forense no puede vetar ni cambiar esta escala.
  switch (accion) {
    case 'cobertura_especial': return '★★★★★ Nota de referencia';
    case 'portada':
    case 'publicar_destacado': return '★★★★☆ Muy competitiva';
    case 'publicar_estandar': return '★★★★ Competitiva';
    case 'publicar_breve': return '★★★ Publicable';
    case 'no_publicar': return '★ Reemplazable';
  }
}

function mapExplicacionPortada(accion: AccionEditorialV2, contexto: string): string {
  switch (accion) {
    case 'no_publicar': return 'No se recomienda publicar en este momento.';
    case 'publicar_breve': return `${contexto} Publicar como nota breve o actualización.`;
    case 'publicar_estandar': return `${contexto} Publicar con el estándar habitual.`;
    case 'publicar_destacado': return `${contexto} Publicar destacado en portada.`;
    case 'portada': return `${contexto} Nota principal de portada.`;
    case 'cobertura_especial': return `${contexto} Activar cobertura especial.`;
  }
}

function estrellasDesdePuntuacion(puntuacion: number, maximo: number): string {
  const n = Math.max(1, Math.min(5, Math.round((puntuacion / maximo) * 5)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function construirCriterios(ev: EvidenciaPuntuada): CriterioEditorJefe[] {
  const add = (nombre: string, raw: number, just: string): CriterioEditorJefe => {
    const puntuacion = Math.min(25, Math.max(0, Math.round(raw / 4)));
    return {
      nombre,
      puntuacion,
      maximo: 25,
      justificacion: just,
      estrellas: estrellasDesdePuntuacion(puntuacion, 25),
    };
  };

  return [
    add('Fuente identificada', ev.fuenteIdentificada, ev.fuenteIdentificada >= 70 ? 'Fuente oficial o medio identificado.' : 'Fuente parcial o no identificada.'),
    add('Documento oficial', ev.documentoOficial, ev.documentoOficial >= 70 ? 'Documento oficial o comunicado identificado.' : 'Sin documento oficial identificado.'),
    add('Fuentes independientes', ev.dosFuentes, ev.dosFuentes >= 70 ? 'Dos o más fuentes independientes.' : 'Menos de dos fuentes independientes.'),
    add('Trabajo de campo verificable', ev.trabajoDeCampo, ev.trabajoDeCampo >= 70 ? 'Evidencia verificable (fuente, documento, audiovisual o testimonio publicado).' : 'Evidencia de trabajo de campo limitada.'),
    add('Datos concretos', ev.datosConcretos, ev.datosConcretos >= 70 ? 'Fechas, cifras o cantidades verificables.' : 'Datos concretos limitados.'),
    add('Contexto', ev.contexto, ev.contexto >= 70 ? 'Contexto legal, institucional o histórico.' : 'Contexto insuficiente.'),
    add('Utilidad', ev.utilidad, ev.utilidad >= 50 ? 'Aporta utilidad al lector.' : 'Utilidad limitada.'),
    add('Originalidad', ev.originalidad, ev.originalidad >= 50 ? 'Aporte editorial propio.' : 'Originalidad limitada.'),
  ];
}

function construirNivelEvidencia(ev: EvidenciaPuntuada): ReporteEditorJefe['nivelEvidencia'] {
  const toDetalle = (raw: number) => raw >= 70 ? 'Sí' : raw >= 40 ? 'Parcial' : 'No';
  return [
    { criterio: 'Fuente oficial identificada', detectado: toDetalle(ev.fuenteIdentificada), puntaje: ev.fuenteIdentificada >= 70 ? 3 : ev.fuenteIdentificada >= 40 ? 1 : 0, maximo: 3 },
    { criterio: 'Documento oficial identificado', detectado: toDetalle(ev.documentoOficial), puntaje: ev.documentoOficial >= 70 ? 3 : 0, maximo: 3 },
    { criterio: 'Dos o más fuentes independientes', detectado: toDetalle(ev.dosFuentes), puntaje: ev.dosFuentes >= 70 ? 3 : 0, maximo: 3 },
    { criterio: 'Trabajo de campo verificable', detectado: toDetalle(ev.trabajoDeCampo), puntaje: ev.trabajoDeCampo >= 70 ? 3 : 0, maximo: 3 },
    { criterio: 'Datos concretos', detectado: toDetalle(ev.datosConcretos), puntaje: ev.datosConcretos >= 70 ? 3 : 0, maximo: 3 },
    { criterio: 'Contexto legal / institucional', detectado: toDetalle(ev.contexto), puntaje: ev.contexto >= 70 ? 3 : 0, maximo: 3 },
  ];
}

function detectarEvidenciaAporteV2(textoPlano: string): EvidenciaAporte[] {
  const encontrados: EvidenciaAporte[] = [];
  const extraer = (regex: RegExp, tipo: EvidenciaAporte['tipo']) => {
    const m = textoPlano.match(regex);
    if (!m) return;
    const start = Math.max(0, (m.index ?? 0) - 60);
    const end = Math.min(textoPlano.length, (m.index ?? 0) + m[0].length + 120);
    let snippet = textoPlano.slice(start, end).replace(/^[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]*/, '').replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]*$/, '').trim();
    snippet = snippet.replace(/\s+/g, ' ');
    if (snippet.length > 10) encontrados.push({ tipo, snippet: snippet.slice(0, 220) });
  };

  extraer(/[^.!?]*\b(?:c[óo]digo|ley\s+n[º°]?\s*\d+|art[ií]culo|pena|delito|proceso|judicial|juez|fiscal|sentencia|imputado|acusado)\b[^.!?]*[.!?]?/i, 'marco legal');
  extraer(/[^.!?]*\b(?:porque|debido\s+a|gracias\s+a|a\s+causa\s+de|lo\s+que\s+significa|esto\s+implica|esto\s+significa|en\s+consecuencia|por\s+tanto|por\s+lo\s+que|lo\s+cual)\b[^.!?]*[.!?]?/i, 'explicación');
  extraer(/[^.!?]*\b(?:seg[úu]n\s+(?:el|la|los|las)\s+(?:c[óo]digo|ley|art[ií]culo|constituci[óo]n|reglamento|normativa|resoluci[óo]n|decreto|acuerdo)|de\s+acuerdo\s+con\s+(?:el|la)\s+(?:c[óo]digo|ley|art[ií]culo|normativa|reglamento))\b[^.!?]*[.!?]?/i, 'contexto');
  extraer(/[^.!?]*\b(?:en\s+(?:20|19)\d{2}|anteriormente|en\s+años\s+anteriores|durante\s+(?:el|la)\s+\w+|en\s+periodos\s+anteriores|hist[óo]ricamente|en\s+la\s+[úu]ltima\s+d[eé]cada)\b[^.!?]*[.!?]?/i, 'antecedente');

  if (encontrados.length === 0) {
    encontrados.push({ tipo: 'explicación', snippet: 'No se detecta un aporte contextual, legal o explicativo diferenciado; la nota se limita a narrar el hecho.' });
  }
  return encontrados.slice(0, 5);
}

export function mapearReporteEditorJefe(
  n: NoticiaInput,
  v2: ResultadoEditorJefeV2,
  observacionesAuditoria: string[] = []
): ReporteEditorJefe {
  const textoPlano = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const decision = v2.fase3_decision;
  const accion = decision.accion;
  const publicable = accion !== 'no_publicar';

  const tipoNota = inferirCategoriaNota(n);
  const tipoArticulo = mapTipoArticulo(v2.fase2_tipoNota.tipo);
  const veredicto = mapVeredicto(accion);
  const decisionPortada = mapDecisionPortada(accion);
  const explicacionPortada = mapExplicacionPortada(accion, v2.fase4_contextoNicaragua.explicacion);

  const razonReferenciaSiNo: ReporteEditorJefe['razonReferenciaSiNo'] = publicable ? 'Sí' : 'No';
  const razonamientoReferencia = publicable
    ? `La nota aporta evidencia verificable y el Editor Jefe V2 decide publicarla. ${decision.justificacion}`
    : 'El Editor Jefe V2 considera que la nota no reúne evidencia suficiente para publicar.';

  const sugerencias = v2.fase5_sugerencias;

  const criterios = construirCriterios(v2.fase1_evidencia);
  const puntuacion = decision.prioridad;

  return {
    tipoNota,
    tipoArticulo,
    razonamientoTipo: v2.fase2_tipoNota.razon,
    puntuacion,
    puntuacionMaxima: 100,
    veredicto,
    criterios,

    porQueExiste: publicable
      ? 'La nota merece existir porque el Editor Jefe V2 decide publicarla con la evidencia disponible.'
      : 'La nota no debe publicarse porque el Editor Jefe V2 no detecta evidencia suficiente.',
    aporteOriginal: v2.fase1_evidencia.originalidad >= 50
      ? 'Se detecta aporte editorial propio o verificación del medio.'
      : 'La nota se basa en información pública disponible; no se detecta aporte exclusivo.',
    razonReferenciaSiNo,
    razonamientoReferencia,
    oportunidadesEditoriales: sugerencias.oportunidadesEditoriales,
    investigacionAdicional: sugerencias.oportunidadesEditoriales[0]?.texto || 'Actualizar con datos públicos oficiales cuando estén disponibles.',
    preguntaSinResponder: '¿Qué información pública adicional fortalecería esta nota?',
    datoEnriquecedor: sugerencias.oportunidadesEditoriales[1]?.texto || 'Agregar contexto histórico o cifras oficiales cuando existan.',
    comoConvertirReferencia: sugerencias.comoConvertirReferencia,

    detectorNicaraguaInformate: v2.fase1_evidencia.originalidad >= 50 ? 'Aporte propio detectado' : 'Sin aporte propio detectado',
    detectorFacebook: 'Evaluado por el motor editorial V2',
    detectorGoogle: 'Evaluado por el motor editorial V2',
    detectorEEATReal: publicable ? 'Cumple estándar EEAT mínimo' : 'No cumple estándar EEAT mínimo',

    principioRector: 'Nicaragua Informate evalúa cada nota con la información pública disponible al cierre editorial. No se exige trabajo de campo presencial, entrevistas exclusivas ni acceso institucional como condición para publicar. El trabajo periodístico se considera suficiente cuando existe evidencia verificable: fuente oficial, medio nacional identificado, documento, video, fotografía o testimonio publicado por una fuente reconocible.',
    preguntaFinal: '¿Con la información pública disponible, esta nota está bien construida y resulta útil para el lector de Nicaragua Informate?',

    nivel7_5_evidenciaAporte: detectarEvidenciaAporteV2(textoPlano),
    nivel8_impactoLector: v2.fase1_evidencia.utilidad >= 50
      ? 'La nota aporta utilidad práctica o clarifica el impacto para el lector.'
      : 'La utilidad para el lector es limitada; se sugiere agregar contexto o recomendaciones.',
    nivel9_preguntasSinRespuesta: [
      '¿Qué datos públicos adicionales fortalecerían la nota?',
      '¿Existe un antecedente reciente que contextualice el hecho?',
      '¿Qué institución podría actualizar la información oficialmente?',
      '¿Cómo afecta esto directamente al lector?',
    ],
    nivel10_oportunidades: sugerencias.nivel10,
    nivelEvidencia: construirNivelEvidencia(v2.fase1_evidencia),

    factibilidad: 'Baja',
    tiempoReferencia: accion === 'no_publicar' ? 'No aplica' : 'Inmediato',
    retornoEditorial: decision.prioridad >= 80 ? 'ALTO' : decision.prioridad >= 60 ? 'MEDIO' : 'BAJO',
    retornoExplicacion: decision.prioridad >= 80
      ? 'Alta probabilidad de engagement y consulta recurrente.'
      : 'Retorno editorial moderado; conviene actualizar con datos públicos.',
    prioridadEditorial: decisionPortada,
    valorParaLector: v2.fase1_evidencia.utilidad >= 50
      ? 'La nota entrega información útil o aclara el impacto del hecho.'
      : 'La nota informa el hecho pero su utilidad práctica es limitada.',
    decisionPortada,
    explicacionPortada,

    perfilVertical: resumenPerfilEditorial(detectarVertical(n)),

    discoverRazon: decision.prioridad >= 80
      ? 'Actualidad, utilidad y señales de confianza la hacen candidata fuerte para Discover.'
      : decision.prioridad >= 60
        ? 'Tiene algunos atributos, pero necesita más originalidad o servicio para destacar.'
        : 'Falta utilidad, contexto o diferenciador; de momento dependería solo del tráfico de noticia.',
    descubreProbabilidad: decision.prioridad >= 80 ? 'ALTA' : decision.prioridad >= 60 ? 'MEDIA' : 'BAJA',
    porQueCompartible: decision.prioridad >= 70
      ? 'La gente la compartiría porque aporta información útil.'
      : 'No se detecta un motivo de ayuda claro; la nota necesita utilidad o verificación.',
    compartibleSiNo: decision.prioridad >= 70 ? 'Sí' : 'No',
    categoriaFacebook: 'Utilidad',
    razonFacebook: 'Evaluado por el motor editorial V2',

    produccionNicaraguaInformate: [],
    riesgoLegal: evaluarRiesgoLegal(n, v2.fase1_evidencia),
    firmaDirector: `Director Editorial V2 — ${decisionPortada}`,

    auditoriaInterna: {
      aprobado: true,
      observaciones: observacionesAuditoria,
      ajustesRealizados: [],
    },
  };
}
