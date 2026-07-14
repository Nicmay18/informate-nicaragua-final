import type { NoticiaInput } from '../../analizador-noticias';
import type { EvidenciaPuntuada, ResultadoEditorJefeV2, SugerenciasV2 } from '../engine';
import {
  type EvaluacionVertical,
  fabricarSugerencia,
  textoCompleto,
  detectoresValorAgregado,
  evaluarDiferenciadorNI,
  calcularOriginalidadPorEstructura,
  prioridadDesdeDecision,
} from './base';

const especificaciones = /\b(especificaciones|caracter[íi]sticas|ficha t[ée]cnica|modelo|versi[oó]n|procesador|memoria ram|almacenamiento|pantalla|bater[íi]a|conectividad|resoluci[oó]n|gpu|chip|c[aá]mara)\b/i;
const compatibilidad = /\b(compatibilidad|compatible|soporta|requiere|funciona en|disponible para|sistema operativo|android|ios|windows|linux|macos|iphone|samsung|xiaomi|pixel|motorola|huawei|oneplus|smartphone|pc|laptop|tablet|wearable)\b/i;
const comoUsarlo = /\b(c[óo]mo usar|c[óo]mo funciona|c[óo]mo activar|pasos para|configurar|habilitar|tutorial|gu[íi]a r[áa]pida|primera vez|c[óo]mo instalar|c[óo]mo acceder)\b/i;
const riesgos = /\b(riesgo|amenaza|vulnerabilidad|privacidad|seguridad|estafa|cuidado|precauci[oó]n|virus|malware|phishing|filtraci[oó]n|ciberseguridad|hackeo|brecha|robo de datos)\b/i;
const empresasTech = /\b(ia|inteligencia artificial|openai|chatgpt|google|apple|samsung|microsoft|meta|tesla|amazon|nvidia|android|iphone|windows|linux|macos|ios|x|twitter|facebook|instagram|whatsapp|tiktok|youtube|spotify|netflix)\b/i;

function detectarQueCambia(n: NoticiaInput): boolean {
  return /\b(qu[eé] cambia|novedad|nueva funci[oó]n|nueva app|nueva herramienta|nueva plataforma|actualizaci[oó]n|mejora|cambio|ahora permite|ahora ofrece|permite|habilita|posibilita|lanzamiento)\b/i.test(textoCompleto(n)) || empresasTech.test(textoCompleto(n));
}

function detectarBeneficiario(n: NoticiaInput): boolean {
  return /\b(qui[eé]n se beneficia|para qui[eé]n es [úu]til|dirigido a|usuarios de|empresas|pymes|emprendedores|estudiantes|profesionales)\b/i.test(textoCompleto(n));
}

function sugerenciasTecnologia(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const queCambia = detectarQueCambia(n);
  const beneficiario = detectarBeneficiario(n);
  const uso = comoUsarlo.test(textoCompleto(n));
  const riesgo = riesgos.test(textoCompleto(n));
  const compa = compatibilidad.test(textoCompleto(n));
  const specs = especificaciones.test(textoCompleto(n));

  const oportunidades = [];

  if (!queCambia) {
    oportunidades.push(fabricarSugerencia(
      'Explicar qu[é] cambia o qu[é] es lo nuevo respecto a la situación anterior.',
      'Claridad tecnológica.',
      '10-20 min',
      'Baja',
      'Comprensión.'
    ));
  }

  if (!beneficiario) {
    oportunidades.push(fabricarSugerencia(
      'Explicitar qui[é]n se beneficia: usuarios, empresas, pymes o sector público.',
      'Utilidad.',
      '10-20 min',
      'Baja',
      'Relevancia.'
    ));
  }

  if (!uso) {
    oportunidades.push(fabricarSugerencia(
      'Incluir cómo usarlo o activarlo de forma sencilla.',
      'Servicio pr[áa]ctico.',
      '15-30 min',
      'Media',
      'Valor inmediato.'
    ));
  }

  if (!riesgo) {
    oportunidades.push(fabricarSugerencia(
      'Mencionar riesgos de privacidad, seguridad o limitaciones conocidas.',
      'Responsabilidad editorial.',
      '10-20 min',
      'Baja',
      'Confianza.'
    ));
  }

  if (!compa && !specs) {
    oportunidades.push(fabricarSugerencia(
      'Agregar compatibilidad, requisitos o especificaciones técnicas b[áa]sicas.',
      'Precisión.',
      '10-20 min',
      'Baja',
      'Reduce dudas.'
    ));
  }

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
    comoConvertirReferencia: [
      fabricarSugerencia(
        'Comparar con la versión anterior o soluciones similares del mercado.',
        'Contexto de mercado.',
        '30-60 min',
        'Media',
        'Diferenciación.'
      ),
      fabricarSugerencia(
        'Construir una guía paso a paso para activar o usar la novedad.',
        'Evergreen.',
        '1 día',
        'Baja',
        'Tr[áa]fico sostenido.'
      ),
      fabricarSugerencia(
        'Actualizar con fechas de disponibilidad en Nicaragua o precios regionales.',
        'Vigencia.',
        '10-20 min',
        'Baja',
        'Autoridad local.'
      ),
    ],
    nivel10: [
      fabricarSugerencia(
        'An[áa]lisis de impacto de la tecnología en Nicaragua: conectividad, costos y adopción.',
        'An[áa]lisis de fondo.',
        '2-4 días',
        'Alta',
        'Autoridad editorial.'
      ),
      fabricarSugerencia(
        'Guía de seguridad y privacidad para usuarios.',
        'Evergreen.',
        '1 día',
        'Baja',
        'Servicio.'
      ),
    ],
  };
}

function calcularUtilidadTecnologia(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  let puntos = 30;
  if (detectarQueCambia(n)) puntos += 25;
  if (detectarBeneficiario(n)) puntos += 20;
  if (comoUsarlo.test(textoCompleto(n))) puntos += 15;
  if (riesgos.test(textoCompleto(n))) puntos += 10;
  if (compatibilidad.test(textoCompleto(n)) || especificaciones.test(textoCompleto(n))) puntos += 10;
  return Math.max(ev.utilidad, Math.min(100, puntos));
}

function consistenciaTecnologia(n: NoticiaInput, _ev: EvidenciaPuntuada): string[] {
  const faltantes: string[] = [];
  if (!detectarQueCambia(n)) faltantes.push('faltó comparativa con situación anterior');
  if (!detectarBeneficiario(n)) faltantes.push('faltó quién se beneficia');
  if (!comoUsarlo.test(textoCompleto(n))) faltantes.push('faltó guía');
  if (!riesgos.test(textoCompleto(n))) faltantes.push('faltó riesgos');
  if (!compatibilidad.test(textoCompleto(n)) && !especificaciones.test(textoCompleto(n))) faltantes.push('faltó compatibilidad');
  if (!detectoresValorAgregado.antecedentes(n)) faltantes.push('faltó antecedentes');
  return faltantes;
}

export function evaluarTecnologia(n: NoticiaInput, v2: ResultadoEditorJefeV2): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  const sugerencias = sugerenciasTecnologia(n, ev);
  const utilidad = calcularUtilidadTecnologia(n, ev);
  const originalidad = Math.max(ev.originalidad, calcularOriginalidadPorEstructura(n, ev));
  const diferenciador = evaluarDiferenciadorNI(n);

  return {
    vertical: 'Tecnología',
    sugerencias,
    utilidad,
    originalidad,
    consistencia: { aprobado: true, contradicciones: consistenciaTecnologia(n, ev) },
    diferenciadorNI: { ...diferenciador, puntuacion: Math.max(diferenciador.puntuacion, originalidad >= 50 ? 50 : 0) },
    prioridadEditorial: prioridadDesdeDecision(v2, utilidad, originalidad),
    valorAgregado: diferenciador.elementosDetectados.length > 0
      ? diferenciador.elementosDetectados
      : ['La nota cumple los criterios básicos de su vertical; no se detectaron diferenciadores adicionales.'],
  };
}

