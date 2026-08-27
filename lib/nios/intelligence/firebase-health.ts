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

export interface FirebaseHealth {
  source: 'Firebase';
  status: FirebaseHealthStatus;
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
  confidence: number;
  recommendedAction: string;
}

const PROBE_COLLECTIONS = ['noticias', 'traffic_log', 'nios_daily_snapshots', 'nios_alerts'];

function redactEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, 3)}***@${domain}`;
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
    return {
      source: 'Firebase',
      status: 'CREDENTIALS_MISSING',
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
      note: 'FIREBASE_PROJECT_ID o FIREBASE_CLIENT_EMAIL no configurados.',
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
    return {
      source: 'Firebase',
      status: 'AUTH_FAILED',
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
      note: `No se pudo inicializar Firebase Admin: ${message}`,
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

    return {
      source: 'Firebase',
      status: 'CONNECTED',
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
      note: `Firestore conectado. ${readCount} colecciones verificadas. Última actividad: ${lastDataAt || 'sin datos recientes'}. Latencia ${latencyMs}ms.`,
      confidence: dataAgeHours !== null && dataAgeHours <= 24 ? 95 : dataAgeHours !== null && dataAgeHours <= 72 ? 75 : 60,
      recommendedAction: 'No requiere acción.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[firebase-health] Read failed:', message);
    return {
      source: 'Firebase',
      status: 'READ_FAILED',
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
      note: `Conexión inicializó pero la lectura falló: ${message}`,
      confidence: 0,
      recommendedAction: 'Revisar permisos Firestore, reglas de seguridad y estado del proyecto.',
    };
  }
}
