import { commercialRoutes } from '@/lib/negocios/admin';
import { NEGOCIOS_AUDIT_COLLECTION } from '@/lib/negocios/modelo';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
// No se exportan métodos de escritura para el historial.
export const GET = commercialRoutes(NEGOCIOS_AUDIT_COLLECTION, z.never()).GET;
