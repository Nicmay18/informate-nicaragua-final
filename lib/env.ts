/**
 * Environment Variables Validation
 * Validación centralizada de todas las variables de entorno en startup
 * Previene errores runtime y proporciona diagnostico claro
 */

import { z } from 'zod';
import { logger } from './logger';

// ─── SCHEMAS DE VALIDACIÓN ──────────────────────────────────────

const FirebaseSchema = z.object({
  // Firestore Admin SDK (backend)
  FIREBASE_PROJECT_ID: z.string().min(1, 'Missing FIREBASE_PROJECT_ID'),
  FIREBASE_CLIENT_EMAIL: z.string().email('Invalid FIREBASE_CLIENT_EMAIL'),
  FIREBASE_PRIVATE_KEY: z.string().min(100, 'FIREBASE_PRIVATE_KEY too short'),
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().optional(),

  // Firestore Client SDK (frontend) — opcional pero recomendado
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

const ThirdPartySchema = z.object({
  // Google APIs
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),
  GOOGLE_ADSENSE_CLIENT_ID: z.string().optional(),

  // APIs generales
  ADMIN_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),

  // Posibles APIs futuras
  STRIPE_SECRET_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

const NextjsSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const FullSchema = z.object({
  ...FirebaseSchema.shape,
  ...ThirdPartySchema.shape,
  ...NextjsSchema.shape,
});

type EnvVars = z.infer<typeof FullSchema>;

// ─── VALIDACIÓN EN RUNTIME ──────────────────────────────────────

let _validated: EnvVars | null = null;
let _validationError: string | null = null;

/**
 * Valida todas las env vars en startup
 * Llama automáticamente en lib/firebase-admin.ts
 */
export function validateEnv(): { success: boolean; error?: string } {
  if (_validated) return { success: true };
  if (_validationError) return { success: false, error: _validationError };

  try {
    const result = FullSchema.parse(process.env);
    _validated = result;
    logger.debug('[env] All environment variables validated');
    return { success: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors
        .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
        .join('\n');
      _validationError = `Environment validation failed:\n${errors}`;
    } else {
      _validationError = `Unknown validation error: ${String(err)}`;
    }
    logger.error(`[env] ${_validationError}`);
    return { success: false, error: _validationError };
  }
}

/**
 * Obtiene variable validada (con fallback seguro)
 */
export function getEnv<K extends keyof EnvVars>(key: K): EnvVars[K] | undefined {
  if (!_validated) {
    const validation = validateEnv();
    if (!validation.success) {
      throw new Error(`Cannot get env var "${String(key)}": validation failed`);
    }
  }
  return _validated?.[key];
}

/**
 * Obtiene variable validada o throws
 */
export function requireEnv<K extends keyof EnvVars>(key: K): EnvVars[K] {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Required environment variable not found: ${String(key)}`);
  }
  return value;
}

export type { EnvVars };
