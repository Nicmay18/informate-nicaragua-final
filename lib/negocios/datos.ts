import { getAdminDb } from '@/lib/firebase-admin';
import {
  NEGOCIOS_COLLECTION,
  CAMPANAS_COLLECTION, campanaVigente,
  isNegocioPublicable,
  toPublicNegocio,
  type Negocio,
  type PublicNegocio,
} from './modelo';

/** Perfiles aprobados y vigentes para el directorio público. */
export async function listarNegociosPublicos(): Promise<PublicNegocio[]> {
  const snap = await getAdminDb()
    .collection(NEGOCIOS_COLLECTION)
    .where('estado', '==', 'aprobado')
    .limit(500).get();
  const now = new Date();
  const campaigns = await getAdminDb().collection(CAMPANAS_COLLECTION).where('estadoPago', '==', 'pagado').get();
  const sponsored = new Set(campaigns.docs.filter((d) => campanaVigente(d.data(), now)).map((d) => d.data().negocioId));
  return snap.docs
    .map((d) => ({ id: d.id, data: d.data() as Negocio }))
    .filter(({ data }) => isNegocioPublicable(data, now))
    .map(({ id, data }) => toPublicNegocio(id, { ...data, patrocinado: sponsored.has(id), destacado: sponsored.has(id) && data.destacado }))
    .sort((a, b) =>
      a.destacado === b.destacado ? a.nombre.localeCompare(b.nombre) : a.destacado ? -1 : 1,
    );
}

export async function getNegocioPublicoBySlug(slug: string): Promise<PublicNegocio | null> {
  const snap = await getAdminDb()
    .collection(NEGOCIOS_COLLECTION)
    .where('slug', '==', slug)
    .limit(3)
    .get();
  const now = new Date();
  const doc = snap.docs.find((d) => isNegocioPublicable(d.data() as Negocio, now));
  if (!doc) return null;
  const campaigns = await getAdminDb().collection(CAMPANAS_COLLECTION).where('negocioId', '==', doc.id).get();
  const sponsored = campaigns.docs.some((d) => campanaVigente(d.data(), now));
  const n = doc.data() as Negocio;
  return toPublicNegocio(doc.id, { ...n, patrocinado: sponsored, destacado: sponsored && n.destacado });
}
