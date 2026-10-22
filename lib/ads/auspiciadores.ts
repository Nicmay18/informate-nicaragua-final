import { z } from 'zod';

/**
 * Auspiciadores — publicidad directa vendida por el propietario.
 * Colección Firestore: `auspiciadores` (1 doc por cliente).
 * Agregados diarios: `ads_daily/{sponsorId}_{YYYY-MM-DD}`.
 */

export const AUSPICIADORES_COLLECTION = 'auspiciadores';
export const ADS_DAILY_COLLECTION = 'ads_daily';

export type AuspiciadorPosicion = 'articulo' | 'portada' | 'ambos';

export interface Auspiciador {
  nombre: string;
  logoUrl: string;
  bannerUrl?: string;
  url: string;
  posicion: AuspiciadorPosicion;
  activo: boolean;
  fechaInicio: string; // ISO date (YYYY-MM-DD) u ISO datetime
  fechaVencimiento: string; // ISO date u ISO datetime
  notas?: string;
  impresiones: number;
  clics: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AuspiciadorEstado = 'activo' | 'programado' | 'vencido' | 'inactivo';

const ISO_OR_DATE = /^\d{4}-\d{2}-\d{2}(T.*)?$/;
// z.url() acepta cualquier esquema sintáctico (javascript:, data:) — inyectable
// en <a href>/<img src>. Solo http(s) es destino legítimo de un auspiciador.
const SAFE_URL = z
  .string()
  .trim()
  .url()
  .max(1200)
  .refine((u) => /^https?:\/\//i.test(u), 'Solo URLs http(s)');

export const auspiciadorSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  logoUrl: SAFE_URL,
  bannerUrl: SAFE_URL.optional().or(z.literal('')),
  url: SAFE_URL,
  posicion: z.enum(['articulo', 'portada', 'ambos']).default('articulo'),
  activo: z.boolean().default(false),
  fechaInicio: z.string().regex(ISO_OR_DATE, 'Formato YYYY-MM-DD').max(40),
  fechaVencimiento: z.string().regex(ISO_OR_DATE, 'Formato YYYY-MM-DD').max(40),
  notas: z.string().max(500).optional().default(''),
});
export type AuspiciadorInput = z.infer<typeof auspiciadorSchema>;

export function estadoAuspiciador(a: Pick<Auspiciador, 'activo' | 'fechaInicio' | 'fechaVencimiento'>, now: Date = new Date()): AuspiciadorEstado {
  if (!a.activo) return 'inactivo';
  const ini = new Date(a.fechaInicio);
  const fin = new Date(a.fechaVencimiento);
  if (Number.isNaN(ini.getTime()) || Number.isNaN(fin.getTime())) return 'inactivo';
  if (now < ini) return 'programado';
  // El vencimiento de fecha-corta cubre el día completo, no el instante 00:00.
  const finEfectivo = /T/.test(a.fechaVencimiento) ? fin : new Date(`${a.fechaVencimiento}T23:59:59.999Z`);
  if (now > finEfectivo) return 'vencido';
  return 'activo';
}

export function isAuspiciadorPublicable(
  a: Pick<Auspiciador, 'activo' | 'fechaInicio' | 'fechaVencimiento' | 'nombre' | 'logoUrl' | 'url'>,
  now: Date = new Date(),
): boolean {
  return estadoAuspiciador(a, now) === 'activo' && !!a.nombre?.trim() && !!a.logoUrl && !!a.url;
}

/**
 * Selección determinista: vigentes para la posición, rotación por día del año
 * (reparte impresiones entre varios auspiciadores sin estado en servidor).
 */
export function seleccionarAuspiciador<T extends Pick<Auspiciador, 'activo' | 'fechaInicio' | 'fechaVencimiento' | 'nombre' | 'logoUrl' | 'url' | 'posicion'>>(
  lista: T[],
  posicion: Exclude<AuspiciadorPosicion, 'ambos'>,
  now: Date = new Date(),
): T | null {
  const vigentes = lista.filter(
    (a) => (a.posicion === posicion || a.posicion === 'ambos') && isAuspiciadorPublicable(a, now),
  );
  if (vigentes.length === 0) return null;
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  return vigentes[dayIndex % vigentes.length];
}

export function ctr(impresiones: number, clics: number): number {
  if (!impresiones || impresiones <= 0) return 0;
  return Math.round((clics / impresiones) * 10000) / 100; // %, 2 decimales
}

/** Clave del doc agregado diario: `{sponsorId}_{YYYY-MM-DD}` (UTC). */
export function adsDailyId(sponsorId: string, at: Date = new Date()): string {
  return `${sponsorId}_${at.toISOString().slice(0, 10)}`;
}

export interface AuspiciadorPublico {
  id: string;
  nombre: string;
  logoUrl: string;
  bannerUrl?: string;
  url: string;
}

export function toPublicAuspiciador(id: string, a: Auspiciador): AuspiciadorPublico {
  return { id, nombre: a.nombre, logoUrl: a.logoUrl, bannerUrl: a.bannerUrl || undefined, url: a.url };
}

/** Días hasta el vencimiento (negativo si ya venció). */
export function diasParaVencer(fechaVencimiento: string, now: Date = new Date()): number {
  const fin = new Date(/T/.test(fechaVencimiento) ? fechaVencimiento : `${fechaVencimiento}T23:59:59.999Z`);
  if (Number.isNaN(fin.getTime())) return 0;
  return Math.ceil((fin.getTime() - now.getTime()) / 86_400_000);
}
