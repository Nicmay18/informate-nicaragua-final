import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

const COLLECTION = 'depto_incidents';

export interface DepartamentoIncident {
  id?: string;
  type: 'site-availability' | 'seo' | 'editorial' | 'growth' | 'security' | 'infrastructure';
  severity: 'critical' | 'warning' | 'ok';
  title: string;
  url?: string;
  status: 'active' | 'resolved' | 'monitoring';
  detectedAt: string;
  resolvedAt?: string;
  diagnosis?: string;
  correction?: string;
  verification?: string;
  learning?: string;
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function getActiveIncident(title: string): Promise<DepartamentoIncident | null> {
  const db = getAdminDb();
  const slug = slugify(title);
  const snap = await db.collection(COLLECTION).where('slug', '==', slug).get();
  for (const doc of snap.docs) {
    const d = doc.data() as DepartamentoIncident;
    if (d.status === 'active' || d.status === 'monitoring') {
      return { id: doc.id, ...d };
    }
  }
  return null;
}

export async function openIncident(incident: Omit<DepartamentoIncident, 'id'>): Promise<string> {
  const db = getAdminDb();
  const existing = await getActiveIncident(incident.title);
  if (existing) return existing.id as string;

  const slug = slugify(incident.title);
  const ref = db.collection(COLLECTION).doc();
  const data = {
    ...incident,
    slug,
    createdAt: new Date().toISOString(),
  };

  await ref.set(data);
  logger.warn('[departamento-incidents] Incidente abierto', { title: incident.title, id: ref.id });
  return ref.id;
}

export async function resolveIncident(
  title: string,
  details: { diagnosis: string; correction: string; verification: string; learning: string }
): Promise<void> {
  const db = getAdminDb();
  const existing = await getActiveIncident(title);
  if (!existing) return;

  const now = new Date().toISOString();
  await db.collection(COLLECTION).doc(existing.id as string).update({
    status: 'resolved',
    resolvedAt: now,
    ...details,
    updatedAt: now,
  });

  logger.info('[departamento-incidents] Incidente resuelto', { title, id: existing.id });
}

export async function getIncidentsSummary(): Promise<{ active: number; resolved24h: number; items: DepartamentoIncident[] }> {
  const db = getAdminDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [activeSnap, monitoringSnap, resolvedSnap] = await Promise.all([
    db.collection(COLLECTION).where('status', '==', 'active').count().get(),
    db.collection(COLLECTION).where('status', '==', 'monitoring').count().get(),
    db.collection(COLLECTION).where('resolvedAt', '>=', since).get(),
  ]);

  const activeItemsSnap = await db.collection(COLLECTION).orderBy('detectedAt', 'desc').limit(50).get();
  const items = activeItemsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as DepartamentoIncident)
    .filter((d) => d.status === 'active' || d.status === 'monitoring')
    .slice(0, 10);

  const resolved24h = resolvedSnap.docs.filter((d) => (d.data() as { status?: string }).status === 'resolved').length;

  return {
    active: (activeSnap.data().count || 0) + (monitoringSnap.data().count || 0),
    resolved24h,
    items,
  };
}
