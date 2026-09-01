/**
 * Credenciales de cuenta de servicio para APIs de Google (GSC, GA4).
 *
 * Soporta dos fuentes, en este orden:
 * 1. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (variables separadas)
 * 2. FIREBASE_SERVICE_ACCOUNT_BASE64 (JSON completo en base64)
 *
 * En producción de Vercel solo existe la variante base64, por lo que los
 * collectors deben resolver credenciales por esta vía y no leer el entorno
 * directamente.
 */

export interface GoogleServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
  projectId: string;
}

export function getGoogleServiceAccountCredentials(): GoogleServiceAccountCredentials | null {
  const projectId = process.env.FIREBASE_PROJECT_ID || '';

  // 1. Full service-account JSON (preferred: same source lib/firebase-admin.ts uses)
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64 && base64.trim().length > 10) {
    try {
      const sa = JSON.parse(Buffer.from(base64, 'base64').toString('utf8')) as {
        client_email?: string;
        private_key?: string;
        project_id?: string;
      };

      if (sa.client_email && sa.private_key) {
        return {
          clientEmail: sa.client_email,
          privateKey: sa.private_key
            .replace(/\\n/g, '\n')
            .replace(/\r/g, '')
            .trim(),
          projectId: sa.project_id || projectId,
        };
      }
    } catch {
      // fall through to triple
    }
  }

  // 2. Triple fallback
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || '';

  if (clientEmail && privateKeyRaw) {
    const privateKey = privateKeyRaw
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\r/g, '')
      .trim();

    // Reject clearly incomplete keys without silently using them
    if (privateKey.includes('-----BEGIN') && privateKey.includes('-----END')) {
      return {
        clientEmail,
        privateKey,
        projectId,
      };
    }
  }

  return null;
}
