import { commercialRoutes } from '@/lib/negocios/admin';
import { PROSPECTOS_COLLECTION, prospectoSchema } from '@/lib/negocios/modelo';
export const dynamic = 'force-dynamic';
export const { GET, POST, PUT } = commercialRoutes(PROSPECTOS_COLLECTION, prospectoSchema);
