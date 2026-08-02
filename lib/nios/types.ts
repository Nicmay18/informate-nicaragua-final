export type NiosPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type NiosStatus = 'ok' | 'warning' | 'opportunity' | 'requires_attention' | 'not_implemented';

export interface NiosRecommendation {
  id: string;
  title: string;
  description: string;
  priority: NiosPriority;
  impact?: string;
  action: string;
  module: string;
}

export interface NiosMetric<T = unknown> {
  label: string;
  value: T;
  previous?: T;
  change?: number;
}

export interface NiosModuleReport {
  module: string;
  status: NiosStatus;
  summary: string;
  metrics: NiosMetric[];
  recommendations: NiosRecommendation[];
  errors?: string[];
}

export interface NiosCeoReport {
  headline: string;
  whatHappened: string[];
  whatWorked: string[];
  whatDidNotWork: string[];
  opportunities: string[];
  risks: string[];
  actionsForToday: string[];
}

export interface NiosReport {
  generatedAt: string;
  status: 'ok' | 'partial' | 'error';
  errors?: string[];
  modules: Record<string, NiosModuleReport>;
  priorities: NiosRecommendation[];
  alerts: NiosRecommendation[];
  opportunities: NiosRecommendation[];
  risks: NiosRecommendation[];
  nextActions: NiosRecommendation[];
  ceoReport: NiosCeoReport;
}
