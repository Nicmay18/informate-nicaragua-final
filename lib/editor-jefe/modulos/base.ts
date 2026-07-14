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
    /\b(recomendar|recomendaci[oó]n|consejo|evitar|prevenir|cuidado|medida de seguridad|protegerse|a tener en cuenta|se recomienda|se sugiere|pasos a seguir)\b/i.test(textoCompleto(n)),

  explicacionImpacto: (n: NoticiaInput): boolean =>
    /\b(impacto|afecta|significa que|esto implica|para el lector|para la ciudadan[ií]a|consecuencia directa|qu[eé] cambia|qu[eé] significa)\b/i.test(textoCompleto(n)),

  recopilacionFuentes: (n: NoticiaInput): boolean => {
    const t = textoPlano(n);
    const marcasAtribucion = (t.match(/\b(seg[úu]n|de acuerdo con|indic[óo]|declar[óo]|precis[óo]|confirm[óo]|dijo|menci[óo]|señal[óo]|explic[óo]|report[óo]|asegur[óo]|detall[óo])\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
    return marcasAtribucion >= 2;
  },

  comparacion: (n: NoticiaInput): boolean =>
    /\b(comparar|comparaci[oó]n|frente a|versus|vs|en contraste|similar a|a diferencia de|igual que|como en)\b/i.test(textoCompleto(n)),

  contexto: (n: NoticiaInput): boolean =>
    /\b(contexto|marco|trasfondo|por qu[eé] ocurri[oó]|causa|motivo|origen|situaci[oó]n general)\b/i.test(textoCompleto(n)),

  datosConcretos: (n: NoticiaInput): boolean =>
    /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\bC?\$\s*\d+|\b\d{2,3}\s+(kil[óo]metros?|km|metros?|m|años?|personas?|heridos?|afectados?|fallecidos?|v[ií]ctimas?)\b/i.test(textoPlano(n)),
};

export function evaluarDiferenciadorNI(n: NoticiaInput): DiferenciadorNI {
  const elementos: string[] = [];
  if (detectoresValorAgregado.cronologia(n)) elementos.push('Agregó cronología de los hechos');
  if (detectoresValorAgregado.antecedentes(n)) elementos.push('Agregó contexto histórico o antecedentes');
  if (detectoresValorAgregado.recomendacionesServicio(n)) elementos.push('Agregó recomendaciones o información de servicio');
  if (detectoresValorAgregado.recopilacionFuentes(n)) elementos.push('Organizó y verificó información de múltiples fuentes públicas');
  if (detectoresValorAgregado.explicacionImpacto(n)) elementos.push('Explicó el impacto para el lector');
  if (detectoresValorAgregado.comparacion(n)) elementos.push('Agregó comparación con hechos anteriores');
  if (detectoresValorAgregado.contexto(n)) elementos.push('Agregó contexto explicativo');
  if (detectoresValorAgregado.datosConcretos(n)) elementos.push('Incluyó datos concretos verificables');

  const puntuacion = elementos.length === 0 ? 0 : Math.min(100, 20 + elementos.length * 12);
  const resumen = elementos.length === 0
    ? 'Sin elementos diferenciadores de Nicaragua Informate detectados.'
    : `Diferenciador NI: ${elementos.join('; ')}.`;

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
  if (detectoresValorAgregado.explicacionImpacto(n)) elementos.push(30);
  if (detectoresValorAgregado.recopilacionFuentes(n)) elementos.push(25);
  if (detectoresValorAgregado.recomendacionesServicio(n)) elementos.push(25);
  if (detectoresValorAgregado.datosConcretos(n)) elementos.push(20);

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

