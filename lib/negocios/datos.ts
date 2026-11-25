import { unstable_cache } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  NEGOCIOS_COLLECTION,
  CAMPANAS_COLLECTION, campanaVigente,
  isNegocioPublicable,
  toPublicNegocio,
  type Negocio,
  type PublicNegocio,
} from './modelo';

// /negocios es force-dynamic (searchParams): sin esta capa, CADA request —
// incluidas variantes ?q= de bots — ejecutaba 2 queries Firestore. El
// directorio cambia solo por acciones admin; 5 min de frescura es de sobra
// y las aprobaciones/pagos pueden invalidar con tag 'negocios'.
const _cachedListarNegocios = unstable_cache(
  async () => {
    const snap = await getAdminDb()
      .collection(NEGOCIOS_COLLECTION)
      .where('estado', '==', 'aprobado')
      .limit(500).get();
    const now = new Date();
    const campaigns = await getAdminDb().collection(CAMPANAS_COLLECTION).where('estadoPago', 'in', ['pagado', 'piloto']).limit(500).get();
  const sponsored = new Set(campaigns.docs.filter((d) => campanaVigente(d.data(), now)).map((d) => d.data().negocioId));
  const pilots = new Set(campaigns.docs.filter((d) => d.data().estadoPago === 'piloto' && campanaVigente(d.data(), now)).map((d) => d.data().negocioId));
    return snap.docs
      .map((d) => ({ id: d.id, data: d.data() as Negocio }))
      .filter(({ data }) => isNegocioPublicable(data, now))
      .map(({ id, data }) => toPublicNegocio(id, { ...data, patrocinado: sponsored.has(id), piloto: pilots.has(id), destacado: sponsored.has(id) && data.destacado }))
      .sort((a, b) =>
        a.destacado === b.destacado ? a.nombre.localeCompare(b.nombre) : a.destacado ? -1 : 1,
      );
  },
  ['negocios-publicos'],
  { revalidate: 1800, tags: ['negocios'] }
);

/** Perfiles aprobados y vigentes para el directorio público. */
export async function listarNegociosPublicos(): Promise<PublicNegocio[]> {
  return _cachedListarNegocios();
}

const _cachedNegocioBySlug = unstable_cache(
  async (slug: string): Promise<PublicNegocio | null> => {
    const snap = await getAdminDb()
      .collection(NEGOCIOS_COLLECTION)
      .where('slug', '==', slug)
      .limit(3)
      .get();
    const now = new Date();
    const doc = snap.docs.find((d) => isNegocioPublicable(d.data() as Negocio, now));
    if (!doc) return null;
    const campaigns = await getAdminDb().collection(CAMPANAS_COLLECTION).where('negocioId', '==', doc.id).limit(20).get();
    const campaign = campaigns.docs.find((d) => campanaVigente(d.data(), now));
    const sponsored = !!campaign;
    const n = doc.data() as Negocio;
    return toPublicNegocio(doc.id, { ...n, patrocinado: sponsored, piloto: campaign?.data().estadoPago === 'piloto', destacado: sponsored && n.destacado });
  },
  ['negocio-slug'],
  { revalidate: 1800, tags: ['negocios'] }
);

export async function getNegocioPublicoBySlug(slug: string): Promise<PublicNegocio | null> {
  return _cachedNegocioBySlug(slug);
}
