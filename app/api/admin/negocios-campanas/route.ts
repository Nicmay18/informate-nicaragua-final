import { commercialRoutes, campaignSummary } from '@/lib/negocios/admin';
import { CAMPANAS_COLLECTION, campanaSchema } from '@/lib/negocios/modelo';
import { privateJson } from '@/lib/negocios/seguridad';
export const dynamic = 'force-dynamic';
const routes = commercialRoutes(CAMPANAS_COLLECTION, campanaSchema);
export const POST = routes.POST;
export const PUT = routes.PUT;
export async function GET(request: Request) {
  const response = await routes.GET(request);
  if (!response.ok) return response;
  const result = await response.json();
  return privateJson({ ...result, resumen: campaignSummary(result.items) });
}
