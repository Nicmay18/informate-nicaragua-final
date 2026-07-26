/**
 * MENI OS v3.0 — Registry Types
 * Modelo formal de activos del proyecto Nicaragua Informate.
 */

export type MeniAssetType =
  | 'component'
  | 'layout'
  | 'page'
  | 'api'
  | 'hook'
  | 'action'
  | 'script'
  | 'lib'
  | 'schema'
  | 'firestore'
  | 'cron'
  | 'seo'
  | 'jsonld'
  | 'adsense'
  | 'analytics'
  | 'audio'
  | 'ia';

export type MeniAssetStatus = 'active' | 'deprecated' | 'orphan' | 'experimental' | 'broken';
export type MeniRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface MeniAsset {
  id: string;
  name: string;
  path: string;
  type: MeniAssetType;
  domain: string;
  owner?: string;
  description?: string;
  dependsOn: string[];
  usedBy: string[];
  exports: string[];
  imports: string[];
  firestoreCollections: string[];
  apiRoutes: string[];
  serverActions: string[];
  hooks: string[];
  tags: string[];
  risk: MeniRiskLevel;
  status: MeniAssetStatus;
  createdAt: string;
  updatedAt: string;
  lastAudit: string;
  hash: string;
}

export interface MeniRegistry {
  version: string;
  generatedAt: string;
  root: string;
  assets: MeniAsset[];
  domains: Record<string, string[]>;
  summary: {
    total: number;
    byType: Partial<Record<MeniAssetType, number>>;
    byDomain: Record<string, number>;
    byStatus: Partial<Record<MeniAssetStatus, number>>;
    byRisk: Partial<Record<MeniRiskLevel, number>>;
    orphans: number;
    duplicates: number;
    highRisk: number;
  };
  audit: {
    generatedAt: string;
    warnings: MeniRegistryWarning[];
  };
}

export interface MeniRegistryWarning {
  code: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  assetIds: string[];
}

export interface MeniSyncResult {
  registry: MeniRegistry;
  changed: number;
  added: string[];
  removed: string[];
  modified: string[];
  snapshotPath: string;
}
