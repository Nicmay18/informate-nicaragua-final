import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { saveCommercial, commercialFailure } from '@/lib/negocios/admin';
import { NEGOCIOS_COLLECTION, negocioSchema, documentId } from '@/lib/negocios/modelo';
import { adminGuard, privateJson, readBody } from '@/lib/negocios/seguridad';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const id = documentId.parse((await params).id);
    const doc = await getAdminDb().collection(NEGOCIOS_COLLECTION).doc(id).get();
    return doc.exists ? privateJson({ ok: true, item: { ...doc.data(), id } }) : privateJson({ error: 'No encontrado' }, 404);
  } catch (err) { return commercialFailure(err); }
}
export async function PUT(request: Request, { params }: Context) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const id = documentId.parse((await params).id);
    const data = negocioSchema.parse(await readBody(request));
    await saveCommercial(request, NEGOCIOS_COLLECTION, id, { ...data, estado: 'pendiente' }, false);
    return privateJson({ ok: true, id });
  } catch (err) { return commercialFailure(err); }
}
export async function PATCH(request: Request, { params }: Context) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const id = documentId.parse((await params).id);
    const data = z.object({ estado: z.enum(['aprobado', 'rechazado', 'suspendido']) }).strict().parse(await readBody(request));
    await saveCommercial(request, NEGOCIOS_COLLECTION, id, data, false);
    return privateJson({ ok: true, id });
  } catch (err) { return commercialFailure(err); }
}
