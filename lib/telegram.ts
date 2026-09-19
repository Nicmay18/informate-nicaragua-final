/**
 * Configuración de Telegram, normalizada para Vercel.
 *
 * Orden de resolución:
 * 1. Variables de entorno (varios nombres compatibles) — fuente controlada por el operador
 * 2. Firestore config.collection('config').doc('admin').telegram.{token,chatId}
 */
import type { Firestore } from 'firebase-admin/firestore';

const TOKEN_KEYS = ['TG_TOKEN', 'tg_token', 'TELEGRAM_TOKEN'];
const CHAT_ID_KEYS = ['TG_CHAT_ID', 'tg_chat_id', 'TELEGRAM_CHAT_ID'];

function getEnvVar(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

export interface TelegramConfig {
  token: string;
  chatId: string;
}

export async function getTelegramConfig(db?: Firestore): Promise<TelegramConfig> {
  const envToken = getEnvVar(TOKEN_KEYS);
  const envChatId = getEnvVar(CHAT_ID_KEYS);
  if (envToken && envChatId) {
    return { token: envToken, chatId: envChatId };
  }

  if (db) {
    try {
      const snap = await db.collection('config').doc('admin').get();
      const data = snap.data() || {};
      const token = data.telegram?.token;
      const chatId = data.telegram?.chatId;
      if (token && chatId) {
        return { token, chatId };
      }
    } catch {
      // Fallback a env parcial
    }
  }

  return { token: envToken || '', chatId: envChatId || '' };
}
