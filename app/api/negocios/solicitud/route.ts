import { getAdminDb } from '@/lib/firebase-admin';
import { NEGOCIOS_COLLECTION, SOLICITUDES_COLLECTION, solicitudSchema, isNegocioPublicable, type Negocio } from '@/lib/negocios/modelo';
import { clientKey, rateLimited, sameOrigin, readBody, privateJson } from '@/lib/negocios/seguridad';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return privateJson({ error: 'Origen inválido' }, 403);
  try {
    if (rateLimited(`sol:${clientKey(request)}`, 5, 600_000)) return privateJson({ error: 'Intentá más tarde' }, 429);
    const parsed = solicitudSchema.safeParse(await readBody(request));
    if (!parsed.success) return privateJson({ error: 'Revisá los datos y el consentimiento' }, 400);
    const { sitio: _honeypot, ...data } = parsed.data;
    const db = getAdminDb();
    if (data.tipo === 'correccion') {
      const n = await db.collection(NEGOCIOS_COLLECTION).doc(data.negocioId).get();
      if (!n.exists || !isNegocioPublicable(n.data() as Negocio)) return privateJson({ error: 'Perfil no disponible' }, 404);
    }
    await db.collection(SOLICITUDES_COLLECTION).add({
      tipo: data.tipo, negocioId: data.negocioId, datos: JSON.parse(JSON.stringify(data)),
      estado: 'pendiente', createdAt: new Date().toISOString(),
    });
    return privateJson({ ok: true, mensaje: 'Recibida para revisión. No se ha publicado ningún cambio.' }, 201);
  } catch (err) {
    return privateJson({ error: 'No se pudo enviar la solicitud' }, err instanceof SyntaxError ? 400 : 503);
  }
}
