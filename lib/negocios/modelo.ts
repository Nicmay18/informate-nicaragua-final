import { z } from 'zod';

/**
 * Negocios — directorio comercial patrocinado (MVP).
 * Toda escritura pasa por Admin SDK en route handlers; el cliente nunca
 * toca Firestore, por lo que las colecciones quedan cubiertas por el
 * default-deny de las reglas actuales (sin deploy de Rules).
 *
 * Colecciones:
 * - negocios: perfiles (estado editorial separado del plan comercial)
 * - negocios_planes: tarifas configurables desde el panel (no en código)
 * - negocios_campanas: contratación por negocio+plan con estado de pago
 * - negocios_prospectos: CRM comercial del propietario
 * - negocios_solicitudes: formularios públicos (alta/corrección) en cola
 * - negocios_daily: métricas agregadas por negocio y día (sin PII)
 * - negocios_audit: historial auditable de cambios comerciales
 */

export const NEGOCIOS_COLLECTION = 'negocios';
export const PLANES_COLLECTION = 'negocios_planes';
export const CAMPANAS_COLLECTION = 'negocios_campanas';
export const PROSPECTOS_COLLECTION = 'negocios_prospectos';
export const SOLICITUDES_COLLECTION = 'negocios_solicitudes';
export const NEGOCIOS_DAILY_COLLECTION = 'negocios_daily';
export const NEGOCIOS_AUDIT_COLLECTION = 'negocios_audit';

export const DEPARTAMENTOS_NI = [
  'Boaco', 'Carazo', 'Chinandega', 'Chontales', 'Estelí', 'Granada',
  'Jinotega', 'León', 'Madriz', 'Managua', 'Masaya', 'Matagalpa',
  'Nueva Segovia', 'Rivas', 'Río San Juan', 'RAAN', 'RAAS',
] as const;

export const CATEGORIAS_NEGOCIO = [
  'Restaurantes y comida', 'Salud', 'Belleza y barbería', 'Ferretería y construcción',
  'Tecnología y celulares', 'Educación', 'Servicios profesionales', 'Turismo y hospedaje',
  'Comercio y tiendas', 'Automotriz', 'Veterinaria y mascotas', 'Eventos y entretenimiento',
  'Hogar y limpieza', 'Finanzas y seguros', 'Otros',
] as const;

export type NegocioEstado = 'borrador' | 'pendiente' | 'aprobado' | 'rechazado' | 'suspendido';
export type PagoEstado = 'pendiente' | 'piloto' | 'pagado' | 'vencido' | 'cancelado';

/** Piloto gratuito: período corto para que un negocio evalúe el producto.
 * No es ingreso: nunca cuenta como cobrado ni pendiente de cobro. */
export const PILOTO_MAX_DIAS = 45;
export const PILOTOS_MAX_ACTIVOS = 3;
export type ProspectoEstado = 'nuevo' | 'contactado' | 'interesado' | 'negociacion' | 'ganado' | 'perdido';
export type SolicitudTipo = 'alta' | 'correccion';
export type SolicitudEstado = 'pendiente' | 'procesada' | 'descartada';
export type MetricaTipo = 'vista' | 'whatsapp' | 'telefono' | 'web';

const SAFE_URL = z
  .string()
  .trim()
  .url()
  .max(1200)
  .refine((u) => {
    try {
      const url = new URL(u);
      return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
    } catch { return false; }
  }, 'Solo URLs http(s) sin credenciales');

const PHONE = z
  .string()
  .trim()
  .regex(/^[+0-9 ()-]{7,20}$/, 'Teléfono inválido')
  .max(20);

/** WhatsApp: solo dígitos internacionales (ej. 50588881234) → wa.me seguro. */
export const WHATSAPP = z
  .string()
  .trim()
  .regex(/^[1-9]\d{7,14}$/, 'WhatsApp: solo dígitos con código de país');

const SLUG = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido')
  .max(120);

export const documentId = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/, 'ID inválido');
export const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')
  .refine((v) => {
    const date = new Date(`${v}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === v;
  }, 'Fecha inválida');

export const negocioSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  slug: SLUG,
  descripcion: z.string().trim().min(10).max(2000),
  categoria: z.enum(CATEGORIAS_NEGOCIO),
  departamento: z.enum(DEPARTAMENTOS_NI),
  municipio: z.string().trim().max(80).optional().default(''),
  direccion: z.string().trim().max(300).optional().default(''),
  telefono: PHONE.or(z.literal('')).default(''),
  whatsapp: WHATSAPP.or(z.literal('')).default(''),
  email: z.string().trim().email().max(200).or(z.literal('')).default(''),
  web: SAFE_URL.or(z.literal('')).default(''),
  fotos: z.array(SAFE_URL).max(6).optional().default([]),
  horario: z.string().trim().max(300).optional().default(''),
  plan: z.string().trim().max(40).default('basico'),
  estado: z.enum(['borrador', 'pendiente', 'aprobado', 'rechazado', 'suspendido']).default('pendiente'),
  destacado: z.boolean().default(false),
  vigenteHasta: ISO_DATE.or(z.literal('')).default(''),
  notasInternas: z.string().max(1000).optional().default(''),
});
export type Negocio = z.infer<typeof negocioSchema> & {
  impresiones?: number;
  clics?: number;
  createdAt?: string;
  updatedAt?: string;
  patrocinado?: boolean;
  piloto?: boolean;
};

export const planSchema = z.object({
  nombre: z.string().trim().min(2).max(60),
  precioUsd: z.number().min(0).max(10000),
  features: z.array(z.string().trim().min(2).max(120)).max(12).default([]),
  orden: z.number().int().min(0).max(999).default(0),
  activo: z.boolean().default(true),
});
export type Plan = z.infer<typeof planSchema> & { id?: string };
/** Hipótesis iniciales; solo se guardan tras confirmación en el panel. */
export const PLANES_PROPUESTOS: Plan[] = [
  { nombre: 'Básico', precioUsd: 10, features: ['Perfil revisado', 'Contactos medibles', 'Reporte mensual'], orden: 1, activo: true },
  { nombre: 'Destacado', precioUsd: 15, features: ['Perfil revisado', 'Posición destacada', 'Reporte mensual'], orden: 2, activo: true },
  { nombre: 'Premium', precioUsd: 25, features: ['Perfil destacado', 'Revisión mensual de información', 'Reporte y seguimiento comercial'], orden: 3, activo: true },
];

export const campanaSchema = z.object({
  negocioId: documentId,
  planId: documentId,
  precioAcordadoUsd: z.number().min(0).max(10000),
  fechaInicio: ISO_DATE,
  fechaVencimiento: ISO_DATE,
  estadoPago: z.enum(['pendiente', 'piloto', 'pagado', 'vencido', 'cancelado']).default('pendiente'),
  referenciaPago: z.string().trim().max(120).optional().default(''),
  pagoConfirmado: z.boolean().default(false),
  renovacionDe: documentId.or(z.literal('')).default(''),
  notas: z.string().max(500).optional().default(''),
}).superRefine((c, ctx) => {
  if (c.fechaVencimiento < c.fechaInicio) ctx.addIssue({ code: 'custom', path: ['fechaVencimiento'], message: 'Vigencia invertida' });
  const dias = 1 + (new Date(`${c.fechaVencimiento}T00:00:00Z`).getTime() - new Date(`${c.fechaInicio}T00:00:00Z`).getTime()) / 86_400_000;
  if (c.estadoPago === 'piloto') {
    // Piloto gratuito: sin pago, sin referencia, sin renovación, duración acotada.
    if (c.pagoConfirmado || c.referenciaPago.trim()) ctx.addIssue({ code: 'custom', path: ['estadoPago'], message: 'Un piloto no lleva pago ni referencia' });
    if (c.precioAcordadoUsd !== 0) ctx.addIssue({ code: 'custom', path: ['precioAcordadoUsd'], message: 'El piloto gratuito tiene importe cero' });
    if (c.renovacionDe) ctx.addIssue({ code: 'custom', path: ['renovacionDe'], message: 'Un piloto no puede renovar otra campaña' });
    if (dias > PILOTO_MAX_DIAS) ctx.addIssue({ code: 'custom', path: ['fechaVencimiento'], message: `Un piloto dura máximo ${PILOTO_MAX_DIAS} días` });
  }
  if (c.estadoPago !== 'pagado' && (c.pagoConfirmado || c.referenciaPago.trim())) {
    ctx.addIssue({ code: 'custom', path: ['estadoPago'], message: 'La evidencia de pago requiere estado pagado' });
  }
  if (c.estadoPago === 'pagado' && (!c.pagoConfirmado || !c.referenciaPago.trim() || c.precioAcordadoUsd <= 0)) {
    ctx.addIssue({ code: 'custom', path: ['pagoConfirmado'], message: 'Confirmá el pago recibido, su referencia y un importe mayor a cero' });
  }
});
export type Campana = z.infer<typeof campanaSchema>;

export const prospectoSchema = z.object({
  negocio: z.string().trim().min(2).max(120),
  contacto: z.string().trim().max(120).optional().default(''),
  canal: z.enum(['whatsapp', 'llamada', 'email', 'presencial', 'referido', 'otro']).default('whatsapp'),
  estado: z.enum(['nuevo', 'contactado', 'interesado', 'negociacion', 'ganado', 'perdido']).default('nuevo'),
  proximoSeguimiento: ISO_DATE.or(z.literal('')).default(''),
  notas: z.string().max(1000).optional().default(''),
});
export type Prospecto = z.infer<typeof prospectoSchema>;

/** Formulario público: alta o corrección. Honeypot `sitio` debe venir vacío. */
export const solicitudSchema = z.object({
  tipo: z.enum(['alta', 'correccion']),
  negocioId: documentId.or(z.literal('')).default(''),
  sitio: z.string().max(0).optional().default(''),
  nombre: z.string().trim().min(2).max(120),
  descripcion: z.string().trim().min(10).max(2000),
  categoria: z.enum(CATEGORIAS_NEGOCIO).optional(),
  departamento: z.enum(DEPARTAMENTOS_NI).optional(),
  telefono: PHONE.optional().or(z.literal('')),
  whatsapp: WHATSAPP.optional().or(z.literal('')),
  correccion: z.string().trim().max(1000).optional().default(''),
  consentimiento: z.literal(true),
}).superRefine((s, ctx) => {
  if (s.tipo === 'correccion' && (!s.negocioId || !s.correccion.trim())) ctx.addIssue({ code: 'custom', path: ['correccion'], message: 'Indicá el perfil y la corrección' });
});
export type SolicitudInput = z.infer<typeof solicitudSchema>;

export const eventoMetricaSchema = z.object({
  negocioId: documentId,
  tipo: z.enum(['vista', 'whatsapp', 'telefono', 'web']),
  slug: z.string().trim().max(200).optional(),
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]{8,100}$/),
}).strict();

export function slugifyNegocio(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'negocio';
}

export function waLink(whatsapp: string, mensaje = ''): string {
  const digits = whatsapp.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export function negocioDailyId(negocioId: string, at: Date = new Date()): string {
  return `${negocioId}_${at.toISOString().slice(0, 10)}`;
}

/** Vista pública: nunca expone notas internas ni datos de contacto del formulario. */
export function toPublicNegocio(id: string, n: Negocio) {
  return {
    id,
    nombre: n.nombre,
    slug: n.slug,
    descripcion: n.descripcion,
    categoria: n.categoria,
    departamento: n.departamento,
    municipio: n.municipio || '',
    direccion: n.direccion || '',
    telefono: n.telefono || '',
    whatsapp: n.whatsapp || '',
    email: n.email || '',
    web: n.web || '',
    fotos: n.fotos || [],
    horario: n.horario || '',
    plan: n.plan,
    destacado: n.destacado === true,
    patrocinado: n.patrocinado === true,
    piloto: n.piloto === true,
  };
}
export type PublicNegocio = ReturnType<typeof toPublicNegocio>;

/** Vigencia de publicación: fecha-corta cubre el día completo (UTC). */
export function isNegocioVigente(vigenteHasta: string | undefined | null, now: Date = new Date()): boolean {
  if (!vigenteHasta) return true;
  const fin = new Date(/T/.test(vigenteHasta) ? vigenteHasta : `${vigenteHasta}T23:59:59.999Z`);
  return !Number.isNaN(fin.getTime()) && now <= fin;
}

/** Un perfil solo es público si está aprobado y su vigencia no expiró. */
export function isNegocioPublicable(n: Pick<Negocio, 'estado' | 'vigenteHasta'>, now: Date = new Date()): boolean {
  return n.estado === 'aprobado' && isNegocioVigente(n.vigenteHasta, now);
}

export function diasParaVencer(fecha: string, now: Date = new Date()): number {
  const fin = new Date(/T/.test(fecha) ? fecha : `${fecha}T23:59:59.999Z`);
  if (Number.isNaN(fin.getTime())) return 0;
  return Math.ceil((fin.getTime() - now.getTime()) / 86_400_000);
}

export function ctrPct(impresiones: number, clics: number): number {
  if (!impresiones || impresiones <= 0) return 0;
  return Math.round((clics / impresiones) * 10000) / 100;
}

export function campanaVigente(c: Record<string, unknown>, now = new Date()): boolean {
  const day = now.toISOString().slice(0, 10);
  const activa = c.estadoPago === 'piloto'
    || (c.estadoPago === 'pagado' && c.pagoConfirmado === true && !!c.verificadoAt && !!c.referenciaPago);
  return activa && String(c.fechaInicio) <= day && String(c.fechaVencimiento) >= day;
}
