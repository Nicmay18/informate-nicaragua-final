/**
 * Data Contracts — Canonical types shared across MENI, NIOS, Supervisor, and UI.
 *
 * FASE 2: This module is the single source of truth for the data entities
 * defined in docs/forensic-audit/DATA_CONTRACTS.md.
 *
 * Rules:
 * - No `any` in critical contracts.
 * - `null` means UNKNOWN / NOT_MEASURED, never 0.
 * - Every exported type has a documented source of authority.
 */

// Re-export from the canonical source of truth for each concern.
// This module does not redefine; it unifies the public surface.

export type { Noticia, PublicCategory, ArticleType, ExplainerFields } from '@/lib/types';

export type { NoticiaInput } from '@/lib/editorial/types';
export type { MeniResult, MeniCategoria, MeniPrioridad } from '@/lib/meni/types';

export type {
  SupervisorDecision,
  SupervisorVerdict,
  SupervisorIssue,
  ArticleContext,
} from '@/lib/supervisor/types';

export type {
  ArticleFusion,
  GSCSnapshot,
  GSCDataRow,
  GSCQueryRow,
  GSCCountryRow,
  GSCDeviceRow,
  GA4Snapshot,
  GA4PageRow,
  GA4SourceRow,
  GA4DeviceRow,
  GoogleTrustReport,
  GoogleTrustArticle,
  AdSenseReadinessReport,
  AdSenseReadinessArticle,
  DailySnapshot,
  RecoveryArticle,
} from '@/lib/nios/intelligence/types';

export type {
  JourneyEvent,
  JourneyEventType,
  SessionSummary,
  ObservabilityBatch,
  TelemetryEnvelope,
  TrafficSource,
  DeviceCategory,
  DataStatus,
} from '@/lib/observability/types';

// Editorial decision contract: MENI flat decision is internal; Supervisor is the public authority.
// Canonical decision type: `SupervisorDecision` (see lib/supervisor/types.ts).
