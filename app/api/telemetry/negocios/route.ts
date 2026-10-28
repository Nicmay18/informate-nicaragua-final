import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { NEGOCIOS_COLLECTION, CAMPANAS_COLLECTION, NEGOCIOS_DAILY_COLLECTION,
  eventoMetricaSchema, negocioDailyId, isNegocioPublicable, campanaVigente, type Negocio } from '@/lib/negocios/modelo';
import { clientKey, fingerprint, rateLimited, sameOrigin, readBody, privateJson } from '@/lib/negocios/seguridad';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return privateJson({ error: 'Origen inválido' }, 403);
  if (/bot|crawler|spider|headless|preview|facebookexternalhit/i.test(request.headers.get('user-agent') || '')) {
    return privateJson({ ok: true, ignored: true });
  }
  try {
    const parsed = eventoMetricaSchema.safeParse(await readBody(request));
    if (!parsed.success) return privateJson({ error: 'Datos inválidos' }, 400);
    const { negocioId, tipo, sessionId } = parsed.data;
    if (rateLimited(`metrics:${clientKey(request)}`, 60)) return privateJson({ error: 'Límite de solicitudes' }, 429);
    const db = getAdminDb();
    const now = new Date();
    const dayId = negocioDailyId(negocioId, now);
    const metric = tipo === 'vista' ? 'vistas' : `clics_${tipo}`;
    const key = fingerprint(`${negocioId}:${tipo}:${sessionId}`);
    const networkKey = fingerprint(`${negocioId}:${tipo}:${clientKey(request)}:${request.headers.get('user-agent') || ''}`);
    // Ventana móvil, independiente del reloj del navegador. Rotar sessionId
    // no evita el segundo límite por red/navegador (puede subcontar NAT).
    const dedup = db.collection('negocios_metric_dedup').doc(key);
    const network = db.collection('negocios_metric_dedup').doc(networkKey);
    const result = await db.runTransaction(async (tx) => {
      const profile = await tx.get(db.collection(NEGOCIOS_COLLECTION).doc(negocioId));
      if (!profile.exists || !isNegocioPublicable(profile.data() as Negocio, now)) return 'not-found';
      if (tipo !== 'vista' && !profile.data()?.[tipo]) return 'not-found';
      const sessionRecord = await tx.get(dedup);
      const networkRecord = await tx.get(network);
      if ([sessionRecord, networkRecord].some((d) => Number(d.data()?.until || 0) > now.getTime())) return 'dedup';
      const campaigns = await tx.get(db.collection(CAMPANAS_COLLECTION).where('negocioId', '==', negocioId));
      const campaign = campaigns.docs.find((d) => campanaVigente(d.data(), now));
      const counts = { [metric]: FieldValue.increment(1) };
      tx.set(db.collection(NEGOCIOS_DAILY_COLLECTION).doc(dayId), {
        negocioId, date: dayId.slice(-10), ...counts,
        ...(campaign ? { campanas: { [campaign.id]: counts } } : {}),
      }, { merge: true });
      const expiry = { until: now.getTime() + 600_000, expiresAt: new Date(now.getTime() + 86_400_000) };
      tx.set(dedup, expiry);
      tx.set(network, expiry);
      return 'counted';
    });
    if (result === 'not-found') return privateJson({ error: 'No disponible' }, 404);
    return privateJson({ ok: true, dedup: result === 'dedup' });
  } catch (err) {
    return privateJson({ error: 'No se pudo registrar' }, err instanceof SyntaxError ? 400 : 503);
  }
}
