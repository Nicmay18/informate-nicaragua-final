import type { MeniContentProfile } from './profile-detector';

/**
 * MENI Contextualiza — Auditoría explicable
 * ===========================================
 * Descompone la dimensión "contextualiza" del Sello NI en submétricas
 * con score, evidencia encontrada y evidencia faltante.
 * 
 * Pesos por perfil: ajustan la importancia de cada submétrica según el
 * tipo de contenido, sin cambiar la estructura ni el score histórico
 * cuando no se proporciona perfil.
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

const PROFILE_CONTEXT_WEIGHTS: Partial<Record<MeniContentProfile, Partial<Record<keyof ContextScore, number>>>> = {
  sucesos: {
    antecedentes: 1.2,
    marco_legal: 1.2,
    datos_verificables: 1.2,
    instituciones: 1.2,
    fuentes: 1.2,
  },
  violencia_genero: {
    antecedentes: 1.2,
    marco_legal: 1.5,
    instituciones: 1.2,
    fuentes: 1.2,
  },
  economia: {
    datos_verificables: 1.5,
    impacto_social: 1.5,
    instituciones: 1.2,
    contexto_geografico: 1.0,
  },
  salud: {
    datos_verificables: 1.5,
    impacto_social: 1.2,
    contexto_geografico: 1.0,
  },
  deportes: {
    marco_legal: 0,
    instituciones: 0.2,
    datos_verificables: 1.2,
    contexto_temporal: 1.2,
    contexto_geografico: 1.0,
    impacto_social: 1.0,
  },
  cultura: {
    antecedentes: 1.2,
    contexto_temporal: 1.2,
    impacto_social: 1.0,
  },
  tecnologia: {
    datos_verificables: 1.2,
    impacto_social: 1.2,
    instituciones: 1.0,
  },
  politica: {
    marco_legal: 1.5,
    instituciones: 1.2,
    datos_verificables: 1.2,
    antecedentes: 1.2,
  },
  nacionales: {
    instituciones: 1.2,
    marco_legal: 1.0,
    datos_verificables: 1.0,
  },
  educacion: {
    marco_legal: 1.0,
    instituciones: 1.2,
    datos_verificables: 1.0,
    impacto_social: 1.0,
  },
  ambiente: {
    antecedentes: 1.0,
    datos_verificables: 1.2,
    impacto_social: 1.5,
    contexto_geografico: 1.2,
  },
  turismo: {
    contexto_geografico: 1.5,
    datos_verificables: 1.2,
    impacto_social: 0.8,
    antecedentes: 1.0,
    fuentes: 1.2,
  },
  gastronomia: {
    antecedentes: 1.2,
    contexto_temporal: 1.0,
    impacto_social: 0.8,
    fuentes: 1.0,
  },
};

const DETECTORS: ContextDetector[] = [
  {
    name: 'antecedentes',
    signals: [
      'anteriormente', 'previamente', 'ya habia', 'ya había', 'historicamente', 'históricamente', 'en el pasado',
      'no es la primera', 'pasado', 'se suma a', 'otros eventos', 'registrados en',
      'últimos meses', 'últimas semanas', 'casos anteriores', 'no es el primer',
      'antecedente', 'antecedentes', 'precedentes', 'ciclo', 'patrón de', 'patron de',
      'con antelación', 'con anterioridad', 'desde entonces', 'desde', 'hasta', 'primera vez',
      'en 2023', 'en 2024', 'en 2025', 'en 2026', 'año 2023', 'año 2024', 'año 2025', 'año 2026',
      'aniversario', 'aniversario de', 'celebración', 'conmemoración', 'conmemoracion',
      'patrimonio', 'unesco', 'designacion', 'designación', 'reconocimiento', 'declarado', 'declaración',
      'comparación', 'comparacion', 'comparado con', 'frente a', 'a diferencia de', 'en contraste',
    ],
    maximo: 20,
    pesoPorMatch: 10,
  },
  {
    name: 'marco_legal',
    signals: [
      'ley 779', 'ley 144', 'código penal', 'ley de', 'resolución', 'decreto',
      'normativa', 'regulación', 'ley', 'delito', 'femicidio', 'tipificación',
      'sanción', 'penal', 'código', 'artículo', 'norma', 'jurídico', 'legal',
      'procedimiento', 'investigación judicial',
    ],
    maximo: 20,
    pesoPorMatch: 10,
  },
  {
    name: 'datos_verificables',
    signals: [
      'segun', 'según', 'de acuerdo con', 'segun datos de', 'según datos de', 'cifras', 'estadisticas', 'estadísticas',
      'reporto', 'reportó', 'informo', 'informó', 'años', 'edad', 'numero de', 'número de', 'cantidad de',
      'se reportaron', 'registro', 'registró', 'hubo', 'mas de', 'más de', 'menos de',
      'intur', 'sitca', 'turistas', 'llegadas', 'visitantes', 'captura de pantalla', 'capturas',
      'horarios', 'horario', 'precios', 'precio', 'boletos', 'entradas', 'cartelera', 'clasificacion', 'clasificación',
      'pg13', 'pg-13', 'miles de', 'millones de', 'por ciento', 'porcentaje', '%',
    ],
    maximo: 20,
    pesoPorMatch: 10,
  },
  {
    name: 'contexto_temporal',
    signals: [
      'ayer', 'este', 'la semana pasada', 'el pasado', 'a las', 'horas', 'minutos', 'desde', 'hasta',
      'en 2023', 'en 2024', 'en 2025', 'en 2026', 'año 2023', 'año 2024', 'año 2025', 'año 2026',
      'aniversario', 'aniversario de', 'conmemoración', 'conmemoracion', 'celebración', 'celebracion',
      'este año', 'este mes', 'próximo', 'proximo', 'anterior', 'anteriormente', 'durante',
    ],
    maximo: 10,
    pesoPorMatch: 5,
  },
  {
    name: 'contexto_geografico',
    signals: [
      'municipio', 'departamento', 'barrio', 'comunidad', 'carretera', 'km',
      'lugar', 'zona', 'sector', 'región', 'localidad', 'municipio de',
      'departamento de',
    ],
    maximo: 10,
    pesoPorMatch: 5,
  },
  {
    name: 'instituciones',
    signals: [
      'policia nacional', 'policía nacional', 'minsa', 'mined', 'marena', 'ineter', 'fiscalía', 'fiscalia',
      'alcaldia', 'alcaldía', 'asamblea nacional', 'gobierno', 'autoridades', 'ministerio',
      'delegación', 'delegacion', 'comisaría', 'comisaria',
      'unesco', 'intur', 'sitca', 'inss', 'seguro social', 'instituto', 'organismo', 'entidad',
    ],
    maximo: 15,
    pesoPorMatch: 7.5,
  },
  {
    name: 'impacto_social',
    signals: [
      'afecta', 'impacto', 'para la población', 'comunidad', 'ciudadanos',
      'familias', 'consecuencia', 'menores', 'deja', 'familiares', 'familia',
      'hijos', 'víctimas', 'población', 'afectados', 'afecta a',
      'consecuencias', 'repercusiones',
    ],
    maximo: 15,
    pesoPorMatch: 7.5,
  },
  {
    name: 'fuentes',
    signals: [
      'fuente', 'fuentes', 'declaró', 'indicó', 'señaló', 'según versiones',
      'versiones preliminares', 'indicaron', 'confirmaron', 'confirmó',
      'señalaron', 'declararon', 'manifestaron', 'sostuvieron', 'sostuvo',
      'aclaró', 'explicó', 'dijo', 'información preliminar', 'extraoficial',
      'de manera extraoficial', 'según especialistas', 'según la propia',
      'coinciden en que', 'recomiendan', 'describen', 'atribuyen',
      'según la ley', 'hipótesis', 'especialistas',
    ],
    maximo: 20,
    pesoPorMatch: 10,
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/<[^>]+>/g, ' ');
}

export function computeContextScore(
  titulo: string,
  contenido: string,
  resumen?: string,
  perfil?: MeniContentProfile,
): ContextScore {
  const fullText = normalize(`${titulo || ''} ${contenido || ''} ${resumen || ''}`);
  const result = {} as ContextScore;
  const weights = perfil ? (PROFILE_CONTEXT_WEIGHTS[perfil] || {}) : {};

  for (const detector of DETECTORS) {
    const encontrado: string[] = [];
    let raw = 0;
    const weight = weights[detector.name] ?? 1;
    const effectivePeso = detector.pesoPorMatch * weight;
    for (const signal of detector.signals) {
      const norm = normalize(signal);
      const isPhrase = norm.includes(' ');
      const pattern = isPhrase
        ? new RegExp(norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        : new RegExp(`\\b${norm}\\b`, 'g');
      const matches = fullText.match(pattern) || [];
      if (matches.length > 0) {
        encontrado.push(signal);
        raw += matches.length * effectivePeso;
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
