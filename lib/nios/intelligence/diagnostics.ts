import type { GSCSnapshot, GA4Snapshot, NiosDataStatus } from './types';

export type NiosDiagnosticSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface NiosDiagnostic {
  id: string;
  severity: NiosDiagnosticSeverity;
  source: 'GSC' | 'GA4' | 'AdSense' | 'Facebook' | 'NIOS';
  status: NiosDataStatus;
  problem: string;
  cause: string;
  impact: string;
  recommendedAction: string;
  action: string;
  autoFixAvailable: boolean;
  requiresHuman: boolean;
  expectedResult: string;
  account?: string;
  property?: string;
  variable?: string;
}

function severityForStatus(status: NiosDataStatus): NiosDiagnosticSeverity {
  switch (status) {
    case 'ACCESS_BLOCKED':
    case 'CONFIG_REQUIRED':
      return 'critical';
    case 'INVALID_CONFIGURATION':
    case 'DATA_CONFLICT':
      return 'high';
    case 'NO_DATA':
    case 'NOT_VERIFIED':
      return 'medium';
    case 'CONNECTED_NO_DATA':
      return 'low';
    case 'NOT_CONFIGURED':
      return 'low';
    case 'REAL':
      return 'info';
    default:
      return 'medium';
  }
}

function gscDiagnostic(snapshot: GSCSnapshot | null): NiosDiagnostic {
  const status = snapshot?.status ?? 'NO_DATA';
  const siteUrl = snapshot?.siteUrl || process.env.NIOS_GSC_SITE_URL || process.env.NIOS_SITE_URL || '';
  const account = process.env.FIREBASE_CLIENT_EMAIL || '';

  if (status === 'REAL') {
    return {
      id: 'gsc-real',
      severity: 'info',
      source: 'GSC',
      status,
      problem: 'Google Search Console está disponible.',
      cause: 'La cuenta de servicio tiene permisos y la propiedad devuelve datos.',
      impact: 'Se pueden evaluar métricas orgánicas, Google Trust y recomendaciones CEO.',
      recommendedAction: 'Ninguna. Mantener permisos vigentes.',
      action: 'NO_ACTION',
      autoFixAvailable: false,
      requiresHuman: false,
      expectedResult: 'gscStatus continúa en REAL.',
      account,
      property: siteUrl,
    };
  }

  if (status === 'ACCESS_BLOCKED') {
    return {
      id: 'gsc-access-blocked',
      severity: 'critical',
      source: 'GSC',
      status,
      problem: 'Google Search Console no permite leer la propiedad.',
      cause: 'La cuenta de servicio no tiene permiso sobre la propiedad en GSC.',
      impact: 'Google Trust, recomendaciones orgánicas, análisis de contenido y reportes CEO carecen de evidencia real.',
      recommendedAction: `Agregar la cuenta de servicio ${account || 'FIREBASE_CLIENT_EMAIL'} como propietario o usuario con permiso de lectura de la propiedad ${siteUrl} en Google Search Console.`,
      action: 'REQUIRES_HUMAN_AUTHORIZATION',
      autoFixAvailable: false,
      requiresHuman: true,
      expectedResult: 'gscStatus = REAL y se obtienen impresiones/clics reales.',
      account,
      property: siteUrl,
    };
  }

  if (status === 'CONFIG_REQUIRED') {
    return {
      id: 'gsc-config-required',
      severity: 'critical',
      source: 'GSC',
      status,
      problem: 'No está configurada la URL de propiedad de GSC.',
      cause: 'NIOS_GSC_SITE_URL y NIOS_SITE_URL no están configuradas.',
      impact: 'No se puede consultar GSC.',
      recommendedAction: 'Definir NIOS_GSC_SITE_URL en .env.local con la propiedad verificada (https://... o sc-domain:...).',
      action: 'REQUIRES_HUMAN_CONFIG',
      autoFixAvailable: false,
      requiresHuman: true,
      expectedResult: 'collectGSC recibe una propiedad válida.',
      variable: 'NIOS_GSC_SITE_URL',
    };
  }

  return {
    id: `gsc-${status.toLowerCase().replace(/_/g, '-')}`,
    severity: severityForStatus(status),
    source: 'GSC',
    status,
    problem: 'Google Search Console no devuelve datos útiles.',
    cause: snapshot?.errorMessage || `Estado ${status}`,
    impact: 'Las decisiones orgánicas se basan en ausencia de datos.',
    recommendedAction: 'Revisar configuración y permisos de GSC.',
    action: 'INVESTIGATE',
    autoFixAvailable: false,
    requiresHuman: true,
    expectedResult: 'gscStatus cambia a REAL o ACCESS_BLOCKED con causa clara.',
    account,
    property: siteUrl,
  };
}

function ga4Diagnostic(snapshot: GA4Snapshot | null): NiosDiagnostic {
  const status = snapshot?.status ?? 'NO_DATA';
  const propertyId = snapshot?.propertyId || process.env.NIOS_GA4_PROPERTY_ID || '';
  const account = process.env.FIREBASE_CLIENT_EMAIL || '';

  if (status === 'REAL') {
    return {
      id: 'ga4-real',
      severity: 'info',
      source: 'GA4',
      status,
      problem: 'Google Analytics 4 está disponible.',
      cause: 'La propiedad y credenciales son correctas.',
      impact: 'Se pueden evaluar usuarios activos, engagement y fuentes de tráfico.',
      recommendedAction: 'Ninguna.',
      action: 'NO_ACTION',
      autoFixAvailable: false,
      requiresHuman: false,
      expectedResult: 'ga4Status continúa en REAL.',
      account,
      property: propertyId,
    };
  }

  if (status === 'CONFIG_REQUIRED') {
    return {
      id: 'ga4-config-required',
      severity: 'critical',
      source: 'GA4',
      status,
      problem: 'No está configurado el GA4 Property ID.',
      cause: 'NIOS_GA4_PROPERTY_ID no está en .env.local.',
      impact: 'No se pueden consultar usuarios activos ni engagement.',
      recommendedAction: 'Definir NIOS_GA4_PROPERTY_ID con el ID numérico de la propiedad GA4.',
      action: 'REQUIRES_HUMAN_CONFIG',
      autoFixAvailable: false,
      requiresHuman: true,
      expectedResult: 'ga4Status = REAL tras configurar el ID y permisos.',
      variable: 'NIOS_GA4_PROPERTY_ID',
    };
  }

  if (status === 'INVALID_CONFIGURATION') {
    return {
      id: 'ga4-invalid-configuration',
      severity: 'high',
      source: 'GA4',
      status,
      problem: 'GA4 rechazó la consulta con argumento inválido.',
      cause: snapshot?.errorMessage || 'El property ID puede no existir, no pertenecer al proyecto, o la métrica no estar disponible.',
      impact: 'No se obtienen datos de usuarios ni engagement.',
      recommendedAction: 'Verificar que NIOS_GA4_PROPERTY_ID sea el ID correcto, que el proyecto de Firebase tenga acceso y que la cuenta de servicio tenga permisos en GA4.',
      action: 'REQUIRES_HUMAN_CONFIG',
      autoFixAvailable: false,
      requiresHuman: true,
      expectedResult: 'ga4Status cambia a REAL.',
      account,
      property: propertyId,
      variable: 'NIOS_GA4_PROPERTY_ID',
    };
  }

  if (status === 'ACCESS_BLOCKED') {
    return {
      id: 'ga4-access-blocked',
      severity: 'critical',
      source: 'GA4',
      status,
      problem: 'La cuenta de servicio no tiene acceso a la propiedad GA4.',
      cause: 'Permisos insuficientes en GA4 o propiedad incorrecta.',
      impact: 'No se pueden evaluar usuarios ni engagement.',
      recommendedAction: `Agregar ${account || 'FIREBASE_CLIENT_EMAIL'} como lector/analista de la propiedad GA4 ${propertyId}.`,
      action: 'REQUIRES_HUMAN_AUTHORIZATION',
      autoFixAvailable: false,
      requiresHuman: true,
      expectedResult: 'ga4Status = REAL.',
      account,
      property: propertyId,
    };
  }

  return {
    id: `ga4-${status.toLowerCase().replace(/_/g, '-')}`,
    severity: severityForStatus(status),
    source: 'GA4',
    status,
    problem: 'Google Analytics 4 no devuelve datos.',
    cause: snapshot?.errorMessage || `Estado ${status}`,
    impact: 'Dashboard y CEO Agent no disponen de métricas de tráfico.',
    recommendedAction: 'Revisar NIOS_GA4_PROPERTY_ID, FIREBASE_PROJECT_ID y permisos del service account.',
    action: 'INVESTIGATE',
    autoFixAvailable: false,
    requiresHuman: true,
    expectedResult: 'ga4Status cambia a REAL.',
    account,
    property: propertyId,
  };
}

function adSenseDiagnostic(): NiosDiagnostic {
  const hasClientId = Boolean(process.env.GOOGLE_ADSENSE_CLIENT_ID);

  if (hasClientId) {
    return {
      id: 'adsense-config-present',
      severity: 'medium',
      source: 'AdSense',
      status: 'NOT_CONFIGURED',
      problem: 'Existe GOOGLE_ADSENSE_CLIENT_ID pero no hay collector real.',
      cause: 'No se implementó un módulo de recolección de datos de AdSense API.',
      impact: 'Los reportes de AdSense se generan solo con datos internos (GA4/GSC).',
      recommendedAction: 'Implementar lib/nios/intelligence/adsense-collector.ts o eliminar GOOGLE_ADSENSE_CLIENT_ID si no es necesario.',
      action: 'REQUIRES_HUMAN_DECISION',
      autoFixAvailable: false,
      requiresHuman: true,
      expectedResult: 'Decisión sobre si AdSense API entra en el alcance actual.',
      variable: 'GOOGLE_ADSENSE_CLIENT_ID',
    };
  }

  return {
    id: 'adsense-not-configured',
    severity: 'low',
    source: 'AdSense',
    status: 'NOT_CONFIGURED',
    problem: 'AdSense no está conectado a NIOS.',
    cause: 'GOOGLE_ADSENSE_CLIENT_ID no está configurada y no existe collector.',
    impact: 'No hay ingresos reales de AdSense en los reportes. No bloquea el resto de NIOS.',
    recommendedAction: 'Configurar GOOGLE_ADSENSE_CLIENT_ID e implementar collector solo si AdSense API es requerido.',
    action: 'NO_ACTION_OR_HUMAN_DECISION',
    autoFixAvailable: false,
    requiresHuman: true,
    expectedResult: 'Decisión sobre si AdSense API es necesario.',
    variable: 'GOOGLE_ADSENSE_CLIENT_ID',
  };
}

export function generateNiosDiagnostics(
  gsc: GSCSnapshot | null,
  ga4: GA4Snapshot | null,
): NiosDiagnostic[] {
  return [gscDiagnostic(gsc), ga4Diagnostic(ga4), adSenseDiagnostic()];
}
