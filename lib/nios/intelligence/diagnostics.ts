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
  /** Timestamp ISO de la última recolección o diagnóstico. */
  lastAttemptAt: string;
  /** Timestamp ISO del último éxito; undefined si nunca hubo. */
  lastSuccessAt?: string;
  /** Timestamp ISO del día más reciente cubierto por los datos; undefined sin datos. */
  lastDataAt?: string;
  /** Horas transcurridas desde el último éxito o intento. */
  dataAgeHours: number | null;
  /** 0-100. Refleja confianza en la fuente según estado y frescura. */
  confidence: number;
  /** Mensaje de error de la fuente, si existe. */
  errorMessage?: string;
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

function diagnosticMeta(
  snapshot: { status?: NiosDataStatus; collectedAt?: string; dateRange?: { start?: string; end?: string }; errorMessage?: string } | null,
  now = new Date(),
) {
  const nowIso = now.toISOString();
  const lastAttemptAt = snapshot?.collectedAt || nowIso;
  const lastSuccessAt = snapshot?.status === 'REAL' ? (snapshot?.collectedAt || nowIso) : undefined;
  const lastDataAt = snapshot?.status === 'REAL' ? (snapshot?.dateRange?.end || snapshot?.collectedAt || nowIso) : undefined;
  const dataAgeHours = (() => {
    const ref = lastSuccessAt || lastAttemptAt;
    try {
      const d = new Date(ref).getTime();
      if (Number.isNaN(d)) return null;
      return Math.max(0, Math.round((now.getTime() - d) / 36e5));
    } catch {
      return null;
    }
  })();

  let confidence = 0;
  if (snapshot?.status === 'REAL') {
    confidence = dataAgeHours === null ? 50 : dataAgeHours <= 24 ? 95 : dataAgeHours <= 72 ? 75 : 50;
  } else if (snapshot?.status === 'CONNECTED_NO_DATA') {
    confidence = 30;
  } else if (snapshot?.status === 'NO_DATA') {
    confidence = 0;
  }

  return {
    lastAttemptAt,
    lastSuccessAt,
    lastDataAt,
    dataAgeHours,
    confidence,
    errorMessage: snapshot?.errorMessage,
  };
}

function gscDiagnostic(snapshot: GSCSnapshot | null): NiosDiagnostic {
  const status = snapshot?.status ?? 'NO_DATA';
  const siteUrl = snapshot?.siteUrl || process.env.NIOS_GSC_SITE_URL || process.env.NIOS_SITE_URL || '';
  const account = process.env.FIREBASE_CLIENT_EMAIL || '';
  const meta = diagnosticMeta(snapshot);

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
      ...meta,
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
      ...meta,
    };
  }

  if (status === 'TIMEOUT') {
    return {
      id: 'gsc-timeout',
      severity: 'high',
      source: 'GSC',
      status,
      problem: 'Google Search Console no respondió a tiempo.',
      cause: 'La consulta superó el límite de 15s (timeout interno) o la API de Google respondió con demora excesiva.',
      impact: 'Los datos orgánicos no están disponibles en este intento; el pipeline puede estar bajo presisión o la conexión es inestable.',
      recommendedAction: 'Reintentar más tarde. Si persiste, aumentar timeout, revisar latencia de red o reducir dimensionalidad de consulta.',
      action: 'RETRY_LATER',
      autoFixAvailable: false,
      requiresHuman: false,
      expectedResult: 'GSC responde dentro del timeout o se detecta un error más específico (permiso/credencial).',
      account,
      property: siteUrl,
      ...meta,
    };
  }

  if (status === 'NETWORK_ERROR') {
    return {
      id: 'gsc-network-error',
      severity: 'high',
      source: 'GSC',
      status,
      problem: 'No se pudo conectar con Google Search Console.',
      cause: 'Error de red: DNS falló, conexión interrumpida o servicio inalcanzable desde el entorno de ejecución.',
      impact: 'NIOS no puede descartar problema de permisos porque no llegó a contactar la API.',
      recommendedAction: 'Verificar conectividad de red del servidor y disponibilidad de Google APIs. Reintentar.',
      action: 'RETRY_LATER',
      autoFixAvailable: false,
      requiresHuman: false,
      expectedResult: 'Próximo intento alcanza la API de GSC y devuelve respuesta HTTP.',
      account,
      property: siteUrl,
      ...meta,
    };
  }

  if (status === 'INVALID_CONFIGURATION') {
    return {
      id: 'gsc-invalid-configuration',
      severity: 'high',
      source: 'GSC',
      status,
      problem: 'Configuración inválida para acceder a Google Search Console.',
      cause: snapshot?.errorMessage || 'Credencial mal formada, JWT inválido o permisos insuficientes del service account.',
      impact: 'No se obtienen datos orgánicos.',
      recommendedAction: 'Verificar FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL y que el service account tenga scope webmasters.readonly.',
      action: 'REQUIRES_HUMAN_CONFIG',
      autoFixAvailable: false,
      requiresHuman: true,
      expectedResult: 'gscStatus cambia a REAL o ACCESS_BLOCKED con causa clara.',
      account,
      property: siteUrl,
      ...meta,
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
      ...meta,
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
    ...meta,
  };
}

function ga4Diagnostic(snapshot: GA4Snapshot | null): NiosDiagnostic {
  const status = snapshot?.status ?? 'NO_DATA';
  const propertyId = snapshot?.propertyId || process.env.NIOS_GA4_PROPERTY_ID || '';
  const account = process.env.FIREBASE_CLIENT_EMAIL || '';
  const meta = diagnosticMeta(snapshot);

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
      ...meta,
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
      ...meta,
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
      ...meta,
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
      ...meta,
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
    ...meta,
  };
}

function niosDiagnostic(): NiosDiagnostic {
  return {
    id: 'nios-cache-refresh',
    severity: 'low',
    source: 'NIOS',
    status: 'NOT_CONFIGURED' as NiosDataStatus,
    problem: 'La caché de los dashboards administrativos puede estar stale tras la recolección diaria.',
    cause: 'Next.js unstable_cache retiene snapshots en memoria/disco; los datos de hoy pueden no verse hasta el TTL.',
    impact: 'El panel administrativo puede mostrar métricas de ayer después de que NIOS recolectó nuevos datos.',
    recommendedAction: 'Invalidar etiquetas de caché del dashboard-calidad y métricas.',
    action: 'INVALIDATE_CACHE',
    autoFixAvailable: true,
    requiresHuman: false,
    expectedResult: 'Caché de dashboards admin invalidada; la siguiente petición recalculará desde Firestore.',
    lastAttemptAt: new Date().toISOString(),
    dataAgeHours: 0,
    confidence: 90,
  };
}

function adSenseDiagnostic(): NiosDiagnostic {
  const hasClientId = Boolean(process.env.GOOGLE_ADSENSE_CLIENT_ID);
  const meta = diagnosticMeta(null);

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
      ...meta,
    };
  }

  return {
    id: 'adsense-not-configured',
    severity: 'info',
    source: 'AdSense',
    status: 'NOT_CONFIGURED',
    problem: 'AdSense no está conectado a NIOS.',
    cause: 'GOOGLE_ADSENSE_CLIENT_ID no está configurada y no existe collector.',
    impact: 'No hay ingresos reales de AdSense en los reportes. No bloquea el resto de NIOS.',
    recommendedAction: 'Configurar GOOGLE_ADSENSE_CLIENT_ID e implementar collector solo si AdSense API es requerido.',
    action: 'NO_ACTION',
    autoFixAvailable: false,
    requiresHuman: false,
    expectedResult: 'AdSense permanece como fuente opcional hasta que se configure.',
    variable: 'GOOGLE_ADSENSE_CLIENT_ID',
    ...meta,
  };
}

export function generateNiosDiagnostics(
  gsc: GSCSnapshot | null,
  ga4: GA4Snapshot | null,
): NiosDiagnostic[] {
  return [gscDiagnostic(gsc), ga4Diagnostic(ga4), adSenseDiagnostic(), niosDiagnostic()];
}
