export interface SiteHealthCheck {
  url: string;
  status: number;
  ok: boolean;
  responseMs: number;
  error?: string;
}

export interface DepartamentoModuleResult {
  name: string;
  ok: boolean;
  count: number;
  note: string;
}

export interface DepartamentoDailyReport {
  date: string;
  runAt: string;
  site: {
    status: 'ok' | 'warning' | 'critical';
    root: SiteHealthCheck;
    noticias: SiteHealthCheck;
  };
  corrections: DepartamentoModuleResult;
  approvals: DepartamentoModuleResult;
  growth: DepartamentoModuleResult;
  editorial: DepartamentoModuleResult;
  incidents: {
    level: 'critical' | 'warning' | 'ok';
    active: number;
    resolved: number;
    items: string[];
  };
  learning: string[];
  summary: string;
  nextWork: string;
}
