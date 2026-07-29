/**
 * MENI Quality Gate — Editor Score
 * ================================
 * Calcula el score final del Quality Gate y decide si bloquea.
 */

import type { ExplanationIndex, QualityGateIssue } from './types';
import { MAX_TRANSCRIPTION_PERCENT, MIN_ORIGINALITY_PERCENT } from './rules';

interface CategoryPatterns {
  contexto: RegExp[];
  explicacion: RegExp[];
  servicio: RegExp[];
}

const PATRONES_POR_CATEGORIA: Record<string, CategoryPatterns> = {
  Sucesos: {
    contexto: [
      /\bantecedente|previo|anterior|historia|registro|tendencia|patr[oó]n\b/i,
      /\bporqu[eé]|debido a|como resultado|causa|motivo|circunstancia|origen\b/i,
      /\binvestigaci[oó]n|pesquisa|operativo|seguimiento|b[uú]squeda\b/i,
    ],
    explicacion: [
      /\bqu[eé]\s+ocurri[oó]|qu[eé]\s+pas[oó]|c[oó]mo\s+sucedi[oó]\b/i,
      /\binvestiga\s+la\s+polic[ií]a|qu[eé]\s+falta\s+por\s+conocer\b/i,
      /\bcausa|motivo|circunstancias|antecedentes|prevenci[oó]n\b/i,
      /\bafecta\s+a\s+la\s+comunidad|impacto\s+en\s+la\s+zona\b/i,
    ],
    servicio: [
      /\bprevenci[oó]n|recomendaci[oó]n|qu[eé]\s+hacer|c[oó]mo\s+actuar\b/i,
      /\bautoridades\s+(informaron|indicaron|explicaron|dijeron)\b/i,
      /\bemergencia|n[uú]mero|tel[eé]fono|denuncia|reportar\b/i,
    ],
  },
  Nacionales: {
    contexto: [
      /\bantecedente|previo|anterior|historia|contexto|marco|referencia\b/i,
      /\bporqu[eé]|debido a|como resultado|causa|motivo|raz[oó]n\b/i,
      /\bconsecuencia|impacto|alcance|beneficio|cambio|transformaci[oó]n\b/i,
    ],
    explicacion: [
      /\bqu[eé]\s+cambia|qu[eé]\s+significa|qu[eé]\s+implica\b/i,
      /\ba\s+qui[eé]n\s+beneficia|qu[eé]\s+instituci[oó]n\s+interviene\b/i,
      /\bimpacto|alcance|instituci[oó]n|beneficiarios|cobertura\b/i,
      /\bqu[eé]\s+significa\s+para\s+nicaragua|qu[eé]\s+sigue\s+ahora\b/i,
    ],
    servicio: [
      /\bqu[eé]\s+cambia|c[oó]mo\s+afecta|qu[eé]\s+implica\b/i,
      /\bbeneficiarios|familias|comunidades|personas\s+beneficiadas\b/i,
      /\brequisitos|tr[aá]mite|c[oó]mo\s+acceder|d[oó]nde\s+acudir\b/i,
    ],
  },
  Internacionales: {
    contexto: [
      /\bcontexto|antecedentes|historia|previo|anterior|referencia\b/i,
      /\bpor\s+qu[eé]\s+importa|relevancia|repercute|consecuencia\b/i,
      /\brelaci[oó]n|v[ií]nculo|acuerdo|tratado|alianza|diplom[aá]tico\b/i,
    ],
    explicacion: [
      /\bpor\s+qu[eé]\s+importa\s+en\s+nicaragua|c[oó]mo\s+repercute\b/i,
      /\bcontexto\s+global|antecedentes|qu[eé]\s+significa\b/i,
      /\brelevancia|consecuencia|impacto\s+internacional\b/i,
      /\bqu[eé]\s+significa|c[oó]mo\s+afecta|es\s+decir\b/i,
    ],
    servicio: [
      /\bc[oó]mo\s+afecta\s+a\s+nicaragua|qu[eé]\s+significa\s+para\s+el\s+pa[ií]s\b/i,
      /\brecomendaci[oó]n|precauci[oó]n|alerta\b/i,
    ],
  },
  Deportes: {
    contexto: [
      /\bantecedente|previo|historia|rival|enfrentamiento|temporada\b/i,
      /\btorneo|liga|campeonato|tabla|posici[oó]n|clasificaci[oó]n\b/i,
      /\bcontexto|momento|forma|racha|estad[ií]stica\b/i,
    ],
    explicacion: [
      /\bc[oó]mo\s+queda\s+la\s+tabla|qu[eé]\s+sigue|pr[oó]ximo\s+partido\b/i,
      /\ban[aá]lisis|estad[ií]stica|resultado|consecuencia|figuras\b/i,
      /\bqu[eé]\s+significa\s+el\s+resultado|c[oó]mo\s+afecta\s+la\s+clasificaci[oó]n\b/i,
      /\bqu[eé]\s+viene\s+despu[eé]s|c[oó]mo\s+queda\b/i,
    ],
    servicio: [
      /\bpr[oó]ximo\s+partido|calendario|entradas|boletos|d[oó]nde\s+ver\b/i,
      /\bfecha|hora|canal|estadio|sede\b/i,
    ],
  },
  Tecnologia: {
    contexto: [
      /\bantecedente|previo|anterior|versi[oó]n|generaci[oó]n|evoluci[oó]n\b/i,
      /\bcontexto|historia|mercado|tendencia|competencia\b/i,
      /\bpor\s+qu[eé]|raz[oó]n|causa|motivo\b/i,
    ],
    explicacion: [
      /\bqu[eé]\s+hace|c[oó]mo\s+funciona|qu[eé]\s+cambia\b/i,
      /\bqu[eé]\s+ventajas|qu[eé]\s+limitaciones|vale\s+la\s+pena\b/i,
      /\bqui[eé]n\s+puede\s+usarlo|c[oó]mo\s+se\s+usa|para\s+qu[eé]\s+sirve\b/i,
      /\bfuncionamiento|utilidad|ventajas|beneficios|caracter[ií]sticas\b/i,
    ],
    servicio: [
      /\bqui[eé]n\s+puede\s+usarlo|c[oó]mo\s+conseguirlo|d[oó]nde\s+comprar\b/i,
      /\bprecio|costo|disponibilidad|requisitos|compatibilidad\b/i,
      /\brecomendaci[oó]n|consejo|tip\b/i,
    ],
  },
  Espectaculos: {
    contexto: [
      /\bantecedente|previo|edici[oó]n|anterior|historia|trayectoria\b/i,
      /\bcontexto|origen|tradici[oó]n|cultura|patrimonio\b/i,
      /\bartista|grupo|banda|productor|organizador\b/i,
    ],
    explicacion: [
      /\bvale\s+la\s+pena\s+asistir|qu[eé]\s+encontrar[aá]|qu[eé]\s+hace\s+diferente\b/i,
      /\bexperiencia|atractivo|novedad|propuesta|estilo\b/i,
      /\bqu[eé]\s+significa|c[oó]mo\s+es|qu[eé]\s+esperar\b/i,
    ],
    servicio: [
      /\bd[oó]nde|cu[aá]ndo|cu[aá]nto\s+cuesta|qui[eé]n\s+puede\s+ir\b/i,
      /\bentradas|boletos|horario|fecha|sede|lugar|costo|precio\b/i,
      /\bc[oó]mo\s+llegar|recomendaciones|tips|informaci[oó]n\s+pr[aá]ctica\b/i,
    ],
  },
};

const PATRONES_DEFAULT: CategoryPatterns = {
  contexto: [
    /\bantecedente|contexto|previo|anterior|historia|referencia\b/i,
    /\bporqu[eé]|debido a|como resultado|causa|motivo\b/i,
    /\bconsecuencia|impacto|afectaci[oó]n|alcance|cambio\b/i,
  ],
  explicacion: [
    /\bqu[eé]\s+significa|c[oó]mo\s+funciona|qu[eé]\s+es|qu[eé]\s+cambia\b/i,
    /\bes\s+decir|o\s+sea|en\s+otras\s+palabras|esto\s+significa\s+que\b/i,
    /\bpor\s+qu[eé]|c[oó]mo\s+afecta|qu[eé]\s+implica|qu[eé]\s+sigue\b/i,
    /\bimpacto|alcance|consecuencia|beneficio|utilidad\b/i,
  ],
  servicio: [
    /\bqu[eé]\s+hacer|c[oó]mo\s+afecta|qu[eé]\s+cambia\b/i,
    /\bprevenci[oó]n|recomendaci[oó]n|consejo|tip\b/i,
    /\bautoridades\s+(informaron|indicaron|explicaron|dijeron)\b/i,
  ],
};

function getPatronesCategoria(categoria: string): CategoryPatterns {
  const normalized = categoria?.trim() || '';
  if (PATRONES_POR_CATEGORIA[normalized]) return PATRONES_POR_CATEGORIA[normalized];
  const lower = normalized.toLowerCase();
  for (const [key, patterns] of Object.entries(PATRONES_POR_CATEGORIA)) {
    if (key.toLowerCase() === lower) return patterns;
  }
  if (/suceso|polic|accidente|delito|crimen/i.test(normalized)) return PATRONES_POR_CATEGORIA.Sucesos;
  if (/deporte|f[uú]tbol|b[eé]isbol/i.test(normalized)) return PATRONES_POR_CATEGORIA.Deportes;
  if (/tecno|gadget|app|software/i.test(normalized)) return PATRONES_POR_CATEGORIA.Tecnologia;
  if (/espect|cultura|cine|m[uú]sica/i.test(normalized)) return PATRONES_POR_CATEGORIA.Espectaculos;
  if (/internac|mundial|global/i.test(normalized)) return PATRONES_POR_CATEGORIA.Internacionales;
  return PATRONES_DEFAULT;
}

function calcularPorcentajePatrones(lower: string, patrones: RegExp[]): number {
  let porcentaje = 0;
  const paso = Math.floor(100 / patrones.length);
  for (const p of patrones) {
    if (p.test(lower)) porcentaje += paso;
  }
  return Math.min(porcentaje, 100);
}

export function computeExplanationIndex(textoPlano: string, fuenteOriginal?: string, categoria?: string): ExplanationIndex {
  const lower = textoPlano.toLowerCase();
  const patrones = getPatronesCategoria(categoria || '');

  let porcentajeTranscripcion = 0;
  if (fuenteOriginal) {
    const fuenteLower = fuenteOriginal.toLowerCase();
    const palabras = lower.split(/\s+/).filter(Boolean);
    const ventana = 5;
    let coincidencias = 0;
    for (let i = 0; i <= palabras.length - ventana; i++) {
      const ngrama = palabras.slice(i, i + ventana).join(' ');
      if (fuenteLower.includes(ngrama)) coincidencias++;
    }
    const total = Math.max(palabras.length - ventana, 1);
    porcentajeTranscripcion = Math.round((coincidencias / total) * 100);
  }

  const porcentajeContexto = calcularPorcentajePatrones(lower, patrones.contexto);
  const porcentajeExplicacion = calcularPorcentajePatrones(lower, patrones.explicacion);
  const porcentajeServicio = calcularPorcentajePatrones(lower, patrones.servicio);

  return { porcentajeTranscripcion, porcentajeContexto, porcentajeExplicacion, porcentajeServicio };
}

export function computeOriginalityPercent(explanationIndex: ExplanationIndex): number {
  const { porcentajeTranscripcion, porcentajeContexto, porcentajeExplicacion, porcentajeServicio } = explanationIndex;

  const reescritura = 100 - porcentajeTranscripcion;
  const diferenciacion = Math.min(
    Math.round((porcentajeContexto + porcentajeExplicacion + porcentajeServicio) / 3),
    100
  );

  const originalidad = Math.round(
    reescritura * 0.30 +
    porcentajeContexto * 0.25 +
    porcentajeExplicacion * 0.20 +
    porcentajeServicio * 0.15 +
    diferenciacion * 0.10
  );

  return Math.max(0, Math.min(originalidad, 100));
}

export function computeEditorScore(
  issues: QualityGateIssue[],
  explanationIndex: ExplanationIndex,
  originalidadPorcentaje: number
): { score: number; bloqueado: boolean; motivosBloqueo: string[] } {
  let score = 100;
  const motivosBloqueo: string[] = [];

  for (const issue of issues) {
    if (issue.severidad === 'blocking') {
      score -= 20;
      motivosBloqueo.push(issue.mensaje);
    } else if (issue.severidad === 'warning') {
      score -= 8;
    } else {
      score -= 2;
    }
  }

  if (explanationIndex.porcentajeTranscripcion > MAX_TRANSCRIPTION_PERCENT) {
    score -= 15;
    motivosBloqueo.push(
      `Transcripción muy alta (${explanationIndex.porcentajeTranscripcion}%, máximo permitido ${MAX_TRANSCRIPTION_PERCENT}%).`
    );
  }

  if (originalidadPorcentaje < MIN_ORIGINALITY_PERCENT) {
    score -= 10;
  }

  score = Math.max(0, Math.min(score, 100));
  const bloqueado = motivosBloqueo.length > 0;

  return { score, bloqueado, motivosBloqueo };
}
