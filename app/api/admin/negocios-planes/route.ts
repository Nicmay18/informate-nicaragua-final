import { commercialRoutes } from '@/lib/negocios/admin';
import { PLANES_COLLECTION, planSchema } from '@/lib/negocios/modelo';
export const dynamic = 'force-dynamic';
// Leer no crea planes ni modifica tarifas. El administrador los configura.
export const { GET, POST, PUT } = commercialRoutes(PLANES_COLLECTION, planSchema);
