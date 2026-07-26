/**
 * Inteligencia de Portada — Tipos
 * ==================================
 * Equilibrio y estrategia editorial para la portada.
 */

/** Métricas de balance de la portada */
export interface BalanceReport {
  /** Diversidad de categorías (0-100) */
  categoryDiversity: number;
  /** Distribución de categorías en la portada */
  categoryDistribution: Record<string, number>;
  /** Categorías sobrerrepresentadas */
  overrepresented: string[];
  /** Categorías subrepresentadas */
  underrepresented: string[];
  /** Categorías ausentes */
  missing: string[];

  /** Frescura promedio de artículos en portada (horas) */
  avgFreshnessHours: number;
  /** Artículos stale en portada (>48h) */
  staleInPortada: number;

  /** Diversidad geográfica (0-100) */
  geoDiversity: number;
  /** Departamentos representados */
  departamentos: string[];
  /** Departamentos ausentes */
  departamentosAusentes: string[];

  /** Diversidad de autores (0-100) */
  authorDiversity: number;
  /** Autores en portada */
  autores: string[];
  /** Concentración de un solo autor (%) */
  maxAuthorConcentration: number;

  /** Score general de equilibrio (0-100) */
  balanceScore: number;
  /** Estado del balance */
  estado: 'EQUILIBRADO' | 'DESEQUILIBRADO' | 'CRITICO';
}

/** Tipo de sugerencia de portada */
export type SuggestionType =
  | 'promote'
  | 'demote'
  | 'replace'
  | 'add_category'
  | 'remove_duplicate'
  | 'freshness'
  | 'diversity'
  | 'pin'
  | 'unpin';

/** Sugerecia individual de portada */
export interface PortadaSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  reason: string;
  priority: 'alta' | 'media' | 'baja';
  targetSlug?: string;
  targetCategory?: string;
  suggestedSlug?: string;
  impact: string;
}

/** Conflicto o sesgo detectado */
export interface PortadaConflict {
  id: string;
  type: 'topic_overlap' | 'author_concentration' | 'geo_concentration' | 'category_monopoly' | 'stale_content';
  description: string;
  severity: 'warning' | 'critical';
  affectedSlugs: string[];
  suggestedAction: string;
}

/** Análisis completo de portada */
export interface PortadaAnalysis {
  analyzedAt: string;
  totalArticles: number;
  balance: BalanceReport;
  conflicts: PortadaConflict[];
  suggestions: PortadaSuggestion[];
  topCandidates: Array<{
    slug: string;
    title: string;
    category: string;
    score: number;
    reason: string;
  }>;
  underperformingInPortada: Array<{
    slug: string;
    title: string;
    category: string;
    reason: string;
  }>;
  editorialSummary: string;
}

/** Configuración de estrategia */
export interface StrategyConfig {
  targetCategoryDistribution: Record<string, number>;
  maxArticlesPerAuthor: number;
  maxArticlesPerCategory: number;
  freshnessThresholdHours: number;
  enableAutoSuggestions: boolean;
  balanceWeights: {
    categoryDiversity: number;
    geoDiversity: number;
    authorDiversity: number;
    freshness: number;
  };
}

export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  targetCategoryDistribution: {
    Sucesos: 20,
    Nacionales: 20,
    Internacionales: 10,
    Deportes: 10,
    Economía: 10,
    Política: 10,
    Cultura: 5,
    Salud: 5,
    Tecnología: 5,
    Espectáculos: 5,
  },
  maxArticlesPerAuthor: 3,
  maxArticlesPerCategory: 4,
  freshnessThresholdHours: 48,
  enableAutoSuggestions: true,
  balanceWeights: {
    categoryDiversity: 0.35,
    geoDiversity: 0.20,
    authorDiversity: 0.20,
    freshness: 0.25,
  },
};

/** Categorías esperadas en Nicaragua Informate */
export const EXPECTED_CATEGORIES = [
  'Sucesos',
  'Nacionales',
  'Internacionales',
  'Deportes',
  'Economía',
  'Política',
  'Cultura',
  'Salud',
  'Tecnología',
  'Espectáculos',
];

/** Departamentos de Nicaragua */
export const DEPARTAMENTOS_NICARAGUA = [
  'Managua',
  'León',
  'Granada',
  'Masaya',
  'Chinandega',
  'Estelí',
  'Matagalpa',
  'Jinotega',
  'Rivas',
  'Carazo',
  'Nueva Segovia',
  'Madriz',
  'Chontales',
  'Boaco',
  'Río San Juan',
  'RAAN',
  'RAAS',
];
