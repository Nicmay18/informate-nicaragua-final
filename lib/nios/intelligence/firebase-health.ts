import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export type FirebaseHealthStatus =
  | 'CONNECTED'
  | 'CREDENTIALS_MISSING'
  | 'AUTH_FAILED'
  | 'READ_FAILED'
  | 'WRITE_FAILED'
  | 'UNKNOWN_ERROR';

export type FirebaseOperationalStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export interface FirebaseHealth {
  source: 'Firebase';
  status: FirebaseHealthStatus;
  /** Estado operacional consolidado para el panel: HEALTHY, DEGRADED o DOWN. */
  health: FirebaseOperationalStatus;
  lastAttemptAt: string;
  lastSuccessAt: string | null;
  lastDataAt: string | null;
  dataAgeHours: number | null;
  readCount: number;
  writeCount: number;
  errorCount: number;
  latencyMs: number | null;
  collectionsChecked: string[];
  projectId: string;
  clientEmail: string;
  note: string;
  /** Mensaje de error explícito o cadena vacía si está saludable. */
  errorMessage: string;
  confidence: number;
  recommendedAction: string;
}

const PROBE_COLLECTIONS = ['noticias', 'traffic_log', 'nios_daily_snapshots', 'nios_alerts'];

function redactEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, 3)}***@${domain}`;
}

function toOperationalHealth(
  status: FirebaseHealthStatus,
  dataAgeHours: number | null,
  latencyMs: number | null,
): FirebaseOperationalStatus {
  if (status === 'CONNECTED') {
    if (latencyMs !== null && latencyMs > 5000) return 'DEGRADED';
    if (dataAgeHours !== null && dataAgeHours > 72) return 'DEGRADED';
    return 'HEALTHY';
  }
  if (status === 'WRITE_FAILED') return 'DEGRADED';
  return 'DOWN';
}

/**
 * Verifica conectividad real de Firebase/Firestore sin inventar datos.
 * No escribe datos sensibles. No expone private keys.
 */
export async function checkFirebaseHealth(): Promise<FirebaseHealth> {
  const now = new Date();
  const nowIso = now.toISOString();
  const projectId = process.env.FIREBASE_PROJECT_ID || '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';

  if (!projectId || !clientEmail) {
    const note = 'FIREBASE_PROJECT_ID o FIREBASE_CLIENT_EMAIL no configurados.';
    return {
      source: 'Firebase',
      status: 'CREDENTIALS_MISSING',
      health: 'DOWN',
      lastAttemptAt: nowIso,
      lastSuccessAt: null,
      lastDataAt: null,
      dataAgeHours: null,
      readCount: 0,
      writeCount: 0,
      errorCount: 1,
      latencyMs: null,
      collectionsChecked: [],
      projectId: projectId || 'NOT_SET',
      clientEmail: clientEmail ? redactEmail(clientEmail) : 'NOT_SET',
      note,
      errorMessage: note,
      confidence: 0,
      recommendedAction: 'Configurar FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY (o FIREBASE_SERVICE_ACCOUNT_BASE64) en .env.local.',
    };
  }

  let db: Firestore;
  let start: number;

  try {
    start = performance.now();
    db = getAdminDb();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[firebase-health] Auth failed:', message);
    const note = `No se pudo inicializar Firebase Admin: ${message}`;
    return {
      source: 'Firebase',
      status: 'AUTH_FAILED',
      health: 'DOWN',
      lastAttemptAt: nowIso,
      lastSuccessAt: null,
      lastDataAt: null,
      dataAgeHours: null,
      readCount: 0,
      writeCount: 0,
      errorCount: 1,
      latencyMs: null,
      collectionsChecked: [],
      projectId,
      clientEmail: redactEmail(clientEmail),
      note,
      errorMessage: note,
      confidence: 0,
      recommendedAction: 'Verificar FIREBASE_PRIVATE_KEY / FIREBASE_SERVICE_ACCOUNT_BASE64 y que las credenciales correspondan al projectId.',
    };
  }

  try {
    const collections = [...PROBE_COLLECTIONS];
    let readCount = 0;
    let lastDataAt: string | null = null;

    for (const name of collections) {
      const snap = await db.collection(name).orderBy('__name__', 'desc').limit(1).get();
      readCount += 1;
      if (!snap.empty) {
        const doc = snap.docs[0];
        const updated = doc.updateTime ? doc.updateTime.toDate().toISOString() : null;
        if (updated && (!lastDataAt || updated > lastDataAt)) {
          lastDataAt = updated;
        }
      }
    }

    const latencyMs = Math.round(performance.now() - start);
    const dataAgeHours = lastDataAt
      ? Math.max(0, Math.round((now.getTime() - new Date(lastDataAt).getTime()) / 36e5))
      : null;

    const note = `Firestore conectado. ${readCount} colecciones verificadas. Última actividad: ${lastDataAt || 'sin datos recientes'}. Latencia ${latencyMs}ms.`;
    return {
      source: 'Firebase',
      status: 'CONNECTED',
      health: toOperationalHealth('CONNECTED', dataAgeHours, latencyMs),
      lastAttemptAt: nowIso,
      lastSuccessAt: nowIso,
      lastDataAt,
      dataAgeHours,
      readCount,
      writeCount: 0,
      errorCount: 0,
      latencyMs,
      collectionsChecked: collections,
      projectId,
      clientEmail: redactEmail(clientEmail),
      note,
      errorMessage: '',
      confidence: dataAgeHours !== null && dataAgeHours <= 24 ? 95 : dataAgeHours !== null && dataAgeHours <= 72 ? 75 : 60,
      recommendedAction: 'No requiere acción.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[firebase-health] Read failed:', message);
    const note = `Conexión inicializó pero la lectura falló: ${message}`;
    return {
      source: 'Firebase',
      status: 'READ_FAILED',
      health: 'DOWN',
      lastAttemptAt: nowIso,
      lastSuccessAt: null,
      lastDataAt: null,
      dataAgeHours: null,
      readCount: 0,
      writeCount: 0,
      errorCount: 1,
      latencyMs: null,
      collectionsChecked: PROBE_COLLECTIONS,
      projectId,
      clientEmail: redactEmail(clientEmail),
      note,
      errorMessage: note,
      confidence: 0,
      recommendedAction: 'Revisar permisos Firestore, reglas de seguridad y estado del proyecto.',
    };
  }
}
