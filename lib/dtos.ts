import { z } from 'zod';

export const SLUG_MAX_LEN = 120;
export const TITULO_MIN_LEN = 10;
export const TITULO_MAX_LEN = 120;

export const slugSchema = z
  .string()
  .min(1)
  .max(SLUG_MAX_LEN)
  .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones');

export const CorregirTituloSchema = z.object({
  id: z.string().min(1, 'ID requerido'),
  titulo: z.string().min(TITULO_MIN_LEN).max(TITULO_MAX_LEN),
  slug: slugSchema.optional(),
});

export const CorregirTitulosMasivoSchema = z.object({
  preview: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});
