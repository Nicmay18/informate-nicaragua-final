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

export type DeptoJobType =
  | 'health-check'
  | 'site-availability'
  | 'article-pipeline'
  | 'growth-check'
  | 'monetization-check'
  | 'editorial-batch'
  | 'daily-report'
  | 'watchdog'
  | 'cleanup'
  | 'operational-repair';

export type DeptoJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retry'
  | 'dead-letter';

export type DeptoPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface DeptoJob {
  id?: string;
  jobId: string;
  type: DeptoJobType;
  priority: DeptoPriority;
  source: string;
  createdAt: string;
  scheduledFor: string;
  status: DeptoJobStatus;
  attempts: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: Record<string, unknown>;
  correlationId: string;
  dedupKey?: string;
  payload?: Record<string, unknown>;
}

export interface DeptoHeartbeat {
  id?: string;
  component: 'scheduler' | 'health-check' | 'article-pipeline' | 'growth' | 'monetization-check' | 'watchdog' | 'daily-report';
  status: 'healthy' | 'degraded' | 'down';
  lastRunAt: string;
  nextExpectedAt: string;
  note?: string;
  durationMs?: number;
  jobsCompleted?: number;
  jobsFailed?: number;
}

export type DeptoHealthLevel = 'HEALTHY' | 'DEGRADED' | 'CRITICAL';

export interface DepartamentoWorkSummary {
  lastWorkAt: string | null;
  workDone24h: number;
  problemsDetected: number;
  problemsResolved: number;
  opportunitiesFound: number;
  actionsExecuted: number;
  verifications: number;
  learnings: number;
  pendingApprovals: number;
  activeJobs: number;
  failedJobs: number;
  deadLetterJobs: number;
  health: DeptoHealthLevel;
  componentStatus: Record<string, 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN'>;
  recentItems: string[];
}
