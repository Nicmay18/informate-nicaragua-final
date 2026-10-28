import { commercialRoutes, saveCommercial, commercialFailure } from '@/lib/negocios/admin';
import { NEGOCIOS_COLLECTION, negocioSchema } from '@/lib/negocios/modelo';
import { adminGuard, privateJson, readBody } from '@/lib/negocios/seguridad';
export const dynamic = 'force-dynamic';
export const GET = commercialRoutes(NEGOCIOS_COLLECTION, negocioSchema).GET;
export async function POST(request: Request) {
  const denied = adminGuard(request); if (denied) return denied;
  try {
    const data = negocioSchema.parse(await readBody(request));
    await saveCommercial(request, NEGOCIOS_COLLECTION, data.slug, { ...data, estado: 'pendiente' }, true);
    return privateJson({ ok: true, id: data.slug }, 201);
  } catch (err) { return commercialFailure(err); }
}
