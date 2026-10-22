import { commercialRoutes, solicitudReviewSchema } from '@/lib/negocios/admin';
import { SOLICITUDES_COLLECTION } from '@/lib/negocios/modelo';
export const dynamic = 'force-dynamic';
const routes = commercialRoutes(SOLICITUDES_COLLECTION, solicitudReviewSchema);
export const GET = routes.GET;
export const PUT = routes.PUT;
