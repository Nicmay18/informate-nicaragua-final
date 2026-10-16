import { unstable_cache } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  AUSPICIADORES_COLLECTION,
  seleccionarAuspiciador,
  toPublicAuspiciador,
  type Auspiciador,
  type AuspiciadorPublico,
  type AuspiciadorPosicion,
} from './auspiciadores';

/**
 * Auspiciador vigente para renderizado SSR.
 * Cache 60s en Data Cache: el banner puede tardar ≤1 min en activarse,
 * pero evita 1 lectura Firestore por cada vista de artículo.
 */
const _cachedActivos = unstable_cache(
  async (): Promise<(Auspiciador & { id: string })[]> => {
    const db = getAdminDb();
    const snap = await db.collection(AUSPICIADORES_COLLECTION).where('activo', '==', true).limit(20).get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Auspiciador) }));
  },
  ['auspiciadores-activos'],
  { revalidate: 60 },
);

export async function getAuspiciadorPublico(
  posicion: Exclude<AuspiciadorPosicion, 'ambos'> = 'articulo',
): Promise<AuspiciadorPublico | null> {
  try {
    const activos = await _cachedActivos();
    const elegido = seleccionarAuspiciador(activos, posicion);
    return elegido ? toPublicAuspiciador(elegido.id, elegido) : null;
  } catch (err) {
    logger.error('[ads] getAuspiciadorPublico failed:', err);
    return null;
  }
}
