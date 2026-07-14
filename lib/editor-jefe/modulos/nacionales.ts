import type { NoticiaInput } from '../../analizador-noticias';
import type { EvidenciaPuntuada, ResultadoEditorJefeV2, SugerenciasV2 } from '../engine';
import {
  type EvaluacionVertical,
  fabricarSugerencia,
  textoCompleto,
  detectoresValorAgregado,
  detectoresContextoRico,
  detectoresUtilidad,
  evaluarDiferenciadorNI,
  calcularOriginalidadPorEstructura,
  prioridadDesdeDecision,
} from './base';

const institucionesNacionales = /\b(asamblea nacional|presidencia|ministerio|alcald[ií]a|municipio|inss|mifamilia|migob|mific|mitrabajo|mined|minsa|ineter|invur|cse|banco central|fiscal[ií]a|poder judicial|contralor[ií]a|procuradur[ií]a|direcci[oó]n general|instituto nacional)\b/i;

function detectarImpactoCiudadano(n: NoticiaInput): boolean {
  return /\b(ciudadanos?|ciudadan[íi]a|poblaci[oó]n|afecta(?:r[aá])?|beneficiar[aá]s?|beneficiarios?|afectados?|usuarios?|trabajadores?|estudiantes?|familias?|comunidad|pueblos?|sector(?:es)?|gremios?|empresas?|pymes|miles de personas|cientos de personas|hogares?|consumidores?|contribuyentes?)\b/i.test(textoCompleto(n));
}

function detectarQueCambia(n: NoticiaInput): boolean {
  return /\b(qu[eé] cambia|nueva medida|nueva normativa|reforma|modificaci[oó]n|se aprob[oó]|entr[aá] en vigor|entr[aá] en vigencia|rige a partir|desde ahora|ahora se exige|nuevo requisito)\b/i.test(textoCompleto(n));
}

function detectarDesdeCuando(n: NoticiaInput): boolean {
  return /\b(desde|a partir de|entr[aá] en vigor|entr[aá] en vigencia|vigente|rige|plazo|fecha l[ií]mite|hasta|a partir del \d{1,2})\b/i.test(textoCompleto(n));
}

function detectarComoImpacta(n: NoticiaInput): boolean {
  return detectoresValorAgregado.explicacionImpacto(n) || /\b(impactar[aá]|significa que|esto implica|para el lector|para el ciudadano|para la ciudadan[íi]a|consecuencia|cambiar[aá]\s+(la forma|el proceso|el tr[áa]mite)|m[áa]s r[áa]pido|m[áa]s f[aá]cil|m[áa]s caro|m[áa]s barato)\b/i.test(textoCompleto(n));
}

function detectarMarcoLegal(n: NoticiaInput): boolean {
  return /\b(ley|decreto|acuerdo|resoluci[oó]n|normativa|reglamento|c[oó]digo|art[ií]culo|constituci[oó]n|marco legal|ordenamiento jur[ií]dico)\b/i.test(textoCompleto(n));
}

function detectarBeneficiariosAfectados(n: NoticiaInput): boolean {
  return /\b(beneficiar[aá]s?|afectados?|afectadas?|poblaci[oó]n impactada|miles|millones?|mill[oó]n|centenares|cientos|alcance nacional|departamentos afectados|m[aá]s de \d)\b/i.test(textoCompleto(n));
}

function detectarTramite(n: NoticiaInput): boolean {
  return /\b(tr[aá]mite|requisito|pasos a seguir|donde acudir|plazo|presentar|solicitud|formulario|documentaci[oó]n a presentar)\b/i.test(textoCompleto(n));
}

function sugerenciasNacionales(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const impacto = detectarImpactoCiudadano(n);
  const legal = detectarMarcoLegal(n);
  const beneficiarios = detectarBeneficiariosAfectados(n);
  const tramite = detectarTramite(n);
  const institucion = institucionesNacionales.test(textoCompleto(n));

  const oportunidades = [];

  if (!institucion) {
    oportunidades.push(fabricarSugerencia(
      'Identificar con nombre y cargo la institución o funcionario que tomó la decisión o generó la noticia.',
      'Precisión institucional.',
      '10-20 min',
      'Baja',
      'Reduce riesgo de desmentido.'
    ));
  }

  if (!impacto) {
    oportunidades.push(fabricarSugerencia(
      'Explicar el impacto directo en el ciudadano: quiénes se benefician o afectan y cómo.',
      'Utilidad pública.',
      '15-30 min',
      'Media',
      'Convierte la nota en servicio.'
    ));
  }

  if (!legal) {
    oportunidades.push(fabricarSugerencia(
      'Mencionar el marco legal, decreto o normativa aplicable si es información pública.',
      'Contexto jurídico.',
      '15-30 min',
      'Media',
      'Eleva rigor.'
    ));
  }

  if (!beneficiarios) {
    oportunidades.push(fabricarSugerencia(
      'Cuantificar o caracterizar a los beneficiarios o afectados cuando existan datos públicos.',
      'Alcance real.',
      '10-20 min',
      'Baja',
      'Mejora relevancia.'
    ));
  }

  if (!tramite) {
    oportunidades.push(fabricarSugerencia(
      'Si la noticia implica un tr[áa]mite, aclarar pasos, plazos o dónde acudir.',
      'Servicio ciudadano.',
      '15-30 min',
      'Media',
      'Valor pr[áa]ctico.'
    ));
  }

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
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
        'An[áa]lisis del impacto de la medida con datos oficiales y testimonios identificados.',
        'An[áa]lisis de fondo.',
        '2-4 días',
        'Alta',
        'Autoridad editorial.'
      ),
      fabricarSugerencia(
        'Guía pr[áa]ctica de tr[áa]mites o derechos afectados.',
        'Evergreen de servicio.',
        '1 día',
        'Baja',
        'Tr[áa]fico sostenido.'
      ),
    ],
  };
}

function calcularUtilidadNacionales(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  let puntos = 0;
  if (detectarImpactoCiudadano(n)) puntos += 35;
  if (detectarTramite(n) || detectoresUtilidad.tramites(n)) puntos += 30;
  if (detectarBeneficiariosAfectados(n)) puntos += 20;
  if (detectarMarcoLegal(n) || detectoresContextoRico.leyes(n)) puntos += 10;
  if (detectarQueCambia(n)) puntos += 10;
  if (detectarDesdeCuando(n)) puntos += 5;
  if (detectarComoImpacta(n)) puntos += 10;
  if (detectoresUtilidad.explicaciones(n)) puntos += 5;
  if (detectoresContextoRico.estadisticas(n)) puntos += 10;
  return Math.max(ev.utilidad, Math.min(100, puntos + (puntos > 0 ? 10 : 0)));
}

function consistenciaNacionales(n: NoticiaInput, ev: EvidenciaPuntuada): string[] {
  const faltantes: string[] = [];
  if (!detectarImpactoCiudadano(n)) faltantes.push('faltó impacto ciudadano');
  if (!detectarComoImpacta(n)) faltantes.push('faltó explicación del impacto');
  if (!institucionesNacionales.test(textoCompleto(n)) && ev.fuenteIdentificada < 60) faltantes.push('faltó institución o fuente oficial');
  if (!detectarMarcoLegal(n) && !detectoresValorAgregado.antecedentes(n) && !detectoresContextoRico.leyes(n)) {
    faltantes.push('faltó marco legal o antecedentes');
  }
  if (!detectarBeneficiariosAfectados(n) && !detectarImpactoCiudadano(n)) faltantes.push('faltó beneficiarios o afectados');
  return faltantes;
}

export function evaluarNacionales(n: NoticiaInput, v2: ResultadoEditorJefeV2): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  const sugerencias = sugerenciasNacionales(n, ev);
  const utilidad = calcularUtilidadNacionales(n, ev);
  const originalidad = Math.max(ev.originalidad, calcularOriginalidadPorEstructura(n, ev));
  const diferenciador = evaluarDiferenciadorNI(n);
  const contradicciones = consistenciaNacionales(n, ev);

  return {
    vertical: 'Nacionales',
    sugerencias,
    utilidad,
    originalidad,
    consistencia: { aprobado: true, contradicciones },
    diferenciadorNI: { ...diferenciador, puntuacion: Math.max(diferenciador.puntuacion, originalidad >= 50 ? 50 : 0) },
    prioridadEditorial: prioridadDesdeDecision(v2, utilidad, originalidad),
    valorAgregado: diferenciador.elementosDetectados.length > 0
      ? diferenciador.elementosDetectados
      : ['La nota cumple los criterios básicos de su vertical; no se detectaron diferenciadores adicionales.'],
  };
}

