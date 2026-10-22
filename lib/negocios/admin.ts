import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { actor, adminGuard, privateJson, readBody } from './seguridad';
import {
  NEGOCIOS_COLLECTION, NEGOCIOS_AUDIT_COLLECTION, PLANES_COLLECTION,
  CAMPANAS_COLLECTION, documentId, negocioSchema, campanaSchema, diasParaVencer,
  campanaVigente, PILOTOS_MAX_ACTIVOS,
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
      // Serializa altas concurrentes: las consultas vacías no bastan para
      // proteger el cupo de pilotos o los períodos de campañas nuevas.
      const control = db.collection('negocios_control').doc('campanas');
      await tx.get(control);
      const c = campanaSchema.parse(data);
      const business = await tx.get(db.collection(NEGOCIOS_COLLECTION).doc(c.negocioId));
      const plan = await tx.get(db.collection(PLANES_COLLECTION).doc(c.planId));
      if (!business.exists || !plan.exists) throw new CommercialError('Negocio o plan no encontrado', 404);
      if (!plan.data()?.activo) throw new CommercialError('El plan está inactivo');
      if (!creating && (before.negocioId !== c.negocioId || before.planId !== c.planId)) throw new CommercialError('Creá una nueva campaña para cambiar negocio o plan');
      // pagado/cancelado/piloto son estados finales: continuidad solo vía campaña nueva.
      if (['pagado', 'cancelado', 'piloto'].includes(String(before.estadoPago))) throw new CommercialError('Campaña cerrada: registrá la renovación por separado', 409);
      if (c.estadoPago === 'piloto') {
        const pilots = await tx.get(db.collection(CAMPANAS_COLLECTION).where('estadoPago', '==', 'piloto'));
        const today = timestamp.slice(0, 10);
        const active = pilots.docs.filter((d) => d.id !== id && String(d.data().fechaVencimiento) >= today);
        if (active.length >= PILOTOS_MAX_ACTIVOS) throw new CommercialError(`Máximo ${PILOTOS_MAX_ACTIVOS} pilotos activos a la vez`, 409);
      }
      if (c.renovacionDe) {
        if (c.renovacionDe === id) throw new CommercialError('Renovación inválida');
        const previous = await tx.get(db.collection(CAMPANAS_COLLECTION).doc(c.renovacionDe));
        const prev = previous.data();
        if (!prev || prev.negocioId !== c.negocioId
          || !(prev.estadoPago === 'piloto' || (prev.estadoPago === 'pagado' && prev.pagoConfirmado && prev.verificadoAt && prev.referenciaPago))) {
          throw new CommercialError('La continuidad requiere un piloto o campaña pagada del mismo negocio');
        }
      }
      if (c.estadoPago === 'pagado' || c.estadoPago === 'piloto') {
        const siblings = await tx.get(db.collection(CAMPANAS_COLLECTION).where('negocioId', '==', c.negocioId));
        if (siblings.docs.some((d) => d.id !== id && ['pagado', 'piloto'].includes(String(d.data().estadoPago))
          && d.data().fechaInicio <= c.fechaVencimiento && d.data().fechaVencimiento >= c.fechaInicio)) {
          throw new CommercialError('Existe otra campaña activa para ese período', 409);
        }
      }
      data.planNombre = plan.data()?.nombre;
      data.verificadoAt = c.estadoPago === 'pagado' ? timestamp : null;
      data.verificadoPor = c.estadoPago === 'pagado' ? who : null;
      // Un piloto caduca también como perfil. Una conversión posterior
      // requiere revisión editorial de la nueva vigencia del perfil.
      if (c.estadoPago === 'piloto') {
        const profile = business.data()!;
        if (c.fechaInicio > timestamp.slice(0, 10) || c.fechaVencimiento < timestamp.slice(0, 10)) {
          throw new CommercialError('El piloto debe comenzar hoy o estar vigente');
        }
        const end = profile.vigenteHasta && profile.vigenteHasta < c.fechaVencimiento ? profile.vigenteHasta : c.fechaVencimiento;
        tx.set(business.ref, { vigenteHasta: end, updatedAt: timestamp }, { merge: true });
        tx.set(db.collection(NEGOCIOS_AUDIT_COLLECTION).doc(), {
          entidad: NEGOCIOS_COLLECTION, entidadId: c.negocioId, accion: 'vigencia-piloto',
          actor: who, timestamp, campos: ['vigenteHasta'],
          diff: { vigenteHasta: { antes: profile.vigenteHasta || null, despues: end } },
        });
      }
      tx.set(control, { revision: FieldValue.increment(1) }, { merge: true });
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
    // Pilotos nunca entran a cobradoUsd ni pendienteUsd: no son ingreso.
    cobradoUsd: paid.reduce((s, c) => s + Number(c.precioAcordadoUsd || 0), 0),
    pendienteUsd: items.filter((c) => c.estadoPago === 'pendiente').reduce((s, c) => s + Number(c.precioAcordadoUsd || 0), 0),
    pilotosActivos: items.filter((c) => c.estadoPago === 'piloto' && campanaVigente(c, now)).length,
    renovaciones: paid.filter((c) => c.renovacionDe).length,
    porVencer14d: items.filter((c) => campanaVigente(c, now) && diasParaVencer(String(c.fechaVencimiento), now) <= 14).length,
  };
}
export const solicitudReviewSchema = z.object({
  estado: z.enum(['pendiente', 'procesada', 'descartada']),
  notas: z.string().max(500).default(''),
});
