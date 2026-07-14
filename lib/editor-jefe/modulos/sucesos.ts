import type { NoticiaInput } from '../../analizador-noticias';
import type { EvidenciaPuntuada, ResultadoEditorJefeV2 } from '../engine';
import {
  type EvaluacionVertical,
  fabricarSugerencia,
  textoCompleto,
  textoPlano,
  detectoresValorAgregado,
  detectoresEvidencia,
  detectoresLegal,
  detectoresCoberturaContinua,
  detectoresHechoEnDesarrollo,
  detectarEvidenciaPeriodistica,
  evaluarDiferenciadorNI,
  calcularOriginalidadPorEstructura,
  prioridadDesdeDecision,
} from './base';
import type { SugerenciasV2 } from '../engine';

const institucionesSucesos = /\b(polic[ií]a nacional|polic[ií]a de tr[aá]nsito|bomberos|hospital|cl[ií]nica|medicina legal|cruz blanca|cruz roja|comupred|sinapred|alcald[ií]a|fiscal[ií]a|juzgado|tribunal|comisar[ií]a|delegaci[oó]n policial)\b/i;
const testigosIdentificados = /\b(testigo|vecino|habitante|morador|comerciante|conductor|pasajero|familiar|testimonio)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/i;

function detectarSeguimiento(n: NoticiaInput): boolean {
  return /\b(contin[úu]a\s+(?:bajo\s+)?investigaci[oó]n|investigaci[oó]n\s+(?:en\s+curso|abierta)|se\s+investiga|se\s+determinar[aá]|se\s+informar[aá]|pr[oó]ximas\s+horas|pr[oó]ximos\s+d[ií]as|estado\s+de\s+las\s+v[ií]ctimas|evoluci[oó]n\s+de\s+las\s+v[ií]ctimas)\b/i.test(textoCompleto(n));
}

function detectarServicioSucesos(n: NoticiaInput): { tiene: boolean; items: string[] } {
  const t = textoCompleto(n);
  const items: string[] = [];

  if (/\b(recomendaciones?|consejos?|prevenir|evitar|medidas? de seguridad|protegerse)\b/i.test(t)) items.push('recomendaciones');
  if (/\b(ruta alterna|ruta habilitada|cierre de v[ií]a|desv[ií]o|carretera|calle cerrada|v[ií]a habilitada)\b/i.test(t)) items.push('rutas');
  if (/\b(hospital|cl[ií]nica|centro de salud|medicina legal|urgencias?)\b/i.test(t)) items.push('hospitales');
  if (/\b(n[uú]mero de emergencia|l[ií]nea de emergencia|llamar al\s*\d|tel[eé]fono de emergencia|\d{3,4}[-\s]\d{4})\b/i.test(t)) items.push('teléfonos');
  if (detectarSeguimiento(n)) items.push('seguimiento');
  if (/\b(contexto vial|tr[aá]nsito|conductor|veh[ií]culo|carretera|ruta|zona del accidente)\b/i.test(t)) items.push('contexto vial');
  if (/\b(familiar|familiares|identificad[oa]|nombre de la v[ií]ctima|seres queridos|informaci[oó]n para familiares)\b/i.test(t)) items.push('información para familiares');

  return { tiene: items.length > 0, items };
}

const tiposSuceso = /\b(accidente|incendio|homicidio|femicidio|feminicidio|desaparici[oó]n|rescate|explosi[oó]n|derrumbe|allanamiento|captura|juicio|sentencia|operativo|atentado|secuestro|robo|hurto|enfrentamiento)\b/i;

function detectarTipoSuceso(n: NoticiaInput): boolean {
  return tiposSuceso.test(textoCompleto(n));
}

function detectarCronologiaSucesos(n: NoticiaInput): boolean {
  return /\b(a las\s+\d{1,2}:\d{2}|primero|luego|despu[eé]s|posteriormente|minutos m[aá]s tarde|horas m[aá]s tarde|al d[ií]a siguiente|cronolog[ií]a|secuencia de hechos|inicialmente|finalmente|cuando ocurri[oó]|en ese momento|hora|fecha|lugar|secuencia|traslado|investigaci[oó]n)\b/i.test(textoPlano(n));
}

function detectarAntecedentesSucesos(n: NoticiaInput): boolean {
  return detectoresValorAgregado.antecedentes(n) || /\b(antecedentes de accidentes|incidentes similares|accidente anterior|misma zona|misma carretera|patr[oó]n de)\b/i.test(textoCompleto(n));
}

function sugerenciasSucesos(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const evidenciaPeriodistica =
    detectarEvidenciaPeriodistica(n) ||
    institucionesSucesos.test(textoCompleto(n)) ||
    testigosIdentificados.test(textoPlano(n));
  const hechoEnDesarrollo = detectoresHechoEnDesarrollo.activo(n);
  const cronologia = detectarCronologiaSucesos(n);
  const antecedentes = detectarAntecedentesSucesos(n);
  const servicio = detectarServicioSucesos(n);
  const seguimiento = detectoresCoberturaContinua.haySeguimiento(n);
  const tipoDetectado = detectarTipoSuceso(n);

  const oportunidades: ReturnType<typeof fabricarSugerencia>[] = [];

  if (!evidenciaPeriodistica) {
    if (hechoEnDesarrollo) {
      oportunidades.push(fabricarSugerencia(
        'Documento oficial aún no disponible por tratarse de un hecho en desarrollo. Verificar con fuentes en el lugar o comunicados oficiales posteriores.',
        'Contexto de emergencia.',
        '5-10 min',
        'Baja',
        'Evita exigir documento inexistente.'
      ));
    } else {
      oportunidades.push(fabricarSugerencia(
        'Citar la fuente institucional que confirmó el hecho (Policía, Bomberos, COMUPRED, Medicina Legal u hospital) o un testigo identificado.',
        'Dato verificado.',
        '10-20 min',
        'Baja',
        'Reduce especulación y rumores.'
      ));
    }
  } else {
    oportunidades.push(fabricarSugerencia(
      'Evidencia periodística verificable detectada. Mantener atribución clara y actualizar cuando haya documento oficial.',
      'Rigor factual.',
      '5-10 min',
      'Baja',
      'Refuerza la autoridad de la pieza.'
    ));
  }

  if (!cronologia) {
    oportunidades.push(fabricarSugerencia(
      'Incluir cronología precisa: fecha, hora, lugar y secuencia de hechos verificables.',
      'Precisión factual.',
      '10-20 min',
      'Baja',
      'Mejora comprensión del lector.'
    ));
  }

  if (!antecedentes) {
    oportunidades.push(fabricarSugerencia(
      'Agregar contexto sobre incidentes similares recientes en la misma zona o período.',
      'Contexto de patrón.',
      '15-30 min',
      'Media',
      'Aporta relevancia local.'
    ));
  }

  if (!servicio.tiene && tipoDetectado) {
    oportunidades.push(fabricarSugerencia(
      'Explicitar medidas de prevención, rutas alternas o información útil para el ciudadano si es pertinente.',
      'Utilidad práctica.',
      '10-20 min',
      'Baja',
      'Convierte la nota en servicio.'
    ));
  }

  if (!seguimiento) {
    oportunidades.push(fabricarSugerencia(
      'Indicar si la investigación continúa o si se espera información oficial posterior.',
      'Vigencia editorial.',
      '5-10 min',
      'Baja',
      'Prepara actualización sin exigir documento inexistente.'
    ));
  }

  const implicaResponsable = /\b(homicidio|femicidio|feminicidio|captura|acusado|imputado|detenido|sospechoso|responsable|detenidos|indagado)\b/i.test(textoCompleto(n));
  if (implicaResponsable && !detectoresLegal.presuncionInocencia(n)) {
    oportunidades.push(fabricarSugerencia(
      'Incluir términos que preserven la presunción de inocencia (presuntamente, según investigación preliminar, etc.) cuando se mencionen responsables.',
      'Riesgo legal.',
      '5-10 min',
      'Baja',
      'Protege al medio y respeta derechos.'
    ));
  }

  oportunidades.push(fabricarSugerencia(
    'Separar claramente los hechos confirmados de testimonios, versiones o hipótesis.',
    'Rigor editorial.',
    '10-15 min',
    'Baja',
    'Protege contra desmentidos.'
  ));

  const comoConvertirReferencia = [
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
  ];

  const nivel10 = [
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
  ];

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
    comoConvertirReferencia,
    nivel10,
  };
}

function calcularUtilidadSucesos(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  const servicio = detectarServicioSucesos(n);
  let puntos = 0;
  if (servicio.tiene) puntos += 80 + Math.min(20, servicio.items.length * 5);
  if (detectoresHechoEnDesarrollo.activo(n)) puntos += 30;
  if (detectarEvidenciaPeriodistica(n)) puntos += 25;
  if (detectoresCoberturaContinua.haySeguimiento(n)) puntos += 20;
  if (detectoresLegal.presuncionInocencia(n)) puntos += 10;
  return Math.max(ev.utilidad, Math.min(100, puntos));
}

function consistenciaSucesos(n: NoticiaInput, ev: EvidenciaPuntuada): string[] {
  const faltantes: string[] = [];
  if (!detectarCronologiaSucesos(n)) faltantes.push('faltó cronología');
  if (!detectarAntecedentesSucesos(n)) faltantes.push('faltó antecedentes');
  if (!detectarServicioSucesos(n).tiene) faltantes.push('faltó prevención o servicio');
  if (!detectoresCoberturaContinua.haySeguimiento(n)) faltantes.push('faltó seguimiento');
  if (ev.fuenteIdentificada < 60) faltantes.push('faltó evidencia institucional');
  return faltantes;
}

export function evaluarSucesos(n: NoticiaInput, v2: ResultadoEditorJefeV2): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  const sugerencias = sugerenciasSucesos(n, ev);
  const utilidad = calcularUtilidadSucesos(n, ev);
  const originalidad = Math.max(ev.originalidad, calcularOriginalidadPorEstructura(n, ev));
  const diferenciador = evaluarDiferenciadorNI(n);
  const contradicciones = consistenciaSucesos(n, ev);
  const valorAgregado = diferenciador.elementosDetectados.length > 0
    ? diferenciador.elementosDetectados
    : ['La nota cumple los criterios básicos de su vertical; no se detectaron diferenciadores adicionales.'];

  if (detectoresHechoEnDesarrollo.activo(n) && !detectoresEvidencia.documentoOficial(n)) {
    valorAgregado.push('Documento oficial aún no disponible por tratarse de un hecho en desarrollo.');
  }

  return {
    vertical: 'Sucesos',
    sugerencias,
    utilidad,
    originalidad,
    consistencia: {
      aprobado: true,
      contradicciones,
    },
    diferenciadorNI: {
      ...diferenciador,
      puntuacion: Math.max(diferenciador.puntuacion, originalidad >= 60 ? 60 : 0),
    },
    prioridadEditorial: prioridadDesdeDecision(v2, utilidad, originalidad),
    valorAgregado,
  };
}

