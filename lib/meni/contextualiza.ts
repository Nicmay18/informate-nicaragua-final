/**
 * MENI Contextualiza — Auditoría explicable
 * ===========================================
 * Descompone la dimensión "contextualiza" del Sello NI en submétricas
 * con score, evidencia encontrada y evidencia faltante.
 */

export interface ContextSubscore {
  score: number;
  encontrado: string[];
  faltante: string[];
  maximo: number;
}

export interface ContextScore {
  antecedentes: ContextSubscore;
  marco_legal: ContextSubscore;
  datos_verificables: ContextSubscore;
  contexto_temporal: ContextSubscore;
  contexto_geografico: ContextSubscore;
  instituciones: ContextSubscore;
  impacto_social: ContextSubscore;
  fuentes: ContextSubscore;
}

interface ContextDetector {
  name: keyof ContextScore;
  signals: string[];
  maximo: number;
  pesoPorMatch: number;
}

const DETECTORS: ContextDetector[] = [
  {
    name: 'antecedentes',
    signals: ['anteriormente', 'previamente', 'ya había', 'históricamente', 'en el pasado', 'no es la primera', 'pasado'],
    maximo: 20,
    pesoPorMatch: 10,
  },
  {
    name: 'marco_legal',
    signals: ['ley 779', 'ley 144', 'código penal', 'ley de', 'resolución', 'decreto', 'normativa', 'regulación'],
    maximo: 20,
    pesoPorMatch: 10,
  },
  {
    name: 'datos_verificables',
    signals: ['según', 'de acuerdo con', 'según datos de', 'cifras', 'estadísticas', 'reportó', 'informó'],
    maximo: 20,
    pesoPorMatch: 10,
  },
  {
    name: 'contexto_temporal',
    signals: ['ayer', 'este', 'la semana pasada', 'el pasado', 'a las', 'horas', 'minutos', 'desde', 'hasta'],
    maximo: 10,
    pesoPorMatch: 5,
  },
  {
    name: 'contexto_geografico',
    signals: ['municipio', 'departamento', 'barrio', 'comunidad', 'carretera', 'km', 'lugar', 'zona', 'sector'],
    maximo: 10,
    pesoPorMatch: 5,
  },
  {
    name: 'instituciones',
    signals: ['policía nacional', 'minsa', 'mined', 'marena', 'ineter', 'fiscalía', 'alcaldía', 'asamblea nacional', 'gobierno'],
    maximo: 15,
    pesoPorMatch: 7.5,
  },
  {
    name: 'impacto_social',
    signals: ['afecta', 'impacto', 'para la población', 'comunidad', 'ciudadanos', 'familias', 'consecuencia'],
    maximo: 15,
    pesoPorMatch: 7.5,
  },
  {
    name: 'fuentes',
    signals: ['fuente', 'fuentes', 'declaró', 'indicó', 'señaló', 'según versiones', 'versiones preliminares'],
    maximo: 20,
    pesoPorMatch: 10,
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function computeContextScore(titulo: string, contenido: string, resumen?: string): ContextScore {
  const fullText = normalize(`${titulo || ''} ${contenido || ''} ${resumen || ''}`);
  const result = {} as ContextScore;

  for (const detector of DETECTORS) {
    const encontrado: string[] = [];
    let raw = 0;
    for (const signal of detector.signals) {
      const norm = normalize(signal);
      const isPhrase = norm.includes(' ');
      const pattern = isPhrase
        ? new RegExp(norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        : new RegExp(`\\b${norm}\\b`, 'g');
      const matches = fullText.match(pattern) || [];
      if (matches.length > 0) {
        encontrado.push(signal);
        raw += matches.length * detector.pesoPorMatch;
      }
    }
    const score = Math.min(detector.maximo, raw);
    const missing: string[] = [];
    if (encontrado.length === 0) {
      missing.push(`No se detectó ${detector.name}`);
    } else if (score < detector.maximo) {
      missing.push(`${detector.name} presente pero insuficiente`);
    }
    result[detector.name] = {
      score: Math.round(score),
      encontrado: Array.from(new Set(encontrado)),
      faltante: missing,
      maximo: detector.maximo,
    };
  }

  return result;
}
