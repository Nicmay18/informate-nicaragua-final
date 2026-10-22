import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { actor, adminGuard, privateJson, readBody } from './seguridad';
import {
  NEGOCIOS_COLLECTION, NEGOCIOS_AUDIT_COLLECTION, PLANES_COLLECTION,
  CAMPANAS_COLLECTION, documentId, negocioSchema, campanaSchema, diasParaVencer,
} from './modelo';

export class CommercialError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
/** Mutación y auditoría se confirman juntas, nunca éxito parcial. */
export async function saveCommercial(request: Request, collection: string, id: string,
  input: Record<string, unknown>, creating: boolean) {
  const db = getAdminDb();
  const ref = db.collection(collection).doc(id);
  const audit = db.collection(NEGOCIOS_AUDIT_COLLECTION).doc();
  const timestamp = new Date().toISOString();
  const who = actor(request);
  await db.runTransaction(async (tx) => {
    const prior = await tx.get(ref);
    if (creating && prior.exists) throw new CommercialError('El identificador ya existe', 409);
    if (!creating && !prior.exists) throw new CommercialError('No encontrado', 404);
    const before = prior.data() || {};
    const data = { ...input };
    if (collection === NEGOCIOS_COLLECTION) {
      if (!creating && data.slug !== undefined && data.slug !== before.slug) throw new CommercialError('El slug es permanente');
      negocioSchema.parse({ ...before, ...data });
    }
    if (collection === CAMPANAS_COLLECTION) {
      const c = campanaSchema.parse(data);
      const business = await tx.get(db.collection(NEGOCIOS_COLLECTION).doc(c.negocioId));
      const plan = await tx.get(db.collection(PLANES_COLLECTION).doc(c.planId));
      if (!business.exists || !plan.exists) throw new CommercialError('Negocio o plan no encontrado', 404);
      if (!plan.data()?.activo) throw new CommercialError('El plan está inactivo');
      if (!creating && (before.negocioId !== c.negocioId || before.planId !== c.planId)) throw new CommercialError('Creá una nueva campaña para cambiar negocio o plan');
      if (before.estadoPago === 'pagado' || before.estadoPago === 'cancelado') throw new CommercialError('Campaña cerrada: registrá la renovación por separado', 409);
      if (c.renovacionDe) {
        if (c.renovacionDe === id) throw new CommercialError('Renovación inválida');
        const previous = await tx.get(db.collection(CAMPANAS_COLLECTION).doc(c.renovacionDe));
        if (!previous.exists || previous.data()?.negocioId !== c.negocioId || !previous.data()?.pagoConfirmado) throw new CommercialError('La renovación requiere una campaña pagada del mismo negocio');
      }
      if (c.estadoPago === 'pagado') {
        const siblings = await tx.get(db.collection(CAMPANAS_COLLECTION).where('negocioId', '==', c.negocioId));
        if (siblings.docs.some((d) => d.id !== id && d.data().estadoPago === 'pagado'
          && d.data().fechaInicio <= c.fechaVencimiento && d.data().fechaVencimiento >= c.fechaInicio)) {
          throw new CommercialError('Existe otra campaña pagada para ese período', 409);
        }
      }
      data.planNombre = plan.data()?.nombre;
      data.verificadoAt = c.estadoPago === 'pagado' ? timestamp : null;
      data.verificadoPor = c.estadoPago === 'pagado' ? who : null;
    }
    const after = { ...before, ...data, updatedAt: timestamp, ...(creating ? { createdAt: timestamp } : {}) };
    tx.set(ref, after);
    const changed = Object.keys(data).filter((key) => JSON.stringify(before[key]) !== JSON.stringify(data[key]));
    const privateFields = new Set(['contacto', 'telefono', 'whatsapp', 'email', 'notas', 'notasInternas', 'datos', 'descripcion', 'fotos']);
    const diff = Object.fromEntries(changed.filter((k) => !privateFields.has(k)).map((k) => [k, { antes: before[k] ?? null, despues: data[k] ?? null }]));
    tx.set(audit, { entidad: collection, entidadId: id, accion: creating ? 'crear' : 'actualizar', actor: who, timestamp, campos: changed, diff });
  });
}
export function commercialFailure(err: unknown) {
  if (err instanceof CommercialError) return privateJson({ error: err.message }, err.status);
  if (err instanceof z.ZodError || err instanceof SyntaxError) return privateJson({ error: 'Datos inválidos' }, 400);
  return privateJson({ error: 'No se pudo guardar' }, 500);
}
/** CRUD común con verificación en cada método, sin acceso cliente a Firestore. */
export function commercialRoutes(collection: string, schema: z.ZodTypeAny) {
  async function GET(request: Request) {
    const denied = adminGuard(request); if (denied) return denied;
    try {
      const snap = await getAdminDb().collection(collection).limit(501).get();
      const items = snap.docs.slice(0, 500).map((d) => ({ ...d.data(), id: d.id }));
      return privateJson({ ok: true, items, truncated: snap.size > 500 });
    } catch { return privateJson({ error: 'No se pudo cargar' }, 503); }
  }
  async function write(request: Request, creating: boolean) {
    const denied = adminGuard(request); if (denied) return denied;
    try {
      const input = schema.parse(await readBody(request));
      const id = creating ? getAdminDb().collection(collection).doc().id : documentId.parse(new URL(request.url).searchParams.get('id'));
      await saveCommercial(request, collection, id, input, creating);
      return privateJson({ ok: true, id }, creating ? 201 : 200);
    } catch (err) { return commercialFailure(err); }
  }
  return { GET, POST: (r: Request) => write(r, true), PUT: (r: Request) => write(r, false) };
}
export function campaignSummary(items: Record<string, unknown>[], now = new Date()) {
  const paid = items.filter((c) => c.estadoPago === 'pagado' && c.pagoConfirmado === true && c.verificadoAt && c.referenciaPago);
  return {
    cobradoUsd: paid.reduce((s, c) => s + Number(c.precioAcordadoUsd || 0), 0),
    pendienteUsd: items.filter((c) => c.estadoPago === 'pendiente').reduce((s, c) => s + Number(c.precioAcordadoUsd || 0), 0),
    renovaciones: paid.filter((c) => c.renovacionDe).length,
    porVencer14d: paid.filter((c) => { const days = diasParaVencer(String(c.fechaVencimiento), now); return days >= 0 && days <= 14; }).length,
  };
}
export const solicitudReviewSchema = z.object({
  estado: z.enum(['pendiente', 'procesada', 'descartada']),
  notas: z.string().max(500).default(''),
});
