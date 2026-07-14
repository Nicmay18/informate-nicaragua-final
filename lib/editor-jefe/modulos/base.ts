import type { EvidenciaPuntuada, ResultadoEditorJefeV2, SugerenciasV2 } from '../engine';
import type { NoticiaInput, SugerenciaV7 } from '../../analizador-noticias';

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
  | 'Reportajes'
  | 'Servicio'
  | 'General';

export interface DiferenciadorNI {
  elementosDetectados: string[];
  puntuacion: number;
  resumen: string;
}

export interface EvaluacionVertical {
  vertical: VerticalEditorial;
  sugerencias: SugerenciasV2;
  utilidad: number;
  originalidad: number;
  consistencia: {
    aprobado: boolean;
    contradicciones: string[];
  };
  diferenciadorNI: DiferenciadorNI;
  prioridadEditorial: 'Urgente' | 'Principal' | 'Destacada' | 'Secundaria' | 'Evergreen';
  valorAgregado: string[];
}

export const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const fabricarSugerencia = (
  texto: string,
  impacto: string,
  tiempo: string,
  dificultad: 'Baja' | 'Media' | 'Alta',
  beneficio: string
): SugerenciaV7 => ({ texto, impacto, tiempo, dificultad, beneficio });

export const textoCompleto = (n: NoticiaInput): string =>
  `${n.titulo} ${n.contenido} ${n.resumen} ${n.categoria}`;

export const textoPlano = (n: NoticiaInput): string =>
  n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const contieneCualquiera = (texto: string, palabras: string[]): boolean => {
  const t = norm(texto);
  return palabras.some(p => t.includes(norm(p)));
};

export const contieneRegex = (texto: string, regex: RegExp): boolean => regex.test(texto);

export const puntuacionPorMatches = (texto: string, regexes: RegExp[]): number => {
  const matches = regexes.filter(r => r.test(texto)).length;
  return regexes.length === 0 ? 0 : Math.min(100, Math.round((matches / regexes.length) * 100));
};

export const sugerenciasBase: SugerenciasV2 = {
  oportunidadesEditoriales: [
    fabricarSugerencia(
      'Citar con nombre y cargo la fuente oficial o medio que respalde el dato central.',
      'Eleva credibilidad.',
      '10-20 min',
      'Baja',
      'Reduce riesgo de desmentido.'
    ),
    fabricarSugerencia(
      'Incorporar dato concreto: fecha, hora, lugar, cifra o cantidad verificable.',
      'Precisión periodística.',
      '5-15 min',
      'Baja',
      'Mejora ranking factual.'
    ),
    fabricarSugerencia(
      'Explicitar la utilidad práctica: qué gana el lector con esta información.',
      'Convierte la nota en servicio.',
      '10-20 min',
      'Baja',
      'Compartibilidad.'
    ),
  ],
  comoConvertirReferencia: [
    fabricarSugerencia(
      'Construir una cronología o línea de tiempo con fechas verificables.',
      'Organiza información.',
      '30-60 min',
      'Media',
      'Comprensión.'
    ),
    fabricarSugerencia(
      'Comparar con cifras históricas o datos oficiales anteriores del mismo fenómeno.',
      'Amplía relevancia.',
      '30-60 min',
      'Media',
      'Contexto.'
    ),
    fabricarSugerencia(
      'Actualizar la nota cuando aparezcan nuevos datos públicos oficiales.',
      'Vigencia.',
      '10-20 min',
      'Baja',
      'Autoridad.'
    ),
  ],
  nivel10: [
    fabricarSugerencia(
      '¿Es un patrón? Análisis de datos históricos públicos del mismo fenómeno.',
      'Referencia de datos.',
      '2-3 días',
      'Alta',
      'Consulta recurrente.'
    ),
    fabricarSugerencia(
      'Guía práctica para el lector: pasos, medidas de protección o recomendaciones.',
      'Evergreen.',
      '1 día',
      'Baja',
      'Tráfico sostenido.'
    ),
  ],
};
export const detectoresValorAgregado = {
  cronologia: (n: NoticiaInput): boolean =>
    /\b(primero|luego|despu[eé]s|posteriormente|minutos m[aá]s tarde|horas m[aá]s tarde|al d[ií]a siguiente|en ese momento|mientras tanto|cronolog[ií]a|secuencia|inicialmente|finalmente|a las \d{1,2}:\d{2})\b/i.test(textoPlano(n)),

  antecedentes: (n: NoticiaInput): boolean =>
    /\b(antecedente|hist[oó]rico|anteriormente|previamente|no es la primera vez|en a[ñn]os anteriores|en el pasado|casos similares|coinciden con|se repite)\b/i.test(textoCompleto(n)),

  recomendacionesServicio: (n: NoticiaInput): boolean =>
    /\b(recomendar|recomendaci[oó]n|consejo|evitar|prevenir|cuidado|medida de seguridad|protegerse|a tener en cuenta|se recomienda|se sugiere|pasos a seguir|pasos para|requisito|d[óo]nde acudir|l[ií]nea telef[oó]nica|denunciar)\b/i.test(textoCompleto(n)),

  explicacionImpacto: (n: NoticiaInput): boolean =>
    /\b(impacto|afecta|significa que|esto implica|para el lector|para la ciudadan[ií]a|consecuencia directa|qu[eé] cambia|qu[eé] significa)\b/i.test(textoCompleto(n)),

  recopilacionFuentes: (n: NoticiaInput): boolean => {
    const t = textoPlano(n);
    const marcasAtribucion = (t.match(/\b([Ss]eg[úu]n|[Dd]e acuerdo con|[Ii]ndic[óo]|[Dd]eclar[óo]|[Pp]recis[óo]|[Cc]onfirm[óo]|[Dd]ijo|[Mm]encion[óo]|[Ss]eñal[óo]|[Ee]xplic[óo]|[Rr]eport[óo]|[Aa]segur[óo]|[Dd]etall[óo])\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
    return marcasAtribucion >= 2;
  },

  comparacion: (n: NoticiaInput): boolean =>
    /\b(comparar|comparaci[oó]n|frente a|versus|vs|en contraste|similar a|a diferencia de|igual que|como en)\b/i.test(textoCompleto(n)),

  contexto: (n: NoticiaInput): boolean =>
    /\b(contexto|marco|trasfondo|por qu[eé] ocurri[oó]|causa|motivo|origen|situaci[oó]n general)\b/i.test(textoCompleto(n)),

  datosConcretos: (n: NoticiaInput): boolean =>
    /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\bC?\$\s*\d+|\b\d{2,3}\s+(kil[óo]metros?|km|metros?|m|años?|personas?|heridos?|afectados?|fallecidos?|v[ií]ctimas?)\b/i.test(textoPlano(n)),

  reorganizacionExplicativa: (n: NoticiaInput): boolean =>
    /\b(en resumen|en otras palabras|esto significa que|esto implica|para entenderlo|lo importante es|aqu[ií] te explicamos|as[ií] funciona|de forma sencilla|qu[eé] debes saber|preguntas frecuentes|lo que cambia|resumido)\b/i.test(textoCompleto(n)),

  analisisProfundo: (n: NoticiaInput): boolean =>
    /\b(an[áa]lisis|profundiza|explica por qu[eé]|factores que|razones por las|causas principales|consecuencias|impacto real)\b/i.test(textoCompleto(n)),

  visualizacionDatos: (n: NoticiaInput): boolean =>
    /\b(gr[áa]fica|tabla|mapa|infograf[íi]a|cuadro comparativo|cronolog[íi]a visual|diagrama|lista de pasos)\b/i.test(textoCompleto(n)),

  preguntasRespondidas: (n: NoticiaInput): boolean =>
    /\b(¿qu[eé] pasar[aá]?|¿qu[eé] significa?|¿c[óo]mo afecta?|¿qui[eé]nes?|¿d[óo]nde?|¿cu[áa]ndo?|¿por qu[eé]?|preguntas frecuentes|respuestas)\b/i.test(textoCompleto(n)),

  explicacionLegal: (n: NoticiaInput): boolean =>
    /\b(marco legal|ley|normativa|art[ií]culo|decreto|resoluci[oó]n|sentencia|fallo|juzgado|tribunal|fiscal[ií]a|ministerio p[uú]blico|ministerio)\b/i.test(textoCompleto(n)) &&
    /\b(explica|significa|implica|afecta|c[óo]mo|por qu[eé]|qu[eé] cambia|qu[eé] dice)\b/i.test(textoCompleto(n)),
};

export const detectoresEvidencia = {
  documentoOficial: (n: NoticiaInput): boolean =>
    /\b(parte policial|informe oficial|documento oficial|resoluci[oó]n|decreto|acuerdo|ley|normativa|acta|expediente|dictamen|oficio|sentencia|auto judicial|resoluci[oó]n administrativa)\b/i.test(textoCompleto(n)),

  comunicado: (n: NoticiaInput): boolean =>
    /\b(comunicado oficial|comunicado de prensa|nota de prensa|bolet[ií]n|posici[oó]n oficial|comunicado institucional)\b/i.test(textoCompleto(n)),

  video: (n: NoticiaInput): boolean =>
    /\b(v[ií]deo|footage|transmisi[oó]n en vivo|en vivo|clip|material audiovisual)\b/i.test(textoCompleto(n)),

  fotografia: (n: NoticiaInput): boolean =>
    /\b(foto|fotograf[ií]a|imagen|galer[ií]a|captura)\b/i.test(textoCompleto(n)),

  trabajoDeCampo: (n: NoticiaInput): boolean =>
    /\b(trabajo de campo|desde el lugar|en el lugar|en el sitio|periodista en|corresponsal|enviado especial|reporte desde|testimonio presencial|en el epicentro|desde la zona)\b/i.test(textoCompleto(n)),

  testigoIdentificado: (n: NoticiaInput): boolean =>
    /\b(testigo|vecino|habitante|morador|comerciante|conductor|pasajero|familiar)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/i.test(textoPlano(n)),

  fuenteInstitucional: (n: NoticiaInput): boolean =>
    /\b(polic[ií]a|bomberos|hospital|medicina legal|fiscal[ií]a|juzgado|tribunal|ministerio|alcald[ií]a|instituci[oó]n|comupred|sinapred|delegaci[oó]n|asamblea nacional|banco central)\b/i.test(textoCompleto(n)),

  periodista: (n: NoticiaInput): boolean =>
    /\b(periodista|reportero|corresponsal|enviado especial|redacci[oó]n|por nuestro corresponsal|por nuestro periodista)\b/i.test(textoCompleto(n)),

  redOficial: (n: NoticiaInput): boolean =>
    /\b(cuenta oficial|red social oficial|perfil oficial|publicaci[oó]n oficial|comunicado en redes|oficial en redes)\b/i.test(textoCompleto(n)),
};

export const detectoresLegal = {
  presuncionInocencia: (n: NoticiaInput): boolean =>
    /\b(presuntamente|investiga|investigaci[oó]n|seg[uú]n informaci[oó]n preliminar|habr[ií]a|aparentemente|presunto|sospechoso|imputado|acusado|indagado|alegadamente|versiones preliminares|sin confirmar|en investigaci[oó]n)\b/i.test(textoCompleto(n)),
};

export const detectoresCoberturaContinua = {
  haySeguimiento: (n: NoticiaInput): boolean =>
    /\b(continuar[aá]|seguiremos informando|se espera parte oficial|la investigaci[oó]n contin[uú]a|la instituci[oó]n actualizar[aá]|pr[oó]ximas horas|pr[oó]ximos d[ií]as|actualizaremos|ampliaremos|nuevos datos|dar[aá] seguimiento|nicaragua informate dar[aá] seguimiento|mant[eé]ngase informado)\b/i.test(textoCompleto(n)),
};

export const detectoresHechoEnDesarrollo = {
  activo: (n: NoticiaInput): boolean =>
    /\b([uú]ltima hora|hace minutos|en desarrollo|momento|reci[eé]n|al cierre de esta edici[oó]n|informaci[oó]n en desarrollo|se informar[aá] m[aá]s tarde|se confirmar[aá] posteriormente|hecho en desarrollo|en curso|en estos momentos)\b/i.test(textoCompleto(n)),
};

export const detectoresUtilidad = {
  guia: (n: NoticiaInput): boolean =>
    /\b(c[óo]mo|pasos|qu[eé] hacer|tutorial|gu[íi]a r[áa]pida|paso a paso|instrucciones|c[óo]mo hacer)\b/i.test(textoCompleto(n)),

  consejos: (n: NoticiaInput): boolean =>
    /\b(consejos?|recomendaciones?|tips?|sugerencias?|buenas pr[aá]cticas)\b/i.test(textoCompleto(n)),

  prevencion: (n: NoticiaInput): boolean =>
    /\b(prevenci[oó]n|evitar|prevenir|cuidado|medidas? de seguridad|protegerse|a tener en cuenta|se recomienda)\b/i.test(textoCompleto(n)),

  derechos: (n: NoticiaInput): boolean =>
    /\b(derechos?|deberes|garant[íi]as?|amparo|recurso legal|puedes exigir|tienes derecho)\b/i.test(textoCompleto(n)),

  telefonos: (n: NoticiaInput): boolean =>
    /\b(n[uú]mero de emergencia|l[ií]nea de emergencia|llamar al\s*\d|tel[eé]fono de emergencia|\d{3,4}[-\s]\d{4})\b/i.test(textoCompleto(n)),

  direcciones: (n: NoticiaInput): boolean =>
    /\b(direcci[oó]n|ubicaci[oó]n|d[óo]nde acudir|oficina|sede|lugar de atenci[oó]n|mapa)\b/i.test(textoCompleto(n)),

  recomendaciones: (n: NoticiaInput): boolean =>
    /\b(recomendaciones?|se recomienda|se sugiere|aconseja|sugerimos)\b/i.test(textoCompleto(n)),

  tramites: (n: NoticiaInput): boolean =>
    /\b(tr[aá]mite|requisito|formulario|solicitud|documentaci[oó]n|plazo|presentar)\b/i.test(textoCompleto(n)),

  explicaciones: (n: NoticiaInput): boolean =>
    /\b(explicaci[oó]n|qu[eé] significa|qu[eé] implica|c[óo]mo impacta|para entender|c[óo]mo funciona)\b/i.test(textoCompleto(n)),
};

export const detectoresContextoRico = {
  antecedentes: (n: NoticiaInput): boolean => detectoresValorAgregado.antecedentes(n),

  casosSimilares: (n: NoticiaInput): boolean =>
    /\b(casos similares|otros casos|similar a|se repite|ha ocurrido antes|misma situaci[oó]n|como ocurri[oó]|precedentes)\b/i.test(textoCompleto(n)),

  estadisticas: (n: NoticiaInput): boolean =>
    /\b(estad[íi]sticas?|cifras?|datos de|seg[uú]n datos|estudio indica|reporte de|encuesta)\b/i.test(textoCompleto(n)),

  leyes: (n: NoticiaInput): boolean =>
    /\b(ley|decreto|acuerdo|normativa|reglamento|resoluci[oó]n|c[oó]digo|art[ií]culo|constituci[oó]n)\b/i.test(textoCompleto(n)),

  historia: (n: NoticiaInput): boolean =>
    /\b(historia|hist[oó]rico|en el pasado|a[ñn]os atr[aá]s|desde|tradici[oó]n|antigua|evoluci[oó]n)\b/i.test(textoCompleto(n)),

  comparaciones: (n: NoticiaInput): boolean => detectoresValorAgregado.comparacion(n),
};

export const detectoresDiscover = {
  actualidadMasiva: (n: NoticiaInput): boolean =>
    /\b([uú]ltima hora|hoy|ayer|este martes|este mi[eé]rcoles|este jueves|este viernes|este fin de semana|alerta|nuevo|anunci[oó]|confirm[oó]|gobierno|miles|impacto)\b/i.test(textoCompleto(n)),

  servicio: (n: NoticiaInput): boolean =>
    detectoresUtilidad.guia(n) || detectoresUtilidad.telefonos(n) || detectoresUtilidad.direcciones(n),

  preguntasFrecuentes: (n: NoticiaInput): boolean =>
    /\b(preguntas frecuentes|faq|lo m[aá]s consultado|dudas comunes|qu[eé] debo saber)\b/i.test(textoCompleto(n)),

  datosOriginales: (n: NoticiaInput): boolean =>
    detectoresValorAgregado.datosConcretos(n) || detectoresContextoRico.estadisticas(n),
};

export const detectoresFacebook = {
  curiosidad: (n: NoticiaInput): boolean =>
    /\b(descubre|por qu[eé]|qu[eé] pas[oó]|c[óo]mo|secretos?|sorpresa|inesperado|revelan|confirmado)\b/i.test(textoCompleto(n)),

  claridad: (n: NoticiaInput): boolean =>
    n.titulo.length >= 20 && n.titulo.length <= 90,

  impacto: (n: NoticiaInput): boolean =>
    /\b(afecta|cambia|impacto|beneficia|perjudica|gana|pierde|nuevo|urgente)\b/i.test(textoCompleto(n)),

  compartibilidad: (n: NoticiaInput): boolean =>
    /\b(comparte|compartir|difunde|avisa|informa|alerta|servicio|gratis|ayuda)\b/i.test(textoCompleto(n)),
};

export function detectarEvidenciaPeriodistica(n: NoticiaInput): boolean {
  return (
    detectoresEvidencia.video(n) ||
    detectoresEvidencia.fotografia(n) ||
    detectoresEvidencia.trabajoDeCampo(n) ||
    detectoresEvidencia.testigoIdentificado(n) ||
    detectoresEvidencia.fuenteInstitucional(n) ||
    detectoresEvidencia.documentoOficial(n) ||
    detectoresEvidencia.comunicado(n) ||
    detectoresEvidencia.periodista(n) ||
    detectoresEvidencia.redOficial(n)
  );
}

export function evaluarRiesgoEditorial(n: NoticiaInput): 'Alto' | 'Medio' | 'Bajo' {
  const t = textoCompleto(n);
  if (/\b(menor de edad|niño|niña|adolescente|violaci[oó]n|violencia sexual|abuso sexual|femicidio|feminicidio|suicidio|autoinmoli|difamaci[oó]n|calumnia|injuria|judicial activo|imputado|acusado)\b/i.test(t)) {
    return 'Alto';
  }
  if (/\b(accidente|incendio|explosi[oó]n|derrumbe|rescate|captura|allanamiento|operativo|heridos|fallecidos|v[ií]ctimas|detenidos|herido grave)\b/i.test(t)) {
    return 'Medio';
  }
  return 'Bajo';
}

export function evaluarDiferenciadorNI(n: NoticiaInput): DiferenciadorNI {
  const elementos: string[] = [];
  if (detectoresValorAgregado.cronologia(n)) elementos.push('Agregó cronología de los hechos');
  if (detectoresValorAgregado.antecedentes(n)) elementos.push('Agregó contexto histórico o antecedentes');
  if (detectoresValorAgregado.recomendacionesServicio(n)) elementos.push('Agregó recomendaciones o información de servicio');
  if (detectoresValorAgregado.recopilacionFuentes(n)) elementos.push('Organizó y verificó información de múltiples fuentes públicas');
  if (detectoresValorAgregado.explicacionImpacto(n)) elementos.push('Explicó el impacto para el lector');
  if (detectoresValorAgregado.comparacion(n)) elementos.push('Agregó comparación con hechos anteriores');
  if (detectoresValorAgregado.contexto(n)) elementos.push('Agregó contexto explicativo');
  if (detectoresValorAgregado.explicacionLegal(n)) elementos.push('Agregó explicación legal o normativa');
  if (detectoresValorAgregado.datosConcretos(n)) elementos.push('Incluyó datos concretos verificables');
  if (detectoresValorAgregado.reorganizacionExplicativa(n)) elementos.push('Reorganizó o simplificó información para el lector');
  if (detectoresValorAgregado.analisisProfundo(n)) elementos.push('Agregó análisis o explicación de fondo');
  if (detectoresValorAgregado.visualizacionDatos(n)) elementos.push('Usó visualización, tabla, mapa o cronología');
  if (detectoresValorAgregado.preguntasRespondidas(n)) elementos.push('Respondió preguntas clave del lector');

  const puntuacion = elementos.length === 0 ? 0 : Math.min(100, 20 + elementos.length * 12);
  const resumen = elementos.length === 0
    ? 'La nota cumple los criterios básicos de su vertical; no se detectaron diferenciadores editoriales adicionales.'
    : `Aporte editorial detectado: ${elementos.join('; ')}.`;

  return { elementosDetectados: elementos, puntuacion, resumen };
}

export function calcularOriginalidadPorEstructura(
  n: NoticiaInput,
  ev: EvidenciaPuntuada
): number {
  const elementos: number[] = [];
  if (ev.originalidad >= 60) elementos.push(ev.originalidad);
  if (detectoresValorAgregado.cronologia(n)) elementos.push(40);
  if (detectoresValorAgregado.antecedentes(n)) elementos.push(35);
  if (detectoresValorAgregado.comparacion(n)) elementos.push(35);
  if (detectoresValorAgregado.contexto(n)) elementos.push(30);
  if (detectoresValorAgregado.explicacionLegal(n)) elementos.push(35);
  if (detectoresValorAgregado.explicacionImpacto(n)) elementos.push(30);
  if (detectoresValorAgregado.recopilacionFuentes(n)) elementos.push(25);
  if (detectoresValorAgregado.recomendacionesServicio(n)) elementos.push(25);
  if (detectoresValorAgregado.datosConcretos(n)) elementos.push(20);
  if (detectoresValorAgregado.reorganizacionExplicativa(n)) elementos.push(20);
  if (detectoresValorAgregado.analisisProfundo(n)) elementos.push(30);
  if (detectoresValorAgregado.visualizacionDatos(n)) elementos.push(25);
  if (detectoresValorAgregado.preguntasRespondidas(n)) elementos.push(20);

  if (elementos.length === 0) return 0;
  return Math.min(100, Math.round(elementos.reduce((a, b) => a + b, 0) / Math.max(1, elementos.length - 1)));
}

export function prioridadDesdeDecision(
  v2: ResultadoEditorJefeV2,
  utilidad: number,
  originalidad: number
): EvaluacionVertical['prioridadEditorial'] {
  const accion = v2.fase3_decision.accion;
  const tipo = v2.fase2_tipoNota.tipo;
  const promedio = (v2.fase1_evidencia.fuenteIdentificada + v2.fase1_evidencia.datosConcretos + v2.fase1_evidencia.contexto + utilidad + originalidad) / 5;

  if (tipo === 'Cobertura' || (accion === 'portada' && promedio >= 85)) return 'Urgente';
  if (accion === 'portada' || accion === 'cobertura_especial') return 'Principal';
  if (accion === 'publicar_destacado' || promedio >= 70) return 'Destacada';
  if (accion === 'publicar_estandar' || promedio >= 50) return 'Secundaria';
  if (accion === 'publicar_breve' || utilidad >= 70) return 'Secundaria';
  return 'Evergreen';
}

export function itemsFaltantesBase(n: NoticiaInput, ev: EvidenciaPuntuada): string[] {
  const faltantes: string[] = [];
  if (ev.fuenteIdentificada < 60) faltantes.push('fuente identificada');
  if (ev.datosConcretos < 60) faltantes.push('datos concretos');
  if (ev.contexto < 60) faltantes.push('contexto');
  if (!detectoresValorAgregado.cronologia(n)) faltantes.push('cronología');
  if (!detectoresValorAgregado.antecedentes(n)) faltantes.push('antecedentes');
  return faltantes;
}

