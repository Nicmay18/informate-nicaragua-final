import type { NoticiaInput } from '../../analizador-noticias';
import type { EvidenciaPuntuada, ResultadoEditorJefeV2, SugerenciasV2 } from '../engine';
import {
  type EvaluacionVertical,
  fabricarSugerencia,
  textoCompleto,
  textoPlano,
  detectoresValorAgregado,
  detectoresEvidencia,
  evaluarDiferenciadorNI,
  calcularOriginalidadPorEstructura,
  prioridadDesdeDecision,
} from './base';

const trayectoria = /\b(trayectoria|carrera|inicios|[ée]xitos|discograf[íi]a|filmograf[íi]a|premios|reconocimiento|legado)\b/i;
const declaraciones = /\b(declar[oó]|dijo|menci[oó]n|expres[oó]|manifest[oó]|asegur[oó]|afirm[oó]|confirm[oó]|anunci[oó]|revel[oó])\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/i;
const reaccionPublica = /\b(reacci[oó]n|redes sociales|tendencia|comentarios|seguidores|fans|p[úu]blico|audiencia|viral|memes)\b/i;

function detectarTrayectoria(n: NoticiaInput): boolean {
  return trayectoria.test(textoCompleto(n));
}

function detectarContextoEspectaculos(n: NoticiaInput): boolean {
  return /\b(contexto|antecedente|proyecto|producci[oó]n|evento|concierto|estreno|lanzamiento|gira|festival|obra|pel[íi]cula|serie|album)\b/i.test(textoCompleto(n));
}

const temasSensibles = /\b(ruptura|separaci[oó]n|divorcio|embarazo|relaci[oó]n|pareja|noviazgo|matrimonio|fallecimiento|muerte|muerto|muerta|suicidio|esc[aá]ndalo|pol[eé]mica)\b/i;
const marcasRumor = /\b(rumor|rumores|supuestamente|dicen que|se dice|versiones no confirmadas|sin confirmar|podr[ií]a|se especula|seg[uú]n fuentes no oficiales|se rumorea)\b/i;
const marcasConfirmacion = /\b(comunicado oficial|representante|manager|prensa oficial|red social oficial|cuenta oficial|confirmado por|oficialmente|la productora|el sello|la disquera)\b/i;

function detectarRumor(n: NoticiaInput): boolean {
  return marcasRumor.test(textoCompleto(n)) && !marcasConfirmacion.test(textoCompleto(n));
}

function detectarConfirmacionOficial(n: NoticiaInput): boolean {
  return detectoresEvidencia.redOficial(n) || marcasConfirmacion.test(textoCompleto(n));
}

function sugerenciasEspectaculos(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const tray = detectarTrayectoria(n);
  const contexto = detectarContextoEspectaculos(n);
  const decla = declaraciones.test(textoPlano(n));
  const reaccion = reaccionPublica.test(textoCompleto(n));
  const cronologia = detectoresValorAgregado.cronologia(n);
  const rumor = detectarRumor(n);
  const confirmacionOficial = detectarConfirmacionOficial(n);

  const oportunidades = [];

  if (rumor) {
    oportunidades.push(fabricarSugerencia(
      'Tratar la información como rumor hasta contar con comunicado oficial, representante o red social verificada. No afirmar hechos sensibles.',
      'Verificación.',
      '10-20 min',
      'Baja',
      'Evita difundir información no confirmada.'
    ));
  }

  if (!confirmacionOficial && temasSensibles.test(textoCompleto(n))) {
    oportunidades.push(fabricarSugerencia(
      'Exigir fuente oficial (representante, comunicado, red social verificada o productora) antes de publicar datos sensibles como rupturas, embarazos o fallecimientos.',
      'Riesgo reputacional.',
      '10-20 min',
      'Baja',
      'Protege credibilidad.'
    ));
  }

  if (!tray) {
    oportunidades.push(fabricarSugerencia(
      'Mencionar brevemente la trayectoria o relevancia del artista o proyecto.',
      'Contexto artístico.',
      '10-20 min',
      'Baja',
      'Sitúa al lector.'
    ));
  }

  if (!contexto) {
    oportunidades.push(fabricarSugerencia(
      'Agregar contexto del evento, estreno o lanzamiento: fecha, lugar y producción.',
      'Datos de fondo.',
      '10-20 min',
      'Baja',
      'Precisión.'
    ));
  }

  if (!decla) {
    oportunidades.push(fabricarSugerencia(
      'Incluir declaraciones públicas del artista, organizador o protagonista.',
      'Voz propia.',
      '15-30 min',
      'Media',
      'Cercanía.'
    ));
  }

  if (!reaccion) {
    oportunidades.push(fabricarSugerencia(
      'Mencionar reacción del público o redes sociales si es relevante.',
      'Impacto cultural.',
      '10-20 min',
      'Baja',
      'Actualidad.'
    ));
  }

  if (!cronologia) {
    oportunidades.push(fabricarSugerencia(
      'Ordenar cronológicamente los hechos si la nota narra una secuencia.',
      'Claridad narrativa.',
      '10-20 min',
      'Baja',
      'Comprensión.'
    ));
  }

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
    comoConvertirReferencia: [
      fabricarSugerencia(
        'Recopilar declaraciones públicas previas del protagonista sobre el tema.',
        'Contexto.',
        '30-60 min',
        'Media',
        'Profundidad.'
      ),
      fabricarSugerencia(
        'Construir cronología del proyecto o polémica.',
        'Línea de tiempo.',
        '30-60 min',
        'Baja',
        'Comprensión.'
      ),
      fabricarSugerencia(
        'Actualizar con nuevas declaraciones o fechas de presentación.',
        'Vigencia.',
        '10-20 min',
        'Baja',
        'Autoridad.'
      ),
    ],
    nivel10: [
      fabricarSugerencia(
        'Perfil o an[áa]lisis de trayectoria del artista con datos públicos.',
        'Evergreen cultural.',
        '2-3 días',
        'Alta',
        'Tr[áa]fico sostenido.'
      ),
      fabricarSugerencia(
        'Lista de próximos eventos o estrenos en Nicaragua.',
        'Agenda.',
        '1 día',
        'Baja',
        'Servicio.'
      ),
    ],
  };
}

function calcularUtilidadEspectaculos(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  let puntos = 30;
  if (detectarTrayectoria(n)) puntos += 20;
  if (reaccionPublica.test(textoCompleto(n))) puntos += 20;
  if (detectoresValorAgregado.explicacionImpacto(n)) puntos += 15;
  if (declaraciones.test(textoPlano(n))) puntos += 15;
  return Math.max(ev.utilidad, Math.min(100, puntos));
}

function consistenciaEspectaculos(n: NoticiaInput, _ev: EvidenciaPuntuada): string[] {
  const faltantes: string[] = [];
  if (!detectarTrayectoria(n)) faltantes.push('faltó trayectoria');
  if (!detectarContextoEspectaculos(n)) faltantes.push('faltó contexto del evento o proyecto');
  if (!declaraciones.test(textoPlano(n))) faltantes.push('faltó declaraciones');
  if (!reaccionPublica.test(textoCompleto(n))) faltantes.push('faltó reacción pública');
  if (!detectoresValorAgregado.cronologia(n)) faltantes.push('faltó cronología');
  return faltantes;
}

export function evaluarEspectaculos(n: NoticiaInput, v2: ResultadoEditorJefeV2): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  const sugerencias = sugerenciasEspectaculos(n, ev);
  const utilidad = calcularUtilidadEspectaculos(n, ev);
  const originalidad = Math.max(ev.originalidad, calcularOriginalidadPorEstructura(n, ev));
  const diferenciador = evaluarDiferenciadorNI(n);

  return {
    vertical: 'Espectáculos',
    sugerencias,
    utilidad,
    originalidad,
    consistencia: { aprobado: true, contradicciones: consistenciaEspectaculos(n, ev) },
    diferenciadorNI: { ...diferenciador, puntuacion: Math.max(diferenciador.puntuacion, originalidad >= 50 ? 50 : 0) },
    prioridadEditorial: prioridadDesdeDecision(v2, utilidad, originalidad),
    valorAgregado: diferenciador.elementosDetectados.length > 0
      ? diferenciador.elementosDetectados
      : ['La nota cumple los criterios básicos de su vertical; no se detectaron diferenciadores adicionales.'],
  };
}

